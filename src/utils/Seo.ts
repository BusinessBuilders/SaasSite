import { AppConfig } from '@/utils/AppConfig';

// URL conventions on this site (enforced by src/middleware.ts):
//   - English (default locale) pages are UNPREFIXED → /, /pricing, /contact …
//     (/en/pricing is 308-redirected to /pricing)
//   - French pages carry the prefix            → /fr, /fr/pricing …
// Canonicals are built from AppConfig.siteUrl on purpose — never from
// NEXT_PUBLIC_APP_URL — so a bad env var can't point Google at localhost.
/**
 * The same convention as a ROOT-RELATIVE path, for links inside the site:
 * '/terms' in English, '/fr/terms' in French.
 *
 * Links use this rather than next-intl's own `Link`, which renders `/en/terms`
 * for the default locale and leans on the middleware's 308 to tidy it up. That
 * works, but every legal link in the footer would cost a redirect — and the
 * href a visitor copies out of the page would not be the URL the page has.
 */
export const localizedPath = (path: string, locale: string) => {
  const suffix = path === '/' ? '' : path;
  if (locale === AppConfig.defaultLocale) {
    return suffix || '/';
  }
  return `/${locale}${suffix}`;
};

export const localizedUrl = (path: string, locale: string) =>
  `${AppConfig.siteUrl}${localizedPath(path, locale) === '/' ? '' : localizedPath(path, locale)}`;

// BreadcrumbList JSON-LD for a marketing page: Home → (parent →) page. Every
// public page ships one so search engines see the site's shape, not just a
// flat list of URLs. Paths are canonical English paths; the builder makes the
// absolute URLs.
export type Crumb = { name: string; path: string };
export const buildBreadcrumbJsonLd = (crumbs: readonly Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [{ name: 'Home', path: '/' }, ...crumbs].map((crumb, i) => ({
    '@type': 'ListItem',
    'position': i + 1,
    'name': crumb.name,
    'item': localizedUrl(crumb.path, AppConfig.defaultLocale),
  })),
});

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
