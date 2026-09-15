import { expect, test } from '@playwright/test';

// The two plain-text files for AI assistants: the short index (a static file)
// and the generated full text (a route built from the pages' own data).
test.describe('llms.txt for AI assistants', () => {
  test('the index is served as text and points at the pages and the full text', async ({ request }) => {
    const res = await request.get('/llms.txt');

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');

    const text = await res.text();

    expect(text.startsWith('# Business Builder')).toBe(true);
    expect(text).toContain('https://business-builder.online/ai-automation-worcester-county-ma');
    expect(text).toContain('https://business-builder.online/atlas');
    expect(text).toContain('https://business-builder.online/llms-full.txt');
  });

  test('the full text is generated from the pages and served as text', async ({ request }) => {
    const res = await request.get('/llms-full.txt');

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');

    const text = await res.text();

    expect(text).toContain('AI Automation for Worcester County Small Businesses');
    expect(text).toContain('Q: What is AI automation?');
    expect(text).toContain('Q: Am I talking to a real person?');
  });

  test('the footer links to llms.txt on every page', async ({ page }) => {
    await page.goto('/atlas');

    await expect(page.getByRole('link', { name: 'llms.txt' })).toHaveAttribute('href', '/llms.txt');
  });
});
