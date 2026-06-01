import { expect, test } from '@playwright/test';

const CALENDLY_URL = 'https://calendly.com/donovan-business-builder/15minute';

test.describe('/ad-services smoke', () => {
  test('renders the hero + three tier cards', async ({ page }) => {
    await page.goto('/en/ad-services');

    await expect(page.getByRole('heading', { name: /We build ads that/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Static' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Combo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Motion' })).toBeVisible();
    await expect(page.getByText('$899')).toBeVisible();
    await expect(page.getByText('$1,499')).toBeVisible();
    await expect(page.getByText('$2,499')).toBeVisible();
  });

  test('every tier CTA is a Calendly link with target=_blank', async ({ page }) => {
    // Until Stripe products for ad services exist, every "Book a Call"
    // button routes to Calendly (intentional pre-launch behavior).
    // When we switch to Stripe Checkout, update this test to assert
    // POSTs to /api/stripe/create-checkout instead.
    await page.goto('/en/ad-services');
    const ctas = page.getByRole('link', { name: /Book a Call/i });
    const count = await ctas.count();
    expect(count).toBe(3); // one per tier
    for (let i = 0; i < count; i++) {
      const cta = ctas.nth(i);
      await expect(cta).toHaveAttribute('href', CALENDLY_URL);
      await expect(cta).toHaveAttribute('target', '_blank');
      await expect(cta).toHaveAttribute('rel', /noopener/);
    }
  });
});
