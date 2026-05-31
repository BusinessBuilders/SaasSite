import { unstable_setRequestLocale } from 'next-intl/server';
import Stripe from 'stripe';

import { Env } from '@/libs/Env';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

type Props = {
  params: { locale: string };
  searchParams: { ref?: string };
};

export default async function AdServicesWelcomePage({ params: { locale }, searchParams }: Props) {
  unstable_setRequestLocale(locale);

  let confirmed = false;
  let tier: string | null = null;
  if (searchParams.ref) {
    try {
      const session = await stripe.checkout.sessions.retrieve(searchParams.ref);
      confirmed = session.payment_status === 'paid' && session.metadata?.productType === 'ad_service';
      tier = (session.metadata?.tier as string) ?? null;
    } catch {
      confirmed = false;
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      {confirmed
        ? (
            <>
              <h1 className="text-4xl font-extrabold">Thanks — we got it.</h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Your
                {' '}
                {tier ? <span className="font-semibold">{tier}</span> : ''}
                {' '}
                package is paid and we're on it.
                Donovan will reach out within one business day to kick off the engagement.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Questions in the meantime?
                {' '}
                <a className="underline" href="mailto:donovan@business-builder.online">donovan@business-builder.online</a>
              </p>
            </>
          )
        : (
            <>
              <h1 className="text-3xl font-bold">Order not found.</h1>
              <p className="mt-4 text-muted-foreground">
                We couldn't confirm a recent purchase from this link. If you just paid and you're seeing this,
                check your email for a Stripe receipt and forward it to
                {' '}
                <a className="underline" href="mailto:donovan@business-builder.online">donovan@business-builder.online</a>
                .
              </p>
              <a className="mt-8 inline-block rounded-md border border-border px-6 py-3 font-semibold" href={`/${locale}/ad-services`}>
                Back to Ad Services
              </a>
            </>
          )}
    </main>
  );
}
