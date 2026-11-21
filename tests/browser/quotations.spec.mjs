import { test, expect } from './site-test.mjs';

test('author definitions share the drop cap ink on screen and the article ink in print', async ({ page }) => {
  await page.goto('/edtech/');
  const opening = page.locator('.beauty-dropcap > p:first-child');
  const leads = page.locator('article p.beauty-lead');
  await expect(leads).toHaveCount(2);
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    const initialColor = await opening.evaluate(node => getComputedStyle(node, '::first-letter').color);
    await expect(opening).not.toHaveCSS('color', initialColor);
    for (const lead of await leads.all()) await expect(lead).toHaveCSS('color', initialColor);
  }
  await page.emulateMedia({ media: 'print' });
  await expect(opening).toHaveCSS('color', 'rgb(34, 34, 34)');
  for (const lead of await leads.all()) await expect(lead).toHaveCSS('color', 'rgb(34, 34, 34)');
});

test('the published review and consultation render their two quotation layouts', async ({ page }) => {
  await page.goto('/books/sabirov/');
  const paragraph = page.locator('article figure.beauty-quotation > blockquote > p').first();
  await expect(paragraph).toContainText(/\d/);
  await expect(paragraph).toHaveCSS('font-variant-numeric', 'oldstyle-nums proportional-nums');

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/consultation/');
  const quote = page.locator('article figure.beauty-quotation');
  await expect(quote.locator('blockquote')).toBeVisible();
  await expect(quote.locator('figcaption')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
