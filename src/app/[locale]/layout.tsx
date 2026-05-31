import '@/styles/global.css';

import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import React from 'react';

// Step 1: Import the client-only code in a separate file to avoid RSC errors
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AllLocales } from '@/utils/AppConfig';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--bb-font-body-loaded',
  display: 'swap',
});

const title = 'Business Builders — Websites, Ads & AI Operating Layer for Small Business';
const description
  = 'Websites, automation, and done-for-you ad services for the people who run things. Plans from $20/mo. Ad services from $899.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://business-builder.online'),
  title,
  description,
  keywords: [
    'custom web applications',
    'graphic design',
    'social media management',
    'Twitter automation',
    'AI social media',
    'digital marketing',
    'business website design',
    'SEO services',
    'content creation',
    'small business digital agency',
    'Rutland MA',
    'Massachusetts web design',
  ],
  alternates: {
    canonical: 'https://business-builder.online',
  },
  openGraph: {
    title,
    description,
    url: 'https://business-builder.online',
    siteName: 'Business Builders',
    images: [{ url: '/assets/images/og-image.jpg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/assets/images/og-image.jpg'],
  },
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
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
  'telephone': '+15088863046',
  'description': 'Website builds, AI-powered social and content, and done-for-you ad services for small businesses.',
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
  'knowsAbout': ['Artificial Intelligence', 'Website Design', 'SEO', 'Business Strategy', 'Business Consulting', 'DBA Formation'],
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

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'What makes your social media management and ad services unique?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'We combine human strategy with AI-assisted content and ad campaigns to keep your brand visible across channels — tailored to your voice, without you lifting a finger.',
      },
    },
    {
      '@type': 'Question',
      'name': 'Will the posts include graphics?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes. All social media posts include custom-designed graphics matched to your brand identity.',
      },
    },
    {
      '@type': 'Question',
      'name': 'Can I request custom post designs?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes, all plans include custom-designed posts. Enterprise clients receive priority design requests and 3 custom videos per month.',
      },
    },
    {
      '@type': 'Question',
      'name': 'How often will my social media be updated?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Depending on your plan: Essentials gets 2 posts per week, Growth gets 2 posts per week across 3 platforms, Enterprise gets 4 posts per week across 4 platforms.',
      },
    },
    {
      '@type': 'Question',
      'name': 'How often will you post Reels and ads for me?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'On Growth and Enterprise plans we publish Reels 2–4 times per week and refresh ad creatives monthly — or sooner if the data tells us something is not converting.',
      },
    },
    {
      '@type': 'Question',
      'name': 'Do you respond to comments and messages?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Our Enterprise plan includes community management. Essentials and Growth plans focus on content publishing.',
      },
    },
    {
      '@type': 'Question',
      'name': 'How does the ad and Reels service work?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'We handle the creative, copy, targeting, and launch. You tell us what you sell and who you want in the door — we build the ads and Reels, run them, and report back monthly on what is working.',
      },
    },
    {
      '@type': 'Question',
      'name': 'Can I cancel or upgrade my plan anytime?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes. All plans are month-to-month with no long-term contracts. You can upgrade, downgrade, or cancel at any time.',
      },
    },
  ],
};

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
    <html lang={props.params.locale} className={bricolage.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        {/* ThemeProvider wrapped around NextIntlClientProvider */}
        <ThemeProvider>
          <NextIntlClientProvider locale={props.params.locale} messages={messages}>
            {props.children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
