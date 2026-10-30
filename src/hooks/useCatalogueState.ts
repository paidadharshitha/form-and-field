import { useEffect, useState } from 'react';
import { EMPTY_FILTERS, type Filters, type SortOption } from '../lib/catalogue';

const sorts: SortOption[] = [
  'featured',
  'price-asc',
  'price-desc',
  'rating-desc',
  'rating-asc',
];

function readLocation(): { filters: Filters; sort: SortOption } {
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get('sort');
  return {
    filters: {
      query: params.get('q') ?? '',
      category: params.get('category') ?? '',
      minPrice: params.get('min') ?? '',
      maxPrice: params.get('max') ?? '',
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
      min: state.filters.minPrice,
      max: state.filters.maxPrice,
      sort: state.sort === 'featured' ? '' : state.sort,
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
    setSort: (sort: SortOption) =>
      setState((current) => ({ ...current, sort })),
    clearFilters: () =>
      setState((current) => ({ ...current, filters: { ...EMPTY_FILTERS } })),
  };
}
