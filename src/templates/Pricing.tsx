import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { PricingInformation } from '@/features/billing/PricingInformation';
import { Section } from '@/features/landing/Section';
import { PLAN_ID } from '@/utils/AppConfig';
import { BuyNowButton } from '@/features/billing/BuyNowButton'; // ✅ Import BuyNowButton

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
            <Link
              className={buttonVariants({
                size: 'sm',
                className: 'mt-5 w-full',
              })}
              href="/sign-up"
            >
              {t('button_text')}
            </Link>
          ),
          [PLAN_ID.PREMIUM]: (
            <BuyNowButton planId={PLAN_ID.PREMIUM} /> // ✅ Use BuyNowButton for paid plans
          ),
          [PLAN_ID.ENTERPRISE]: (
            <BuyNowButton planId={PLAN_ID.ENTERPRISE} /> // ✅ Use BuyNowButton for Enterprise
          ),
        }}
      />
    </Section>
  );
};
