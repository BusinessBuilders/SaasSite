import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/utils/Helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const locales = ['en', 'fr'];
  const now = new Date();

  const localePages = locales.flatMap(l => [
    { url: `${base}/${l}`, lastModified: now, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${base}/${l}/pricing`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/${l}/ad-services`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/${l}/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${base}/${l}/privacy-policy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
  ]);

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    ...localePages,
  ];
}
