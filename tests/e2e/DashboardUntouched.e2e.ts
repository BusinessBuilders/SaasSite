// tests/e2e/DashboardUntouched.e2e.ts
import { expect, test } from '@playwright/test';

// Mechanically enforces the "dashboard stays untouched" guarantee of the rebrand.
// We test auth pages (sign-in, sign-up) because they're pre-login (publicly
// renderable in tests) and the most likely surfaces to suffer CSS bleed from
// global styles. /dashboard itself requires auth to render, so we use auth pages
// as the canary for theme-system regressions.

// BB sign-painter dark canvas, expressed as the two RGB values it can render as:
//   --bb-black     = #0a0a0a → rgb(10, 10, 10)
//   --bb-black-warm = #1c1812 → rgb(28, 24, 18)
// (Plus #14110d → rgb(20, 17, 13) for --bb-black-soft, kept as a defensive third.)
const BB_DARK_RGBS = [
  'rgb(10, 10, 10)',
  'rgb(20, 17, 13)',
  'rgb(28, 24, 18)',
];

test.describe('Dashboard not affected by marketing rebrand', () => {
  test('sign-in page uses shadcn-default background, not bb-marketing dark', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    const bg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);

    expect(bg).toBeDefined();

    for (const dark of BB_DARK_RGBS) {
      expect(bg).not.toBe(dark);
    }
  });

  test('sign-up page uses shadcn-default background', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('domcontentloaded');
    const bg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);

    expect(bg).toBeDefined();

    for (const dark of BB_DARK_RGBS) {
      expect(bg).not.toBe(dark);
    }
  });
});
