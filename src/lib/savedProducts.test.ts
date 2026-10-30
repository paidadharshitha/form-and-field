import { describe, expect, it } from 'vitest';
import { parseSavedIds, toggleSavedId } from './savedProducts';

describe('parseSavedIds', () => {
  it('restores positive safe IDs in saved order and removes duplicates', () => {
    expect(parseSavedIds('[3, 1, 3, 24, 1]')).toEqual([3, 1, 24]);
  });

  it.each([null, '', '{broken', 'null', '{}', '"1"', '42'])(
    'recovers from absent or malformed storage: %s',
    (raw) => {
      expect(parseSavedIds(raw)).toEqual([]);
    },
  );

  it('rejects invalid entries without losing the valid saved products', () => {
    expect(
      parseSavedIds(
        '[1, "2", null, false, -1, 0, 1.5, 9007199254740992, {}, 3]',
      ),
    ).toEqual([1, 3]);
  });
});

describe('toggleSavedId', () => {
  it('saves and removes IDs without changing the original list', () => {
    const original = [2, 4];
    expect(toggleSavedId(original, 6)).toEqual([2, 4, 6]);
    expect(toggleSavedId(original, 2)).toEqual([4]);
    expect(original).toEqual([2, 4]);
  });

  it.each([0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'does not save an invalid ID: %s',
    (id) => {
      expect(toggleSavedId([2, 4], id)).toEqual([2, 4]);
    },
  );
});
