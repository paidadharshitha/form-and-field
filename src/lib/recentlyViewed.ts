import { isProductId, parseSavedIds } from './savedProducts';

export const RECENTLY_VIEWED_KEY = 'form-field:recently-viewed:v1';
export const RECENTLY_VIEWED_LIMIT = 8;

export function parseRecentlyViewed(raw: string | null): number[] {
  return parseSavedIds(raw).slice(0, RECENTLY_VIEWED_LIMIT);
}

/** Revisiting an item moves it to the front without duplicating history. */
export function rememberProduct(ids: readonly number[], id: number): number[] {
  if (!isProductId(id)) return [...ids];
  return [id, ...ids.filter((value) => value !== id)].slice(
    0,
    RECENTLY_VIEWED_LIMIT,
  );
}

/** Preserve views made after clearing when the visitor restores older history. */
export function restoreRecentlyViewed(
  current: readonly number[],
  previous: readonly number[],
): number[] {
  return [...new Set([...current, ...previous].filter(isProductId))].slice(
    0,
    RECENTLY_VIEWED_LIMIT,
  );
}
