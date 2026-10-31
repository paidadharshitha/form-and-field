import {
  filterAndSortProducts,
  validatePriceRange,
  type Filters,
  type Product,
} from './catalogue';

export interface FilterSuggestion {
  label: string;
  filters: Filters;
  count: number;
}

interface Relaxation {
  name: string;
  label: string;
  active: boolean;
  changes: Partial<Filters>;
}

/** Suggest only changes that produce results, retaining every other preference. */
export function getFilterSuggestions(
  products: readonly Product[],
  filters: Filters,
): FilterSuggestion[] {
  if (
    products.length === 0 ||
    validatePriceRange(filters) ||
    filterAndSortProducts(products, filters, 'featured').length > 0
  ) {
    return [];
  }

  const options: Relaxation[] = [
    {
      name: 'brand',
      label: 'Try all brands',
      active: Boolean(filters.brand?.trim()),
      changes: { brand: '' },
    },
    {
      name: 'price',
      label: 'Try any price',
      active: Boolean(filters.minPrice.trim() || filters.maxPrice.trim()),
      changes: { minPrice: '', maxPrice: '' },
    },
    {
      name: 'category',
      label: 'Explore all categories',
      active: Boolean(filters.category),
      changes: { category: '' },
    },
    {
      name: 'rating',
      label: 'Include all ratings',
      active: Boolean(filters.minRating),
      changes: { minRating: '' },
    },
    {
      name: 'availability',
      label: 'Include unavailable products',
      active: Boolean(filters.inStockOnly),
      changes: { inStockOnly: false },
    },
    {
      name: 'search',
      label: 'Browse without this search',
      active: Boolean(filters.query.trim()),
      changes: { query: '' },
    },
  ].filter((option) => option.active);

  function suggestionFor(group: Relaxation[]): FilterSuggestion | null {
    const nextFilters = group.reduce(
      (next, option) => ({ ...next, ...option.changes }),
      { ...filters },
    );
    const count = filterAndSortProducts(
      products,
      nextFilters,
      'featured',
    ).length;
    if (count === 0) return null;
    return {
      label:
        group.length === 1
          ? group[0].label
          : `Clear ${group.map((option) => option.name).join(' + ')}`,
      filters: nextFilters,
      count,
    };
  }

  // Prefer the smallest change. Combine relaxations only if none work alone.
  for (let size = 1; size <= options.length; size += 1) {
    const suggestions: FilterSuggestion[] = [];
    function choose(start: number, selected: Relaxation[]) {
      if (suggestions.length === 3) return;
      if (selected.length === size) {
        const suggestion = suggestionFor(selected);
        if (suggestion) suggestions.push(suggestion);
        return;
      }
      for (let index = start; index < options.length; index += 1) {
        choose(index + 1, [...selected, options[index]]);
        if (suggestions.length === 3) return;
      }
    }
    choose(0, []);
    if (suggestions.length) return suggestions;
  }
  return [];
}
