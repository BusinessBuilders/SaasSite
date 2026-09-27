// The offers Business Builder sells, read from one JSON file so the website,
// the Stripe provisioning script (scripts/stripe-offers.sh) and the unit test
// that pins prices to the September 2026 price list all see the same numbers.
//
// A price lives in exactly one place: src/utils/offers.json. Change it there,
// run `bash scripts/stripe-offers.sh` (which makes the new Stripe price and
// Payment Link and writes the link back), then commit both files together.
import offersJson from './offers.json';

export type OfferGroupId =
  | 'websites'
  | 'social'
  | 'ai-front-desk'
  | 'custom-builds';

export type OfferGroup = {
  id: OfferGroupId;
  eyebrow: string;
  title: string;
  description: string;
  /** Shown on Stripe's own page after a successful payment. */
  confirmation: string;
};

export type Offer = {
  slug: string;
  name: string;
  group: OfferGroupId;
  tagline: string;
  /** One-time build or setup in whole US dollars; null for monthly-only plans. */
  setup: number | null;
  /** Monthly care / optimization in whole US dollars. */
  monthly: number;
  inclusions: string[];
  care: string;
  featured: boolean;
  /** Custom builds also offer a call before buying. */
  bookCall: boolean;
  /** Stripe Payment Link (https://buy.stripe.com/…), written by the script. */
  paymentLink: string;
  stripe: {
    product?: string;
    setupPrice?: string;
    monthlyPrice?: string;
    paymentLinkId?: string;
  };
};

export const OFFER_GROUPS = offersJson.groups as OfferGroup[];
export const OFFERS = offersJson.offers as Offer[];
export const OFFER_TERMS = offersJson.terms as string[];

export const CALENDLY_URL
  = 'https://calendly.com/donovan-business-builder/15minute';

export const offersInGroup = (group: OfferGroupId): Offer[] =>
  OFFERS.filter(offer => offer.group === group);

export const offerGroup = (group: OfferGroupId): OfferGroup => {
  const found = OFFER_GROUPS.find(g => g.id === group);
  if (!found) {
    throw new Error(`Unknown offer group: ${group}`);
  }
  return found;
};

export const offerBySlug = (slug: string): Offer => {
  const found = OFFERS.find(offer => offer.slug === slug);
  if (!found) {
    throw new Error(`Unknown offer: ${slug}`);
  }
  return found;
};

/** "$1,997" — whole dollars, US grouping, no cents. */
export const formatUsd = (dollars: number): string =>
  `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const PAYMENT_LINK_PATTERN = /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/;

/**
 * True when the offer can be bought from the website right now. A missing or
 * malformed link is a build-time failure (see Offers.test.ts), never a button
 * that quietly does nothing.
 */
export const hasPaymentLink = (offer: Offer): boolean =>
  PAYMENT_LINK_PATTERN.test(offer.paymentLink);

export const isPaymentLink = (url: string): boolean =>
  PAYMENT_LINK_PATTERN.test(url);

// Product + Offer JSON-LD for search engines. One Product per offer, with the
// one-time build and the monthly care as two Offers on it. Prices come from
// the same JSON the page renders, so the schema can never disagree with the
// visible page.
export const buildOffersJsonLd = (offers: Offer[], pageUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  'itemListElement': offers.map((offer, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'item': {
      '@type': 'Product',
      'name': offer.name,
      'description': [offer.tagline, ...offer.inclusions].join('. '),
      'url': `${pageUrl}#${offer.slug}`,
      'brand': { '@type': 'Brand', 'name': 'Business Builder' },
      'offers': [
        ...(offer.setup !== null
          ? [
              {
                '@type': 'Offer',
                'name': `${offer.name}: one-time build`,
                'price': offer.setup,
                'priceCurrency': 'USD',
                'availability': 'https://schema.org/InStock',
                'url': offer.paymentLink,
              },
            ]
          : []),
        {
          '@type': 'Offer',
          'name': `${offer.name}: monthly care`,
          'priceCurrency': 'USD',
          'price': offer.monthly,
          'priceSpecification': {
            '@type': 'UnitPriceSpecification',
            'price': offer.monthly,
            'priceCurrency': 'USD',
            'billingIncrement': 1,
            'unitCode': 'MON',
          },
          'availability': 'https://schema.org/InStock',
          'url': offer.paymentLink,
        },
      ],
    },
  })),
});
