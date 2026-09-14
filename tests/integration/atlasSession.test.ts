// @vitest-environment node
// The token this route mints is the ONLY channel from the site to the Atlas
// worker on MagicCat, so the metadata shape asserted here is a cross-repo
// contract: `parse_job_metadata` on the Python side asserts the same keys.
import { createHash } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetRateLimitForTests, checkRateLimit } from '@/app/api/atlas/session/rateLimit';
import { atlasSessionSchema } from '@/app/api/atlas/session/schema';

const LIVEKIT_KEY = 'APIkey';
const LIVEKIT_SECRET = 'secretsecretsecretsecretsecretsecret';

const stubLivekitEnv = () => {
  vi.stubEnv('LIVEKIT_URL', 'wss://eve.center/atlas-voice');
  vi.stubEnv('LIVEKIT_API_KEY', LIVEKIT_KEY);
  vi.stubEnv('LIVEKIT_API_SECRET', LIVEKIT_SECRET);
  _resetRateLimitForTests();
};

// Reads back the metadata the worker will actually receive, straight out of the
// minted JWT — never out of the route's own variables.
const dispatchMetadata = async (token: string) => {
  const { TokenVerifier } = await import('livekit-server-sdk');
  const claims = await new TokenVerifier(LIVEKIT_KEY, LIVEKIT_SECRET).verify(token);
  const agents = claims.roomConfig?.agents ?? [];

  return { claims, meta: JSON.parse(agents[0]!.metadata) };
};

describe('atlas session schema', () => {
  it('requires consent and a known persona', () => {
    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: true, page: 'https://business-builder.online/atlas' }).success).toBe(true);
    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: false, page: 'x' }).success).toBe(false);
    expect(atlasSessionSchema.safeParse({ persona: 'crypto', consent: true, page: 'x' }).success).toBe(false);
  });

  it('never rejects on the honeypot field, however long the value a bot puts there', () => {
    const long = { persona: 'landscaping', consent: true, page: 'x', website: 'b'.repeat(4999) };

    expect(atlasSessionSchema.safeParse(long).success).toBe(true);
    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: true, page: 'x', website: '' }).success).toBe(true);
  });

  it('caps utm at 20 keys and 64-character key names', () => {
    const tooMany = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, 'v']));
    const longKey = { ['k'.repeat(65)]: 'v' };

    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: true, page: 'x', utm: tooMany }).success).toBe(false);
    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: true, page: 'x', utm: longKey }).success).toBe(false);
    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: true, page: 'x', utm: { source: 'meta' } }).success).toBe(true);
  });
});

// The limit is read once at module load, so every case here needs its own
// fresh copy of the module — hence the dynamic imports and the resetModules.
const loadRateLimit = () => import('@/app/api/atlas/session/rateLimit');

describe('rate limit is configurable, and refuses to start on a value that is not', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to three sessions per hour when the variable is unset or blank', async () => {
    vi.stubEnv('ATLAS_SESSION_LIMIT_PER_HOUR', '');

    await expect(loadRateLimit()).resolves.toMatchObject({ MAX_PER_WINDOW: 3 });
  });

  it('honours ATLAS_SESSION_LIMIT_PER_HOUR', async () => {
    vi.stubEnv('ATLAS_SESSION_LIMIT_PER_HOUR', '1');

    const { MAX_PER_WINDOW, checkRateLimit } = await loadRateLimit();
    const t0 = 2_000_000;

    expect(MAX_PER_WINDOW).toBe(1);
    expect(checkRateLimit('3.3.3.3', t0).allowed).toBe(true);
    expect(checkRateLimit('3.3.3.3', t0 + 1).allowed).toBe(false);
  });

  it.each(['0', '-1', '2.5', 'three'])(
    'refuses to load with ATLAS_SESSION_LIMIT_PER_HOUR=%s, naming the variable',
    async (value) => {
      vi.stubEnv('ATLAS_SESSION_LIMIT_PER_HOUR', value);

      await expect(loadRateLimit()).rejects.toThrow(/ATLAS_SESSION_LIMIT_PER_HOUR/);
    },
  );
});

describe('rate limit', () => {
  beforeEach(() => _resetRateLimitForTests());

  it('allows three per hour per ip then blocks', () => {
    const t0 = 1_000_000;

    expect(checkRateLimit('1.1.1.1', t0).allowed).toBe(true);
    expect(checkRateLimit('1.1.1.1', t0 + 1).allowed).toBe(true);
    expect(checkRateLimit('1.1.1.1', t0 + 2).allowed).toBe(true);

    const r = checkRateLimit('1.1.1.1', t0 + 3);

    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(3500);
    expect(checkRateLimit('2.2.2.2', t0 + 3).allowed).toBe(true);
    expect(checkRateLimit('1.1.1.1', t0 + 3600 * 1000 + 1).allowed).toBe(true);
  });
});

describe('POST /api/atlas/session', () => {
  // Every test in here imports the route module itself, so the registry is
  // cleared around ALL of them rather than inside the one that happens to need
  // it — a reset that only runs in the last test makes the file's result depend
  // on the order vitest chose to run it in.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('mints a token whose room config dispatches atlas-web with the metadata the worker parses', async () => {
    stubLivekitEnv();

    const { POST } = await import('@/app/api/atlas/session/route');
    const req = new Request('http://localhost/api/atlas/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9', 'user-agent': 'UA' },
      body: JSON.stringify({ persona: 'landscaping', consent: true, page: 'https://business-builder.online/atlas?utm_source=meta', utm: { source: 'meta' }, fbp: 'fb.1.1.2' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body.url).toBe('wss://eve.center/atlas-voice');
    expect(body.sessionId).toMatch(/^web-/);

    const { claims, meta } = await dispatchMetadata(body.token);

    expect(claims.video?.room).toBe(body.sessionId);
    // The visitor identity prefix is load-bearing: browser and worker both use
    // it to tell the human's captions apart from the agent's.
    expect(claims.sub).toMatch(/^visitor-/);
    // A microphone and the data channel, and nothing else. `canPublish: true`
    // on its own also licences CAMERA and SCREEN_SHARE, which would let a
    // visitor push video into a room the worker records and a human reviews.
    //
    // Asserted as the WIRE value the media server reads, not as the SDK's
    // TrackSource enum member: the SDK serialises TrackSource.MICROPHONE into
    // the token as the string 'microphone', and the string is what LiveKit
    // enforces.
    expect(claims.video?.canPublish).toBe(true);
    expect(claims.video?.canPublishData).toBe(true);
    expect(claims.video?.canPublishSources).toEqual(['microphone']);
    // The SDK stamps `nbf` (not `iat`), so the 10-minute TTL the brief pins is
    // exactly exp - nbf.
    expect(claims.exp! - claims.nbf!).toBe(600);
    expect(claims.roomConfig?.agents[0]?.agentName).toBe('atlas-web');
    // The room dies a minute after the last participant leaves, and only the
    // visitor plus the agent may ever be in it.
    expect(claims.roomConfig?.emptyTimeout).toBe(60);
    expect(claims.roomConfig?.maxParticipants).toBe(2);
    // Room metadata and dispatch metadata are the same bytes.
    expect(claims.roomConfig?.metadata).toBe(claims.roomConfig?.agents[0]?.metadata);

    expect(meta).toMatchObject({ v: 1, session_id: body.sessionId, persona: 'landscaping', event_id: body.eventId });
    expect(meta.consent.ts).toBeTruthy();
    expect(meta.consent.ip_sha256).toHaveLength(64);
    expect(meta.client).toMatchObject({ ip: '9.9.9.9', ua: 'UA', fbp: 'fb.1.1.2', page: 'https://business-builder.online/atlas?utm_source=meta', utm: { source: 'meta' } });
  });

  it('trusts x-real-ip over x-forwarded-for, and the last forwarded entry over the first', async () => {
    stubLivekitEnv();

    const { POST } = await import('@/app/api/atlas/session/route');
    const call = (headers: Record<string, string>) =>
      POST(new Request('http://localhost/api/atlas/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({ persona: 'landscaping', consent: true, page: 'p' }),
      }));

    // nginx set x-real-ip from the socket peer; the forwarded list is whatever
    // the caller claimed plus our edge. x-real-ip wins outright.
    const realIpRes = await call({ 'x-real-ip': '5.5.5.5', 'x-forwarded-for': '1.2.3.4, 6.6.6.6' });

    expect(realIpRes.status).toBe(200);
    expect((await dispatchMetadata((await realIpRes.json()).token)).meta.client.ip).toBe('5.5.5.5');

    // No x-real-ip: '1.2.3.4' is the client's own forgery at the front of the
    // list, '7.7.7.7' is what our proxy appended. The last entry wins.
    const forwardedRes = await call({ 'x-forwarded-for': '1.2.3.4, 7.7.7.7' });

    expect(forwardedRes.status).toBe(200);
    expect((await dispatchMetadata((await forwardedRes.json()).token)).meta.client.ip).toBe('7.7.7.7');
  });

  it('buckets a request with no proxy headers under "unknown" and never hashes an empty string', async () => {
    stubLivekitEnv();

    const { POST } = await import('@/app/api/atlas/session/route');
    const res = await POST(new Request('http://localhost/api/atlas/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ persona: 'landscaping', consent: true, page: 'p' }),
    }));

    expect(res.status).toBe(200);

    const { meta } = await dispatchMetadata((await res.json()).token);

    expect(meta.client.ip).toBeNull();
    expect(meta.consent.ip_sha256).toBe(createHash('sha256').update('unknown').digest('hex'));
    expect(meta.consent.ip_sha256).not.toBe(createHash('sha256').update('').digest('hex'));
  });

  it('rate limits the fourth session from one ip, and says so in the log', async () => {
    stubLivekitEnv();

    const { logger } = await import('@/libs/Logger');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const { POST } = await import('@/app/api/atlas/session/route');
    const call = () =>
      POST(new Request('http://localhost/api/atlas/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '8.8.8.8' },
        body: JSON.stringify({ persona: 'restaurant', consent: true, page: 'p' }),
      }));

    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(200);
    expect(warn).not.toHaveBeenCalled();

    const blocked = await call();

    expect(blocked.status).toBe(429);
    expect((await blocked.json()).reason).toBe('rate_limited');
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(3500);

    // A silent refusal is indistinguishable from a demo nobody tried. The line
    // names the route and carries the HASHED address — never the address.
    expect(warn).toHaveBeenCalledTimes(1);

    const [fields, message] = warn.mock.calls[0] as unknown as [Record<string, unknown>, string];

    expect(message).toBe('atlas/session: rate limited — refusing');
    expect(fields.route).toBe('atlas/session');
    expect(fields.ip_sha256).toBe(createHash('sha256').update('8.8.8.8').digest('hex'));
    expect(JSON.stringify(fields)).not.toContain('8.8.8.8');
  });

  it('answers the honeypot like an outage but says so loudly in the log', async () => {
    stubLivekitEnv();

    const { logger } = await import('@/libs/Logger');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const { POST } = await import('@/app/api/atlas/session/route');
    const res = await POST(new Request('http://localhost/api/atlas/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '4.4.4.4' },
      body: JSON.stringify({ persona: 'landscaping', consent: true, page: 'https://business-builder.online/atlas', website: 'https://spam.example' }),
    }));

    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe('voice_not_configured');
    expect(warn).toHaveBeenCalledWith(
      { ip: '4.4.4.4', page: 'https://business-builder.online/atlas' },
      'atlas/session: honeypot tripped — refusing',
    );
  });

  it('returns a fixed 400 sentence for a malformed body and logs the detail', async () => {
    stubLivekitEnv();

    const { logger } = await import('@/libs/Logger');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const { POST } = await import('@/app/api/atlas/session/route');

    const notJson = await POST(new Request('http://localhost/api/atlas/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json at all',
    }));

    expect(notJson.status).toBe(400);
    expect((await notJson.json()).error).toBe('That request was not valid. Refresh the page and try again, or call the live line.');

    const badSchema = await POST(new Request('http://localhost/api/atlas/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ persona: 'crypto', consent: false, page: '' }),
    }));

    expect(badSchema.status).toBe(400);

    const badBody = await badSchema.json();

    // One fixed sentence — never the raw zod message, which would hand a caller
    // our field names.
    expect(badBody.error).toBe('That request was not valid. Refresh the page and try again, or call the live line.');
    expect(JSON.stringify(badBody)).not.toContain('persona');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('returns 503 voice_not_configured without livekit env', async () => {
    vi.stubEnv('LIVEKIT_URL', '');
    vi.stubEnv('LIVEKIT_API_KEY', '');
    vi.stubEnv('LIVEKIT_API_SECRET', '');

    const { POST } = await import('@/app/api/atlas/session/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ persona: 'landscaping', consent: true, page: 'p' }) }));

    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe('voice_not_configured');
  });
});
