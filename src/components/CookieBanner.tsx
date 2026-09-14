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

  // Two shapes, one element, and the breakpoint between them is `lg` (1024px)
  // — NOT `sm`. It is chosen by the /atlas hero, not by taste.
  //
  // From `lg` up it is a compact corner card in the RIGHT corner. It used to
  // sit on the left, where at 1280x800 it landed squarely on the /atlas hero's
  // left column — clipping the Start button and covering the AI disclosure a
  // visitor is agreeing to when they tap it. The hero column and a 177px card
  // cannot both fit in the left half of an 800px-tall screen, so the card moved
  // instead; every page's primary copy is left-aligned, and the right corner is
  // empty on all of them.
  //
  // Below `lg` it is a short full-width bar pinned to the very bottom — one
  // sentence, two buttons, under 96px tall — which leaves the page's own
  // controls clickable. The card used to start at `sm` (640px), but the /atlas
  // hero stays SINGLE-COLUMN until `lg`: between 640px and ~822px wide the
  // corner card landed on the AI disclosure and hit-tested over the "How we
  // handle it" link, so a tablet visitor could not reach the one link that
  // explains what happens to their recording. The full-width bar holds until
  // the hero splits into two columns and the right corner is free. An e2e case
  // at 768x1024 pins it.
  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      // Focusable so the choice can be moved to programmatically; focus is not
      // stolen on mount, which would hijack every first page load.
      tabIndex={-1}
      className="bg-bb-black-soft/95 fixed inset-x-0 bottom-0 z-50 border-t border-bb-umber px-4 py-2 backdrop-blur lg:inset-x-auto lg:bottom-4 lg:right-4 lg:max-w-sm lg:rounded-lg lg:border lg:p-4 lg:shadow-lg"
    >
      <p className="text-[11px] leading-snug text-bb-taupe lg:text-sm lg:leading-relaxed">
        <strong className="hidden text-bb-cream lg:inline">Your privacy matters.</strong>
        {' '}
        We use cookies to run the site and measure performance.
        <span className="hidden lg:inline">
          {' '}
          Marketing cookies are used only with your consent.
        </span>
        {' '}
        <Link href="/privacy-policy" className="underline hover:text-bb-cream">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-1.5 flex gap-2 lg:mt-3">
        <button
          type="button"
          onClick={() => choose('essential')}
          className="rounded-md border border-bb-umber px-3 py-1.5 text-xs text-bb-taupe transition-colors hover:text-bb-cream lg:px-4 lg:py-2 lg:text-sm"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => choose('all')}
          className="bb-btn bb-btn-primary !px-3 !py-1.5 !text-xs lg:!px-4 lg:!py-2 lg:!text-sm"
        >
          Accept all
        </button>
      </div>
    </div>
  );
};
