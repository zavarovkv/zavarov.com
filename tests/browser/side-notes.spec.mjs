import {test, expect} from '@playwright/test';
import {sideNoteContracts} from '../../themes/hugo-mini/tests/browser/side-note-contracts.mjs';
sideNoteContracts({test, expect});

for (const colorScheme of ['light', 'dark']) test(`all published footnotes use responsive side notes (${colorScheme})`, async ({page}) => {
  await page.emulateMedia({colorScheme});
  for (const path of ['/nct/', '/en/nct/', '/10-evils/', '/en/10-evils/']) {
    await page.setViewportSize({width:1440,height:900});
    await page.goto(path + (path.includes('10-evils') ? '#fn:5' : ''));
    await page.evaluate(() => document.fonts.ready);
    const article = page.locator('article');
    const notes = page.locator('.footnotes > ol > li');
    await expect(article).toHaveClass(/has-side-notes/);
    await expect(page.locator('#recent-sidebar')).toHaveCount(0);
    await expect(notes.first()).toHaveCSS('font-size','15px');
    await expect(notes.first()).toHaveCSS('line-height','24px');
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
    if (path.includes('10-evils')) await expect(page.locator('[id="fn:5"]')).toBeInViewport();
    await expect(notes.first().locator('.footnote-backref').first()).toBeHidden();
    const copy = await notes.allTextContents();
    await page.setViewportSize({width:390,height:900});
    await expect(article).not.toHaveClass(/has-side-notes/);
    await expect(notes.first()).toHaveCSS('font-size','16px');
    await expect(notes.first()).toHaveCSS('line-height','25.6px');
    await expect(notes.first().locator('.footnote-backref').first()).toBeVisible();
    expect(await notes.allTextContents()).toEqual(copy);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
