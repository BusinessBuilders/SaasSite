// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  getCookieConsent,
  hasMarketingConsent,
  onConsentChange,
  setCookieConsent,
} from './consent';

describe('cookie consent store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null before the visitor has chosen', () => {
    expect(getCookieConsent()).toBeNull();
    expect(hasMarketingConsent()).toBe(false);
  });

  it('persists the choice under the banner storage key', () => {
    setCookieConsent('all');

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('all');
    expect(getCookieConsent()).toBe('all');
    expect(hasMarketingConsent()).toBe(true);
  });

  it('only "all" counts as marketing consent', () => {
    setCookieConsent('essential');

    expect(hasMarketingConsent()).toBe(false);

    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'garbage');

    expect(hasMarketingConsent()).toBe(false);
  });

  it('notifies subscribers when the choice changes, and unsubscribes cleanly', () => {
    const listener = vi.fn();
    const off = onConsentChange(listener);
    setCookieConsent('all');

    expect(listener).toHaveBeenCalledWith('all');

    setCookieConsent('essential');

    expect(listener).toHaveBeenLastCalledWith('essential');

    off();
    setCookieConsent('all');

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('dispatches a DOM event the cookie banner can also fire', () => {
    const listener = vi.fn();
    window.addEventListener(CONSENT_EVENT, listener);
    setCookieConsent('all');

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(CONSENT_EVENT, listener);
  });
});
