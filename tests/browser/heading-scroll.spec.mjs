import {test, expect} from '@playwright/test';

for(const width of [390,1440]) test(`H1 and H2 align to the viewport with shareable fragment URLs (${width})`,async({page})=>{
  await page.setViewportSize({width,height:800});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const path of ['/blog/','/en/blog/','/leader/','/en/leader/']){
    await page.goto(path);await page.evaluate(()=>document.fonts.ready);
    const title=page.locator('main h1');
    await expect(title.locator('.heading-scroll')).toHaveCount(1);
    await expect(title.locator('svg')).toHaveCount(0);
    const typography=await title.evaluate(h=>{const a=getComputedStyle(h.querySelector('.heading-scroll'));const b=getComputedStyle(h);return a.font===b.font && a.color===b.color;});
    expect(typography).toBe(true);
    const initialURL=page.url();
    await title.click({position:{x:80,y:20}});
    await expect.poll(()=>title.evaluate(h=>Math.abs(h.getBoundingClientRect().top - 24))).toBeLessThanOrEqual(1);
    expect(page.url()).toBe(initialURL+'#page-title');
    expect(await page.locator('body > header').evaluate(h=>h.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
    if(path.includes('leader')){
      const heading=page.locator('main h2').first();
      const id=await heading.getAttribute('id');
      await expect(heading.locator('.heading-anchor')).toHaveCount(0);
      await heading.locator('.heading-scroll').focus();
      await page.keyboard.press('Enter');
      await expect.poll(()=>heading.evaluate(h=>Math.abs(h.getBoundingClientRect().top - 24))).toBeLessThanOrEqual(1);
      expect(await heading.getAttribute('id')).toBe(id);
      expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#'+id);
      await page.evaluate(()=>scrollTo(0,0));
      await heading.locator('.heading-scroll').focus();
      const historyLength=await page.evaluate(()=>history.length);
      await page.keyboard.press('Space');
      expect(await page.evaluate(()=>history.length)).toBe(historyLength);
      await expect.poll(()=>heading.evaluate(h=>Math.abs(h.getBoundingClientRect().top - 24))).toBeLessThanOrEqual(1);
    }
    if(path.includes('leader')) {
      await page.goBack();
      expect(new URL(page.url()).hash).toBe('#page-title');
      await page.goForward();
      expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#'+await page.locator('main h2').first().getAttribute('id'));
    }
    await page.reload();
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator(':target')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('heading controls preserve links, text selection, native fragments and print',async({page})=>{
  await page.goto('/leader/');
  const h=page.locator('main h2').first();const id=await h.getAttribute('id');
  await page.evaluate(()=>{window.scrollCalls=[];window.scrollTo=(options)=>window.scrollCalls.push(options);});
  await h.click({position:{x:80,y:12}});
  expect(await page.evaluate(()=>window.scrollCalls.at(-1).behavior)).toBe('smooth');
  await h.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el.firstChild);const s=getSelection();s.removeAllRanges();s.addRange(r);el.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  expect(await page.evaluate(()=>window.scrollCalls.length)).toBe(1);
  await h.evaluate(el=>{getSelection().removeAllRanges();const a=document.createElement('a');a.href='#kept';a.textContent='Link';a.onclick=e=>e.preventDefault();el.append(a);a.click();});
  expect(await page.evaluate(()=>window.scrollCalls.length)).toBe(1);
  await page.goto('/leader/#'+id);
  await expect(page.locator('#'+id)).toBeInViewport();
  await page.emulateMedia({media:'print'});
  await expect(page.locator('main h1 .heading-scroll')).toBeVisible();
  await expect(page.locator('main h1')).not.toHaveText('');
});

test('touch and no-JavaScript headings preserve text and native anchors',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true});
  const page=await context.newPage();await page.goto('/leader/');
  const link=page.locator('main h1 .heading-scroll');
  await expect(link.locator('svg')).toHaveCount(0);
  await link.tap();await expect(page).toHaveURL(/#page-title$/);
  await context.close();
  const plain=await browser.newContext({baseURL,javaScriptEnabled:false});const p=await plain.newPage();await p.goto('/leader/');
  await expect(p.locator('.heading-scroll')).toHaveCount(0);
  await expect(p.locator('h2 .heading-anchor').first()).toHaveCount(1);
  await plain.close();
});

for (const path of ['/leader/', '/en/leader/']) test(`Alt arrows navigate headings without wrapping (${path})`, async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(path);await page.evaluate(()=>document.fonts.ready);
  const headings=page.locator('main .heading-scrollable');
  for (const i of [0,1,2]) {
    await page.keyboard.press('Alt+ArrowDown');
    const heading=headings.nth(i);
    await expect.poll(()=>heading.evaluate(h=>Math.abs(h.getBoundingClientRect().top-24))).toBeLessThanOrEqual(1);
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#'+await heading.getAttribute('id'));
    await expect(heading.locator('.heading-scroll')).toBeFocused();
    await expect(heading.locator('.heading-scroll')).toHaveCSS('outline-style', 'none');
  }
  await page.keyboard.press('Alt+ArrowUp');
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#'+await headings.nth(1).getAttribute('id'));
  await page.keyboard.press('Alt+ArrowUp');
  const url=page.url();await page.keyboard.press('Alt+ArrowUp');expect(page.url()).toBe(url);
  await page.evaluate(()=>scrollBy(0,30));
  await page.keyboard.press('Alt+ArrowUp');
  await expect.poll(()=>headings.first().evaluate(h=>Math.abs(h.getBoundingClientRect().top-24))).toBeLessThanOrEqual(1);
  const last=headings.last();await last.locator('.heading-scroll').focus();await page.keyboard.press('Enter');
  const end=page.url();await page.keyboard.press('Alt+ArrowDown');expect(page.url()).toBe(end);
});

test('heading shortcuts respect editing, overlays and modifiers', async ({page})=>{
  await page.goto('/leader/');await page.evaluate(()=>document.fonts.ready);
  const original=page.url();
  await page.evaluate(()=>{const input=document.createElement('input');input.id='review-input';document.querySelector('main').prepend(input);input.focus();});
  await page.keyboard.press('Alt+ArrowDown');expect(page.url()).toBe(original);
  await page.locator('#review-input').evaluate(e=>e.remove());
  await page.evaluate(()=>document.body.classList.add('menu-open'));
  await page.keyboard.press('Alt+ArrowDown');expect(page.url()).toBe(original);
  await page.evaluate(()=>document.body.classList.remove('menu-open'));
  await page.keyboard.press('Alt+Shift+ArrowDown');expect(page.url()).toBe(original);
});

test('rapid heading shortcuts advance the in-flight destination', async ({page})=>{
  // Modified native shortcuts may scroll the previous scenario on Linux.
  // Test pending destinations independently, from a known viewport position.
  await page.goto('/leader/');await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await page.evaluate(()=>{getSelection().removeAllRanges();window.scrollTo=()=>{};});
  // With scrolling still in flight, distinct presses must advance the destination.
  await page.keyboard.press('Alt+ArrowDown');await page.keyboard.press('Alt+ArrowDown');await page.keyboard.press('Alt+ArrowDown');
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#'+await page.locator('main h2').nth(1).getAttribute('id'));
});

test('Tab restores the focus outline after a heading shortcut', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/leader/');
  const title = page.locator('main h1 .heading-scroll');
  await page.keyboard.press('Alt+ArrowDown');
  await expect(title).toBeFocused();
  await expect(title).toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Tab');
  await expect(title).not.toHaveClass(/heading-shortcut-focus/);
  await title.focus();
  await expect(title).toHaveCSS('outline-style', 'dotted');
});
