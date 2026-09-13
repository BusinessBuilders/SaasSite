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

const clientIp = (req: Request) =>
  (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = atlasSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request.' },
      { status: 400 },
    );
  }

  // Honeypot tripped: answer exactly like an unconfigured deployment so a bot
  // learns nothing, and never spend a LiveKit room on it.
  if (parsed.data.website) {
    return NextResponse.json(
      { error: 'The voice demo is offline right now.', reason: 'voice_not_configured' },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(ip || 'unknown');
  if (!limit.allowed) {
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
      ip: ip || null,
      ua: request.headers.get('user-agent') ?? null,
      fbp: parsed.data.fbp ?? null,
      fbc: parsed.data.fbc ?? null,
      page: parsed.data.page,
      utm: parsed.data.utm ?? {},
    },
  };

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
    metadata: JSON.stringify(metadata),
    agents: [new RoomAgentDispatch({ agentName: 'atlas-web', metadata: JSON.stringify(metadata) })],
  });

  const token = await at.toJwt();
  logger.info({ sessionId, persona: parsed.data.persona }, 'atlas/session: token minted');
  return NextResponse.json({ url: env.data.LIVEKIT_URL, token, sessionId, eventId });
}
