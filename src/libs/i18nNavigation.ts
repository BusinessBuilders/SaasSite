import { createSharedPathnamesNavigation } from 'next-intl/navigation';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

// `Link` is exported alongside the hooks because a plain next/link `href` is
// NOT locale-aware: on /fr/... it keeps pointing at the English URL, and any
// attempt to build the prefix by hand from the pathname breaks on the default
// locale, whose URLs carry no prefix at all (see the Footer's legal links).
export const { Link, usePathname, useRouter } = createSharedPathnamesNavigation({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
});
