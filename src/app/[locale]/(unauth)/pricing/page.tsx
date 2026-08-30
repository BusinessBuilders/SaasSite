import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { BuyNowButton } from '@/features/billing/BuyNowButton';
import { CheckoutAutoResume } from '@/features/billing/CheckoutAutoResume';
import { PricingCard } from '@/features/billing/PricingCard';
import { PricingFeature } from '@/features/billing/PricingFeature';
import { Section } from '@/features/landing/Section';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import { ManagedPlanList, PLAN_ID, PricingPlanList } from '@/utils/AppConfig';
import { pageAlternates } from '@/utils/Seo';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({ locale: props.params.locale, namespace: 'PricingPage' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: pageAlternates('/pricing', props.params.locale),
  };
}

export const dynamic = 'force-dynamic';

export default function PricingPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <CheckoutAutoResume />
      <Navbar />
      <Section titleAs="h1" subtitle="Platform Plans" title="Self-Service Plans" description="Build and manage your online presence with powerful AI tools.">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
          {Object.values(PricingPlanList).map(plan => (
            <PricingCard
              key={plan.id}
              planId={plan.id}
              price={plan.price}
              interval={plan.interval}
              button={<BuyNowButton planId={plan.id} text="Get Started" />}
            >
              {plan.features.aiTokens !== undefined && (
                <PricingFeature>{`${plan.features.aiTokens.toLocaleString()} AI Tokens / month`}</PricingFeature>
              )}
              {plan.features.socialPlatforms !== undefined && (
                <PricingFeature>{`${plan.features.socialPlatforms} Social Platforms`}</PricingFeature>
              )}
              <PricingFeature>{`${plan.features.website} Website(s)`}</PricingFeature>
              <PricingFeature>{`${plan.features.storage} GB Storage`}</PricingFeature>
              {plan.features.customDomain && <PricingFeature>Custom Domain</PricingFeature>}
              {plan.features.scheduling && <PricingFeature>Post Scheduling</PricingFeature>}
            </PricingCard>
          ))}
        </div>
        {/* Highlight Growth as most popular */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {`Most popular: Growth ($${PricingPlanList[PLAN_ID.GROWTH]?.price}/mo)`}
        </p>
      </Section>

      <Section subtitle="Managed Services" title="Done-For-You Plans" description="Let our team handle everything — social media, design, and content creation.">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
          {Object.values(ManagedPlanList).map(plan => (
            <div key={plan.id} className="rounded-xl border border-border px-6 py-8 text-center">
              <div className="text-lg font-semibold capitalize">{plan.id.replace('_', ' ')}</div>
              <div className="mt-3 flex items-center justify-center">
                <div className="text-5xl font-bold">{`$${plan.price}`}</div>
                <div className="ml-1 text-muted-foreground">/ month</div>
              </div>
              <div className="mt-4">
                <a
                  href={plan.calendlyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Book a Consultation
                </a>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.teamMember !== undefined && (
                  <PricingFeature>{`${plan.features.teamMember} AI Agent Twitter / X`}</PricingFeature>
                )}
                {plan.features.socialPlatforms !== undefined && (
                  <PricingFeature>{`${plan.features.socialPlatforms} Social Platforms`}</PricingFeature>
                )}
                <PricingFeature>{`${plan.features.website} Weekly Posts`}</PricingFeature>
                <PricingFeature>{`${plan.features.storage} GB Storage`}</PricingFeature>
                {plan.features.customVideo !== undefined && (
                  <PricingFeature>{`${plan.features.customVideo} Custom Videos / month`}</PricingFeature>
                )}
                <PricingFeature>Email Support</PricingFeature>
              </ul>
            </div>
          ))}
        </div>
      </Section>
      <Footer />
    </>
  );
}
