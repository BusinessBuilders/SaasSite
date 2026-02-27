# Business Builders — Project Context

## Branch: `feature/dashboard-stripe-rebuild`

6 commits on this branch (off `master` at `953ce3b`).

## What Was Done

### Wave 1: Foundation (Schema + Config + Types)
- **`src/models/Schema.ts`** — Added `plan` (text, default 'free'), `subscriptionStatus` (text), `tokenBalance` (integer, default 100) to organization table
- **`src/utils/AppConfig.ts`** — Replaced old PLAN_ID (FREE/PREMIUM/ENTERPRISE) with self-service `PLAN_ID` (FREE/STARTER/GROWTH/PRO at $20/$49/$99) and `MANAGED_PLAN_ID` (ESSENTIALS/GROWTH_MANAGED/ENTERPRISE at $99/$249/$499). Added `ManagedPlanList` with Calendly links.
- **`src/types/Subscription.ts`** — Extended PricingPlan.features with `aiTokens`, `socialPlatforms`, `customDomain`, `scheduling`. Added `ManagedPlan` type. Updated `SUBSCRIPTION_STATUS`.
- **`src/libs/Env.ts`** — Added optional `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO` server env vars
- **`migrations/0001_pale_spirit.sql`** — Generated Drizzle migration for new columns
- **`src/features/billing/PricingInformation.tsx`** — Updated to use new feature fields (aiTokens, socialPlatforms, customDomain, scheduling)
- **`src/locales/en.json`** — New plan names (starter/growth/pro), new feature labels

### Wave 2: Stripe Rebuild (Critical)
- **`src/app/api/stripe/webhook/route.ts`** — Complete rewrite. Handles 5 events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`. Always returns 200 (prevents Stripe from disabling endpoint). Maps price IDs to plan names. Structured logging.
- **`src/app/api/stripe/create-checkout/route.ts`** — Creates Stripe customer on first checkout and saves to org table. Maps new plan IDs to env-var price IDs. Success URL → `/dashboard/billing`.
- **`src/app/api/stripe/create-portal/route.ts`** — Falls back to userId when orgId is null. Returns to `/dashboard/billing`.

### Wave 3: Middleware
- **`src/middleware.ts`** — Removed forced org creation redirect (lines 102-111). Added `/pricing` and `/:locale/pricing` as public routes.

### Wave 4: Dashboard Overhaul
- **`src/features/dashboard/Sidebar.tsx`** (NEW) — Client component with nav items: Overview, My Website (external), Social Media (external), Blog (external → Ghost), AI Tools, Billing, Settings. Uses lucide-react icons. Hidden on mobile.
- **`src/features/dashboard/DashboardTopBar.tsx`** (NEW) — Slim bar with mobile hamburger (Sheet with sidebar), ThemeToggle, LocaleSwitcher, Clerk UserButton.
- **`src/app/[locale]/(auth)/dashboard/layout.tsx`** — Replaced top-nav with sidebar (256px left) + main content layout.
- **`src/app/[locale]/(auth)/dashboard/page.tsx`** — Server component. Shows welcome card, stats (plan, tokens, billing), upgrade banner for free users, quick action cards (Website, Social, Blog).
- **`src/app/[locale]/(auth)/dashboard/billing/page.tsx`** (NEW) — Shows current plan, status badge, token balance. Free users see upgrade cards with BuyNowButton. Paid users see Manage Billing button → Stripe portal.
- **`src/app/[locale]/(auth)/dashboard/billing/ManageBillingButton.tsx`** (NEW) — Client component that calls `/api/stripe/create-portal`.
- Installed shadcn components: `card`, `sheet`, `scroll-area`

### Wave 5: Homepage + Pricing
- **`src/templates/Navbar.tsx`** — Fixed all links. Services → `/#features`, Blog → `blog.business-builder.online` (external), Pricing → `/pricing`, About → `/#about`. Removed broken Docs/Community links.
- **`src/templates/Hero.tsx`** — New headline: "Build Your Website. Manage Social Media. Grow Your Business." Secondary CTA: "Start Free" → `/sign-up` (replaced GitHub button). Kept Twitter badge and Calendly CTA.
- **`src/templates/Footer.tsx`** — Same link fixes as Navbar.
- **`src/templates/SocialPlatforms.tsx`** (NEW) — "Manage All Your Social Media" section. TikTok (live), Facebook/Instagram (coming soon). CTA → /sign-up.
- **`src/app/[locale]/(unauth)/pricing/page.tsx`** (NEW) — Two sections: Platform Plans (self-service with BuyNowButton) and Managed Services (done-for-you with Calendly links).
- **`src/app/[locale]/(unauth)/page.tsx`** — Replaced `<Sponsors />` with `<SocialPlatforms />`.
- **`src/templates/Pricing.tsx`** — Updated to use new PLAN_ID (STARTER/GROWTH/PRO).

### Wave 6: Verification
- Security check: no leaked secrets, `.gitignore` covers `.env`
- **Fixed `.env.production.local`**: `NEXT_PUBLIC_APP_URL` was missing `https://` protocol (caused build failure)
- `npm run build` passes

### Ghost Blog Integration (Done — linking only)
Blog links point to `https://blog.business-builder.online` in: Navbar, Footer, Dashboard Sidebar, Dashboard overview card. Ghost admin link (`/ghost`) in dashboard "Write a Post" button. **Ghost CMS installation/setup is NOT in scope** — that's separate infrastructure.

## What's Left To Do (NOT done yet)

### Before Deploying
1. **Set Stripe price env vars** in production: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`
2. **Run DB migration** on production database (migration auto-applies on next DB interaction, but verify)
3. **Register new Stripe webhook** in Stripe Dashboard → Developers → Webhooks. Add these 5 events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`
4. **Push branch**: `git push -u origin feature/dashboard-stripe-rebuild`

### Deferred / Future Work
- Ghost CMS installation and DNS setup for `blog.business-builder.online`
- Ghost multi-tenant blog for customers
- Annual pricing toggle (needs annual Stripe price IDs created)
- AI Tools dashboard page (`/dashboard/ai-tools` — route exists in sidebar but no page)
- Website editor integration (external service)
- Email notifications for billing events
- Payment history display (use Stripe portal for now)
- French translations for new content (`src/locales/fr.json` not updated)
- Settings page in dashboard (currently links to Clerk user profile)

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Clerk auth, Stripe billing, PostgreSQL via Drizzle ORM
- shadcn/ui components, lucide-react icons
- next-intl for i18n (en/fr locales)

## Key Patterns
- Billing is on the **organization table** (each Clerk user = their own org via `userId`)
- Stripe webhook uses `stripeCustomerId` for lookups on subscription events, `client_reference_id` (= userId) for checkout events
- All Stripe API routes use `Env` (t3-env validated) for secrets
- Dashboard is `force-dynamic`, pricing page is `force-dynamic`
- Blog is external Ghost CMS — no blog routes in Next.js middleware
