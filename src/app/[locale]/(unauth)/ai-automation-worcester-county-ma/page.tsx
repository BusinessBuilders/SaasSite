import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

import { Reveal } from '@/components/motion/Reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { buildFaqJsonLd, CALENDLY_URL } from '@/features/ai/content';
import {
  AI_AUTOMATION_DEFINITION,
  AI_AUTOMATION_PATH,
  ATLAS_PATH,
  ATLAS_PHONE_DISPLAY,
  ATLAS_PHONE_TEL,
  AUTOMATIONS,
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
  HOME_TOWN,
  INDUSTRY_EXAMPLES,
  SERVICE_AREAS,
  VOICE_AGENT_SUMMARY,
  VOICE_AGENT_USES,
  WHY_IT_MATTERS,
  WORCESTER_COUNTY_DESCRIPTION,
  WORCESTER_COUNTY_FAQ,
  WORCESTER_COUNTY_H1,
  WORCESTER_COUNTY_INTRO,
  WORCESTER_COUNTY_PATH,
  WORCESTER_COUNTY_TITLE,
} from '@/features/ai/worcesterCounty';
import { Eyebrow } from '@/features/atlas/Eyebrow';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import { pageAlternates } from '@/utils/Seo';

// The local landing page for AI automation across Worcester County. It is
// the same offer as /ai-automation, written for the businesses around us and
// pointing at the live voice-agent demo on /atlas. All copy lives in
// src/features/ai/worcesterCounty.ts so the page and its JSON-LD stay in step.

const RIG_PHOTO = '/assets/images/gpu-rig-rutland-ma.jpg';
const RIG_PHOTO_ALT
  = 'Business Builder’s own multi-GPU server in Rutland, Massachusetts — the hardware that runs our private AI models and parts of the Atlas voice agent.';

export const metadata: Metadata = {
  title: WORCESTER_COUNTY_TITLE,
  description: WORCESTER_COUNTY_DESCRIPTION,
  // English-only page (the /fr twin shows the same copy) — both canonicalize here.
  alternates: pageAlternates(WORCESTER_COUNTY_PATH, 'en', { englishOnly: true }),
  robots: { index: true, follow: true },
  openGraph: {
    title: WORCESTER_COUNTY_TITLE,
    description: WORCESTER_COUNTY_DESCRIPTION,
    url: WORCESTER_COUNTY_PATH,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/assets/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Business Builder — AI automation for small businesses in Worcester County, Massachusetts',
      },
    ],
  },
};

type Props = { params: { locale: string } };

export default function AiAutomationWorcesterCountyPage({
  params: { locale },
}: Props) {
  unstable_setRequestLocale(locale);

  const otherTowns = SERVICE_AREAS.filter(town => town !== HOME_TOWN);

  return (
    <>
      {/* FAQPage JSON-LD — built from the same array the visible accordion renders */}
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(WORCESTER_COUNTY_FAQ)),
        }}
      />
      {/* Service JSON-LD — provider shares the site-wide organization @id */}
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildServiceJsonLd()),
        }}
      />
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildBreadcrumbJsonLd()),
        }}
      />
      <Navbar />
      <main>
        {/* Hero — split, left-aligned, with the service-area list beside it.
            Deliberately NOT wrapped in <Reveal>: the reveal hides content until
            GSAP runs, and Lighthouse measured the hero paragraph as the largest
            contentful paint at 4.5 s. Above the fold paints with the HTML. */}
        <section
          className="mx-auto max-w-6xl px-4 py-16 md:pt-24"
          aria-labelledby="wc-heading"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[7fr_5fr]">
            <div>
              <Eyebrow className="mb-4">Worcester County, Massachusetts</Eyebrow>
              <h1
                id="wc-heading"
                className="font-bb-display-2 text-4xl font-extrabold leading-tight text-bb-cream-bright md:text-6xl"
              >
                {WORCESTER_COUNTY_H1}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-bb-taupe">
                {WORCESTER_COUNTY_INTRO}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href={CALENDLY_URL} className="bb-btn bb-btn-primary">
                  Book a 15-Minute Call
                </a>
                <Link href={ATLAS_PATH} className="bb-btn bb-btn-ghost">
                  Try Our AI Voice Agent
                </Link>
              </div>
            </div>
            <aside
              id="service-areas"
              className="rounded-lg border p-6 md:p-8"
              style={{
                borderColor: 'var(--bb-border-hair)',
                background: 'var(--bb-bg-elevated)',
              }}
              aria-labelledby="wc-areas"
            >
              <Eyebrow>Service areas</Eyebrow>
              <h2
                id="wc-areas"
                className="mt-2 text-xl font-bold text-bb-cream"
              >
                Where we work
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-bb-taupe">
                {SERVICE_AREAS.map(town => (
                  <li key={town}>
                    {town === HOME_TOWN
                      ? (
                          <span className="text-bb-cream">
                            {town}
                            {' '}
                            <span className="text-xs text-bb-dust">(home base)</span>
                          </span>
                        )
                      : town}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-bb-dust">
                Service areas across Worcester County and Central
                Massachusetts. Our only office is in
                {' '}
                {HOME_TOWN}
                ; everywhere else we come to you or work remotely.
              </p>
            </aside>
          </div>
        </section>

        {/* Direct answer — citable definition */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <Reveal>
            <div className="rounded-lg border-l-4 border-bb-orange bg-bb-black-warm p-8 md:p-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-bb-orange">
                What is AI automation?
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-bb-cream">
                {AI_AUTOMATION_DEFINITION}
              </p>
              <p className="mt-4 text-sm text-bb-taupe">
                The full service — how we scope, build, and prove each system —
                is on the
                {' '}
                <Link
                  href={AI_AUTOMATION_PATH}
                  className="text-bb-orange underline underline-offset-4 transition-colors hover:text-bb-cream"
                >
                  AI Integration &amp; Automation page
                </Link>
                . This page is the local edition.
              </p>
            </div>
          </Reveal>
        </section>

        {/* What we automate — six jobs, hairline grid */}
        <section
          id="what-we-automate"
          className="mx-auto max-w-6xl px-4 py-16"
          aria-labelledby="wc-automate"
        >
          <Reveal>
            <Eyebrow className="mb-2 text-center">AI automation for local businesses</Eyebrow>
            <h2
              id="wc-automate"
              className="text-center text-3xl font-bold text-bb-cream md:text-4xl"
            >
              Six jobs we take off a local business’s plate.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-x-12 md:grid-cols-2">
            {AUTOMATIONS.map((item, i) => (
              <Reveal key={item.n} delay={(i % 2) * 0.05}>
                <article
                  className="border-t py-8"
                  style={{ borderColor: 'var(--bb-border-hair)' }}
                >
                  <div className="font-bb-display-2 text-3xl font-extrabold text-bb-orange">
                    {item.n}
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-bb-cream">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-bb-taupe">{item.body}</p>
                  <p className="mt-3 text-sm text-bb-dust">
                    <span className="font-bold uppercase tracking-wide">In practice: </span>
                    {item.example}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* AI voice agents / AI receptionists — the prominent section */}
        <section
          id="ai-voice-agents"
          className="mx-auto max-w-6xl px-4 py-12"
          aria-labelledby="wc-voice"
        >
          <Reveal>
            <div
              className="rounded-lg border-l-4 p-8 md:p-12"
              style={{
                borderColor: 'var(--bb-teal)',
                background: 'var(--bb-bg-elevated)',
              }}
            >
              <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-bb-teal-soft">
                    AI Voice Agents · AI Receptionists
                  </p>
                  <h2
                    id="wc-voice"
                    className="mt-3 text-3xl font-bold text-bb-cream-bright md:text-4xl"
                  >
                    An AI receptionist that answers your phone in Worcester County.
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-bb-cream">
                    {VOICE_AGENT_SUMMARY}
                  </p>
                  <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {VOICE_AGENT_USES.map(use => (
                      <li key={use.title}>
                        <h3 className="font-bold text-bb-cream">{use.title}</h3>
                        <p className="mt-1 text-sm text-bb-taupe">{use.body}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link href={ATLAS_PATH} className="bb-btn bb-btn-primary">
                      Talk to Our AI Voice Agent Demo
                    </Link>
                    <a
                      href={`tel:${ATLAS_PHONE_TEL}`}
                      className="text-sm text-bb-taupe underline underline-offset-4 transition-colors hover:text-bb-cream"
                    >
                      {`or call the live line ${ATLAS_PHONE_DISPLAY}`}
                    </a>
                  </div>
                  <p className="mt-3 text-xs text-bb-dust">
                    Atlas tells every caller it is an AI. The demo answers as a
                    sample landscaper, plumber, or bakery — or as your own
                    business, from what you tell it.
                  </p>
                </div>
                <figure className="lg:mt-2">
                  <Image
                    src={RIG_PHOTO}
                    alt={RIG_PHOTO_ALT}
                    width={1126}
                    height={768}
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="w-full rounded-lg"
                  />
                  <figcaption className="mt-3 text-xs leading-relaxed text-bb-dust">
                    Our own GPU hardware in Massachusetts. Speech recognition
                    and Atlas’s voice run here; the same machines run private AI
                    for businesses that cannot send data to a public cloud.
                  </figcaption>
                </figure>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Why it matters — third-party numbers, each linked to its source */}
        <section
          id="why-it-matters"
          className="mx-auto max-w-3xl px-4 py-16"
          aria-labelledby="wc-evidence"
        >
          <Reveal>
            <Eyebrow className="mb-2">Why it matters</Eyebrow>
            <h2 id="wc-evidence" className="text-3xl font-bold text-bb-cream">
              The calls you miss are the numbers that matter.
            </h2>
            <p className="mt-3 text-bb-taupe">
              Not our numbers. Each one links to the study it came from.
            </p>
          </Reveal>
          {/* One reveal around the whole list: a wrapper per item would put a
              <div> between the <ul> and its <li>, which fails the list audit. */}
          <Reveal>
            <ul className="mt-8 divide-y divide-[color:var(--bb-border-hair)]">
              {WHY_IT_MATTERS.map(item => (
                <li key={item.url} className="py-6">
                  <p className="text-lg font-bold text-bb-cream">{item.stat}</p>
                  <p className="mt-2 text-bb-taupe">{item.detail}</p>
                  <p className="mt-2 text-xs text-bb-dust">
                    Source:
                    {' '}
                    <a
                      href={item.url}
                      rel="noopener"
                      className="underline underline-offset-4 transition-colors hover:text-bb-cream"
                    >
                      {`${item.source} (${item.year})`}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* Local business examples — illustrations, not clients */}
        <section
          id="industries"
          className="mx-auto max-w-6xl px-4 py-16"
          aria-labelledby="wc-industries"
        >
          <Reveal>
            <Eyebrow className="mb-2 text-center">Who it is for</Eyebrow>
            <h2
              id="wc-industries"
              className="text-center text-3xl font-bold text-bb-cream md:text-4xl"
            >
              Built for the businesses that run Central Massachusetts.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-bb-taupe">
              What a first automation usually looks like, trade by trade. These
              are examples of what we set up, not a client list.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-x-12 md:grid-cols-2">
            {INDUSTRY_EXAMPLES.map((item, i) => (
              <Reveal key={item.industry} delay={(i % 2) * 0.05}>
                <article
                  className="border-t py-6"
                  style={{ borderColor: 'var(--bb-border-hair)' }}
                >
                  <h3 className="text-lg font-bold text-bb-cream">
                    {item.industry}
                  </h3>
                  <p className="mt-1 text-bb-taupe">{item.example}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Service areas — prose, pointing back at the list in the hero */}
        <section className="mx-auto max-w-3xl px-4 py-12" aria-labelledby="wc-local">
          <Reveal>
            <Eyebrow className="mb-2">Central Massachusetts</Eyebrow>
            <h2 id="wc-local" className="text-3xl font-bold text-bb-cream">
              Based in
              {' '}
              {HOME_TOWN}
              . Working across Worcester County.
            </h2>
            <p className="mt-4 text-bb-taupe">
              We are a family-owned Massachusetts company with one office, in
              {' '}
              {HOME_TOWN}
              . From there we serve small businesses across Worcester County
              and Central Massachusetts — from
              {' '}
              {otherTowns[0]}
              {' '}
              and the towns around it out to
              {' '}
              {otherTowns.at(-3)}
              ,
              {' '}
              {otherTowns.at(-2)}
              , and
              {' '}
              {otherTowns.at(-1)}
              {' '}
              (the full list is
              {' '}
              <a
                href="#service-areas"
                className="text-bb-orange underline underline-offset-4 transition-colors hover:text-bb-cream"
              >
                above
              </a>
              ). On-site when a walk through your shop is the fastest way to
              understand the job; remote when it is not. Either way, the phone
              number on this site rings a person in Worcester County.
            </p>
            <p className="mt-4 text-bb-taupe">
              Want to talk it through first? Use the
              {' '}
              <Link
                href="/contact"
                className="text-bb-orange underline underline-offset-4 transition-colors hover:text-bb-cream"
              >
                contact page
              </Link>
              {' '}
              or book a call below.
            </p>
          </Reveal>
        </section>

        {/* Pricing — the same discovery sprint every engagement starts with */}
        <section id="pricing" className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="rounded-lg border-2 border-bb-orange bg-bb-black-warm p-8 text-center shadow-bb-card md:p-12">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bb-orange">
                Every Engagement Starts Here
              </div>
              <div className="font-bb-display-2 text-5xl font-extrabold text-bb-cream-bright md:text-6xl">
                $1,500
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-bb-taupe">
                Discovery Sprint
              </div>
              <p className="mx-auto mt-6 max-w-xl text-bb-taupe">
                We pick one workflow, look at your real data, and define — with
                you, in plain English — the test the finished system has to
                pass. You leave with a fixed quote and a timeline. No build
                starts before you have both.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-sm text-bb-dust">
                Can’t send your data to a public AI cloud?
                {' '}
                <Link
                  href="/private-ai"
                  className="text-bb-gold underline underline-offset-4 transition-colors hover:text-bb-cream"
                >
                  Private AI
                </Link>
                {' '}
                runs the same automation on hardware we control.
              </p>
              <a
                href={CALENDLY_URL}
                className="bb-btn bb-btn-primary mt-8 inline-block"
              >
                Book a 15-Minute Call
              </a>
            </div>
          </Reveal>
        </section>

        {/* FAQ — same data as the JSON-LD above */}
        <section
          id="faq"
          className="mx-auto max-w-3xl px-4 py-16"
          aria-labelledby="wc-faq"
        >
          <Reveal>
            <Eyebrow className="mb-2 text-center">Questions</Eyebrow>
            <h2
              id="wc-faq"
              className="text-center text-3xl font-bold text-bb-cream"
            >
              AI automation in Worcester County, asked and answered.
            </h2>
          </Reveal>
          <Accordion type="multiple" className="mt-8 w-full">
            {WORCESTER_COUNTY_FAQ.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index + 1}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold text-bb-cream">
              Fifteen minutes. Bring the call you keep missing.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-bb-taupe">
              We’ll tell you on the call whether it is a fit for automation —
              and if it is not, we’ll say that too.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href={CALENDLY_URL} className="bb-btn bb-btn-primary">
                Book the Call
              </a>
              <Link href={ATLAS_PATH} className="bb-btn bb-btn-ghost">
                Try Our AI Voice Agent
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
