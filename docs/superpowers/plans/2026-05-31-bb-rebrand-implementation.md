# BB Sign-Painter Rebrand + AI Operating Layer + Ad-Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repaint the public marketing surface in sign-painter aesthetic, reposition the existing SaaS as an "AI Operating Layer for Small Business" (copy only — prices/Stripe unchanged), and launch a new `/ad-services` page with guest-allowed Stripe Checkout for three one-time done-for-you packages ($899/$1,499/$2,499). Dashboard, Clerk auth, billing, and DB schema stay functionally untouched.

**Architecture:** Vendored design-system CSS tokens scoped behind a `.bb-marketing` wrapper on the `(unauth)` route group, so dashboard/auth keep shadcn defaults. Existing `create-checkout` route gets a discriminated-union request schema and a new guest-allowed `mode: 'payment'` branch. Existing webhook gets a defensive guard against running the subscription path on ad-service sessions. Stripe Dashboard's built-in payment notifications handle team alerts for v1.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Clerk auth, Stripe billing, Drizzle ORM, `next-intl` (en/fr), Vitest (unit/contract), Playwright (e2e/smoke), Percy (visual regression), `@t3-oss/env-nextjs` (env).

**Spec:** `docs/superpowers/specs/2026-05-12-bb-rebrand-design.md` (commit `17b907f`)

**Worktree:** `.claude/worktrees/signpainter-rebrand/` on branch `worktree-signpainter-rebrand`. All paths below are relative to the worktree root unless absolute.

---

## Phase 1 — Baseline capture

Goal: lock in "before" snapshots so later phases can detect unintended drift, especially in `(auth)/dashboard`.

### Task 1.1: Add a dashboard smoke test (mechanically enforce "dashboard untouched")

**Files:**
- Create: `tests/e2e/DashboardUntouched.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/e2e/DashboardUntouched.spec.ts
import { expect, test } from '@playwright/test';

// Mechanically enforces the "dashboard stays untouched" guarantee of the rebrand.
// If a future phase accidentally restyles dashboard surfaces (via global CSS bleed,
// shared component leak, or scope failure on the .bb-marketing wrapper), this test
// catches it.
test.describe('Dashboard not affected by marketing rebrand', () => {
  test('sign-in page uses shadcn-default background, not bb-marketing dark', async ({ page }) => {
    await page.goto('/sign-in');
    const body = page.locator('body');
    // shadcn default light background = HSL(38 75% 97%) ≈ rgb(252, 245, 230)-ish cream-white.
    // The bb-marketing dark surface is HSL ≈ #0a0a0a. We assert sign-in is NOT the dark BB.
    const bg = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgb(10, 10, 10)');
    expect(bg).not.toBe('rgb(20, 17, 13)');
  });

  test('sign-up page uses shadcn-default background', async ({ page }) => {
    await page.goto('/sign-up');
    const bg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgb(10, 10, 10)');
  });
});
```

- [ ] **Step 2: Run it on the current (pre-rebrand) tree to confirm it passes today**

Run: `npx playwright test tests/e2e/DashboardUntouched.spec.ts`
Expected: 2 passed (shadcn-default cream background is already in place; the assertion is `not.toBe` the BB dark).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/DashboardUntouched.spec.ts
git commit -m "test(e2e): add dashboard-untouched guard for rebrand regression"
```

### Task 1.2: Capture Percy baseline snapshots for all public + auth surfaces

**Files:**
- Modify: `tests/e2e/Visual.e2e.ts` (extend existing file)

- [ ] **Step 1: Extend the visual test to cover every page that could drift**

Replace the entire contents of `tests/e2e/Visual.e2e.ts` with:

```typescript
import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('Visual baseline — public + auth surfaces', () => {
  test('homepage (en)', async ({ page }) => {
    await page.goto('/');
    // Wait for hero text — covers any current copy without locking us to specific text.
    await page.waitForSelector('h1', { state: 'visible' });
    await percySnapshot(page, 'Homepage — en');
  });

  test('homepage (fr)', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForSelector('h1', { state: 'visible' });
    await percySnapshot(page, 'Homepage — fr');
  });

  test('pricing (en)', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForSelector('h1, h2', { state: 'visible' });
    await percySnapshot(page, 'Pricing — en');
  });

  test('sign-in', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Sign-in');
  });

  test('sign-up', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Sign-up');
  });
});
```

- [ ] **Step 2: Run locally (without Percy upload) to confirm tests execute**

Run: `npx playwright test tests/e2e/Visual.e2e.ts`
Expected: 5 passed. (Percy snapshots are uploaded only when `PERCY_TOKEN` is set, so this is a smoke check that the tests load the pages without crashing.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/Visual.e2e.ts
git commit -m "test(visual): extend baseline Percy snapshots to pricing + auth pages"
```

---

## Phase 2 — Product constants + env validation (no UI)

Goal: lock the data shape and config before any code that depends on it. If env or types are wrong, the build fails immediately, not at runtime in front of a customer.

### Task 2.1: Add `STRIPE_PRICE_AD_*` required env vars

**Files:**
- Modify: `src/libs/Env.ts`

- [ ] **Step 1: Add the three new required server env vars**

In `src/libs/Env.ts`, edit the `server: { … }` block to add three new lines after `STRIPE_PRICE_PRO`, and edit the `runtimeEnv` block to wire them through:

```typescript
// in the `server: { … }` block — REQUIRED, not optional:
    STRIPE_PRICE_AD_STATIC: z.string().min(1),
    STRIPE_PRICE_AD_COMBO: z.string().min(1),
    STRIPE_PRICE_AD_MOTION: z.string().min(1),

// in `runtimeEnv: { … }`:
    STRIPE_PRICE_AD_STATIC: process.env.STRIPE_PRICE_AD_STATIC,
    STRIPE_PRICE_AD_COMBO: process.env.STRIPE_PRICE_AD_COMBO,
    STRIPE_PRICE_AD_MOTION: process.env.STRIPE_PRICE_AD_MOTION,
```

- [ ] **Step 2: Add dev/test placeholder values to `.env.local`** (so local builds don't fail before the Stripe IDs are created in production):

Append to `.env.local`:
```
STRIPE_PRICE_AD_STATIC=price_dev_ad_static_placeholder
STRIPE_PRICE_AD_COMBO=price_dev_ad_combo_placeholder
STRIPE_PRICE_AD_MOTION=price_dev_ad_motion_placeholder
```

- [ ] **Step 3: Verify the build still passes**

Run: `npm run check-types && npm run build 2>&1 | tail -5`
Expected: no errors. The build should pass because the placeholder values satisfy `.min(1)`.

- [ ] **Step 4: Commit**

```bash
git add src/libs/Env.ts
git commit -m "feat(env): add required STRIPE_PRICE_AD_{STATIC,COMBO,MOTION} env vars"
```

### Task 2.2: Add ad-service tier constants to AppConfig

**Files:**
- Modify: `src/utils/AppConfig.ts`

- [ ] **Step 1: Add the AdServicesTier list to `AppConfig.ts`**

Append to the bottom of `src/utils/AppConfig.ts`:

```typescript
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
```

- [ ] **Step 2: Verify types compile**

Run: `npm run check-types`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/AppConfig.ts
git commit -m "feat(config): add AdServicesTierList for /ad-services product"
```

### Task 2.3: Add a discriminated-union request schema for `create-checkout`

**Files:**
- Create: `src/app/api/stripe/create-checkout/schema.ts`

- [ ] **Step 1: Write the schema**

```typescript
// src/app/api/stripe/create-checkout/schema.ts
import { z } from 'zod';
import { AD_SERVICE_TIER } from '@/utils/AppConfig';
import { PLAN_ID } from '@/utils/AppConfig';

// Discriminated union: subscription requires planId; ad_service requires tier.
// We use this to (a) validate the POST body, (b) drive different Stripe Checkout
// shapes, and (c) discriminate behavior in the webhook via session.metadata.
export const checkoutRequestSchema = z.discriminatedUnion('productType', [
  z.object({
    productType: z.literal('subscription'),
    planId: z.enum([PLAN_ID.STARTER, PLAN_ID.GROWTH, PLAN_ID.PRO]),
  }),
  z.object({
    productType: z.literal('ad_service'),
    tier: z.enum([
      AD_SERVICE_TIER.STATIC,
      AD_SERVICE_TIER.COMBO,
      AD_SERVICE_TIER.MOTION,
    ]),
    /** Optional locale for Stripe Checkout UI localization. */
    locale: z.enum(['en', 'fr']).optional(),
  }),
]);

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
```

- [ ] **Step 2: Write a unit test for the schema**

Create `src/app/api/stripe/create-checkout/schema.test.ts`:

```typescript
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
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run src/app/api/stripe/create-checkout/schema.test.ts`
Expected: 6 passed.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stripe/create-checkout/schema.ts src/app/api/stripe/create-checkout/schema.test.ts
git commit -m "feat(stripe): add discriminated-union checkout request schema with tests"
```

---

## Phase 3 — Stripe payment branch + webhook contract tests

Goal: get the money path bulletproof before any visible UI exists. If checkout or webhook is broken, no amount of pretty design saves us.

### Task 3.1: Write the failing test for the `create-checkout` ad_service branch

**Files:**
- Create: `src/app/api/stripe/create-checkout/route.test.ts`

- [ ] **Step 1: Write the test (mocks Stripe + Clerk)**

```typescript
// src/app/api/stripe/create-checkout/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Clerk: by default, no logged-in user (guest).
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: null })),
  currentUser: vi.fn(() => null),
}));

// Mock Stripe — every test installs its own implementation for `checkout.sessions.create`.
const mockSessionsCreate = vi.fn();
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    checkout: { sessions: { create: mockSessionsCreate } },
    customers: { create: vi.fn(async () => ({ id: 'cus_test' })) },
  })),
}));

// DB mock — not needed for guest ad_service path, but the subscription path uses it.
vi.mock('@/libs/DB', () => ({ db: {} }));

import { POST } from './route';

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
    const args = mockSessionsCreate.mock.calls[0][0];
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
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/app/api/stripe/create-checkout/route.test.ts`
Expected: tests fail (the current route requires Clerk auth and would return 401 for guest, and has no ad_service branch).

- [ ] **Step 3: Commit the failing test**

```bash
git add src/app/api/stripe/create-checkout/route.test.ts
git commit -m "test(stripe): failing contract test for ad_service guest checkout"
```

### Task 3.2: Implement the guest-allowed `ad_service` branch in `create-checkout`

**Files:**
- Modify: `src/app/api/stripe/create-checkout/route.ts`

- [ ] **Step 1: Rewrite `POST` to branch on the validated request schema**

Replace the existing `POST` function (and add `randomUUID` import + helpers) in `src/app/api/stripe/create-checkout/route.ts`. The full updated file:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationSchema } from '@/models/Schema';
import {
  AD_SERVICE_TIER,
  AppConfig,
  type AdServiceTier,
  PLAN_ID,
  PricingPlanList,
} from '@/utils/AppConfig';
import { checkoutRequestSchema } from './schema';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Subscription price-ID lookup (unchanged).
const getSubscriptionPriceId = (planId: string) => {
  const envOverrides: Record<string, string | undefined> = {
    [PLAN_ID.STARTER]: Env.STRIPE_PRICE_STARTER,
    [PLAN_ID.GROWTH]: Env.STRIPE_PRICE_GROWTH,
    [PLAN_ID.PRO]: Env.STRIPE_PRICE_PRO,
  };
  if (envOverrides[planId]) return envOverrides[planId];

  const plan = PricingPlanList[planId];
  if (!plan) return null;
  if (Env.BILLING_PLAN_ENV === 'test') return plan.testPriceId;
  if (Env.BILLING_PLAN_ENV === 'dev') return plan.devPriceId;
  return plan.prodPriceId;
};

// Ad-service price-ID lookup (always env-var-backed since these are required).
const getAdServicePriceId = (tier: AdServiceTier) => ({
  [AD_SERVICE_TIER.STATIC]: Env.STRIPE_PRICE_AD_STATIC,
  [AD_SERVICE_TIER.COMBO]: Env.STRIPE_PRICE_AD_COMBO,
  [AD_SERVICE_TIER.MOTION]: Env.STRIPE_PRICE_AD_MOTION,
}[tier]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.format() },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // ─── Ad services: one-time payment, guest allowed ─────────────────────────
  if (parsed.data.productType === 'ad_service') {
    const { tier, locale } = parsed.data;
    const priceId = getAdServicePriceId(tier);

    // For ad_service we treat logged-in users as a convenience (we pre-fill the
    // email + reuse their userId in metadata) but do not require login.
    const { userId } = auth();
    const user = userId ? await currentUser() : null;
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    // client_reference_id is the Clerk userId if logged-in, otherwise a generated
    // UUID prefixed with "ad_" so the webhook can tell guest from member at a glance.
    const clientReferenceId = userId ?? `ad_${randomUUID()}`;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_creation: 'always',
        customer_email: userEmail,
        phone_number_collection: { enabled: true },
        client_reference_id: clientReferenceId,
        locale: locale ?? 'auto',
        metadata: {
          productType: 'ad_service',
          tier,
          locale: locale ?? 'auto',
          clerkUserId: userId ?? '',
          generatedRef: clientReferenceId,
        },
        payment_intent_data: {
          metadata: {
            productType: 'ad_service',
            tier,
            clerkUserId: userId ?? '',
          },
        },
        success_url: `${baseUrl}/${locale ?? 'en'}/ad-services/welcome?ref={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/${locale ?? 'en'}/ad-services`,
      });
      return NextResponse.json({ url: session.url });
    } catch (err) {
      console.error('[stripe.create-checkout.ad_service]', err);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 },
      );
    }
  }

  // ─── Subscription: existing path, requires Clerk auth ─────────────────────
  const { userId } = auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to subscribe' },
      { status: 401 },
    );
  }

  const { planId } = parsed.data;
  const priceId = getSubscriptionPriceId(planId);
  if (!priceId) {
    return NextResponse.json(
      { error: 'Invalid plan or price ID not configured' },
      { status: 400 },
    );
  }

  // Reuse existing org→Stripe-customer linkage.
  let stripeCustomerId: string | null = null;
  const orgRows = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, userId));
  stripeCustomerId = orgRows[0]?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const email = user.emailAddresses?.[0]?.emailAddress;
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkUserId: userId },
    });
    stripeCustomerId = customer.id;
    if (orgRows[0]) {
      await db
        .update(organizationSchema)
        .set({ stripeCustomerId })
        .where(eq(organizationSchema.id, userId));
    } else {
      await db
        .insert(organizationSchema)
        .values({ id: userId, stripeCustomerId });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { productType: 'subscription', planId, clerkUserId: userId },
      success_url: `${baseUrl}/dashboard/billing?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe.create-checkout.subscription]', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Re-run the ad_service contract test**

Run: `npx vitest run src/app/api/stripe/create-checkout/route.test.ts`
Expected: 3 passed.

- [ ] **Step 3: Lint + type-check**

Run: `npm run lint && npm run check-types`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stripe/create-checkout/route.ts
git commit -m "feat(stripe): add guest-allowed ad_service branch to create-checkout"
```

### Task 3.3: Write the failing webhook test for `ad_service` sessions

**Files:**
- Create: `src/app/api/stripe/webhook/route.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/app/api/stripe/webhook/route.test.ts
import { describe, expect, it, vi } from 'vitest';

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

import { POST } from './route';

const eventReq = (body: object) =>
  new Request('http://test.local/api/stripe/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'stripe-signature': 'test_sig', 'content-type': 'application/json' },
  });

describe('POST /api/stripe/webhook — ad_service handling', () => {
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
          subscription: null, // critical: no subscription on a one-time payment
          customer_email: 'guest@example.com',
          customer_details: { phone: '+15555550100' },
          metadata: { productType: 'ad_service', tier: 'combo' },
        },
      },
    };

    const res = await POST(eventReq(event) as never);
    expect(res.status).toBe(200);
    // Returning 200 (not crashing on missing subscription) is the regression guarantee.
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
```

- [ ] **Step 2: Run to verify it fails (or surfaces the current crash)**

Run: `npx vitest run src/app/api/stripe/webhook/route.test.ts`
Expected: at minimum the ad_service test fails — the current webhook tries to read `session.subscription` and would error on `null`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/app/api/stripe/webhook/route.test.ts
git commit -m "test(stripe): failing webhook test for ad_service session handling"
```

### Task 3.4: Add the webhook guard + `ad_service` branch

**Files:**
- Modify: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: In the `checkout.session.completed` case, add an early branch for ad_service**

Find the `case 'checkout.session.completed':` block. At the very top of the block (before any existing logic), insert:

```typescript
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // ─── Ad-service one-time payment: log + ack, no DB write ──────────
        if (session.metadata?.productType === 'ad_service') {
          console.warn('[stripe-webhook][ad_service] purchase', {
            sessionId: session.id,
            tier: session.metadata.tier,
            amount: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_details?.email ?? session.customer_email,
            customerPhone: session.customer_details?.phone,
            clientReferenceId: session.client_reference_id,
          });
          // Team notification is handled by Stripe Dashboard built-in payment
          // notifications (Settings → Notifications → Successful payments).
          // Customer receipt is automatic via Stripe.
          return NextResponse.json({ received: true });
        }

        // ─── Subscription path (existing) ─────────────────────────────────
        // (existing code that reads session.customer + session.subscription
        // continues here unchanged — leave it intact.)
```

The exact diff is: insert the `if (session.metadata?.productType === 'ad_service')` block immediately after `const session = event.data.object as Stripe.Checkout.Session;` and before the existing subscription-dependent checks.

- [ ] **Step 2: Re-run the webhook test**

Run: `npx vitest run src/app/api/stripe/webhook/route.test.ts`
Expected: 2 passed.

- [ ] **Step 3: Lint + types**

Run: `npm run lint && npm run check-types`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat(stripe): add ad_service guard to webhook; ack one-time payments"
```

---

## Phase 4 — `/ad-services` + `/welcome` page (minimal styling, no BB tokens yet)

Goal: end-to-end purchase flow working before any visual polish. Visuals come in Phase 5.

### Task 4.1: Create the `AdServicesTierCard` client component

**Files:**
- Create: `src/features/ad-services/AdServicesTierCard.tsx`

- [ ] **Step 1: Write the component (uses existing Tailwind / shadcn for now)**

```tsx
// src/features/ad-services/AdServicesTierCard.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AdServiceTierConfig } from '@/utils/AppConfig';

type Props = {
  config: AdServiceTierConfig;
  /** Description shown under the name. */
  pitch: string;
  /** Bullet list of what's included. */
  features: string[];
  /** Optional eyebrow above the name (e.g. "Tier One ✦ Picture Ads"). */
  eyebrow?: string;
  /** Locale forwarded to the create-checkout call. */
  locale?: 'en' | 'fr';
};

export const AdServicesTierCard = ({ config, pitch, features, eyebrow, locale }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productType: 'ad_service', tier: config.id, locale }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Checkout failed');
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <article
      data-tier={config.id}
      data-featured={config.featured}
      className="flex flex-col gap-4 rounded-lg border border-border p-6"
    >
      {eyebrow ? <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</div> : null}
      <h3 className="text-2xl font-bold">{config.name}</h3>
      <p className="text-sm text-muted-foreground">{pitch}</p>
      <div className="my-2">
        <div className="text-4xl font-extrabold">${config.price.toLocaleString()}</div>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{config.setupLabel}</div>
      </div>
      <Button onClick={onBuy} disabled={loading} className="w-full" variant={config.featured ? 'default' : 'outline'}>
        {loading ? 'Loading…' : config.featured ? `Pick ${config.name}` : 'Start Here'}
      </Button>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <hr className="my-2 border-border" />
      <ul className="flex flex-col gap-2 text-sm">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden>◆</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
};
```

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/ad-services/AdServicesTierCard.tsx
git commit -m "feat(ad-services): add AdServicesTierCard client component"
```

### Task 4.2: Create the `/ad-services` page (minimal styling, full content)

**Files:**
- Create: `src/app/[locale]/(unauth)/ad-services/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/[locale]/(unauth)/ad-services/page.tsx
import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { AdServicesTierCard } from '@/features/ad-services/AdServicesTierCard';
import { AdServicesTierList, AD_SERVICE_TIER } from '@/utils/AppConfig';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Targeted Ads — Custom-Built for Your Business | Business Builders',
  description: 'Done-for-you ad services. We design, run, and optimize ads that bring real customers through the door. Three tiers from $899.',
  openGraph: {
    title: 'Targeted Ads — Custom-Built for Your Business',
    description: 'We design, run, and optimize ads that bring real customers through the door.',
    images: ['/assets/images/og-ad-services.jpg'],
  },
};

type Props = { params: { locale: string } };

export default function AdServicesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const loc = (locale === 'fr' ? 'fr' : 'en') as 'en' | 'fr';

  return (
    <main>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-24 text-center">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
          Targeted Ads ✦ Custom-Built For You
        </div>
        <h1 className="text-5xl font-extrabold leading-tight">
          We build ads that <em>actually work.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          You run your business. We run your ads. We design them, test them, and fix them until they bring people through the door. No jargon, no dashboards you'll never read — just more customers.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#pricing" className="rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground">See the Numbers</a>
          <a href="#how" className="rounded-md border border-border px-6 py-3 font-semibold">How It Works</a>
        </div>
      </section>

      {/* ── Problem ────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary">✺ Let's Be Honest ✺</div>
        <h2 className="text-center text-3xl font-bold">Ads are a pain to get right.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            "You boost a post, burn $200, and get three likes from people in another country.",
            "You try to set up a campaign yourself and the dashboard looks like a cockpit.",
            "You hire a \"guru\" who sends you reports full of impressions but no actual customers.",
          ].map((line, i) => (
            <div key={i} className="rounded-lg border border-border p-6">
              <div className="mb-3 text-primary">///</div>
              <p>{line}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl text-center font-bold text-primary">
          We do it differently. We build ads that bring in real people who want to buy what you sell.
        </p>
      </section>

      {/* ── How It Works ───────────────────────────────── */}
      <section id="how" className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary">✦ The Process ✦</div>
        <h2 className="text-center text-3xl font-bold">Here's How It Works.</h2>
        <ol className="mt-12 flex flex-col gap-10">
          {[
            { n: '01', t: 'We Design 3–4 Ads', d: "Different angles, different hooks, different visuals. We don't guess which one will work — we test all of them." },
            { n: '02', t: 'We Run Them and Watch', d: 'Your budget goes toward real ad spend. We watch the numbers daily, kill what doesn\'t work, and put more behind what does.' },
            { n: '03', t: 'We Optimize Until It Hits', d: 'If the first batch doesn\'t produce, we redesign. New creative, new angles, new targeting. We keep going until at least one ad is working.' },
          ].map(step => (
            <li key={step.n} className="flex gap-6">
              <div className="text-4xl font-extrabold text-primary">{step.n}</div>
              <div>
                <h3 className="text-xl font-bold">{step.t}</h3>
                <p className="mt-2 text-muted-foreground">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary">✺ Targeted Ad Packages ✺</div>
        <h2 className="text-center text-3xl font-bold">Three Tiers. Pick Your Level.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Every ad is custom-designed and targeted specifically to your audience. Setup gets the ads built and live. Ad spend is separate — we start low, find what works, then scale up when you're ready.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <AdServicesTierCard
            config={AdServicesTierList[AD_SERVICE_TIER.STATIC]}
            eyebrow="Tier One ✦ Picture Ads"
            pitch="Clean, bold image ads designed from scratch. Best way to prove ads work for your business without a big commitment."
            features={[
              '3–4 custom image ad designs',
              'Full campaign build & targeting',
              'Pixel & conversion tracking',
              'Audience research for your area',
              'Ad copy written in your voice',
              'A/B testing across variations',
              'Redesign if ads underperform',
            ]}
            locale={loc}
          />
          <AdServicesTierCard
            config={AdServicesTierList[AD_SERVICE_TIER.COMBO]}
            eyebrow="Tier Two ✦ Picture + Video"
            pitch="You get static image ads AND video ads — we test both formats against each other to find your winner fastest."
            features={[
              '2–3 video ad creatives added',
              'Professional editing & motion',
              'Vertical + horizontal formats',
              'Image vs. video split testing',
              'Retargeting campaigns included',
              'Weekly performance reports',
              'Redesign both formats if needed',
            ]}
            locale={loc}
          />
          <AdServicesTierCard
            config={AdServicesTierList[AD_SERVICE_TIER.MOTION]}
            eyebrow="Tier Three ✦ All Video"
            pitch="Full video production. We shoot, edit, or animate 3-4 video ads targeted at your exact customers. The premium play."
            features={[
              '3–4 custom video ad creatives',
              'Professional editing & motion graphics',
              'Reels, Stories, Feed formats',
              'Full campaign build & targeting',
              'Retargeting & lookalike audiences',
              'Daily monitoring & optimization',
              'Priority redesign if ads underperform',
              'You own all footage & edits',
            ]}
            locale={loc}
          />
        </div>
      </section>

      {/* ── Guarantee ──────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">✦ Our Guarantee ✦</div>
        <h2 className="text-3xl font-bold">If the ads don't produce, we redesign until they do.</h2>
        <p className="mt-6 text-muted-foreground">
          Not every ad hits on the first try. If your initial batch isn't bringing in leads, we go back to the drawing board — new creative, new angles, new copy — at no extra design cost. Once you've got a winner, you own it. Rerun it whenever you want.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev:next` in one terminal, then visit `http://localhost:3000/en/ad-services` in a browser (or `curl -s http://localhost:3000/en/ad-services | head -50`). Expect HTML containing "We build ads that".

Stop the dev server when done: `Ctrl+C`.

- [ ] **Step 3: Type-check + lint**

Run: `npm run check-types && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(unauth)/ad-services/page.tsx
git commit -m "feat(ad-services): add /ad-services page with three tier cards"
```

### Task 4.3: Create the `/ad-services/welcome` post-purchase page

**Files:**
- Create: `src/app/[locale]/(unauth)/ad-services/welcome/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/[locale]/(unauth)/ad-services/welcome/page.tsx
import { unstable_setRequestLocale } from 'next-intl/server';
import Stripe from 'stripe';
import { Env } from '@/libs/Env';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

type Props = {
  params: { locale: string };
  searchParams: { ref?: string };
};

export default async function AdServicesWelcomePage({ params: { locale }, searchParams }: Props) {
  unstable_setRequestLocale(locale);

  // Defense against direct URL visits: only show the confirmation if the ref
  // corresponds to a real, paid Stripe Checkout Session.
  let confirmed = false;
  let tier: string | null = null;
  if (searchParams.ref) {
    try {
      const session = await stripe.checkout.sessions.retrieve(searchParams.ref);
      confirmed = session.payment_status === 'paid' && session.metadata?.productType === 'ad_service';
      tier = (session.metadata?.tier as string) ?? null;
    } catch {
      confirmed = false;
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      {confirmed ? (
        <>
          <h1 className="text-4xl font-extrabold">Thanks — we got it.</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Your {tier ? <span className="font-semibold">{tier}</span> : ''} package is paid and we're on it.
            Donovan will reach out within one business day to kick off the engagement.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Questions in the meantime? <a className="underline" href="mailto:donovan@business-builder.online">donovan@business-builder.online</a>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold">Order not found.</h1>
          <p className="mt-4 text-muted-foreground">
            We couldn't confirm a recent purchase from this link. If you just paid and you're seeing this,
            check your email for a Stripe receipt and forward it to <a className="underline" href="mailto:donovan@business-builder.online">donovan@business-builder.online</a>.
          </p>
          <a className="mt-8 inline-block rounded-md border border-border px-6 py-3 font-semibold" href={`/${locale}/ad-services`}>
            Back to Ad Services
          </a>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-types`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(unauth)/ad-services/welcome/page.tsx
git commit -m "feat(ad-services): add /welcome post-purchase confirmation page"
```

### Task 4.4: Add `error.tsx` and `loading.tsx` for the ad-services route

**Files:**
- Create: `src/app/[locale]/(unauth)/ad-services/error.tsx`
- Create: `src/app/[locale]/(unauth)/ad-services/loading.tsx`

- [ ] **Step 1: Write the error boundary**

```tsx
// src/app/[locale]/(unauth)/ad-services/error.tsx
'use client';

import { useEffect } from 'react';

export default function AdServicesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[ad-services]', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Something went sideways.</h1>
      <p className="mt-4 text-muted-foreground">
        We hit an unexpected error loading this page. Try again, or email <a className="underline" href="mailto:donovan@business-builder.online">donovan@business-builder.online</a>.
      </p>
      <button onClick={reset} className="mt-6 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground">
        Try again
      </button>
    </main>
  );
}
```

- [ ] **Step 2: Write the loading state**

```tsx
// src/app/[locale]/(unauth)/ad-services/loading.tsx
export default function AdServicesLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">
      Loading…
    </main>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npm run check-types
git add src/app/[locale]/(unauth)/ad-services/error.tsx src/app/[locale]/(unauth)/ad-services/loading.tsx
git commit -m "feat(ad-services): add error boundary and loading state"
```

### Task 4.5: Playwright smoke test for `/ad-services`

**Files:**
- Create: `tests/e2e/AdServices.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
import { expect, test } from '@playwright/test';

test.describe('/ad-services smoke', () => {
  test('renders the hero + three tier cards', async ({ page }) => {
    await page.goto('/en/ad-services');
    await expect(page.getByRole('heading', { name: /actually work/i })).toBeVisible();

    // Three tiers should render — assert each by name.
    await expect(page.getByText('The Static')).toBeVisible();
    await expect(page.getByText('The Combo')).toBeVisible();
    await expect(page.getByText('The Motion')).toBeVisible();

    // Prices.
    await expect(page.getByText('$899')).toBeVisible();
    await expect(page.getByText('$1,499')).toBeVisible();
    await expect(page.getByText('$2,499')).toBeVisible();
  });

  test('clicking a tier button POSTs to /api/stripe/create-checkout', async ({ page }) => {
    let captured: { url: string; body: string } | null = null;
    await page.route('**/api/stripe/create-checkout', async (route, request) => {
      captured = { url: request.url(), body: request.postData() ?? '' };
      // Don't actually redirect; just return a stub.
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'about:blank#fake' }) });
    });

    await page.goto('/en/ad-services');
    await page.getByRole('button', { name: /Pick The Combo/i }).click();

    expect(captured).not.toBeNull();
    expect(captured!.body).toContain('"productType":"ad_service"');
    expect(captured!.body).toContain('"tier":"combo"');
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx playwright test tests/e2e/AdServices.spec.ts`
Expected: 2 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/AdServices.spec.ts
git commit -m "test(e2e): smoke test /ad-services renders tiers and POSTs to checkout"
```

---

## Phase 5 — Scoped BB tokens + fonts + restyle marketing

Goal: apply the sign-painter aesthetic to public marketing pages without touching dashboard/auth surfaces. Validated by the dashboard-untouched test from Phase 1.

### Task 5.1: Vendor `bb-tokens.css` into `src/styles/`

**Files:**
- Create: `src/styles/bb-tokens.css`

- [ ] **Step 1: Copy the design system tokens into the worktree**

```bash
cp /home/magiccat/Downloads/Business-Builder-Design-System/colors_and_type.css \
   src/styles/bb-tokens.css
```

- [ ] **Step 2: Scope the `:root` overrides to `.bb-marketing` so dashboard tokens are unaffected**

Edit `src/styles/bb-tokens.css`. Find the `:root { … }` block at the top (the one that defines `--bb-black`, `--bb-cream`, etc.). REPLACE the selector `:root` with `:root, .bb-marketing` so the BB variable definitions exist everywhere (cheap CSS vars) but they don't override shadcn's semantic variables yet.

Then, AFTER the existing `:root` block, append a new scoped override block that remaps shadcn tokens to BB values **only inside `.bb-marketing`**:

```css
/* ─── Scoped shadcn token overrides — bb-marketing only ─────────────── */
.bb-marketing {
  /* shadcn semantic variables remapped to BB sign-painter values */
  --background: 28 17% 5%;       /* approx HSL of --bb-black #0a0a0a */
  --foreground: 38 71% 87%;      /* approx HSL of --bb-cream #f5e6c8 */
  --card: 33 16% 9%;             /* --bb-black-warm */
  --card-foreground: 38 71% 87%;
  --popover: 33 16% 9%;
  --popover-foreground: 38 71% 87%;
  --primary: 18 81% 51%;         /* --bb-orange #e85d1a */
  --primary-foreground: 28 17% 5%;
  --secondary: 33 16% 9%;
  --secondary-foreground: 38 71% 87%;
  --muted: 32 11% 22%;           /* --bb-umber */
  --muted-foreground: 38 25% 69%;/* --bb-taupe */
  --accent: 18 81% 51%;
  --accent-foreground: 28 17% 5%;
  --destructive: 9 70% 45%;      /* --bb-brick */
  --destructive-foreground: 38 71% 87%;
  --border: 38 71% 87% / 0.22;   /* --bb-border-soft */
  --input: 38 71% 87% / 0.22;
  --ring: 18 81% 51%;
}
```

- [ ] **Step 3: Import bb-tokens.css from global.css**

In `src/styles/global.css`, add this line at the very top (above `@tailwind base;`):

```css
@import "./bb-tokens.css";
```

- [ ] **Step 4: Type-check + visual sanity check**

Run: `npm run check-types && npm run dev:next`

In a browser, visit `http://localhost:3000/` — should still render (no `.bb-marketing` wrapper yet, so shadcn defaults still apply).
Visit `http://localhost:3000/dashboard` (after sign-in) — should still render unchanged.
Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/styles/bb-tokens.css src/styles/global.css
git commit -m "feat(style): vendor BB design tokens scoped to .bb-marketing"
```

### Task 5.2: Extend `tailwind.config.ts` with `bb.*` tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add the `bb` color tree to `theme.extend.colors`**

In `tailwind.config.ts`, inside `theme.extend.colors`, add a new entry alongside the existing `brand` and shadcn semantic blocks:

```typescript
        bb: {
          black: 'var(--bb-black)',
          'black-soft': 'var(--bb-black-soft)',
          'black-warm': 'var(--bb-black-warm)',
          umber: 'var(--bb-umber)',
          cream: 'var(--bb-cream)',
          'cream-bright': 'var(--bb-cream-bright)',
          taupe: 'var(--bb-taupe)',
          dust: 'var(--bb-dust)',
          orange: 'var(--bb-orange)',
          'orange-deep': 'var(--bb-orange-deep)',
          'orange-soft': 'var(--bb-orange-soft)',
          teal: 'var(--bb-teal)',
          'teal-soft': 'var(--bb-teal-soft)',
          brick: 'var(--bb-brick)',
          gold: 'var(--bb-gold)',
        },
```

Also add to `theme.extend`:

```typescript
      fontFamily: {
        'bb-display': ['var(--bb-font-display)'],
        'bb-display-2': ['var(--bb-font-display-2)'],
        'bb-body': ['var(--bb-font-body)'],
      },
      boxShadow: {
        'bb-letter': 'var(--bb-shadow-letter)',
        'bb-card': 'var(--bb-shadow-card)',
        'bb-featured': 'var(--bb-shadow-featured)',
      },
```

- [ ] **Step 2: Verify Tailwind compiles**

Run: `npm run build 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(tw): extend Tailwind theme with bb.* color, font, shadow tokens"
```

### Task 5.3: Switch fonts to `next/font/google`

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Import + configure the two BB fonts**

At the top of `src/app/[locale]/layout.tsx` (after existing imports), add:

```typescript
import { Bricolage_Grotesque, Funnel_Display } from 'next/font/google';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--bb-font-body-loaded',
  display: 'swap',
});

const funnel = Funnel_Display({
  subsets: ['latin'],
  variable: '--bb-font-display-loaded',
  display: 'swap',
});
```

- [ ] **Step 2: Apply the CSS variables to `<html>` or `<body>` so fonts are available globally**

Find the `<html>` element in the layout. Add the font variable classes:

```tsx
    <html lang={props.params.locale} className={`${bricolage.variable} ${funnel.variable}`}>
```

- [ ] **Step 3: Update `bb-tokens.css` to read from the loaded variables (with fallback)**

In `src/styles/bb-tokens.css`, find the font-family declarations and update them to prefer the loaded font:

```css
  --bb-font-display:    var(--bb-font-display-loaded, 'Lobster Two'), 'Pacifico', 'Brush Script MT', cursive;
  --bb-font-display-2:  var(--bb-font-display-loaded, 'Funnel Display'), 'Bricolage Grotesque', 'Inter Tight', sans-serif;
  --bb-font-body:       var(--bb-font-body-loaded, 'Bricolage Grotesque'), 'Inter Tight', 'Inter', system-ui, sans-serif;
```

- [ ] **Step 4: Verify build + type-check**

Run: `npm run check-types && npm run build 2>&1 | tail -5`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/layout.tsx src/styles/bb-tokens.css
git commit -m "feat(fonts): load Bricolage Grotesque + Funnel Display via next/font"
```

### Task 5.4: Add `(unauth)/layout.tsx` with the `.bb-marketing` wrapper

**Files:**
- Create: `src/app/[locale]/(unauth)/layout.tsx`

- [ ] **Step 1: Write a minimal layout that wraps children in `.bb-marketing`**

```tsx
// src/app/[locale]/(unauth)/layout.tsx
import type { ReactNode } from 'react';

export default function UnauthLayout({ children }: { children: ReactNode }) {
  return <div className="bb-marketing min-h-screen bg-background text-foreground">{children}</div>;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds. Homepage and pricing now render inside the BB-scoped theme; dashboard pages do not.

- [ ] **Step 3: Run the Phase-1 dashboard-untouched test to confirm scoping works**

Run: `npx playwright test tests/e2e/DashboardUntouched.spec.ts`
Expected: 2 passed. (If failed: the `.bb-marketing` scoping leaked.)

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(unauth)/layout.tsx
git commit -m "feat(layout): wrap (unauth) routes in .bb-marketing scope"
```

### Task 5.5: Restyle `Navbar.tsx` — preserve blog link, add Ad Services link

**Files:**
- Modify: `src/templates/Navbar.tsx`

- [ ] **Step 1: Restyle to BB tokens; add Ad Services link; preserve Blog link**

Update `src/templates/Navbar.tsx`. The exact diff depends on the current shape (read first), but the additions are:

1. Remove `TwitterLogoIcon` import (no longer used).
2. Add a nav link to `/ad-services` between Pricing and About: `<Link href="/ad-services" className="…">{t('ad_services')}</Link>`.
3. Verify the Blog link points to `https://blog.business-builder.online` with `target="_blank" rel="noopener noreferrer"`.
4. Apply BB tokens via Tailwind utilities: `bg-bb-black text-bb-cream` on the outer wrapper, `text-bb-orange` on the CTA, `uppercase tracking-widest text-xs` on labels.
5. Conditionally render the `<ThemeToggle />` only when NOT inside `.bb-marketing` (or simply remove it from the marketing Navbar — the BB aesthetic is intentionally dark-only).

Add a new translation key `ad_services` to `Navbar` namespace in `src/locales/en.json` and `fr.json` (handled in Phase 6).

- [ ] **Step 2: Run the visual + dashboard tests**

Run: `npx playwright test tests/e2e/DashboardUntouched.spec.ts tests/e2e/Visual.e2e.ts`
Expected: dashboard test still passes; visual tests update Percy baselines (review in Percy UI).

- [ ] **Step 3: Commit**

```bash
git add src/templates/Navbar.tsx
git commit -m "feat(navbar): restyle to BB tokens, add Ad Services link, preserve Blog"
```

### Task 5.6: Restyle `Hero.tsx` with new positioning copy

**Files:**
- Modify: `src/templates/Hero.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
// src/templates/Hero.tsx
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const Hero = () => {
  const t = useTranslations('Hero');

  return (
    <Section className="py-24 md:py-36">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-bb-orange">
          {t('eyebrow')}
        </div>
        <h1 className="font-bb-display-2 text-5xl font-extrabold leading-tight text-bb-cream-bright md:text-7xl">
          {t.rich('title', { em: (chunks) => <em className="text-bb-orange not-italic">{chunks}</em> })}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-bb-taupe md:text-xl">
          {t('description')}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/pricing"
            className="rounded-sm bg-bb-orange px-7 py-4 font-bold uppercase tracking-widest text-bb-black shadow-[0_4px_0_var(--bb-brick)] transition-transform active:translate-y-0.5"
          >
            {t('primary_cta')}
          </Link>
          <Link
            href="/ad-services"
            className="rounded-sm border-2 border-bb-cream px-7 py-4 font-bold uppercase tracking-widest text-bb-cream hover:bg-bb-cream hover:text-bb-black"
          >
            {t('secondary_cta')}
          </Link>
        </div>
      </div>
    </Section>
  );
};
```

- [ ] **Step 2: Verify build + dashboard test still passes**

Run: `npm run check-types && npx playwright test tests/e2e/DashboardUntouched.spec.ts`
Expected: clean + passing.

- [ ] **Step 3: Commit**

```bash
git add src/templates/Hero.tsx
git commit -m "feat(hero): reposition with sign-painter voice + AI back-office eyebrow"
```

### Task 5.7: Restyle Footer, Pricing, SocialPlatforms, CenteredMenu

Each is a similar pattern: read the file, swap default Tailwind classes to BB tokens (`bg-bb-black`, `text-bb-cream`, `border-bb-border-hair`, etc.), add eyebrow labels with `text-xs uppercase tracking-widest text-bb-orange`. The dashboard-untouched test guards against leaks.

- [ ] **Step 1: Footer** — Replace gray/muted backgrounds with `bg-bb-black border-t-bb-cream/30 text-bb-taupe`. Add the double-rule divider style: `border-t-[3px] border-double border-bb-cream/55`. Add the "/// Hand-built ///" legal line. Add Ad Services link. Commit: `git commit -m "feat(footer): restyle to BB tokens with double-rule divider"`.

- [ ] **Step 2: Pricing template** — On the three tier cards, apply: `rounded-md bg-bb-black-warm border-2 border-bb-cream/20 shadow-bb-card`. On the featured (Growth) tier add: `border-bb-orange shadow-bb-featured` and a small `bb-script-tag`-styled "best value" sticker positioned `absolute -top-3 right-6`. Commit: `git commit -m "feat(pricing): apply BB pricing-card aesthetic with featured ring"`.

- [ ] **Step 3: SocialPlatforms** — Cards become `bg-bb-black-warm border-bb-cream/20 text-bb-cream`. "Live"/"Coming soon" pills use `bg-bb-orange text-bb-black` and `bg-transparent border border-bb-cream/40 text-bb-taupe`. Commit: `git commit -m "feat(social): restyle TikTok/FB/IG cards to BB tokens"`.

- [ ] **Step 4: CenteredMenu** — Mobile dropdown background switches from `bg-secondary` to `bg-bb-black-warm text-bb-cream`. Verify no `(auth)` consumer first: `git grep -l "from '@/features/landing/CenteredMenu'" src/app/[locale]/(auth)` (must return nothing). Commit: `git commit -m "feat(nav): restyle CenteredMenu mobile dropdown to BB dark"`.

- [ ] **Step 5: After all four, run the full test suite**

```bash
npx playwright test tests/e2e/
npm run check-types
```

Expected: dashboard-untouched and ad-services smoke still pass; visual snapshots updated (review in Percy).

### Task 5.8: Create `AdServicesBand` and wire into homepage

**Files:**
- Create: `src/templates/AdServicesBand.tsx`
- Modify: `src/app/[locale]/(unauth)/page.tsx`

- [ ] **Step 1: Write the band component**

```tsx
// src/templates/AdServicesBand.tsx
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Section } from '@/features/landing/Section';

export const AdServicesBand = () => {
  const t = useTranslations('AdServicesBand');
  return (
    <Section className="py-20">
      <div className="mx-auto max-w-3xl rounded-lg border-2 border-bb-orange bg-bb-black-warm p-10 text-center shadow-bb-card">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-bb-orange">
          {t('eyebrow')}
        </div>
        <h2 className="font-bb-display-2 text-3xl font-extrabold text-bb-cream-bright md:text-4xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-bb-taupe">{t('description')}</p>
        <Link
          href="/ad-services"
          className="mt-8 inline-block rounded-sm bg-bb-orange px-7 py-4 font-bold uppercase tracking-widest text-bb-black"
        >
          {t('cta')}
        </Link>
      </div>
    </Section>
  );
};
```

- [ ] **Step 2: Insert it into the homepage between `SocialPlatforms` and the pricing strip**

In `src/app/[locale]/(unauth)/page.tsx`, import `AdServicesBand` and add `<AdServicesBand />` between `<SocialPlatforms />` and the pricing/CTA section.

- [ ] **Step 3: Commit**

```bash
git add src/templates/AdServicesBand.tsx src/app/[locale]/(unauth)/page.tsx
git commit -m "feat(homepage): add AdServicesBand upsell between social and pricing"
```

### Task 5.9: Apply BB component classes to the `/ad-services` page

**Files:**
- Modify: `src/app/[locale]/(unauth)/ad-services/page.tsx`
- Modify: `src/features/ad-services/AdServicesTierCard.tsx`

- [ ] **Step 1: Replace `bg-primary text-primary-foreground` buttons on /ad-services with the template's `bb-btn bb-btn-primary` style** (they already work because `bb-tokens.css` defines them; we just stop using shadcn `<Button>` for the marketing-page CTAs).

In `AdServicesTierCard.tsx`, replace the shadcn `<Button>` element with a plain `<button>` carrying the BB classes:

```tsx
<button onClick={onBuy} disabled={loading}
  className={config.featured
    ? "bb-btn bb-btn-primary w-full"
    : "bb-btn bb-btn-ghost w-full"}>
  {loading ? 'Loading…' : config.featured ? `Pick ${config.name}` : 'Start Here'}
</button>
```

In the `/ad-services` page hero CTAs, swap to `bb-btn bb-btn-primary` and `bb-btn bb-btn-ghost` as well.

- [ ] **Step 2: Verify the ad-services smoke test still passes (button labels unchanged)**

Run: `npx playwright test tests/e2e/AdServices.spec.ts`
Expected: 2 passed.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(unauth)/ad-services/page.tsx src/features/ad-services/AdServicesTierCard.tsx
git commit -m "feat(ad-services): apply BB component classes to tier CTAs"
```

---

## Phase 6 — Metadata + JSON-LD + sitemap + locale + OG

Goal: every entry point into the site (search, social share, sitemap crawl, locale switch) reflects the new positioning and product surface.

### Task 6.1: Update root metadata + JSON-LD in `[locale]/layout.tsx`

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Update the `title`, `description`, `openGraph`, `twitter`, and `LocalBusinessSchema` blocks**

Edit `src/app/[locale]/layout.tsx`:
- Replace `title` constant: `'Business Builders — Websites, Ads & AI Operating Layer for Small Business'`
- Replace `description` constant: `'Websites, automation, and done-for-you ad services for the people who run things. Plans from $20/mo. Ad services from $899.'`
- In `metadata.openGraph`: same title + description; keep the existing `images: ['/assets/images/og-image.jpg']` (replace with new version when available).
- In `metadata.twitter`: same updates.
- In `localBusinessSchema.description`: `'Website builds, AI-powered social and content, and done-for-you ad services for small businesses.'`
- In `localBusinessSchema.sameAs`: remove the `https://x.com/_Biz_Builder` entry. (Add it back when an active social handle exists.)
- Find the FAQPage schema entries that mention "Twitter automation" and rewrite to the Reels/Video and ad-services language.

- [ ] **Step 2: Build + type-check**

Run: `npm run check-types && npm run build 2>&1 | tail -5`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/layout.tsx
git commit -m "feat(meta): update root metadata, OG, JSON-LD for new positioning"
```

### Task 6.2: Update `src/app/sitemap.ts`

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add `/en/pricing`, `/en/ad-services`, `/fr/pricing`, `/fr/ad-services` and `/fr` root**

Replace the function body with:

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const locales = ['en', 'fr'];
  const now = new Date();

  const localePages = locales.flatMap(l => [
    { url: `${base}/${l}`, lastModified: now, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${base}/${l}/pricing`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/${l}/ad-services`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/${l}/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${base}/${l}/privacy-policy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
  ]);

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    ...localePages,
  ];
}
```

- [ ] **Step 2: Verify by hitting the route**

Run: `npm run dev:next` then `curl -s http://localhost:3000/sitemap.xml | grep -c "ad-services"`
Expected: `2` (one per locale).

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(sitemap): include /pricing and /ad-services for both locales"
```

### Task 6.3: Update `src/locales/en.json` for positioning + Twitter→Reels swap

**Files:**
- Modify: `src/locales/en.json`

- [ ] **Step 1: Make the keyed edits**

Open `src/locales/en.json` and apply these edits (each is a find-and-replace on the value):

| Path | New value |
|---|---|
| `Header.meta_title` | `"Business Builders — Websites, Ads & AI Operating Layer for Small Business"` |
| `Header.meta_description` | `"Websites, automation, and done-for-you ad services for the people who run things. Plans from $20/mo. Ad services from $899."` |
| `Hero.eyebrow` (NEW) | `"YOUR AI BACK-OFFICE"` |
| `Hero.title` | `"We run the busywork. <em>You run the shop.</em>"` |
| `Hero.description` | `"Call it an AI operating layer for small business — site, social, and content, handled daily. Plans from $20/mo."` |
| `Hero.primary_cta` (NEW) | `"See the Plans"` |
| `Hero.secondary_cta` (NEW) | `"Need Ads?"` |
| `Hero.follow_twitter` | (DELETE the key entirely; no longer used) |
| `Navbar.ad_services` (NEW) | `"Ad Services"` |
| `AdServicesBand.eyebrow` (NEW) | `"✦ READY TO GROW? ✦"` |
| `AdServicesBand.title` (NEW) | `"Need customers in the door this month?"` |
| `AdServicesBand.description` (NEW) | `"We design and run targeted ads that bring real people through the door. Three tiers — pick yours."` |
| `AdServicesBand.cta` (NEW) | `"See Ad Services"` |
| `Features.section_title` | `"Everything your AI back-office handles"` |
| `Features.feature4_title` | `"Video Content & Instagram Reels"` |
| `Features.feature4_description` | `"We script, shoot, and edit short-form video — Reels, Shorts, and TikToks — that bring people through your door."` |
| `PricingPlan.feature_team_member` | `"{number} Reel / Short / Ad Creative per month"` |
| (FAQ Q on social media uniqueness) | Replace "Twitter automation" with "ad services" |
| (FAQ Q on Twitter posting frequency) | Rewrite as "How often will you post Reels and ads for me?" with a matching answer |
| (FAQ Q on Twitter automation works) | Rewrite as "How does the ad and Reels service work?" with a matching answer |

- [ ] **Step 2: Verify the JSON parses**

Run: `node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('src/locales/en.json','utf8'))))"`
Expected: list of top-level namespaces, no parse error.

- [ ] **Step 3: Commit**

```bash
git add src/locales/en.json
git commit -m "feat(i18n): rewrite EN locale for AI-operating-layer + Reels/Video swap"
```

### Task 6.4: Mirror the swaps in `src/locales/fr.json`

**Files:**
- Modify: `src/locales/fr.json`

- [ ] **Step 1: Apply French translations of every key changed/added in Task 6.3**

Same key map as above; use these French translations:

| Path | New value (French) |
|---|---|
| `Hero.eyebrow` | `"VOTRE BACK-OFFICE IA"` |
| `Hero.title` | `"On gère la paperasse. <em>Vous gérez la boutique.</em>"` |
| `Hero.description` | `"Une couche d'exploitation IA pour petite entreprise — site, réseaux sociaux et contenu, gérés au quotidien. Forfaits dès 20 $/mois."` |
| `Hero.primary_cta` | `"Voir les Forfaits"` |
| `Hero.secondary_cta` | `"Besoin de Pubs?"` |
| `Navbar.ad_services` | `"Services Pub"` |
| `AdServicesBand.eyebrow` | `"✦ PRÊT À GRANDIR? ✦"` |
| `AdServicesBand.title` | `"Besoin de clients ce mois-ci?"` |
| `AdServicesBand.description` | `"Nous concevons et diffusons des pubs ciblées qui attirent de vrais clients. Trois forfaits — choisissez le vôtre."` |
| `AdServicesBand.cta` | `"Voir les Services Pub"` |
| `Features.feature4_title` | `"Vidéo et Instagram Reels"` |
| `Features.feature4_description` | `"Nous scriptons, tournons et montons des vidéos courtes — Reels, Shorts, TikToks — qui font entrer les gens dans votre boutique."` |
| `PricingPlan.feature_team_member` | `"{number} Reel / Short / Pub Créative par mois"` |

Apply equivalent French rewrites to the three Twitter-related FAQ entries.

- [ ] **Step 2: Verify French JSON parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/fr.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add src/locales/fr.json
git commit -m "feat(i18n): mirror EN locale rewrites in French"
```

### Task 6.5: Add locale-key parity test

**Files:**
- Create: `src/locales/locale-parity.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/locales/locale-parity.test.ts
import { describe, expect, it } from 'vitest';
import en from './en.json';
import fr from './fr.json';

// Recursively collect all leaf paths in a nested object.
const collectPaths = (obj: unknown, prefix = ''): string[] => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectPaths(v, prefix ? `${prefix}.${k}` : k),
  );
};

describe('Locale parity (en ↔ fr)', () => {
  it('every EN translation key exists in FR', () => {
    const enPaths = new Set(collectPaths(en));
    const frPaths = new Set(collectPaths(fr));
    const missingInFr = [...enPaths].filter(p => !frPaths.has(p));
    expect(missingInFr).toEqual([]);
  });

  it('every FR translation key exists in EN (catches stale FR keys)', () => {
    const enPaths = new Set(collectPaths(en));
    const frPaths = new Set(collectPaths(fr));
    const missingInEn = [...frPaths].filter(p => !enPaths.has(p));
    expect(missingInEn).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/locales/locale-parity.test.ts`
Expected: 2 passed. (If either fails, the listed paths point at the specific missing keys to add.)

- [ ] **Step 3: Commit**

```bash
git add src/locales/locale-parity.test.ts
git commit -m "test(i18n): assert key parity between en.json and fr.json"
```

### Task 6.6: Add copy-blacklist grep test

**Files:**
- Create: `src/locales/copy-voice.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/locales/copy-voice.test.ts
import { describe, expect, it } from 'vitest';
import en from './en.json';

// Brand voice doc rejects techy SaaS language. This test greps every string
// value in the EN locale for banned terms (case-insensitive). "AI operating
// layer" is allow-listed by exception per the user's hybrid-voice positioning.

const BANNED = [
  /\bplatform\b/i,
  /\bsolution\b/i,
  /\bunlock\b/i,
  /\bleverage\b/i,
  /\btransform\b/i,
  /\bsynergy\b/i,
  /\bcutting[- ]edge\b/i,
  /\bempower\b/i,
  /\bautopilot\b/i,
  /\bAI tokens?\b/i,
  /🚀/,
  /✨/,
];

const ALLOW = [
  // Deliberate exception — the hero subhead's "AI operating layer" phrase.
  /AI operating layer/i,
];

const walk = (obj: unknown, path = ''): Array<[string, string]> => {
  if (typeof obj === 'string') return [[path, obj]];
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      walk(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
};

describe('EN copy voice — no SaaS-speak', () => {
  const strings = walk(en);
  it.each(BANNED.map(rx => [rx.source]))('no string matches /%s/', (rxSource) => {
    const rx = new RegExp(rxSource, 'i');
    const offenders = strings
      .filter(([, v]) => rx.test(v))
      .filter(([, v]) => !ALLOW.some(a => a.test(v)));
    if (offenders.length) {
      const msg = offenders.map(([p, v]) => `  ${p}: ${v}`).join('\n');
      throw new Error(`Banned term in EN copy:\n${msg}`);
    }
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it** — expect failures if any legacy copy still has banned terms; fix the offending keys in en.json (this is the "rewrite legacy SaaS-speak" pass).

Run: `npx vitest run src/locales/copy-voice.test.ts`

If it fails: open `src/locales/en.json`, rewrite the keys listed in the error message (e.g., "all-in-one platform" → "all-in-one shop"). Re-run until green.

- [ ] **Step 3: Commit**

```bash
git add src/locales/copy-voice.test.ts src/locales/en.json
git commit -m "test(voice): grep EN copy for banned SaaS-speak; rewrite legacy strings"
```

### Task 6.7: Add a placeholder OG image for /ad-services

**Files:**
- Create: `public/assets/images/og-ad-services.jpg` (placeholder)

- [ ] **Step 1: Create a 1200×630 placeholder**

For v1, copy the existing OG image as a placeholder. Donovan can replace with a designed version later.

```bash
cp public/assets/images/og-image.jpg public/assets/images/og-ad-services.jpg
```

- [ ] **Step 2: Commit**

```bash
git add public/assets/images/og-ad-services.jpg
git commit -m "feat(og): add placeholder OG image for /ad-services (replace later)"
```

---

## Phase 7 — Visual + mobile + accessibility + regression

Goal: dot the i's. Cross-browser, mobile, a11y, full Stripe flow, subscription regression, build clean.

### Task 7.1: Run the full test suite

- [ ] **Step 1: Vitest**

Run: `npx vitest run`
Expected: all tests pass (schema, route contracts, webhook contracts, locale parity, copy voice).

- [ ] **Step 2: Playwright**

Run: `npx playwright test`
Expected: all e2e tests pass (DashboardUntouched, AdServices smoke, Visual baseline).

- [ ] **Step 3: Lint + types + build**

Run: `npm run lint && npm run check-types && npm run build`
Expected: all clean.

### Task 7.2: Manual Stripe verification (end-to-end)

- [ ] **Step 1: Run dev server, open an incognito window (guest scenario)**

```bash
npm run dev:next
```

- [ ] **Step 2: Visit `/en/ad-services`, click "Pick The Combo," reach Stripe Checkout (test mode), use card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`, email `test@example.com`, phone `+15555550100`, complete the payment.**

Expected:
- Redirects to `/en/ad-services/welcome?ref=cs_test_xxx` and shows "Thanks — we got it. Your **combo** package is paid…"
- Stripe Dashboard (test mode) → Payments shows the $1,499 charge with the test customer's email and phone
- Application logs (terminal running dev:next) show `[stripe-webhook][ad_service] purchase {...}`

- [ ] **Step 3: Subscription regression** — sign in as an existing test user, click any tier on `/en/pricing`, complete checkout with the test card. Expected: redirects to `/dashboard/billing?success=true` and the `organization.plan` row updates as before.

### Task 7.3: Mobile + a11y pass

- [ ] **Step 1: Open the new pages at 375×667 (iPhone SE) in DevTools.** Verify the CenteredMenu mobile dropdown opens, is legible (cream on warm-black with ≥4.5:1 contrast), and that all CTAs are reachable.

- [ ] **Step 2: Keyboard nav** — Tab through homepage, /ad-services, /pricing. Verify focus rings are visible (2px cream outline at 3px offset per the design system).

- [ ] **Step 3: Reduced-motion** — In OS settings (or DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce), confirm the 120ms hover transitions still feel snappy and nothing parallaxes or animates aggressively.

### Task 7.4: Final commit + push

- [ ] **Step 1: Tidy any final small fixes from manual review with focused commits.**

- [ ] **Step 2: Push the worktree branch**

```bash
git push -u origin worktree-signpainter-rebrand
```

- [ ] **Step 3: Open PR back to `feature/UIReBrand`** (or whichever branch the user wants to merge into).

```bash
gh pr create --base feature/UIReBrand --head worktree-signpainter-rebrand \
  --title "Sign-painter rebrand + AI Operating Layer + Ad-Services launch" \
  --body "Implements docs/superpowers/specs/2026-05-12-bb-rebrand-design.md per docs/superpowers/plans/2026-05-31-bb-rebrand-implementation.md."
```

---

## Self-review checklist (run before considering plan complete)

- [ ] Every spec section maps to at least one task.
- [ ] Every NEW file in spec scope appears in a task.
- [ ] No TBDs, TODOs, or "implement appropriately" hand-waves.
- [ ] Every TDD task has the failing-test step before the implementation step.
- [ ] Commit cadence: roughly one commit per task, never less, sometimes one per step on large tasks.
- [ ] Test infrastructure used matches what actually exists in the repo (Vitest + Playwright + Percy, no fictional frameworks).
- [ ] Stripe behavior decisions (guest-allowed ad_service, env-required price IDs, no automatic_tax v1, log-only fulfillment + Stripe Dashboard notifications) line up with the spec.
- [ ] `.bb-marketing` scoping enforced mechanically by Phase 1 / Task 1.1 test, re-asserted after every Phase 5 commit.
- [ ] Locale parity + copy-blacklist tests in Phase 6 catch missing French keys and SaaS-speak.
- [ ] Build order respects: contracts before UI, scoping before token swap, metadata last.
