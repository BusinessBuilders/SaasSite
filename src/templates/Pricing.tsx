import { useTranslations } from 'next-intl';

import { BuyNowButton } from '@/features/billing/BuyNowButton'; // ✅ Import BuyNowButton
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
          [PLAN_ID.FREE]: (
            <BuyNowButton planId={PLAN_ID.FREE} /> // ✅ Now Free Plan has Buy Button!
          ),
          [PLAN_ID.PREMIUM]: (
            <BuyNowButton planId={PLAN_ID.PREMIUM} /> // ✅ Paid Plans Stay the Same
          ),
          [PLAN_ID.ENTERPRISE]: (
            <BuyNowButton planId={PLAN_ID.ENTERPRISE} />
          ),
        }}
      />
    </Section>
  );
};
