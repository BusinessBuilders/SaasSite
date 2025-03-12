import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema'; // ✅ Correct schema
import { AppConfig } from '@/utils/AppConfig';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export async function POST() {
  try {
    // Get the authenticated user
    const { userId, orgId } = auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to access the customer portal' },
        { status: 401 },
      );
    }

    // Find the organization's subscription in the database
    const organization = await db
      .select()
      .from(organizationSchema)
      .where(
        orgId
          ? eq(organizationSchema.id, orgId) // Search by organization ID
          : eq(organizationSchema.id, userId), // Fallback to user ID (if applicable)
      );

    // Ensure we got a valid organization
    const orgRecord = organization[0]; // Extract first record safely
    if (!orgRecord || !orgRecord.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found for this user' },
        { status: 404 },
      );
    }

    // Get the Stripe customer ID
    const customerId = orgRecord.stripeCustomerId;

    // Create a Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${AppConfig.siteUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 },
    );
  }
}
