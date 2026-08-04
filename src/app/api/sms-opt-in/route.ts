import { NextResponse } from 'next/server';
import { z } from 'zod';

import { SMS_CONSENT_TEXT } from '@/features/contact/consent';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { smsOptInSchema } from '@/models/Schema';

const submissionSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    business: z.string().trim().max(200).optional().or(z.literal('')),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    message: z.string().trim().max(5000).optional().or(z.literal('')),
    smsConsent: z.boolean(),
    // Honeypot — real users never see or fill this field. Accept any value
    // here so a filled honeypot reaches the fake-success branch below instead
    // of returning a validation error bots could learn from.
    website: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    data => !data.smsConsent || (data.phone && data.phone.length >= 10),
    {
      message: 'A phone number is required to opt in to text messages.',
      path: ['phone'],
    },
  );

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

  const parsed = submissionSchema.safeParse(body);
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
      smsConsent: parsed.data.smsConsent,
      consentText: parsed.data.smsConsent ? SMS_CONSENT_TEXT : null,
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
