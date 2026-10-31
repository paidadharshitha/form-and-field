export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  thumbnail: string;
  images?: string[];
  reviews?: ProductReview[];
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
  minRating?: string;
  inStockOnly?: boolean;
  brand?: string;
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
  inStockOnly: false,
  brand: '',
};

/** Limit URL and UI values to the rating options supported by the catalogue. */
export function normalizeRatingFilter(
  value: string | null | undefined,
): '' | '4' | '4.5' {
  return value === '4' || value === '4.5' ? value : '';
}

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

function normalizeSearch(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function searchTokens(value: string): string[] {
  return value.match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Small edit distance with adjacent transpositions, bounded by short query tokens. */
function editDistance(left: string, right: string, limit: number): number {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  let beforePrevious = previous;
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + Number(left[row - 1] !== right[column - 1]),
      );
      if (
        row > 1 &&
        column > 1 &&
        left[row - 1] === right[column - 2] &&
        left[row - 2] === right[column - 1]
      ) {
        current[column] = Math.min(
          current[column],
          beforePrevious[column - 2] + 1,
        );
      }
    }
    beforePrevious = previous;
    previous = current;
  }
  return previous[right.length];
}

function matchesTypoTokens(title: string, queryTokens: string[]): boolean {
  const titleTokens = searchTokens(normalizeSearch(title));
  if (queryTokens.length > titleTokens.length) return false;
  const candidates = queryTokens
    .map((queryToken) =>
      titleTokens
        .flatMap((titleToken, index) => {
          if (queryToken === titleToken) return [{ index, cost: 0 }];
          // Short words and product model numbers are too ambiguous to correct safely.
          if (
            queryToken.length < 4 ||
            titleToken.length < 4 ||
            /\p{N}/u.test(queryToken + titleToken)
          )
            return [];
          const limit = queryToken.length >= 8 ? 2 : 1;
          const cost = editDistance(queryToken, titleToken, limit);
          return cost <= limit ? [{ index, cost }] : [];
        })
        .sort((a, b) => a.cost - b.cost),
    )
    .sort((a, b) => a.length - b.length);
  if (candidates.some((options) => options.length === 0)) return false;
  if (
    new Set(
      candidates.flatMap((options) => options.map((option) => option.index)),
    ).size < queryTokens.length
  )
    return false;

  // Every query word consumes a distinct title word, with at most two edits total.
  const used = new Set<number>();
  function match(index: number, edits: number): boolean {
    if (index === candidates.length) return true;
    for (const candidate of candidates[index]) {
      if (used.has(candidate.index) || edits + candidate.cost > 2) continue;
      used.add(candidate.index);
      if (match(index + 1, edits + candidate.cost)) return true;
      used.delete(candidate.index);
    }
    return false;
  }
  return match(0, 0);
}

/** Exact title substrings win; conservative word-level typo matches are a fallback only. */
export function searchProducts(
  products: readonly Product[],
  query: string,
): { products: Product[]; isFuzzy: boolean } {
  const normalized = normalizeSearch(query);
  const exact = products.filter((product) =>
    normalizeSearch(product.title).includes(normalized),
  );
  if (exact.length || !normalized) return { products: exact, isFuzzy: false };

  const tokens = searchTokens(normalized);
  if (
    normalized.length < 4 ||
    normalized.length > 120 ||
    !tokens.length ||
    tokens.length > 8 ||
    tokens.some((token) => token.length > 32)
  ) {
    return { products: [], isFuzzy: false };
  }
  const matches = products.filter((product) =>
    matchesTypoTokens(product.title, tokens),
  );
  return { products: matches, isFuzzy: matches.length > 0 };
}

/** Brand choices reflect supplied names; whitespace-only and missing brands are omitted. */
export function getBrands(products: readonly Product[]): string[] {
  return [
    ...new Set(
      products.map((product) => product.brand?.trim() ?? '').filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'en'));
}

/** Same category and within ±50% of the reference price; nearest budget wins. */
export function getSimilarProducts(
  products: readonly Product[],
  product: Product,
  limit = 4,
): Product[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  const budgetDistance = product.price * 0.5;
  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.category === product.category &&
        Math.abs(candidate.price - product.price) <= budgetDistance,
    )
    .sort(
      (a, b) =>
        Math.abs(a.price - product.price) - Math.abs(b.price - product.price) ||
        b.rating - a.rating ||
        a.id - b.id,
    )
    .slice(0, Math.floor(limit));
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

/** One pipeline applies every active condition before sorting the matches. */
export function filterAndSortProducts(
  products: readonly Product[],
  filters: Filters,
  sort: SortOption,
): Product[] {
  const minimum = readPrice(filters.minPrice);
  const maximum = readPrice(filters.maxPrice);
  const minimumRating = Number(normalizeRatingFilter(filters.minRating));
  const brand = filters.brand?.trim();
  const matches = searchProducts(products, filters.query).products.filter(
    (product) =>
      (!filters.category || product.category === filters.category) &&
      (!brand || product.brand?.trim() === brand) &&
      (minimum === undefined || product.price >= minimum) &&
      (maximum === undefined || product.price <= maximum) &&
      product.rating >= minimumRating &&
      (!filters.inStockOnly || product.stock > 0),
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

function isImageList(value: unknown): value is string[] {
  return isArray(value) && value.every(isImageUrl);
}

function isReviewList(value: unknown): value is ProductReview[] {
  return (
    isArray(value) &&
    value.every(
      (review) =>
        isRecord(review) &&
        typeof review.rating === 'number' &&
        Number.isInteger(review.rating) &&
        review.rating >= 1 &&
        review.rating <= 5 &&
        typeof review.comment === 'string' &&
        isText(review.reviewerName) &&
        isText(review.date) &&
        Number.isFinite(Date.parse(review.date)),
    )
  );
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
      (item.images !== undefined && !isImageList(item.images)) ||
      (item.reviews !== undefined && !isReviewList(item.reviews)) ||
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
      ...(item.images === undefined
        ? {}
        : { images: [...new Set(item.images)] }),
      // Retain only display fields. Reviewer email addresses never enter app state.
      ...(item.reviews === undefined
        ? {}
        : {
            reviews: item.reviews.map((review) => ({
              rating: review.rating,
              comment: review.comment,
              date: review.date,
              reviewerName: review.reviewerName,
            })),
          }),
      stock: item.stock,
      ...(item.brand === undefined ? {} : { brand: item.brand }),
    };
  });
}
