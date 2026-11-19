import { test, expect } from './site-test.mjs';

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
