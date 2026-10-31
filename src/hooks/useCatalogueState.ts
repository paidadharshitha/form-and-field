import { useEffect, useState } from 'react';
import {
  EMPTY_FILTERS,
  normalizeRatingFilter,
  type Filters,
  type SortOption,
} from '../lib/catalogue';

const sorts: SortOption[] = [
  'featured',
  'price-asc',
  'price-desc',
  'rating-desc',
  'rating-asc',
];

function readLocation(): {
  filters: Filters;
  sort: SortOption;
  linkedProduct: string;
} {
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get('sort');
  return {
    linkedProduct: params.get('product') ?? '',
    filters: {
      query: params.get('q') ?? '',
      category: params.get('category') ?? '',
      brand: params.get('brand')?.trim() ?? '',
      minPrice: params.get('min') ?? '',
      maxPrice: params.get('max') ?? '',
      minRating: normalizeRatingFilter(params.get('rating')),
      inStockOnly: params.get('stock') === '1',
    },
    sort: sorts.find((sort) => sort === candidate) ?? 'featured',
  };
}

export function useCatalogueState() {
  const [state, setState] = useState(readLocation);

  useEffect(() => {
    const restore = () => setState(readLocation());
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const values = {
      q: state.filters.query,
      category: state.filters.category,
      brand: state.filters.brand?.trim() ?? '',
      min: state.filters.minPrice,
      max: state.filters.maxPrice,
      rating: normalizeRatingFilter(state.filters.minRating),
      stock: state.filters.inStockOnly ? '1' : '',
      sort: state.sort === 'featured' ? '' : state.sort,
      product: state.linkedProduct,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url);
  }, [state]);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setState((current) => ({
      ...current,
      filters: { ...current.filters, [key]: value },
    }));
  }

  return {
    ...state,
    setFilter,
    selectProduct: (id: number | null) =>
      setState((current) => ({
        ...current,
        linkedProduct: id === null ? '' : String(id),
      })),
    applyFilters: (filters: Filters, sort?: SortOption) =>
      setState((current) => ({
        ...current,
        filters: { ...filters },
        sort: sort ?? current.sort,
      })),
    setSort: (sort: SortOption) =>
      setState((current) => ({ ...current, sort })),
    clearFilters: () =>
      setState((current) => ({ ...current, filters: { ...EMPTY_FILTERS } })),
  };
}
