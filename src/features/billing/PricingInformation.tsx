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
          {/* Feature Team Member - Exclude for Essentials */}
          {plan.id !== 'free' && plan.features.teamMember !== undefined && (
            <PricingFeature>
              {t('feature_team_member', { number: plan.features.teamMember })}
            </PricingFeature>
          )}

          {/* Always show Website */}
          <PricingFeature>
            {t('feature_website', { number: plan.features.website })}
          </PricingFeature>

          {/* Always show Storage */}
          <PricingFeature>
            {t('feature_storage', { number: plan.features.storage })}
          </PricingFeature>

          {/* Feature Transfer - Exclude for Essentials */}
          {plan.id !== 'free' && plan.features.transfer !== undefined && (
            <PricingFeature>
              {t('feature_transfer', { number: plan.features.transfer })}
            </PricingFeature>
          )}

          {/* Always show Email Support */}
          <PricingFeature>{t('feature_email_support')}</PricingFeature>
        </PricingCard>
      ))}
    </div>
  );
};
