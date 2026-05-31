import { useTranslations } from 'next-intl';
import React from 'react';

import type { BillingInterval } from '@/types/Subscription';
import { cn } from '@/utils/Helpers';

const FEATURED_PLAN_ID = 'growth';

export const PricingCard = (props: {
  planId: string;
  price: number;
  interval: BillingInterval;
  button: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('PricingPlan');
  const isFeatured = props.planId === FEATURED_PLAN_ID;

  return (
    <div
      className={cn(
        'relative rounded-md border-2 bg-bb-black-warm px-6 py-8 text-center',
        isFeatured
          ? 'border-bb-orange shadow-bb-featured'
          : 'border-bb-cream/20 shadow-bb-card',
      )}
    >
      {isFeatured && (
        <span className="bb-tag absolute -top-3 right-6">
          Best Value
        </span>
      )}

      <div className="bb-eyebrow text-center">
        {t(`${props.planId}_plan_name`)}
      </div>

      <div className="mt-3 flex items-center justify-center">
        <div className="font-bb-display-2 text-5xl font-bold text-bb-cream-bright">
          {`$${props.price}`}
        </div>

        <div className="ml-1 text-bb-taupe">
          {`/ ${t(`plan_interval_${props.interval}`)}`}
        </div>
      </div>

      <div className="mt-2 text-sm text-bb-taupe">
        {t(`${props.planId}_plan_description`)}
      </div>

      {props.button}

      <ul className="mt-8 space-y-3">{props.children}</ul>
    </div>
  );
};
