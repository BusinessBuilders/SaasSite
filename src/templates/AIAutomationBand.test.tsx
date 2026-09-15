import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { vi } from 'vitest';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

import { AIAutomationBand } from './AIAutomationBand';

// The reveal animation needs a real browser (GSAP + ScrollTrigger); the test
// is about the links, so the wrapper becomes a plain div.
vi.mock('@/components/motion/Reveal', () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// FAQ.items is an array in the JSON and next-intl's message type wants an
// object there — same workaround as CenteredFooter.test.tsx.
const messagesFor = (raw: typeof en) => ({ ...raw, FAQ: { ...raw.FAQ, items: {} } });

describe('AIAutomationBand (homepage)', () => {
  // The homepage is the most authoritative page on the site; this is its one
  // link to the local landing page, in both languages.
  it.each([
    ['en', en, 'See AI automation for Worcester County businesses'],
    ['fr', fr, 'Voir l’automatisation IA pour les entreprises du comté de Worcester'],
  ])('links the %s homepage to the Worcester County page', (locale, raw, label) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messagesFor(raw as typeof en)}>
        <AIAutomationBand />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: label })).toHaveAttribute(
      'href',
      '/ai-automation-worcester-county-ma',
    );
    expect(screen.getByRole('link', { name: raw.AIAutomationBand.cta })).toHaveAttribute(
      'href',
      '/ai-automation',
    );
  });
});
