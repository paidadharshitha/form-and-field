import { expect, test } from '@playwright/test';
import { parseProducts } from '../src/lib/catalogue';

test('live API renders products and imagery', async ({ page, isMobile }) => {
  test.skip(
    !process.env.LIVE_SMOKE,
    'Run explicitly with LIVE_SMOKE=1; normal tests use deterministic fixtures.',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const dataResponse = page.waitForResponse(
    (response) =>
      response.url().startsWith('https://dummyjson.com/products?') &&
      response.status() === 200,
  );
  await page.goto('/');
  const products = parseProducts(await (await dataResponse).json());
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

  const galleryProduct =
    products
      .slice(0, 24)
      .find((product) => (product.images?.length ?? 0) > 1) ?? products[0];
  await page
    .getByRole('article', { name: galleryProduct.title, exact: true })
    .getByRole('button', {
      name: `View details for ${galleryProduct.title}`,
      exact: true,
    })
    .click();
  const quickView = page.getByRole('dialog');
  await expect(quickView).toBeVisible();
  await expect(
    quickView
      .getByRole('group', { name: /^Product images for / })
      .getByRole('img'),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        quickView
          .getByRole('group', { name: /^Product images for / })
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
          ),
      { timeout: 10000 },
    )
    .toBe(true);
  await page.screenshot({
    path: `/tmp/form-field-quickview-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  await quickView
    .getByRole('button', { name: 'Zoom in on product image', exact: true })
    .click();
  await expect(
    quickView.getByRole('region', { name: 'Zoomed product image' }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/form-field-zoom-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  await page.keyboard.press('Escape');
  await expect(quickView).not.toBeVisible();

  const recentlyViewed = page.getByRole('region', {
    name: 'Recently viewed',
    exact: true,
  });
  await expect(recentlyViewed).toBeVisible();
  await recentlyViewed.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await expect(
    recentlyViewed.getByRole('heading', {
      name: 'Recently viewed',
      exact: true,
    }),
  ).toBeInViewport();
  await page.screenshot({
    path: `/tmp/form-field-recent-${isMobile ? 'mobile' : 'desktop'}.png`,
  });

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
  await page.keyboard.press('Escape');
  const firstTitle = await cards
    .first()
    .getByRole('heading', { level: 3 })
    .innerText();
  await page
    .getByRole('combobox', { name: 'Search products by name' })
    .fill(firstTitle.split(' ')[0]);
  await expect(
    page.getByRole('listbox', { name: 'Product suggestions' }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.screenshot({
    path: `/tmp/form-field-suggestions-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  expect(errors).toEqual([]);
});
