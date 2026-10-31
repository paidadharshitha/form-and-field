import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type { Product } from '../src/lib/catalogue';

const products: Product[] = [
  {
    id: 1,
    title: 'Silk Lipstick',
    description: 'Soft colour.',
    category: 'beauty',
    brand: 'Studio',
    price: 12,
    rating: 4.2,
    stock: 8,
    thumbnail: 'https://images.example.com/silk.svg',
    reviews: [
      {
        rating: 5,
        reviewerName: 'Avery Chen',
        date: '2025-04-30T09:41:02.053Z',
        comment: 'Comfortable all day.',
      },
      {
        rating: 3,
        reviewerName: 'Jordan Lee',
        date: '2025-05-02T09:41:02.053Z',
        comment: 'Shade looks warmer in person.',
      },
    ],
  },
  {
    id: 2,
    title: 'Rose Lipstick',
    description: 'Rose colour.',
    category: 'beauty',
    brand: 'Blossom',
    price: 24,
    rating: 4.9,
    stock: 0,
    thumbnail: 'https://images.example.com/rose.svg',
  },
  {
    id: 3,
    title: 'Satin Lipstick',
    description: 'A satin finish.',
    category: 'beauty',
    brand: 'Studio',
    price: 40,
    rating: 4.5,
    stock: 3,
    thumbnail: 'https://images.example.com/satin.svg',
  },
  {
    id: 4,
    title: 'Linen Chair',
    description: 'A chair.',
    category: 'furniture',
    brand: 'Home',
    price: 99,
    rating: 4.8,
    stock: 4,
    thumbnail: 'https://images.example.com/chair.svg',
  },
];

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

async function denyClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException(
            'Clipboard permission denied.',
            'NotAllowedError',
          );
        },
      },
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://dummyjson.com/products?**', (route) =>
    route.fulfill({
      json: {
        products: products.map((product) => ({
          ...product,
          ...(product.reviews
            ? {
                reviews: product.reviews.map((review) => ({
                  ...review,
                  reviewerEmail: 'private@example.com',
                })),
              }
            : {}),
        })),
      },
    }),
  );
  await page.route('https://images.example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#eef3ff"/></svg>',
    }),
  );
});

test('guided finder applies a fresh category, budget, and priority together', async ({
  page,
}) => {
  await page.goto('/?q=missing&brand=Missing&category=beauty&max=99');
  const finder = page.getByRole('region', {
    name: 'Guided product finder',
    exact: true,
  });
  await finder
    .getByRole('button', { name: 'Help me choose', exact: true })
    .click();
  await expect(
    finder.getByRole('combobox', {
      name: 'What are you looking for?',
      exact: true,
    }),
  ).toHaveValue('beauty');
  await finder
    .getByRole('spinbutton', { name: 'Maximum budget USD', exact: true })
    .fill('24');
  await finder
    .getByRole('combobox', { name: 'What matters most?', exact: true })
    .selectOption('rating-desc');
  await finder
    .getByRole('button', { name: 'Find my matches', exact: true })
    .click();
  await expect(productTitles(page)).toHaveText([
    'Rose Lipstick',
    'Silk Lipstick',
  ]);
  await expect(
    finder.getByRole('button', { name: 'Help me choose', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#results-heading')).toBeFocused();
  const params = new URL(page.url()).searchParams;
  expect(params.get('category')).toBe('beauty');
  expect(params.get('max')).toBe('24');
  expect(params.get('sort')).toBe('rating-desc');
  expect(params.has('q')).toBe(false);
  expect(params.has('brand')).toBe(false);
});

test('guided finder explains an invalid budget and accepts zero', async ({
  page,
}) => {
  await page.goto('/');
  await expect(productTitles(page)).toHaveCount(4);
  const finder = page.getByRole('region', {
    name: 'Guided product finder',
    exact: true,
  });
  await finder
    .getByRole('button', { name: 'Help me choose', exact: true })
    .click();
  const budget = finder.getByRole('spinbutton', {
    name: 'Maximum budget USD',
    exact: true,
  });
  await budget.fill('-1');
  await finder
    .getByRole('button', { name: 'Find my matches', exact: true })
    .click();
  await expect(finder.getByRole('alert')).toHaveText(
    'Enter a budget of 0 or more, or leave it blank.',
  );
  await expect(budget).toBeFocused();
  await expect(productTitles(page)).toHaveCount(4);
  await budget.fill('0');
  await finder
    .getByRole('button', { name: 'Find my matches', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'No finds this time.' }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get('max')).toBe('0');
  await expect(finder.getByRole('alert')).toHaveCount(0);
});

test('empty-state suggestions change only the filters needed for a result', async ({
  page,
}) => {
  await page.goto('/?category=beauty&brand=Missing&max=25');
  const recovery = page.getByRole('group', {
    name: 'Ways to find a match',
    exact: true,
  });
  await expect(recovery).toBeVisible();
  await expect(
    recovery.getByRole('button', { name: /^Try all brands/ }),
  ).toContainText('2 matching products');
  await recovery.getByRole('button', { name: /^Try all brands/ }).click();
  await expect(productTitles(page)).toHaveText([
    'Silk Lipstick',
    'Rose Lipstick',
  ]);
  const params = new URL(page.url()).searchParams;
  expect(params.get('category')).toBe('beauty');
  expect(params.get('max')).toBe('25');
  expect(params.has('brand')).toBe(false);

  await page.goto('/?category=beauty&brand=Missing&max=5');
  await expect(
    recovery.getByRole('button', { name: /^Clear brand \+ price/ }),
  ).toContainText('3 matching products');
  await recovery.getByRole('button', { name: /^Clear brand \+ price/ }).click();
  await expect(productTitles(page)).toHaveCount(3);
  expect(new URL(page.url()).searchParams.get('category')).toBe('beauty');
});

test('highlights show exact matching letters without inventing typo matches', async ({
  page,
}) => {
  await page.goto('/');
  const search = page.getByRole('combobox', {
    name: 'Search products by name',
    exact: true,
  });
  await search.fill('LIP');
  await expect(productTitles(page).locator('mark')).toHaveText([
    'Lip',
    'Lip',
    'Lip',
  ]);
  await expect(
    page.getByRole('listbox', { name: 'Product suggestions' }).locator('mark'),
  ).toHaveText(['Lip', 'Lip', 'Lip']);
  await search.fill('lipstik');
  await expect(productTitles(page)).toHaveCount(3);
  await expect(productTitles(page).locator('mark')).toHaveCount(0);
  await expect(
    page.getByRole('listbox', { name: 'Product suggestions' }).locator('mark'),
  ).toHaveCount(0);
  await search.fill('silk lipstik');
  await expect(productTitles(page)).toHaveText(['Silk Lipstick']);
  await expect(productTitles(page).locator('mark')).toHaveText(['Silk']);
});

test('guided finder and recovery suggestions are accessible and fit the viewport', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Help me choose', exact: true })
    .click();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  const finderResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect.soft(finderResults.violations).toEqual([]);
  await page.goto('/?brand=Missing');
  await expect(
    page.getByRole('group', { name: 'Ways to find a match' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  const recoveryResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(recoveryResults.violations).toEqual([]);
});

test('product links reload, preserve filters when closed, and handle unavailable IDs', async ({
  page,
}) => {
  await page.goto('/?q=lip&category=beauty&brand=Studio&max=25&product=2');
  await expect(
    page.getByRole('dialog', { name: 'Rose Lipstick', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('dialog', { name: 'Rose Lipstick', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(productTitles(page)).toHaveText(['Silk Lipstick']);
  const params = new URL(page.url()).searchParams;
  expect(params.has('product')).toBe(false);
  expect(params.get('q')).toBe('lip');
  expect(params.get('category')).toBe('beauty');
  expect(params.get('brand')).toBe('Studio');
  expect(params.get('max')).toBe('25');

  await page.goto('/?product=999&category=beauty');
  await expect(
    page.getByText(
      'This product link is unavailable. You can still explore the catalogue.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Dismiss product link', exact: true })
    .click();
  expect(new URL(page.url()).searchParams.has('product')).toBe(false);
  expect(new URL(page.url()).searchParams.get('category')).toBe('beauty');
  await expect(productTitles(page)).toHaveCount(3);
});

test('copy denial offers a selected product link instead of reporting success', async ({
  page,
}) => {
  await denyClipboard(page);
  await page.goto('/?category=beauty&max=25&product=1');
  const dialog = page.getByRole('dialog', {
    name: 'Silk Lipstick',
    exact: true,
  });
  await dialog
    .getByRole('button', { name: 'Copy product link', exact: true })
    .click();
  const link = dialog.getByRole('textbox', {
    name: 'Product link',
    exact: true,
  });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('readonly', '');
  await expect(link).toBeFocused();
  const url = new URL(await link.inputValue());
  expect(url.searchParams.get('product')).toBe('1');
  expect(url.searchParams.get('category')).toBe('beauty');
  expect(url.searchParams.get('max')).toBe('25');
  await expect(
    link.evaluate(
      (input) =>
        input instanceof HTMLInputElement &&
        input.selectionStart === 0 &&
        input.selectionEnd === input.value.length,
    ),
  ).resolves.toBe(true);
  await expect(
    dialog.getByText(
      'Couldn’t copy automatically. Select the link to copy it.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    dialog.getByText('Link copied. Ready to share.', { exact: true }),
  ).toHaveCount(0);
});

test('copy reports success only after a permitted clipboard write', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?category=beauty&product=1');
  const dialog = page.getByRole('dialog', {
    name: 'Silk Lipstick',
    exact: true,
  });
  await dialog
    .getByRole('button', { name: 'Copy product link', exact: true })
    .click();
  await expect(
    dialog.getByText('Link copied. Ready to share.', { exact: true }),
  ).toBeVisible();
  const copied = new URL(
    await page.evaluate(() => navigator.clipboard.readText()),
  );
  expect(copied.searchParams.get('product')).toBe('1');
  expect(copied.searchParams.get('category')).toBe('beauty');
  await expect(
    dialog.getByRole('textbox', { name: 'Product link', exact: true }),
  ).toHaveCount(0);
});

test('sample reviews show supplied content without exposing email addresses', async ({
  page,
}) => {
  await page.goto('/?product=1');
  const dialog = page.getByRole('dialog', {
    name: 'Silk Lipstick',
    exact: true,
  });
  const reviews = dialog.getByRole('region', { name: 'Reviews', exact: true });
  await expect(
    reviews.getByText('2 sample reviews', { exact: true }),
  ).toBeVisible();
  await expect(reviews.getByText('Avery Chen', { exact: true })).toBeVisible();
  await expect(
    reviews.getByText('Comfortable all day.', { exact: true }),
  ).toBeVisible();
  await expect(
    reviews.getByText('Apr 30, 2025', { exact: true }),
  ).toBeVisible();
  await expect(
    reviews.getByRole('img', { name: '5 out of 5 stars', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('private@example.com', { exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  const emptyDialog = await openProduct(page, 'Linen Chair');
  await expect(
    emptyDialog
      .getByRole('region', { name: 'Reviews', exact: true })
      .getByText('No reviews are included for this product.', { exact: true }),
  ).toBeVisible();
});

test('undo restores a saved item without overwriting later choices and works inside quick view', async ({
  page,
}) => {
  await page.goto('/');
  const silk = page.getByRole('article', {
    name: 'Silk Lipstick',
    exact: true,
  });
  const rose = page.getByRole('article', {
    name: 'Rose Lipstick',
    exact: true,
  });
  await silk
    .getByRole('button', { name: 'Save Silk Lipstick', exact: true })
    .click();
  await silk
    .getByRole('button', { name: 'Unsave Silk Lipstick', exact: true })
    .click();
  await expect(
    page.getByText('Silk Lipstick removed from Saved.', { exact: true }),
  ).toBeVisible();
  await rose
    .getByRole('button', { name: 'Save Rose Lipstick', exact: true })
    .click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    silk.getByRole('button', { name: 'Unsave Silk Lipstick', exact: true }),
  ).toBeVisible();
  await expect(
    rose.getByRole('button', { name: 'Unsave Rose Lipstick', exact: true }),
  ).toBeVisible();

  const dialog = await openProduct(page, 'Silk Lipstick');
  await dialog
    .getByRole('button', { name: 'Unsave Silk Lipstick', exact: true })
    .click();
  await expect(
    dialog.getByText('Silk Lipstick removed from Saved.', { exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    dialog.getByRole('button', { name: 'Unsave Silk Lipstick', exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Undo', exact: true }),
  ).toHaveCount(0);
});

test('undoing a history clear keeps newly viewed products first', async ({
  page,
}) => {
  await page.goto('/');
  for (const title of ['Silk Lipstick', 'Rose Lipstick']) {
    await openProduct(page, title);
    await page.keyboard.press('Escape');
  }
  await page
    .getByRole('button', { name: 'Clear recently viewed', exact: true })
    .click();
  await expect(
    page.getByText('Recently viewed history cleared.', { exact: true }),
  ).toBeVisible();
  await openProduct(page, 'Linen Chair');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(
          localStorage.getItem('form-field:recently-viewed:v1') ?? '[]',
        ),
      ),
    )
    .toEqual([4, 2, 1]);
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Recently viewed', exact: true })
      .getByRole('button', { name: /^View / }),
  ).toHaveCount(3);
});

test('reviews, share fallback, and undo feedback meet accessibility checks', async ({
  page,
}) => {
  await denyClipboard(page);
  await page.goto('/?product=1');
  const dialog = page.getByRole('dialog', {
    name: 'Silk Lipstick',
    exact: true,
  });
  await dialog
    .getByRole('button', { name: 'Save Silk Lipstick', exact: true })
    .click();
  await dialog
    .getByRole('button', { name: 'Unsave Silk Lipstick', exact: true })
    .click();
  await dialog
    .getByRole('button', { name: 'Copy product link', exact: true })
    .click();
  await expect(
    dialog.getByRole('textbox', { name: 'Product link', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const modalResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect.soft(modalResults.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Undo', exact: true }),
  ).toBeVisible();
  const pageResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(pageResults.violations).toEqual([]);
});
