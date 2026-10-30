export const SAVED_PRODUCTS_KEY = 'form-field:saved-products:v1';

export function isProductId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/** Storage is untrusted: retain valid IDs, remove duplicates, and ignore broken JSON. */
export function parseSavedIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter(isProductId))];
  } catch {
    return [];
  }
}

export function toggleSavedId(ids: readonly number[], id: number): number[] {
  if (!isProductId(id)) return [...ids];
  return ids.includes(id)
    ? ids.filter((savedId) => savedId !== id)
    : [...ids, id];
}
