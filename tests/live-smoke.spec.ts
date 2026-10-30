import { expect, test } from '@playwright/test';

test('live API renders products and imagery', async ({ page, isMobile }) => {
  test.skip(
    !process.env.LIVE_SMOKE,
    'Run explicitly with LIVE_SMOKE=1; normal tests use deterministic fixtures.',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(24, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  const firstImage = cards.first().getByRole('img');
  await expect(firstImage).toBeVisible();
  await expect
    .poll(
      () =>
        firstImage.evaluate(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0,
        ),
      { timeout: 10000 },
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: `/tmp/form-field-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  expect(errors).toEqual([]);
});
