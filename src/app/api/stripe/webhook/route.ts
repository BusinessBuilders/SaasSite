/* eslint-disable no-console */
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationSchema } from '@/models/Schema';
import { PricingPlanList } from '@/utils/AppConfig';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Map a Stripe price ID back to a plan name
function resolvePlanFromPriceId(priceId: string): string {
  for (const plan of Object.values(PricingPlanList)) {
    if (
      plan.prodPriceId === priceId
      || plan.devPriceId === priceId
      || plan.testPriceId === priceId
    ) {
      return plan.id;
    }
  }
  return 'starter';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, Env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[stripe-webhook] Invalid signature:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[stripe-webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[stripe-webhook] checkout.session.completed', {
          customer: session.customer,
          subscription: session.subscription,
          clientRefId: session.client_reference_id,
        });

        if (!session.customer || !session.subscription) {
          console.warn('[stripe-webhook] Missing customer or subscription in session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription.toString(),
        );
        const priceId = subscription.items.data[0]?.price.id || '';
        const plan = session.metadata?.planId || resolvePlanFromPriceId(priceId);

        const orgId = session.client_reference_id || '';
        const existingOrg = await db
          .select()
          .from(organizationSchema)
          .where(eq(organizationSchema.id, orgId));

        const updateData = {
          stripeCustomerId: session.customer.toString(),
          stripeSubscriptionId: session.subscription.toString(),
          stripeSubscriptionPriceId: priceId,
          stripeSubscriptionStatus: subscription.status,
          stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
          plan,
          subscriptionStatus: 'active' as const,
        };

        if (existingOrg.length) {
          await db
            .update(organizationSchema)
            .set(updateData)
            .where(eq(organizationSchema.id, orgId));
          console.log('[stripe-webhook] Updated org:', orgId);
        } else {
          await db.insert(organizationSchema).values({ id: orgId, ...updateData });
          console.log('[stripe-webhook] Inserted org:', orgId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer.toString();
        console.log('[stripe-webhook] subscription.updated', {
          customerId,
          status: subscription.status,
        });

        const priceId = subscription.items.data[0]?.price.id || '';
        const plan = subscription.metadata?.planId || resolvePlanFromPriceId(priceId);

        await db
          .update(organizationSchema)
          .set({
            stripeSubscriptionStatus: subscription.status,
            stripeSubscriptionPriceId: priceId,
            stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
            plan,
            subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status,
          })
          .where(eq(organizationSchema.stripeCustomerId, customerId));
        console.log('[stripe-webhook] Updated subscription for customer:', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer.toString();
        console.log('[stripe-webhook] subscription.deleted', { customerId });

        await db
          .update(organizationSchema)
          .set({
            plan: 'free',
            subscriptionStatus: 'canceled',
            stripeSubscriptionStatus: 'canceled',
          })
          .where(eq(organizationSchema.stripeCustomerId, customerId));
        console.log('[stripe-webhook] Canceled subscription for customer:', customerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer?.toString() || '';
        console.log('[stripe-webhook] invoice.payment_failed', { customerId });

        await db
          .update(organizationSchema)
          .set({ subscriptionStatus: 'past_due' })
          .where(eq(organizationSchema.stripeCustomerId, customerId));
        console.log('[stripe-webhook] Set past_due for customer:', customerId);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer?.toString() || '';
        console.log('[stripe-webhook] invoice.paid', { customerId });

        await db
          .update(organizationSchema)
          .set({ subscriptionStatus: 'active' })
          .where(eq(organizationSchema.stripeCustomerId, customerId));
        console.log('[stripe-webhook] Recovered subscription for customer:', customerId);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    // Always return 200 — never let processing errors cause Stripe to disable the webhook
    console.error(`[stripe-webhook] Processing error for ${event.type}:`, error.message);
  }

  return NextResponse.json({ received: true });
}
