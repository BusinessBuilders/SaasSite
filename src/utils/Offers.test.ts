import { describe, expect, it } from 'vitest';

import {
  buildOffersJsonLd,
  formatUsd,
  hasPaymentLink,
  OFFER_GROUPS,
  OFFER_TERMS,
  OFFERS,
  offersInGroup,
} from './Offers';

// The September 2026 price list, typed in by hand from the PDF
// (~/BB-x-DiPilato/pdf/Price List-BBxDiPilato.pdf). If offers.json drifts from
// the sheet, this fails and names the offer. [one-time, monthly]; null = no
// one-time investment.
const PRICE_LIST: Record<string, [number | null, number]> = {
  'company-wide-ai-build': [50000, 1997],
  'back-office-build': [13000, 1497],
  'contractor-takeover': [5999, 997],
  'booked-solid': [1997, 497],
  'ai-receptionist': [1997, 297],
  'local-authority': [6500, 250],
  'local-presence': [3500, 150],
  'website-starter': [1997, 97],
  'full-local': [null, 1000],
  'social-search': [null, 499],
  'social-starter': [null, 199],
};

// Words that must never reach a customer: the "we do or we don't" rule, and
// the no-placeholder rule.
const BANNED = [
  /\btry\b|\btries\b|\btried\b|\btrying\b/i,
  /coming soon/i,
  /lorem/i,
  /\bTODO\b/,
  /example\.com/i,
  /555-\d{4}/,
];

const everyString = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(everyString);
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(everyString);
  }
  return [];
};

describe('offers.json matches the September 2026 price list', () => {
  it('has exactly the offers on the sheet, no more, no fewer', () => {
    expect(OFFERS.map(o => o.slug).sort()).toEqual(
      Object.keys(PRICE_LIST).sort(),
    );
  });

  it.each(OFFERS.map(o => [o.slug, o] as const))(
    '%s carries the sheet price',
    (slug, offer) => {
      const [setup, monthly] = PRICE_LIST[slug]!;

      expect(offer.setup).toBe(setup);
      expect(offer.monthly).toBe(monthly);
    },
  );

  it('every offer belongs to a known group and every group has offers', () => {
    const groupIds = OFFER_GROUPS.map(g => g.id);
    for (const offer of OFFERS) {
      expect(groupIds).toContain(offer.group);
    }
    for (const group of OFFER_GROUPS) {
      expect(offersInGroup(group.id).length).toBeGreaterThan(0);
    }
  });

  it('every offer has a name, tagline, at least two inclusions and a care note', () => {
    for (const offer of OFFERS) {
      expect(offer.name.trim().length, offer.slug).toBeGreaterThan(0);
      expect(offer.tagline.trim().length, offer.slug).toBeGreaterThan(0);
      expect(offer.inclusions.length, offer.slug).toBeGreaterThanOrEqual(2);
      expect(offer.care.trim().length, offer.slug).toBeGreaterThan(0);
    }
  });

  it('slugs are unique and URL-safe', () => {
    const slugs = OFFERS.map(o => o.slug);

    expect(new Set(slugs).size).toBe(slugs.length);

    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('every offer can be bought from the website', () => {
  // A blank or malformed link would render a Buy button that goes nowhere.
  // Run `bash scripts/stripe-offers.sh` to make the Stripe Payment Links.
  it.each(OFFERS.map(o => [o.slug, o] as const))(
    '%s has a live Stripe Payment Link',
    (_slug, offer) => {
      expect(offer.paymentLink).toMatch(
        /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/,
      );
      expect(hasPaymentLink(offer)).toBe(true);
    },
  );

  it('no two offers share a Payment Link', () => {
    const links = OFFERS.map(o => o.paymentLink);

    expect(new Set(links).size).toBe(links.length);
  });
});

describe('customer-facing words', () => {
  it.each(BANNED.map(rx => [rx.source]))(
    'no offer copy matches /%s/',
    (source) => {
      const rx = new RegExp(source, 'i');
      const offenders = [
        ...everyString(
          OFFERS.map(
            ({ stripe: _stripe, paymentLink: _link, ...rest }) => rest,
          ),
        ),
        ...everyString(OFFER_GROUPS),
        ...OFFER_TERMS,
      ].filter(s => rx.test(s));

      expect(offenders).toEqual([]);
    },
  );
});

describe('helpers', () => {
  it('formats whole dollars with US grouping', () => {
    expect(formatUsd(97)).toBe('$97');
    expect(formatUsd(1997)).toBe('$1,997');
    expect(formatUsd(50000)).toBe('$50,000');
  });

  it('builds one Product per offer with the same prices the page shows', () => {
    const jsonLd = buildOffersJsonLd(
      OFFERS,
      'https://business-builder.online/pricing',
    );

    expect(jsonLd.itemListElement).toHaveLength(OFFERS.length);

    const starter = jsonLd.itemListElement.find(
      i => i.item.name === 'Website Starter',
    )!;

    expect(starter.item.offers.map(o => o.price)).toEqual([1997, 97]);

    const social = jsonLd.itemListElement.find(
      i => i.item.name === 'Social Starter',
    )!;

    expect(social.item.offers.map(o => o.price)).toEqual([199]);
  });
});
