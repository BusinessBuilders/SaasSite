// Mints the visitor's LiveKit token. The token's room configuration carries the
// agent dispatch (agent_name atlas-web) and the session metadata the worker on
// MagicCat parses — this is the ONLY channel from the site to the worker, so
// its shape is pinned by tests on both sides. Nothing here touches the media.
import { createHash, randomUUID } from 'node:crypto';

import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/libs/Logger';

import { checkRateLimit } from './rateLimit';
import { atlasSessionSchema } from './schema';

// Read straight from process.env behind a local parse rather than from the
// t3-env module: the LiveKit vars are optional there, and a missing one has to
// surface as a loud 503 at request time, never as a crash at import/build time.
const livekitEnv = z.object({
  LIVEKIT_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
});

const INVALID_REQUEST = 'That request was not valid. Refresh the page and try again, or call the live line.';

// Which proxy writes which header, and why the LAST forwarded entry is the one
// we trust:
//   * `x-real-ip` — set by OUR nginx from the TCP peer address it sees. A
//     client cannot forge it, because nginx overwrites whatever arrived. First
//     choice, always.
//   * `x-forwarded-for` — each proxy APPENDS to this list, so a value the
//     client invented sits at the FRONT and our own edge's entry is at the
//     BACK. Reading the leftmost entry (the usual mistake) lets anyone pick
//     their own rate-limit bucket and forge the consent IP; the last entry is
//     the only one written by infrastructure we control.
//   * neither — a direct hit (curl on localhost, a test). We bucket those under
//     the literal 'unknown' so the limiter still counts them and the consent
//     digest is never the hash of an empty string.
const clientIp = (req: Request): string => {
  const realIp = req.headers.get('x-real-ip')?.trim();

  if (realIp) {
    return realIp;
  }

  const forwarded = req.headers.get('x-forwarded-for')?.split(',') ?? [];

  return forwarded[forwarded.length - 1]?.trim() || 'unknown';
};

export async function POST(request: Request) {
  const env = livekitEnv.safeParse({
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  });

  if (!env.success) {
    logger.error(
      { issues: env.error.issues.map(i => i.path.join('.')) },
      'atlas/session: LiveKit env is not configured — the voice demo is OFFLINE',
    );

    return NextResponse.json(
      { error: 'The voice demo is offline right now.', reason: 'voice_not_configured' },
      { status: 503 },
    );
  }

  const ip = clientIp(request);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    logger.warn({ ip }, 'atlas/session: request body was not JSON — refusing');

    return NextResponse.json({ error: INVALID_REQUEST }, { status: 400 });
  }

  const parsed = atlasSessionSchema.safeParse(body);

  if (!parsed.success) {
    // The visitor gets one fixed sentence; the detail goes to the log, so a
    // malformed field never leaks our schema back to the caller.
    logger.warn({ ip, issues: parsed.error.issues }, 'atlas/session: invalid request body — refusing');

    return NextResponse.json({ error: INVALID_REQUEST }, { status: 400 });
  }

  // Honeypot tripped — ANY non-empty value means a bot filled a field no real
  // visitor can see. Answer exactly like an unconfigured deployment so the bot
  // learns nothing, never spend a LiveKit room on it, but say so loudly in the
  // log: otherwise this is wire-identical to a real outage and nobody can tell
  // a bot storm from a broken media server.
  if (parsed.data.website) {
    logger.warn({ ip, page: parsed.data.page }, 'atlas/session: honeypot tripped — refusing');

    return NextResponse.json(
      { error: 'The voice demo is offline right now.', reason: 'voice_not_configured' },
      { status: 503 },
    );
  }

  const limit = checkRateLimit(ip);

  if (!limit.allowed) {
    // A refusal that leaves no trace is indistinguishable from a demo nobody
    // tried. The address is hashed, not written down: the log is for counting
    // and correlating, not for keeping visitors' IPs.
    logger.warn(
      {
        route: 'atlas/session',
        ip_sha256: createHash('sha256').update(ip).digest('hex'),
        retryAfterSec: limit.retryAfterSec,
      },
      'atlas/session: rate limited — refusing',
    );

    return NextResponse.json(
      {
        error: 'You have started several sessions recently. Please try again later or call the live line.',
        reason: 'rate_limited',
      },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSec) } },
    );
  }

  const sessionId = `web-${randomUUID()}`;
  const eventId = randomUUID();
  const metadata = {
    v: 1,
    session_id: sessionId,
    persona: parsed.data.persona,
    event_id: eventId,
    consent: {
      ts: new Date().toISOString(),
      ip_sha256: createHash('sha256').update(ip).digest('hex'),
    },
    client: {
      // `null`, not the 'unknown' bucket label: downstream (Meta CAPI) must be
      // able to tell "we have no IP for this visitor" from a real address.
      ip: ip === 'unknown' ? null : ip,
      ua: request.headers.get('user-agent') ?? null,
      fbp: parsed.data.fbp ?? null,
      fbc: parsed.data.fbc ?? null,
      page: parsed.data.page,
      utm: parsed.data.utm ?? {},
    },
  };
  // One serialization, used for both the room metadata and the agent dispatch
  // metadata — they must be byte-identical.
  const metaJson = JSON.stringify(metadata);

  // `visitor-` prefix is load-bearing: the browser and the worker both use it
  // to tell the human's captions apart from the agent's.
  const at = new AccessToken(env.data.LIVEKIT_API_KEY, env.data.LIVEKIT_API_SECRET, {
    identity: `visitor-${eventId.slice(0, 8)}`,
    name: 'Visitor',
    ttl: '10m',
  });
  at.addGrant({
    room: sessionId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: false,
  });
  at.roomConfig = new RoomConfiguration({
    name: sessionId,
    emptyTimeout: 60,
    maxParticipants: 2,
    metadata: metaJson,
    agents: [new RoomAgentDispatch({ agentName: 'atlas-web', metadata: metaJson })],
  });

  const token = await at.toJwt();

  logger.info({ sessionId, persona: parsed.data.persona }, 'atlas/session: token minted');

  return NextResponse.json({ url: env.data.LIVEKIT_URL, token, sessionId, eventId });
}
