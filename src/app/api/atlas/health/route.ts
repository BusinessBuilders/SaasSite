// For the fleet tripwire: is the site able to mint tokens and is the media
// server answering? Does not prove the worker is registered (the worker has its
// own /health on MagicCat).
import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return NextResponse.json({ ok: false, reason: 'voice_not_configured' }, { status: 503 });
  }
  try {
    const svc = new RoomServiceClient(LIVEKIT_URL.replace(/^ws/, 'http'), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    await svc.listRooms();
    return NextResponse.json({ ok: true, livekit: 'reachable' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, reason: `livekit_unreachable: ${(error as Error).message}` },
      { status: 503 },
    );
  }
}
