import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { OFFLINE_MESSAGE } from '@/features/atlas/content';

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

  // The disclosure's "How we handle it" link is the page's privacy promise. It
  // sits at the bottom of the hero on a phone, which is exactly where the
  // cookie bar lives — if the bar lands on it, the one link that explains what
  // happens to a recording is the one link a visitor cannot reach.
  test('the cookie bar leaves the disclosure and its privacy link clear on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/atlas');

    const banner = page.getByRole('dialog', { name: 'Cookie notice' });
    const disclosure = page.getByText('Atlas is an AI, not a person.');
    const privacy = page.getByRole('link', { name: 'How we handle it' });

    await expect(banner).toBeVisible();
    await expect(disclosure).toBeVisible();
    await expect(privacy).toBeVisible();

    // No scrolling: this is what a first-time visitor sees the instant the page
    // settles, which is when they decide whether to press Start.
    const bannerBox = await requireBox(banner, 'the cookie banner');

    expect(boxesOverlap(bannerBox, await requireBox(disclosure, 'the AI disclosure'))).toBe(false);
    expect(boxesOverlap(bannerBox, await requireBox(privacy, 'the privacy link'))).toBe(false);

    // Flush against the bar is not clearance: the link is a 14px tap target and
    // a thumb that lands a few pixels low dismisses cookies instead.
    const privacyBox = await requireBox(privacy, 'the privacy link');

    expect(bannerBox.y - (privacyBox.y + privacyBox.height)).toBeGreaterThanOrEqual(16);

    const topmostIsLink = await privacy.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return el.contains(hit);
    });

    expect(topmostIsLink).toBe(true);
  });

  // /contact carries the 10DLC texting opt-in disclosure the carrier's
  // reviewers screenshot. They do not click "Accept all" first, so anything the
  // cookie bar covers on a first visit is, to them, absent — and a missing
  // "Reply STOP" sentence is a rejected campaign.
  //
  // Two separate promises are asserted here, because a fixed bottom bar can
  // only keep one of them completely:
  //
  //   * REACHABLE — scrolled into view, no consent element is ever under the
  //     bar. This one holds at every width and is the promise that matters.
  //   * VISIBLE ON ARRIVAL — nothing the visitor can already see is covered.
  //     A bar pinned to the bottom always hides the bottom band of the FIRST
  //     screen, so the honest guarantee is that the band is small and that the
  //     first line of anything in it is still readable and tappable. The bar
  //     is measured here for that reason: stacked it was 70px on a tablet and
  //     it reached the consent links; on one row it is 45px and does not.
  for (const [width, height] of [[390, 844], [640, 960], [768, 1024], [1023, 900]]) {
    test(`the cookie bar never denies the texting opt-in at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width: width!, height: height! });
      await page.goto('/contact');

      const banner = page.getByRole('dialog', { name: 'Cookie notice' });

      await expect(banner).toBeVisible();

      const bannerBox = await requireBox(banner, 'the cookie bar');

      // The lever that made this fixable at all. 48px covers the one-row bar
      // (45px measured at 640/768/1023); a phone is too narrow for one row and
      // keeps the stacked bar, which the /atlas guard already caps at 96px.
      expect(bannerBox.height).toBeLessThanOrEqual(width! >= 640 ? 48 : 96);

      // Every consent link in both checkboxes, plus the STOP/HELP/rates
      // sentence: exactly what a carrier reviewer photographs.
      const consent = page.locator('label').filter({ hasText: 'Terms of Service' });
      const targets = [
        ...(await consent.first().locator('a').all()),
        ...(await consent.last().locator('a').all()),
        page.getByText('If you opt in, our texts come from'),
      ];

      // On arrival, with nothing dismissed and nothing scrolled: the first line
      // of anything already on screen must still belong to itself.
      //
      // Probed through getClientRects()[0] — the FIRST LINE BOX — not through
      // getBoundingClientRect(). A link that has wrapped onto two lines has a
      // union box whose left edge belongs to the second line and whose midpoint
      // lands in the gap between them; probing that is how you get a false
      // answer about a link that is perfectly visible.
      const onArrival = await page.evaluate(() => {
        const probe = (el: Element) => {
          const line = el.getClientRects()[0];
          if (!line) {
            return 'not rendered';
          }
          if (line.bottom <= 0 || line.top >= window.innerHeight) {
            return 'off screen';
          }
          const hit = document.elementFromPoint(line.x + line.width / 2, line.y + line.height / 2);
          return el.contains(hit) ? 'self' : (hit?.closest('[role="dialog"]') ? 'COVERED BY THE COOKIE BAR' : 'other');
        };
        const labels = [...document.querySelectorAll('label')]
          .filter(l => (l.textContent ?? '').includes('Terms of Service'));
        const stop = [...document.querySelectorAll('p')].find(x => x.textContent?.includes('Reply STOP'));
        return [...labels.flatMap(l => [...l.querySelectorAll('a')]), ...(stop ? [stop] : [])]
          .map(el => probe(el));
      });

      expect(onArrival).not.toContain('COVERED BY THE COOKIE BAR');

      // And every one of them, scrolled to where a visitor would read it, is
      // clear of the bar and is what a tap at its own coordinates would hit.
      for (const target of targets) {
        await target.scrollIntoViewIfNeeded();
        await target.evaluate(el => el.scrollIntoView({ block: 'center' }));

        await expect(target).toBeVisible();

        const barBox = await requireBox(banner, 'the cookie bar');
        const targetBox = await requireBox(target, 'a texting consent element');

        expect(boxesOverlap(barBox, targetBox)).toBe(false);

        const topmostIsTarget = await target.evaluate((el) => {
          const line = el.getClientRects()[0];
          if (!line) {
            return false;
          }
          const hit = document.elementFromPoint(line.x + line.width / 2, line.y + line.height / 2);
          return el.contains(hit);
        });

        expect(topmostIsTarget).toBe(true);
      }

      await page.screenshot({ path: `.playwright-shots/contact-${width}x${height}-optin-vs-cookiebar.png` });
    });
  }

  // The desktop cookie card used to sit in the same corner as the hero's left
  // column on a 1280x800 laptop: it clipped the bottom of the Start button, and
  // it covered the AI disclosure the visitor agrees to by pressing that button.
  // The hero column and a 177px card do not both fit in the left half of an
  // 800px screen, so the card moved to the right corner.
  test('the cookie card covers neither the Start button nor the disclosure at 1280x800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/atlas');

    const banner = page.getByRole('dialog', { name: 'Cookie notice' });
    const start = page.getByRole('button', { name: 'Start talking to Atlas' });
    const disclosure = page.getByText('Atlas is an AI, not a person.');
    const privacy = page.getByRole('link', { name: 'How we handle it' });

    await expect(banner).toBeVisible();
    await expect(start).toBeVisible();
    await expect(disclosure).toBeVisible();

    const bannerBox = await requireBox(banner, 'the cookie card');

    expect(boxesOverlap(bannerBox, await requireBox(start, 'the Start button'))).toBe(false);
    expect(boxesOverlap(bannerBox, await requireBox(disclosure, 'the AI disclosure'))).toBe(false);
    expect(boxesOverlap(bannerBox, await requireBox(privacy, 'the privacy link'))).toBe(false);

    // And the button is what actually receives the click.
    const topmostIsStart = await start.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return el.contains(hit);
    });

    expect(topmostIsStart).toBe(true);

    await page.screenshot({ path: '.playwright-shots/atlas-desktop-1280-firstvisit.png', fullPage: false });
  });

  // The window between the two layouts. The corner card used to turn on at
  // `sm` (640px) while this hero stays SINGLE-COLUMN until `lg` (1024px), so
  // between roughly 640px and 822px wide the card sat in the same corner as
  // the hero's only column: at 768x1024 elementFromPoint on the middle of
  // "How we handle it" returned the cookie card, and at 640x960 the disclosure
  // paragraph did too. The card now waits for `lg`.
  for (const width of [640, 768, 1023]) {
    test(`the cookie bar covers nothing on the hero at ${width}px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 640 ? 960 : 1024 });
      await page.goto('/atlas');

      const banner = page.getByRole('dialog', { name: 'Cookie notice' });
      const start = page.getByRole('button', { name: 'Start talking to Atlas' });
      const disclosure = page.getByText('Atlas is an AI, not a person.');
      const privacy = page.getByRole('link', { name: 'How we handle it' });

      await expect(banner).toBeVisible();
      await expect(start).toBeVisible();
      await expect(disclosure).toBeVisible();
      await expect(privacy).toBeVisible();

      const bannerBox = await requireBox(banner, 'the cookie bar');

      expect(boxesOverlap(bannerBox, await requireBox(start, 'the Start button'))).toBe(false);
      expect(boxesOverlap(bannerBox, await requireBox(disclosure, 'the AI disclosure'))).toBe(false);
      expect(boxesOverlap(bannerBox, await requireBox(privacy, 'the privacy link'))).toBe(false);

      // Geometry is not enough — the card is `position: fixed` with a high
      // z-index, so the only proof is what a click at that point would hit.
      const hits = await page.evaluate(() => {
        const at = (el: Element | null, offsetX: number) => {
          if (!el) {
            return 'missing';
          }
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + offsetX, r.y + r.height / 2);
          return el.contains(hit) ? 'self' : (hit?.closest('[role="dialog"]') ? 'cookie-dialog' : 'other');
        };
        const button = [...document.querySelectorAll('button')]
          .find(b => b.textContent?.includes('Start talking to Atlas')) ?? null;
        const link = [...document.querySelectorAll('a')]
          .find(a => a.textContent?.includes('How we handle it')) ?? null;
        const paragraph = [...document.querySelectorAll('p')]
          .find(p => p.textContent?.startsWith('Atlas is an AI, not a person.')) ?? null;

        return {
          start: at(button, (button?.getBoundingClientRect().width ?? 0) / 2),
          privacy: at(link, (link?.getBoundingClientRect().width ?? 0) / 2),
          // A full-width <p>: probe its words, near the left edge.
          disclosure: at(paragraph, 8),
        };
      });

      expect(hits).toEqual({ start: 'self', privacy: 'self', disclosure: 'self' });

      await page.screenshot({ path: `.playwright-shots/atlas-tablet-${width}-firstvisit.png`, fullPage: false });
    });
  }

  // The live area is a fixed-height box on desktop so the headline does not
  // drift as Atlas talks. It has to be tall enough for its tallest contents —
  // which includes the price line, present only once the price is configured.
  test('nothing in the desktop live area is clipped by its fixed-height box', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/atlas');

    const box = page.locator('[data-atlas-live-area]');

    await expect(box).toBeVisible();

    const fit = await box.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));

    expect(fit.scrollHeight).toBeLessThanOrEqual(fit.clientHeight);
  });

  test('offline voice shows the honest fallback', async ({ page }) => {
    await page.route('**/api/atlas/session', route =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: OFFLINE_MESSAGE,
          reason: 'voice_not_configured',
        }),
      }));
    await page.goto('/atlas');
    await page.getByRole('button', { name: 'Start talking to Atlas' }).click();

    await expect(page.getByText(OFFLINE_MESSAGE)).toBeVisible();
    await expect(page.getByRole('link', { name: '(508) 886-3046' }).first()).toBeVisible();
  });
});
