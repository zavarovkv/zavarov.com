import { test, expect } from './site-test.mjs';

test('the mobile bookshelf scrolls inside its column and opens a review', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/books/');
  const shelf = page.locator('.reading-shelf-scroll');
  await shelf.focus();
  await page.keyboard.press('ArrowRight', { delay: 150 });
  await expect.poll(() => shelf.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const review = shelf.locator('a').first();
  const url = await review.getAttribute('href');
  const popup = page.waitForEvent('popup');
  await review.click();
  const article = await popup;
  await expect(article).toHaveURL(new URL(url, page.url()).href);
  await expect(article.locator('main h1')).toBeVisible();
});

test('a published diagram loads from the blog and is available in print', async ({ page }) => {
  const module = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/js/mermaid/mermaid.esm.min.mjs' && response.ok());
  await page.goto('/second-brain/');
  const diagram = page.locator('.article-diagram .mermaid').first();
  await diagram.scrollIntoViewIfNeeded();
  await module;
  await expect(diagram.locator('svg')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
  await expect(diagram).toBeVisible();
  await expect(diagram).toContainText('Гиппокамп');
});
