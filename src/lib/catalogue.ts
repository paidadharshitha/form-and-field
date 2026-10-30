export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  thumbnail: string;
  brand?: string;
  stock: number;
}

export type SortOption =
  'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'rating-asc';

export interface Filters {
  query: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

export interface Category {
  value: string;
  label: string;
  count: number;
}

export function formatCategory(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Blank, negative, and non-finite inputs do not constrain the results. */
function readPrice(input: string): number | undefined {
  if (!input.trim()) return undefined;
  const value = Number(input);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function validatePriceRange(
  filters: Pick<Filters, 'minPrice' | 'maxPrice'>,
): string | null {
  const minimum = readPrice(filters.minPrice);
  const maximum = readPrice(filters.maxPrice);

  if (filters.minPrice.trim() && minimum === undefined) {
    return 'Enter a valid minimum price of 0 or more.';
  }
  if (filters.maxPrice.trim() && maximum === undefined) {
    return 'Enter a valid maximum price of 0 or more.';
  }
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    return 'Minimum price must be less than or equal to maximum price.';
  }
  return null;
}

/** One pipeline keeps search, category, and price filters working together. */
export function filterAndSortProducts(
  products: readonly Product[],
  filters: Filters,
  sort: SortOption,
): Product[] {
  const query = filters.query.trim().toLowerCase();
  const minimum = readPrice(filters.minPrice);
  const maximum = readPrice(filters.maxPrice);
  const matches = products.filter(
    (product) =>
      product.title.toLowerCase().includes(query) &&
      (!filters.category || product.category === filters.category) &&
      (minimum === undefined || product.price >= minimum) &&
      (maximum === undefined || product.price <= maximum),
  );

  if (sort === 'featured') return matches;

  return matches.sort((a, b) => {
    let difference: number;
    switch (sort) {
      case 'price-asc':
        difference = a.price - b.price;
        break;
      case 'price-desc':
        difference = b.price - a.price;
        break;
      case 'rating-asc':
        difference = a.rating - b.rating;
        break;
      case 'rating-desc':
        difference = b.rating - a.rating;
        break;
    }
    return difference || a.id - b.id;
  });
}

export function getCategories(products: readonly Product[]): Category[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }
  return Array.from(counts, ([value, count]) => ({
    value,
    label: formatCategory(value),
    count,
  })).sort((a, b) => a.label.localeCompare(b.label, 'en'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonnegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isImageUrl(value: unknown): value is string {
  if (!isText(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Validate external data before it reaches the UI; never cast JSON to Product[]. */
export function parseProducts(payload: unknown): Product[] {
  if (!isRecord(payload) || !isArray(payload.products)) {
    throw new Error('The catalogue response did not include a product list.');
  }

  const seenIds = new Set<number>();
  return payload.products.map((item, index) => {
    if (
      !isRecord(item) ||
      !isNonnegativeNumber(item.id) ||
      !Number.isInteger(item.id) ||
      item.id === 0 ||
      !isText(item.title) ||
      typeof item.description !== 'string' ||
      !isText(item.category) ||
      !isNonnegativeNumber(item.price) ||
      !isNonnegativeNumber(item.rating) ||
      item.rating > 5 ||
      !isImageUrl(item.thumbnail) ||
      !isNonnegativeNumber(item.stock) ||
      !Number.isInteger(item.stock) ||
      (item.brand !== undefined && typeof item.brand !== 'string')
    ) {
      throw new Error(`Product ${index + 1} contains invalid catalogue data.`);
    }
    if (seenIds.has(item.id)) {
      throw new Error('The catalogue response contains duplicate product IDs.');
    }
    seenIds.add(item.id);

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price,
      rating: item.rating,
      thumbnail: item.thumbnail,
      stock: item.stock,
      ...(item.brand === undefined ? {} : { brand: item.brand }),
    };
  });
}
