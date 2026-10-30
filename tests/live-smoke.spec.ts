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

  await cards
    .first()
    .getByRole('button', { name: /^View details for / })
    .click();
  const quickView = page.getByRole('dialog');
  await expect(quickView).toBeVisible();
  await expect(quickView.getByRole('img')).toBeVisible();
  await page.screenshot({
    path: `/tmp/form-field-quickview-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  await page.keyboard.press('Escape');
  await expect(quickView).not.toBeVisible();

  for (let index = 0; index < 2; index += 1) {
    await cards
      .nth(index)
      .getByRole('button', { name: /^Compare / })
      .click();
  }
  await page
    .getByRole('button', { name: 'Compare products', exact: true })
    .click();
  const comparison = page.getByRole('dialog', { name: 'Compare your finds' });
  await expect(comparison).toBeVisible();
  await expect(comparison.getByRole('table')).toBeVisible();
  await page.screenshot({
    path: `/tmp/form-field-compare-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  expect(errors).toEqual([]);
});
