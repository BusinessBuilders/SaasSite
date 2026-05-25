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

**Approach 1: CSS-import + Tailwind extension.** Drop the design system's `colors_and_type.css` into the Next.js global stylesheet pipeline. Extend `tailwind.config.ts` with matching theme tokens so developers can write either Tailwind utilities (`bg-bb-orange`) or the design system's component classes (`bb-btn-primary`, `bb-display-stack`, `bb-grain`). Two notations, one source of truth.

This avoids rewriting the template's hand-tuned components (stacked shadows, grain overlay, double-rule dividers) in Tailwind while keeping Tailwind's utility productivity for layout and one-offs.

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

- `src/styles/global.css` — import `colors_and_type.css` tokens (vendored into the repo from the design system)
- `tailwind.config.ts` — extend `theme.colors` with `bb.*` tokens (orange, cream, teal, brick, gold, black, umber, taupe, dust); extend `theme.fontFamily` with `bb-display`, `bb-display-2`, `bb-body`; extend `theme.boxShadow` with `bb-letter`, `bb-card`, `bb-featured`
- `src/app/[locale]/layout.tsx` — add Google Fonts `<link>` for Bricolage Grotesque + Funnel Display (loaded with `display=swap`)
- `public/assets/css/bb-tokens.css` (NEW) — vendored copy of the design system's `colors_and_type.css`

**NEW ad-services page:**

- `src/app/[locale]/(unauth)/ad-services/page.tsx` (NEW) — port of `ui_kits/ad-services/index.html` as a React Server Component. Sections: header (reuses existing Navbar), hero, problem grid, how-it-works steps, three pricing tiers, ad-spend note, guarantee, FAQ, CTA, footer (reuses existing Footer). Use `force-dynamic` like the other unauth pages.
- `src/features/ad-services/AdServicesTierCard.tsx` (NEW) — client component for one tier with a `BuyNowButton` that POSTs to `/api/stripe/create-checkout` with `mode: 'payment'`
- `src/app/api/stripe/create-checkout/route.ts` — add a one-time-payment branch alongside the existing subscription branch. Accepts a `productType: 'subscription' | 'ad_service'` field; routes to either `mode: 'subscription'` (existing) or `mode: 'payment'` (new) based on it. Adds `metadata.productType` on the Stripe session for the webhook to discriminate.
- `src/libs/Env.ts` — add `STRIPE_PRICE_AD_STATIC`, `STRIPE_PRICE_AD_COMBO`, `STRIPE_PRICE_AD_MOTION` as optional server env vars

**Content swaps — positioning + Twitter→Reels:**

- `src/locales/en.json` — AI-layer repositioning keys (`Hero.title`, `Hero.description`, new hero eyebrow + CTA keys, `Features.section_title`, `Pricing.section_title`) AND Twitter→Reels keys (`Hero.follow_twitter`, `Features.feature4_title`, `Features.feature4_description`, `Pricing.feature_team_member`, 3 FAQ Q/A pairs)
- `src/locales/fr.json` — same keys, French translations

**Navbar link addition:**

- `src/templates/Navbar.tsx` — add "Ad Services" entry between "Pricing" and "About" linking to `/ad-services`
- `src/templates/Footer.tsx` — same link

### OUT of scope — files we will NOT touch

- `src/app/[locale]/(auth)/sign-in/`, `sign-up/` — Clerk pages stay stock
- `src/middleware.ts` — auth/routing flow unchanged (the `/ad-services` route is already public under the `(unauth)` group, no middleware change needed)
- `src/app/[locale]/(auth)/dashboard/` — entire dashboard untouched (sidebar, top bar, overview, billing pages — all stay as-is)
- `src/features/billing/` — Stripe customer/portal/subscription logic untouched
- `src/app/api/stripe/webhook/route.ts` — webhook untouched (already handles one-time payments via `checkout.session.completed`; we use metadata to discriminate)
- `src/app/api/stripe/create-portal/route.ts` — untouched
- `src/models/Schema.ts` — DB schema untouched (ad-service purchases live in Stripe; no new tables needed for v1)
- Existing SaaS tiers (STARTER / GROWTH / PRO at $20 / $49 / $99 monthly) — prices, env vars, Stripe IDs preserved (only their marketing framing changes)
- Existing managed-services tiers ($99 / $249 / $499) — preserved
- Logo files under `public/assets/images/logo-*.png` — already added in this branch, preserved
- No new $20 tripwire product (out of scope; saved for a follow-up)

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

## Validation / testing

This is a marketing rebrand with one new Stripe flow. The test plan is light:

1. **Visual:** Manual review of `/`, `/pricing`, `/ad-services` at desktop and mobile widths. Compare against `ui_kits/ad-services/index.html` rendered locally.
2. **Positioning:** Homepage hero shows "We run the busywork. You run the shop." + AI-operating-layer subhead; primary CTA goes to `/pricing`, secondary to `/ad-services`. Ad Services upsell band renders before the pricing strip.
3. **Stripe one-time flow:** Use Stripe test mode price IDs. Click a tier on `/ad-services` → reach Stripe Checkout → use test card → land on `/ad-services/welcome` (placeholder page). Webhook should log `productType: 'ad_service'` and return 200.
4. **Stripe subscription flow regression:** Click any plan on `/pricing` → Stripe Checkout (subscription mode) → completes and updates org table. Confirms we didn't break the existing flow.
5. **Locale swap:** Visit `/fr` — confirm French copy uses the new Reels/Video wording (not Twitter) and the repositioned hero.
6. **Build:** `npm run build` passes.
7. **No accidental dashboard changes:** `git diff` confirms `src/app/[locale]/(auth)/dashboard/` is untouched.

---

## Open questions / deferred work

- **`/ad-services/welcome` page** — v1 can be a simple "Thanks, we'll be in touch" page. A richer intake form (business details, goals, current ad spend) is a follow-up.
- **Stripe price IDs** — env vars `STRIPE_PRICE_AD_STATIC`, `STRIPE_PRICE_AD_COMBO`, `STRIPE_PRICE_AD_MOTION` need to be created in the Stripe dashboard before launch. Out of code scope.
- **Webhook reaction to ad-service purchases** — v1 logs only. If we want auto-emailing the team or creating a Linear ticket on purchase, that's follow-up work.
- **Annual pricing toggle** — not in scope (already deferred from earlier work).
- **Dashboard aesthetic refresh** — explicitly out of scope per user direction ("keep all the other stuff the same").
- **$20 tripwire product** — explicitly out of scope ("too much, building another platform").

---

## Risks

- **Tailwind + BB token name collisions.** Tailwind defaults include `colors.orange.*`, `colors.gray.*`, etc. We namespace BB tokens under `colors.bb.*` to avoid clashing with any existing utility usage in the codebase.
- **Google Fonts performance.** Bricolage Grotesque (variable) + Funnel Display (variable) add 2 font families. We load both with `display=swap` and rely on the existing font fallback chain. Acceptable for a marketing rebrand; can be optimized later with `next/font` if needed.
- **Hero copy change.** Unlike the rest of the site (where existing copy is preserved), the hero headline/subhead are intentionally rewritten for the AI-operating-layer positioning. The previous "Build Your Website…" copy is replaced. This is deliberate, not incidental — captured in Content swaps table A.
- **Stripe webhook regression.** The webhook handler change is additive (a new `if` branch). The existing subscription path is not modified. Risk is low but verified by validation test #4.
- **lint-staged + uncommitted work.** The pre-commit hook stashes untracked/unstaged files while linting; leaving untracked junk in the tree during a failed commit can drop uncommitted changes. Mitigation: keep the tree clean (gitignore tool output) and stage everything before committing during implementation.
