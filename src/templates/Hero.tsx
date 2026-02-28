import { TwitterLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  const t = useTranslations('Hero');

  return (
    <Section className="py-36">
      <CenteredHero
        banner={(
          <a
            className={badgeVariants()}
            href="https://x.com/_Biz_Builder"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TwitterLogoIcon className="mr-1 size-5" />
            {' '}
            {t('follow_twitter')}
          </a>
        )}
        title={t.rich('title', {
          important: chunks => (
            <span className="bg-gradient-to-r from-brand-gold via-brand-orange to-brand-rust bg-clip-text text-transparent">
              {chunks}
            </span>
          ),
        })}
        description={t('description')}
        buttons={(
          <>
            <a
              className={buttonVariants({ size: 'lg' })}
              href="https://calendly.com/donovan-business-builder/15minute"
            >
              {t('primary_button')}
            </a>

            <Link
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="/sign-up"
            >
              {t('secondary_button')}
            </Link>
          </>
        )}
      />
    </Section>
  );
};
