import type { MetadataRoute } from 'next';

import { AppConfig } from '@/utils/AppConfig';

export default function robots(): MetadataRoute.Robots {
  // Keep the app/auth surface and the un-indexable client staging folders
  // out of Google. The marketing pages and the blog are fully open — including
  // to the AI crawlers listed below, on purpose.
  const disallow = [
    '/dashboard',
    '/onboarding',
    '/sign-in',
    '/sign-up',
    '/api/',
    '/monitoring',
    // Client proposal / staging sites served by nginx from the same domain
    // (/var/www/<client>). They're for the client's eyes via a direct link,
    // not for Google — indexing them would compete with the clients' real sites.
    '/ginisi/',
    '/jsl/',
    '/bakery-quote/',
    '/sweet-nalas/',
    '/reeds/',
    '/rutland/',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: 'GPTBot', allow: '/', disallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow },
      { userAgent: 'Google-Extended', allow: '/', disallow },
      { userAgent: 'CCBot', allow: '/', disallow },
      { userAgent: 'Amazonbot', allow: '/', disallow },
      { userAgent: 'Applebot', allow: '/', disallow },
      { userAgent: 'Meta-ExternalAgent', allow: '/', disallow },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow },
      { userAgent: 'DuckAssistBot', allow: '/', disallow },
      { userAgent: 'YouBot', allow: '/', disallow },
    ],
    // The blog is a separate Ghost app under /blog with its own sitemap index.
    sitemap: [
      `${AppConfig.siteUrl}/sitemap.xml`,
      `${AppConfig.siteUrl}/blog/sitemap.xml`,
    ],
  };
}
