// @vitest-environment node
// The fleet tripwire polls this route. It must stay honest about a LiveKit
// deployment that lives under a PATH PREFIX (ours is wss://eve.center/atlas-voice):
// the probe has to land on <prefix>/rtc/validate, not at the server root. A
// throwaway node:http server stands in for LiveKit so we can read back the
// exact path and token the route sent.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetRateLimitForTests, HEALTH_MAX_PER_WINDOW } from '@/app/api/atlas/session/rateLimit';

const LIVEKIT_KEY = 'APIkey';
const LIVEKIT_SECRET = 'secretsecretsecretsecretsecretsecret';

/**
 * The route now reads the caller's address (it is rate limited), so every call
 * needs a Request. A bare one buckets under 'unknown'; pass an ip to get a
 * bucket of your own.
 */
const healthRequest = (ip?: string) =>
  new Request('http://localhost/api/atlas/health', ip ? { headers: { 'x-real-ip': ip } } : undefined);

let server: Server | undefined;

type FakeLivekit = { port: number; requests: string[] };

/** Stands in for the LiveKit media server, answering /rtc/validate with `status`. */
const startFakeLivekit = async (status: number): Promise<FakeLivekit> => {
  const requests: string[] = [];

  server = createServer((req, res) => {
    requests.push(req.url ?? '');
    res.writeHead(status, { 'content-type': 'text/plain' });
    res.end(status === 200 ? 'success' : 'unauthorized');
  });

  await new Promise<void>((resolve) => {
    server!.listen(0, '127.0.0.1', resolve);
  });

  return { port: (server!.address() as AddressInfo).port, requests };
};

const stubEnvFor = (port: number) => {
  // A path prefix on purpose — the whole point of the finding this test covers.
  vi.stubEnv('LIVEKIT_URL', `ws://127.0.0.1:${port}/atlas-voice`);
  vi.stubEnv('LIVEKIT_API_KEY', LIVEKIT_KEY);
  vi.stubEnv('LIVEKIT_API_SECRET', LIVEKIT_SECRET);
};

describe('GET /api/atlas/health', () => {
  beforeEach(() => {
    _resetRateLimitForTests();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();

    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
      server = undefined;
    }
  });

  it('probes <livekit path prefix>/rtc/validate with a signed health-probe token', async () => {
    const fake = await startFakeLivekit(200);
    stubEnvFor(fake.port);

    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET(healthRequest());

    expect(res.status).toBe(200);
    expect(fake.requests).toHaveLength(1);

    const requested = new URL(fake.requests[0]!, 'http://127.0.0.1');

    // The path prefix survives. A RoomServiceClient-style root-absolute probe
    // would have hit '/twirp/...' and missed the deployment entirely.
    expect(requested.pathname).toBe('/atlas-voice/rtc/validate');

    const accessToken = requested.searchParams.get('access_token');

    expect(accessToken).toBeTruthy();

    const { TokenVerifier } = await import('livekit-server-sdk');
    const claims = await new TokenVerifier(LIVEKIT_KEY, LIVEKIT_SECRET).verify(accessToken!);

    expect(claims.sub).toBe('health-probe');
    expect(claims.video?.room).toBe('health-probe');
    expect(claims.video?.roomJoin).toBe(true);
    // This token rides in the QUERY STRING, so it lands in access logs on every
    // hop. A copy lifted out of a log file must be able to do nothing: it may
    // join the throwaway probe room and neither speak nor listen.
    expect(claims.video?.canPublish).toBe(false);
    expect(claims.video?.canSubscribe).toBe(false);
    // Short-lived on purpose: this token is thrown away the moment the probe
    // returns.
    expect(claims.exp! - claims.nbf!).toBe(60);
  });

  it('blames our own config, not LiveKit, when the probe token cannot be signed', async () => {
    const fake = await startFakeLivekit(200);
    stubEnvFor(fake.port);

    const { AccessToken } = await import('livekit-server-sdk');

    vi.spyOn(AccessToken.prototype, 'toJwt').mockRejectedValue(new Error('unsupported secret'));

    const { logger } = await import('@/libs/Logger');
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET(healthRequest());

    expect(res.status).toBe(503);
    // Not `livekit_unreachable`: the media server was never even contacted, and
    // saying it was sends whoever reads the tripwire to the wrong machine.
    expect(await res.json()).toEqual({ ok: false, reason: 'bad_server_config' });
    expect(fake.requests).toHaveLength(0);
    expect(error.mock.calls.map(call => String(call[1])).join(' ')).toContain('could not sign a probe token');
  });

  it('reports reachable when LiveKit accepts the token', async () => {
    const fake = await startFakeLivekit(200);
    stubEnvFor(fake.port);

    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET(healthRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, livekit: 'reachable' });
  });

  it('goes red with the http status when LiveKit rejects the token', async () => {
    const fake = await startFakeLivekit(401);
    stubEnvFor(fake.port);

    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET(healthRequest());

    expect(res.status).toBe(503);
    // A 401 means our API key/secret no longer match the server — a real
    // outage for the demo, and named precisely so the alert says which kind.
    expect(await res.json()).toEqual({ ok: false, reason: 'livekit_validate_http_401' });
  });

  it('goes red with livekit_unreachable when nothing is listening', async () => {
    const fake = await startFakeLivekit(200);

    stubEnvFor(fake.port);
    await new Promise<void>((resolve) => {
      server!.close(() => resolve());
    });
    server = undefined;

    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET(healthRequest());

    expect(res.status).toBe(503);

    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.reason).toMatch(/^livekit_unreachable: /);
  });

  it('reports voice_not_configured when the LiveKit env is empty', async () => {
    vi.stubEnv('LIVEKIT_URL', '');
    vi.stubEnv('LIVEKIT_API_KEY', '');
    vi.stubEnv('LIVEKIT_API_SECRET', '');

    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET(healthRequest());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, reason: 'voice_not_configured' });
  });

  it('throttles a flood from one address with a 429, and never signs a token for it', async () => {
    const fake = await startFakeLivekit(200);
    stubEnvFor(fake.port);

    const { logger } = await import('@/libs/Logger');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const { GET } = await import('@/app/api/atlas/health/route');

    for (let i = 0; i < HEALTH_MAX_PER_WINDOW; i++) {
      const allowed = await GET(healthRequest('9.9.9.9'));

      expect(allowed.status).toBe(200);
    }

    const blocked = await GET(healthRequest('9.9.9.9'));

    // 429, not 503: the server is fine, the CALLER is the problem. A tripwire
    // reading 503 here would page someone about an outage that is not happening.
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ ok: false, reason: 'rate_limited' });
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    // The refused call never reached LiveKit — that is the whole point.
    expect(fake.requests).toHaveLength(HEALTH_MAX_PER_WINDOW);

    const [fields, message] = warn.mock.calls[0] as unknown as [Record<string, unknown>, string];

    expect(message).toBe('atlas/health: rate limited — refusing');
    expect(fields.route).toBe('atlas/health');
    expect(JSON.stringify(fields)).not.toContain('9.9.9.9');

    // A different address still gets through: the bucket is per IP.
    const other = await GET(healthRequest('8.8.8.8'));

    expect(other.status).toBe(200);
  });
});
