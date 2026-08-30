import { unstable_setRequestLocale } from 'next-intl/server';

import { SmsOptInForm } from '@/features/contact/SmsOptInForm';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import { pageAlternates } from '@/utils/Seo';

// English-only page: the /fr twin shows the same copy, so both canonicalize here.
export const metadata = {
  alternates: pageAlternates('/contact', 'en', { englishOnly: true }),
  title: 'Contact Us | Business Builder',
  description:
    'Get in touch with Business Builder — websites, hosting, and AI automation for small business. Call, email, or send us a message and opt in for text follow-up.',
};

export default function ContactPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold text-bb-cream">Talk to us.</h1>
        <p className="mt-3 max-w-2xl text-lg text-bb-taupe">
          Tell us what you&apos;re trying to get off your plate — a website,
          your social media, paperwork, customer intake. We&apos;ll tell you
          straight what we&apos;d build and what it costs.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_260px]">
          <SmsOptInForm />

          <aside className="space-y-6 text-sm">
            <div>
              <h2 className="font-bold uppercase tracking-wide text-bb-dust">
                Who we are
              </h2>
              <p className="mt-2 leading-relaxed text-bb-taupe">
                Business Builder is a DBA of
                {' '}
                <strong className="text-bb-cream">Donovan Farms Inc.</strong>
                {' '}
                —
                a family-owned Massachusetts company building websites, hosting,
                and AI automation for small businesses since 2016.
              </p>
            </div>
            <div>
              <h2 className="font-bold uppercase tracking-wide text-bb-dust">
                Reach us
              </h2>
              <ul className="mt-2 space-y-1 leading-relaxed text-bb-taupe">
                <li>
                  <a href="tel:+19787901002" className="hover:text-bb-cream">
                    978-790-1002
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:donovan@business-builder.online"
                    className="hover:text-bb-cream"
                  >
                    donovan@business-builder.online
                  </a>
                </li>
                <li>2 Beverly Hills Dr., Rutland, MA 01543</li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold uppercase tracking-wide text-bb-dust">
                Texting program
              </h2>
              <p className="mt-2 leading-relaxed text-bb-taupe">
                If you opt in, our texts come from (508) 886-3046. Reply STOP
                any time to unsubscribe, or HELP for assistance. Message and
                data rates may apply.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
