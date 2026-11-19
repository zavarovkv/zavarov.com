import { test, expect } from './site-test.mjs';

const profiles = (process.env.BROWSER_HUGO_CONFIG || '').split(',');

test('the licensed title font loads for article headings and prints in that face', async ({ page }) => {
  test.skip(!profiles.includes('config/fonts/sourdine.toml'), 'Requires the Sourdine profile');
  await page.goto('/books/sabirov/');
  const heading = page.locator('article h2').first();
  await expect(heading).toHaveCSS('font-family', /^"?ALS Sourdine/);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => [...document.fonts].some(face =>
    /ALS Sourdine/i.test(face.family) && face.status === 'loaded'))).toBe(true);
  await expect(page.locator('article > p').first()).toHaveCSS('font-family', /^"?ALS Story/);
  await page.emulateMedia({ media: 'print' });
  await expect(heading).toHaveCSS('font-family', /^"?ALS Sourdine/);
});

test('the licensed quotation face loads while attributions use the body face', async ({ page }) => {
  test.skip(!profiles.includes('config/fonts/mirta.toml'), 'Requires the Mirta profile');
  await page.goto('/consultation/');
  const figure = page.locator('article figure.beauty-quotation');
  await expect(figure.locator('blockquote')).toHaveCSS('font-family', /^"?ALS Mirta/);
  await expect(figure.locator('figcaption')).toHaveCSS('font-family', /^"?ALS Story/);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => [...document.fonts].some(face =>
    /ALS Mirta/i.test(face.family) && face.status === 'loaded'))).toBe(true);
});
