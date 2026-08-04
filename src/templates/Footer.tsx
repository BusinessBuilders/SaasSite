'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';
import { AppConfig } from '@/utils/AppConfig';

import { Logo } from './Logo';

export const Footer = () => {
  const t = useTranslations('Footer');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  return (
    <Section className="pb-16 pt-0">
      <div className="flex flex-col items-center text-center">
        <Logo variant="full" />

        <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-base text-bb-taupe [&_a:hover]:text-bb-cream [&_a]:transition-colors">
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
            <Link href="/private-ai">{t('private_ai')}</Link>
          </li>
          <li>
            <Link href="/contact">{t('contact')}</Link>
          </li>
        </ul>

        {/* Social icons */}
        <ul className="mt-6 flex flex-row gap-x-5 text-bb-taupe [&_svg:hover]:text-bb-orange [&_svg:hover]:opacity-100 [&_svg]:size-5 [&_svg]:fill-current [&_svg]:opacity-60 [&_svg]:transition-colors">
          <li>
            <Link href="https://www.facebook.com/p/Business-Builder-inc-61556752964099/">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.998 12c0-6.628-5.372-12-11.999-12C5.372 0 0 5.372 0 12c0 5.988 4.388 10.952 10.124 11.852v-8.384H7.078v-3.469h3.046V9.356c0-3.008 1.792-4.669 4.532-4.669 1.313 0 2.686.234 2.686.234v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.384c5.736-.9 10.124-5.864 10.124-11.853z" />
              </svg>
            </Link>
          </li>
          <li>
            <Link href="https://x.com/_Biz_Builder">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.954 4.569a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.691 8.094 4.066 6.13 1.64 3.161a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.061a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
              </svg>
            </Link>
          </li>
          <li>
            <Link href="https://www.linkedin.com/company/111580212">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </Link>
          </li>
          <li>
            <Link href="https://github.com/BusinessBuilders">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </Link>
          </li>
        </ul>

        {/* Legal identity + contact — carriers cross-check the A2P brand
            registration (Donovan Farms Inc) against what the site displays. */}
        <p className="mt-6 text-sm text-bb-dust">
          Business Builder is a DBA of Donovan Farms Inc.
          <br className="sm:hidden" />
          <span className="hidden sm:inline">{' · '}</span>
          2 Beverly Hills Dr.,
          Rutland, MA 01543
          {' · '}
          <a
            href="tel:+19787901002"
            className="transition-colors hover:text-bb-cream"
          >
            978-790-1002
          </a>
          {' · '}
          <a
            href="mailto:donovan@business-builder.online"
            className="transition-colors hover:text-bb-cream"
          >
            donovan@business-builder.online
          </a>
        </p>

        {/* Double-rule divider */}
        <hr className="bb-rule-double mt-8 w-full" />

        <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-y-2 text-sm text-bb-dust">
          <div>
            {`© ${new Date().getFullYear()} ${AppConfig.name}`}
            {' · '}
            <span className="italic text-bb-taupe">/// Hand-built ///</span>
          </div>

          <ul className="flex gap-x-4 font-medium text-bb-dust [&_a:hover]:text-bb-cream [&_a]:transition-colors">
            <li>
              <Link href={`/${locale}/terms`}>{t('terms_of_service')}</Link>
            </li>
            <li>
              <Link href={`/${locale}/privacy-policy`}>
                {t('privacy_policy')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
};
