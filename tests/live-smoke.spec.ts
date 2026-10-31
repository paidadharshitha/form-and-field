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
  if (isMobile) {
    await expect(
      cards.first().getByRole('heading', { level: 3 }),
    ).toBeInViewport({
      ratio: 1,
    });
  }
  const device = isMobile ? 'mobile' : 'desktop';
  const originalViewport = page.viewportSize();
  const scrollToCards = async () => {
    await cards.first().evaluate((element) =>
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - 110,
        behavior: 'instant',
      }),
    );
  };
  await scrollToCards();
  await page.screenshot({ path: `/tmp/form-field-cards-${device}.png` });
  const detailImage = await firstImage.evaluate((image) => ({
    source: image instanceof HTMLImageElement ? image.currentSrc : '',
    naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0,
    renderedWidth: image.getBoundingClientRect().width,
  }));
  const thumbnailWidth = await page.evaluate(
    (source) =>
      new Promise<number>((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image.naturalWidth);
        image.onerror = () => resolve(0);
        image.src = source;
      }),
    products[0].thumbnail,
  );
  const pricePositions = await cards
    .locator('.product-price')
    .evaluateAll((prices) =>
      prices.slice(0, 3).map((price) => price.getBoundingClientRect().top),
    );
  console.log(
    JSON.stringify({ device, detailImage, thumbnailWidth, pricePositions }),
  );
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await scrollToCards();
  await page.screenshot({ path: `/tmp/form-field-list-${device}.png` });
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  const spotWidth = isMobile ? 320 : 850;
  await page.setViewportSize({ width: spotWidth, height: 1000 });
  await scrollToCards();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: `/tmp/form-field-cards-${spotWidth}.png` });
  if (originalViewport) await page.setViewportSize(originalViewport);
  await page
    .getByRole('button', { name: 'Help me choose', exact: true })
    .click();
  const finder = page.getByRole('region', {
    name: 'Guided product finder',
    exact: true,
  });
  await expect(
    finder.getByRole('button', { name: 'Find my matches', exact: true }),
  ).toBeVisible();
  await finder.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await page.screenshot({
    path: `/tmp/form-field-finder-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  await finder
    .getByRole('button', { name: 'Close finder', exact: true })
    .click();

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
  await quickView
    .getByRole('button', { name: 'Zoom out of product image', exact: true })
    .click();
  const reviews = quickView.getByRole('region', {
    name: 'Reviews',
    exact: true,
  });
  await reviews.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await expect(
    reviews.getByRole('heading', { name: 'Reviews', exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: `/tmp/form-field-reviews-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  const related = quickView.getByRole('region', {
    name: 'Similar products',
    exact: true,
  });
  if (await related.count()) {
    await related.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await page.screenshot({ path: `/tmp/form-field-related-${device}.png` });
  }
  await quickView
    .getByRole('button', { name: `Save ${galleryProduct.title}`, exact: true })
    .click();
  await quickView
    .getByRole('button', {
      name: `Unsave ${galleryProduct.title}`,
      exact: true,
    })
    .click();
  const undoMessage = quickView.getByText(
    `${galleryProduct.title} removed from Saved.`,
    { exact: true },
  );
  await expect(undoMessage).toBeVisible();
  await undoMessage.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await page.screenshot({
    path: `/tmp/form-field-undo-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  await quickView
    .getByRole('button', { name: 'Dismiss notification', exact: true })
    .click();
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
  await page.goto('/?brand=__missing_brand__');
  const recovery = page.getByRole('group', {
    name: 'Ways to find a match',
    exact: true,
  });
  await expect(recovery).toBeVisible();
  await recovery.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await page.screenshot({
    path: `/tmp/form-field-empty-${isMobile ? 'mobile' : 'desktop'}.png`,
  });
  expect(errors).toEqual([]);
});
