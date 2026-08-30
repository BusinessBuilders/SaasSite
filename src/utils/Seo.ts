import { AppConfig } from '@/utils/AppConfig';

// URL conventions on this site (enforced by src/middleware.ts):
//   - English (default locale) pages are UNPREFIXED → /, /pricing, /contact …
//     (/en/pricing is 308-redirected to /pricing)
//   - French pages carry the prefix            → /fr, /fr/pricing …
// Canonicals are built from AppConfig.siteUrl on purpose — never from
// NEXT_PUBLIC_APP_URL — so a bad env var can't point Google at localhost.
export const localizedUrl = (path: string, locale: string) => {
  const suffix = path === '/' ? '' : path;
  if (locale === AppConfig.defaultLocale) {
    return `${AppConfig.siteUrl}${suffix}`;
  }
  return `${AppConfig.siteUrl}/${locale}${suffix}`;
};

type AlternatesOptions = {
  // Pages whose French twin is still English copy. Every locale then
  // canonicalizes to the English URL so Google never sees duplicate content,
  // and no hreflang set is emitted (there is nothing translated to point at).
  englishOnly?: boolean;
};

// Drop-in value for Next.js `metadata.alternates` — self-referencing
// canonical plus a full hreflang set (en, fr, x-default).
export const pageAlternates = (
  path: string,
  locale: string,
  options: AlternatesOptions = {},
) => {
  const defaultUrl = localizedUrl(path, AppConfig.defaultLocale);
  if (options.englishOnly) {
    return { canonical: defaultUrl };
  }
  const languages = Object.fromEntries(
    AppConfig.locales.map(l => [l.id, localizedUrl(path, l.id)]),
  );
  return {
    canonical: localizedUrl(path, locale),
    languages: { ...languages, 'x-default': defaultUrl },
  };
};
