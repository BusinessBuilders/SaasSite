# Business Builder — Sign-Painter Rebrand, AI Operating Layer & Ad-Services Launch

**Date:** 2026-05-12 (updated 2026-05-25)
**Branch (target):** `feature/UIReBrand` → worktree `worktree-signpainter-rebrand`
**Status:** Approved (brainstorming phase complete)

---

## Goal

Pivot the public-facing site to a bold American sign-painter aesthetic and present **two complementary offerings**:

1. **AI Operating Layer** — the existing SaaS subscription ($20 / $49 / $99 monthly), repositioned as the always-on AI back-office that runs a small business's site, social, and content. Plans, prices, features, and Stripe wiring are **unchanged** — this is a copy/positioning layer only. This is the homepage's primary front door.
2. **Ad Services** — a NEW one-time done-for-you product line ($899 / $1,499 / $2,499), presented as the "ready to grow?" upsell with its own `/ad-services` page.

Keep the existing logged-in app surface (Clerk auth, dashboard, billing, webhooks, DB schema) functionally untouched — restyle the public marketing pages only.

The visual source of truth is the design system at `/home/magiccat/Downloads/Business-Builder-Design-System/`, specifically `colors_and_type.css` (tokens) and `ui_kits/ad-services/index.html` (the ad-services page layout).

### Positioning & voice

The brand voice doc rejects techy SaaS language ("NOT: Tech. SaaS. Innovation. Glossy AI futurism"). So the "AI operating layer" concept is expressed in **hybrid sign-painter voice**: a plain-spoken headline with the literal phrase named once in the subhead.

- **Homepage hero eyebrow:** `YOUR AI BACK-OFFICE`
- **Homepage hero headline:** "We run the busywork. You run the shop."
- **Homepage hero subhead:** "Call it an AI operating layer for small business — site, social, and content, handled daily. Plans from $20/mo."
- **Primary CTA:** → `/pricing` (the AI layer plans). **Secondary CTA:** → `/ad-services`.

The six existing capabilities (Custom Applications, Graphic Design, Social Media Management, Video Content & Reels, Content Creation, Digital Marketing) are reframed as **what the AI operating layer does** — the components of the back-office, not a generic services list.

---

## Approach

**Approach 1: CSS-import + Tailwind extension, scoped to public marketing only.** Drop the design system's `colors_and_type.css` into the Next.js global stylesheet pipeline. Extend `tailwind.config.ts` with matching theme tokens so developers can write either Tailwind utilities (`bg-bb-orange`) or the design system's component classes (`bb-btn-primary`, `bb-display-stack`, `bb-grain`). Two notations, one source of truth.

This avoids rewriting the template's hand-tuned components (stacked shadows, grain overlay, double-rule dividers) in Tailwind while keeping Tailwind's utility productivity for layout and one-offs.

### Theme blast-radius scoping (post-Codex revision)

`src/styles/global.css` and Clerk's `appearance` props affect every route, including `/dashboard` and `/sign-in`. To honor the "dashboard untouched" guarantee, the BB sign-painter tokens are gated behind a `.bb-marketing` wrapper class added to the `(unauth)` route group's layout (or its `<body>`).

- Marketing tokens override shadcn defaults **only inside `.bb-marketing`** — e.g., `.bb-marketing { --background: var(--bb-black); --foreground: var(--bb-cream); ... }`.
- Outside `.bb-marketing`, shadcn's existing `--background`/`--foreground` tokens are unchanged, so dashboard and Clerk render as today.
- `bb-*` component classes (e.g., `bb-btn-primary`) are CSS classes that exist globally but only have visible effect when rendered inside `.bb-marketing` (or used explicitly on a marketing component).
- **Guideline:** prefer Tailwind/shadcn tokens (`bg-primary`, `text-foreground`) for components; reserve the `bb-*` component classes for one-off template parity on `/ad-services` and the marketing hero where the template's stacked shadows / hand-set type are hard to express otherwise. (Per Codex review.)

### Font loading

Use `next/font/google` in `src/app/[locale]/layout.tsx` (not raw `<link>` tags). Better performance (no CLS, self-hosted), better Next.js integration, and aligned with the App Router idioms already used in the codebase.

### Rejected alternatives

- **Pure Tailwind translation** — too much work, risks subtle visual drift from the template.
- **Wholesale page replacement (copy raw HTML)** — fastest visually but leaves two CSS systems forever; long-term maintenance burden.

---

## Scope

### IN scope — files we will modify or create

**Visual restyle (public marketing pages):**

- `src/templates/Navbar.tsx` — restyle to BB tokens; cream text on warm-black, orange CTA, eyebrow labels
- `src/templates/Hero.tsx` — restyle AND reposition: new eyebrow `YOUR AI BACK-OFFICE`, headline "We run the busywork. You run the shop.", subhead naming "AI operating layer for small business … Plans from $20/mo.", primary CTA → `/pricing`, secondary CTA → `/ad-services`; remove `TwitterLogoIcon` import and the Twitter badge
- `src/templates/SocialPlatforms.tsx` — restyle cards to BB tokens
- `src/templates/Pricing.tsx` — restyle to BB pricing-card aesthetic with stacked shadows and orange "featured" ring on Growth tier
- `src/templates/Footer.tsx` — restyle with double-rule divider and "hand-built" tagline
- `src/templates/AdServicesBand.tsx` (NEW) — homepage upsell band: short "ready to grow?" pitch + CTA → `/ad-services`
- `src/app/[locale]/(unauth)/page.tsx` — wire `AdServicesBand` into the homepage section order (after SocialPlatforms, before Pricing strip)
- `src/app/[locale]/(unauth)/pricing/page.tsx` — restyle + reframe AI-layer plans (plans, prices, Stripe wiring unchanged; visual + framing only)

**Design system plumbing:**

- `src/styles/global.css` — import `bb-tokens.css`; **scope BB token overrides to `.bb-marketing`** so dashboard/auth stay on shadcn defaults.
- `tailwind.config.ts` — extend `theme.colors` with `bb.*` tokens; extend `theme.fontFamily` with `bb-display`, `bb-display-2`, `bb-body`; extend `theme.boxShadow` with `bb-letter`, `bb-card`, `bb-featured`. Add `safelist` entries for any dynamically-composed `bb-*` Tailwind utilities to prevent purge.
- `src/styles/bb-tokens.css` (NEW) — vendored copy of the design system's `colors_and_type.css`. Lives in `src/styles/` (not `public/`) since it's a CSS source, not a served asset.
- `src/app/[locale]/layout.tsx` — load Bricolage Grotesque + Funnel Display via **`next/font/google`** (not raw `<link>`). Update `metadata.title`, `metadata.description`, `metadata.openGraph.*`, `metadata.twitter.*` to remove "Social Media"/"Twitter" framing and reflect the AI-Operating-Layer + Ad-Services positioning. Update the JSON-LD `LocalBusinessSchema.description`, `sameAs[]` (remove the `x.com/_Biz_Builder` entry or replace with current social), and the `FAQPage` schema items mentioning Twitter. Replace the old OG image (`/assets/images/og-image.jpg`) with a new sign-painter version (Donovan to provide, or generate from the design system).
- `src/app/[locale]/(unauth)/layout.tsx` (NEW or modified — verify if exists) — add `className="bb-marketing"` on the route group's wrapper so all unauth pages live inside the BB-scoped CSS island.

**Shared marketing primitives (touched, but with care):**

- `src/features/landing/CenteredMenu.tsx` — restyle the desktop + mobile menus to BB tokens. The mobile dropdown currently uses `bg-secondary`; under the BB theme this maps to a dark warm-black surface with cream text. Verify no `(auth)` consumer pulls this component (grep first; if it does, scope styles via a parent class).
- `src/features/landing/Section.tsx` — restyle to BB tokens (eyebrow + spacing rhythm). Same caveat: verify no `(auth)` consumer.
- `src/components/ThemeToggle` — **decision: hide the light/dark toggle inside `(unauth)` pages** because the sign-painter aesthetic is intentionally dark-only. Keep the toggle visible inside `(auth)/dashboard` where shadcn light/dark still applies. Implementation: render the toggle conditionally in Navbar based on route group, or omit it from the marketing Navbar entirely.

**SEO + crawl surface:**

- `src/app/sitemap.ts` — add `/en/pricing` (currently missing!), `/en/ad-services`, `/fr/pricing`, `/fr/ad-services` entries with appropriate `priority`/`changeFrequency`.
- `src/app/robots.ts` (verify exists; if not, NEW) — confirm `/ad-services` is crawlable; disallow `/dashboard/*` and `/api/*`.

**Page-level metadata + OG (NEW per Codex):**

- `src/app/[locale]/(unauth)/ad-services/page.tsx` — export a `metadata` object with title, description, `openGraph.images` pointing at a new `/assets/images/og-ad-services.jpg`, and `twitter` card.

**NEW ad-services page:**

- `src/app/[locale]/(unauth)/ad-services/page.tsx` (NEW) — port of `ui_kits/ad-services/index.html` as a React Server Component. Sections: header (reuses existing Navbar), hero, problem grid, how-it-works steps, three pricing tiers, ad-spend note, guarantee, FAQ, CTA, footer (reuses existing Footer). Use `force-dynamic` like the other unauth pages.
- `src/features/ad-services/AdServicesTierCard.tsx` (NEW) — client component for one tier with a `BuyNowButton` that POSTs to `/api/stripe/create-checkout` with `mode: 'payment'`
- `src/app/api/stripe/create-checkout/route.ts` — add a one-time-payment **guest-allowed** branch alongside the existing logged-in subscription branch. Accepts a discriminated union: `{ productType: 'subscription', planId }` (requires Clerk auth, existing path) or `{ productType: 'ad_service', tier: 'static'|'combo'|'motion' }` (NO auth required). For `ad_service`: `mode: 'payment'`, `customer_creation: 'always'`, `customer_email` if user is logged in, `phone_number_collection.enabled = true`, `client_reference_id` = Clerk userId if present else a generated UUID, `metadata: { productType, tier, locale, generatedRef }`, `success_url: /ad-services/welcome?ref={CHECKOUT_SESSION_ID}`, `cancel_url: /ad-services`.
- `src/app/api/stripe/webhook/route.ts` (was OUT, now IN) — additive change: a guard so the existing subscription path doesn't run when `session.metadata.productType === 'ad_service'`; a new branch that logs the ad-service purchase (tier, amount, customer email/phone). Team notification is handled by **Stripe Dashboard's built-in payment notifications** (Settings → Notifications → "Successful payments" → toggled to donovan@business-builder.online). Customer receipt is automatic via Stripe. No new email infrastructure in v1.
- `src/app/[locale]/(unauth)/ad-services/welcome/page.tsx` (NEW) — post-purchase "Thanks, we'll be in touch" page. Reads `?ref=cs_xxx` from query, displays a confirmation message with the tier purchased. Calls a server action to look up the session and confirm the payment succeeded (defense against direct URL visits). `force-dynamic`.
- `src/app/[locale]/(unauth)/ad-services/error.tsx` + `loading.tsx` (NEW) — minimal error/loading states.
- `src/libs/Env.ts` — `STRIPE_PRICE_AD_STATIC`, `STRIPE_PRICE_AD_COMBO`, `STRIPE_PRICE_AD_MOTION` are **required** server env vars (not optional). The build fails if missing — better than silently rendering a checkout button that 500s.

**Content swaps — positioning + Twitter→Reels:**

- `src/locales/en.json` — AI-layer repositioning keys (`Hero.title`, `Hero.description`, new hero eyebrow + CTA keys, `Features.section_title`, `Pricing.section_title`) AND Twitter→Reels keys (`Hero.follow_twitter`, `Features.feature4_title`, `Features.feature4_description`, `Pricing.feature_team_member`, 3 FAQ Q/A pairs)
- `src/locales/fr.json` — same keys, French translations

**Navbar link addition:**

- `src/templates/Navbar.tsx` — add "Ad Services" entry between "Pricing" and "About" linking to `/ad-services`
- `src/templates/Footer.tsx` — same link

**Blog (external subdomain) — link preservation:**

The blog lives at `https://blog.business-builder.online` (Ghost CMS, separate infrastructure). The main site does not host blog content — it only links out.

- `src/templates/Navbar.tsx` — preserve the existing external "Blog" link → `https://blog.business-builder.online` (with `target="_blank"` and `rel="noopener noreferrer"`); restyle to BB tokens like the other nav items.
- `src/templates/Footer.tsx` — preserve the same external Blog link, restyled.
- `src/app/[locale]/(auth)/dashboard/Sidebar.tsx` — already has the blog link; touched ONLY if the dashboard restyle scope changes (currently out of scope, so untouched).
- No DNS, no proxy, no rewrite — the link is a plain external anchor.

### OUT of scope — files we will NOT touch

- `src/app/[locale]/(auth)/sign-in/`, `sign-up/` — Clerk pages stay stock
- `src/middleware.ts` — auth/routing flow unchanged (the `/ad-services` route is already public under the `(unauth)` group, no middleware change needed)
- `src/app/[locale]/(auth)/dashboard/` — entire dashboard untouched (sidebar, top bar, overview, billing pages — all stay as-is)
- `src/features/billing/` — Stripe customer/portal/subscription logic untouched
- ~~`src/app/api/stripe/webhook/route.ts` — webhook untouched~~ (MOVED to IN scope per Codex review — the additive `ad_service` branch + the guard against the existing subscription path running on ad-service sessions both require changes.)
- `src/app/api/stripe/create-portal/route.ts` — untouched
- `src/models/Schema.ts` — DB schema untouched (ad-service purchases live in Stripe; no new tables needed for v1)
- Existing SaaS tiers (STARTER / GROWTH / PRO at $20 / $49 / $99 monthly) — prices, env vars, Stripe IDs preserved (only their marketing framing changes)
- Existing managed-services tiers ($99 / $249 / $499) — preserved
- Logo files under `public/assets/images/logo-*.png` — already added in this branch, preserved
- No new $20 tripwire product (out of scope; saved for a follow-up)
- **Ghost CMS at `blog.business-builder.online`** — the blog runs on separate infrastructure (its own server, theme, admin). Only the link out from this site is touched. Matching the Ghost theme to the sign-painter aesthetic is real work (Ghost has its own Handlebars template files in `/ghost/content/themes/…`) and is tracked as a follow-up below.

---

## Architecture

### Design token flow

```
design-system repo                     this repo
─────────────────                      ───────────
colors_and_type.css   ─── copy ───►    public/assets/css/bb-tokens.css
                                              │
                                              ▼
                                       src/styles/global.css
                                              │ @import
                                              ▼
                                       browser :root CSS vars
                                              ▲
                                              │ mirrored as
                                       tailwind.config.ts
                                              │ theme.extend.colors.bb.*
                                              ▼
                                       Tailwind utilities (bg-bb-orange, etc.)
```

A developer can write `<button className="bb-btn bb-btn-primary">` and get the exact template button, or `<button className="bg-bb-orange text-bb-black uppercase tracking-widest ...">` for a one-off — both pull from the same `--bb-*` CSS variables.

### Ad-services purchase flow

```
/ad-services page
    │
    ▼ user clicks a tier CTA (e.g. "Pick the Combo")
AdServicesTierCard (client component)
    │
    ▼ POST { productType: 'ad_service', plan: 'combo' }
/api/stripe/create-checkout
    │
    ▼ branches on productType
        ├── subscription → mode: 'subscription'  (existing, unchanged)
        └── ad_service   → mode: 'payment'       (NEW)
                            line_items: [{ price: STRIPE_PRICE_AD_COMBO, quantity: 1 }]
                            metadata: { productType: 'ad_service', plan: 'combo', userId }
                            success_url: /ad-services/welcome
                            cancel_url:  /ad-services
    │
    ▼ Stripe Checkout
checkout.session.completed webhook
    │
    ▼ existing handler reads session.metadata.productType
        ├── subscription → existing org-table update path
        └── ad_service   → log + flag for human follow-up (v1: just log; future: intake form on /welcome)
```

The webhook already runs on `checkout.session.completed` and returns 200 unconditionally. We add a single `if (metadata.productType === 'ad_service')` branch that logs the purchase and (for v1) does nothing else — the actual fulfillment is a human handoff via the contact info collected by Stripe.

### Why no DB schema change

V1 of ad-services treats each purchase as a transactional event: Stripe collects payment, captures the customer email/phone, and the team starts an engagement out-of-band. We don't need a database row to "manage" an ad-services subscription because there isn't one — it's a setup fee. If the product grows into recurring retainers later, we add tables then.

---

## Page-by-page result

```
PUBLIC (sign-painter aesthetic — bold display, stacked shadows, grain, BB tokens)
├── /                     Homepage  (AI Operating Layer = primary; Ad Services = upsell)
│     - Restyled Navbar (cream/orange, eyebrow labels; adds "Ad Services" link)
│     - Repositioned Hero: eyebrow "YOUR AI BACK-OFFICE", headline
│       "We run the busywork. You run the shop.", subhead names "AI operating
│       layer for small business … Plans from $20/mo.", primary CTA → /pricing,
│       secondary CTA → /ad-services
│     - Features section: reframed as "what the AI operating layer does"
│       (feature4 swapped Twitter → "Video Content & Instagram Reels")
│     - SocialPlatforms section: TikTok/FB/IG cards restyled to BB tokens
│     - NEW Ad Services upsell band: short pitch + CTA → /ad-services
│     - Pricing strip linking to /pricing
│     - Restyled Footer
│
├── /pricing              Two product lines preserved
│     - AI Operating Layer plans: Starter/Growth/Pro restyled (same $20/$49/$99);
│       section framed as tiers of the AI operating layer
│     - Managed Services: Essentials/Growth/Enterprise restyled (same $99/$249/$499)
│     - Same Stripe wiring; visual + framing only
│
├── /ad-services          NEW — done-for-you ad packages
│     - Hero + problem + how-it-works
│     - Three tiers: Static $899 / Combo $1,499 / Motion $2,499
│     - Combo tier is "featured" (orange ring, sticker)
│     - Each tier's CTA → Stripe Checkout (one-time payment)
│     - Guarantee, FAQ, CTA, footer
│
LOGGED-IN APP  (UNTOUCHED)
├── /sign-in, /sign-up    Clerk default styling, unchanged
├── /dashboard             Existing layout, unchanged
├── /dashboard/billing     Existing, unchanged
└── All API routes (auth, billing, subscription) unchanged
```

---

## Content swaps

### A. Hero repositioning → AI Operating Layer (hybrid voice)

| Key | Before | After |
|---|---|---|
| `Hero.title` | "Build Your Website. Manage Social Media. Grow Your Business." | "We run the busywork. You run the shop." |
| `Hero.description` | "The all-in-one platform … Plans from $20/month." | "Call it an AI operating layer for small business — site, social, and content, handled daily. Plans from $20/mo." |
| `Hero` eyebrow (new) | (none) | "YOUR AI BACK-OFFICE" |
| `Hero` primary CTA | (current) | "See the Plans" → `/pricing` |
| `Hero` secondary CTA | GitHub/Twitter badge | "Need Ads? →" → `/ad-services` |
| `Features.section_title` | "Comprehensive Digital Solutions for Modern Businesses" | "Everything your AI back-office handles" |
| `Pricing.section_title` | "Choose the Perfect Plan for Your Business" | "Pick your operating layer" (or brand-voice equivalent) |

### B. Twitter → Reels/Video

| Key | Before | After |
|---|---|---|
| `Hero.follow_twitter` | "See Our Twitter Automation in Action" | (removed — replaced by the two CTAs above) |
| `Hero` badge icon | `TwitterLogoIcon` | drop the icon (eyebrow label only) |
| `Features.feature4_title` | "Twitter Automation" | "Video Content & Instagram Reels" |
| `Features.feature4_description` | (current Twitter copy) | "We script, shoot, and edit short-form video — Reels, Shorts, and TikToks — that bring people through your door." |
| `Pricing.feature_team_member` | "{number} AI Agent Twitter / X" | "{number} Reel / Short / Ad Creative per month" |
| FAQ Q1 mentioning Twitter | "What makes your social media management and Twitter automation services unique?" | "What makes your social media management and ad services unique?" + matching answer |
| FAQ Q on Twitter posting frequency | "Will Twitter post multiple times per day with the AI agent?" | "How often will you post Reels and ads for me?" + matching answer |
| FAQ Q on how Twitter automation works | "How does the Twitter automation service work?" | "How does the ad and Reels service work?" + matching answer |
| `fr.json` | Same keys | French translations of the above |

---

## Build order (sequencing — adopted from Codex review)

The order minimizes regression risk by putting checkable contracts before broad visual changes:

1. **Baseline.** Capture Playwright screenshots + smoke tests for `/`, `/pricing`, `/sign-in`, `/dashboard`, `/dashboard/billing` on the pre-rebrand branch. These are the "before" snapshots regression tests will diff against.
2. **Product constants + env validation.** Add `STRIPE_PRICE_AD_*` env vars to `Env.ts` (required). Add a discriminated-union request schema (zod or similar) for `/api/stripe/create-checkout`. No UI yet.
3. **Stripe payment branch + webhook contract tests.** Implement the `ad_service` branch in `create-checkout` and the additive webhook guard. Write Vitest contract tests for both before any UI exists. Verify against Stripe test mode.
4. **`/ad-services` + `/ad-services/welcome` with minimal styling.** Port the template HTML as JSX using existing Tailwind/shadcn primitives. Wire the BuyNowButtons. Verify end-to-end (test card → welcome page → webhook logs). No BB token application yet.
5. **Scoped BB tokens + fonts.** Add `bb-tokens.css`, extend `tailwind.config.ts`, switch to `next/font/google`, add `.bb-marketing` wrapper to `(unauth)` layout, override shadcn tokens inside the wrapper. Restyle marketing components (Navbar, Hero, Footer, Pricing, SocialPlatforms, Section, CenteredMenu, AdServicesBand, ad-services page).
6. **Metadata + JSON-LD + sitemap + locale + OG.** Update `[locale]/layout.tsx` metadata + JSON-LD; update `sitemap.ts`; rewrite `en.json` + `fr.json` keys for the new positioning + Twitter→Reels swaps; commission/place new OG images.
7. **Visual + mobile + accessibility pass.** Cross-browser visual review; mobile menu (CenteredMenu) verification; contrast checks on cream-on-warm-black; keyboard nav; reduced-motion respected for the snappy 120ms transitions.

## Validation / testing

Manual visual review + automated tests (infrastructure already exists: Vitest, Playwright, Percy, all configured in `package.json`).

**Automated (per Codex review):**

1. **Vitest contract tests** — `/api/stripe/create-checkout` request validation (subscription vs ad_service union), and webhook handler branching for `productType: 'ad_service'` (doesn't crash, doesn't run the subscription path, logs the right shape, returns 200).
2. **Playwright smoke tests** — render `/`, `/pricing`, `/ad-services`, `/sign-in`, `/dashboard/billing`; confirm 200 + key headings present (the marketing pages get the new positioning copy; the dashboard/sign-in pages still render with shadcn defaults).
3. **Percy visual regression** — desktop + mobile snapshots on the five routes above. Establishes the "dashboard untouched" guarantee mechanically.
4. **Locale-key parity test** — assert `keys(en.json)` deep-equals `keys(fr.json)`. Catches drift where French is missing a key OR has English copy left over.
5. **Copy-blacklist grep test** — `tests/copy-voice.spec.ts` greps marketing-only locale paths for banned terms: `platform`, `solution`, `unlock`, `leverage`, `transform`, `synergy`, `cutting-edge`, `empower`, `autopilot`, `🚀`, `✨`. (Brand voice doc rejects these — Codex flagged the existing copy is already non-compliant in places.) The phrase "AI operating layer" is allow-listed by deliberate exception in the hero subhead only.
6. **Dashboard smoke** — Playwright assertion that `/dashboard` and `/dashboard/billing` render with the **un-themed** background (white/shadcn-default), confirming the `.bb-marketing` scoping works.

**Manual:**

7. **Stripe one-time flow** — guest in incognito → `/ad-services` → "Pick the Combo" → Stripe Checkout (test mode) → test card → `/ad-services/welcome` shows confirmation → Stripe Dashboard shows the payment + emails donovan@ → webhook logs `productType: 'ad_service'` entry.
8. **Stripe subscription regression** — logged-in user → `/pricing` → any tier → Checkout → completes → `organization.plan` updated in DB. Existing path still works.
9. **Cross-locale** — visit `/fr/pricing` and `/fr/ad-services` — no English bleed-through; all swapped keys translated.
10. **Build:** `npm run build` passes. `npm run lint` passes. `npm run check-types` passes.

## Brand voice guardrails

The brand voice doc rejects techy SaaS language. The spec preserves the deliberately-chosen "AI operating layer for small business" subhead (your hybrid-voice call), but **everywhere else**, marketing copy follows these rules:

- **Banned in marketing copy** (caught by the test #5 grep): *platform, solution, unlock, leverage, transform, synergy, cutting-edge, empower, autopilot, AI tokens, 🚀, ✨*.
- **Preferred verbs:** build, paint, launch, ship, hand-letter, wire up, automate, handle, run.
- **You-focused, not us-focused:** "Your shop," "your customers," not "users" or "audiences."
- **Casing:** Display headlines in Title or sentence case (script display does the shouting). Eyebrows/labels in `UPPERCASE` + 0.12–0.16em tracking. Body in sentence case.

Where existing `en.json` already violates this (e.g., "all-in-one platform," "AI-powered tools" in `Hero.description`; "Comprehensive Digital Solutions for Modern Businesses" in `Features.section_title`) — those strings are rewritten as part of the content-swap pass (sequencing step 6). Codex was right to flag the legacy SaaS-speak.

---

## Open questions / deferred work

- **`/ad-services/welcome` page** — v1 can be a simple "Thanks, we'll be in touch" page. A richer intake form (business details, goals, current ad spend) is a follow-up.
- **Stripe price IDs** — env vars `STRIPE_PRICE_AD_STATIC`, `STRIPE_PRICE_AD_COMBO`, `STRIPE_PRICE_AD_MOTION` need to be created in the Stripe dashboard before launch. Out of code scope.
- **Webhook reaction to ad-service purchases** — v1 logs to the application logger; Stripe Dashboard's built-in "Successful payments" notification emails donovan@business-builder.online with the customer details. No custom email/Slack integration needed for v1. If we want a Slack channel ping or a Linear ticket created on purchase, that's a follow-up.
- **Stripe automatic tax (`automatic_tax.enabled`)** — DEFERRED to a user/finance decision. Requires Stripe Tax product enabled in the Stripe dashboard + tax codes assigned to each price. Defaulting to OFF for v1. Re-evaluate when ad-services revenue justifies the registration overhead.
- **Idempotency keys for create-checkout** — current implementation does not pass `Idempotency-Key` headers. Low risk because Stripe Checkout sessions are idempotent on their natural keys (price+customer combinations within a short window), but explicit keys would harden against duplicate sessions from impatient retries. Follow-up.
- **Same user buys ad-services twice** — both purchases succeed independently (each is a one-time payment with its own Stripe session). v1 does not de-duplicate. If we don't want a buyer to accidentally buy "Combo" twice, that's an engagement-side check, not a code one.
- **Annual pricing toggle** — not in scope (already deferred from earlier work).
- **Dashboard aesthetic refresh** — explicitly out of scope per user direction ("keep all the other stuff the same").
- **$20 tripwire product** — explicitly out of scope ("too much, building another platform").
- **Ghost blog theme rebrand** — `blog.business-builder.online` runs Ghost CMS with its own theme. Matching the sign-painter aesthetic there requires editing Ghost theme files (Handlebars templates + theme CSS) and re-uploading via Ghost admin. This is a separate ticket once the main-site rebrand ships, so the reader's first click from the blog back to the main site doesn't feel jarring once the new look is live.

---

## Risks

- **Tailwind + BB token name collisions.** Tailwind defaults include `colors.orange.*`, `colors.gray.*`, etc. We namespace BB tokens under `colors.bb.*` to avoid clashing with any existing utility usage in the codebase.
- **Google Fonts performance.** Bricolage Grotesque (variable) + Funnel Display (variable) add 2 font families. We load both with `display=swap` and rely on the existing font fallback chain. Acceptable for a marketing rebrand; can be optimized later with `next/font` if needed.
- **Hero copy change.** Unlike the rest of the site (where existing copy is preserved), the hero headline/subhead are intentionally rewritten for the AI-operating-layer positioning. The previous "Build Your Website…" copy is replaced. This is deliberate, not incidental — captured in Content swaps table A.
- **Stripe webhook regression.** The webhook handler change is additive (a new `if` branch + a guard so the existing subscription path skips ad_service sessions). The existing subscription path is not modified in its logic. Risk is low but verified by validation tests #1 (Vitest contract) and #8 (manual subscription regression).
- **Global CSS bleed into dashboard.** Mitigated by the `.bb-marketing` wrapper scoping (see Approach section). Verified mechanically by validation test #6 (dashboard smoke confirms shadcn defaults still active outside the wrapper).
- **Shared component leak.** `Navbar`, `Footer`, `Section`, `CenteredMenu` are imported by some `(auth)` consumers. Before restyling, grep `git grep -l "from '@/features/landing/CenteredMenu'"` to find every consumer; if any are under `(auth)`, scope the styling via the parent `.bb-marketing` class so it only applies in marketing contexts.
- **Legacy SaaS-speak in en.json.** The brand voice doc rejects "platform," "AI tokens," etc., but the existing copy is full of them. Mitigated by validation test #5 (copy-blacklist grep) plus the sequencing-step-6 content rewrite pass. The "AI operating layer" subhead is an explicit allow-listed exception (your hybrid-voice positioning call).
- **lint-staged + uncommitted work.** The pre-commit hook stashes untracked/unstaged files while linting; leaving untracked junk in the tree during a failed commit can drop uncommitted changes. Mitigation: keep the tree clean (gitignore tool output) and stage everything before committing during implementation.
