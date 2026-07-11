import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { AIAutomationBand } from '@/templates/AIAutomationBand';
import { CTA } from '@/templates/CTA';
import { FAQ } from '@/templates/FAQ';
import { Features } from '@/templates/Features';
import { Footer } from '@/templates/Footer';
import { Hero } from '@/templates/Hero';
import { Navbar } from '@/templates/Navbar';
import { Pricing } from '@/templates/Pricing';
// SocialPlatforms intentionally removed from the homepage — the underlying
// TikTok/Facebook/Instagram integrations are behind schedule, so we don't
// want the marketing surface promising features that aren't shipped yet.
// Re-import and re-add <SocialPlatforms /> below when the integrations land.

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const IndexPage = async (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  // FAQPage JSON-LD built from the same next-intl items the visible <FAQ />
  // accordion renders — one data source, so schema and visible text can't drift.
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'FAQ',
  });
  const faqItems = t.raw('items') as { question: string; answer: string }[];
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
    })),
  };

  return (
    <>
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <Hero />
      <AIAutomationBand />
      <Features />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
};

export default IndexPage;
