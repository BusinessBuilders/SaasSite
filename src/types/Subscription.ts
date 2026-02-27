import type { MANAGED_PLAN_ID, PLAN_ID } from '@/utils/AppConfig';

import type { EnumValues } from './Enum';

export type PlanId = EnumValues<typeof PLAN_ID>;
export type ManagedPlanId = EnumValues<typeof MANAGED_PLAN_ID>;

export const BILLING_INTERVAL = {
  MONTH: 'month',
  YEAR: 'year',
} as const;

export type BillingInterval = EnumValues<typeof BILLING_INTERVAL>;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  FREE: 'free',
} as const;

export type PricingPlan = {
  id: PlanId;
  price: number;
  interval: BillingInterval;
  testPriceId: string;
  devPriceId: string;
  prodPriceId: string;
  features: {
    teamMember?: number;
    website?: number;
    storage?: number;
    transfer?: number;
    aiTokens?: number;
    socialPlatforms?: number;
    customDomain?: boolean;
    scheduling?: boolean;
  };
};

export type ManagedPlan = {
  id: ManagedPlanId;
  price: number;
  interval: BillingInterval;
  calendlyLink: string;
  features: {
    teamMember?: number;
    website?: number;
    storage?: number;
    transfer?: number;
    socialPlatforms?: number;
    customVideo?: number;
  };
};

export type IStripeSubscription = {
  stripeSubscriptionId: string | null;
  stripeSubscriptionPriceId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeSubscriptionCurrentPeriodEnd: number | null;
};

export type PlanDetails =
  | {
    isPaid: true;
    plan: PricingPlan;
    stripeDetails: IStripeSubscription;
  } | {
    isPaid: false;
    plan: PricingPlan;
    stripeDetails?: undefined;
  };
