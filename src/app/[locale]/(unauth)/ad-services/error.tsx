'use client';

import { useEffect } from 'react';

export default function AdServicesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[ad-services]', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Something went sideways.</h1>
      <p className="mt-4 text-muted-foreground">
        We hit an unexpected error loading this page. Try again, or email
        {' '}
        <a className="underline" href="mailto:donovan@business-builder.online">donovan@business-builder.online</a>
        .
      </p>
      <button onClick={reset} className="mt-6 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground">
        Try again
      </button>
    </main>
  );
}
