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
]);

const isPricingPage = createRouteMatcher([
  '/pricing',
  '/:locale/pricing',
]);

const isPrivacyPolicyPage = createRouteMatcher([
  '/privacy-policy',
  '/:locale/privacy-policy',
]);

// ✅ Define Terms and Conditions Page matcher
const isTermsPage = createRouteMatcher([
  '/terms',
  '/:locale/terms',
]);

const isAdServicesPage = createRouteMatcher([
  '/ad-services',
  '/ad-services/welcome',
  '/:locale/ad-services',
  '/:locale/ad-services/welcome',
]);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    if (request.nextUrl.pathname === '/pricing') {
      const redirectUrl = new URL(`/${AppConfig.defaultLocale}/pricing`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (request.nextUrl.pathname === '/privacy-policy') {
      const redirectUrl = new URL(`/${AppConfig.defaultLocale}/privacy-policy`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // ✅ Redirect `/terms` to the default locale (e.g., `/en/terms`)
    if (request.nextUrl.pathname === '/terms') {
      const redirectUrl = new URL(`/${AppConfig.defaultLocale}/terms`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // ✅ Redirect locale-less /ad-services and /ad-services/welcome to the default locale
    // (Without this, the page renders with params.locale=undefined and crashes hydration.)
    if (request.nextUrl.pathname === '/ad-services') {
      const redirectUrl = new URL(`/${AppConfig.defaultLocale}/ad-services`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (request.nextUrl.pathname === '/ad-services/welcome') {
      const redirectUrl = new URL(`/${AppConfig.defaultLocale}/ad-services/welcome`, request.url);
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

    if (isAdServicesPage(request)) {
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

      if (isAdServicesPage(req)) {
        return NextResponse.next();
      }

      if (isPublicApiRoute(req)) {
        return NextResponse.next();
      }

      if (isProtectedRoute(req)) {
        const locale = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';
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
  matcher: [
    '/((?!.+\\.[\\w]+$|_next|monitoring).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
