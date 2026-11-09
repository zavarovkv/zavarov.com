import { test, expect } from '@playwright/test';
import { layoutContracts } from '../../themes/hugo-mini/tests/browser/contracts.mjs';
layoutContracts(test, expect);

for (const scheme of ['light', 'dark']) test(`blog pages retain their layout and assets (${scheme})`, async ({ page, baseURL }) => {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  await page.emulateMedia({ colorScheme: scheme });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/en/', '/blog/', '/books/', '/retention/', '/en/template-diagrams/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} at ${width}`).toBe(true);
      await expect(page.locator('main')).toBeVisible();
    }
  }
  expect(failures).toEqual([]);
});
