import { describe, expect, it } from 'vitest';

import { checkoutRequestSchema } from './schema';

describe('checkoutRequestSchema', () => {
  it('accepts a valid subscription request', () => {
    const result = checkoutRequestSchema.safeParse({
      productType: 'subscription',
      planId: 'growth',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid ad_service request', () => {
    const result = checkoutRequestSchema.safeParse({
      productType: 'ad_service',
      tier: 'combo',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown productType', () => {
    const result = checkoutRequestSchema.safeParse({
      productType: 'mystery_box',
      tier: 'combo',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a subscription with an unknown planId', () => {
    const result = checkoutRequestSchema.safeParse({
      productType: 'subscription',
      planId: 'platinum',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an ad_service with an unknown tier', () => {
    const result = checkoutRequestSchema.safeParse({
      productType: 'ad_service',
      tier: 'mega',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an ad_service missing the tier field', () => {
    const result = checkoutRequestSchema.safeParse({
      productType: 'ad_service',
    });

    expect(result.success).toBe(false);
  });
});
