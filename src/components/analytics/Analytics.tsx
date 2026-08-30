import { Env } from '@/libs/Env';

import { GoogleAnalytics } from './GoogleAnalytics';
import { MetaPixel } from './MetaPixel';

// A production build without the tracking IDs is a misconfiguration, not a
// feature flag — say so in the build/PM2 logs instead of silently shipping a
// site that reports nothing. (Dev and test deliberately leave these unset so
// local traffic never lands in the real reports.)
if (process.env.NODE_ENV === 'production') {
  if (!Env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    console.error(
      '[analytics] NEXT_PUBLIC_GA_MEASUREMENT_ID is not set — Google Analytics is NOT running on this deployment. See docs/analytics-and-seo.md.',
    );
  }
  if (!Env.NEXT_PUBLIC_META_PIXEL_ID) {
    console.error(
      '[analytics] NEXT_PUBLIC_META_PIXEL_ID is not set — the Meta Pixel is NOT running on this deployment. See docs/analytics-and-seo.md.',
    );
  }
}

export const Analytics = () => (
  <>
    {Env.NEXT_PUBLIC_GA_MEASUREMENT_ID
      ? <GoogleAnalytics measurementId={Env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      : null}
    {Env.NEXT_PUBLIC_META_PIXEL_ID
      ? <MetaPixel pixelId={Env.NEXT_PUBLIC_META_PIXEL_ID} />
      : null}
  </>
);
