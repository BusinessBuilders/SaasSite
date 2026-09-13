// @vitest-environment jsdom
// The eventID asserted here is the deduplication key: the browser Pixel call
// and the worker's Conversions API call must carry the SAME id or Meta counts
// one lead twice. The consent gate is the privacy policy's promise in code.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setCookieConsent } from '@/components/analytics/consent';
import { readMetaCookies, trackAtlas } from '@/features/atlas/analytics';

const clearCookies = () => {
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0];
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
};

describe('trackAtlas', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.gtag = vi.fn();
    window.fbq = vi.fn();
  });

  it('always sends GA4, sends Pixel only with marketing consent, with the shared eventID', () => {
    trackAtlas('atlas_call_start', { persona: 'landscaping' }, { eventId: 'E1' });

    expect(window.gtag).toHaveBeenCalledWith('event', 'atlas_call_start', { persona: 'landscaping' });
    expect(window.fbq).not.toHaveBeenCalled();

    setCookieConsent('all');
    trackAtlas('generate_lead', { persona: 'landscaping' }, { eventId: 'E1' });

    expect(window.fbq).toHaveBeenCalledWith('track', 'Lead', {}, { eventID: 'E1' });
  });

  it('maps atlas_booked to the Pixel Schedule event and leaves untracked events GA4-only', () => {
    setCookieConsent('all');

    trackAtlas('atlas_booked', { persona: 'restaurant' }, { eventId: 'E2' });

    expect(window.fbq).toHaveBeenCalledWith('track', 'Schedule', {}, { eventID: 'E2' });

    (window.fbq as ReturnType<typeof vi.fn>).mockClear();
    trackAtlas('atlas_call_end', { persona: 'restaurant', duration_s: 42 });

    expect(window.gtag).toHaveBeenCalledWith('event', 'atlas_call_end', { persona: 'restaurant', duration_s: 42 });
    expect(window.fbq).not.toHaveBeenCalled();
  });
});

describe('readMetaCookies', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearCookies();
    document.cookie = '_fbp=fb.1.1700000000000.1234567890; path=/';
    document.cookie = '_fbc=fb.1.1700000000000.AbCdEf; path=/';
  });

  it('returns nothing at all without marketing consent', () => {
    expect(readMetaCookies()).toEqual({});
  });

  it('returns the _fbp and _fbc values once the visitor accepts all', () => {
    setCookieConsent('all');

    expect(readMetaCookies()).toEqual({
      fbp: 'fb.1.1700000000000.1234567890',
      fbc: 'fb.1.1700000000000.AbCdEf',
    });
  });

  it('treats an emptied cookie as absent rather than passing "" to the Conversions API', () => {
    clearCookies();
    document.cookie = '_fbp=fb.1.1700000000000.1234567890; path=/';
    setCookieConsent('all');

    expect(readMetaCookies()).toEqual({ fbp: 'fb.1.1700000000000.1234567890', fbc: undefined });
  });
});
