import '@/styles/global.css';

import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import React from 'react';

// Step 1: Import the client-only code in a separate file to avoid RSC errors
import { Analytics } from '@/components/analytics/Analytics';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AllLocales, AppConfig } from '@/utils/AppConfig';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--bb-font-body-loaded',
  display: 'swap',
});

// Fallback for routes without their own metadata. Kept within what Google
// displays: title ≤ 65 characters, description ≤ 160.
const title = 'Business Builders — Websites, Hosting & AI for Small Business';
const description
  = 'Websites, hosting, and AI automation for the people who run things. Chatbots that know your business, paperwork that files itself. Plans from $20/mo.';

export const metadata: Metadata = {
  metadataBase: new URL(AppConfig.siteUrl),
  title,
  description,
  keywords: [
    'custom web applications',
    'graphic design',
    'social media management',
    'AI social media',
    'AI integration services',
    'AI automation for business',
    'private AI inference',
    'business website design',
    'SEO services',
    'content creation',
    'small business digital agency',
    'Rutland MA',
    'Massachusetts web design',
  ],
  // No site-wide `alternates.canonical` here on purpose: Next.js merges layout
  // metadata into every page, and a hardcoded homepage canonical told Google
  // that pricing, contact, terms and the whole French site were duplicates of
  // the homepage. Each page now sets its own via pageAlternates() in
  // src/utils/Seo.ts. Same reason og:title / og:url are left out — they fall
  // back to each page's own title and URL.
  openGraph: {
    siteName: 'Business Builders',
    images: [{ url: '/assets/images/og-image.jpg', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/assets/images/og-image.jpg'],
  },
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    { rel: 'icon', url: '/favicon.ico' },
  ],
};

// Static JSON-LD schemas — safe for dangerouslySetInnerHTML (no user input, no external data)
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  'name': 'Business Builders',
  'image': 'https://business-builder.online/assets/images/og-image.jpg',
  '@id': 'https://business-builder.online',
  'url': 'https://business-builder.online',
  'telephone': '+19787901002',
  'description':
    'Website builds, hosting, AI-powered social and content, and AI automation — chatbots, document automation, and private AI — for small businesses.',
  'priceRange': '$$',
  // TODO: Replace with your Google Maps profile URL once created
  'hasMap': 'https://maps.google.com/?q=Business+Builders+Rutland+MA',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': '2 Beverly Hills Dr',
    'addressLocality': 'Rutland',
    'addressRegion': 'MA',
    'postalCode': '01543',
    'addressCountry': 'US',
  },
  'geo': {
    '@type': 'GeoCoordinates',
    'latitude': 42.3748,
    'longitude': -71.9717,
  },
  'areaServed': [
    { '@type': 'City', 'name': 'Rutland' },
    { '@type': 'City', 'name': 'Worcester' },
  ],
  'knowsAbout': [
    'Artificial Intelligence',
    'AI Automation',
    'Private AI Inference',
    'Website Design',
    'SEO',
    'Business Strategy',
    'Business Consulting',
    'DBA Formation',
  ],
  'sameAs': [
    'https://github.com/BusinessBuilders/',
    'https://www.facebook.com/BusinessBuilders',
    'https://www.linkedin.com/company/111580212',
  ],
  'contactPoint': {
    '@type': 'ContactPoint',
    'url': 'https://calendly.com/donovan-business-builder/15minute',
  },
};

// NOTE: The FAQPage JSON-LD now lives on the homepage (src/app/[locale]/(unauth)/page.tsx),
// built from the same next-intl FAQ items the visible accordion renders — schema and
// visible text can't drift, and the schema only appears on the page whose DOM matches it.

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);

  const messages = useMessages();

  return (
    <html
      lang={props.params.locale}
      className={bricolage.variable}
      suppressHydrationWarning
    >
      <body
        className="bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        {/* ThemeProvider wrapped around NextIntlClientProvider */}
        <ThemeProvider>
          <NextIntlClientProvider
            locale={props.params.locale}
            messages={messages}
          >
            {props.children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
