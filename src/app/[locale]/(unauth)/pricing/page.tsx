import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { Reveal } from '@/components/motion/Reveal';
import { ATLAS_PHONE_DISPLAY, ATLAS_PHONE_TEL } from '@/features/atlas/content';
import { Eyebrow } from '@/features/atlas/Eyebrow';
import { OfferGroupSection } from '@/features/offers/OfferGroupSection';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import {
  buildOffersJsonLd,
  CALENDLY_URL,
  OFFER_GROUPS,
  OFFER_TERMS,
  OFFERS,
} from '@/utils/Offers';
import {
  buildBreadcrumbJsonLd,
  localizedUrl,
  pageAlternates,
} from '@/utils/Seo';

// The public call line (the Google Business Profile number).
const CALL_DISPLAY = '774-244-1878';
const CALL_TEL = '+17742441878';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'PricingPage',
  });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    // The offers are English copy on both locales, so both canonicalize here.
    alternates: pageAlternates('/pricing', props.params.locale, {
      englishOnly: true,
    }),
  };
}

// Every price on this page comes from src/utils/offers.json, the one file the
// website, the Stripe Payment Links and the unit test share. The page is
// static: no account, no database, no Stripe call at request time. Buying is
// a link to Stripe's own checkout page.
export default function PricingPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale);
  const pageUrl = localizedUrl('/pricing', 'en');

  return (
    <>
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildOffersJsonLd(OFFERS, pageUrl)),
        }}
      />
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([{ name: 'Pricing', path: '/pricing' }]),
          ),
        }}
      />
      <Navbar />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-4 pt-16 md:pt-24">
          <Reveal>
            <Eyebrow className="mb-3">Pricing</Eyebrow>
            <h1 className="font-bb-display-2 text-4xl font-extrabold leading-tight text-bb-cream-bright md:text-6xl">
              Websites, social media and an AI front desk, priced up front.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-bb-taupe md:text-xl">
              Every price on this page is the price you pay: a one-time build,
              then monthly care within a clear scope. Pay online and William
              calls you to set the written scope, or book a 15-minute call
              first.
            </p>
            <nav
              aria-label="Jump to a group of offers"
              className="mt-8 flex flex-wrap gap-3"
            >
              {OFFER_GROUPS.map(group => (
                <a
                  key={group.id}
                  href={`#${group.id}`}
                  className="border-bb-cream/20 rounded-full border px-4 py-2 text-sm font-semibold text-bb-cream transition-colors hover:border-bb-orange hover:text-bb-orange"
                >
                  {group.eyebrow}
                </a>
              ))}
            </nav>
          </Reveal>
        </section>

        <OfferGroupSection group="websites" />
        <OfferGroupSection group="social" />
        <OfferGroupSection group="ai-front-desk">
          <p className="mt-8 text-bb-taupe">
            Hear it before you buy it:
            {' '}
            <Link
              href="/atlas"
              className="text-bb-teal-soft underline underline-offset-4 transition-colors hover:text-bb-cream"
            >
              talk to Atlas, our AI receptionist
            </Link>
            , or call it on
            {' '}
            <a
              href={`tel:${ATLAS_PHONE_TEL}`}
              className="text-bb-cream underline underline-offset-4"
            >
              {ATLAS_PHONE_DISPLAY}
            </a>
            .
          </p>
        </OfferGroupSection>
        <OfferGroupSection group="custom-builds" />

        <section
          className="mx-auto max-w-6xl px-4 py-14"
          aria-labelledby="pricing-terms"
        >
          <Reveal>
            <Eyebrow className="mb-2">Clear scope, honest terms</Eyebrow>
            <h2
              id="pricing-terms"
              className="text-3xl font-bold text-bb-cream md:text-4xl"
            >
              What care means, and what we do not promise
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {OFFER_TERMS.map((term, index) => (
              <Reveal key={term} delay={index * 0.1} className="h-full">
                <p
                  className="h-full rounded-lg border-l-4 p-6 leading-relaxed text-bb-taupe"
                  style={{
                    borderColor: 'var(--bb-teal)',
                    background: 'var(--bb-bg-elevated)',
                  }}
                >
                  {term}
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24 pt-6 text-center">
          <Reveal>
            <div className="rounded-lg border-2 border-bb-orange bg-bb-black-warm p-10 shadow-bb-card">
              <h2 className="font-bb-display-2 text-3xl font-extrabold text-bb-cream-bright md:text-4xl">
                Not sure which size fits?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-bb-taupe">
                A 15-minute call settles it. William asks what you have done
                about it so far, then names one offer, not three.
              </p>
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bb-btn bb-btn-primary mt-8 inline-block"
              >
                Book a 15-minute call
              </a>
              <p className="mt-5 text-sm text-bb-dust">
                Or call
                {' '}
                <a
                  href={`tel:${CALL_TEL}`}
                  className="text-bb-cream underline underline-offset-4"
                >
                  {CALL_DISPLAY}
                </a>
              </p>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
