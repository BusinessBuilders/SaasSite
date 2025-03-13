import type { LocalePrefix } from 'node_modules/next-intl/dist/types/src/routing/types';

import { BILLING_INTERVAL, type PricingPlan } from '@/types/Subscription';

const localePrefix = 'as-needed' as LocalePrefix;
// FIXME: Update this configuration file based on your project information
export const AppConfig = {
  name: 'Business Builders',
  locales: [
    {
      id: 'en',
      name: 'English',
    },
    { id: 'fr', name: 'Français' },
  ],
  defaultLocale: 'en',
  localePrefix,
  siteUrl: 'https://business.builder.online',
};

export const AllLocales = AppConfig.locales.map(locale => locale.id);

export const PLAN_ID = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export const PricingPlanList: Record<string, PricingPlan> = {
  [PLAN_ID.FREE]: {
    id: PLAN_ID.FREE,
    price: 99,
    interval: BILLING_INTERVAL.MONTH,
    testPriceId: '',
    devPriceId: '',
    prodPriceId: 'price_1R2Eb1LJ1n4bAXNUorJPIjgn',
    features: {

      website: 2,
      storage: 1,

    },
  },
  [PLAN_ID.PREMIUM]: {
    id: PLAN_ID.PREMIUM,
    price: 249,
    interval: BILLING_INTERVAL.MONTH,
    testPriceId: 'price_premium_test', // Use for testing
    // FIXME: Update the price ID, you can create it after running `npm run stripe:setup-price`
    devPriceId: 'price_1PNksvKOp3DEwzQlGOXO7YBK',
    prodPriceId: 'price_1R2EgPLJ1n4bAXNUPAXw3jhj',
    features: {
      teamMember: 1,
      website: 2,
      storage: 3,
      transfer: 1,
    },
  },
  [PLAN_ID.ENTERPRISE]: {
    id: PLAN_ID.ENTERPRISE,
    price: 499,
    interval: BILLING_INTERVAL.MONTH,
    testPriceId: 'price_enterprise_test', // Use for testing
    // FIXME: Update the price ID, you can create it after running `npm run stripe:setup-price`
    devPriceId: 'price_1PNksvKOp3DEwzQli9IvXzgb',
    prodPriceId: 'price_1PNksvKOp3DEwzQlGOXO7YBK',
    features: {
      teamMember: 1,
      website: 4,
      storage: 4,
      transfer: 3,
    },
  },
};
