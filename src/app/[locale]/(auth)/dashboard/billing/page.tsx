import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/buttonVariants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BuyNowButton } from '@/features/billing/BuyNowButton';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { PLAN_ID, PricingPlanList } from '@/utils/AppConfig';
import { cn } from '@/utils/Helpers';

import { ManageBillingButton } from './ManageBillingButton';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Billing',
  });

  return {
    title: t('title_bar'),
  };
}

export default async function BillingPage() {
  const user = await currentUser();
  const userId = user?.id || '';

  const orgData = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, userId));

  const org = orgData[0];
  const plan = org?.plan || 'free';
  const status = org?.subscriptionStatus || 'free';
  const tokens = org?.tokenBalance ?? 100;
  const isPaid = plan !== 'free';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Past due warning */}
      {status === 'past_due' && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Payment past due
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please update your payment method to avoid service interruption.
              </p>
            </div>
            <div className="ml-auto">
              <ManageBillingButton />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout success banner */}

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-3xl font-bold capitalize">{plan}</p>
              <div className="mt-1 flex items-center gap-2">
                {status === 'active'
                  ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="size-4" />
                        Active
                      </span>
                    )
                  : status === 'past_due'
                    ? (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <AlertTriangle className="size-4" />
                          Past Due
                        </span>
                      )
                    : status === 'canceled'
                      ? (
                          <span className="text-sm text-red-500">Canceled</span>
                        )
                      : (
                          <span className="text-sm text-muted-foreground">Free tier</span>
                        )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <span className="text-sm font-medium">AI Tokens:</span>
            <span className="text-sm">
              {tokens.toLocaleString()}
              {' '}
              remaining
            </span>
          </div>

          {isPaid && <ManageBillingButton />}
        </CardContent>
      </Card>

      {/* Upgrade options for free users */}
      {!isPaid && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Upgrade Your Plan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.values(PricingPlanList).map(planOption => (
              <Card
                key={planOption.id}
                className={cn(
                  planOption.id === PLAN_ID.GROWTH && 'border-brand-orange ring-1 ring-brand-orange',
                )}
              >
                <CardHeader>
                  <CardTitle className="text-base capitalize">{planOption.id}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                      {`$${planOption.price}`}
                    </span>
                    /month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>{`${planOption.features.aiTokens?.toLocaleString()} AI tokens`}</li>
                    <li>{`${planOption.features.socialPlatforms} social platforms`}</li>
                    <li>{`${planOption.features.website} website(s)`}</li>
                    <li>{`${planOption.features.storage} GB storage`}</li>
                    {planOption.features.customDomain && <li>Custom domain</li>}
                  </ul>
                  <BuyNowButton
                    planId={planOption.id}
                    text="Upgrade"
                    className={cn(
                      'w-full',
                      planOption.id === PLAN_ID.GROWTH && 'bg-brand-orange hover:bg-brand-orange-hover',
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Paid user plan comparison */}
      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Want to change your plan?</CardTitle>
            <CardDescription>
              Use the Stripe customer portal to upgrade, downgrade, or cancel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManageBillingButton
              className={cn(buttonVariants({ variant: 'outline' }))}
              text="Manage in Stripe Portal"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
