import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  filterAndSortProducts,
  type Filters,
  type Product,
} from './catalogue';
import { getFilterSuggestions } from './guidance';

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
    thumbnail: 'https://example.com/silk.webp',
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
    thumbnail: 'https://example.com/rose.webp',
  },
  {
    id: 3,
    title: 'Linen Chair',
    description: 'A chair.',
    category: 'furniture',
    brand: 'Home',
    price: 99,
    rating: 4.8,
    stock: 4,
    thumbnail: 'https://example.com/chair.webp',
  },
];

describe('getFilterSuggestions', () => {
  it('does not suggest changes when results already exist or the collection is empty', () => {
    expect(getFilterSuggestions(products, EMPTY_FILTERS)).toEqual([]);
    expect(
      getFilterSuggestions([], { ...EMPTY_FILTERS, query: 'missing' }),
    ).toEqual([]);
  });

  it('preserves the query and category while removing a conflicting brand', () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      query: 'lipstick',
      category: 'beauty',
      brand: 'Missing Brand',
    };
    expect(getFilterSuggestions(products, filters)).toEqual([
      { label: 'Try all brands', filters: { ...filters, brand: '' }, count: 2 },
    ]);
  });

  it.each([
    {
      filters: { ...EMPTY_FILTERS, query: 'Silk', maxPrice: '5' },
      label: 'Try any price',
      count: 1,
    },
    {
      filters: { ...EMPTY_FILTERS, query: 'Silk', category: 'furniture' },
      label: 'Explore all categories',
      count: 1,
    },
    {
      filters: { ...EMPTY_FILTERS, query: 'Silk', minRating: '4.5' },
      label: 'Include all ratings',
      count: 1,
    },
    {
      filters: { ...EMPTY_FILTERS, query: 'Rose', inStockOnly: true },
      label: 'Include unavailable products',
      count: 1,
    },
    {
      filters: { ...EMPTY_FILTERS, query: 'Missing product', brand: 'Studio' },
      label: 'Browse without this search',
      count: 1,
    },
  ])(
    'offers an actual working relaxation: $label',
    ({ filters, label, count }) => {
      expect(getFilterSuggestions(products, filters)).toContainEqual({
        label,
        filters: expect.any(Object),
        count,
      });
      for (const suggestion of getFilterSuggestions(products, filters)) {
        expect(
          filterAndSortProducts(products, suggestion.filters, 'featured'),
        ).toHaveLength(suggestion.count);
        expect(suggestion.count).toBeGreaterThan(0);
      }
    },
  );

  it('combines the smallest set of relaxations when no single change helps', () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      category: 'beauty',
      brand: 'Missing Brand',
      maxPrice: '5',
    };
    expect(getFilterSuggestions(products, filters)).toEqual([
      {
        label: 'Clear brand + price',
        filters: { ...filters, brand: '', maxPrice: '', minPrice: '' },
        count: 2,
      },
    ]);
  });

  it('does not turn a malformed price range into empty-state advice', () => {
    expect(
      getFilterSuggestions(products, {
        ...EMPTY_FILTERS,
        minPrice: '100',
        maxPrice: '10',
      }),
    ).toEqual([]);
    expect(
      getFilterSuggestions(products, {
        ...EMPTY_FILTERS,
        maxPrice: 'Infinity',
      }),
    ).toEqual([]);
  });

  it('returns at most three valid alternatives without mutating inputs', () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      query: 'Silk',
      category: 'furniture',
      brand: 'Blossom',
      minPrice: '50',
      minRating: '4.5',
      inStockOnly: true,
    };
    const before = JSON.stringify({ products, filters });
    const suggestions = getFilterSuggestions(products, filters);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    expect(suggestions.every((suggestion) => suggestion.count > 0)).toBe(true);
    expect(JSON.stringify({ products, filters })).toBe(before);
  });
});
