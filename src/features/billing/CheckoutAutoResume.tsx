'use client';

import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { PLAN_ID } from '@/utils/AppConfig';

const ALLOWED_PLANS = new Set<string>([PLAN_ID.STARTER, PLAN_ID.GROWTH, PLAN_ID.PRO]);

/**
 * Mounted invisibly on /pricing. When a user lands on /pricing with the
 * query params `?checkout=true&plan=<planId>` AND they are signed in,
 * this auto-triggers the same POST that BuyNowButton would make.
 *
 * Why this exists: an unauth user who clicks Buy Now is bounced to
 * /sign-in with `?redirect_url=/pricing?checkout=true&plan=growth`.
 * After Clerk sign-in, they land back on /pricing — we want the
 * checkout to resume automatically rather than make them click again.
 *
 * Renders no UI. Shows a transient "Resuming checkout…" message only
 * when the resume fires, then redirects to Stripe.
 */
export const CheckoutAutoResume = () => {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'resuming' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (firedRef.current) return;

    const wantsCheckout = searchParams.get('checkout') === 'true';
    const planId = searchParams.get('plan');
    if (!wantsCheckout || !planId) return;
    if (!ALLOWED_PLANS.has(planId)) return;
    if (!isSignedIn) return; // user signed-out — wait, don't auto-fire

    firedRef.current = true;
    setStatus('resuming');

    (async () => {
      try {
        const res = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productType: 'subscription', planId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          throw new Error(data.error ?? `Checkout failed (HTTP ${res.status})`);
        }
        window.location.href = data.url;
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Resume failed');
        setStatus('error');
      }
    })();
  }, [isLoaded, isSignedIn, searchParams]);

  if (status === 'resuming') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-50 bg-bb-orange px-4 py-2 text-center text-sm font-semibold text-bb-black"
      >
        Resuming your checkout… you'll be redirected to Stripe in a moment.
      </div>
    );
  }

  if (status === 'error' && errorMessage) {
    return (
      <div
        role="alert"
        className="fixed inset-x-0 top-0 z-50 bg-destructive px-4 py-2 text-center text-sm font-semibold text-destructive-foreground"
      >
        Couldn't resume checkout: {errorMessage}
        {' '}
        Click your plan's Buy Now button again to retry.
      </div>
    );
  }

  return null;
};
