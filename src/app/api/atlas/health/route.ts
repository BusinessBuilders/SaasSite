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
import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';

export const dynamic = 'force-dynamic';

const PROBE_TIMEOUT_MS = 5000;

// Every unhealthy answer is logged at ERROR: a red tripwire must leave a trail
// in the logs, never just a quiet 503 body nobody reads.
const unavailable = (reason: string) => {
  logger.error({ reason }, 'atlas/health: LiveKit is NOT healthy — the voice demo is DOWN');

  return NextResponse.json({ ok: false, reason }, { status: 503 });
};

export async function GET() {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return unavailable('voice_not_configured');
  }

  // ws(s):// → http(s)://, keeping any path prefix and dropping a trailing
  // slash so the joined URL has exactly one separator.
  const base = LIVEKIT_URL.replace(/^ws/, 'http').replace(/\/+$/, '');

  try {
    const probe = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: 'health-probe',
      ttl: 60,
    });
    probe.addGrant({ room: 'health-probe', roomJoin: true });

    const token = await probe.toJwt();
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
