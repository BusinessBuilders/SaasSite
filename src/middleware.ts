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
    if (request.nextUrl.pathname === '/pricing') {
      const redirectUrl = new URL(
        `/${AppConfig.defaultLocale}/pricing`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (request.nextUrl.pathname === '/privacy-policy') {
      const redirectUrl = new URL(
        `/${AppConfig.defaultLocale}/privacy-policy`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl);
    }

    // ✅ Redirect `/terms` to the default locale (e.g., `/en/terms`)
    if (request.nextUrl.pathname === '/terms') {
      const redirectUrl = new URL(
        `/${AppConfig.defaultLocale}/terms`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl);
    }

    // ✅ The ad-services offer was removed (2026-07). 301 every old URL —
    // locale-less or localized, including /welcome — to the AI automation
    // page that replaced it, so indexed/bookmarked links keep their value.
    const adServicesMatch = request.nextUrl.pathname.match(
      /^\/(?:(en|fr)\/)?ad-services(?:\/.*)?$/,
    );
    if (adServicesMatch) {
      const locale = adServicesMatch[1] ?? AppConfig.defaultLocale;
      return NextResponse.redirect(
        new URL(`/${locale}/ai-automation`, request.url),
        301,
      );
    }

    // ✅ Redirect locale-less AI marketing pages to the default locale
    // (Without this, the page renders with params.locale=undefined and crashes hydration.)
    if (
      request.nextUrl.pathname === '/ai-automation'
      || request.nextUrl.pathname === '/private-ai'
      || request.nextUrl.pathname === '/contact'
    ) {
      const redirectUrl = new URL(
        `/${AppConfig.defaultLocale}${request.nextUrl.pathname}`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl);
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
