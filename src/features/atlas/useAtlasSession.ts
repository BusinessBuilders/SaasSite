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
import type { AtlasAgentState } from './messages';
import { ATLAS_CAPTION_TOPIC, ATLAS_DATA_TOPIC, parseWorkerMessage } from './messages';

type Status = 'idle' | 'requesting' | 'connecting' | 'waiting_agent' | 'live' | 'ended' | 'error';
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
const OFFLINE_MESSAGE = 'The voice demo is offline right now.';
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
  const roomRef = useRef<import('livekit-client').Room | null>(null);
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
      setStatus('requesting');
      meta.current = { persona, eventId: '' };
      if (!navigator.mediaDevices?.getUserMedia) {
        fail('no_media_devices', 'This browser cannot use the microphone here. Please call the live line instead.');
        return;
      }

      let res: Response;
      try {
        res = await fetch('/api/atlas/session', {
          method: 'POST',
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
        if (cancelled()) {
          return;
        }
        fail('session_request_failed', 'We could not start the session. Please call the live line instead.');
        return;
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

      // The SDK is a network fetch of its own: an offline visitor, a blocked
      // CDN or a stale service worker all land here, and none of them should
      // look like a dead demo without an explanation. Constructing the Room is
      // inside the same guard because livekit-client pulls in webrtc-adapter
      // and can throw on a browser it cannot drive — same outcome, same
      // message, and either way nothing has been connected yet.
      let lk: typeof import('livekit-client');
      let room: import('livekit-client').Room;
      try {
        lk = await import('livekit-client');
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
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (e) {
        if (cancelled()) {
          await dropIfOrphaned();
          return;
        }
        fail(
          'connect_failed',
          (e as Error).name === 'NotAllowedError'
            ? 'Microphone access was blocked. Allow the microphone and try again, or call the live line.'
            : 'We could not connect the call. Please call the live line instead.',
        );
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
        fail('no_agent', 'Atlas is on another call right now. Please call the live line or try again in a minute.');
        await teardown('no_agent');
        return;
      }
      startedAt.current = Date.now();
      setStatus('live');
      trackAtlas('atlas_call_start', { persona }, { eventId: session.eventId });
    } finally {
      starting.current = false;
      if (abortRef.current === ac) {
        abortRef.current = null;
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
    setStatus('ended');
    // A cancelled dial never reached 'live', so startedAt is unset and the
    // session would otherwise leave no trace at all. The visitor did end it
    // deliberately, so it is reported — with a duration of 0.
    await teardown('visitor_ended', { report: wasDialling });
  }, [teardown]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) {
      return;
    }
    const next = !muted;
    setMuted(next);
    void room.localParticipant.setMicrophoneEnabled(!next);
  }, [muted]);

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
    start,
    end,
    toggleMute,
    audioElRef,
  };
};
