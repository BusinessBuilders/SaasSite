import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

// Initialize Stripe with correct API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20', // Changed to current valid version
});

// Webhook handler function
export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // Get raw body
    const signature = req.headers.get('stripe-signature') as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err: any) {
      console.error('Invalid Stripe Signature:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle Stripe events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // eslint-disable-next-line no-console
      console.log('✅ Checkout completed:', session);

      if (!session.customer || !session.subscription) {
        return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
      }

      // Get subscription details to get the current_period_end
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription.toString(),
      );

      // Extract the period end as a number (Unix timestamp in seconds)
      const periodEnd = subscription.current_period_end;

      // Check if the organization exists
      const existingOrg = await db
        .select()
        .from(organizationSchema)
        .where(eq(organizationSchema.id, session.client_reference_id || ''));

      if (existingOrg.length) {
        // Update existing record
        await db
          .update(organizationSchema)
          .set({
            stripeCustomerId: session.customer.toString(),
            stripeSubscriptionId: session.subscription.toString(),
            stripeSubscriptionPriceId: session.metadata?.priceId || '',
            stripeSubscriptionCurrentPeriodEnd: periodEnd, // Use the defined variable
          })
          .where(eq(organizationSchema.id, session.client_reference_id || ''));
      } else {
        // Insert new record
        await db.insert(organizationSchema).values({
          id: session.client_reference_id || '',
          stripeCustomerId: session.customer.toString(),
          stripeSubscriptionId: session.subscription.toString(),
          stripeSubscriptionPriceId: session.metadata?.priceId || '',
          stripeSubscriptionCurrentPeriodEnd: periodEnd, // Use the defined variable
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
