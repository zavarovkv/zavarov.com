import { test, expect } from './site-test.mjs';

test('the yellow avatar plays once per hover and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const avatar = page.locator('.title-avatar-container');
  const overlay = avatar.locator('.title-avatar-motion');
  const animation = () => overlay.evaluate(el => getComputedStyle(el).animationName);
  await expect(avatar.locator('img')).toHaveAttribute('src', /avatar2\.webp/);
  await expect(overlay).toHaveCount(1);
  await avatar.hover();
  await expect.poll(animation).toBe('avatar-strip');
  await overlay.evaluate(el => el.getAnimations()[0].finished);
  await expect.poll(() => overlay.evaluate(el => getComputedStyle(el).backgroundPositionX)).toBe('100%');
  await page.mouse.move(0, 0);
  await expect.poll(animation).toBe('none');
  await avatar.hover();
  await expect.poll(animation).toBe('avatar-strip');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(animation).toBe('none');
});
