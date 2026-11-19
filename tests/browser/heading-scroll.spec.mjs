import { test, expect } from './site-test.mjs';

test('a reader can navigate article headings by keyboard and reopen a section link', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/leader/');
  const title = page.locator('main h1');
  const section = page.locator('article h2').first();
  const id = await section.getAttribute('id');
  await page.keyboard.press('Alt+ArrowDown');
  await expect(title.locator('.heading-scroll')).toBeFocused();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(section.locator('.heading-scroll')).toBeFocused();
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#' + id);
  await expect.poll(() => section.evaluate(node => Math.abs(node.getBoundingClientRect().top - 24))).toBeLessThanOrEqual(1);
  await page.keyboard.press('Alt+ArrowUp');
  await expect(title.locator('.heading-scroll')).toBeFocused();
  await page.goBack();
  await page.reload();
  await expect(page.locator(':target')).toHaveAttribute('id', id);
  await expect(section).toBeInViewport();
});

test('repeated shortcuts advance while the previous scroll is in flight', async ({ page }) => {
  await page.goto('/leader/');
  await page.evaluate(() => { window.scrollTo = () => {}; });
  for (let i = 0; i < 3; i++) await page.keyboard.press('Alt+ArrowDown');
  const id = await page.locator('article h2').nth(1).getAttribute('id');
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#' + id);
});
