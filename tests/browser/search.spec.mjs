import { test, expect } from './site-test.mjs';

for (const [lang, path, query] of [
  ['ru', '/', 'продуктовая стратегия'],
  ['en', '/en/', 'product strategy'],
]) {
  test(`the ${lang} search index opens the published article`, async ({ page, baseURL }) => {
    await page.goto(path);
    await page.locator('.search-toggle-desktop').click();
    await page.locator('#search-query').fill(query);
    const articlePath = path + 'product-strategy/';
    const result = page.locator(`.search-result[href*="${articlePath}"]`).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).toHaveURL(url => url.origin === new URL(baseURL).origin && url.pathname === articlePath);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('main h1')).toBeVisible();
  });
}
