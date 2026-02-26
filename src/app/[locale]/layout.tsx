import '@/styles/global.css';

import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import React from 'react';

// Step 1: Import the client-only code in a separate file to avoid RSC errors
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AllLocales } from '@/utils/AppConfig';

const title = 'Business Builders — Custom Apps, Graphic Design & Social Media';
const description
  = 'From custom applications to graphic design and social media management, Business Builders delivers the digital tools your business needs to thrive online. Plans from $99/month.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://business-builder.online',
    siteName: 'Business Builders',
    images: [{ url: '/assets/images/nextjs-boilerplate-saas.png' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/assets/images/nextjs-boilerplate-saas.png'],
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
  'image': 'https://business-builder.online/assets/images/nextjs-boilerplate-saas.png',
  '@id': 'https://business-builder.online',
  'url': 'https://business-builder.online',
  'telephone': '+15088863046',
  'description': 'Expert website design and business building services for growth-minded entrepreneurs.',
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
    'https://x.com/_Biz_Builder',
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
      'name': 'What makes your social media management and Twitter automation services unique?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'We combine human strategy with AI-assisted scheduling to post consistently across platforms, tailored to your brand voice, without you lifting a finger.',
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
      'name': 'Will Twitter post multiple times per day with the AI agent?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'The AI Twitter agent on Growth and Enterprise plans is configured to post at optimal times for engagement, typically 1-3 times per day depending on your niche activity.',
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
      'name': 'How does the Twitter automation service work?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'We deploy an AI agent that posts relevant content to your X/Twitter account daily, engages with trending topics in your niche, and grows your following on autopilot.',
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
    <html lang={props.params.locale} suppressHydrationWarning>
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
