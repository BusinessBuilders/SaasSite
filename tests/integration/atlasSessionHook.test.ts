// @vitest-environment jsdom
// The happy path of a voice call needs a live worker; these tests cover the
// paths that only show up when something goes wrong, because those are the
// ones a visitor actually meets at 2am. livekit-client is replaced by a fake
// room we can drive event by event.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseWorkerMessage } from '@/features/atlas/messages';
import { useAtlasSession } from '@/features/atlas/useAtlasSession';

type TextHandler = (reader: FakeReader, participantInfo: { identity: string }) => Promise<void>;
type FakeReader = {
  info: { id: string; attributes?: Record<string, string> };
  [Symbol.asyncIterator]: () => AsyncIterator<string>;
};

const lkMock = vi.hoisted(() => {
  class FakeRoom {
    static instances: FakeRoom[] = [];
    static autoJoinAgent = true;
    static failNextConnect: Error | null = null;
    static failDisconnectWith: Error | null = null;
    static failConstruction: Error | null = null;
    static failRegisterWith: Error | null = null;
    static failMicWith: Error | null = null;
    static publishedTracks: unknown[] = [];

    listeners = new Map<string, ((...args: unknown[]) => void)[]>();
    textHandlers = new Map<string, (reader: never, info: { identity: string }) => Promise<void>>();
    unregisteredTopics: string[] = [];
    remoteParticipants = new Map<string, { identity: string }>();
    micCalls: boolean[] = [];
    disconnectCount = 0;
    localParticipant = {
      setMicrophoneEnabled: async (enabled: boolean) => {
        this.micCalls.push(enabled);
        if (FakeRoom.failMicWith) {
          const err = FakeRoom.failMicWith;
          FakeRoom.failMicWith = null;
          throw err;
        }
      },
      publishTrack: async (track: unknown) => {
        FakeRoom.publishedTracks.push(track);
      },
    };

    constructor() {
      if (FakeRoom.failConstruction) {
        const err = FakeRoom.failConstruction;
        FakeRoom.failConstruction = null;
        throw err;
      }
      FakeRoom.instances.push(this);
    }

    on(event: string, fn: (...args: unknown[]) => void) {
      const list = this.listeners.get(event) ?? [];
      list.push(fn);
      this.listeners.set(event, list);
      return this;
    }

    off(event: string, fn: (...args: unknown[]) => void) {
      this.listeners.set(event, (this.listeners.get(event) ?? []).filter(l => l !== fn));
      return this;
    }

    once(event: string, fn: (...args: unknown[]) => void) {
      const wrapped = (...args: unknown[]) => {
        this.off(event, wrapped);
        fn(...args);
      };
      return this.on(event, wrapped);
    }

    registerTextStreamHandler(topic: string, cb: (reader: never, info: { identity: string }) => Promise<void>) {
      if (FakeRoom.failRegisterWith) {
        const err = FakeRoom.failRegisterWith;
        FakeRoom.failRegisterWith = null;
        throw err;
      }
      if (this.textHandlers.has(topic)) {
        throw new Error(`A text stream handler for topic "${topic}" has already been set.`);
      }
      this.textHandlers.set(topic, cb);
    }

    unregisterTextStreamHandler(topic: string) {
      this.unregisteredTopics.push(topic);
      this.textHandlers.delete(topic);
    }

    async connect() {
      if (FakeRoom.failNextConnect) {
        const err = FakeRoom.failNextConnect;
        FakeRoom.failNextConnect = null;
        throw err;
      }
      if (FakeRoom.autoJoinAgent) {
        this.remoteParticipants.set('atlas', { identity: 'atlas' });
      }
    }

    async disconnect() {
      this.disconnectCount += 1;
      if (FakeRoom.failDisconnectWith) {
        const err = FakeRoom.failDisconnectWith;
        FakeRoom.failDisconnectWith = null;
        throw err;
      }
      this.emit('disconnected');
    }

    emit(event: string, ...args: unknown[]) {
      for (const fn of [...(this.listeners.get(event) ?? [])]) {
        fn(...args);
      }
    }
  }

  // The microphone the page now asks for BEFORE it mints a session.
  //
  // `hold` leaves the permission prompt UNANSWERED — the state that caused the
  // 2026-09-14 incident — and `answer()` grants it later, which is what the
  // real visitor did a minute after they had already cancelled.
  const mic = {
    denyWith: null as Error | null,
    hold: false,
    answer: null as null | (() => void),
    created: 0,
    stopped: 0,
    lastTrack: null as null | { stop: () => void },
  };

  const createLocalAudioTrack = () => {
    mic.created += 1;
    if (mic.denyWith) {
      const err = mic.denyWith;
      mic.denyWith = null;
      return Promise.reject(err);
    }
    const track = {
      kind: 'audio',
      stop: () => {
        mic.stopped += 1;
      },
    };
    mic.lastTrack = track;
    if (mic.hold) {
      return new Promise((resolve) => {
        mic.answer = () => resolve(track);
      });
    }
    return Promise.resolve(track);
  };

  return {
    FakeRoom,
    mic,
    createLocalAudioTrack,
    RoomEvent: {
      DataReceived: 'dataReceived',
      TrackSubscribed: 'trackSubscribed',
      ParticipantConnected: 'participantConnected',
      Disconnected: 'disconnected',
    },
    Track: { Kind: { Audio: 'audio', Video: 'video' } },
  };
});

vi.mock('livekit-client', () => ({
  Room: lkMock.FakeRoom,
  createLocalAudioTrack: lkMock.createLocalAudioTrack,
  RoomEvent: lkMock.RoomEvent,
  Track: lkMock.Track,
}));

const GRANT = {
  url: 'wss://livekit.example.internal',
  token: 'a.jwt.token',
  sessionId: 'web-11111111-2222-3333-4444-555555555555',
  eventId: 'EV-1',
};

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const gtagCalls = () => (window.gtag as ReturnType<typeof vi.fn>).mock.calls;
const gtagEvent = (name: string) => gtagCalls().filter(c => c[1] === name);
const encode = (value: string) => new TextEncoder().encode(value);
const emitData = (room: InstanceType<typeof lkMock.FakeRoom>, value: string, topic = 'atlas') =>
  room.emit('dataReceived', encode(value), undefined, undefined, topic);
const lastRoom = () => {
  const room = lkMock.FakeRoom.instances.at(-1);
  if (!room) {
    throw new Error('no fake room was constructed');
  }
  return room;
};

const reader = (id: string, chunks: string[], throwAfter = false): FakeReader => ({
  info: { id, attributes: { 'lk.segment_id': id } },
  async *[Symbol.asyncIterator]() {
    for (const chunk of chunks) {
      yield chunk;
    }
    if (throwAfter) {
      throw new Error('stream died');
    }
  },
});

let consoleErrors: unknown[][];
let consoleWarns: unknown[][];

beforeEach(() => {
  lkMock.FakeRoom.instances = [];
  lkMock.FakeRoom.autoJoinAgent = true;
  lkMock.FakeRoom.failNextConnect = null;
  lkMock.FakeRoom.failDisconnectWith = null;
  lkMock.FakeRoom.failConstruction = null;
  lkMock.FakeRoom.failRegisterWith = null;
  lkMock.FakeRoom.failMicWith = null;
  lkMock.FakeRoom.publishedTracks = [];
  lkMock.mic.denyWith = null;
  lkMock.mic.hold = false;
  lkMock.mic.answer = null;
  lkMock.mic.created = 0;
  lkMock.mic.stopped = 0;
  lkMock.mic.lastTrack = null;
  window.localStorage.clear();
  window.gtag = vi.fn();
  window.fbq = vi.fn();
  consoleErrors = [];
  consoleWarns = [];
  // vitest-fail-on-console turns any console output into a test failure, so the
  // deliberately-loud paths below capture it here instead of letting it through.
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args);
  });
  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    consoleWarns.push(args);
  });
  Object.defineProperty(window.navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn() },
    configurable: true,
  });
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, GRANT)));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const startLive = async () => {
  const hook = renderHook(() => useAtlasSession());
  await act(async () => {
    await hook.result.current.start('landscaping');
  });

  expect(hook.result.current.status).toBe('live');

  return hook;
};

// Spin the microtask queue. start() reaches waiting_agent through a chain of
// already-resolved promises (fetch, json, the mocked dynamic import, connect),
// so flushing microtasks gets there deterministically without real waiting —
// which matters because these tests run on fake timers.
const flushMicrotasks = async (times = 30) => {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
};

describe('parseWorkerMessage', () => {
  it('accepts every message the worker is allowed to send', () => {
    expect(parseWorkerMessage('{"type":"state","state":"speaking"}')).toEqual({ type: 'state', state: 'speaking' });
    expect(parseWorkerMessage('{"type":"lead_captured","event_id":"EV-9"}')).toEqual({ type: 'lead_captured', event_id: 'EV-9' });
    expect(parseWorkerMessage('{"type":"booked","when":"2026-09-14T14:00:00Z","spoken":"Monday, September 14 at 10:00 AM"}'))
      .toEqual({ type: 'booked', when: '2026-09-14T14:00:00Z', spoken: 'Monday, September 14 at 10:00 AM' });
    expect(parseWorkerMessage('{"type":"ended","reason":"visitor_hung_up"}')).toEqual({ type: 'ended', reason: 'visitor_hung_up' });
    expect(parseWorkerMessage('{"type":"error","reason":"tts_unavailable"}')).toEqual({ type: 'error', reason: 'tts_unavailable' });
  });

  it('rejects a lead_captured with no event_id — the dedup id is not optional', () => {
    expect(parseWorkerMessage('{"type":"lead_captured"}')).toBeNull();
    expect(parseWorkerMessage('{"type":"lead_captured","event_id":""}')).toBeNull();
  });

  it('rejects unknown types, renamed fields, bad enum values and non-JSON', () => {
    expect(parseWorkerMessage('{"type":"transferred","to":"william"}')).toBeNull();
    expect(parseWorkerMessage('{"type":"booked","when":"2026-09-14T14:00:00Z"}')).toBeNull();
    expect(parseWorkerMessage('{"type":"state","state":"pondering"}')).toBeNull();
    expect(parseWorkerMessage('not json at all')).toBeNull();
    expect(parseWorkerMessage('')).toBeNull();
    expect(parseWorkerMessage('null')).toBeNull();
  });
});

describe('useAtlasSession — session request failures', () => {
  it('reports the HTTP status when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    })));
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error).toEqual({ reason: 'http_502', message: 'The voice demo is offline right now.' });
    expect(result.current.status).toBe('error');
  });

  it('uses the route\'s own reason when it sends one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(429, {
      reason: 'rate_limited',
      error: 'You have started several sessions recently. Please try again later or call the live line.',
    })));
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error?.reason).toBe('rate_limited');
    expect(gtagEvent('atlas_error')).toHaveLength(1);
  });

  it('refuses a 200 whose body is not a session grant', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { ...GRANT, sessionId: 'phone-123' })));
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error?.reason).toBe('bad_session_response');
    expect(lkMock.FakeRoom.instances).toHaveLength(0);
    expect(consoleErrors).toHaveLength(1);
  });

  it('ignores a second start() while a session is already under way', async () => {
    const { result } = await startLive();

    await act(async () => {
      await result.current.start('restaurant');
    });

    expect(consoleWarns[0]).toEqual(['[atlas] start() ignored: a session is already under way']);
    expect(lkMock.FakeRoom.instances).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('live');
  });
});

describe('useAtlasSession — connecting and waiting for Atlas', () => {
  it('asks for the microphone BEFORE it spends a session, and spends nothing when refused', async () => {
    const denied = new Error('Permission denied');
    denied.name = 'NotAllowedError';
    lkMock.mic.denyWith = denied;

    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error).toEqual({
      reason: 'mic_denied',
      message: 'Microphone access was blocked. Allow the microphone and try again, or call the live line.',
    });
    // The whole point: no token minted, no room, no worker slot claimed, and no
    // greeting spoken into an empty room.
    expect(fetch).not.toHaveBeenCalled();
    expect(lkMock.FakeRoom.instances).toHaveLength(0);
    expect(gtagEvent('atlas_error')[0]?.[2]).toMatchObject({ reason: 'mic_denied' });
  });

  it('publishes the microphone it already holds instead of opening a second one', async () => {
    const { result } = await startLive();

    expect(result.current.status).toBe('live');
    expect(lkMock.mic.created).toBe(1);
    // One session request, one room, one published track...
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(lkMock.FakeRoom.publishedTracks).toEqual([lkMock.mic.lastTrack]);
    // ...and setMicrophoneEnabled is NOT how the track got there. That call is
    // what used to block on the permission prompt with a room already up.
    expect(lastRoom().micCalls).toEqual([]);
  });

  it('releases the microphone when the call is torn down', async () => {
    const { result } = await startLive();

    expect(lkMock.mic.stopped).toBe(0);

    await act(async () => {
      await result.current.end();
    });

    expect(lkMock.mic.stopped).toBe(1);
  });

  it('still says the demo is broken, not the microphone, when the room will not connect', async () => {
    lkMock.FakeRoom.failNextConnect = new Error('ICE failed');
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error).toEqual({
      reason: 'connect_failed',
      message: 'We could not connect the call. Please call the live line instead.',
    });
    expect(lastRoom().disconnectCount).toBe(1);
    expect(lkMock.mic.stopped).toBe(1);
  });

  it('falls back to the generic connect message for any other connect failure', async () => {
    lkMock.FakeRoom.failNextConnect = new Error('ICE failed');
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error?.message).toBe('We could not connect the call. Please call the live line instead.');
  });

  it('goes live when Atlas joins after the connection rather than before it', async () => {
    lkMock.FakeRoom.autoJoinAgent = false;
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      const pending = result.current.start('landscaping');
      await vi.waitUntil(() => (lkMock.FakeRoom.instances.at(-1)?.listeners.get('participantConnected')?.length ?? 0) > 0);
      lastRoom().emit('participantConnected', { identity: 'atlas' });
      await pending;
    });

    expect(result.current.status).toBe('live');
    expect(gtagEvent('atlas_call_start')).toHaveLength(1);
  });

  it('gives the honest "on another call" answer when no agent turns up in 8 s', async () => {
    lkMock.FakeRoom.autoJoinAgent = false;
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useAtlasSession());
      await act(async () => {
        const pending = result.current.start('landscaping');
        await vi.advanceTimersByTimeAsync(8000);
        await pending;
      });

      expect(result.current.error).toEqual({
        reason: 'no_agent',
        message: 'Atlas is on another call right now. Please call the live line or try again in a minute.',
      });
      expect(lastRoom().disconnectCount).toBe(1);
      // The call never started, so there is no call to report the end of.
      expect(gtagEvent('atlas_call_end')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useAtlasSession — cancelling a dial', () => {
  it('a cancel during waiting_agent is final: the 8 s timeout never overwrites it', async () => {
    lkMock.FakeRoom.autoJoinAgent = false;
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useAtlasSession());
      let pending: Promise<void> | undefined;

      await act(async () => {
        pending = result.current.start('landscaping');
        await flushMicrotasks();
      });

      expect(result.current.status).toBe('waiting_agent');

      await act(async () => {
        await result.current.end();
        await pending;
      });

      expect(result.current.status).toBe('ended');

      // Well past the agent-wait timeout that used to fire after the cancel.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20000);
      });

      expect(result.current.status).toBe('ended');
      expect(result.current.error).toBeNull();
      expect(gtagEvent('atlas_error')).toHaveLength(0);
      expect(gtagEvent('atlas_call_end')).toHaveLength(1);
      // `visitor_cancelled`, not `visitor_ended`: giving up while it is still
      // ringing is a different thing to count from hanging up on a call that
      // was happening, and lumping them together hides what the dial time costs.
      expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'visitor_cancelled', duration_s: 0 });
      // The panel reads this to keep a 0:00 clock off a call that never ran.
      expect(result.current.cancelled).toBe(true);
      expect(lastRoom().disconnectCount).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('aborts the in-flight session request itself, not just its answer', async () => {
    let signal: AbortSignal | undefined;

    // Behaves like a real fetch: the moment its signal trips it rejects with an
    // AbortError. Without `signal: ac.signal` in the hook this request would run
    // to completion and mint a token for a visitor who already walked away.
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      signal = init.signal ?? undefined;
      init.signal?.addEventListener('abort', () => {
        const aborted = new Error('The operation was aborted.');
        aborted.name = 'AbortError';
        reject(aborted);
      });
    })));

    const { result } = renderHook(() => useAtlasSession());
    let pending: Promise<void> | undefined;

    await act(async () => {
      pending = result.current.start('landscaping');
      await flushMicrotasks();
    });

    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    await act(async () => {
      await result.current.end();
      await pending;
    });

    expect(signal?.aborted).toBe(true);
    expect(result.current.status).toBe('ended');
    expect(result.current.error).toBeNull();
    expect(result.current.cancelled).toBe(true);
    expect(gtagEvent('atlas_error')).toHaveLength(0);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'visitor_cancelled', duration_s: 0 });
  });

  it('a hang-up on a call that really happened is not a cancellation', async () => {
    const { result } = await startLive();

    await act(async () => {
      await result.current.end();
    });

    expect(result.current.cancelled).toBe(false);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'visitor_ended' });
  });

  // The guard has to hold from the first line of start(), not from the moment a
  // Room object exists: this second tap lands while the session request is
  // still in flight, when roomRef is still null.
  it('refuses a second start() while the first is still requesting a token', async () => {
    let release: (() => void) | undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => {
      release = () => resolve(jsonResponse(200, GRANT));
    })));
    const { result } = renderHook(() => useAtlasSession());
    let pending: Promise<void> | undefined;

    await act(async () => {
      pending = result.current.start('landscaping');
      await flushMicrotasks();
    });

    expect(result.current.status).toBe('requesting');
    expect(lkMock.FakeRoom.instances).toHaveLength(0);

    await act(async () => {
      await result.current.start('restaurant');
    });

    expect(consoleWarns[0]).toEqual(['[atlas] start() ignored: a session is already under way']);
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.end();
      release?.();
      await pending;
    });

    expect(result.current.status).toBe('ended');
  });

  it('a cancel before the room exists leaves nothing behind', async () => {
    let release: (() => void) | undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => {
      release = () => resolve(jsonResponse(200, GRANT));
    })));
    const { result } = renderHook(() => useAtlasSession());
    let pending: Promise<void> | undefined;

    await act(async () => {
      pending = result.current.start('landscaping');
      await flushMicrotasks();
    });

    expect(result.current.status).toBe('requesting');

    await act(async () => {
      await result.current.end();
      release?.();
      await pending;
    });

    expect(result.current.status).toBe('ended');
    expect(result.current.error).toBeNull();
    expect(lkMock.FakeRoom.instances).toHaveLength(0);
    expect(gtagEvent('atlas_error')).toHaveLength(0);
  });
});

describe('useAtlasSession — a request nobody answers', () => {
  // A fetch that accepts the connection and then says nothing, which is what a
  // wedged proxy looks like. It rejects the way a real one does the moment its
  // signal trips, and never otherwise.
  const stubSilentFetch = () =>
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => {
        const aborted = new Error('The operation was aborted.');
        aborted.name = 'AbortError';
        reject(aborted);
      });
    })));

  it('gives up on a session request that never answers, under its own reason', async () => {
    stubSilentFetch();
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useAtlasSession());
      let pending: Promise<void> | undefined;

      await act(async () => {
        pending = result.current.start('landscaping');
        await flushMicrotasks();
      });

      expect(result.current.status).toBe('requesting');

      // Just short of the deadline: still waiting, still honest about it.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(14_000);
      });

      expect(result.current.status).toBe('requesting');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
        await pending;
      });

      // Not `session_request_failed`: a deadline and a dead network arrive as
      // the same rejected fetch, and "taking too long, try again" is a
      // different instruction from "we could not reach it at all".
      expect(result.current.error).toEqual({
        reason: 'session_timeout',
        message: 'Starting the call is taking too long. Please try again, or call the live line.',
      });
      expect(result.current.status).toBe('error');
      expect(gtagEvent('atlas_error')[0]?.[2]).toMatchObject({ reason: 'session_timeout' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('still calls a dead network a dead network, not a timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));

    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error?.reason).toBe('session_request_failed');
  });

  it('a visitor who cancels is not told the call timed out', async () => {
    stubSilentFetch();
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useAtlasSession());
      let pending: Promise<void> | undefined;

      await act(async () => {
        pending = result.current.start('landscaping');
        await flushMicrotasks();
      });

      await act(async () => {
        await result.current.end();
        await pending;
      });

      expect(result.current.status).toBe('ended');
      expect(result.current.error).toBeNull();

      // And the deadline that is still ticking must not surface afterwards.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      expect(result.current.status).toBe('ended');
      expect(result.current.error).toBeNull();
      expect(gtagEvent('atlas_error')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not abort a call that connected long before the deadline', async () => {
    vi.useFakeTimers();

    try {
      const hook = renderHook(() => useAtlasSession());

      await act(async () => {
        await hook.result.current.start('landscaping');
      });

      expect(hook.result.current.status).toBe('live');

      // Well past the 15 s deadline. If it were not cleared, the timer would
      // abort the controller and the live call would be torn down under it.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      expect(hook.result.current.status).toBe('live');
      expect(lastRoom().disconnectCount).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useAtlasSession — nothing escapes start()', () => {
  it('turns an unexpected throw into a sentence instead of a stuck spinner', async () => {
    lkMock.FakeRoom.failRegisterWith = new Error('HandlerAlreadyRegistered');

    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    // Both call sites `void` start(), so before the catch-all this throw became
    // an unhandled rejection and the panel sat on "Connecting…" for ever.
    expect(result.current.error).toEqual({
      reason: 'unexpected',
      message: 'Something went wrong starting the call. Please refresh the page, or call the live line.',
    });
    expect(result.current.status).toBe('error');
    expect(String(consoleErrors[0]?.[0])).toBe('[atlas] start() failed unexpectedly: HandlerAlreadyRegistered');
    expect(gtagEvent('atlas_error')[0]?.[2]).toMatchObject({ reason: 'unexpected' });
    // And the half-built room is gone, not left holding a socket.
    expect(lastRoom().disconnectCount).toBe(1);
  });
});

describe('useAtlasSession — mute is a promise, not a button state', () => {
  it('mutes when the command succeeds', async () => {
    const { result } = await startLive();

    await act(async () => {
      await result.current.toggleMute();
    });

    expect(result.current.muted).toBe(true);
    // Only the mute itself: the track was published directly, never through
    // setMicrophoneEnabled(true).
    expect(lastRoom().micCalls).toEqual([false]);
  });

  it('puts the label back and ends the call when the microphone will not mute', async () => {
    const { result } = await startLive();

    lkMock.FakeRoom.failMicWith = new Error('track publication is gone');

    await act(async () => {
      await result.current.toggleMute();
    });

    // The lie this prevents: a button reading "Unmute" while the microphone is
    // still publishing into a session the page says is transcribed and kept.
    expect(result.current.muted).toBe(false);
    expect(String(consoleErrors[0]?.[0])).toBe('[atlas] setMicrophoneEnabled(false) failed: track publication is gone');
    expect(result.current.error).toEqual({
      reason: 'mute_failed',
      message: 'We could not mute your microphone, so the call was ended to be sure. Please call the live line.',
    });
    expect(result.current.status).toBe('error');
    // Ending the call is the only remaining way to make the silence real.
    expect(lastRoom().disconnectCount).toBe(1);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'mute_failed' });
  });

  it('says so out loud when UNmuting fails too', async () => {
    const { result } = await startLive();

    await act(async () => {
      await result.current.toggleMute();
    });

    expect(result.current.muted).toBe(true);

    lkMock.FakeRoom.failMicWith = new Error('signal socket closed');

    await act(async () => {
      await result.current.toggleMute();
    });

    expect(result.current.muted).toBe(true);
    expect(result.current.error?.reason).toBe('mute_failed');
    expect(result.current.error?.message).toContain('We lost control of your microphone');
  });
});

describe('useAtlasSession — Cancel while the microphone prompt is open', () => {
  // The 2026-09-14 incident, in one test.
  //
  // Real browser, permission left at `prompt` for 100 seconds: the session was
  // minted, the room connected and Atlas greeted an empty room while start()
  // sat blocked on the microphone. Cancel disconnected the room; the microphone
  // call then resumed and published a track INTO THE DEAD ROOM; and because the
  // parked start() still held `starting`, the next thing to ask for the picker
  // was refused 17 seconds later.
  it('spends nothing, publishes nothing, and leaves the page usable', async () => {
    lkMock.mic.hold = true;

    const { result } = renderHook(() => useAtlasSession());
    let pending: Promise<void> | undefined;

    await act(async () => {
      pending = result.current.start('landscaping');
      await flushMicrotasks();
    });

    // Waiting on the visitor, and saying so — not "Connecting…".
    expect(result.current.status).toBe('requesting_mic');
    expect(fetch).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.end();
    });

    expect(result.current.status).toBe('ended');
    expect(result.current.cancelled).toBe(true);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'visitor_cancelled' });

    // The visitor answers the prompt a minute later, as they did in the
    // incident. Nothing may come of it.
    await act(async () => {
      lkMock.mic.hold = false;
      lkMock.mic.answer?.();
      await pending;
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(lkMock.FakeRoom.instances).toHaveLength(0);
    expect(lkMock.FakeRoom.publishedTracks).toEqual([]);
    // The track that arrived too late is released, not left recording.
    expect(lkMock.mic.stopped).toBe(1);

    // reset() is freely usable — this is what was refused at 117 s.
    await act(async () => {
      await result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(consoleErrors).toEqual([]);

    // And a second Start works, which it could not while `starting` stayed set.
    await act(async () => {
      await result.current.start('restaurant');
    });

    expect(result.current.status).toBe('live');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(gtagEvent('atlas_call_start')).toHaveLength(1);
  });

  it('a second Start works even without the reset, once the first was cancelled', async () => {
    lkMock.mic.hold = true;

    const { result } = renderHook(() => useAtlasSession());
    let firstDial: Promise<void> | undefined;

    await act(async () => {
      firstDial = result.current.start('landscaping');
      await flushMicrotasks();
    });
    await act(async () => {
      await result.current.end();
    });

    // The parked dial is still parked. `starting` must already be clear.
    lkMock.mic.hold = false;

    await act(async () => {
      await result.current.start('restaurant');
    });

    expect(result.current.status).toBe('live');
    expect(consoleWarns).toEqual([]);

    // The first dial finally unblocks — and must not disturb the second.
    await act(async () => {
      lkMock.mic.answer?.();
      await firstDial;
    });

    expect(result.current.status).toBe('live');
    expect(lkMock.FakeRoom.instances).toHaveLength(1);
  });
});

describe('useAtlasSession — going back to the picker', () => {
  it('reset() clears the last call so the persona picker is reachable again', async () => {
    const { result } = await startLive();
    const room = lastRoom();
    const handler = room.textHandlers.get('lk.transcription') as unknown as TextHandler;

    await act(async () => {
      await handler(reader('seg-1', ['Hello, Maple Street Landscaping']), { identity: 'atlas-agent' });
      emitData(room, JSON.stringify({ type: 'lead_captured', event_id: 'EV-lead' }));
    });
    await act(async () => {
      await result.current.end();
    });

    expect(result.current.status).toBe('ended');

    await act(async () => {
      await result.current.reset();
    });

    // 'idle' is what AtlasHero renders the picker and the Start button for.
    expect(result.current.status).toBe('idle');
    expect(result.current.captions).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.leadCaptured).toBe(false);
    expect(result.current.cancelled).toBe(false);

    // And the retry path really works: a second call, on a different trade.
    await act(async () => {
      await result.current.start('restaurant');
    });

    expect(result.current.status).toBe('live');
    expect(gtagEvent('atlas_call_start')).toHaveLength(2);
  });

  it('reset() takes a still-running session down and gives the visitor the picker anyway', async () => {
    const { result } = await startLive();

    await act(async () => {
      await result.current.reset();
    });

    await waitFor(() => expect(result.current.status).toBe('idle'));

    // It never refuses. A real session on 2026-09-14 reached this branch after
    // nothing worse than a Cancel during the microphone prompt; "the last call
    // has not finished closing, please refresh the page" is a worse answer to
    // that visitor than the picker they asked for.
    expect(result.current.error).toBeNull();
    expect(String(consoleErrors[0]?.[0]))
      .toBe('[atlas] reset(): a session was still under way — tearing it down first');
    // Loud in the log, and the room and microphone really are released.
    expect(lastRoom().disconnectCount).toBe(1);
    expect(lkMock.mic.stopped).toBe(1);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'reset_while_active' });
    expect(gtagEvent('atlas_error')).toHaveLength(0);
  });
});

describe('useAtlasSession — hardening', () => {
  it('still reports the end of the call when disconnect() rejects', async () => {
    const { result } = await startLive();
    lkMock.FakeRoom.failDisconnectWith = new Error('signal socket already closed');

    await act(async () => {
      await result.current.end();
    });

    expect(String(consoleErrors[0]?.[0])).toBe('[atlas] room.disconnect() failed: signal socket already closed');
    expect(gtagEvent('atlas_call_end')).toHaveLength(1);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'visitor_ended' });
    expect(result.current.status).toBe('ended');
  });

  it('unregisters the caption handler when the session is torn down', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    expect(room.textHandlers.has('lk.transcription')).toBe(true);

    await act(async () => {
      await result.current.end();
    });

    expect(room.unregisteredTopics).toEqual(['lk.transcription']);
    expect(room.textHandlers.has('lk.transcription')).toBe(false);
  });

  // The dynamic import rejecting and `new Room()` throwing share one try/catch
  // in the hook, so this drives the same path through the cheaper of the two.
  // Making the real `await import('livekit-client')` reject needs vi.doMock +
  // vi.resetModules, which replaces the hoisted module mock for every test that
  // runs after it in this file.
  it('says so out loud when the LiveKit SDK will not load or will not run here', async () => {
    lkMock.FakeRoom.failConstruction = new Error('Loading chunk 742 failed');
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error).toEqual({
      reason: 'sdk_load_failed',
      message: 'The voice demo could not load in this browser. Please refresh, or call the live line.',
    });
    expect(String(consoleErrors[0]?.[0])).toBe('[atlas] livekit-client failed to load: Loading chunk 742 failed');
    expect(gtagEvent('atlas_error')[0]?.[2]).toMatchObject({ reason: 'sdk_load_failed' });
  });

  it('calls a non-JSON 200 a bad session response, not http_200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    })));
    const { result } = renderHook(() => useAtlasSession());

    await act(async () => {
      await result.current.start('landscaping');
    });

    expect(result.current.error).toEqual({
      reason: 'bad_session_response',
      message: 'The voice demo sent a reply we could not read. Please call the live line instead.',
    });
  });

  it('never renders an empty caption bubble for a stream that says nothing', async () => {
    const { result } = await startLive();
    const room = lastRoom();
    const handler = room.textHandlers.get('lk.transcription') as unknown as TextHandler;

    await act(async () => {
      await handler(reader('seg-empty', ['', '']), { identity: 'atlas-agent' });
    });

    expect(result.current.captions).toEqual([]);

    // …but a stream that starts empty and then speaks still lands, finalised.
    await act(async () => {
      await handler(reader('seg-late', ['', 'took a breath first']), { identity: 'atlas-agent' });
    });

    expect(result.current.captions).toEqual([
      { id: 'seg-late', role: 'agent', text: 'took a breath first', final: true },
    ]);
  });

  it('reports the worker\'s own ended reason as the end of the call', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await act(async () => {
      emitData(room, JSON.stringify({ type: 'ended', reason: 'visitor_said_goodbye' }));
    });

    await waitFor(() => expect(result.current.status).toBe('ended'));

    expect(gtagEvent('atlas_call_end')).toHaveLength(1);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({
      reason: 'visitor_said_goodbye',
      persona: 'landscaping',
    });
    expect(room.disconnectCount).toBe(1);
  });

  it('hangs up when the page unmounts mid-call', async () => {
    const hook = await startLive();
    const room = lastRoom();

    await act(async () => {
      hook.unmount();
    });

    await waitFor(() => expect(room.disconnectCount).toBe(1));

    expect(gtagEvent('atlas_call_end')).toHaveLength(1);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'page_left' });
  });
});

describe('useAtlasSession — teardown', () => {
  it('tears the session down when the room disconnects on its own', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await act(async () => {
      room.emit('disconnected');
    });

    await waitFor(() => expect(result.current.status).toBe('ended'));

    expect(gtagEvent('atlas_call_end')).toHaveLength(1);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'disconnected', persona: 'landscaping' });

    // roomRef must be null afterwards, or toggleMute fires at a dead room.
    const micCallsBefore = room.micCalls.length;

    await act(async () => {
      await result.current.toggleMute();
    });

    expect(room.micCalls).toHaveLength(micCallsBefore);
  });

  it('keeps the visitor\'s own hang-up reason despite the disconnect it triggers', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await act(async () => {
      await result.current.end();
    });

    expect(room.disconnectCount).toBe(1);
    expect(gtagEvent('atlas_call_end')).toHaveLength(1);
    expect(gtagEvent('atlas_call_end')[0]?.[2]).toMatchObject({ reason: 'visitor_ended' });
    expect(result.current.status).toBe('ended');
  });

  it('ends the call loudly when there is no audio element to play Atlas through', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await act(async () => {
      room.emit('trackSubscribed', { kind: 'audio', attach: vi.fn(), mediaStreamTrack: {} });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toEqual({
      reason: 'no_audio_sink',
      message: 'Atlas connected but this page could not play audio. Please refresh, or call the live line.',
    });
    expect(consoleErrors[0]).toEqual(['[atlas] no audio element to attach the agent track to']);
    expect(gtagEvent('atlas_call_end')).toHaveLength(1);
  });
});

describe('useAtlasSession — worker data messages', () => {
  it('discards an unparseable payload without throwing or firing a lead', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    expect(() => emitData(room, 'not json at all')).not.toThrow();
    expect(() => emitData(room, JSON.stringify({ type: 'lead_captured' }))).not.toThrow();
    expect(() => emitData(room, JSON.stringify({ type: 'state', state: 'pondering' }))).not.toThrow();

    expect(result.current.leadCaptured).toBe(false);
    expect(gtagEvent('generate_lead')).toHaveLength(0);
    expect(window.fbq).not.toHaveBeenCalled();
    expect(gtagEvent('atlas_error')).toHaveLength(3);
    expect(gtagEvent('atlas_error')[0]?.[2]).toEqual({ reason: 'bad_worker_message', persona: 'landscaping' });
    expect(consoleErrors[0]?.[0]).toBe('[atlas] discarded unparseable worker message: not json at all');
  });

  it('truncates a huge bad payload to 200 characters in the log', async () => {
    const room = (await startLive(), lastRoom());

    emitData(room, 'x'.repeat(5000));

    expect(String(consoleErrors[0]?.[0])).toHaveLength('[atlas] discarded unparseable worker message: '.length + 200);
  });

  it('acts on valid messages and ignores other topics', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await act(async () => {
      emitData(room, JSON.stringify({ type: 'state', state: 'thinking' }));
      emitData(room, JSON.stringify({ type: 'lead_captured', event_id: 'EV-lead' }));
      emitData(room, JSON.stringify({ type: 'booked', when: '2026-09-14T14:00:00Z', spoken: 'Monday, September 14 at 10:00 AM' }));
    });

    expect(result.current.agentState).toBe('thinking');
    expect(result.current.leadCaptured).toBe(true);
    expect(result.current.bookedSpoken).toBe('Monday, September 14 at 10:00 AM');
    expect(gtagEvent('generate_lead')).toHaveLength(1);
    expect(gtagEvent('atlas_booked')).toHaveLength(1);

    await act(async () => {
      emitData(room, JSON.stringify({ type: 'state', state: 'speaking' }), 'some-other-topic');
    });

    expect(result.current.agentState).toBe('thinking');
  });

  it('a worker error message fails the call visibly and tears it down', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await act(async () => {
      emitData(room, JSON.stringify({ type: 'error', reason: 'llm_unavailable' }));
    });

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toEqual({
      reason: 'llm_unavailable',
      message: 'Atlas hit a technical problem and had to stop. Please call the live line.',
    });
    expect(room.disconnectCount).toBe(1);
  });
});

describe('useAtlasSession — captions', () => {
  const runStream = async (room: InstanceType<typeof lkMock.FakeRoom>, r: FakeReader, identity: string) => {
    const handler = room.textHandlers.get('lk.transcription') as unknown as TextHandler;
    await act(async () => {
      await handler(r, { identity });
    });
  };

  it('updates a caption in place instead of moving it to the end', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await runStream(room, reader('seg-a', ['Hi ', 'there']), 'visitor-abc');
    await runStream(room, reader('seg-b', ['Hello, ', 'Maple Street']), 'atlas-agent');
    // seg-a speaks again: with a filter-and-append it would jump past seg-b.
    await runStream(room, reader('seg-a', ['Hi there, ', 'I need a quote']), 'visitor-abc');

    expect(result.current.captions.map(c => c.id)).toEqual(['seg-a', 'seg-b']);
    expect(result.current.captions[0]).toEqual({
      id: 'seg-a',
      role: 'visitor',
      text: 'Hi there, I need a quote',
      final: true,
    });
    expect(result.current.captions[1]?.role).toBe('agent');
  });

  it('marks a caption final and logs when its stream dies mid-sentence', async () => {
    const { result } = await startLive();
    const room = lastRoom();

    await runStream(room, reader('seg-c', ['half a senten'], true), 'atlas-agent');

    expect(result.current.captions).toEqual([{ id: 'seg-c', role: 'agent', text: 'half a senten', final: true }]);
    expect(String(consoleErrors[0]?.[0])).toBe('[atlas] caption stream seg-c ended early: stream died');
  });

  it('keeps only the last 200 captions', async () => {
    const { result } = await startLive();
    const room = lastRoom();
    const handler = room.textHandlers.get('lk.transcription') as unknown as TextHandler;

    await act(async () => {
      for (let i = 0; i < 205; i += 1) {
        await handler(reader(`seg-${i}`, [`line ${i}`]), { identity: 'atlas-agent' });
      }
    });

    expect(result.current.captions).toHaveLength(200);
    expect(result.current.captions[0]?.id).toBe('seg-5');
    expect(result.current.captions.at(-1)?.id).toBe('seg-204');
  });
});

describe('useAtlasSession — audio meter', () => {
  type FakeCtx = { closed: boolean };
  let contexts: FakeCtx[];
  let cancelled: number[];

  beforeEach(() => {
    contexts = [];
    cancelled = [];
    let nextRaf = 1;
    vi.stubGlobal('AudioContext', class {
      closed = false;
      constructor() {
        contexts.push(this);
      }

      createMediaStreamSource() {
        return { connect: () => undefined };
      }

      createAnalyser() {
        return {
          fftSize: 0,
          frequencyBinCount: 128,
          getByteTimeDomainData: () => undefined,
        };
      }

      async close() {
        this.closed = true;
      }
    });
    vi.stubGlobal('MediaStream', class {});
    // Return an id but never run the callback: the meter loop is not what these
    // assertions are about, and a live rAF loop would never settle.
    vi.stubGlobal('requestAnimationFrame', () => nextRaf++);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      cancelled.push(id);
    });
  });

  it('closes the previous meter before building a replacement on resubscribe', async () => {
    const { result } = await startLive();
    const room = lastRoom();
    result.current.audioElRef.current = document.createElement('audio');
    const track = { kind: 'audio', attach: vi.fn(), mediaStreamTrack: {} };

    await act(async () => {
      room.emit('trackSubscribed', track);
    });

    expect(contexts).toHaveLength(1);

    await act(async () => {
      room.emit('trackSubscribed', track);
    });

    await waitFor(() => expect(contexts[0]?.closed).toBe(true));

    expect(contexts).toHaveLength(2);
    expect(cancelled).toHaveLength(1);
    expect(result.current.status).toBe('live');
    expect(track.attach).toHaveBeenCalledTimes(2);
  });

  it('closes the meter on hang-up', async () => {
    const { result } = await startLive();
    const room = lastRoom();
    result.current.audioElRef.current = document.createElement('audio');

    await act(async () => {
      room.emit('trackSubscribed', { kind: 'audio', attach: vi.fn(), mediaStreamTrack: {} });
    });
    await act(async () => {
      await result.current.end();
    });

    expect(contexts[0]?.closed).toBe(true);
    expect(result.current.level).toBe(0);
  });

  it('ignores a video track entirely', async () => {
    const { result } = await startLive();
    const room = lastRoom();
    result.current.audioElRef.current = document.createElement('audio');

    await act(async () => {
      room.emit('trackSubscribed', { kind: 'video', attach: vi.fn(), mediaStreamTrack: {} });
    });

    expect(contexts).toHaveLength(0);
    expect(result.current.status).toBe('live');
  });
});
