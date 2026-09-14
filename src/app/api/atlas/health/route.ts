// For the fleet tripwire: can this site mint a token that the media server
// actually accepts? We sign a throwaway 60-second token and hit LiveKit's
// `/rtc/validate` — the very same pre-connect check the browser SDK makes. It
// answers 200 for a valid token and 401 for a bad one, so a single call proves
// BOTH that the server is reachable at the configured address AND that our API
// key/secret pair is still good.
//
// `RoomServiceClient` is deliberately NOT used here: it builds its Twirp paths
// root-absolute (`/twirp/livekit.RoomService/ListRooms`), which throws away a
// path prefix like `/atlas-voice` and probes the wrong service — the tripwire
// would sit permanently red. `/rtc/validate` is joined onto the configured
// path, so a prefixed deployment is checked correctly.
//
// This does NOT prove the Atlas worker is registered; the worker has its own
// /health on MagicCat.
import { createHash } from 'node:crypto';

import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';

import { clientIp } from '../clientIp';
import { checkHealthRateLimit } from '../session/rateLimit';

export const dynamic = 'force-dynamic';

const PROBE_TIMEOUT_MS = 5000;

// Every unhealthy answer is logged at ERROR: a red tripwire must leave a trail
// in the logs, never just a quiet 503 body nobody reads.
const unavailable = (reason: string) => {
  logger.error({ reason }, 'atlas/health: LiveKit is NOT healthy — the voice demo is DOWN');

  return NextResponse.json({ ok: false, reason }, { status: 503 });
};

export async function GET(request: Request) {
  // This route is public and unauthenticated, and every hit signs a JWT and
  // opens a 5-second outbound connection to the media server — cheap once, a
  // free amplifier pointed at our own LiveKit at volume. Nothing polls it on a
  // schedule today (the Atlas tripwires watch the worker's loopback /health and
  // its systemd unit; the fleet check runs every 30 minutes against other
  // things), so 60 a minute per address is simply generous enough that a poller
  // added later at any cadence will not hit the cap. A refusal is a 429, never
  // a 503: the server is fine, the CALLER is the problem, and a tripwire
  // reading 503 here would page someone about an outage that is not happening.
  const ip = clientIp(request);
  const limit = checkHealthRateLimit(ip);

  if (!limit.allowed) {
    logger.warn(
      {
        route: 'atlas/health',
        ip_sha256: createHash('sha256').update(ip).digest('hex'),
        retryAfterSec: limit.retryAfterSec,
      },
      'atlas/health: rate limited — refusing',
    );

    return NextResponse.json(
      { ok: false, reason: 'rate_limited' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSec) } },
    );
  }

  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return unavailable('voice_not_configured');
  }

  // ws(s):// → http(s)://, keeping any path prefix and dropping a trailing
  // slash so the joined URL has exactly one separator.
  const base = LIVEKIT_URL.replace(/^ws/, 'http').replace(/\/+$/, '');

  // Signing happens OUTSIDE the probe's try block on purpose. Inside it, a
  // secret the SDK cannot sign with (wrong type, wrong encoding) came out
  // labelled `livekit_unreachable` — which sends whoever reads the tripwire to
  // the media server when the fault is in our own environment file.
  let token: string;

  try {
    const probe = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: 'health-probe',
      ttl: 60,
    });
    // The probe token travels in the QUERY STRING of /rtc/validate, so it lands
    // in access logs on every hop. It is granted the room and nothing else: a
    // copy lifted out of a log file can join the throwaway `health-probe` room
    // and neither speak nor listen.
    probe.addGrant({ room: 'health-probe', roomJoin: true, canPublish: false, canSubscribe: false });

    token = await probe.toJwt();
  } catch (error) {
    logger.error(
      { err: (error as Error).message },
      'atlas/health: could not sign a probe token — check LIVEKIT_API_KEY / LIVEKIT_API_SECRET',
    );

    return unavailable('bad_server_config');
  }

  try {
    const response = await fetch(`${base}/rtc/validate?access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    if (!response.ok) {
      return unavailable(`livekit_validate_http_${response.status}`);
    }

    return NextResponse.json({ ok: true, livekit: 'reachable' });
  } catch (error) {
    return unavailable(`livekit_unreachable: ${(error as Error).message}`);
  }
}
