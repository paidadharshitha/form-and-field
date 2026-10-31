import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  filterAndSortProducts,
  formatCategory,
  getBrands,
  getCategories,
  getSimilarProducts,
  normalizeRatingFilter,
  parseProducts,
  searchProducts,
  validatePriceRange,
  type Product,
  type SortOption,
} from './catalogue';

const products: Product[] = [
  {
    id: 3,
    title: 'Oak Table',
    description: 'Furniture for a quiet home.',
    category: 'home-decoration',
    price: 100,
    rating: 4.8,
    thumbnail: 'https://example.com/table.webp',
    brand: 'Studio',
    stock: 2,
  },
  {
    id: 1,
    title: 'Small Table',
    description: 'A compact side table.',
    category: 'home-decoration',
    price: 20.5,
    rating: 4.1,
    thumbnail: 'https://example.com/small-table.webp',
    stock: 0,
  },
  {
    id: 4,
    title: 'Travel Perfume',
    description: 'Keep it on your table.',
    category: 'fragrances',
    price: 20.5,
    rating: 4.8,
    thumbnail: 'https://example.com/perfume.webp',
    stock: 10,
  },
  {
    id: 2,
    title: 'Table Mirror',
    description: 'An everyday mirror.',
    category: 'beauty',
    price: 8,
    rating: 3.5,
    thumbnail: 'https://example.com/mirror.webp',
    stock: 3,
  },
];

const ids = (items: Product[]) => items.map((item) => item.id);

describe('searchProducts', () => {
  it('prefers exact normalized title substrings and preserves source order', () => {
    const collection = [
      { ...products[0], title: 'Oak    Table' },
      { ...products[1], title: 'Oak Cable' },
    ];
    const result = searchProducts(collection, '  OAK TABLE  ');
    expect(ids(result.products)).toEqual([3]);
    expect(result.isFuzzy).toBe(false);
    expect(ids(searchProducts(products, 'table').products)).toEqual([3, 1, 2]);
  });

  it('corrects a missing letter or adjacent transposition only when no exact title matches exist', () => {
    expect(ids(searchProducts(products, 'tabel').products)).toEqual([3, 1, 2]);
    expect(searchProducts(products, 'tabel').isFuzzy).toBe(true);
    expect(ids(searchProducts(products, 'perfum').products)).toEqual([4]);
  });

  it('requires every query token to match a distinct title token', () => {
    expect(ids(searchProducts(products, 'smal tabel').products)).toEqual([1]);
    expect(searchProducts(products, 'table table').products).toEqual([]);
    expect(searchProducts(products, 'small perfume').products).toEqual([]);
  });

  it('limits the typo budget to two edits across the complete query', () => {
    const collection = [{ ...products[0], title: 'Travel Table Mirror' }];
    expect(searchProducts(collection, 'trvel tabel mirror').isFuzzy).toBe(true);
    expect(searchProducts(collection, 'trvel tabel miror').products).toEqual(
      [],
    );
  });

  it('allows two edits for a long word while keeping short words conservative', () => {
    const collection = [{ ...products[0], title: 'Sunglasses' }];
    expect(ids(searchProducts(collection, 'sunglasszz').products)).toEqual([3]);
    expect(searchProducts(products, 'xablz').products).toEqual([]);
    expect(searchProducts(products, 'tbl').products).toEqual([]);
  });

  it('does not correct model numbers or search descriptions and brands', () => {
    const collection = [{ ...products[0], title: 'Galaxy S24' }];
    expect(searchProducts(collection, 'Galaxy S25').products).toEqual([]);
    expect(ids(searchProducts(collection, 'Galxy S24').products)).toEqual([3]);
    expect(searchProducts(products, 'quiet home').products).toEqual([]);
    expect(searchProducts(products, 'Studio').products).toEqual([]);
  });

  it('returns no fuzzy status for empty results and handles oversized queries', () => {
    expect(searchProducts(products, 'no such product')).toEqual({
      products: [],
      isFuzzy: false,
    });
    expect(searchProducts(products, 'z'.repeat(200))).toEqual({
      products: [],
      isFuzzy: false,
    });
    expect(searchProducts([], '')).toEqual({ products: [], isFuzzy: false });
    expect(searchProducts(products, ' ')).toEqual({ products, isFuzzy: false });
  });
});

describe('brands', () => {
  it('derives sorted, distinct, trimmed names and ignores blank or absent brands', () => {
    const collection = [
      { ...products[0], brand: ' Studio ' },
      { ...products[1], brand: 'Acme' },
      { ...products[2], brand: 'Studio' },
      { ...products[3], brand: ' ' },
      { ...products[1], brand: undefined },
    ];
    expect(getBrands(collection)).toEqual(['Acme', 'Studio']);
    expect(getBrands([])).toEqual([]);
  });
});

describe('getSimilarProducts', () => {
  const reference = { ...products[0], id: 100, price: 100 };
  const alternative = (id: number, price: number, rating = 4): Product => ({
    ...reference,
    id,
    price,
    rating,
  });

  it('returns same-category alternatives within inclusive 50% price distance', () => {
    const collection = [
      reference,
      alternative(1, 50),
      alternative(2, 150),
      alternative(3, 49.99),
      alternative(4, 150.01),
      { ...alternative(5, 100), category: 'beauty' },
    ];
    expect(ids(getSimilarProducts(collection, reference))).toEqual([1, 2]);
  });

  it('orders by price distance, then rating and ID without changing source order', () => {
    const collection = [
      alternative(7, 110, 4),
      alternative(4, 90, 5),
      alternative(3, 110, 5),
      alternative(8, 101, 1),
      alternative(9, 120, 5),
    ];
    const originalIds = ids(collection);
    expect(ids(getSimilarProducts(collection, reference))).toEqual([
      8, 3, 4, 7,
    ]);
    expect(ids(getSimilarProducts(collection, reference, 2))).toEqual([8, 3]);
    expect(ids(collection)).toEqual(originalIds);
  });

  it('matches only free alternatives for a zero-price product and handles invalid limits', () => {
    const free = { ...reference, price: 0 };
    expect(
      ids(
        getSimilarProducts(
          [free, alternative(2, 0), alternative(3, 0.01)],
          free,
        ),
      ),
    ).toEqual([2]);
    for (const limit of [0, -1, NaN, Infinity]) {
      expect(
        getSimilarProducts([alternative(2, 100)], reference, limit),
      ).toEqual([]);
    }
  });
});

describe('filterAndSortProducts', () => {
  it('combines brand, fuzzy name search, category, price, rating, stock, and sorting', () => {
    const collection = [
      { ...products[0], brand: ' Studio ' },
      { ...products[1], brand: 'Studio', stock: 1 },
      { ...products[2], brand: 'Studio' },
    ];
    expect(
      ids(
        filterAndSortProducts(
          collection,
          {
            ...EMPTY_FILTERS,
            query: 'tabel',
            category: 'home-decoration',
            brand: 'Studio',
            minPrice: '20',
            maxPrice: '100',
            minRating: '4',
            inStockOnly: true,
          },
          'price-asc',
        ),
      ),
    ).toEqual([1, 3]);
    expect(
      filterAndSortProducts(
        collection,
        { ...EMPTY_FILTERS, brand: 'Other' },
        'featured',
      ),
    ).toEqual([]);
  });

  it('does not broaden an exact search when another filter excludes its result', () => {
    const collection = [
      { ...products[0], title: 'Table', brand: 'Studio' },
      { ...products[1], title: 'Cable', brand: 'Other' },
    ];
    expect(
      filterAndSortProducts(
        collection,
        { ...EMPTY_FILTERS, query: 'table', brand: 'Other' },
        'featured',
      ),
    ).toEqual([]);
  });
  it('combines rating and stock with the existing search, category, and price filters', () => {
    expect(
      ids(
        filterAndSortProducts(
          products,
          {
            ...EMPTY_FILTERS,
            query: 'table',
            category: 'home-decoration',
            minPrice: '20',
            maxPrice: '100',
            minRating: '4',
            inStockOnly: true,
          },
          'rating-desc',
        ),
      ),
    ).toEqual([3]);
  });

  it('includes the exact rating threshold and excludes out-of-stock products', () => {
    const ratedProducts = [
      { ...products[0], rating: 4.5 },
      { ...products[1], rating: 4.5 },
      { ...products[2], rating: 4.49 },
    ];
    expect(
      ids(
        filterAndSortProducts(
          ratedProducts,
          {
            ...EMPTY_FILTERS,
            minRating: '4.5',
          },
          'featured',
        ),
      ),
    ).toEqual([3, 1]);
    expect(
      ids(
        filterAndSortProducts(
          ratedProducts,
          {
            ...EMPTY_FILTERS,
            minRating: '4.5',
            inStockOnly: true,
          },
          'featured',
        ),
      ),
    ).toEqual([3]);
  });

  it('ignores unsupported rating values and keeps optional filters backwards compatible', () => {
    expect(
      ids(
        filterAndSortProducts(
          products,
          {
            query: '',
            category: '',
            minPrice: '',
            maxPrice: '',
          },
          'featured',
        ),
      ),
    ).toEqual(ids(products));
    expect(
      ids(
        filterAndSortProducts(
          products,
          {
            ...EMPTY_FILTERS,
            minRating: 'Infinity',
          },
          'featured',
        ),
      ),
    ).toEqual(ids(products));
  });
  it('combines name, category, inclusive price boundaries, and sorting', () => {
    const result = filterAndSortProducts(
      products,
      {
        query: ' TABLE ',
        category: 'home-decoration',
        minPrice: '20.50',
        maxPrice: '100',
      },
      'price-asc',
    );
    expect(ids(result)).toEqual([1, 3]);
  });

  it('searches names only and ignores surrounding whitespace and letter case', () => {
    expect(
      ids(
        filterAndSortProducts(
          products,
          { ...EMPTY_FILTERS, query: ' tAbLe ' },
          'featured',
        ),
      ),
    ).toEqual([3, 1, 2]);
  });

  it('preserves source order for featured and never mutates the input', () => {
    const originalOrder = ids(products);
    expect(
      ids(filterAndSortProducts(products, EMPTY_FILTERS, 'featured')),
    ).toEqual(originalOrder);
    filterAndSortProducts(products, EMPTY_FILTERS, 'price-asc');
    expect(ids(products)).toEqual(originalOrder);
  });

  it.each<{ sort: SortOption; expected: number[] }>([
    { sort: 'price-asc', expected: [2, 1, 4, 3] },
    { sort: 'price-desc', expected: [3, 1, 4, 2] },
    { sort: 'rating-asc', expected: [2, 1, 3, 4] },
    { sort: 'rating-desc', expected: [3, 4, 1, 2] },
  ])('sorts $sort with deterministic ID tie breaks', ({ sort, expected }) => {
    expect(ids(filterAndSortProducts(products, EMPTY_FILTERS, sort))).toEqual(
      expected,
    );
  });

  it('supports open-ended prices and a zero maximum', () => {
    expect(
      ids(
        filterAndSortProducts(
          products,
          { ...EMPTY_FILTERS, minPrice: '100' },
          'featured',
        ),
      ),
    ).toEqual([3]);
    expect(
      ids(
        filterAndSortProducts(
          products,
          { ...EMPTY_FILTERS, maxPrice: '8' },
          'featured',
        ),
      ),
    ).toEqual([2]);
    expect(
      filterAndSortProducts(
        products,
        { ...EMPTY_FILTERS, maxPrice: '0' },
        'featured',
      ),
    ).toEqual([]);
  });

  it('returns an empty array for no matches or an inverted range', () => {
    expect(
      filterAndSortProducts(
        products,
        { ...EMPTY_FILTERS, query: 'nonexistent' },
        'featured',
      ),
    ).toEqual([]);
    expect(
      filterAndSortProducts(
        products,
        { ...EMPTY_FILTERS, minPrice: '101', maxPrice: '100' },
        'featured',
      ),
    ).toEqual([]);
    expect(filterAndSortProducts([], EMPTY_FILTERS, 'rating-desc')).toEqual([]);
  });

  it('ignores invalid individual price values while validation reports them', () => {
    expect(
      ids(
        filterAndSortProducts(
          products,
          { ...EMPTY_FILTERS, minPrice: '-1', maxPrice: 'oops' },
          'featured',
        ),
      ),
    ).toEqual(ids(products));
  });
});

describe('normalizeRatingFilter', () => {
  it.each(['4', '4.5'] as const)('accepts the supported rating %s', (value) => {
    expect(normalizeRatingFilter(value)).toBe(value);
  });

  it.each([
    undefined,
    null,
    '',
    '0',
    '-1',
    '5',
    '4.0',
    '4.6',
    'NaN',
    'Infinity',
  ])('ignores unsupported URL rating %s', (value) => {
    expect(normalizeRatingFilter(value)).toBe('');
  });
});

describe('validatePriceRange', () => {
  it.each([
    { minPrice: '', maxPrice: '' },
    { minPrice: '0', maxPrice: '0' },
    { minPrice: '20.50', maxPrice: '20.50' },
    { minPrice: '', maxPrice: '100' },
    { minPrice: '100', maxPrice: ' ' },
  ])('accepts a valid or open range %o', (range) => {
    expect(validatePriceRange(range)).toBeNull();
  });

  it.each([
    { minPrice: '-1', maxPrice: '' },
    { minPrice: 'oops', maxPrice: '' },
    { minPrice: 'Infinity', maxPrice: '' },
    { minPrice: '', maxPrice: '-1' },
    { minPrice: '', maxPrice: 'NaN' },
    { minPrice: '100.01', maxPrice: '100' },
  ])('reports an invalid range %o', (range) => {
    expect(validatePriceRange(range)).toEqual(expect.any(String));
  });
});

describe('categories', () => {
  it('makes readable labels and returns unique alphabetized categories with counts', () => {
    expect(formatCategory('home-decoration')).toBe('Home Decoration');
    expect(getCategories(products)).toEqual([
      { value: 'beauty', label: 'Beauty', count: 1 },
      { value: 'fragrances', label: 'Fragrances', count: 1 },
      { value: 'home-decoration', label: 'Home Decoration', count: 2 },
    ]);
    expect(getCategories([])).toEqual([]);
  });
});

describe('parseProducts', () => {
  it('accepts optional image galleries, preserves order, and removes duplicate URLs', () => {
    const images = [
      'https://example.com/front.webp',
      'http://example.com/back.webp',
      'https://example.com/front.webp',
    ];
    expect(
      parseProducts({ products: [{ ...products[0], images }] })[0].images,
    ).toEqual(images.slice(0, 2));
    expect(
      parseProducts({ products: [{ ...products[0], images: [] }] })[0].images,
    ).toEqual([]);
    expect(parseProducts({ products: [products[0]] })[0]).not.toHaveProperty(
      'images',
    );
  });

  it.each([
    null,
    'https://example.com/image.webp',
    [null],
    ['broken'],
    ['javascript:alert(1)'],
    ['https://example.com/valid.webp', 2],
  ])('rejects malformed gallery data %o', (images) => {
    expect(() =>
      parseProducts({ products: [{ ...products[0], images }] }),
    ).toThrow(/invalid catalogue data/);
  });
  it('accepts valid API data, optional brands, zero stock, and ignores extra fields', () => {
    expect(parseProducts({ products, total: products.length })).toEqual(
      products,
    );
    expect(
      parseProducts({ products: [{ ...products[0], internal: 'unused' }] })[0],
    ).not.toHaveProperty('internal');
    expect(parseProducts({ products: [] })).toEqual([]);
  });

  it.each([null, [], {}, { products: null }, { products: 'wrong' }])(
    'rejects a malformed API envelope %o',
    (payload) => {
      expect(() => parseProducts(payload)).toThrow(/product list/);
    },
  );

  it.each([
    { id: 0 },
    { id: 1.5 },
    { title: ' ' },
    { description: null },
    { category: '' },
    { price: '10' },
    { price: -1 },
    { price: Infinity },
    { rating: 5.1 },
    { thumbnail: 'javascript:alert(1)' },
    { thumbnail: 'broken-url' },
    { stock: -1 },
    { stock: 1.5 },
    { brand: 123 },
  ])('rejects an invalid product field %o', (invalidFields) => {
    expect(() =>
      parseProducts({ products: [{ ...products[0], ...invalidFields }] }),
    ).toThrow('Product 1 contains invalid catalogue data.');
  });

  it('rejects duplicate IDs so rendered cards always have unique identities', () => {
    expect(() =>
      parseProducts({ products: [products[0], products[0]] }),
    ).toThrow(/duplicate product IDs/);
  });
});
