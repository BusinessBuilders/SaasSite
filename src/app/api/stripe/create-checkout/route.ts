import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationSchema } from '@/models/Schema';
import { AppConfig, PLAN_ID, PricingPlanList } from '@/utils/AppConfig';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Get the correct price ID based on environment, with env var override
const getPriceId = (planId: string) => {
  // Check for env var override first
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
  } else if (Env.BILLING_PLAN_ENV === 'dev') {
    return plan.devPriceId;
  }
  return plan.prodPriceId;
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a checkout session' },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const planId = body.planId || PLAN_ID.STARTER;

    const priceId = getPriceId(planId);
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan or price ID not configured' },
        { status: 400 },
      );
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId: string | undefined;
    const existingOrg = await db
      .select()
      .from(organizationSchema)
      .where(eq(organizationSchema.id, userId));

    if (existingOrg[0]?.stripeCustomerId) {
      stripeCustomerId = existingOrg[0].stripeCustomerId;
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0]?.emailAddress,
        metadata: { clerkUserId: userId },
      });
      stripeCustomerId = customer.id;

      // Upsert the org record with the new customer ID
      if (existingOrg.length) {
        await db
          .update(organizationSchema)
          .set({ stripeCustomerId: customer.id })
          .where(eq(organizationSchema.id, userId));
      } else {
        await db
          .insert(organizationSchema)
          .values({ id: userId, stripeCustomerId: customer.id });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${AppConfig.siteUrl}/dashboard/billing?success=true`,
      cancel_url: `${AppConfig.siteUrl}/pricing?canceled=true`,
      client_reference_id: userId,
      subscription_data: {
        metadata: { clerkUserId: userId, planId },
      },
      metadata: { clerkUserId: userId, planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[stripe-checkout] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
