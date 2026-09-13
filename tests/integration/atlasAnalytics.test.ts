// @vitest-environment jsdom
// The eventID asserted here is the deduplication key: the browser Pixel call
// and the worker's Conversions API call must carry the SAME id or Meta counts
// one lead twice. The consent gate is the privacy policy's promise in code.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setCookieConsent } from '@/components/analytics/consent';
import { trackAtlas } from '@/features/atlas/analytics';

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
});
