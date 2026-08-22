'use client';

import Script from 'next/script';
import { useEffect } from 'react';

import { CONSENT_STORAGE_KEY, hasMarketingConsent, onConsentChange } from './consent';

declare global {
  // Augmenting the global Window type requires `interface` (declaration merging).
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const updateAdConsent = (granted: boolean) => {
  const value = granted ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
};

// Loads the Google tag (GA4). Analytics measurement is always on — the cookie
// banner tells visitors we "measure performance" — while the advertising
// consent signals (Consent Mode v2) stay denied until the visitor picks
// "Accept all". Page views on client-side navigation are recorded by GA4's
// Enhanced Measurement ("page changes based on browser history events"),
// which is on by default for every GA4 web stream.
export const GoogleAnalytics = ({ measurementId }: { measurementId: string }) => {
  useEffect(() => onConsentChange(() => updateAdConsent(hasMarketingConsent())), []);

  // The consent default must be queued before the tag processes anything, so
  // it lives in the same inline script that boots the dataLayer. It reads the
  // stored choice directly: a returning visitor who already accepted gets
  // ad consent granted from the very first hit.
  const bootstrap = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
var bbAds = 'denied';
try { if (localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'all') { bbAds = 'granted'; } } catch (e) {}
gtag('consent', 'default', { ad_storage: bbAds, ad_user_data: bbAds, ad_personalization: bbAds, analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', '${measurementId}');
`.trim();

  return (
    <>
      <Script id="bb-ga-bootstrap" strategy="afterInteractive">{bootstrap}</Script>
      <Script
        id="bb-ga-tag"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
};
