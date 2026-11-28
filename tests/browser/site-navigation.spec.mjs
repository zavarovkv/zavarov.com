import { test, expect } from './site-test.mjs';

for (const [path, label] of [['/blog/', 'Личный кабинет'], ['/en/blog/', 'My account']]) {
  test(`the account and Telegram icons follow the blog menu at ${path}`, async ({ page }) => {
    await page.goto(path);
    const account = page.locator('#main-navigation').getByRole('button', { name: label });
    const search = page.locator('.search-toggle-desktop');
    const telegram = page.locator('#main-navigation a[href^="https://t.me/"]');
    const expectTrailingPlane = async () => {
      const text = await telegram.locator('.nav-label').boundingBox();
      const plane = await telegram.locator('.nav-icon').boundingBox();
      expect(plane.x).toBeGreaterThanOrEqual(text.x + text.width);
    };
    await expect(account).toBeDisabled();
    await expect(account.locator('span')).toBeHidden();
    await expect(search).toBeVisible();
    const icon = await account.locator('svg').boundingBox();
    const loupe = await search.locator('svg').boundingBox();
    expect(icon.x + icon.width).toBeLessThan(loupe.x);
    expect(icon.y).toBeCloseTo(loupe.y, 0);
    await expectTrailingPlane();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(account).toBeHidden();
    await page.locator('.mobile-menu-toggle').click();
    await expect(account.locator('span')).toHaveText(label);
    await expect(account.locator('span')).toBeVisible();
    await expect(account).toBeDisabled();
    await expectTrailingPlane();
  });
}
