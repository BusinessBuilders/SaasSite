// @vitest-environment node
// The token this route mints is the ONLY channel from the site to the Atlas
// worker on MagicCat, so the metadata shape asserted here is a cross-repo
// contract: `parse_job_metadata` on the Python side asserts the same keys.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetRateLimitForTests, checkRateLimit } from '@/app/api/atlas/session/rateLimit';
import { atlasSessionSchema } from '@/app/api/atlas/session/schema';

describe('atlas session schema', () => {
  it('requires consent and a known persona', () => {
    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: true, page: 'https://business-builder.online/atlas' }).success).toBe(true);
    expect(atlasSessionSchema.safeParse({ persona: 'landscaping', consent: false, page: 'x' }).success).toBe(false);
    expect(atlasSessionSchema.safeParse({ persona: 'crypto', consent: true, page: 'x' }).success).toBe(false);
  });
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
  it('mints a token whose room config dispatches atlas-web with the metadata the worker parses', async () => {
    vi.stubEnv('LIVEKIT_URL', 'wss://eve.center/atlas-voice');
    vi.stubEnv('LIVEKIT_API_KEY', 'APIkey');
    vi.stubEnv('LIVEKIT_API_SECRET', 'secretsecretsecretsecretsecretsecret');
    _resetRateLimitForTests();
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

    const { TokenVerifier } = await import('livekit-server-sdk');
    const claims = await new TokenVerifier('APIkey', 'secretsecretsecretsecretsecretsecret').verify(body.token);

    expect(claims.video?.room).toBe(body.sessionId);
    // The visitor identity prefix is load-bearing: browser and worker both use
    // it to tell the human's captions apart from the agent's.
    expect(claims.sub).toMatch(/^visitor-/);

    const agents = claims.roomConfig?.agents ?? [];

    expect(agents[0]?.agentName).toBe('atlas-web');

    const meta = JSON.parse(agents[0]!.metadata);

    expect(meta).toMatchObject({ v: 1, session_id: body.sessionId, persona: 'landscaping', event_id: body.eventId });
    expect(meta.consent.ts).toBeTruthy();
    expect(meta.consent.ip_sha256).toHaveLength(64);
    expect(meta.client).toMatchObject({ ip: '9.9.9.9', ua: 'UA', fbp: 'fb.1.1.2', page: 'https://business-builder.online/atlas?utm_source=meta', utm: { source: 'meta' } });
  });

  it('rate limits the fourth session from one ip', async () => {
    vi.stubEnv('LIVEKIT_URL', 'wss://eve.center/atlas-voice');
    vi.stubEnv('LIVEKIT_API_KEY', 'APIkey');
    vi.stubEnv('LIVEKIT_API_SECRET', 'secretsecretsecretsecretsecretsecret');
    _resetRateLimitForTests();
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

    const blocked = await call();

    expect(blocked.status).toBe(429);
    expect((await blocked.json()).reason).toBe('rate_limited');
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(3500);
  });

  it('returns 503 voice_not_configured without livekit env', async () => {
    vi.stubEnv('LIVEKIT_URL', '');
    vi.stubEnv('LIVEKIT_API_KEY', '');
    vi.stubEnv('LIVEKIT_API_SECRET', '');
    vi.resetModules();
    const { POST } = await import('@/app/api/atlas/session/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ persona: 'landscaping', consent: true, page: 'p' }) }));

    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe('voice_not_configured');
  });
});
