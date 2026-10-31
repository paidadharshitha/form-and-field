import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Product } from '../src/lib/catalogue';

const products: Product[] = [
  {
    id: 1,
    title: 'Silk Lipstick',
    description: 'A soft everyday lipstick with a comfortable finish.',
    category: 'beauty',
    price: 12,
    rating: 4.2,
    thumbnail: 'https://images.example.com/silk-front.svg',
    images: [
      'https://images.example.com/silk-front.svg',
      'https://images.example.com/silk-side.svg',
      'https://images.example.com/silk-back.svg',
    ],
    brand: 'Studio Beauty',
    stock: 8,
  },
  {
    id: 2,
    title: 'Rose Lipstick',
    description: 'A warm rose shade.',
    category: 'beauty',
    price: 16,
    rating: 4.8,
    thumbnail: 'https://images.example.com/rose.svg',
    images: ['https://images.example.com/rose.svg'],
    brand: 'Blossom',
    stock: 4,
  },
  {
    id: 3,
    title: 'Satin Lipstick',
    description: 'A satin finish.',
    category: 'beauty',
    price: 40,
    rating: 4.5,
    thumbnail: 'https://images.example.com/satin.svg',
    images: ['https://images.example.com/satin.svg'],
    brand: 'Studio Beauty',
    stock: 0,
  },
  {
    id: 4,
    title: 'Linen Chair',
    description: 'A comfortable chair.',
    category: 'furniture',
    price: 99,
    rating: 4.8,
    thumbnail: 'https://images.example.com/chair.svg',
    images: ['https://images.example.com/chair.svg'],
    brand: 'Oak & Co',
    stock: 2,
  },
  {
    id: 5,
    title: 'Travel Kit',
    description: 'Skincare to take along on a longer journey.',
    category: 'skin-care',
    price: 24,
    rating: 3.9,
    thumbnail: 'https://images.example.com/kit.svg',
    images: ['https://images.example.com/kit.svg'],
    brand: 'Studio Beauty',
    stock: 12,
  },
];

function searchField(page: Page) {
  return page.getByRole('combobox', { name: 'Search products by name' });
}

function productTitles(page: Page) {
  return page.getByRole('article').getByRole('heading', { level: 3 });
}

async function openProduct(page: Page, title: string) {
  await page
    .getByRole('article', { name: title, exact: true })
    .getByRole('button', { name: `View details for ${title}`, exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: title, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openFilters(page: Page, isMobile: boolean): Promise<Locator> {
  if (isMobile) {
    await page.getByRole('button', { name: /^Filters/ }).click();
    return page.getByRole('dialog', { name: 'Find your fit' });
  }
  return page.locator('body');
}

async function closeFilters(scope: Locator, isMobile: boolean) {
  if (isMobile) {
    await scope.getByRole('button', { name: /^Show \d+ products?$/ }).click();
  }
}

async function assertViewportFits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.route('https://dummyjson.com/products?**', (route) =>
    route.fulfill({ json: { products, total: products.length } }),
  );
  await page.route('https://images.example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#eeeae2"/></svg>',
    }),
  );
});

test('typo matching and keyboard suggestions help find a product', async ({
  page,
}) => {
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  const search = searchField(page);
  await search.fill('lipstik');
  await expect(productTitles(page)).toHaveText([
    'Silk Lipstick',
    'Rose Lipstick',
    'Satin Lipstick',
  ]);
  const suggestions = page.getByRole('listbox', {
    name: 'Product suggestions',
  });
  await expect(suggestions.getByRole('option')).toHaveCount(3);
  await expect(search).toHaveAttribute('aria-expanded', 'true');
  await search.press('ArrowDown');
  await expect(
    suggestions.getByRole('option', { name: /Silk Lipstick/ }),
  ).toHaveAttribute('aria-selected', 'true');
  await search.press('ArrowDown');
  await expect(
    suggestions.getByRole('option', { name: /Rose Lipstick/ }),
  ).toHaveAttribute('aria-selected', 'true');
  await search.press('ArrowUp');
  await search.press('Enter');
  await expect(search).toHaveValue('Silk Lipstick');
  await expect(productTitles(page)).toHaveText(['Silk Lipstick']);
  await expect(search).toHaveAttribute('aria-expanded', 'false');

  await search.fill('lipstik');
  await expect(suggestions).toBeVisible();
  await search.press('Escape');
  await expect(suggestions).not.toBeVisible();
  await expect(search).toHaveValue('lipstik');
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(productTitles(page)).toHaveCount(5);
});

test('brand filtering combines with category and price, survives reload, and resets', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  const filters = await openFilters(page, isMobile);
  await filters
    .getByRole('combobox', { name: 'Filter by brand', exact: true })
    .selectOption('Studio Beauty');
  await filters.getByRole('radio', { name: /^Beauty\b/ }).check();
  await filters
    .getByRole('spinbutton', { name: 'Max price', exact: true })
    .fill('20');
  await closeFilters(filters, isMobile);
  await expect(productTitles(page)).toHaveText(['Silk Lipstick']);
  await expect
    .poll(() => new URL(page.url()).searchParams.get('brand'))
    .toBe('Studio Beauty');
  await page.reload();
  await expect(productTitles(page)).toHaveText(['Silk Lipstick']);
  const restoredFilters = await openFilters(page, isMobile);
  await expect(
    restoredFilters.getByRole('combobox', {
      name: 'Filter by brand',
      exact: true,
    }),
  ).toHaveValue('Studio Beauty');
  await closeFilters(restoredFilters, isMobile);
  await searchField(page).fill('no-such-find');
  await page
    .getByRole('button', { name: 'Clear all filters', exact: true })
    .click();
  await expect(productTitles(page)).toHaveCount(5);
  expect(new URL(page.url()).searchParams.has('brand')).toBe(false);
  const clearedFilters = await openFilters(page, isMobile);
  await expect(
    clearedFilters.getByRole('combobox', {
      name: 'Filter by brand',
      exact: true,
    }),
  ).toHaveValue('');
  await closeFilters(clearedFilters, isMobile);
});

test('recently viewed is deduplicated, bounded, persisted, and clearable', async ({
  page,
}) => {
  const collection = Array.from({ length: 9 }, (_, index): Product => ({
    ...products[0],
    id: index + 1,
    title: `Everyday Find ${index + 1}`,
  }));
  await page.route('https://dummyjson.com/products?**', (route) =>
    route.fulfill({ json: { products: collection } }),
  );
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(9);
  for (const product of collection) {
    await openProduct(page, product.title);
    await page.keyboard.press('Escape');
  }
  const readRecent = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem('form-field:recently-viewed:v1') ?? '[]'),
    );
  await expect.poll(readRecent).toEqual([9, 8, 7, 6, 5, 4, 3, 2]);
  await openProduct(page, 'Everyday Find 3');
  await page.keyboard.press('Escape');
  await expect.poll(readRecent).toEqual([3, 9, 8, 7, 6, 5, 4, 2]);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Recently viewed', exact: true }),
  ).toBeVisible();
  await expect.poll(readRecent).toEqual([3, 9, 8, 7, 6, 5, 4, 2]);
  await page
    .getByRole('button', { name: 'Clear recently viewed', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Recently viewed', exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(productTitles(page)).toHaveCount(9);
  await expect(
    page.getByRole('heading', { name: 'Recently viewed', exact: true }),
  ).toHaveCount(0);
});

test('recently viewed stays usable when browser storage is unavailable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException(
          'Storage is disabled for this test.',
          'SecurityError',
        );
      },
    });
  });
  await page.goto('/');
  await openProduct(page, 'Silk Lipstick');
  await page.keyboard.press('Escape');
  const recentlyViewed = page.getByRole('region', {
    name: 'Recently viewed',
    exact: true,
  });
  await expect(recentlyViewed).toBeVisible();
  await expect(
    recentlyViewed.getByText('Your recent finds, kept for this visit.', {
      exact: true,
    }),
  ).toBeVisible();
  await recentlyViewed
    .getByRole('button', { name: 'View Silk Lipstick', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Silk Lipstick', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(productTitles(page)).toHaveCount(5);
  await expect(
    page.getByRole('heading', { name: 'Recently viewed', exact: true }),
  ).toHaveCount(0);
});

test('suggestions and the brand filter remain accessible without overflow', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready);
  await searchField(page).fill('lipstik');
  await expect(
    page.getByRole('listbox', { name: 'Product suggestions' }),
  ).toBeVisible();
  await assertViewportFits(page);
  const searchResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect.soft(searchResults.violations).toEqual([]);
  await searchField(page).press('Escape');
  const filters = await openFilters(page, isMobile);
  await expect(
    filters.getByRole('combobox', { name: 'Filter by brand', exact: true }),
  ).toBeVisible();
  await assertViewportFits(page);
  const filterResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(filterResults.violations).toEqual([]);
});

test('gallery thumbnails support keyboard navigation and inline zoom', async ({
  page,
}) => {
  await page.goto('/');
  const dialog = await openProduct(page, 'Silk Lipstick');
  const gallery = dialog.getByRole('group', {
    name: 'Product images for Silk Lipstick',
  });
  const mainImage = gallery.getByRole('img', {
    name: 'Silk Lipstick',
    exact: true,
  });
  await expect(mainImage).toHaveAttribute(
    'src',
    'https://images.example.com/silk-front.svg',
  );
  const secondThumbnail = gallery.getByRole('button', {
    name: 'Show image 2 of 3',
    exact: true,
  });
  await secondThumbnail.click();
  await expect(secondThumbnail).toHaveAttribute('aria-pressed', 'true');
  await expect(mainImage).toHaveAttribute(
    'src',
    'https://images.example.com/silk-side.svg',
  );
  await secondThumbnail.press('ArrowRight');
  const thirdThumbnail = gallery.getByRole('button', {
    name: 'Show image 3 of 3',
    exact: true,
  });
  await expect(thirdThumbnail).toBeFocused();
  await expect(thirdThumbnail).toHaveAttribute('aria-pressed', 'true');
  await expect(mainImage).toHaveAttribute(
    'src',
    'https://images.example.com/silk-back.svg',
  );
  await thirdThumbnail.press('Home');
  const firstThumbnail = gallery.getByRole('button', {
    name: 'Show image 1 of 3',
    exact: true,
  });
  await expect(firstThumbnail).toBeFocused();
  await expect(firstThumbnail).toHaveAttribute('aria-pressed', 'true');
  await expect(mainImage).toHaveAttribute(
    'src',
    'https://images.example.com/silk-front.svg',
  );
  await gallery
    .getByRole('button', { name: 'Zoom in on product image', exact: true })
    .click();
  await expect(
    gallery.getByRole('button', {
      name: 'Zoom out of product image',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true');
  const zoom = gallery.getByRole('region', {
    name: 'Zoomed product image',
    exact: true,
  });
  await expect(zoom).toBeVisible();
  await zoom.focus();
  const startingScroll = await zoom.evaluate((element) => element.scrollLeft);
  await zoom.press('ArrowRight');
  await expect
    .poll(() => zoom.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(startingScroll);
  await assertViewportFits(page);
  await gallery
    .getByRole('button', { name: 'Zoom out of product image', exact: true })
    .click();
  await expect(
    gallery.getByRole('region', { name: 'Zoomed product image', exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('gallery failures recover with the thumbnail or an informative placeholder', async ({
  page,
}) => {
  await page.route('https://images.example.com/silk-side.svg', (route) =>
    route.abort(),
  );
  await page.route('https://images.example.com/rose.svg', (route) =>
    route.abort(),
  );
  await page.goto('/');
  const dialog = await openProduct(page, 'Silk Lipstick');
  const gallery = dialog.getByRole('group', {
    name: 'Product images for Silk Lipstick',
  });
  await gallery
    .getByRole('button', { name: 'Show image 2 of 3', exact: true })
    .click();
  await expect(
    gallery.getByText(
      'This view couldn’t load. Showing the product thumbnail.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    gallery.getByRole('img', { name: 'Silk Lipstick', exact: true }),
  ).toHaveAttribute('src', 'https://images.example.com/silk-front.svg');
  await page.keyboard.press('Escape');
  const brokenDialog = await openProduct(page, 'Rose Lipstick');
  const brokenGallery = brokenDialog.getByRole('group', {
    name: 'Product images for Rose Lipstick',
  });
  await expect(
    brokenGallery.getByText('Image unavailable', { exact: true }),
  ).toBeVisible();
  await expect(
    brokenGallery.getByRole('button', {
      name: 'Zoom in on product image',
      exact: true,
    }),
  ).toBeDisabled();
});

test('similar products open inside the current page and update viewing history', async ({
  page,
}) => {
  await page.goto('/');
  const originalUrl = page.url();
  const originalTrigger = page
    .getByRole('article', { name: 'Silk Lipstick', exact: true })
    .getByRole('button', {
      name: 'View details for Silk Lipstick',
      exact: true,
    });
  await originalTrigger.focus();
  const dialog = await openProduct(page, 'Silk Lipstick');
  const similar = dialog.getByRole('region', {
    name: 'Similar products',
    exact: true,
  });
  await expect(
    similar.getByRole('button', { name: 'View Rose Lipstick', exact: true }),
  ).toBeVisible();
  await expect(
    similar.getByRole('button', { name: 'View Satin Lipstick', exact: true }),
  ).toHaveCount(0);
  await similar
    .getByRole('button', { name: 'View Rose Lipstick', exact: true })
    .click();
  const nextDialog = page.getByRole('dialog', {
    name: 'Rose Lipstick',
    exact: true,
  });
  await expect(nextDialog).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  expect(page.url()).toBe(originalUrl);
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(
          localStorage.getItem('form-field:recently-viewed:v1') ?? '[]',
        ),
      ),
    )
    .toEqual([2, 1]);
  await page.keyboard.press('Escape');
  await expect(originalTrigger).toBeFocused();
  const recentlyViewed = page.getByRole('region', {
    name: 'Recently viewed',
    exact: true,
  });
  await expect(
    recentlyViewed.getByRole('button', { name: /^View / }),
  ).toHaveCount(2);
  await recentlyViewed
    .getByRole('button', { name: 'View Silk Lipstick', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Silk Lipstick', exact: true }),
  ).toBeVisible();
});

test('gallery, zoom, and similar products remain accessible on both layouts', async ({
  page,
}) => {
  await page.goto('/');
  const dialog = await openProduct(page, 'Silk Lipstick');
  await page.evaluate(() => document.fonts.ready);
  await assertViewportFits(page);
  const galleryResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect.soft(galleryResults.violations).toEqual([]);
  await dialog
    .getByRole('button', { name: 'Zoom in on product image', exact: true })
    .click();
  await expect(
    dialog.getByRole('region', { name: 'Zoomed product image', exact: true }),
  ).toBeVisible();
  await assertViewportFits(page);
  const zoomResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(zoomResults.violations).toEqual([]);
});
