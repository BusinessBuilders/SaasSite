import { useTranslations } from 'next-intl';

import { BuyNowButton } from '@/features/billing/BuyNowButton';
import { PricingInformation } from '@/features/billing/PricingInformation';
import { Section } from '@/features/landing/Section';
import { PLAN_ID } from '@/utils/AppConfig';

export const Pricing = () => {
  const t = useTranslations('Pricing');

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <PricingInformation
        buttonList={{
          [PLAN_ID.STARTER]: (
            <BuyNowButton planId={PLAN_ID.STARTER} />
          ),
          [PLAN_ID.GROWTH]: (
            <BuyNowButton planId={PLAN_ID.GROWTH} />
          ),
          [PLAN_ID.PRO]: (
            <BuyNowButton planId={PLAN_ID.PRO} />
          ),
        }}
      />
    </Section>
  );
};
