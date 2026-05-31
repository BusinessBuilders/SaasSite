// src/app/api/stripe/create-checkout/route.ts
import { randomUUID } from 'node:crypto';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationSchema } from '@/models/Schema';
import {
  AD_SERVICE_TIER,
  type AdServiceTier,
  PLAN_ID,
  PricingPlanList,
} from '@/utils/AppConfig';

import { checkoutRequestSchema } from './schema';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const getSubscriptionPriceId = (planId: string) => {
  const envOverrides: Record<string, string | undefined> = {
    [PLAN_ID.STARTER]: Env.STRIPE_PRICE_STARTER,
    [PLAN_ID.GROWTH]: Env.STRIPE_PRICE_GROWTH,
    [PLAN_ID.PRO]: Env.STRIPE_PRICE_PRO,
  };
  if (envOverrides[planId]) {
    return envOverrides[planId];
  }
  const plan = PricingPlanList[planId];
  if (!plan) {
    return null;
  }
  if (Env.BILLING_PLAN_ENV === 'test') {
    return plan.testPriceId;
  }
  if (Env.BILLING_PLAN_ENV === 'dev') {
    return plan.devPriceId;
  }
  return plan.prodPriceId;
};

const getAdServicePriceId = (tier: AdServiceTier) => ({
  [AD_SERVICE_TIER.STATIC]: Env.STRIPE_PRICE_AD_STATIC,
  [AD_SERVICE_TIER.COMBO]: Env.STRIPE_PRICE_AD_COMBO,
  [AD_SERVICE_TIER.MOTION]: Env.STRIPE_PRICE_AD_MOTION,
}[tier]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.format() },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // ─── Ad services: one-time payment, guest allowed ─────────────────────────
  if (parsed.data.productType === 'ad_service') {
    const { tier, locale } = parsed.data;
    const priceId = getAdServicePriceId(tier);

    const { userId } = auth();
    const user = userId ? await currentUser() : null;
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const clientReferenceId = userId ?? `ad_${randomUUID()}`;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_creation: 'always',
        customer_email: userEmail,
        phone_number_collection: { enabled: true },
        client_reference_id: clientReferenceId,
        locale: locale ?? 'auto',
        metadata: {
          productType: 'ad_service',
          tier,
          locale: locale ?? 'auto',
          clerkUserId: userId ?? '',
          generatedRef: clientReferenceId,
        },
        payment_intent_data: {
          metadata: {
            productType: 'ad_service',
            tier,
            clerkUserId: userId ?? '',
          },
        },
        success_url: `${baseUrl}/${locale ?? 'en'}/ad-services/welcome?ref={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/${locale ?? 'en'}/ad-services`,
      });
      return NextResponse.json({ url: session.url });
    } catch (err) {
      console.error('[stripe.create-checkout.ad_service]', err);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 },
      );
    }
  }

  // ─── Subscription: existing path, requires Clerk auth ─────────────────────
  const { userId } = auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to subscribe' },
      { status: 401 },
    );
  }

  const { planId } = parsed.data;
  const priceId = getSubscriptionPriceId(planId);
  if (!priceId) {
    return NextResponse.json(
      { error: 'Invalid plan or price ID not configured' },
      { status: 400 },
    );
  }

  let stripeCustomerId: string | null = null;
  const orgRows = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, userId));
  stripeCustomerId = orgRows[0]?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const email = user.emailAddresses?.[0]?.emailAddress;
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkUserId: userId },
    });
    stripeCustomerId = customer.id;
    if (orgRows[0]) {
      await db
        .update(organizationSchema)
        .set({ stripeCustomerId })
        .where(eq(organizationSchema.id, userId));
    } else {
      await db
        .insert(organizationSchema)
        .values({ id: userId, stripeCustomerId });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { productType: 'subscription', planId, clerkUserId: userId },
      success_url: `${baseUrl}/dashboard/billing?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe.create-checkout.subscription]', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
