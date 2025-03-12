import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import rawMessages from '@/locales/en.json'; // Import as raw JSON

import { CenteredFooter } from './CenteredFooter';

// ✅ Fix: Ensure messages match the expected format for `NextIntlClientProvider`
const messages = {
  ...rawMessages,
  FAQ: {
    ...rawMessages.FAQ,
    items: {}, // ✅ Convert FAQ.items array to an empty object to satisfy TypeScript
  },
};

describe('CenteredFooter', () => {
  describe('Render method', () => {
    it('should have copyright information', () => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <CenteredFooter logo={null} name="" iconList={null} legalLinks={null}>
            Random children
          </CenteredFooter>
        </NextIntlClientProvider>,
      );

      const copyright = screen.getByText(/© Copyright/);

      expect(copyright).toBeInTheDocument();
    });
  });
});
