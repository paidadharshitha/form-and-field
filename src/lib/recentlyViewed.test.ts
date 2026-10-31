import { describe, expect, it } from 'vitest';
import {
  parseRecentlyViewed,
  rememberProduct,
  restoreRecentlyViewed,
} from './recentlyViewed';

describe('recently viewed history', () => {
  it('undoes a clear without losing newer views or duplicating older ones', () => {
    expect(restoreRecentlyViewed([9, 3], [3, 8, 7, 6, 5, 4, 2, 1])).toEqual([
      9, 3, 8, 7, 6, 5, 4, 2,
    ]);
    expect(restoreRecentlyViewed([], [2, 1])).toEqual([2, 1]);
  });
  it('moves a revisited product first without duplicates or mutating its input', () => {
    const previous = [3, 2, 1];
    expect(rememberProduct(previous, 2)).toEqual([2, 3, 1]);
    expect(previous).toEqual([3, 2, 1]);
  });
  it('keeps the eight most recent IDs', () => {
    expect(rememberProduct([8, 7, 6, 5, 4, 3, 2, 1], 9)).toEqual([
      9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    expect(parseRecentlyViewed('[9,8,7,6,5,4,3,2,1]')).toEqual([
      9, 8, 7, 6, 5, 4, 3, 2,
    ]);
  });
  it('ignores malformed history and invalid or duplicate IDs', () => {
    expect(parseRecentlyViewed('{broken')).toEqual([]);
    expect(parseRecentlyViewed('[2,"3",null,-1,0,1.5,2,4]')).toEqual([2, 4]);
    expect(rememberProduct([2, 1], NaN)).toEqual([2, 1]);
  });
});
