import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const SocialPlatforms = () => {
  const t = useTranslations('SocialPlatforms');

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
        {/* TikTok - Live */}
        <div className="border-bb-cream/20 flex flex-col items-center gap-3 rounded-xl border bg-bb-black-warm p-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
            <svg className="size-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.83 4.83 0 01-1-.15z" />
            </svg>
          </div>
          <h3 className="font-semibold text-bb-cream">TikTok</h3>
          <span className="rounded-full bg-bb-orange px-3 py-1 text-xs font-medium text-bb-black">
            {t('live')}
          </span>
        </div>

        {/* Facebook */}
        <div className="border-bb-cream/20 flex flex-col items-center gap-3 rounded-xl border bg-bb-black-warm p-6 text-center opacity-75">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-600">
            <svg className="size-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.998 12c0-6.628-5.372-12-11.999-12C5.372 0 0 5.372 0 12c0 5.988 4.388 10.952 10.124 11.852v-8.384H7.078v-3.469h3.046V9.356c0-3.008 1.792-4.669 4.532-4.669 1.313 0 2.686.234 2.686.234v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.384c5.736-.9 10.124-5.864 10.124-11.853z" />
            </svg>
          </div>
          <h3 className="font-semibold text-bb-cream">Facebook</h3>
          <span className="border-bb-cream/40 rounded-full border bg-transparent px-3 py-1 text-xs font-medium text-bb-taupe">
            {t('coming_soon')}
          </span>
        </div>

        {/* Instagram */}
        <div className="border-bb-cream/20 flex flex-col items-center gap-3 rounded-xl border bg-bb-black-warm p-6 text-center opacity-75">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600">
            <svg className="size-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </div>
          <h3 className="font-semibold text-bb-cream">Instagram</h3>
          <span className="border-bb-cream/40 rounded-full border bg-transparent px-3 py-1 text-xs font-medium text-bb-taupe">
            {t('coming_soon')}
          </span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/sign-up" className="bb-btn bb-btn-primary">
          {t('cta_button')}
        </Link>
      </div>
    </Section>
  );
};
