import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from './utils/AppConfig';

// ✅ Setup next-intl middleware
const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

// ✅ Define PROTECTED routes (Require authentication)
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
  '/api/users/(.*)',
  '/api/data/(.*)',
  '/api/profile/(.*)',
]);

// ✅ Define PUBLIC API routes (Stripe must NOT be blocked)
const isPublicApiRoute = createRouteMatcher([
  '/api/stripe/webhook',
  '/api/stripe/create-checkout',
  '/api/stripe/create-portal',
  '/api/sms-opt-in',
]);

// Public marketing pages that live outside Clerk (see the rewrite logic in
// the handler below). Add a path here when a new marketing page ships — the
// sitemap (src/app/sitemap.ts) lists the same pages.
const MARKETING_PATHS = [
  '/pricing',
  '/privacy-policy',
  '/terms',
  '/ai-automation',
  '/private-ai',
  '/contact',
];
const MARKETING_PATH_SET = new Set(MARKETING_PATHS);
// Matches the default-locale-prefixed form of those pages, plus bare /en.
// Built from the list above so the two can't drift apart.
const EN_PREFIXED_MARKETING = new RegExp(
  `^/${AppConfig.defaultLocale}(${MARKETING_PATHS.join('|')})?/?$`,
);
const WWW_HOST = `www.${new URL(AppConfig.siteUrl).host}`;

const isPricingPage = createRouteMatcher(['/pricing', '/:locale/pricing']);

const isPrivacyPolicyPage = createRouteMatcher([
  '/privacy-policy',
  '/:locale/privacy-policy',
]);

// ✅ Define Terms and Conditions Page matcher
const isTermsPage = createRouteMatcher(['/terms', '/:locale/terms']);

// Public AI marketing pages (replaced the removed ad-services offer)
const isAiMarketingPage = createRouteMatcher([
  '/ai-automation',
  '/:locale/ai-automation',
  '/private-ai',
  '/:locale/private-ai',
]);

// Public contact page with the SMS opt-in form (A2P campaign verification
// requires this page to be reachable without auth).
const isContactPage = createRouteMatcher(['/contact', '/:locale/contact']);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  try {
    const { pathname, search } = request.nextUrl;

    // ✅ One host. www.business-builder.online used to serve a full second
    // copy of the site (Google had indexed www URLs). Permanently redirect it
    // to the apex so every page has exactly one address.
    const host = request.headers.get('host') ?? '';
    if (host === WWW_HOST) {
      return NextResponse.redirect(
        `${AppConfig.siteUrl}${pathname}${search}`,
        308,
      );
    }

    // ✅ The ad-services offer was removed (2026-07). 301 every old URL —
    // locale-less or localized, including /welcome — to the AI automation
    // page that replaced it, so indexed/bookmarked links keep their value.
    const adServicesMatch = pathname.match(
      /^\/(?:(en|fr)\/)?ad-services(?:\/.*)?$/,
    );
    if (adServicesMatch) {
      const locale = adServicesMatch[1];
      const target = locale && locale !== AppConfig.defaultLocale
        ? `/${locale}/ai-automation`
        : '/ai-automation';
      return NextResponse.redirect(new URL(target, request.url), 301);
    }

    // ✅ URL scheme for the public marketing pages: English (the default
    // locale) is UNPREFIXED — /pricing, /contact … — exactly like the
    // homepage. /en/pricing permanently redirects to /pricing, and /pricing
    // is internally rewritten to the /en/pricing route so the page still
    // renders with params.locale === 'en'. (Without the rewrite, Next would
    // match [locale] = 'pricing' and the page would crash.) Bare /en also
    // 308s to / for the same reason. French keeps its prefix: /fr/pricing
    // serves as-is. src/utils/Seo.ts builds canonicals
    // from the same convention — keep the two in sync.
    const enPrefixed = pathname.match(EN_PREFIXED_MARKETING);
    if (enPrefixed) {
      return NextResponse.redirect(
        new URL(`${enPrefixed[1] ?? '/'}${search}`, request.url),
        308,
      );
    }
    if (MARKETING_PATH_SET.has(pathname)) {
      return NextResponse.rewrite(
        new URL(`/${AppConfig.defaultLocale}${pathname}${search}`, request.url),
      );
    }

    if (isPricingPage(request)) {
      return NextResponse.next();
    }

    if (isPrivacyPolicyPage(request)) {
      return NextResponse.next();
    }

    if (isTermsPage(request)) {
      return NextResponse.next();
    }

    if (isAiMarketingPage(request)) {
      return NextResponse.next();
    }

    if (isContactPage(request)) {
      return NextResponse.next();
    }

    // ✅ Ensure Clerk runs properly for all other routes
    return clerkMiddleware((auth, req) => {
      if (isPricingPage(req)) {
        return NextResponse.next();
      }

      if (isPrivacyPolicyPage(req)) {
        return NextResponse.next();
      }

      if (isTermsPage(req)) {
        return NextResponse.next();
      }

      if (isAiMarketingPage(req)) {
        return NextResponse.next();
      }

      if (isPublicApiRoute(req)) {
        return NextResponse.next();
      }

      if (isProtectedRoute(req)) {
        const locale
          = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';
        const signInUrl = new URL(`${locale}/sign-in`, req.url);
        signInUrl.searchParams.set('redirect_to', req.nextUrl.pathname);

        auth().protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      return intlMiddleware(req);
    })(request, event);
  } catch (error: any) {
    console.error('❌ Middleware Error:', error);

    return NextResponse.json(
      { error: 'Middleware failed', details: error.message || 'Unknown error' },
      { status: 500 },
    );
  }
}

// ✅ Ensure API routes remain public while keeping protected routes secure
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'],
};
