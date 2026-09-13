'use client';
// src/features/atlas/useAtlasSession.ts — the browser side of one session.
// start(): POST /api/atlas/session -> connect the LiveKit room -> wait up to
// 8 s for the agent participant (else the honest "on another call" error) ->
// subscribe to its audio track, meter it for the orb, read captions from the
// standard lk.transcription text stream and state/lead/booked/ended/error from
// the "atlas" data topic. Nothing is loaded from LiveKit until the tap.
import { useCallback, useEffect, useRef, useState } from 'react';

import type { AtlasPersona } from '@/app/api/atlas/session/schema';

import { readMetaCookies, trackAtlas } from './analytics';

type Status = 'idle' | 'requesting' | 'connecting' | 'waiting_agent' | 'live' | 'ended' | 'error';
type AgentState = 'listening' | 'thinking' | 'speaking' | 'idle';
export type Caption = { id: string; role: 'agent' | 'visitor'; text: string; final: boolean };

// What the worker publishes on the "atlas" data topic. Cross-repo contract:
// the Python side builds exactly these shapes.
type AtlasDataMessage
  = | { type: 'state'; state: AgentState }
  | { type: 'lead_captured'; event_id: string }
  | { type: 'booked'; when: string; spoken: string }
  | { type: 'ended'; reason: string }
  | { type: 'error'; reason: string };

type SessionGrant = { url: string; token: string; sessionId: string; eventId: string };

const AGENT_WAIT_MS = 8000;

export const useAtlasSession = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [agentState, setAgentState] = useState<AgentState>('idle');
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
  const startedAt = useRef<number>(0);
  const meta = useRef<{ persona: string; eventId: string }>({ persona: '', eventId: '' });

  const fail = useCallback((reason: string, message: string) => {
    setError({ reason, message });
    setStatus('error');
    trackAtlas('atlas_error', { reason, persona: meta.current.persona });
  }, []);

  const teardown = useCallback(async (reason: string) => {
    if (analyserRef.current) {
      cancelAnimationFrame(analyserRef.current.raf);
      // Closing an already-closed AudioContext throws; the call is over either
      // way, so this one rejection is not worth failing the hang-up over.
      await analyserRef.current.ctx.close().catch(() => undefined);
      analyserRef.current = null;
    }
    setLevel(0);
    setAgentState('idle');
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      await room.disconnect();
    }
    if (startedAt.current) {
      trackAtlas('atlas_call_end', {
        reason,
        persona: meta.current.persona,
        duration_s: Math.round((Date.now() - startedAt.current) / 1000),
      });
      startedAt.current = 0;
    }
  }, []);

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
    void teardown('page_left');
  }, [teardown]);

  const start = useCallback(async (persona: AtlasPersona) => {
    setError(null);
    setCaptions([]);
    setLeadCaptured(false);
    setBookedSpoken(null);
    setElapsedSec(0);
    setStatus('requesting');
    meta.current = { persona, eventId: '' };
    if (!navigator.mediaDevices?.getUserMedia) {
      fail('no_media_devices', 'This browser cannot use the microphone here. Please call the live line instead.');
      return;
    }
    let session: SessionGrant;
    try {
      const res = await fetch('/api/atlas/session', {
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
      const body = await res.json();
      if (!res.ok) {
        fail(body.reason ?? `http_${res.status}`, body.error ?? 'The voice demo is offline right now.');
        return;
      }
      session = body;
    } catch {
      fail('session_request_failed', 'We could not start the session. Please call the live line instead.');
      return;
    }
    meta.current.eventId = session.eventId;
    setStatus('connecting');
    const lk = await import('livekit-client');
    const room = new lk.Room({ adaptiveStream: false, dynacast: false });
    roomRef.current = room;
    room.on(lk.RoomEvent.DataReceived, (payload, _p, _k, topic) => {
      if (topic !== 'atlas') {
        return;
      }
      const msg = JSON.parse(new TextDecoder().decode(payload)) as AtlasDataMessage;
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
    room.registerTextStreamHandler('lk.transcription', async (reader, participantInfo) => {
      const role: Caption['role'] = participantInfo.identity.startsWith('visitor-') ? 'visitor' : 'agent';
      const id = reader.info.attributes?.['lk.segment_id'] ?? reader.info.id;
      let text = '';
      // Each chunk is a delta, not the sentence so far.
      for await (const chunk of reader) {
        text += chunk;
        setCaptions(prev => [...prev.filter(c => c.id !== id), { id, role, text, final: false }]);
      }
      setCaptions(prev => prev.map(c => (c.id === id ? { ...c, text, final: true } : c)));
    });
    room.on(lk.RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== lk.Track.Kind.Audio || !audioElRef.current) {
        return;
      }
      track.attach(audioElRef.current);
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
      setStatus(prev => (prev === 'error' ? prev : 'ended'));
    });
    try {
      await room.connect(session.url, session.token);
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (e) {
      fail(
        'connect_failed',
        (e as Error).name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow the microphone and try again, or call the live line.'
          : 'We could not connect the call. Please call the live line instead.',
      );
      await teardown('connect_failed');
      return;
    }
    setStatus('waiting_agent');
    const agentJoined = await new Promise<boolean>((resolve) => {
      if ([...room.remoteParticipants.values()].length > 0) {
        resolve(true);
        return;
      }
      const t = setTimeout(() => resolve(false), AGENT_WAIT_MS);
      room.once(lk.RoomEvent.ParticipantConnected, () => {
        clearTimeout(t);
        resolve(true);
      });
    });
    if (!agentJoined) {
      fail('no_agent', 'Atlas is on another call right now. Please call the live line or try again in a minute.');
      await teardown('no_agent');
      return;
    }
    startedAt.current = Date.now();
    setMuted(false);
    setStatus('live');
    trackAtlas('atlas_call_start', { persona }, { eventId: session.eventId });
  }, [fail, teardown]);

  const end = useCallback(async () => {
    setStatus('ended');
    await teardown('visitor_ended');
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
