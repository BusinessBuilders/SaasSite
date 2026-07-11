import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
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
              <LocaleSwitcher />
            </li>
            <li className="ml-1 mr-2.5" data-fade>
              <Link
                href="/sign-in"
                className="text-bb-cream/70 transition-colors hover:text-bb-cream"
              >
                {t('sign_in')}
              </Link>
            </li>
            <li>
              <Link
                href="/sign-up"
                className="bb-btn bb-btn-primary !px-5 !py-2 !text-sm"
              >
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
          <a href="/blog">{t('blog')}</a>
        </li>

        <li>
          <Link href="/pricing">{t('pricing')}</Link>
        </li>

        <li>
          <Link href="/ai-automation">{t('ai_automation')}</Link>
        </li>

        <li>
          <Link href="/#about">{t('company')}</Link>
        </li>
      </CenteredMenu>
    </Section>
  );
};
