import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  filterAndSortProducts,
  formatCategory,
  getCategories,
  parseProducts,
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

describe('filterAndSortProducts', () => {
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
