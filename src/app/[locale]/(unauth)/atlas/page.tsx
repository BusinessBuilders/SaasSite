import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

import { Reveal } from '@/components/motion/Reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { buildFaqJsonLd } from '@/features/ai/content';
import { AtlasHero } from '@/features/atlas/AtlasHero';
import {
  ATLAS_DESCRIPTION,
  ATLAS_FAQ,
  ATLAS_PHONE_DISPLAY,
  ATLAS_PHONE_TEL,
  ATLAS_STEPS,
  ATLAS_TITLE,
} from '@/features/atlas/content';
import { Eyebrow } from '@/features/atlas/Eyebrow';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import { buildBreadcrumbJsonLd, pageAlternates } from '@/utils/Seo';

export const metadata: Metadata = {
  // English-only page (the /fr twin shows the same copy) — both canonicalize here.
  title: ATLAS_TITLE,
  description: ATLAS_DESCRIPTION,
  alternates: pageAlternates('/atlas', 'en', { englishOnly: true }),
  openGraph: {
    title: ATLAS_TITLE,
    description: ATLAS_DESCRIPTION,
    images: ['/assets/images/og-image.jpg'],
  },
};

type Props = { params: { locale: string } };

export default function AtlasPage({ params: { locale } }: Props) {
  // Required for static rendering — Navbar/Footer use next-intl.
  unstable_setRequestLocale(locale);

  return (
    <>
      {/* FAQPage JSON-LD — built from the same array the visible accordion renders */}
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(ATLAS_FAQ)),
        }}
      />
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([{ name: 'Talk to Atlas', path: '/atlas' }]),
          ),
        }}
      />
      <Navbar />
      <main>
        <AtlasHero />

        {/* What happens next — the path from the demo to a working line */}
        <section
          className="mx-auto max-w-5xl px-4 py-16"
          aria-labelledby="atlas-steps"
        >
          <Reveal>
            <Eyebrow className="mb-2">After the call</Eyebrow>
            <h2
              id="atlas-steps"
              className="text-3xl font-bold text-bb-cream md:text-4xl"
            >
              What happens after you talk to Atlas
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {ATLAS_STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.1}>
                <li
                  className="h-full rounded-lg border p-6"
                  style={{
                    borderColor: 'var(--bb-border-hair)',
                    background: 'var(--bb-bg-elevated)',
                  }}
                >
                  <div className="font-bb-display-2 text-3xl font-extrabold text-bb-orange">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-bb-cream">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-bb-taupe">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Where the words go — the plain-English privacy answer, on the page */}
        <section className="mx-auto max-w-3xl px-4 py-12">
          <Reveal>
            <div
              className="rounded-lg border-l-4 p-8 md:p-10"
              style={{
                borderColor: 'var(--bb-teal)',
                background: 'var(--bb-bg-elevated)',
              }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-bb-teal-soft">
                Where Your Words Go
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-bb-cream">
                Speech recognition — turning what you say into text — and
                Atlas’s voice both run on our own hardware in Massachusetts.
                Deciding what Atlas says back is handled by GLM, a language
                model from the cloud provider Z.ai, which receives the text of
                what you say. When Z.ai is not used, that work runs on our own
                hardware in Massachusetts instead. The live audio connection is
                relayed through a media server we operate on a machine we rent
                in Germany; your voice passes through it and is not recorded
                there. The conversation is transcribed and kept so William can
                follow up; the audio itself is not kept after it has been
                transcribed.
              </p>
              <p className="mt-4 text-bb-taupe">
                The full detail is in the
                {' '}
                <a
                  href="/privacy-policy#atlas-voice-demo"
                  className="text-bb-teal-soft underline underline-offset-4 transition-colors hover:text-bb-cream"
                >
                  Atlas voice demo section of our privacy policy
                </a>
                , including how to have your transcript deleted.
              </p>
            </div>
          </Reveal>
        </section>

        {/* FAQ — same data as the JSON-LD above */}
        <section
          className="mx-auto max-w-3xl px-4 py-16"
          aria-labelledby="atlas-faq"
        >
          <Reveal>
            <Eyebrow className="mb-2 text-center">Questions</Eyebrow>
            <h2
              id="atlas-faq"
              className="text-center text-3xl font-bold text-bb-cream"
            >
              Questions people ask
            </h2>
          </Reveal>
          <Accordion type="multiple" className="mt-8 w-full">
            {ATLAS_FAQ.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index + 1}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold text-bb-cream">
              Ready when you are
            </h2>
            <p className="mt-3 text-bb-taupe">
              Scroll up and start talking, or call the live line at
              {' '}
              <a
                href={`tel:${ATLAS_PHONE_TEL}`}
                className="text-bb-teal-soft underline underline-offset-4 transition-colors hover:text-bb-cream"
              >
                {ATLAS_PHONE_DISPLAY}
              </a>
              .
            </p>
            <p className="mt-6 text-sm text-bb-dust">
              In Worcester County? See
              {' '}
              <Link
                href="/ai-automation-worcester-county-ma"
                className="text-bb-teal-soft underline underline-offset-4 transition-colors hover:text-bb-cream"
              >
                AI automation and voice agents for Worcester County businesses
              </Link>
              , or everything we automate on the
              {' '}
              <Link
                href="/ai-automation"
                className="text-bb-teal-soft underline underline-offset-4 transition-colors hover:text-bb-cream"
              >
                AI automation page
              </Link>
              .
            </p>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
