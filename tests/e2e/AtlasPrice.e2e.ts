// tests/e2e/AtlasPrice.e2e.ts — /atlas as it looks once the monthly price is
// configured, which is the TALLEST the hero's idle column ever gets and the
// layout its fixed desktop height was measured against.
//
// It needs a dev server started with NEXT_PUBLIC_ATLAS_PRICE_MONTHLY set,
// because Next inlines that variable into the client bundle at compile time —
// no amount of page scripting can turn the price line on afterwards. Run it
// with the script that arranges that, and nothing else:
//
//   npm run test:e2e:atlas:price
//
// The first assertion in every test is that the price line is really on the
// page. Against a server started without the variable this file FAILS and says
// why, rather than quietly measuring the cheaper layout and going green.
import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';

type Box = { x: number; y: number; width: number; height: number };

const requireBox = async (locator: Locator, name: string): Promise<Box> => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`expected ${name} to have a bounding box`);
  }
  return box;
};

const boxesOverlap = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const PRICE_LINE = /per month per line/;

test.describe('Atlas page with the monthly price configured', () => {
  test('the desktop live area is tall enough for the price-present layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/atlas');

    // Loud, not silent: a server without NEXT_PUBLIC_ATLAS_PRICE_MONTHLY fails
    // here instead of measuring a layout that is 24px shorter and passing.
    await expect(
      page.getByText(PRICE_LINE),
      'the price line is not on the page — this project needs a dev server started with NEXT_PUBLIC_ATLAS_PRICE_MONTHLY set (npm run test:e2e:atlas:price)',
    ).toBeVisible();

    const box = page.locator('[data-atlas-live-area]');

    await expect(box).toBeVisible();

    const fit = await box.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));

    // The whole reason the box is `lg:h-[23rem]` and not `lg:h-80`.
    expect(fit.scrollHeight).toBeLessThanOrEqual(fit.clientHeight);

    await page.screenshot({ path: '.playwright-shots/atlas-price-desktop-1280x800.png' });
  });

  test('the price line and the cookie card stay out of each other\'s way at 1280x800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/atlas');

    const price = page.getByText(PRICE_LINE);
    const banner = page.getByRole('dialog', { name: 'Cookie notice' });

    await expect(price).toBeVisible();
    await expect(banner).toBeVisible();

    // The price is the LAST line of the hero's left column, so it is the line
    // the corner card reaches first if the card ever comes back leftwards.
    const topmostIsPrice = await price.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      // Its own text, not the middle of a full-width block: the <p> spans the
      // column, the words occupy the left of it.
      const hit = document.elementFromPoint(rect.x + 8, rect.y + rect.height / 2);
      return el.contains(hit);
    });

    expect(topmostIsPrice).toBe(true);
  });

  test('nothing in the price-present hero is clipped at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/atlas');

    await expect(page.getByText(PRICE_LINE)).toBeVisible();

    const box = page.locator('[data-atlas-live-area]');

    const fit = await box.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));

    expect(fit.scrollHeight).toBeLessThanOrEqual(fit.clientHeight);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(overflow).toBe(false);

    // The disclosure keeps its clearance above the bar even with the price line
    // added below it — the price grows the column downwards, not the disclosure.
    const banner = page.getByRole('dialog', { name: 'Cookie notice' });
    const privacy = page.getByRole('link', { name: 'How we handle it' });
    const bannerBox = await requireBox(banner, 'the cookie banner');
    const privacyBox = await requireBox(privacy, 'the privacy link');

    expect(boxesOverlap(bannerBox, privacyBox)).toBe(false);

    await page.screenshot({ path: '.playwright-shots/atlas-price-phone-390x844.png' });
  });
});
