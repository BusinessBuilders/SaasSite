import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/features/landing/Section';

export const AIAutomationBand = () => {
  const t = useTranslations('AIAutomationBand');
  return (
    <Section className="py-20">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-lg border-2 border-bb-orange bg-bb-black-warm p-10 text-center shadow-bb-card">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-bb-orange">
            {t('eyebrow')}
          </div>
          <h2 className="font-bb-display-2 text-3xl font-extrabold text-bb-cream-bright md:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-bb-taupe">
            {t('description')}
          </p>
          <Link
            href="/ai-automation"
            className="bb-btn bb-btn-primary mt-8 inline-block"
          >
            {t('cta')}
          </Link>
        </div>
      </Reveal>
    </Section>
  );
};
