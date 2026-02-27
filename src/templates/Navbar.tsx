import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredMenu } from '@/features/landing/CenteredMenu';
import { Section } from '@/features/landing/Section';

import { Logo } from './Logo';

export const Navbar = () => {
  const t = useTranslations('Navbar');

  return (
    <Section className="px-3 py-6">
      <CenteredMenu
        logo={<Logo />}
        rightMenu={(
          <>
            <li data-fade>
              <ThemeToggle />
            </li>
            <li data-fade>
              <LocaleSwitcher />
            </li>
            <li className="ml-1 mr-2.5" data-fade>
              <Link href="/sign-in">{t('sign_in')}</Link>
            </li>
            <li>
              <Link className={buttonVariants()} href="/sign-up">
                {t('sign_up')}
              </Link>
            </li>
          </>
        )}
      >
        <li>
          <Link href="/#features">{t('product')}</Link>
        </li>

        <li>
          <a href="https://blog.business-builder.online" target="_blank" rel="noopener noreferrer">
            {t('blog')}
          </a>
        </li>

        <li>
          <Link href="/pricing">{t('pricing')}</Link>
        </li>

        <li>
          <Link href="/#about">{t('company')}</Link>
        </li>
      </CenteredMenu>
    </Section>
  );
};
