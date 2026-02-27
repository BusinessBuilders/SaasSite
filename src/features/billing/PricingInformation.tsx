import { useTranslations } from 'next-intl';

import { PricingCard } from '@/features/billing/PricingCard';
import { PricingFeature } from '@/features/billing/PricingFeature';
import { PricingPlanList } from '@/utils/AppConfig';

export const PricingInformation = (props: {
  buttonList: Record<string, React.ReactNode>;
}) => {
  const t = useTranslations('PricingPlan');

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
      {Object.values(PricingPlanList).map(plan => (
        <PricingCard
          key={plan.id}
          planId={plan.id}
          price={plan.price}
          interval={plan.interval}
          button={props.buttonList[plan.id]}
        >
          {plan.features.aiTokens !== undefined && (
            <PricingFeature>
              {t('feature_ai_tokens', { number: plan.features.aiTokens })}
            </PricingFeature>
          )}

          {plan.features.socialPlatforms !== undefined && (
            <PricingFeature>
              {t('feature_social_platforms', { number: plan.features.socialPlatforms })}
            </PricingFeature>
          )}

          <PricingFeature>
            {t('feature_website', { number: plan.features.website })}
          </PricingFeature>

          <PricingFeature>
            {t('feature_storage', { number: plan.features.storage })}
          </PricingFeature>

          {plan.features.customDomain && (
            <PricingFeature>{t('feature_custom_domain')}</PricingFeature>
          )}

          {plan.features.scheduling && (
            <PricingFeature>{t('feature_scheduling')}</PricingFeature>
          )}
        </PricingCard>
      ))}
    </div>
  );
};
