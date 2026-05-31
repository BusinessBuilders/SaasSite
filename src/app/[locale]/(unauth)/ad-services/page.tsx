import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

import { AdServicesTierCard } from '@/features/ad-services/AdServicesTierCard';
import { AD_SERVICE_TIER, AdServicesTierList } from '@/utils/AppConfig';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Targeted Ads — Custom-Built for Your Business | Business Builders',
  description: 'Done-for-you ad services. We design, run, and optimize ads that bring real customers through the door. Three tiers from $899.',
  openGraph: {
    title: 'Targeted Ads — Custom-Built for Your Business',
    description: 'We design, run, and optimize ads that bring real customers through the door.',
    images: ['/assets/images/og-ad-services.jpg'],
  },
};

type Props = { params: { locale: string } };

export default function AdServicesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const loc = (locale === 'fr' ? 'fr' : 'en') as 'en' | 'fr';

  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-24 text-center">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
          Targeted Ads ✦ Custom-Built For You
        </div>
        <h1 className="text-5xl font-extrabold leading-tight">
          We build ads that
          {' '}
          <em>actually work.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          You run your business. We run your ads. We design them, test them, and fix them until they bring people through the door. No jargon, no dashboards you'll never read — just more customers.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#pricing" className="rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground">See the Numbers</a>
          <a href="#how" className="rounded-md border border-border px-6 py-3 font-semibold">How It Works</a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary">✺ Let's Be Honest ✺</div>
        <h2 className="text-center text-3xl font-bold">Ads are a pain to get right.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            'You boost a post, burn $200, and get three likes from people in another country.',
            'You try to set up a campaign yourself and the dashboard looks like a cockpit.',
            'You hire a "guru" who sends you reports full of impressions but no actual customers.',
          ].map((line, i) => (
            <div key={i} className="rounded-lg border border-border p-6">
              <div className="mb-3 text-primary">///</div>
              <p>{line}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl text-center font-bold text-primary">
          We do it differently. We build ads that bring in real people who want to buy what you sell.
        </p>
      </section>

      <section id="how" className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary">✦ The Process ✦</div>
        <h2 className="text-center text-3xl font-bold">Here's How It Works.</h2>
        <ol className="mt-12 flex flex-col gap-10">
          {[
            { n: '01', t: 'We Design 3–4 Ads', d: 'Different angles, different hooks, different visuals. We don\'t guess which one will work — we test all of them.' },
            { n: '02', t: 'We Run Them and Watch', d: 'Your budget goes toward real ad spend. We watch the numbers daily, kill what doesn\'t work, and put more behind what does.' },
            { n: '03', t: 'We Optimize Until It Hits', d: 'If the first batch doesn\'t produce, we redesign. New creative, new angles, new targeting. We keep going until at least one ad is working.' },
          ].map(step => (
            <li key={step.n} className="flex gap-6">
              <div className="text-4xl font-extrabold text-primary">{step.n}</div>
              <div>
                <h3 className="text-xl font-bold">{step.t}</h3>
                <p className="mt-2 text-muted-foreground">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary">✺ Targeted Ad Packages ✺</div>
        <h2 className="text-center text-3xl font-bold">Three Tiers. Pick Your Level.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Every ad is custom-designed and targeted specifically to your audience. Setup gets the ads built and live. Ad spend is separate — we start low, find what works, then scale up when you're ready.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <AdServicesTierCard
            config={AdServicesTierList[AD_SERVICE_TIER.STATIC]}
            eyebrow="Tier One ✦ Picture Ads"
            pitch="Clean, bold image ads designed from scratch. Best way to prove ads work for your business without a big commitment."
            features={[
              '3–4 custom image ad designs',
              'Full campaign build & targeting',
              'Pixel & conversion tracking',
              'Audience research for your area',
              'Ad copy written in your voice',
              'A/B testing across variations',
              'Redesign if ads underperform',
            ]}
            locale={loc}
          />
          <AdServicesTierCard
            config={AdServicesTierList[AD_SERVICE_TIER.COMBO]}
            eyebrow="Tier Two ✦ Picture + Video"
            pitch="You get static image ads AND video ads — we test both formats against each other to find your winner fastest."
            features={[
              '2–3 video ad creatives added',
              'Professional editing & motion',
              'Vertical + horizontal formats',
              'Image vs. video split testing',
              'Retargeting campaigns included',
              'Weekly performance reports',
              'Redesign both formats if needed',
            ]}
            locale={loc}
          />
          <AdServicesTierCard
            config={AdServicesTierList[AD_SERVICE_TIER.MOTION]}
            eyebrow="Tier Three ✦ All Video"
            pitch="Full video production. We shoot, edit, or animate 3-4 video ads targeted at your exact customers. The premium play."
            features={[
              '3–4 custom video ad creatives',
              'Professional editing & motion graphics',
              'Reels, Stories, Feed formats',
              'Full campaign build & targeting',
              'Retargeting & lookalike audiences',
              'Daily monitoring & optimization',
              'Priority redesign if ads underperform',
              'You own all footage & edits',
            ]}
            locale={loc}
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">✦ Our Guarantee ✦</div>
        <h2 className="text-3xl font-bold">If the ads don't produce, we redesign until they do.</h2>
        <p className="mt-6 text-muted-foreground">
          Not every ad hits on the first try. If your initial batch isn't bringing in leads, we go back to the drawing board — new creative, new angles, new copy — at no extra design cost. Once you've got a winner, you own it. Rerun it whenever you want.
        </p>
      </section>
    </main>
  );
}
