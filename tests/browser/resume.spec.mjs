import { test, expect } from './site-test.mjs';

test('the full Russian CV keeps real content readable across widths and print', async ({ page, browserName }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/cv/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('main')).toHaveAttribute('data-pagefind-ignore', 'all');
  await expect(page.locator('#site-search')).toHaveCount(0);
  await expect(page.locator('.resume-entry').first()).toBeVisible();
  for (const width of [240, 600, 601, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.locator('.resume').evaluate(root => [...root.querySelectorAll('*')]
      .filter(node => getComputedStyle(node).display !== 'inline' && node.scrollWidth > node.clientWidth + 1)
      .map(node => node.className || node.tagName));
    expect(overflow, `CV content at ${width}px`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('h1 .heading-scroll').click();
  const headings = page.locator('.heading-scrollable');
  for (let index = 1; index < await headings.count(); index++) {
    await page.keyboard.press('Alt+ArrowDown');
    await expect(headings.nth(index).locator('.heading-scroll')).toBeFocused();
  }
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#' + await headings.last().getAttribute('id'));
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
  await expect(page.locator('.resume')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  if (browserName === 'chromium') {
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    if (process.env.BROWSER_HUGO_CONFIG?.includes('als-story.toml')) {
      expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(3);
    }
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  }
  expect(errors).toEqual([]);
});

test.describe('CV without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('contacts and work history are available on paper', async ({ page }) => {
    await page.goto('/cv/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.resume-contacts a[href^="tel:"]')).toBeVisible();
    await expect(page.locator('.resume-contacts a[href^="mailto:"]')).toBeVisible();
    await expect(page.locator('#experience')).toBeVisible();
    await expect(page.locator('.resume-entry').first()).toBeVisible();
  });
});
