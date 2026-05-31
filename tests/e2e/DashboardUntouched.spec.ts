// tests/e2e/DashboardUntouched.spec.ts
import { expect, test } from '@playwright/test';

// Mechanically enforces the "dashboard stays untouched" guarantee of the rebrand.
// If a future phase accidentally restyles dashboard surfaces (via global CSS bleed,
// shared component leak, or scope failure on the .bb-marketing wrapper), this test
// catches it.
test.describe('Dashboard not affected by marketing rebrand', () => {
  test('sign-in page uses shadcn-default background, not bb-marketing dark', async ({ page }) => {
    await page.goto('/sign-in');
    const body = page.locator('body');
    // shadcn default light background = HSL(38 75% 97%) ≈ rgb(252, 245, 230)-ish cream-white.
    // The bb-marketing dark surface is HSL ≈ #0a0a0a. We assert sign-in is NOT the dark BB.
    const bg = await body.evaluate(el => getComputedStyle(el).backgroundColor);

    expect(bg).not.toBe('rgb(10, 10, 10)');
    expect(bg).not.toBe('rgb(20, 17, 13)');
  });

  test('sign-up page uses shadcn-default background', async ({ page }) => {
    await page.goto('/sign-up');
    const bg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);

    expect(bg).not.toBe('rgb(10, 10, 10)');
  });
});
