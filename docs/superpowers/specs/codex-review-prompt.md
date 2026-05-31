# Codex Review Prompt — BB Rebrand Spec

Paste this into Codex (or any LLM) along with the spec file
`docs/superpowers/specs/2026-05-12-bb-rebrand-design.md` (attach as a file or paste its full content under "SPEC TO REVIEW" below).

---

## Prompt

You are a senior staff engineer reviewing a design spec for a marketing-site rebrand. Be skeptical, specific, and concrete. Don't praise — find what's wrong, missing, or risky.

### Project context

- **Repo:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Drizzle ORM + Clerk auth + Stripe billing. Routes split into `(unauth)` (marketing) and `(auth)` (logged-in dashboard) groups. i18n via `next-intl` (en/fr).
- **Business:** Business Builder — small-business agency selling website builds + AI-driven social/content automation. Existing SaaS plans at $20/$49/$99 monthly. Existing managed services at $99/$249/$499.
- **What we're changing:** Repaint the public marketing surface in a "sign-painter" American retro aesthetic (dark warm-black canvas, cream text, sign-orange/diner-teal/brick-red/sign-gold accents). Reposition the existing SaaS subscription as an "AI operating layer for small business" (copy/framing only — prices and Stripe wiring unchanged). Add a NEW `/ad-services` page with three one-time done-for-you packages ($899 / $1,499 / $2,499) sold via Stripe Checkout (one-time payment mode).
- **What we are NOT changing:** Clerk login/signup, the entire `/dashboard/*` logged-in app, the Stripe subscription flow, the webhook handler logic (only adding a metadata-discriminated branch), the DB schema, the Ghost CMS blog at the `blog.business-builder.online` subdomain (only the outbound link is preserved).
- **Approach:** Drop the design system's CSS tokens (`colors_and_type.css`) into `globals.css`; extend `tailwind.config.ts` with matching `bb.*` theme tokens; use either the template's `bb-btn-*` / `bb-display-*` component classes OR Tailwind utilities — both pull from the same CSS variables.

### What to review (find issues at each level)

1. **Scope completeness.** What files / paths / concerns are missing from the spec? Anything in a Next.js App Router + Clerk + Stripe codebase that this kind of rebrand typically touches that's NOT listed (e.g., metadata/OG images, sitemap, robots, JSON-LD, structured data, root layout fonts, `theme-color` meta, manifest.webmanifest, error pages, 404, loading states, mobile navigation, hamburger menu, accessibility for the dark-on-cream contrast, dark/light mode handling given the inverted color scheme)?
2. **Brand-voice consistency.** The brand voice doc explicitly rejects techy SaaS language ("NOT: Tech. SaaS. Innovation."). The spec uses the phrase "AI operating layer for small business" in a hybrid voice. Does the spec's copy direction actually hold to the brand voice, or does it slip into SaaS-speak in places? Call out any specific copy lines that need rewriting.
3. **Stripe correctness.** The plan adds a `productType: 'subscription' | 'ad_service'` discriminator to `/api/stripe/create-checkout` and a single `if` branch in the `checkout.session.completed` webhook. Is this the right shape? Are we missing: customer creation/reuse for one-time payments, idempotency keys, `client_reference_id` for guest checkout, tax calculation, receipt email config, refund handling, what happens if the user is logged-out vs logged-in when buying an ad-services package, what happens if the same user buys twice?
4. **Hidden coupling / regression risk.** What in the existing codebase could break from the touch list? Look for: shared components used by both `(auth)` and `(unauth)` trees (Navbar, Footer, Hero are shared — restyling them could leak into dashboard pages); Tailwind purge issues from new `bb-*` classes; Clerk appearance prop defaults that might invert against the new dark background; i18n keys removed/added without updating French.
5. **Architecture critique.** Is "CSS-import + Tailwind extension" the right approach? Would shadcn theming via `tailwind.config.ts` alone be cleaner (no `bb-btn` etc. classes, just utilities)? What are the long-term maintenance implications of having two notations?
6. **Blog subdomain handling.** The spec preserves the external link to `https://blog.business-builder.online`. The Ghost blog itself isn't rebranded in this work. Is "main site rebranded, blog still old" a meaningful UX problem worth solving in the same release, or can it wait? What's the cheapest way to make the visual jump less jarring before the Ghost theme is rebuilt?
7. **Sequencing.** The spec doesn't yet have an implementation plan. Given the file list, what's the right BUILD ORDER to minimize risk and allow incremental verification? (E.g., tokens → shared templates → /ad-services + Stripe → homepage repositioning → content swaps → verification.)
8. **Test strategy.** The spec has a 7-item validation list (mostly manual). Is that sufficient, or are there specific automated checks worth adding (visual regression on the three public pages, a Stripe webhook contract test, a Tailwind class-collision test, a locale-key parity check between en.json and fr.json)?

### Output format

For each numbered review area above, give:

- **VERDICT:** `OK` / `CONCERN` / `BLOCKER`
- **FINDINGS:** Specific items, bullet form. Reference exact file paths, key names, or copy quotes when relevant.
- **RECOMMENDATIONS:** Concrete edits to the spec (what to add, change, or remove) — not vague advice.

At the end, give a **TOP 5 PRIORITIZED ACTIONS** list — the five things that, if addressed before code starts, would most reduce risk or rework.

Be terse. No throat-clearing.

---

## SPEC TO REVIEW

(Paste the full content of `docs/superpowers/specs/2026-05-12-bb-rebrand-design.md` here, or attach it as a file.)
