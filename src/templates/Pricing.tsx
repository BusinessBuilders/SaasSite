import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';
import { OfferGroupSection } from '@/features/offers/OfferGroupSection';

// Homepage pricing: the website builds and the social media plans, straight
// from offers.json (the same cards and Stripe links as /pricing). The AI front
// desk and custom builds live on /pricing and /atlas, linked from below.
export const Pricing = () => {
  const t = useTranslations('Pricing');

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
      className="py-12"
    >
      <OfferGroupSection
        group="websites"
        compact
        headingLevel="h3"
        className="max-w-none px-0 py-6"
      />
      <OfferGroupSection
        group="social"
        compact
        headingLevel="h3"
        className="max-w-none px-0 py-6"
      />
      <p className="mt-8 text-center">
        <Link href="/pricing" className="bb-btn bb-btn-ghost">
          {t('all_pricing')}
        </Link>
      </p>
    </Section>
  );
};
