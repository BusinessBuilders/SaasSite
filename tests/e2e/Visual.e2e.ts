import percySnapshot from '@percy/playwright';
import { test } from '@playwright/test';

test.describe('Visual baseline — public + auth surfaces', () => {
  test('homepage (en)', async ({ page }) => {
    await page.goto('/');
    // Wait for hero text — covers any current copy without locking us to specific text.
    await page.waitForSelector('h1', { state: 'visible' });
    await percySnapshot(page, 'Homepage — en');
  });

  test('homepage (fr)', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForSelector('h1', { state: 'visible' });
    await percySnapshot(page, 'Homepage — fr');
  });

  test('pricing (en)', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForSelector('h1, h2', { state: 'visible' });
    await percySnapshot(page, 'Pricing — en');
  });

  test('sign-in', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    await percySnapshot(page, 'Sign-in');
  });

  test('sign-up', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('domcontentloaded');
    await percySnapshot(page, 'Sign-up');
  });
});
