import {test, expect} from '@playwright/test';

test('Mirta loads for quote blocks while prose and attributions keep Story', async ({page}) => {
  test.skip(!process.env.BROWSER_HUGO_CONFIG?.split(',').includes('config/fonts/mirta.toml'), 'Private quotation profile is not selected');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({colorScheme});
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({width, height:900});
      for (const path of ['/consultation/', '/en/consultation/', '/kotler/', '/en/kotler/', '/books/management-book-druker/']) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const quotes = page.locator('main blockquote');
        expect(await quotes.count()).toBeGreaterThan(0);
        for (const quote of await quotes.all()) {
          await expect(quote).toHaveCSS('font-family', /^"?ALS Mirta/);
          await expect(quote).toHaveCSS('font-weight', '400');
          await expect(quote).toHaveCSS('font-style', 'normal');
          await expect(quote).toHaveCSS('font-synthesis', 'none');
        }
        expect(await page.evaluate(() => [...document.fonts].some(font => /ALS Mirta/i.test(font.family) && font.status === 'loaded'))).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (path.endsWith('/consultation/')) {
          await expect(page.locator('.beauty-quotation figcaption')).toHaveCSS('font-family', /^"?ALS Story/);
          const signature = await page.locator('.beauty-quotation').evaluate(figure => {
            const caption = figure.querySelector('figcaption');
            return {
              edge: figure.getBoundingClientRect().right,
              signatureEdge: caption.lastElementChild.getBoundingClientRect().right,
              dashLeft: caption.firstElementChild.getBoundingClientRect().left,
              quoteLeft: figure.getBoundingClientRect().left,
            };
          });
          expect(Math.abs(signature.edge - signature.signatureEdge)).toBeLessThan(1);
          expect(signature.dashLeft).toBeGreaterThanOrEqual(signature.quoteLeft);
          await expect(quotes.first()).toHaveCSS('font-size', '20px');
          await expect(quotes.first()).toHaveCSS('line-height', '30px');
        } else {
          await expect(page.locator('article > p').first()).toHaveCSS('font-family', /^"?ALS Story/);
          await expect(quotes.first()).toHaveCSS('font-size', width > 768 ? '18px' : '19px');
        }
        for (const mark of await page.locator('.beauty-quotation .beauty-hanging-open').all()) {
          await expect(mark).toHaveCSS('scale', '1.4');
        }
      }
    }
  }
  await page.goto('/consultation/');
  await page.emulateMedia({media:'print'});
  await expect(page.locator('.beauty-quotation blockquote')).toHaveCSS('font-family', /^"?ALS Mirta/);
  await expect(page.locator('.beauty-quotation figcaption')).toHaveCSS('font-family', /^"?ALS Story/);
  await expect(page.locator('.beauty-quotation .beauty-hanging-open')).toHaveCSS('scale', '1');
});

test('quote attribution alignment covers native captions and wraps long signatures', async ({page}) => {
  await page.goto('/consultation/');
  await page.evaluate(() => {
    document.querySelector('.beauty-quotation figcaption > span:last-child').textContent =
      'Александр Константинович, руководитель направления продуктового маркетинга и исследований';
    const fixture = document.createElement('section');
    fixture.innerHTML = '<blockquote><p>Quote</p><footer id="quote-footer">Author</footer></blockquote><figure><blockquote><p>Quote</p></blockquote><figcaption id="quote-caption">Source</figcaption></figure><figure><img alt="Image"><figcaption id="image-caption">Caption</figcaption></figure>';
    document.querySelector('main').append(fixture);
  });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({width, height:900});
    const result = await page.evaluate(() => {
      const figure = document.querySelector('.beauty-quotation');
      const caption = figure.querySelector('figcaption');
      const range = document.createRange();
      range.selectNodeContents(caption.lastElementChild);
      const textRects = [...range.getClientRects()];
      const bounds = figure.getBoundingClientRect();
      return {
        contained: textRects.every(r => r.left >= bounds.left - 1 && r.right <= bounds.right + 1),
        rightGap: bounds.right - textRects.at(-1).right,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(result.contained).toBe(true);
    expect(Math.abs(result.rightGap)).toBeLessThan(1);
    expect(result.overflow).toBe(false);
    await expect(page.locator('#quote-footer')).toHaveCSS('text-align', 'end');
    await expect(page.locator('#quote-caption')).toHaveCSS('text-align', 'end');
    await expect(page.locator('#image-caption')).toHaveCSS('text-align', /^(start|left)$/);
  }
});

test('the licensed title face styles article H1 and H2 while other roles keep Story', async ({page}) => {
  test.skip(!process.env.BROWSER_HUGO_CONFIG?.split(',').includes('config/fonts/sourdine.toml'), 'Private font profile is not selected');
  const fontFailures = [];
  page.on('response', response => {
    if (response.url().includes('/private-fonts/') && !response.ok()) fontFailures.push(response.status());
  });
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({colorScheme});
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({width, height:900});
      for (const path of ['/books/sabirov/', '/en/books/sabirov/']) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const title = page.locator('h1');
        await expect(title).toHaveCSS('font-family', /^"?ALS Sourdine/);
        await expect(title).toHaveCSS('font-weight', '500');
        await expect(title).toHaveCSS('font-size', width > 768 ? '44px' : '32px');
        await expect(title).toHaveCSS('letter-spacing', width > 768 ? 'normal' : '-0.32px');
        await expect(page.locator('article > p').first()).toHaveCSS('font-family', /^"?ALS Story/);
        const section = page.locator('article h2').first();
        await expect(section).toHaveCSS('font-family', /^"?ALS Sourdine/);
        await expect(section).toHaveCSS('font-weight', '500');
        await expect(section).toHaveCSS('font-size', '24px');
        await expect(section).toHaveCSS('line-height', '30px');
        await expect(page.locator('article h3').first()).toHaveCSS('font-family', /^"?ALS Story/);
        await expect(page.locator('article h3').first()).toHaveCSS('font-weight', '700');
        expect(await page.evaluate(() => [...document.fonts].some(font => /ALS Sourdine/i.test(font.family) && font.status === 'loaded'))).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      for (const path of ['/', '/en/', '/blog/', '/en/blog/']) {
        await page.goto(path);
        await expect(page.locator('.blog-posts a').first()).toHaveCSS('font-family', /^"?ALS Story/);
        const headings = page.locator('.posts-group-title');
        expect(await headings.count()).toBeGreaterThan(0);
        for (const heading of await headings.all()) {
          await expect(heading).toHaveCSS('font-family', /^"?ALS Story/);
          await expect(heading).toHaveCSS('font-weight', '700');
        }
      }
    }
  }
  for (const path of ['/consultation/', '/en/consultation/']) {
    await page.goto(path);
    await expect(page.locator('article > p').first()).toHaveCSS('font-family', /^"?ALS Story/);
    // These standalone pages have no authored H2; exercise their heading role
    // without adding artificial content to the published site.
    await page.locator('article').evaluate(article => {
      const heading = document.createElement('h2');
      heading.textContent = 'Standalone section';
      article.append(heading);
    });
    await expect(page.locator('article h2')).toHaveCSS('font-family', /^"?ALS Story/);
    await expect(page.locator('article h2')).toHaveCSS('font-weight', '700');
  }
  await page.goto('/books/sabirov/');
  await page.emulateMedia({media:'print'});
  await expect(page.locator('article h2').first()).toHaveCSS('font-family', /^"?ALS Sourdine/);
  await expect(page.locator('article h2').first()).toHaveCSS('font-weight', '500');
  const printHeading = await page.locator('article h2').first().evaluate(heading => {
    const style = getComputedStyle(heading);
    return {size:parseFloat(style.fontSize), leading:parseFloat(style.lineHeight)};
  });
  expect(printHeading.size).toBeCloseTo(16 * 96 / 72, 2);
  expect(printHeading.leading).toBeCloseTo(20 * 96 / 72, 2);
  expect(fontFailures).toEqual([]);
});
