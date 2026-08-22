import { describe, expect, it } from 'vitest';

import { localizedUrl, pageAlternates } from './Seo';

describe('localizedUrl', () => {
  it('english pages are unprefixed, french pages carry /fr', () => {
    expect(localizedUrl('/', 'en')).toBe('https://business-builder.online');
    expect(localizedUrl('/', 'fr')).toBe('https://business-builder.online/fr');
    expect(localizedUrl('/pricing', 'en')).toBe('https://business-builder.online/pricing');
    expect(localizedUrl('/pricing', 'fr')).toBe('https://business-builder.online/fr/pricing');
  });
});

describe('pageAlternates', () => {
  it('homepage: self-referencing canonical per locale plus a full hreflang set', () => {
    expect(pageAlternates('/', 'en')).toEqual({
      canonical: 'https://business-builder.online',
      languages: {
        'en': 'https://business-builder.online',
        'fr': 'https://business-builder.online/fr',
        'x-default': 'https://business-builder.online',
      },
    });
    expect(pageAlternates('/', 'fr').canonical).toBe('https://business-builder.online/fr');
  });

  it('localized subpage: canonical points at its own locale URL', () => {
    expect(pageAlternates('/pricing', 'en').canonical).toBe('https://business-builder.online/pricing');
    expect(pageAlternates('/pricing', 'fr')).toEqual({
      canonical: 'https://business-builder.online/fr/pricing',
      languages: {
        'en': 'https://business-builder.online/pricing',
        'fr': 'https://business-builder.online/fr/pricing',
        'x-default': 'https://business-builder.online/pricing',
      },
    });
  });

  it('english-only page: every locale canonicalizes to the en URL, no hreflang set', () => {
    const fr = pageAlternates('/contact', 'fr', { englishOnly: true });

    expect(fr.canonical).toBe('https://business-builder.online/contact');
    expect(fr.languages).toBeUndefined();
  });
});
