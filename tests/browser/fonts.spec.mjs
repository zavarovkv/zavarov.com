import {test, expect} from '@playwright/test';

test('the licensed H1 face loads without changing body or article-list fonts', async ({page}) => {
  test.skip(!process.env.BROWSER_HUGO_CONFIG?.split(',').includes('config/fonts/sourdine.toml'), 'Private font profile is not selected');
  const fontFailures = [];
  page.on('response', response => {
    if (response.url().includes('/private-fonts/') && !response.ok()) fontFailures.push(response.status());
  });
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({colorScheme});
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({width, height:900});
      for (const path of ['/nct/', '/en/nct/']) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const title = page.locator('h1');
        await expect(title).toHaveCSS('font-family', /^"?ALS Sourdine/);
        await expect(title).toHaveCSS('font-weight', '500');
        await expect(title).toHaveCSS('font-size', width > 768 ? '44px' : '32px');
        await expect(title).toHaveCSS('letter-spacing', width > 768 ? 'normal' : '-0.32px');
        await expect(page.locator('article > p').first()).toHaveCSS('font-family', /^"?ALS Story/);
        await expect(page.locator('h2').first()).toHaveCSS('font-family', /^"?ALS Story/);
        await expect(page.locator('.blog-posts a').first()).toHaveCSS('font-family', /^"?ALS Story/);
        expect(await page.evaluate(() => [...document.fonts].some(font => /ALS Sourdine/i.test(font.family) && font.status === 'loaded'))).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  }
  expect(fontFailures).toEqual([]);
});
