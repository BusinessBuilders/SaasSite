'use client';
// src/features/atlas/useAtlasSession.ts — the browser side of one session.
// start(): POST /api/atlas/session -> connect the LiveKit room -> wait up to
// 8 s for the agent participant (else the honest "on another call" error) ->
// subscribe to its audio track, meter it for the orb, read captions from the
// standard lk.transcription text stream and state/lead/booked/ended/error from
// the "atlas" data topic. Nothing is loaded from LiveKit until the tap.
//
// start() is cancellable. The panel shows a Cancel button while Atlas is being
// dialled, and every await below re-checks the AbortController that end() (or
// unmounting the page) trips, so a cancelled dial returns quietly instead of
// surfacing its 8-second "on another call" timeout seconds after the visitor
// already gave up.
//
// Every other exit from this hook is loud: it sets a message the visitor reads
// and fires atlas_error to GA4. There is no path that leaves the UI looking
// connected while nothing is happening.
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import type { AtlasPersona } from '@/app/api/atlas/session/schema';

import { readMetaCookies, trackAtlas } from './analytics';
import { MIC_DENIED_MESSAGE, NO_AGENT_MESSAGE, NO_MICROPHONE_MESSAGE, OFFLINE_MESSAGE } from './content';
import type { AtlasAgentState } from './messages';
import { ATLAS_CAPTION_TOPIC, ATLAS_DATA_TOPIC, parseWorkerMessage } from './messages';

type Status = 'idle' | 'requesting_mic' | 'requesting' | 'connecting' | 'waiting_agent' | 'live' | 'ended' | 'error';
export type Caption = { id: string; role: 'agent' | 'visitor'; text: string; final: boolean };

// What /api/atlas/session returns on success. `sessionId` is the LiveKit room
// name the route mints as `web-<uuid>`; anything else means we are talking to
// something that is not our own route and must not be handed a microphone.
const sessionGrantSchema = z.object({
  url: z.string().url(),
  token: z.string().min(1),
  sessionId: z.string().startsWith('web-'),
  eventId: z.string().min(1),
});

// The route's error body. Both fields are optional so a 500 from the edge,
// which carries neither, still parses and falls back to the HTTP status.
const sessionErrorSchema = z.object({
  reason: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});

const AGENT_WAIT_MS = 8000;
// A long call must not grow the caption list without bound; the page shows a
// scrolling transcript, and 200 segments is far more than fits on screen.
const CAPTION_LIMIT = 200;
// A deadline for the token request. Without one a proxy that accepts the
// connection and then says nothing leaves the panel on "Connecting…" for ever:
// fetch has no timeout of its own, and the visitor's only clue is that nothing
// happens. 15 s is far longer than the route's own work (one JWT signature) and
// short enough that a visitor has not yet decided the page is broken.
const SESSION_REQUEST_TIMEOUT_MS = 15_000;
const UNREADABLE_MESSAGE = 'The voice demo sent a reply we could not read. Please call the live line instead.';

// Replace a caption in place when we have seen its id before, append when it
// is new. Rebuilding the array with the touched caption moved to the end (the
// obvious filter-and-append) makes concurrent visitor and agent streams swap
// places on every chunk, which reads as flicker.
const upsertCaption = (prev: Caption[], next: Caption): Caption[] => {
  const at = prev.findIndex(c => c.id === next.id);
  if (at === -1) {
    return [...prev, next].slice(-CAPTION_LIMIT);
  }
  const out = prev.slice();
  out[at] = next;
  return out;
};

export const useAtlasSession = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [agentState, setAgentState] = useState<AtlasAgentState>('idle');
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<{ reason: string; message: string } | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [bookedSpoken, setBookedSpoken] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  // True when the visitor tapped Cancel before Atlas ever picked up. The panel
  // reads it to keep a 0:00 clock off a call that never ran — a stopwatch
  // reading zero next to "Ended" says a call happened and lasted no time,
  // which is not what occurred.
  const [cancelled, setCancelled] = useState(false);
  const roomRef = useRef<import('livekit-client').Room | null>(null);
  // The microphone, acquired before anything is spent and held until teardown.
  // Without a handle on it a cancelled dial leaves the browser's recording
  // indicator on with nothing listening.
  const micTrackRef = useRef<import('livekit-client').LocalAudioTrack | null>(null);
  // The raw stream behind that track. Kept as well, because the stream exists
  // before the SDK is even loaded — a cancel or a failed import in between has
  // to be able to release the device with no LiveKit object to do it through.
  const micStreamRef = useRef<MediaStream | null>(null);
  // Identifies each start(). A dial that is still blocked on an unanswered
  // microphone prompt must not, when it finally unblocks, clear the `starting`
  // flag belonging to the NEXT dial the visitor has already begun.
  const startSeq = useRef(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<{ ctx: AudioContext; raf: number } | null>(null);
  const tearingDown = useRef(false);
  // True from the first line of start() until it returns, so a second tap is
  // refused during the dial and not only once a room object exists.
  const starting = useRef(false);
  // Trips the in-flight start(). Non-null exactly while a dial is under way.
  const abortRef = useRef<AbortController | null>(null);
  const startedAt = useRef<number>(0);
  const meta = useRef<{ persona: string; eventId: string }>({ persona: '', eventId: '' });

  const fail = useCallback((reason: string, message: string) => {
    setError({ reason, message });
    setStatus('error');
    trackAtlas('atlas_error', { reason, persona: meta.current.persona });
  }, []);

  // Stop the orb's audio meter and release its AudioContext. Called both on
  // teardown and before building a replacement meter, so a resubscribe cannot
  // leave two rAF loops racing each other into setLevel.
  const stopMeter = useCallback(async () => {
    const current = analyserRef.current;
    analyserRef.current = null;
    if (!current) {
      return;
    }
    cancelAnimationFrame(current.raf);
    // Closing an already-closed AudioContext throws; the meter is gone either
    // way, so this one rejection is not worth failing the hang-up over.
    await current.ctx.close().catch(() => undefined);
  }, []);

  const teardown = useCallback(async (reason: string, opts: { report?: boolean } = {}) => {
    // Re-entrancy guard. room.disconnect() below fires RoomEvent.Disconnected,
    // whose handler calls teardown('disconnected') again; without this the
    // re-entrant call would consume startedAt and fire atlas_call_end with
    // "disconnected" instead of the real reason the visitor's hang-up had.
    if (tearingDown.current) {
      return;
    }
    tearingDown.current = true;
    try {
      await stopMeter();
      setLevel(0);
      setAgentState('idle');
      // The microphone is ours from before the room existed, so releasing it is
      // ours too — room.disconnect() cannot stop a track that was never
      // published. Leaving it running keeps the browser's recording indicator
      // lit over a call that is already over.
      const mic = micTrackRef.current;
      const micStream = micStreamRef.current;
      micTrackRef.current = null;
      micStreamRef.current = null;
      try {
        mic?.stop();
        // Belt and braces: stopping an already-stopped MediaStreamTrack is a
        // no-op, and this covers the window where the stream exists but the
        // LiveKit track wrapping it does not.
        micStream?.getTracks().forEach(t => t.stop());
      } catch (e) {
        console.error(`[atlas] releasing the microphone failed: ${(e as Error).message}`);
      }
      const room = roomRef.current;
      roomRef.current = null;
      if (room) {
        // Room.unregisterTextStreamHandler(topic: string): void is a Map.delete
        // and never throws, even for a topic that was never registered. We build
        // a fresh Room per call so the registration would die with it anyway,
        // but registerTextStreamHandler DOES throw HandlerAlreadyRegistered on a
        // duplicate topic, so clearing it keeps that impossible if a Room is
        // ever reused.
        room.unregisterTextStreamHandler(ATLAS_CAPTION_TOPIC);
        try {
          await room.disconnect();
        } catch (e) {
          // A failed disconnect must not swallow the end-of-call event below —
          // from the visitor's side the call is over either way.
          console.error(`[atlas] room.disconnect() failed: ${(e as Error).message}`);
        }
      }
      if (startedAt.current || opts.report) {
        trackAtlas('atlas_call_end', {
          reason,
          persona: meta.current.persona,
          // 0 when the visitor cancelled before Atlas ever picked up: the
          // session is reported, but no call time is invented for it.
          duration_s: startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0,
        });
        startedAt.current = 0;
      }
    } finally {
      tearingDown.current = false;
    }
  }, [stopMeter]);

  useEffect(() => {
    if (status !== 'live') {
      return undefined;
    }
    const t = setInterval(() => setElapsedSec(Math.round((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Leaving the page must hang the call up. Without this the room — and the
  // microphone with it — stays live after the visitor navigates away.
  useEffect(() => () => {
    abortRef.current?.abort();
    void teardown('page_left');
  }, [teardown]);

  const start = useCallback(async (persona: AtlasPersona) => {
    // One session per page at a time. A second tap while a dial is under way
    // or a room is up would orphan the first one and leave its microphone
    // open, so the tap is ignored rather than replacing a live call.
    if (starting.current || roomRef.current) {
      console.warn('[atlas] start() ignored: a session is already under way');
      return;
    }
    starting.current = true;
    const startId = startSeq.current + 1;
    startSeq.current = startId;
    const ac = new AbortController();
    abortRef.current = ac;
    // Re-checked after every await below. When it is true the visitor has
    // already cancelled: return quietly, because whoever aborted us tore the
    // session down synchronously before this continuation could run.
    const cancelled = () => ac.signal.aborted;

    try {
      setError(null);
      setCaptions([]);
      setLeadCaptured(false);
      setBookedSpoken(null);
      setElapsedSec(0);
      setMuted(false);
      setCancelled(false);
      setStatus('requesting_mic');
      meta.current = { persona, eventId: '' };
      if (!navigator.mediaDevices?.getUserMedia) {
        fail('no_media_devices', 'This browser cannot use the microphone here. Please call the live line instead.');
        return;
      }

      // ---------------------------------------------------------------------
      // THE MICROPHONE COMES FIRST. Nothing is spent until the visitor has said
      // yes.
      //
      // This used to run last, inside room.connect(): the session token was
      // minted, a LiveKit room was created, a worker slot was claimed and Atlas
      // delivered its whole greeting into an empty room while the browser's
      // permission prompt still sat there unanswered. The visitor read
      // "Connecting…", heard nothing, and the demo had already spent the one
      // thing it is rate-limited on. Observed in a real browser on 2026-09-14
      // with the permission left at `prompt` for 100 seconds.
      //
      // It also has to happen inside the click's user gesture, which is why the
      // SDK is loaded here rather than after the token request: browsers grant
      // getUserMedia on the strength of the gesture that led to it.
      // ---------------------------------------------------------------------
      // getUserMedia goes FIRST, in the same task as the click. Loading the SDK
      // before it costs 109 ms warm and a chunk download cold, and Safari can
      // drop the transient user activation across that gap — which would turn
      // "Allow?" into a silent refusal on the browser most likely to be held in
      // a hand. Nothing may come between the tap and the ask.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        if (cancelled()) {
          return;
        }
        const name = (e as Error).name;
        console.error(`[atlas] microphone unavailable (${name}): ${(e as Error).message}`);
        // "Allow the microphone and try again" is useless advice to someone
        // whose laptop has no microphone in it. The browser tells us which it
        // is; the two sentences send the visitor to different places.
        if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotSupportedError') {
          fail('no_microphone', NO_MICROPHONE_MESSAGE);
        } else {
          fail('mic_denied', MIC_DENIED_MESSAGE);
        }
        return;
      }

      // Cancelled WHILE the prompt was open — the permission may have been
      // granted a minute later. Release the device and stop here: nothing
      // downstream of this point has run at all.
      const stopStream = () => stream.getTracks().forEach(t => t.stop());

      if (cancelled()) {
        stopStream();
        return;
      }
      micStreamRef.current = stream;

      let lk: typeof import('livekit-client');
      try {
        lk = await import('livekit-client');
      } catch (e) {
        if (cancelled()) {
          stopStream();
          return;
        }
        console.error(`[atlas] livekit-client failed to load: ${(e as Error).message}`);
        fail('sdk_load_failed', 'The voice demo could not load in this browser. Please refresh, or call the live line.');
        await teardown('sdk_load_failed');
        return;
      }
      if (cancelled()) {
        stopStream();
        return;
      }

      const [audioTrack] = stream.getAudioTracks();

      if (!audioTrack) {
        // getUserMedia resolved with no audio track. Nothing to publish, and
        // silence would look exactly like a working call.
        console.error('[atlas] getUserMedia resolved without an audio track');
        fail('no_microphone', NO_MICROPHONE_MESSAGE);
        await teardown('no_microphone');
        return;
      }

      // Wrap the stream we already hold rather than asking the SDK to acquire
      // its own. `userProvidedTrack: false` hands it to the SDK to manage, so
      // stop() really releases the device; the source has to be set by hand
      // because that is what createLocalAudioTrack would have done for us, and
      // setMicrophoneEnabled() finds the publication to mute by its source.
      const micTrack = new lk.LocalAudioTrack(audioTrack, undefined, false);
      micTrack.source = lk.Track.Source.Microphone;
      micTrackRef.current = micTrack;

      setStatus('requesting');

      // A deadline for the token request. It trips the SAME AbortController the
      // Cancel button uses, rather than composing one with AbortSignal.any():
      // that static is Chrome 116 / Firefox 124 / Safari 17.4 and newer, and a
      // visitor on an older browser would get a TypeError instead of a voice
      // demo. One controller works everywhere a WebRTC call can run. `timedOut`
      // is what tells a deadline apart from the visitor's own Cancel afterwards
      // — both arrive as the same rejected fetch, and they are different
      // sentences. Cleared the moment the request settles, or a call that
      // connected in two seconds would be aborted thirteen seconds later.
      let timedOut = false;
      const deadline = setTimeout(() => {
        timedOut = true;
        ac.abort();
      }, SESSION_REQUEST_TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch('/api/atlas/session', {
          method: 'POST',
          // Cancel must stop the request itself, not just ignore its answer:
          // without the signal the token is minted, the room is created and a
          // LiveKit session is billed for a visitor who already walked away.
          // The deadline above trips this same signal.
          signal: ac.signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            persona,
            consent: true,
            page: window.location.href,
            utm: Object.fromEntries(
              [...new URLSearchParams(window.location.search)]
                .filter(([k]) => k.startsWith('utm_'))
                .map(([k, v]) => [k.slice(4), v]),
            ),
            ...readMetaCookies(),
          }),
        });
      } catch {
        // Checked BEFORE cancelled(): the deadline aborts the same controller,
        // so by here both look identical except for this flag.
        if (timedOut) {
          fail(
            'session_timeout',
            'Starting the call is taking too long. Please try again, or call the live line.',
          );
          return;
        }
        if (cancelled()) {
          return;
        }
        fail('session_request_failed', 'We could not start the session. Please call the live line instead.');
        return;
      } finally {
        clearTimeout(deadline);
      }
      if (cancelled()) {
        return;
      }

      let body: unknown;
      try {
        body = await res.json();
      } catch {
        if (cancelled()) {
          return;
        }
        // A 200 that is not JSON is our own route misbehaving, which is a
        // different fault from a gateway error page on a 5xx.
        if (res.ok) {
          fail('bad_session_response', UNREADABLE_MESSAGE);
        } else {
          fail(`http_${res.status}`, OFFLINE_MESSAGE);
        }
        return;
      }
      if (cancelled()) {
        return;
      }
      if (!res.ok) {
        const parsed = sessionErrorSchema.safeParse(body);
        fail(
          (parsed.success ? parsed.data.reason : undefined) ?? `http_${res.status}`,
          (parsed.success ? parsed.data.error : undefined) ?? OFFLINE_MESSAGE,
        );
        return;
      }
      const grant = sessionGrantSchema.safeParse(body);
      if (!grant.success) {
        console.error('[atlas] /api/atlas/session returned a body we could not use:', grant.error.issues);
        fail('bad_session_response', UNREADABLE_MESSAGE);
        return;
      }
      const session = grant.data;

      meta.current.eventId = session.eventId;
      setStatus('connecting');

      // The SDK itself loaded before the microphone prompt; this is only the
      // Room object, which livekit-client can still refuse to build on a
      // browser it cannot drive (it pulls in webrtc-adapter). Same outcome,
      // same message, and nothing has been connected yet.
      let room: import('livekit-client').Room;
      try {
        room = new lk.Room({ adaptiveStream: false, dynacast: false });
      } catch (e) {
        if (cancelled()) {
          return;
        }
        console.error(`[atlas] livekit-client failed to load: ${(e as Error).message}`);
        fail('sdk_load_failed', 'The voice demo could not load in this browser. Please refresh, or call the live line.');
        await teardown('sdk_load_failed');
        return;
      }
      if (cancelled()) {
        // A freshly constructed Room has no socket, no tracks and no handlers,
        // so dropping the reference is the whole of the cleanup.
        return;
      }
      roomRef.current = room;

      // Only reachable if connect() resolved anyway after the canceller had
      // already disconnected this room — otherwise roomRef is no longer ours.
      const dropIfOrphaned = async () => {
        if (roomRef.current !== room) {
          return;
        }
        roomRef.current = null;
        try {
          await room.disconnect();
        } catch (e) {
          console.error(`[atlas] orphaned room disconnect failed: ${(e as Error).message}`);
        }
      };

      room.on(lk.RoomEvent.DataReceived, (payload, _p, _k, topic) => {
        if (topic !== ATLAS_DATA_TOPIC) {
          return;
        }
        const raw = new TextDecoder().decode(payload);
        const msg = parseWorkerMessage(raw);
        if (!msg) {
          // Never throw inside LiveKit's emitter, and never act on a message we
          // could not validate: a lead_captured without its event_id would fire
          // the Pixel Lead with no dedup id and Meta would count it twice.
          console.error(`[atlas] discarded unparseable worker message: ${raw.slice(0, 200)}`);
          trackAtlas('atlas_error', { reason: 'bad_worker_message', persona });
          return;
        }
        if (msg.type === 'state') {
          setAgentState(msg.state);
        } else if (msg.type === 'lead_captured') {
          setLeadCaptured(true);
          trackAtlas('generate_lead', { persona }, { eventId: msg.event_id });
        } else if (msg.type === 'booked') {
          setBookedSpoken(msg.spoken);
          trackAtlas('atlas_booked', { persona }, { eventId: meta.current.eventId });
        } else if (msg.type === 'ended') {
          setStatus('ended');
          void teardown(msg.reason);
        } else if (msg.type === 'error') {
          fail(msg.reason, 'Atlas hit a technical problem and had to stop. Please call the live line.');
          void teardown('error');
        }
      });

      // lk.transcription is LiveKit's own caption topic: the worker's STT and TTS
      // both publish into it, so the sender's identity is what tells the two
      // sides of the conversation apart.
      room.registerTextStreamHandler(ATLAS_CAPTION_TOPIC, async (reader, participantInfo) => {
        const role: Caption['role'] = participantInfo.identity.startsWith('visitor-') ? 'visitor' : 'agent';
        const id = reader.info.attributes?.['lk.segment_id'] ?? reader.info.id;
        let text = '';
        try {
          // Each chunk is a delta, not the sentence so far.
          for await (const chunk of reader) {
            text += chunk;
            if (text === '') {
              // An empty leading chunk is not speech. Rendering it would put an
              // empty bubble on screen that no later chunk ever finalises.
              continue;
            }
            setCaptions(prev => upsertCaption(prev, { id, role, text, final: false }));
          }
        } catch (e) {
          // A caption stream that dies mid-sentence must not surface as an
          // unhandled rejection inside LiveKit. Keep what we heard, close the
          // segment, and leave a trace — the call itself is still fine.
          console.error(`[atlas] caption stream ${id} ended early: ${(e as Error).message}`);
        }
        if (text === '') {
          return;
        }
        setCaptions(prev => upsertCaption(prev, { id, role, text, final: true }));
      });

      room.on(lk.RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== lk.Track.Kind.Audio) {
          return;
        }
        const audioEl = audioElRef.current;
        if (!audioEl) {
          // Atlas is talking into a page with nowhere to play it. Silently
          // returning would leave the visitor staring at a "live" call hearing
          // nothing, so this ends the call with something they can act on.
          console.error('[atlas] no audio element to attach the agent track to');
          fail('no_audio_sink', 'Atlas connected but this page could not play audio. Please refresh, or call the live line.');
          void teardown('no_audio_sink');
          return;
        }
        track.attach(audioEl);
        // A resubscribe (reconnect, or the agent republishing) lands here again;
        // drop the previous meter first or its rAF loop and AudioContext leak
        // and two loops fight over setLevel.
        void stopMeter();
        // A second tap off the same track drives the orb. The <audio> element is
        // what the visitor hears; this analyser only measures it.
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) {
            const d = (v - 128) / 128;
            sum += d * d;
          }
          setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
          analyserRef.current = { ctx, raf: requestAnimationFrame(tick) };
        };
        analyserRef.current = { ctx, raf: requestAnimationFrame(tick) };
      });

      room.on(lk.RoomEvent.Disconnected, () => {
        // A network drop or a server-side close arrives here and nowhere else.
        // Without the teardown the meter keeps running, the AudioContext is
        // never released, roomRef points at a dead room and atlas_call_end
        // never fires. The re-entrancy guard makes this a no-op when we are
        // already tearing down for a known reason.
        setStatus(prev => (prev === 'error' ? prev : 'ended'));
        void teardown('disconnected');
      });

      try {
        await room.connect(session.url, session.token);
        // publishTrack, NOT setMicrophoneEnabled(true): the microphone is
        // already open in our hand. Asking the SDK to enable one would acquire
        // a SECOND device track — and it is the call that used to block on the
        // permission prompt while a room stood connected and a worker talked to
        // nobody.
        await room.localParticipant.publishTrack(micTrack);
      } catch (e) {
        if (cancelled()) {
          await dropIfOrphaned();
          return;
        }
        console.error(`[atlas] could not join the room: ${(e as Error).message}`);
        fail('connect_failed', 'We could not connect the call. Please call the live line instead.');
        await teardown('connect_failed');
        return;
      }
      if (cancelled()) {
        await dropIfOrphaned();
        return;
      }

      setStatus('waiting_agent');
      const agentJoined = await new Promise<boolean>((resolve) => {
        if ([...room.remoteParticipants.values()].length > 0) {
          resolve(true);
          return;
        }
        const timer = setTimeout(() => resolve(false), AGENT_WAIT_MS);
        // Cancelling ends the wait immediately instead of leaving the visitor's
        // Ended panel to be overwritten by a timeout seconds later.
        const onAbort = () => {
          clearTimeout(timer);
          resolve(false);
        };
        ac.signal.addEventListener('abort', onAbort, { once: true });
        room.once(lk.RoomEvent.ParticipantConnected, () => {
          clearTimeout(timer);
          ac.signal.removeEventListener('abort', onAbort);
          resolve(true);
        });
      });
      if (cancelled()) {
        await dropIfOrphaned();
        return;
      }
      if (!agentJoined) {
        fail('no_agent', NO_AGENT_MESSAGE);
        await teardown('no_agent');
        return;
      }
      startedAt.current = Date.now();
      setStatus('live');
      trackAtlas('atlas_call_start', { persona }, { eventId: session.eventId });
    } catch (e) {
      // Nothing above is allowed to leave this hook silently. Both call sites
      // `void` start(), so a throw from a browser API this browser does not
      // have, from inside livekit-client, or from a bug of ours used to
      // disappear into an unhandled rejection and leave the panel on
      // "Connecting…" for ever — the one state this page must never reach.
      console.error(`[atlas] start() failed unexpectedly: ${(e as Error).message}`);
      if (!cancelled()) {
        fail(
          'unexpected',
          'Something went wrong starting the call. Please refresh the page, or call the live line.',
        );
        await teardown('unexpected');
      }
    } finally {
      // Only if this is still the dial in progress. A start that was cancelled
      // while blocked on a microphone prompt can unblock minutes later, long
      // after the visitor has started a second one — and clearing the flags
      // then would let a third tap run on top of the second.
      if (startSeq.current === startId) {
        starting.current = false;
        if (abortRef.current === ac) {
          abortRef.current = null;
        }
      }
    }
  }, [fail, stopMeter, teardown]);

  const end = useCallback(async () => {
    // Cancel any start() still in flight first, and synchronously: teardown
    // below must claim the re-entrancy guard before the cancelled start's
    // continuation runs, so this hang-up is the one that gets reported.
    const wasDialling = abortRef.current !== null;
    abortRef.current?.abort();
    abortRef.current = null;
    // Cleared HERE, not in the cancelled start's `finally`. An unanswered
    // microphone prompt leaves start() parked on a promise the browser may
    // never settle, so its finally may not run for minutes — and until it did,
    // `starting` stayed true, which made a second Start refuse and turned the
    // panel's own "Talk again" into a dead button. Observed in a real browser
    // on 2026-09-14: Cancel at 100 s, a refusal logged at 117 s.
    starting.current = false;
    setCancelled(wasDialling);
    setStatus('ended');
    // A cancelled dial never reached 'live', so startedAt is unset and the
    // session would otherwise leave no trace at all. The visitor did end it
    // deliberately, so it is reported — with a duration of 0, and under its own
    // reason: `visitor_cancelled` is "gave up while it was ringing", which is a
    // different thing to measure from `visitor_ended`, "hung up on a call that
    // was happening". Lumping them together hides how many people the dial
    // time loses.
    await teardown(wasDialling ? 'visitor_cancelled' : 'visitor_ended', { report: wasDialling });
  }, [teardown]);

  /**
   * Back to the picker. The panel replaces the persona picker and the Start
   * button for the whole life of a session, so without this there is no way
   * back to them short of reloading the page — a visitor who wanted to hear
   * Atlas answer for a different trade was stuck with the one they picked.
   *
   * It never refuses. An earlier version returned early when a dial or a room
   * was still up, and a later one turned that into a visible error — and both
   * were wrong for the same reason: a real session on 2026-09-14 reached that
   * branch after nothing worse than a Cancel during the microphone prompt,
   * because the parked start() still held `starting`. A visitor who cancels and
   * then asks for the picker must get the picker; being told "the last call has
   * not finished closing. Please refresh the page" is a worse answer than the
   * silent no-op it replaced.
   *
   * So anything still standing is taken down first — the in-flight dial is
   * aborted the way Cancel aborts it, the room is disconnected and the
   * microphone released — and then the page goes back to the picker. Loud in
   * the log when it had to do that, because it should not have to.
   */
  const reset = useCallback(async () => {
    if (starting.current || roomRef.current) {
      console.error('[atlas] reset(): a session was still under way — tearing it down first');
      abortRef.current?.abort();
      abortRef.current = null;
      starting.current = false;
      // AWAITED, not fired and forgotten: disconnecting the room emits
      // RoomEvent.Disconnected, whose handler sets 'ended'. Setting 'idle'
      // first would be overwritten a tick later and the visitor would be left
      // staring at an Ended panel they asked to leave.
      await teardown('reset_while_active');
    }
    setError(null);
    setCaptions([]);
    setLeadCaptured(false);
    setBookedSpoken(null);
    setElapsedSec(0);
    setMuted(false);
    setCancelled(false);
    setAgentState('idle');
    setLevel(0);
    setStatus('idle');
  }, [teardown]);

  /**
   * Mute is a promise to the visitor, not a button state.
   *
   * The optimistic flip stays — the button has to answer the tap immediately —
   * but the command is now awaited, and a rejection puts the label back to the
   * truth. That matters more here than almost anywhere else on the site: this
   * page tells the visitor their words are transcribed and kept, so a button
   * reading "Unmute" while the microphone is still publishing is the page
   * lying about the one thing it promised to be careful with.
   *
   * And because we could not prove the microphone stopped, the call is ended
   * as well: disconnecting the room is the only remaining way to make the
   * silence real. Same shape as every other unrecoverable failure in this hook
   * — a sentence the visitor reads, the live line beside it, and a torn-down
   * session — rather than a quiet console line nobody sees.
   */
  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }
    const next = !muted;
    setMuted(next);
    try {
      await room.localParticipant.setMicrophoneEnabled(!next);
    } catch (e) {
      setMuted(!next);
      console.error(`[atlas] setMicrophoneEnabled(${!next}) failed: ${(e as Error).message}`);
      fail(
        'mute_failed',
        next
          ? 'We could not mute your microphone, so the call was ended to be sure. Please call the live line.'
          : 'We lost control of your microphone, so the call was ended. Please refresh, or call the live line.',
      );
      await teardown('mute_failed');
    }
  }, [muted, fail, teardown]);

  return {
    status,
    agentState,
    captions,
    level,
    error,
    elapsedSec,
    leadCaptured,
    bookedSpoken,
    muted,
    cancelled,
    start,
    end,
    reset,
    toggleMute,
    audioElRef,
  };
};
