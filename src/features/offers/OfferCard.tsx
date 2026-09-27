// src/features/offers/OfferCard.tsx — one offer from the price list, with its
// Buy button. The button is a plain link to a Stripe Payment Link: Stripe hosts
// the checkout page, collects the card, email and phone, and starts the monthly
// plan. No account on this site is needed, so nothing here depends on Clerk.
import { cn } from '@/utils/Helpers';
import {
  CALENDLY_URL,
  formatUsd,
  hasPaymentLink,
  type Offer,
} from '@/utils/Offers';

const Check = () => (
  <svg
    aria-hidden="true"
    className="mt-1 size-4 shrink-0 stroke-current stroke-[2.5] text-bb-teal-soft"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
);

type Props = {
  offer: Offer;
  /** Homepage variant: fewer lines, no care note. */
  compact?: boolean;
};

export const OfferCard = ({ offer, compact = false }: Props) => {
  if (!hasPaymentLink(offer)) {
    // Loud on purpose. A card without a working link would be a Buy button
    // that goes nowhere; the unit test catches this first, this is the backstop.
    throw new Error(
      `Offer "${offer.slug}" has no Stripe Payment Link. Run: bash scripts/stripe-offers.sh`,
    );
  }

  const inclusions = compact ? offer.inclusions.slice(0, 3) : offer.inclusions;

  return (
    <article
      id={offer.slug}
      aria-labelledby={`offer-${offer.slug}`}
      className={cn(
        'relative flex h-full flex-col rounded-md border-2 bg-bb-black-warm p-6 md:p-7',
        offer.featured
          ? 'border-bb-orange shadow-bb-featured'
          : 'border-bb-cream/20 shadow-bb-card',
      )}
    >
      {offer.featured && (
        <span className="bb-tag absolute -top-3 right-5">Recommended</span>
      )}

      <h3
        id={`offer-${offer.slug}`}
        className="font-bb-display-2 text-2xl font-extrabold text-bb-cream-bright"
      >
        {offer.name}
      </h3>
      <p className="mt-1 text-sm text-bb-taupe">{offer.tagline}</p>

      <div className="mt-5">
        {offer.setup !== null
          ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-bb-display-2 text-4xl font-bold text-bb-cream-bright">
                    {formatUsd(offer.setup)}
                  </span>
                  <span className="bb-label">one-time build</span>
                </p>
                <p className="mt-1 text-bb-taupe">
                  {'+ '}
                  <span className="font-bold text-bb-cream">
                    {formatUsd(offer.monthly)}
                  </span>
                  {' / month'}
                </p>
              </>
            )
          : (
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-bb-display-2 text-4xl font-bold text-bb-cream-bright">
                  {formatUsd(offer.monthly)}
                </span>
                <span className="bb-label">per month</span>
              </p>
            )}
      </div>

      <ul className="mt-6 space-y-2">
        {inclusions.map(line => (
          <li key={line} className="flex gap-2 text-bb-cream">
            <Check />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {!compact && <p className="mt-4 text-sm text-bb-taupe">{offer.care}</p>}

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <a href={offer.paymentLink} className="bb-btn bb-btn-primary w-full">
          Buy now
          <span className="sr-only">{`: ${offer.name}`}</span>
        </a>
        {offer.bookCall && (
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bb-btn bb-btn-ghost w-full"
          >
            Book a call first
            <span className="sr-only">{`: ${offer.name}`}</span>
          </a>
        )}
      </div>
    </article>
  );
};
