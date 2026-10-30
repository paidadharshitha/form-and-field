import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Product } from '../src/lib/catalogue';

const endpoint = 'https://dummyjson.com/products?**';
const products: Product[] = [
  {
    id: 1,
    title: 'Silk Lipstick',
    description: 'A soft everyday lipstick.',
    category: 'beauty',
    price: 12,
    rating: 4.1,
    thumbnail: 'https://images.example.com/silk.svg',
    stock: 8,
  },
  {
    id: 2,
    title: 'Rose Lipstick',
    description: 'A warm rose shade.',
    category: 'beauty',
    price: 24,
    rating: 4.9,
    thumbnail: 'https://images.example.com/rose.svg',
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
    stock: 2,
  },
  {
    id: 5,
    title: 'Travel Kit',
    description: 'Skincare to take along.',
    category: 'skin-care',
    price: 24,
    rating: 3.9,
    thumbnail: 'https://images.example.com/kit.svg',
    stock: 12,
  },
];

async function mockCatalogue(page: Page) {
  await page.route(endpoint, (route) =>
    route.fulfill({ json: { products, total: products.length } }),
  );
}

async function openFilters(page: Page, isMobile: boolean): Promise<Locator> {
  if (isMobile) {
    await page.getByRole('button', { name: /^Filters/ }).click();
    return page.getByRole('dialog', { name: 'Find your fit' });
  }
  return page.locator('body');
}

async function closeFilters(scope: Locator, isMobile: boolean) {
  if (isMobile)
    await scope.getByRole('button', { name: /^Show \d+ products?$/ }).click();
}

function productTitles(page: Page) {
  return page.getByRole('article').getByRole('heading', { level: 3 });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://images.example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#eeeae2"/></svg>',
    }),
  );
});

test('search, category, inclusive price range, and sorting work together', async ({
  page,
  isMobile,
}) => {
  await mockCatalogue(page);
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  await page
    .getByRole('searchbox', { name: 'Search products by name' })
    .fill(' LIP ');

  const filters = await openFilters(page, isMobile);
  await filters.getByRole('radio', { name: /^Beauty\b/ }).check();
  await filters
    .getByRole('spinbutton', { name: 'Min price', exact: true })
    .fill('12');
  await filters
    .getByRole('spinbutton', { name: 'Max price', exact: true })
    .fill('24');
  await closeFilters(filters, isMobile);

  await page
    .getByRole('combobox', { name: 'Sort products' })
    .selectOption('rating-desc');
  await expect(productTitles(page)).toHaveText([
    'Rose Lipstick',
    'Silk Lipstick',
  ]);
  await page
    .getByRole('combobox', { name: 'Sort products' })
    .selectOption('price-asc');
  await expect(productTitles(page)).toHaveText([
    'Silk Lipstick',
    'Rose Lipstick',
  ]);

  await expect
    .poll(() => new URL(page.url()).searchParams.get('q'))
    .toBe(' LIP ');
  expect(new URL(page.url()).searchParams.get('category')).toBe('beauty');
  expect(new URL(page.url()).searchParams.get('min')).toBe('12');
  expect(new URL(page.url()).searchParams.get('max')).toBe('24');
  expect(new URL(page.url()).searchParams.get('sort')).toBe('price-asc');
});

test('every sort order is applied to the full collection', async ({ page }) => {
  await mockCatalogue(page);
  await page.goto('/');
  const sort = page.getByRole('combobox', { name: 'Sort products' });
  await sort.selectOption('price-desc');
  await expect(productTitles(page)).toHaveText([
    'Linen Chair',
    'Satin Lipstick',
    'Rose Lipstick',
    'Travel Kit',
    'Silk Lipstick',
  ]);
  await sort.selectOption('rating-asc');
  await expect(productTitles(page)).toHaveText([
    'Travel Kit',
    'Silk Lipstick',
    'Satin Lipstick',
    'Linen Chair',
    'Rose Lipstick',
  ]);
  await sort.selectOption('featured');
  await expect(productTitles(page)).toHaveText(
    products.map((product) => product.title),
  );
});

test('empty results offer a working reset of search and all filters', async ({
  page,
  isMobile,
}) => {
  await mockCatalogue(page);
  await page.goto('/?category=beauty&min=12&max=24');
  await page
    .getByRole('searchbox', { name: 'Search products by name' })
    .fill('no such product');
  await expect(
    page.getByRole('heading', { name: 'No finds this time.' }),
  ).toBeVisible();
  await expect(productTitles(page)).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Clear all filters', exact: true })
    .click();
  await expect(productTitles(page)).toHaveCount(5);
  await expect(
    page.getByRole('searchbox', { name: 'Search products by name' }),
  ).toHaveValue('');
  const filters = await openFilters(page, isMobile);
  await expect(
    filters.getByRole('radio', { name: /^All categories\b/ }),
  ).toBeChecked();
  await expect(
    filters.getByRole('spinbutton', { name: 'Min price', exact: true }),
  ).toHaveValue('');
  await expect(
    filters.getByRole('spinbutton', { name: 'Max price', exact: true }),
  ).toHaveValue('');
  await closeFilters(filters, isMobile);
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('a shared URL and reload preserve the complete catalogue state', async ({
  page,
  isMobile,
}) => {
  await mockCatalogue(page);
  await page.goto('/?q=lip&category=beauty&min=12&max=40&sort=rating-desc');
  await expect(productTitles(page)).toHaveText([
    'Rose Lipstick',
    'Satin Lipstick',
    'Silk Lipstick',
  ]);
  await page.reload();
  await expect(productTitles(page)).toHaveText([
    'Rose Lipstick',
    'Satin Lipstick',
    'Silk Lipstick',
  ]);
  await expect(
    page.getByRole('searchbox', { name: 'Search products by name' }),
  ).toHaveValue('lip');
  await expect(
    page.getByRole('combobox', { name: 'Sort products' }),
  ).toHaveValue('rating-desc');
  const filters = await openFilters(page, isMobile);
  await expect(filters.getByRole('radio', { name: /^Beauty\b/ })).toBeChecked();
  await expect(
    filters.getByRole('spinbutton', { name: 'Min price', exact: true }),
  ).toHaveValue('12');
  await expect(
    filters.getByRole('spinbutton', { name: 'Max price', exact: true }),
  ).toHaveValue('40');
  await closeFilters(filters, isMobile);
});

test('invalid prices explain how to recover', async ({ page, isMobile }) => {
  await mockCatalogue(page);
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  const filters = await openFilters(page, isMobile);
  await filters
    .getByRole('spinbutton', { name: 'Min price', exact: true })
    .fill('100');
  await filters
    .getByRole('spinbutton', { name: 'Max price', exact: true })
    .fill('20');
  await expect(filters.getByRole('alert')).toHaveText(
    'Minimum price must be less than or equal to maximum price.',
  );
  await expect(
    filters.getByRole('spinbutton', { name: 'Min price', exact: true }),
  ).toHaveAttribute('aria-invalid', 'true');
  await closeFilters(filters, isMobile);
  await expect(
    page.getByRole('heading', { name: 'Let’s check that price range.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset filters', exact: true })
    .click();
  await expect(productTitles(page)).toHaveCount(5);
});

test('shows a loading state before products arrive', async ({ page }) => {
  let releaseRequest: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  await page.route(endpoint, async (route) => {
    await gate;
    await route.fulfill({ json: { products } });
  });
  await page.goto('/');
  try {
    await expect(
      page.getByRole('status', { name: 'Loading products' }),
    ).toBeVisible();
    await expect(productTitles(page)).toHaveCount(0);
  } finally {
    releaseRequest();
  }
  await expect(productTitles(page)).toHaveCount(5);
});

test('a failed request can be retried successfully', async ({ page }) => {
  let fail = true;
  await page.route(endpoint, (route) =>
    fail
      ? route.fulfill({ status: 503, json: { error: 'Unavailable' } })
      : route.fulfill({ json: { products } }),
  );
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'We couldn’t load the catalogue.' }),
  ).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(productTitles(page)).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
});

test('malformed API data produces a recoverable error', async ({ page }) => {
  await page.route(endpoint, (route) =>
    route.fulfill({ json: { products: [{ id: 1, title: 'Incomplete' }] } }),
  );
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'We couldn’t load the catalogue.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(productTitles(page)).toHaveCount(0);
});

test('unavailable images retain useful product information', async ({
  page,
}) => {
  await mockCatalogue(page);
  await page.route('https://images.example.com/silk.svg', (route) =>
    route.abort(),
  );
  await page.goto('/');
  const card = page.getByRole('article', { name: 'Silk Lipstick' });
  await expect(card.getByText('Image unavailable')).toBeVisible();
  await expect(card.getByText('$12.00')).toBeVisible();
  await expect(
    card.getByRole('heading', { name: 'Silk Lipstick' }),
  ).toBeVisible();
});

test('the layout fits its viewport, including long searches and filter controls', async ({
  page,
  isMobile,
}) => {
  await mockCatalogue(page);
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page
    .getByRole('searchbox', { name: 'Search products by name' })
    .fill('a'.repeat(150));
  await expect(
    page.getByRole('heading', { name: 'No finds this time.' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  const filters = await openFilters(page, isMobile);
  await expect(
    filters.getByRole('spinbutton', { name: 'Max price', exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await closeFilters(filters, isMobile);
});

test('mobile filter dialog supports Escape and restores keyboard focus', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The desktop filters remain on the page.');
  await mockCatalogue(page);
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  const trigger = page.getByRole('button', { name: /^Filters/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Find your fit' });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole('spinbutton', { name: 'Min price', exact: true })
    .focus();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('expanding results and changing filters resets the visible batch', async ({
  page,
}) => {
  const largeCollection = Array.from({ length: 30 }, (_, index): Product => ({
    id: index + 1,
    title: `Everyday Product ${index + 1}`,
    description: 'A product for pagination testing.',
    category: 'beauty',
    price: index + 1,
    rating: 4,
    thumbnail: 'https://images.example.com/product.svg',
    stock: 1,
  }));
  await page.route(endpoint, (route) =>
    route.fulfill({ json: { products: largeCollection } }),
  );
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(24);
  await page.getByRole('button', { name: 'Explore more' }).click();
  await expect(productTitles(page)).toHaveCount(30);
  await expect(page.getByRole('button', { name: 'Explore more' })).toHaveCount(
    0,
  );

  await page
    .getByRole('searchbox', { name: 'Search products by name' })
    .fill('Product 30');
  await expect(productTitles(page)).toHaveText(['Everyday Product 30']);
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(productTitles(page)).toHaveCount(24);
  await expect(
    page.getByRole('button', { name: 'Explore more' }),
  ).toBeVisible();
});

test('catalogue and mobile filters pass automated accessibility checks', async ({
  page,
  isMobile,
}) => {
  await mockCatalogue(page);
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect.soft(results.violations).toEqual([]);
  if (isMobile) {
    await openFilters(page, isMobile);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});
