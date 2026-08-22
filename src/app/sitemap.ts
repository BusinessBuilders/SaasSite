import type { MetadataRoute } from 'next';

import { AppConfig } from '@/utils/AppConfig';
import { localizedUrl } from '@/utils/Seo';

type Freq = MetadataRoute.Sitemap[number]['changeFrequency'];

// One entry per CANONICAL URL — the same addresses the pages' own canonical
// tags declare (src/utils/Seo.ts). Pages with real French copy list both
// locales; English-only pages list just the English URL (their /fr twins
// canonicalize to it, so listing them would only be noise).
//
// `lastModified` is the date the page's CONTENT last changed — bump it when
// you edit the page. A build-time timestamp on every URL tells Google nothing
// and gets ignored.
type Page = {
  path: string;
  lastModified: string;
  changeFrequency: Freq;
  priority: number;
  localized?: boolean;
};

const PAGES: Page[] = [
  { path: '/', lastModified: '2026-08-04', changeFrequency: 'weekly', priority: 1.0, localized: true },
  { path: '/pricing', lastModified: '2026-07-11', changeFrequency: 'monthly', priority: 0.9, localized: true },
  { path: '/ai-automation', lastModified: '2026-07-11', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/private-ai', lastModified: '2026-07-11', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', lastModified: '2026-08-03', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/terms', lastModified: '2026-08-03', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy-policy', lastModified: '2026-08-03', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) => {
    const locales = page.localized
      ? AppConfig.locales.map(l => l.id)
      : [AppConfig.defaultLocale];
    return locales.map(locale => ({
      url: localizedUrl(page.path, locale),
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));
  });
}
