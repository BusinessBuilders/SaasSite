import type { AdServiceTierConfig } from '@/utils/AppConfig';

// Centralized so we can swap to Stripe Checkout later by changing one line.
// For launch we route every tier CTA to Calendly — high-ticket ad services
// convert better with a conversation than a one-click checkout, and this
// also unblocks shipping before the production Stripe price IDs exist.
const CALENDLY_URL = 'https://calendly.com/donovan-business-builder/15minute';

type Props = {
  config: AdServiceTierConfig;
  /** Description shown under the name. */
  pitch: string;
  /** Bullet list of what's included. */
  features: string[];
  /** Optional eyebrow above the name (e.g. "Tier One ✦ Picture Ads"). */
  eyebrow?: string;
};

export const AdServicesTierCard = ({ config, pitch, features, eyebrow }: Props) => {
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
      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={config.featured ? 'bb-btn bb-btn-primary w-full' : 'bb-btn bb-btn-ghost w-full'}
      >
        {config.featured ? `Book a Call — ${config.name}` : 'Book a Call'}
      </a>
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
