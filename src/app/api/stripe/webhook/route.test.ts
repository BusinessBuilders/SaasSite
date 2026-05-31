// src/app/api/stripe/webhook/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

// Mock the Stripe SDK so we can construct fake events without signature verification.
vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      webhooks = {
        constructEvent: vi.fn((rawBody: string) => JSON.parse(rawBody)),
      };

      subscriptions = { retrieve: vi.fn() };
    },
  };
});
vi.mock('@/libs/DB', () => ({ db: { update: vi.fn(), insert: vi.fn(), select: vi.fn() } }));

const eventReq = (body: object) =>
  new Request('http://test.local/api/stripe/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'stripe-signature': 'test_sig', 'content-type': 'application/json' },
  });

describe('POST /api/stripe/webhook — ad_service handling', () => {
  beforeEach(() => {
    // Suppress route-level console output — vitest-fail-on-console is active globally.
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('does NOT run the subscription path on an ad_service session and returns 200', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_ad_service',
          mode: 'payment',
          payment_status: 'paid',
          amount_total: 149900,
          customer: 'cus_ad',
          subscription: null,
          customer_email: 'guest@example.com',
          customer_details: { phone: '+15555550100' },
          metadata: { productType: 'ad_service', tier: 'combo' },
        },
      },
    };

    const res = await POST(eventReq(event) as never);

    expect(res.status).toBe(200);

    // After the ad_service guard is in place, warn should be called with the
    // ad_service purchase log — NOT the generic "Missing customer or subscription" message.
    expect(console.warn).toHaveBeenCalledWith(
      '[stripe-webhook][ad_service] purchase',
      expect.objectContaining({ sessionId: 'cs_ad_service', tier: 'combo' }),
    );
  });

  it('still handles the subscription session path (regression guard)', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_sub',
          mode: 'subscription',
          customer: 'cus_sub',
          subscription: 'sub_test',
          metadata: { productType: 'subscription', planId: 'growth', clerkUserId: 'user_x' },
        },
      },
    };

    const res = await POST(eventReq(event) as never);

    expect(res.status).toBe(200);
  });
});
