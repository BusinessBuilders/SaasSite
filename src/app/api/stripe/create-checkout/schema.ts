import { z } from 'zod';

import { AD_SERVICE_TIER, PLAN_ID } from '@/utils/AppConfig';

// Discriminated union: subscription requires planId; ad_service requires tier.
// We use this to (a) validate the POST body, (b) drive different Stripe Checkout
// shapes, and (c) discriminate behavior in the webhook via session.metadata.
export const checkoutRequestSchema = z.discriminatedUnion('productType', [
  z.object({
    productType: z.literal('subscription'),
    planId: z.enum([PLAN_ID.STARTER, PLAN_ID.GROWTH, PLAN_ID.PRO] as const),
  }),
  z.object({
    productType: z.literal('ad_service'),
    tier: z.enum([
      AD_SERVICE_TIER.STATIC,
      AD_SERVICE_TIER.COMBO,
      AD_SERVICE_TIER.MOTION,
    ] as const),
    /** Optional locale for Stripe Checkout UI localization. */
    locale: z.enum(['en', 'fr']).optional(),
  }),
]);

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
