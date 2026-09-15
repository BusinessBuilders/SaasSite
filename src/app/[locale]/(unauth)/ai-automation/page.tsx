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
import { AutomationShowcase } from '@/features/ai/AutomationShowcase';
import {
  AI_AUTOMATION_BUILDS,
  AI_AUTOMATION_DESCRIPTION,
  AI_AUTOMATION_FAQ,
  AI_AUTOMATION_PROCESS,
  AI_AUTOMATION_STRAIGHT_ANSWERS,
  AI_AUTOMATION_TITLE,
  buildFaqJsonLd,
  CALENDLY_URL,
} from '@/features/ai/content';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import { buildBreadcrumbJsonLd, pageAlternates } from '@/utils/Seo';

export const metadata: Metadata = {
  title: AI_AUTOMATION_TITLE,
  description: AI_AUTOMATION_DESCRIPTION,
  // English-only page (the /fr twin shows the same copy) — both canonicalize here.
  alternates: pageAlternates('/ai-automation', 'en', { englishOnly: true }),
  openGraph: {
    title: AI_AUTOMATION_TITLE,
    description: AI_AUTOMATION_DESCRIPTION,
    images: ['/assets/images/og-image.jpg'],
  },
};

type Props = { params: { locale: string } };

export default function AiAutomationPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  return (
    <>
      {/* FAQPage JSON-LD — built from the same array the visible accordion renders */}
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(AI_AUTOMATION_FAQ)),
        }}
      />
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([{ name: 'AI Automation', path: '/ai-automation' }]),
          ),
        }}
      />
      <Navbar />
      <main>
        {/* Hero — split, left-aligned */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[7fr_5fr]">
            <div>
              <Reveal>
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-bb-orange">
                  AI Integration & Automation ✦ Done Right
                </div>
                <h1 className="font-bb-display-2 text-4xl font-extrabold leading-tight text-bb-cream-bright md:text-6xl">
                  Put AI to work
                  {' '}
                  <em className="not-italic text-bb-orange">inside</em>
                  {' '}
                  your
                  business.
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-lg text-bb-taupe">
                  A chatbot that answers from your actual documents. Paperwork
                  that processes itself. Intake that qualifies leads at 2 a.m.
                  Built into the systems you already run — by the same shop that
                  builds and hosts your website.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a href={CALENDLY_URL} className="bb-btn bb-btn-primary">
                    Book a 15-Minute Call
                  </a>
                  <a href="#how-we-work" className="bb-btn bb-btn-ghost">
                    How We Work
                  </a>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.15}>
              <AutomationShowcase />
            </Reveal>
          </div>
        </section>

        {/* Direct answer — citable definition */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <Reveal>
            <div className="rounded-lg border-l-4 border-bb-orange bg-bb-black-warm p-8 md:p-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-bb-orange">
                What is AI integration?
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-bb-cream">
                AI integration means connecting AI to the systems your business
                already runs — your website, your inbox, your documents, your
                customer intake — so it does a specific job with your real
                information. Not another app to log into. Not a demo. A worker
                wired into the shop.
              </p>
            </div>
          </Reveal>
        </section>

        {/* What we build — zigzag rows, not equal cards */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-bb-orange">
              ✺ What We Build ✺
            </div>
            <h2 className="text-center text-3xl font-bold text-bb-cream md:text-4xl">
              Three jobs AI can take off your plate.
            </h2>
          </Reveal>
          <div className="mt-14 flex flex-col gap-14">
            {AI_AUTOMATION_BUILDS.map((build, i) => (
              <Reveal key={build.n}>
                <div
                  className={`grid items-center gap-6 md:grid-cols-[1fr_2fr] ${
                    i % 2 === 1 ? 'md:[direction:rtl]' : ''
                  }`}
                >
                  <div className="font-bb-display-2 text-7xl font-extrabold text-bb-umber-soft [direction:ltr] md:text-8xl">
                    {build.n}
                  </div>
                  <div className="[direction:ltr]">
                    <h3 className="text-2xl font-bold text-bb-cream">
                      {build.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-bb-taupe">{build.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How we work */}
        <section id="how-we-work" className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-bb-orange">
              ✦ How We Work ✦
            </div>
            <h2 className="text-center text-3xl font-bold text-bb-cream md:text-4xl">
              No mystery. No jargon. A test you set.
            </h2>
          </Reveal>
          <ol className="mt-12 flex flex-col gap-10">
            {AI_AUTOMATION_PROCESS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.05}>
                <li className="flex gap-6">
                  <div className="font-bb-display-2 text-4xl font-extrabold text-bb-orange">
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

        {/* Straight answers — hairline-divided, no cards */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bb-orange">
              /// Straight Answers
            </div>
            <h2 className="text-3xl font-bold text-bb-cream">
              The things other vendors won’t say out loud.
            </h2>
          </Reveal>
          <div className="mt-8 divide-y divide-[color:var(--bb-border-hair)]">
            {AI_AUTOMATION_STRAIGHT_ANSWERS.map(item => (
              <Reveal key={item.title}>
                <div className="py-7">
                  <h3 className="text-lg font-bold text-bb-cream">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-bb-taupe">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Voice agent demo + the local page — two doors out of this page */}
        <section
          className="mx-auto max-w-6xl px-4 py-12"
          aria-labelledby="ai-voice-agent"
        >
          <Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              <div
                className="rounded-lg border-l-4 p-8"
                style={{
                  borderColor: 'var(--bb-teal)',
                  background: 'var(--bb-bg-elevated)',
                }}
              >
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bb-teal-soft">
                  ✦ AI Voice Agent ✦
                </div>
                <h2
                  id="ai-voice-agent"
                  className="text-2xl font-bold text-bb-cream-bright"
                >
                  Hear an AI receptionist answer for your business.
                </h2>
                <p className="mt-3 text-bb-taupe">
                  Atlas answers the call, says it is an AI, answers common
                  questions, takes the caller’s name and number, and sends you
                  the conversation. Try it out loud, in your browser, right now.
                </p>
                <Link
                  href="/atlas"
                  className="bb-btn bb-btn-ghost mt-6 inline-block"
                >
                  Talk to Our AI Voice Agent Demo
                </Link>
              </div>
              <div className="rounded-lg border-l-4 border-bb-orange bg-bb-black-warm p-8">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bb-orange">
                  ✦ Central Massachusetts ✦
                </div>
                <h2 className="text-2xl font-bold text-bb-cream-bright">
                  Based in Rutland. Working across Worcester County.
                </h2>
                <p className="mt-3 text-bb-taupe">
                  Contractors, landscapers, shops, and offices from Worcester
                  out to Westborough: what we automate for local businesses,
                  where we work, and what it costs.
                </p>
                <Link
                  href="/ai-automation-worcester-county-ma"
                  className="bb-btn bb-btn-ghost mt-6 inline-block"
                >
                  AI Automation in Worcester County
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Private AI teaser — gold, premium */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <Reveal>
            <div className="rounded-lg border-2 border-bb-gold bg-bb-black-warm p-8 md:flex md:items-center md:justify-between md:gap-8 md:p-10">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bb-gold">
                  ✦ Private AI ✦
                </div>
                <h2 className="text-2xl font-bold text-bb-cream-bright md:text-3xl">
                  Can’t send your data to OpenAI?
                </h2>
                <p className="mt-3 max-w-xl text-bb-taupe">
                  Medical, legal, financial, trade secrets — we run the same
                  automation on private AI endpoints, on hardware we control.
                  Your data never leaves the environment you approve.
                </p>
              </div>
              <Link
                href="/private-ai"
                className="bb-btn bb-btn-ghost mt-6 shrink-0 md:mt-0"
              >
                See Private AI
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Pricing — discovery sprint */}
        <section className="mx-auto max-w-3xl px-4 py-16">
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
        <section className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-bb-orange">
              ✦ Questions ✦
            </div>
            <h2 className="text-center text-3xl font-bold text-bb-cream">
              Asked and answered.
            </h2>
          </Reveal>
          <Accordion type="multiple" className="mt-8 w-full">
            {AI_AUTOMATION_FAQ.map((faq, index) => (
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
              Fifteen minutes. Bring the workflow that eats your week.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-bb-taupe">
              We’ll tell you on the call whether it is a fit for automation —
              and if it is not, we’ll say that too.
            </p>
            <a
              href={CALENDLY_URL}
              className="bb-btn bb-btn-primary mt-8 inline-block"
            >
              Book the Call
            </a>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
