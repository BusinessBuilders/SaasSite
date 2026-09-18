# Analytics, tracking pixels & SEO — how it works and how to check it

Plain-English runbook for business-builder.online. Written so a future session
(or William with an AI session) can maintain this without re-deriving it.

## 1. What is installed

| What | Where it lives | When it runs |
|---|---|---|
| Google Analytics 4 (the "Google tag", `gtag.js`) | `src/components/analytics/GoogleAnalytics.tsx` | On every page, as soon as the page is interactive. Analytics measurement is always on; the *advertising* consent signals (Google Consent Mode v2) stay **denied** until the visitor clicks **Accept all** on the cookie banner. |
| Meta Pixel (Facebook / Instagram ads) | `src/components/analytics/MetaPixel.tsx` | **Only after "Accept all."** Nothing from Meta loads before that — this is what the privacy policy promises. Clicking "Essential only" later revokes consent inside the pixel. |
| Cookie consent store | `src/components/analytics/consent.ts` | Single source of truth. The banner (`src/components/CookieBanner.tsx`) writes the choice; the tags subscribe to it, so "Accept all" switches the tags on instantly, no reload. |
| Wrapper that wires both into the site | `src/components/analytics/Analytics.tsx`, rendered once in `src/app/[locale]/layout.tsx` | Every page, every locale, including the dashboard. |

Both tags are driven by two environment variables. **Neither is set in dev or
test on purpose** — local traffic must never land in the real reports.

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # GA4 → Admin → Data streams → web stream → "Measurement ID"
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456   # Meta Events Manager → Data sources → the pixel → "Dataset ID" (numeric)
```

They go in **`~/NewUpdate/.env.production.local` on the VPS** (next to the
Stripe/Clerk keys), followed by a rebuild + PM2 restart (see §4). `src/libs/Env.ts`
validates the format at build time — a typo fails the build instead of shipping
a dead tag.

### Fail-loud rule
If a production build runs without one of these IDs, `Analytics.tsx` prints a
`console.error` line to the build log and the PM2 log:

```
[analytics] NEXT_PUBLIC_GA_MEASUREMENT_ID is not set — Google Analytics is NOT running on this deployment.
```

Check with `pm2 logs business-builder --lines 50 | grep analytics` after a deploy.

## 2. How to verify it is really working (2 minutes)

1. Open https://business-builder.online in Chrome → DevTools → **Network** tab.
2. Filter `collect` — you should see requests to `google-analytics.com/g/collect`
   (GA4 page_view). Click any internal link; another `collect` fires.
3. Click **Accept all** on the cookie banner. Filter `facebook` — you should see
   `connect.facebook.net/en_US/fbevents.js` load and a `facebook.com/tr?…ev=PageView`
   request. Before accepting, there must be **no** facebook requests at all.
4. GA4 → Reports → **Realtime** shows you within ~30 seconds.
   Meta Events Manager → the pixel → **Test events** shows PageView.

## 3. SEO conventions (Google discoverability)

**URL scheme** — English is the default locale and is *unprefixed*: `/`,
`/pricing`, `/contact`. French carries `/fr`. `src/middleware.ts` enforces it:
`/en/pricing` → 308 → `/pricing`, and `/pricing` is internally rewritten to the
`/en/pricing` route so the page renders with the right locale. `www.` →
308 → apex, so every page has exactly one address.

**Canonical + hreflang** — every marketing page sets
`alternates: pageAlternates(path, locale)` from `src/utils/Seo.ts`. Never put a
site-wide canonical in a layout again: Next.js merges layout metadata into every
page, and a homepage canonical in the layout told Google that pricing, contact,
terms and the whole French site were duplicates of the homepage (that was live
until 2026-08-22). Pages whose French version is still English copy pass
`{ englishOnly: true }` so both locales canonicalize to the English URL.

**Adding a marketing page** — three places, or the page is either a Clerk
redirect or invisible to Google: `MARKETING_PATHS` in `src/middleware.ts`
(plus the `isAiMarketingPage` matcher for the `/fr` twin), `PAGES` in
`src/app/sitemap.ts`, and a footer link so every page links to it. The local
landing page `/ai-automation-worcester-county-ma` (added 2026-09-15) is the
worked example; its copy and JSON-LD come from one file,
`src/features/ai/worcesterCounty.ts`.

**llms.txt** — `public/llms.txt` is a plain-text summary of the offer for AI
assistants (llmstxt.org). It is NOT a ranking factor — Google has said it does
not read it — so it gets no footer link and no engineering; update the prices
in it when they change and otherwise leave it alone.

**Sitemap** — `src/app/sitemap.ts` lists one entry per canonical URL with a
hand-maintained `lastModified` date. **Bump the date when you change a page's
content.** Auth pages and the dashboard are not in the sitemap and are
`Disallow`ed in `src/app/robots.ts`, as are the client staging folders nginx
serves from the same domain (`/ginisi/`, `/jsl/`, …). The Ghost blog's own
sitemap (`/blog/sitemap.xml`) is declared in robots.txt.

**Fonts (page speed)** — all three brand fonts are self-hosted through
`next/font` in `src/app/[locale]/layout.tsx`: Bricolage Grotesque from
Google's list, Funnel Display from the checked-in file `src/fonts/` (it is not
in this Next version's Google list). Never add a `@import url(fonts.googleapis…)`
back to the CSS: that was a render-blocking request Lighthouse measured at
about one second on every page (removed 2026-09-15).

**Hours (local SEO)** — the site-wide JSON-LD `openingHoursSpecification` and
the line on /contact both say every day 8 AM–6 PM, the same as the Google
Business Profile. If the hours change, change all three.

**IndexNow (Bing, and therefore ChatGPT search)** — after every deploy run
`npm run seo:indexnow` from the repo root. It posts the sitemap's URLs to
api.indexnow.org, which Bing crawls within minutes; ChatGPT's web search draws
on Bing's index. Ownership is the key file `public/<key>.txt` (public by
design). Google ignores IndexNow: for Google, resubmit the sitemap in Search
Console and use Request Indexing on new URLs.

**Lighthouse (how to re-check)** — `npm run build && npx next start -p 3477`,
then `CHROME_PATH=<playwright chromium> npx lighthouse http://localhost:3477/<page>
--chrome-flags="--headless=new" --only-categories=seo,performance,accessibility`.
On 2026-09-15 the marketing pages scored SEO 100 / best practices 100; the
remaining accessibility flags are the brand's dust-on-black contrast and small
footer link targets, both design decisions.

**Headings** — `Section` (`src/features/landing/Section.tsx`) renders its title
as a real `<h2>` (or `titleAs="h1"` for a page's main section). Every page must
have exactly one `<h1>`.

**Titles / descriptions** — keep titles ≤ 65 characters and descriptions ≤ 160
so Google doesn't truncate them. Homepage strings live in
`src/locales/en.json` / `fr.json` under `Index`.

**Business info (NAP)** — the phone number in the JSON-LD schema in
`src/app/[locale]/layout.tsx` must equal the number printed in the footer and
on /contact (774-244-1878), and both must match the Google Business Profile
exactly.

**Google Search Console** — the domain property `sc-domain:business-builder.online`
is verified (DNS) on William's Google account. Both sitemaps are submitted there.
Check *Indexing → Pages* after any URL-structure change.

## 4. Deploy

```
ssh linuxuser@66.42.116.215
cd ~/NewUpdate && git pull origin feature/worcester-county-ai-seo   # the branch production runs since 2026-09-15
source ~/.nvm/nvm.sh && npm run build && pm2 restart business-builder --update-env
pm2 logs business-builder --lines 30 | grep -i analytics   # must print nothing
# then, from this computer, tell Bing the pages changed:
cd ~/bb-site-worcester-wt && npm run seo:indexnow
```
