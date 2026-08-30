import type { LocalePrefix } from 'node_modules/next-intl/dist/types/src/routing/types';

import { BILLING_INTERVAL, type ManagedPlan, type PricingPlan } from '@/types/Subscription';

const localePrefix = 'as-needed' as LocalePrefix;

export const AppConfig = {
  name: 'Business Builder',
  locales: [
    {
      id: 'en',
      name: 'English',
    },
    { id: 'fr', name: 'Français' },
  ],
  defaultLocale: 'en',
  localePrefix,
  siteUrl: 'https://business-builder.online',
};

export const AllLocales = AppConfig.locales.map(locale => locale.id);

// Self-service platform plans
export const PLAN_ID = {
  FREE: 'free',
  STARTER: 'starter',
  GROWTH: 'growth',
  PRO: 'pro',
} as const;

// Done-for-you managed service plans
export const MANAGED_PLAN_ID = {
  ESSENTIALS: 'essentials',
  GROWTH_MANAGED: 'growth_managed',
  ENTERPRISE: 'enterprise',
} as const;

export const PricingPlanList: Record<string, PricingPlan> = {
  [PLAN_ID.STARTER]: {
    id: PLAN_ID.STARTER,
    price: 20,
    interval: BILLING_INTERVAL.MONTH,
    testPriceId: '',
    devPriceId: '',
    prodPriceId: process.env.STRIPE_PRICE_STARTER || '',
    features: {
      aiTokens: 500,
      socialPlatforms: 1,
      website: 1,
      storage: 1,
      customDomain: false,
      scheduling: true,
    },
  },
  [PLAN_ID.GROWTH]: {
    id: PLAN_ID.GROWTH,
    price: 49,
    interval: BILLING_INTERVAL.MONTH,
    testPriceId: '',
    devPriceId: '',
    prodPriceId: process.env.STRIPE_PRICE_GROWTH || '',
    features: {
      aiTokens: 2000,
      socialPlatforms: 3,
      website: 2,
      storage: 5,
      customDomain: true,
      scheduling: true,
    },
  },
  [PLAN_ID.PRO]: {
    id: PLAN_ID.PRO,
    price: 99,
    interval: BILLING_INTERVAL.MONTH,
    testPriceId: '',
    devPriceId: '',
    prodPriceId: process.env.STRIPE_PRICE_PRO || '',
    features: {
      aiTokens: 10000,
      socialPlatforms: 5,
      website: 5,
      storage: 20,
      customDomain: true,
      scheduling: true,
    },
  },
};

export const ManagedPlanList: Record<string, ManagedPlan> = {
  [MANAGED_PLAN_ID.ESSENTIALS]: {
    id: MANAGED_PLAN_ID.ESSENTIALS,
    price: 99,
    interval: BILLING_INTERVAL.MONTH,
    calendlyLink: 'https://calendly.com/donovan-business-builder/15minute',
    features: {
      teamMember: 1,
      website: 2,
      storage: 1,
      socialPlatforms: 1,
    },
  },
  [MANAGED_PLAN_ID.GROWTH_MANAGED]: {
    id: MANAGED_PLAN_ID.GROWTH_MANAGED,
    price: 249,
    interval: BILLING_INTERVAL.MONTH,
    calendlyLink: 'https://calendly.com/donovan-business-builder/15minute',
    features: {
      teamMember: 1,
      website: 2,
      storage: 3,
      transfer: 1,
      socialPlatforms: 3,
    },
  },
  [MANAGED_PLAN_ID.ENTERPRISE]: {
    id: MANAGED_PLAN_ID.ENTERPRISE,
    price: 499,
    interval: BILLING_INTERVAL.MONTH,
    calendlyLink: 'https://calendly.com/donovan-business-builder/15minute',
    features: {
      teamMember: 1,
      website: 4,
      storage: 4,
      transfer: 3,
      socialPlatforms: 4,
      customVideo: 3,
    },
  },
};

// ─── Ad Services (one-time done-for-you packages) ─────────────────────────
export const AD_SERVICE_TIER = {
  STATIC: 'static',
  COMBO: 'combo',
  MOTION: 'motion',
} as const;

export type AdServiceTier = typeof AD_SERVICE_TIER[keyof typeof AD_SERVICE_TIER];

export type AdServiceTierConfig = {
  id: AdServiceTier;
  /** Display name shown on the page (e.g. "The Static"). */
  name: string;
  /** One-time setup price in USD. */
  price: number;
  /** Marketing copy under the price. */
  setupLabel: string;
  /** Color theme key for the tier card. */
  accent: 'teal' | 'orange' | 'gold';
  /** Whether this tier is the "featured" (orange-ring, sticker) middle option. */
  featured: boolean;
};

export const AdServicesTierList: Record<AdServiceTier, AdServiceTierConfig> = {
  [AD_SERVICE_TIER.STATIC]: {
    id: AD_SERVICE_TIER.STATIC,
    name: 'The Static',
    price: 899,
    setupLabel: 'SETUP & DESIGN',
    accent: 'teal',
    featured: false,
  },
  [AD_SERVICE_TIER.COMBO]: {
    id: AD_SERVICE_TIER.COMBO,
    name: 'The Combo',
    price: 1499,
    setupLabel: 'SETUP & DESIGN',
    accent: 'orange',
    featured: true,
  },
  [AD_SERVICE_TIER.MOTION]: {
    id: AD_SERVICE_TIER.MOTION,
    name: 'The Motion',
    price: 2499,
    setupLabel: 'SETUP & PRODUCTION',
    accent: 'gold',
    featured: false,
  },
};
