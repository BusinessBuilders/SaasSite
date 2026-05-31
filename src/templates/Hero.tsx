import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const Hero = () => {
  const t = useTranslations('Hero');

  return (
    <Section className="py-24 md:py-36">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-bb-orange">
          {t('eyebrow')}
        </div>
        <h1 className="font-bb-display-2 text-5xl font-extrabold leading-tight text-bb-cream-bright md:text-7xl">
          {t.rich('title', { em: chunks => <em className="not-italic text-bb-orange">{chunks}</em> })}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-bb-taupe md:text-xl">
          {t('description')}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/pricing" className="bb-btn bb-btn-primary">
            {t('primary_cta')}
          </Link>
          <Link href="/ad-services" className="bb-btn bb-btn-ghost">
            {t('secondary_cta')}
          </Link>
        </div>
      </div>
    </Section>
  );
};
