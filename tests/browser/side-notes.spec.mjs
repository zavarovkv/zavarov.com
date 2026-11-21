import { test, expect } from './site-test.mjs';

test('published footnotes move from the desktop margin to mobile endnotes', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/10-evils/#fn:5');
  await page.evaluate(() => document.fonts.ready);
  const article = page.locator('article');
  const notes = page.locator('.footnotes > ol > li');
  await expect(article).toHaveClass(/has-side-notes/);
  await expect(page.locator('#recent-sidebar')).toHaveCount(0);
  await expect(notes.first()).toHaveCSS('font-size','14px');
  await expect(notes.first()).toHaveCSS('line-height','20px');
  await expect.poll(() => article.evaluate(article => {
    const a = article.getBoundingClientRect();
    let bottom = -Infinity;
    return [...article.querySelectorAll('.footnotes > ol > li')].every(note => {
      const r = note.getBoundingClientRect();
      const clear = r.top >= bottom && r.left > a.right && r.right <= document.documentElement.clientWidth && r.bottom <= a.bottom + 1;
      bottom = r.bottom;
      return clear;
    });
  })).toBe(true);
  expect(await notes.first().evaluate(note => {
    const n = getComputedStyle(note), p = getComputedStyle(document.querySelector('article > p'));
    return n.fontFamily === p.fontFamily && n.fontWeight === p.fontWeight && n.color !== p.color;
  })).toBe(true);
  await expect(page.locator('[id="fn:5"]')).toBeInViewport();
  await expect(notes.first().locator('.beauty-footnote-number')).toBeVisible();
  const copy = await notes.allTextContents();
  await page.setViewportSize({width:390,height:900});
  await expect(article).not.toHaveClass(/has-side-notes/);
  await expect(notes.first()).toHaveCSS('font-size','15px');
  await expect(notes.first()).toHaveCSS('line-height','22px');
  await expect(notes.first().locator('.beauty-footnote-number')).toBeVisible();
  expect(await notes.allTextContents()).toEqual(copy);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
