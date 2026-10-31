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
    rating: 4.1,
    thumbnail: 'https://images.example.com/silk.svg',
    brand: 'Studio Beauty',
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
    title:
      'The Complete Everyday Travel Kit with Full-Size Skincare Essentials and a Reusable Carry Case',
    description: 'Skincare to take along on a longer journey.',
    category: 'skin-care',
    price: 24,
    rating: 3.9,
    thumbnail: 'https://images.example.com/kit.svg',
    stock: 12,
  },
];

function productTitles(page: Page) {
  return page.getByRole('article').getByRole('heading', { level: 3 });
}

function productCard(page: Page, title: string) {
  return page.getByRole('article', { name: title, exact: true });
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

test('quick view exposes product details and restores its keyboard trigger', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = productCard(page, 'Silk Lipstick').getByRole('button', {
    name: 'View details for Silk Lipstick',
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'Silk Lipstick',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('heading', { name: 'Silk Lipstick', exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText(products[0].description, { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText('$12.00', { exact: true })).toBeVisible();
  await expect(
    dialog.getByText('Studio Beauty', { exact: true }),
  ).toBeVisible();
  await assertViewportFits(page);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('saved products persist after reload and empty saved items can be exited', async ({
  page,
}) => {
  await page.goto('/');
  const firstCard = productCard(page, 'Silk Lipstick');
  await firstCard
    .getByRole('button', { name: 'Save Silk Lipstick', exact: true })
    .click();
  await expect(
    firstCard.getByRole('button', {
      name: 'Unsave Silk Lipstick',
      exact: true,
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('form-field:saved-products:v1')),
    )
    .not.toBeNull();

  await page.reload();
  await expect(
    productCard(page, 'Silk Lipstick').getByRole('button', {
      name: 'Unsave Silk Lipstick',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Saved items', exact: true }).click();
  await expect(productTitles(page)).toHaveText(['Silk Lipstick']);
  await productCard(page, 'Silk Lipstick')
    .getByRole('button', { name: 'Unsave Silk Lipstick', exact: true })
    .click();
  await expect(productTitles(page)).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Browse all products', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Browse all products', exact: true })
    .click();
  await expect(productTitles(page)).toHaveCount(products.length);
  await expect(
    productCard(page, 'Silk Lipstick').getByRole('button', {
      name: 'Save Silk Lipstick',
      exact: true,
    }),
  ).toBeVisible();
});

test('comparison enforces three products and lets shoppers remove a choice', async ({
  page,
}) => {
  await page.goto('/');
  for (const title of ['Silk Lipstick', 'Rose Lipstick', 'Satin Lipstick']) {
    await productCard(page, title)
      .getByRole('button', { name: `Compare ${title}`, exact: true })
      .click();
    await expect(
      productCard(page, title).getByRole('button', {
        name: `Remove ${title} from comparison`,
        exact: true,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(
    productCard(page, 'Linen Chair').getByRole('button', {
      name: 'Compare Linen Chair',
      exact: true,
    }),
  ).toBeDisabled();
  const trigger = page.getByRole('button', {
    name: 'Compare products',
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole('dialog', {
    name: 'Compare your finds',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  const table = dialog.getByRole('table');
  await expect(table).toBeVisible();
  const headerBounds = await table.locator('thead').boundingBox();
  expect(headerBounds).not.toBeNull();
  if (headerBounds) {
    for (const image of await table.locator('thead').getByRole('img').all()) {
      const imageBounds = await image.boundingBox();
      expect(imageBounds).not.toBeNull();
      if (imageBounds) {
        expect(imageBounds.y + imageBounds.height).toBeLessThanOrEqual(
          headerBounds.y + headerBounds.height,
        );
      }
    }
  }
  await expect(table.getByText('$12.00', { exact: true })).toBeVisible();
  await expect(table.getByText('$24.00', { exact: true })).toBeVisible();
  await expect(table.getByText('$40.00', { exact: true })).toBeVisible();
  await expect(
    table.getByRole('rowheader', { name: 'Rating', exact: true }),
  ).toBeVisible();
  await assertViewportFits(page);
  await dialog
    .getByRole('button', {
      name: 'Remove Silk Lipstick from comparison',
      exact: true,
    })
    .click();
  await expect(
    dialog.getByRole('button', {
      name: 'Remove Silk Lipstick from comparison',
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(dialog.getByText('$12.00', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(
    productCard(page, 'Linen Chair').getByRole('button', {
      name: 'Compare Linen Chair',
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    productCard(page, 'Silk Lipstick').getByRole('button', {
      name: 'Compare Silk Lipstick',
      exact: true,
    }),
  ).toBeVisible();
});

test('stock and minimum rating work together with the original filters', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(products.length);
  const filters = await openFilters(page, isMobile);
  await filters.getByRole('radio', { name: /^Beauty\b/ }).check();
  await filters
    .getByRole('checkbox', { name: 'In stock only', exact: true })
    .check();
  await filters
    .getByRole('combobox', { name: 'Minimum rating', exact: true })
    .selectOption('4.5');
  await closeFilters(filters, isMobile);
  await expect(productTitles(page)).toHaveText(['Rose Lipstick']);

  const reopenedFilters = await openFilters(page, isMobile);
  await reopenedFilters
    .getByRole('combobox', { name: 'Minimum rating', exact: true })
    .selectOption('4');
  await closeFilters(reopenedFilters, isMobile);
  await page
    .getByRole('combobox', { name: 'Sort products', exact: true })
    .selectOption('rating-desc');
  await expect(productTitles(page)).toHaveText([
    'Rose Lipstick',
    'Silk Lipstick',
  ]);
  await page
    .getByRole('combobox', { name: 'Search products by name' })
    .fill('Satin');
  await expect(
    page.getByRole('heading', { name: 'No finds this time.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Clear all filters', exact: true })
    .click();
  await expect(productTitles(page)).toHaveCount(products.length);
});

test('grid and list views retain products and fit long titles on screen', async ({
  page,
}) => {
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(products.length);
  const grid = page.getByRole('button', { name: 'Grid view', exact: true });
  const list = page.getByRole('button', { name: 'List view', exact: true });
  await expect(grid).toHaveAttribute('aria-pressed', 'true');
  await list.click();
  await expect(list).toHaveAttribute('aria-pressed', 'true');
  await expect(grid).toHaveAttribute('aria-pressed', 'false');
  await expect(productTitles(page)).toHaveText(
    products.map((product) => product.title),
  );
  await assertViewportFits(page);
  await productCard(page, products[4].title)
    .getByRole('button', {
      name: `View details for ${products[4].title}`,
      exact: true,
    })
    .click();
  const dialog = page.getByRole('dialog', {
    name: products[4].title,
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await assertViewportFits(page);
  await page.keyboard.press('Escape');
  await grid.click();
  await expect(grid).toHaveAttribute('aria-pressed', 'true');
  await expect(list).toHaveAttribute('aria-pressed', 'false');
  await assertViewportFits(page);
});

test('quick view and comparison have no automated accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(products.length);
  await page.evaluate(() => document.fonts.ready);
  await productCard(page, 'Silk Lipstick')
    .getByRole('button', {
      name: 'View details for Silk Lipstick',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Silk Lipstick', exact: true }),
  ).toBeVisible();
  const detailResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect.soft(detailResults.violations).toEqual([]);
  await page.keyboard.press('Escape');
  for (const title of ['Silk Lipstick', 'Rose Lipstick']) {
    await productCard(page, title)
      .getByRole('button', { name: `Compare ${title}`, exact: true })
      .click();
  }
  await page
    .getByRole('button', { name: 'Compare products', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Compare your finds', exact: true }),
  ).toBeVisible();
  const comparisonResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(comparisonResults.violations).toEqual([]);
});

test('removing saved and compared products preserves keyboard focus', async ({
  page,
}) => {
  await page.goto('/');
  for (const title of ['Silk Lipstick', 'Rose Lipstick']) {
    await productCard(page, title)
      .getByRole('button', { name: `Save ${title}`, exact: true })
      .click();
  }
  await page.getByRole('button', { name: 'Saved items', exact: true }).click();
  await expect(productTitles(page)).toHaveCount(2);
  const firstSaved = productCard(page, 'Silk Lipstick').getByRole('button', {
    name: 'Unsave Silk Lipstick',
    exact: true,
  });
  await firstSaved.focus();
  await page.keyboard.press('Enter');
  const lastSaved = productCard(page, 'Rose Lipstick').getByRole('button', {
    name: 'Unsave Rose Lipstick',
    exact: true,
  });
  await expect(lastSaved).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(productTitles(page)).toHaveCount(0);
  await expect(page.locator('#results-heading')).toBeFocused();

  await page
    .getByRole('button', { name: 'Browse all products', exact: true })
    .click();
  for (const title of ['Silk Lipstick', 'Rose Lipstick']) {
    await productCard(page, title)
      .getByRole('button', { name: `Compare ${title}`, exact: true })
      .click();
  }
  const tray = page.getByRole('complementary', {
    name: 'Products selected for comparison',
  });
  const firstCompared = tray.getByRole('button', {
    name: 'Remove Silk Lipstick from comparison',
    exact: true,
  });
  await firstCompared.focus();
  await page.keyboard.press('Enter');
  const lastCompared = tray.getByRole('button', {
    name: 'Remove Rose Lipstick from comparison',
    exact: true,
  });
  await expect(lastCompared).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(tray).toHaveCount(0);
  await expect(page.locator('#results-heading')).toBeFocused();
});
