// src/app/api/stripe/create-checkout/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

// vi.hoisted runs before any vi.mock factories, so mockSessionsCreate is
// available inside the Stripe factory closure without hoisting issues.
const { mockSessionsCreate } = vi.hoisted(() => ({
  mockSessionsCreate: vi.fn(),
}));

// Mock Clerk: by default, no logged-in user (guest).
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: null })),
  currentUser: vi.fn(() => null),
}));

// Mock Stripe — every test installs its own implementation for `checkout.sessions.create`.
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    checkout: { sessions: { create: mockSessionsCreate } },
    customers: { create: vi.fn(async () => ({ id: 'cus_test' })) },
  })),
}));

// DB mock — not needed for guest ad_service path, but the subscription path uses it.
vi.mock('@/libs/DB', () => ({ db: {} }));

const makeRequest = (body: unknown) =>
  new Request('http://test.local/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

describe('POST /api/stripe/create-checkout — ad_service branch (guest)', () => {
  beforeEach(() => {
    mockSessionsCreate.mockReset();
  });

  it('creates a one-time payment session for a guest buying The Combo', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_test_combo', url: 'https://checkout.stripe.com/x' });

    const res = await POST(makeRequest({ productType: 'ad_service', tier: 'combo' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toContain('checkout.stripe.com');

    // Inspect the call to verify the shape Stripe sees.
    expect(mockSessionsCreate).toHaveBeenCalledTimes(1);

    const args = mockSessionsCreate.mock.calls[0]![0];

    expect(args.mode).toBe('payment');
    expect(args.customer_creation).toBe('always');
    expect(args.phone_number_collection.enabled).toBe(true);
    expect(args.metadata.productType).toBe('ad_service');
    expect(args.metadata.tier).toBe('combo');
    // Guest: client_reference_id should be a generated UUID, not undefined.
    expect(args.client_reference_id).toMatch(/^ad_/);
  });

  it('rejects an invalid productType with 400', async () => {
    const res = await POST(makeRequest({ productType: 'mystery', tier: 'combo' }));

    expect(res.status).toBe(400);
  });

  it('rejects an ad_service with no tier with 400', async () => {
    const res = await POST(makeRequest({ productType: 'ad_service' }));

    expect(res.status).toBe(400);
  });
});
