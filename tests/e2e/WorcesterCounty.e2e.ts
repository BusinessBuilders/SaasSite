import { expect, test } from '@playwright/test';

// The local landing page for AI automation across Worcester County. These
// checks are the technical-SEO contract: the URL renders, carries the agreed
// title/H1/canonical, is indexable, ships structured data that matches the
// visible text, links to the live voice-agent demo, and is reachable from the
// pages that should point at it.

const PATH = '/ai-automation-worcester-county-ma';
const CANONICAL = `https://business-builder.online${PATH}`;

test.describe('AI automation — Worcester County page', () => {
  test('renders with the agreed title, H1, canonical and description, and is indexable', async ({ page }) => {
    const response = await page.goto(PATH);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle('AI Automation Worcester County, MA | Business Builder');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'AI Automation for Worcester County Small Businesses',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Worcester County and Central Massachusetts/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'AI Automation Worcester County, MA | Business Builder',
    );
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
      'content',
      /og-image\.jpg$/,
    );

    // Indexable: nothing on the page or in the headers says noindex.
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');

    expect(robotsMeta ?? '').not.toMatch(/noindex|nofollow/);
    expect(response?.headers()['x-robots-tag'] ?? '').not.toMatch(/noindex/);
  });

  test('says up top that Business Builder serves Worcester County and Central Massachusetts', async ({ page }) => {
    await page.goto(PATH);

    await expect(
      page.getByText(
        'Business Builder provides AI automation and integration for small businesses throughout Worcester County and Central Massachusetts',
      ),
    ).toBeVisible();
    // The towns are listed as service areas, and the only office is Rutland.
    await expect(page.getByText('(home base)')).toBeVisible();
    await expect(page.getByText('Our only office is in')).toBeVisible();
  });

  test('ships FAQPage, Service and BreadcrumbList JSON-LD that parse and match the page', async ({ page }) => {
    await page.goto(PATH);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map(block => JSON.parse(block));
    const types = parsed.map(block => block['@type']);

    expect(types).toEqual(
      expect.arrayContaining(['FAQPage', 'Service', 'BreadcrumbList', 'ProfessionalService']),
    );

    const service = parsed.find(block => block['@type'] === 'Service');

    // The provider is the site-wide organization, by @id — not a second copy.
    expect(service.provider['@id']).toBe('https://business-builder.online');
    expect(JSON.stringify(service.areaServed)).toContain('Worcester County, Massachusetts');
    expect(JSON.stringify(service.areaServed)).toContain('Shrewsbury');

    const faq = parsed.find(block => block['@type'] === 'FAQPage');

    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(7);

    for (const question of faq.mainEntity) {
      await expect(page.getByRole('button', { name: question.name })).toBeVisible();
    }
  });

  test('has a prominent voice-agent section that links to the live Atlas demo', async ({ page }) => {
    await page.goto(PATH);

    const voice = page.locator('#ai-voice-agents');

    await expect(voice.getByRole('heading', { level: 2 })).toContainText('AI receptionist');
    await expect(voice.getByRole('link', { name: 'Talk to Our AI Voice Agent Demo' })).toHaveAttribute('href', '/atlas');
    await expect(voice.getByRole('link', { name: /call the live line \(508\) 886-3046/ })).toHaveAttribute('href', 'tel:+15088863046');
    await expect(page.getByRole('link', { name: 'Try Our AI Voice Agent' }).first()).toHaveAttribute('href', '/atlas');

    // Every voice-agent use William asked for is on the page.
    for (const use of [
      'Answering inbound calls',
      'Answering common questions',
      'Collecting lead information',
      'Qualifying inquiries',
      'Routing information to you',
      'After-hours call handling',
    ]) {
      await expect(voice.getByRole('heading', { level: 3, name: use })).toBeVisible();
    }
  });

  test('the photo carries real alt text', async ({ page }) => {
    await page.goto(PATH);

    const alt = await page.locator('main img').first().getAttribute('alt');

    expect(alt).toMatch(/Rutland, Massachusetts/);
  });

  test('links to the main AI page, private AI and contact — and every internal link resolves', async ({ page, request }) => {
    await page.goto(PATH);

    for (const href of ['/ai-automation', '/private-ai', '/contact', '/atlas']) {
      await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
    }

    const hrefs: string[] = await page
      .locator('main a[href^="/"]')
      .evaluateAll(anchors => [...new Set(anchors.map(a => a.getAttribute('href')!))]);

    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      const res = await request.get(href.split('#')[0]!, { maxRedirects: 0 });

      expect(res.status(), `${href} should resolve without a redirect`).toBe(200);
    }
  });

  test('follows the site URL scheme: /en redirects, /fr canonicalizes to English', async ({ page, request }) => {
    const en = await request.get(`/en${PATH}`, { maxRedirects: 0 });

    expect(en.status()).toBe(308);
    expect(en.headers().location).toMatch(new RegExp(`${PATH}$`));

    await page.goto(`/fr${PATH}`);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
  });

  test('is in the sitemap, alongside /atlas, and the AI search crawlers are allowed in', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();

    expect(sitemap).toContain(`<loc>${CANONICAL}</loc>`);
    expect(sitemap).toContain('<loc>https://business-builder.online/atlas</loc>');

    const robots = await (await request.get('/robots.txt')).text();
    for (const bot of ['OAI-SearchBot', 'GPTBot', 'ClaudeBot', 'PerplexityBot']) {
      expect(robots).toMatch(new RegExp(`User-Agent: ${bot}\\nAllow: /`));
    }

    expect(robots).not.toMatch(/Disallow: \/ai-automation/);
    expect(robots).not.toMatch(/Disallow: \/atlas/);
  });

  test('the main AI page, /atlas and the footer all link here', async ({ page }) => {
    await page.goto('/ai-automation');

    await expect(page.getByRole('link', { name: 'AI Automation in Worcester County' })).toHaveAttribute('href', PATH);
    await expect(page.getByRole('link', { name: 'Talk to Our AI Voice Agent Demo' })).toHaveAttribute('href', '/atlas');

    await page.goto('/atlas');

    await expect(
      page.getByRole('link', { name: 'AI automation and voice agents for Worcester County businesses' }),
    ).toHaveAttribute('href', PATH);
    await expect(page.getByRole('link', { name: 'Worcester County AI' })).toHaveAttribute('href', PATH);
  });

  test('has no horizontal scroll on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PATH);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});

// Accessibility names that Lighthouse flagged site-wide on 2026-09-15: the
// icon-only footer links and the icon-only mobile menu button. Checked here
// because this page is the one we re-audit; the fix is in the shared Footer
// and ToggleMenuButton, so it holds for every page.
test.describe('accessible names on shared chrome', () => {
  test('every footer social icon link and the mobile menu button have names', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ai-automation-worcester-county-ma');

    for (const name of ['Facebook', 'X', 'LinkedIn', 'GitHub', 'YouTube']) {
      await expect(page.getByRole('link', { name: `Business Builder on ${name}` })).toHaveCount(1);
    }

    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  });

  test('the hero paints without waiting for the reveal animation', async ({ page }) => {
    // Block all scripts: what is left is the server HTML. The hero must be
    // fully readable in it — no opacity gate, no missing text.
    await page.route('**/*.js', route => route.abort());
    await page.goto('/ai-automation-worcester-county-ma');

    const h1 = page.getByRole('heading', { level: 1 });

    await expect(h1).toBeVisible();
    expect(await h1.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.getByText('Business Builder provides AI automation and integration')).toBeVisible();
  });
});
