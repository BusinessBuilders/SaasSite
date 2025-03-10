import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { AppConfig, PricingPlanList, PLAN_ID } from '@/utils/AppConfig';
import { Env } from '@/libs/Env';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

// Helper to get the correct price ID based on environment
const getPriceId = (planId: string) => {
  const plan = PricingPlanList[planId];
  if (!plan) return null;

  if (Env.BILLING_PLAN_ENV === 'test') {
    return plan.testPriceId;
  } else if (Env.BILLING_PLAN_ENV === 'dev') {
    return plan.devPriceId;
  } else {
    return plan.prodPriceId;
  }
};

export async function POST(req: Request) {
  console.log("🚀 Stripe Checkout API Hit"); // ✅ Log API request

  try {
    // Get the authenticated user
    const { userId, orgId } = auth();
    const user = await currentUser();

    console.log("👤 Authenticated User:", { userId, orgId });

    if (!userId || !user) {
      console.warn("⚠️ Unauthorized request to Stripe Checkout");
      return NextResponse.json(
        { error: 'You must be logged in to create a checkout session' },
        { status: 401 }
      );
    }

    // Get the requested plan ID from the request body
    const body = await req.json().catch(() => ({}));
    const planId = body.planId || PLAN_ID.PREMIUM;
    console.log("📦 Selected Plan:", planId);

    // Get the price ID based on the plan and environment
    const priceId = getPriceId(planId);
    if (!priceId) {
      console.error("❌ Invalid plan or missing price ID:", planId);
      return NextResponse.json(
        { error: 'Invalid plan or price ID not configured' },
        { status: 400 }
      );
    }

    // Create a Stripe checkout session
    console.log("💳 Creating Stripe Checkout Session...");
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${AppConfig.siteUrl}/dashboard?success=true`,
      cancel_url: `${AppConfig.siteUrl}?canceled=true`,
      customer_email: user.emailAddresses[0]?.emailAddress,
      client_reference_id: userId,
      subscription_data: {
        metadata: { userId, orgId: orgId || '', planId },
      },
      metadata: { userId, orgId: orgId || '', planId },
    });

    console.log("✅ Stripe Checkout Session Created:", session.url);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("🔥 Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
