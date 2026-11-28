import { test, expect } from './site-test.mjs';

for (const [path, label, colorScheme] of [['/blog/', 'Личный кабинет', 'light'], ['/en/blog/', 'My account', 'dark']]) {
  test(`the account and Telegram icons follow the blog menu at ${path}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
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
    const language = await page.locator('footer .lang-toggle').boundingBox();
    const theme = await page.locator('footer .theme-toggle').boundingBox();
    const accountBox = await account.boundingBox();
    const searchBox = await search.boundingBox();
    expect(searchBox.x - accountBox.x - accountBox.width).toBeCloseTo(theme.x - language.x - language.width, 1);
    expect(icon.y).toBeCloseTo(loupe.y, 0);
    await expectTrailingPlane();
    await expect(account).toHaveAttribute('title', label);
    const restingColor = await account.evaluate(el => getComputedStyle(el).color);
    await search.hover();
    await expect(search).not.toHaveCSS('color', restingColor);
    // Wait for the search hover transition before comparing the two controls.
    await search.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    const hoverColor = await search.evaluate(el => getComputedStyle(el).color);
    await account.hover();
    await expect(account.locator('svg')).toHaveCSS('cursor', 'pointer');
    await expect(account).toHaveCSS('color', hoverColor);
    await page.mouse.move(0, 0);
    await expect(account).toHaveCSS('color', restingColor);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(account).toBeHidden();
    await page.locator('.mobile-menu-toggle').click();
    await expect(account.locator('span')).toHaveText(label);
    await expect(account.locator('span')).toBeVisible();
    await expect(account).toBeDisabled();
    await expectTrailingPlane();
  });
}
