import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationSchema } from '@/models/Schema';
import { AppConfig } from '@/utils/AppConfig';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function POST() {
  try {
    const { userId, orgId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to access the customer portal' },
        { status: 401 },
      );
    }

    // Try orgId first, fall back to userId
    const lookupId = orgId || userId;
    const organization = await db
      .select()
      .from(organizationSchema)
      .where(eq(organizationSchema.id, lookupId));

    const orgRecord = organization[0];
    if (!orgRecord?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe to a plan first.' },
        { status: 404 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: orgRecord.stripeCustomerId,
      return_url: `${AppConfig.siteUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[stripe-portal] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 },
    );
  }
}
