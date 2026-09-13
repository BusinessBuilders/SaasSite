// src/features/atlas/analytics.ts — GA4 always (analytics storage is granted
// by the banner), Meta Pixel only after "Accept all". The eventID is the same
// value the worker sends to the Conversions API, so Meta deduplicates.
import { hasMarketingConsent } from '@/components/analytics/consent';

export type AtlasEvent
  = | 'atlas_persona_selected'
  | 'atlas_call_start'
  | 'generate_lead'
  | 'atlas_booked'
  | 'atlas_call_end'
  | 'atlas_error';

const PIXEL_EVENT: Partial<Record<AtlasEvent, string>> = {
  atlas_call_start: 'Contact',
  generate_lead: 'Lead',
  atlas_booked: 'Schedule',
};

export const trackAtlas = (
  name: AtlasEvent,
  params: Record<string, string | number>,
  opts: { eventId?: string } = {},
) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.gtag?.('event', name, params);
  const pixelName = PIXEL_EVENT[name];
  if (pixelName && hasMarketingConsent()) {
    window.fbq?.('track', pixelName, {}, opts.eventId ? { eventID: opts.eventId } : undefined);
  }
};

// Meta's browser cookies. They are sent with the session request so the
// worker's server-side Conversions API call can be matched to this browser —
// which is only lawful once the visitor has accepted marketing cookies, so
// without that consent this returns nothing at all.
export const readMetaCookies = (): { fbp?: string; fbc?: string } => {
  if (typeof document === 'undefined' || !hasMarketingConsent()) {
    return {};
  }
  const get = (k: string) => document.cookie.split('; ').find(c => c.startsWith(`${k}=`))?.slice(k.length + 1);
  return { fbp: get('_fbp'), fbc: get('_fbc') };
};
