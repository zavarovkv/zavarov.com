import { test, expect } from '@playwright/test';
import { resumeContracts } from '../../themes/hugo-mini/tests/browser/resume-contracts.mjs';
resumeContracts(test, expect);

test('the full Russian CV keeps real content readable across widths and print', async ({ page, browserName }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 768, 601, 600, 430, 390, 375, 360, 320, 240]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/cv/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.resume-entry')).toHaveCount(6);
    await expect(page.locator('.resume > h2')).toHaveCount(4);
    await expect(page.locator('.resume-contacts a')).toHaveCount(2);
    await expect(page.locator('.resume-contacts a').first()).toHaveAttribute('href', 'tel:+79260775212');
    await expect(page.locator('.resume-contacts a').last()).toHaveAttribute('href', 'mailto:zavarovkv@gmail.com');
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
    expect(new Set(ids).size).toBe(ids.length);
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
  await expect(page).toHaveURL(/#mentoring$/);
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
  await expect(page.locator('.resume')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  if (browserName === 'chromium') {
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    if (process.env.BROWSER_HUGO_CONFIG?.includes('als-story.toml')) {
      expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(3);
    }
    // Kept only in ignored local reports when testing licensed fonts.
    await testInfo.attach('cv-print', { body: pdf, contentType: 'application/pdf' });
  }
  expect(errors).toEqual([]);
});
