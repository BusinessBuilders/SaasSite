// @vitest-environment node
// The fleet tripwire polls this route. It must stay honest about a LiveKit
// deployment that lives under a PATH PREFIX (ours is wss://eve.center/atlas-voice):
// the probe has to land on <prefix>/rtc/validate, not at the server root. A
// throwaway node:http server stands in for LiveKit so we can read back the
// exact path and token the route sent.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it, vi } from 'vitest';

const LIVEKIT_KEY = 'APIkey';
const LIVEKIT_SECRET = 'secretsecretsecretsecretsecretsecret';

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
  afterEach(async () => {
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
    const res = await GET();

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
    // Short-lived on purpose: this token is thrown away the moment the probe
    // returns.
    expect(claims.exp! - claims.nbf!).toBe(60);
  });

  it('reports reachable when LiveKit accepts the token', async () => {
    const fake = await startFakeLivekit(200);
    stubEnvFor(fake.port);

    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, livekit: 'reachable' });
  });

  it('goes red with the http status when LiveKit rejects the token', async () => {
    const fake = await startFakeLivekit(401);
    stubEnvFor(fake.port);

    const { GET } = await import('@/app/api/atlas/health/route');
    const res = await GET();

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
    const res = await GET();

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
    const res = await GET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, reason: 'voice_not_configured' });
  });
});
