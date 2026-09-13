import { expect, test } from '@playwright/test';

// Static coverage for /atlas: everything a visitor must be able to read and
// reach before any microphone is opened, plus the honest failure path when the
// voice worker is not there. No LiveKit worker is required to run this file.
test.describe('Atlas page', () => {
  test('renders the disclosure, the personas and the live line', async ({ page }) => {
    await page.goto('/atlas');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('receptionist');
    await expect(page.getByText('Atlas is an AI, not a person.')).toBeVisible();
    await expect(page.getByRole('radio', { name: /Landscaping/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start talking to Atlas' })).toBeVisible();

    // The live line is offered twice — under the start button and in the
    // closing call to action — and every one of them has to dial.
    const phoneLinks = page.getByRole('link', { name: '(508) 886-3046' });
    const phoneCount = await phoneLinks.count();

    expect(phoneCount).toBeGreaterThan(0);

    for (let i = 0; i < phoneCount; i++) {
      await expect(phoneLinks.nth(i)).toHaveAttribute('href', 'tel:+15088863046');
    }
  });

  test('has no horizontal scroll at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/atlas');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(overflow).toBe(false);
  });

  test('offline voice shows the honest fallback', async ({ page }) => {
    await page.route('**/api/atlas/session', route =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'The voice demo is offline right now.',
          reason: 'voice_not_configured',
        }),
      }));
    await page.goto('/atlas');
    await page.getByRole('button', { name: 'Start talking to Atlas' }).click();

    await expect(page.getByText('The voice demo is offline right now.')).toBeVisible();
    await expect(page.getByRole('link', { name: '(508) 886-3046' }).first()).toBeVisible();
  });
});
