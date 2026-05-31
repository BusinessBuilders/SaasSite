import { expect, test } from '@playwright/test';

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

  test('clicking a tier button POSTs to /api/stripe/create-checkout', async ({ page }) => {
    let captured: { url: string; body: string } | null = null;
    await page.route('**/api/stripe/create-checkout', async (route, request) => {
      captured = { url: request.url(), body: request.postData() ?? '' };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'about:blank#fake' }) });
    });

    await page.goto('/en/ad-services');
    await Promise.all([
      page.waitForRequest('**/api/stripe/create-checkout'),
      page.getByRole('button', { name: /Pick The Combo/i }).click(),
    ]);

    expect(captured).not.toBeNull();
    expect(captured!.body).toContain('"productType":"ad_service"');
    expect(captured!.body).toContain('"tier":"combo"');
  });
});
