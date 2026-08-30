// Cookie-consent store shared by the cookie banner and the marketing tags.
//
// The banner writes the visitor's choice here; GoogleAnalytics and MetaPixel
// read it and subscribe to changes, so a click on "Accept all" turns the
// marketing tags on immediately — no reload needed.

export const CONSENT_STORAGE_KEY = 'bb-cookie-consent';
export const CONSENT_EVENT = 'bb-cookie-consent-change';

export type CookieConsent = 'all' | 'essential';

export const getCookieConsent = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    // Storage is blocked (private mode / strict settings). Without a stored
    // choice the visitor is treated as not-yet-consented, which is the only
    // safe default for marketing tags — and the banner will ask again.
    return null;
  }
};

// Only an explicit "Accept all" unlocks marketing tags (Meta Pixel, ad
// consent for Google). "Essential only" and "no choice yet" both mean no.
export const hasMarketingConsent = () => getCookieConsent() === 'all';

export const setCookieConsent = (value: CookieConsent) => {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent<CookieConsent>(CONSENT_EVENT, { detail: value }));
};

export const onConsentChange = (listener: (value: CookieConsent) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<CookieConsent>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
};
