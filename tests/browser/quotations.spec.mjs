import {test, expect} from '@playwright/test';
import {readdir, readFile} from 'node:fs/promises';
import {readDocument} from '../../scripts/lib/content.mjs';
import {marked} from 'marked';

const pages=[];
for (const lang of ['ru','en']) {
  for (const relative of ['consultation.md', ...(await readdir(`content/${lang}/blog`)).filter(x=>x.endsWith('.md')).map(x=>`blog/${x}`)]) {
    const {data,body}=readDocument(await readFile(`content/${lang}/${relative}`,'utf8'));
    const count=marked.lexer(body).filter(t=>t.type==='blockquote').length
      +(body.match(/<figure class="beauty-quotation/g)||[]).length;
    if (!count) continue;
    const slug=(data.url||data.slug||relative.replace(/^blog\//,'').replace(/\.md$/,'')).replace(/^\/+|\/+$/g,'');
    pages.push({path:`/${lang==='en'?'en/':''}${slug}/`,count});
  }
}
for (const scheme of ['light','dark']) test(`all RU and EN quotations share the editorial layout (${scheme})`, async({page})=>{
  await page.emulateMedia({colorScheme:scheme});
  for(const width of [390,1440]) {
    await page.setViewportSize({width,height:900});
    for(const {path,count} of pages) {
      await page.goto(path);
      await page.evaluate(()=>document.fonts.ready);
      const figures=page.locator('article .beauty-quotation');
      await expect(figures, path).toHaveCount(count);
      await expect(page.locator('article blockquote.beauty-callout'),path).toHaveCount(0);
      for(const figure of await figures.all()) {
        const geometry=await figure.evaluate(el=>({width:el.getBoundingClientRect().width,quoteWidth:el.firstElementChild.getBoundingClientRect().width}));
        expect(geometry.width,path).toBeLessThanOrEqual(640.5);
        expect(Math.abs(geometry.width-geometry.quoteWidth),path).toBeLessThan(1);
        const quote=figure.locator(':scope > blockquote');
        await expect(quote).toHaveCSS('border-left-width','0px');
        await expect(quote).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
        await expect(quote).toHaveCSS('font-size',path.endsWith('/consultation/')?'20px':width>768?'18px':'19px');
        await expect(figure.locator('.beauty-hanging-open')).toHaveCount(1);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
    }
  }
});
