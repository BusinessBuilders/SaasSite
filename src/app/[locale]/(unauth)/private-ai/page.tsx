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
import {
  buildFaqJsonLd,
  CALENDLY_URL,
  PRIVATE_AI_FAQ,
} from '@/features/ai/content';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import { pageAlternates } from '@/utils/Seo';

const pageTitle
  = 'Private AI on Hardware You Control | Business Builder';
const pageDescription
  = 'AI automation for businesses that can\'t send their data to OpenAI. Private endpoints on hardware we control, monitored around the clock. From $3,500/month.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  // English-only page (the /fr twin shows the same copy) — both canonicalize here.
  alternates: pageAlternates('/private-ai', 'en', { englishOnly: true }),
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    images: ['/assets/images/og-image.jpg'],
  },
};

const WHO_FOR = [
  {
    field: 'Medical & dental practices',
    reason:
      'Patient records and privacy obligations don\'t mix with public AI clouds.',
  },
  {
    field: 'Law firms',
    reason: 'Case files and privileged communications stay privileged.',
  },
  {
    field: 'Accounting & finance',
    reason: 'Client financials never become someone else\'s training data.',
  },
  {
    field: 'Manufacturers & builders',
    reason:
      'Trade secrets, bids, and contracts that forbid third-party processing.',
  },
];

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Your own AI endpoint',
    body: 'A capable AI model running on hardware we control — not a shared public service. Your tools talk to it exactly the way they would talk to ChatGPT. The difference is where it lives, and who can see it: you, and nobody else.',
  },
  {
    n: '02',
    title: 'A locked connection',
    body: 'The endpoint is never exposed to the open internet. Access runs over a private, encrypted link with keys — your systems in, everyone else out.',
  },
  {
    n: '03',
    title: 'Watched around the clock',
    body: 'Health checks and alerts are part of the build, not an add-on. If anything stops, a human gets paged. It never fails silently.',
  },
  {
    n: '04',
    title: 'Sized to the job',
    body: 'We fit the smallest model that passes your acceptance test — so you are not paying for capacity you will never use.',
  },
];

type Props = { params: { locale: string } };

export default function PrivateAiPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  return (
    <>
      {/* FAQPage JSON-LD — built from the same array the visible accordion renders */}
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(PRIVATE_AI_FAQ)),
        }}
      />
      <Navbar />
      <main>
        {/* Hero — split, gold-accented premium */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[7fr_5fr]">
            <div>
              <Reveal>
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-bb-gold">
                  ✦ Private AI Inference ✦
                </div>
                <h1 className="font-bb-display-2 text-4xl font-extrabold leading-tight text-bb-cream-bright md:text-5xl lg:text-6xl">
                  AI automation for businesses that
                  {' '}
                  <em className="not-italic text-bb-gold">can’t</em>
                  {' '}
                  send their
                  data to OpenAI.
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-lg text-bb-taupe">
                  Some data can’t go to someone else’s cloud — patient records,
                  case files, client financials, trade secrets. We build the
                  same AI automation on private endpoints, running on hardware
                  we control. The work gets done. The data stays home.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a href={CALENDLY_URL} className="bb-btn bb-btn-primary">
                    Book a 15-Minute Call
                  </a>
                  <a href="#how-it-works" className="bb-btn bb-btn-ghost">
                    How It Works
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Schematic — where the data lives */}
            <Reveal delay={0.15}>
              <div className="rounded-lg border-2 border-bb-gold bg-bb-black-soft p-6">
                <div className="mb-4 flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bb-dust">
                  <span>/// Your four walls</span>
                  <span className="flex items-center gap-2 text-bb-cream">
                    <span
                      className="size-2 animate-pulse rounded-full bg-bb-gold motion-reduce:animate-none"
                      aria-hidden
                    />
                    Private · Monitored
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    'Your documents & records',
                    'Private AI endpoint',
                    'Answers for your team',
                  ].map((label, i) => (
                    <div key={label}>
                      <div className="rounded-md border border-[color:var(--bb-border-hair)] bg-bb-black-warm p-3 text-center text-sm font-semibold text-bb-cream">
                        {label}
                      </div>
                      {i < 2 && (
                        <div
                          className="py-1 text-center text-bb-gold"
                          aria-hidden
                        >
                          ↓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <hr className="my-5 border-dashed border-[color:var(--bb-border-soft)]" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-bb-dust line-through">
                    Someone else’s cloud
                  </span>
                  <span className="bb-tag-gold rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
                    Nothing leaves
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Who this is for — hairline rows */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bb-gold">
              /// Who This Is For
            </div>
            <h2 className="text-3xl font-bold text-bb-cream">
              If a leak would cost you more than the software.
            </h2>
          </Reveal>
          <div className="mt-8 divide-y divide-[color:var(--bb-border-hair)]">
            {WHO_FOR.map(item => (
              <Reveal key={item.field}>
                <div className="grid gap-1 py-6 md:grid-cols-[1fr_2fr] md:gap-6">
                  <h3 className="text-lg font-bold text-bb-cream">
                    {item.field}
                  </h3>
                  <p className="text-bb-taupe">{item.reason}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-bb-gold">
              ✦ How It Works ✦
            </div>
            <h2 className="text-center text-3xl font-bold text-bb-cream md:text-4xl">
              Private doesn’t mean complicated.
            </h2>
          </Reveal>
          <ol className="mt-12 flex flex-col gap-10">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.05}>
                <li className="flex gap-6">
                  <div className="font-bb-display-2 text-4xl font-extrabold text-bb-gold">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-bb-cream">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-bb-taupe">{step.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Proof standard */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <Reveal>
            <div className="rounded-lg border-l-4 border-bb-gold bg-bb-black-warm p-8 md:p-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-bb-gold">
                The Same Proof Standard
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-bb-cream">
                Before you rely on it, you watch it pass: 20 to 50 of your real
                cases, against a target you set, run live in front of you.
                Private doesn’t mean “trust us.” It means we prove it inside
                your walls.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Pricing anchor */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="rounded-lg border-2 border-bb-gold bg-bb-black-warm p-8 text-center md:p-12">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bb-gold">
                Engagements
              </div>
              <div className="font-bb-display-2 text-4xl font-extrabold text-bb-cream-bright md:text-6xl">
                Start at $3,500
                <span className="text-2xl text-bb-taupe md:text-3xl">
                  /month
                </span>
              </div>
              <p className="mx-auto mt-6 max-w-xl text-bb-taupe">
                That covers your private endpoint, round-the-clock monitoring,
                and the automation built on top of it. Exact scope is quoted in
                plain English after a 15-minute call.
              </p>
              <a
                href={CALENDLY_URL}
                className="bb-btn bb-btn-primary mt-8 inline-block"
              >
                Book the Call
              </a>
              <p className="mt-6 text-sm text-bb-dust">
                Not privacy-bound?
                {' '}
                <Link
                  href="/ai-automation"
                  className="text-bb-teal-soft underline underline-offset-4"
                >
                  Standard AI integration starts much smaller.
                </Link>
              </p>
            </div>
          </Reveal>
        </section>

        {/* FAQ — same data as the JSON-LD above */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-bb-gold">
              ✦ Questions ✦
            </div>
            <h2 className="text-center text-3xl font-bold text-bb-cream">
              The honest answers.
            </h2>
          </Reveal>
          <Accordion type="multiple" className="mt-8 w-full">
            {PRIVATE_AI_FAQ.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index + 1}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <Footer />
    </>
  );
}
