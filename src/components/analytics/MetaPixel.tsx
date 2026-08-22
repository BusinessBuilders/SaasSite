'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

import { hasMarketingConsent, onConsentChange } from './consent';

declare global {
  // Augmenting the global Window type requires `interface` (declaration merging).
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Meta Pixel. Nothing is loaded until the visitor clicks "Accept all" on the
// cookie banner (that is what the privacy policy promises). Once loaded it
// stays loaded for the session; a later "Essential only" revokes consent
// inside the pixel so no further events are sent.
export const MetaPixel = ({ pixelId }: { pixelId: string }) => {
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (hasMarketingConsent()) {
      setLoaded(true);
    }
    return onConsentChange(() => {
      const granted = hasMarketingConsent();
      if (granted) {
        setLoaded(true);
      }
      window.fbq?.('consent', granted ? 'grant' : 'revoke');
    });
  }, []);

  // The bootstrap script below fires the first PageView. This effect covers
  // client-side navigation (Next.js <Link>), which the pixel can't see itself.
  useEffect(() => {
    if (!loaded) {
      return;
    }
    if (lastTrackedPath.current === null) {
      lastTrackedPath.current = pathname;
      return;
    }
    if (lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname;
      window.fbq?.('track', 'PageView');
    }
  }, [loaded, pathname]);

  if (!loaded) {
    return null;
  }

  const bootstrap = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
`.trim();

  return (
    <>
      <Script id="bb-meta-pixel" strategy="afterInteractive">{bootstrap}</Script>
      <noscript>
        {/* Meta's standard no-JS fallback — a 1x1 beacon, not a page image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
};
