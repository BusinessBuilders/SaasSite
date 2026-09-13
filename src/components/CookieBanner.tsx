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

  // Two shapes, one element.
  //
  // From `sm` up it is the compact corner card it has always been: a fixed
  // full-width bar covered page content (footer privacy link, bottom of policy
  // text) until dismissed, and would also sit over the /contact opt-in form in
  // carrier verification screenshots, which never click "Accept all".
  //
  // Below `sm` the corner card is nearly the width of the screen anyway, and at
  // 390x844 it landed on top of the /atlas Start button. So on phones it
  // becomes a short bar pinned to the very bottom — one sentence, two buttons,
  // under 96px tall — which leaves the page's own controls clickable.
  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      // Focusable so the choice can be moved to programmatically; focus is not
      // stolen on mount, which would hijack every first page load.
      tabIndex={-1}
      className="bg-bb-black-soft/95 fixed inset-x-0 bottom-0 z-50 border-t border-bb-umber px-4 py-2.5 backdrop-blur sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm sm:rounded-lg sm:border sm:p-4 sm:shadow-lg"
    >
      <p className="text-[11px] leading-snug text-bb-taupe sm:text-sm sm:leading-relaxed">
        <strong className="hidden text-bb-cream sm:inline">Your privacy matters.</strong>
        {' '}
        We use cookies to run the site and measure performance.
        <span className="hidden sm:inline">
          {' '}
          Marketing cookies are used only with your consent.
        </span>
        {' '}
        <Link href="/privacy-policy" className="underline hover:text-bb-cream">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-2 flex gap-2 sm:mt-3">
        <button
          type="button"
          onClick={() => choose('essential')}
          className="rounded-md border border-bb-umber px-3 py-1.5 text-xs text-bb-taupe transition-colors hover:text-bb-cream sm:px-4 sm:py-2 sm:text-sm"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => choose('all')}
          className="bb-btn bb-btn-primary !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
        >
          Accept all
        </button>
      </div>
    </div>
  );
};
