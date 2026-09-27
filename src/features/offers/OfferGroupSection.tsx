// src/features/offers/OfferGroupSection.tsx — one group from the price list
// (websites, social, AI front desk, custom builds): heading, then a card per
// offer. Used by /pricing (every group), the homepage (websites + social) and
// /atlas (AI front desk), all reading the same offers.json.
import { Reveal } from '@/components/motion/Reveal';
import { Eyebrow } from '@/features/atlas/Eyebrow';
import { cn } from '@/utils/Helpers';
import { offerGroup, type OfferGroupId, offersInGroup } from '@/utils/Offers';

import { OfferCard } from './OfferCard';

type Props = {
  group: OfferGroupId;
  /** Homepage variant of the cards. */
  compact?: boolean;
  /** h2 on a page that has its own h1; h3 inside a section that already has an h2. */
  headingLevel?: 'h2' | 'h3';
  className?: string;
  children?: React.ReactNode;
};

export const OfferGroupSection = ({
  group,
  compact = false,
  headingLevel = 'h2',
  className,
  children,
}: Props) => {
  const meta = offerGroup(group);
  const offers = offersInGroup(group);
  const Heading = headingLevel;

  return (
    <section
      id={group}
      aria-labelledby={`offers-${group}`}
      className={cn('mx-auto max-w-6xl scroll-mt-24 px-4 py-14', className)}
    >
      <Reveal>
        <Eyebrow className="mb-2">{meta.eyebrow}</Eyebrow>
        <Heading
          id={`offers-${group}`}
          className="text-3xl font-bold text-bb-cream md:text-4xl"
        >
          {meta.title}
        </Heading>
        <p className="mt-3 max-w-2xl text-lg text-bb-taupe">
          {meta.description}
        </p>
      </Reveal>

      <div
        className={cn(
          'mt-10 grid gap-6',
          offers.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
        )}
      >
        {offers.map((offer, index) => (
          <Reveal key={offer.slug} delay={index * 0.1} className="h-full">
            <OfferCard offer={offer} compact={compact} />
          </Reveal>
        ))}
      </div>

      {children}
    </section>
  );
};
