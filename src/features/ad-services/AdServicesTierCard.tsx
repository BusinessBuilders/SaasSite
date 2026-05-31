'use client';

import { useState } from 'react';

import type { AdServiceTierConfig } from '@/utils/AppConfig';

type Props = {
  config: AdServiceTierConfig;
  /** Description shown under the name. */
  pitch: string;
  /** Bullet list of what's included. */
  features: string[];
  /** Optional eyebrow above the name (e.g. "Tier One ✦ Picture Ads"). */
  eyebrow?: string;
  /** Locale forwarded to the create-checkout call. */
  locale?: 'en' | 'fr';
};

export const AdServicesTierCard = ({ config, pitch, features, eyebrow, locale }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productType: 'ad_service', tier: config.id, locale }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Checkout failed');
      }
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <article
      data-tier={config.id}
      data-featured={config.featured}
      className="flex flex-col gap-4 rounded-lg border border-border p-6"
    >
      {eyebrow ? <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</div> : null}
      <h3 className="text-2xl font-bold">{config.name}</h3>
      <p className="text-sm text-muted-foreground">{pitch}</p>
      <div className="my-2">
        <div className="text-4xl font-extrabold">
          $
          {config.price.toLocaleString()}
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{config.setupLabel}</div>
      </div>
      <button
        type="button"
        onClick={onBuy}
        disabled={loading}
        className={config.featured ? 'bb-btn bb-btn-primary w-full' : 'bb-btn bb-btn-ghost w-full'}
      >
        {loading ? 'Loading…' : config.featured ? `Pick ${config.name}` : 'Start Here'}
      </button>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <hr className="my-2 border-border" />
      <ul className="flex flex-col gap-2 text-sm">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden>◆</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
};
