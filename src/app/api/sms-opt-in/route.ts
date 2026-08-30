import { NextResponse } from 'next/server';

import {
  SMS_INFO_CONSENT_TEXT,
  SMS_MARKETING_CONSENT_TEXT,
} from '@/features/contact/consent';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { smsOptInSchema } from '@/models/Schema';

import { smsOptInSubmissionSchema } from './schema';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const parsed = smsOptInSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid submission.' },
      { status: 400 },
    );
  }

  // Honeypot tripped: pretend success so bots don't adapt, store nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  try {
    await db.insert(smsOptInSchema).values({
      name: parsed.data.name,
      business: parsed.data.business || null,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      // Each consent is snapshotted with the exact wording shown for it, and
      // only when that specific box was checked — never inferred from the other.
      smsConsent: parsed.data.smsConsent,
      consentText: parsed.data.smsConsent ? SMS_INFO_CONSENT_TEXT : null,
      marketingConsent: parsed.data.marketingConsent,
      marketingConsentText: parsed.data.marketingConsent
        ? SMS_MARKETING_CONSENT_TEXT
        : null,
    });
  } catch (error) {
    logger.error({ error }, 'sms-opt-in: failed to store submission');
    return NextResponse.json(
      {
        error:
          'We could not save your submission. Please call or email us instead.',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
