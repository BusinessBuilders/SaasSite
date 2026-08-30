import type { ReactNode } from 'react';

import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';

// Shared shell + section primitives for the legal pages (privacy, terms) so
// they read as part of the sign-painter brand instead of unstyled text.

export const LegalShell = (props: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) => (
  <>
    <Navbar />
    <main className="container mx-auto max-w-3xl px-4 pb-20 pt-10">
      <header className="text-center">
        <p className="bb-eyebrow">{props.eyebrow}</p>
        <h1 className="bb-h1 mt-3 text-bb-cream">{props.title}</h1>
        <p className="mt-4 inline-block rounded-full border border-bb-umber px-4 py-1 text-sm text-bb-taupe">
          Effective
          {' '}
          {props.effectiveDate}
        </p>
        <hr className="bb-rule-double mt-8" />
      </header>
      <div className="mt-10 space-y-10">{props.children}</div>
    </main>
    <Footer />
  </>
);

export const LegalSection = (props: {
  number: string;
  title: string;
  children: ReactNode;
}) => (
  <section>
    <h2 className="bb-h3 flex items-baseline gap-3 text-bb-cream">
      <span className="font-mono text-base font-bold text-bb-orange">
        {props.number}
      </span>
      {props.title}
    </h2>
    <div className="mt-3 space-y-3 leading-relaxed text-bb-taupe [&_a:hover]:text-bb-orange [&_a]:text-bb-cream [&_a]:underline [&_a]:transition-colors [&_h3]:mt-5 [&_h3]:font-bold [&_h3]:text-bb-cream [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-bb-cream [&_ul]:space-y-1">
      {props.children}
    </div>
  </section>
);

// Highlighted card for clauses that must be impossible to miss — used for the
// carrier-required SMS non-sharing language.
export const LegalCallout = (props: { children: ReactNode }) => (
  <div className="border-bb-orange/70 rounded-lg border-2 bg-bb-black-soft p-5 leading-relaxed text-bb-cream shadow-[4px_4px_0_0_var(--bb-orange-deep)]">
    {props.children}
  </div>
);

export const LegalContactCard = () => (
  <address className="rounded-lg border border-bb-umber bg-bb-black-soft p-5 not-italic leading-relaxed text-bb-taupe">
    <p className="font-bold text-bb-cream">
      Donovan Farms Inc., d/b/a Business Builder
    </p>
    <p>2 Beverly Hills Dr., Rutland, MA 01543</p>
    <p>
      Phone:
      {' '}
      <a
        href="tel:+19787901002"
        className="text-bb-cream underline transition-colors hover:text-bb-orange"
      >
        978-790-1002
      </a>
    </p>
    <p>
      Email:
      {' '}
      <a
        href="mailto:donovan@business-builder.online"
        className="text-bb-cream underline transition-colors hover:text-bb-orange"
      >
        donovan@business-builder.online
      </a>
    </p>
  </address>
);
