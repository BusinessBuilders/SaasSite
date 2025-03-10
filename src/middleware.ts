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

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    // ✅ Ensure Clerk runs properly for all routes
    return clerkMiddleware((auth, req) => {
      // ✅ Allow PUBLIC API routes (Prevents Stripe failures)
      if (isPublicApiRoute(req)) {
        return NextResponse.next();
      }

      // ✅ Protect specific routes with Clerk auth
      if (isProtectedRoute(req)) {
        const locale = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';
        const signInUrl = new URL(`${locale}/sign-in`, req.url);

        auth().protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      // ✅ Redirect users without an organization
      if (
        auth().userId &&
        !auth().orgId &&
        req.nextUrl.pathname.includes('/dashboard') &&
        !req.nextUrl.pathname.endsWith('/organization-selection')
      ) {
        const orgSelection = new URL('/onboarding/organization-selection', req.url);
        return NextResponse.redirect(orgSelection);
      }

      return intlMiddleware(req);
    })(request, event);
  } catch (error: any) {
    console.error('❌ Middleware Error:', error);

    return NextResponse.json(
      { error: 'Middleware failed', details: error.message || 'Unknown error' },
      { status: 500 }
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
