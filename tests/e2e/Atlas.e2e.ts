import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';

type Box = { x: number; y: number; width: number; height: number };

// Both helpers live out here so the test bodies below stay free of branching
// (eslint-plugin-playwright's no-conditional-in-test).
const requireBox = async (locator: Locator, name: string): Promise<Box> => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`expected ${name} to have a bounding box`);
  }
  return box;
};

const boxesOverlap = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

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

  test('shows the idle orb before any call starts', async ({ page }) => {
    await page.goto('/atlas');

    await expect(page.getByRole('img', { name: /Atlas/ })).toBeVisible();
  });

  test('the disclosure links to a privacy section that exists', async ({ page }) => {
    await page.goto('/atlas');

    const link = page.getByRole('link', { name: 'How we handle it' });

    await expect(link).toHaveAttribute('href', '/privacy-policy#atlas-voice-demo');

    await link.click();
    await page.waitForURL('**/privacy-policy#atlas-voice-demo');

    await expect(page.locator('#atlas-voice-demo')).toBeVisible();
    await expect(page.locator('#atlas-voice-demo')).toContainText('Atlas Voice Demo');
  });

  test('has no horizontal scroll at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/atlas');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(overflow).toBe(false);
  });

  // A first-time phone visitor sees the cookie banner and the Start button at
  // the same time. The banner used to be a corner card that landed right on
  // top of the button, so the very first tap dismissed cookies instead of
  // starting a call.
  test('the cookie banner does not cover the Start button on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/atlas');

    const banner = page.getByRole('dialog', { name: 'Cookie notice' });
    const start = page.getByRole('button', { name: 'Start talking to Atlas' });

    await expect(banner).toBeVisible();
    await expect(start).toBeVisible();

    const bannerBox = await requireBox(banner, 'the cookie banner');
    const startBox = await requireBox(start, 'the Start button');

    // The compact bar has to stay compact, or it starts eating the page again.
    expect(bannerBox.height).toBeLessThanOrEqual(96);
    expect(boxesOverlap(bannerBox, startBox)).toBe(false);

    // The button must also be the thing that actually receives the tap.
    const topmostIsStart = await start.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return el.contains(hit);
    });

    expect(topmostIsStart).toBe(true);

    await page.screenshot({ path: '.playwright-shots/atlas-phone-390-firstvisit-r2.png', fullPage: false });
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
