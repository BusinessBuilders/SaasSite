'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  type CookieConsent,
  getCookieConsent,
  setCookieConsent,
} from '@/components/analytics/consent';

// Dispatched by the footer's "Cookie Preferences" link so visitors can
// change their choice after dismissing the banner.
export const COOKIE_PREFS_EVENT = 'bb-cookie-preferences-open';

// The stored choice is read by the marketing tags in src/components/analytics:
// Google's ad-consent signals and the Meta Pixel only turn on after
// "Accept all" (see consent.ts).

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  // Deferred to an effect so the server-rendered HTML never includes the
  // banner — avoids a hydration mismatch with localStorage state.
  useEffect(() => {
    if (!getCookieConsent()) {
      setVisible(true);
    }
    const reopen = () => setVisible(true);
    window.addEventListener(COOKIE_PREFS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_PREFS_EVENT, reopen);
  }, []);

  if (!visible) {
    return null;
  }

  const choose = (value: CookieConsent) => {
    setCookieConsent(value);
    setVisible(false);
  };

  // Compact corner card, not a full-width bar — a fixed bottom bar covered
  // page content (footer privacy link, bottom of policy text) until dismissed,
  // and would also appear over the /contact opt-in form in carrier
  // verification screenshots, which never click "Accept all".
  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="bg-bb-black-soft/95 fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border border-bb-umber p-4 shadow-lg backdrop-blur"
    >
      <p className="text-sm leading-relaxed text-bb-taupe">
        <strong className="text-bb-cream">Your privacy matters.</strong>
        {' '}
        We use
        cookies to run the site and measure performance. Marketing cookies are
        used only with your consent.
        {' '}
        <Link href="/privacy-policy" className="underline hover:text-bb-cream">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose('essential')}
          className="rounded-md border border-bb-umber px-4 py-2 text-sm text-bb-taupe transition-colors hover:text-bb-cream"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => choose('all')}
          className="bb-btn bb-btn-primary !px-4 !py-2 !text-sm"
        >
          Accept all
        </button>
      </div>
    </div>
  );
};
