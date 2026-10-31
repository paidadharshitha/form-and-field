import { useState } from 'react';
import {
  parseRecentlyViewed,
  RECENTLY_VIEWED_KEY,
  rememberProduct,
  restoreRecentlyViewed,
} from '../lib/recentlyViewed';

function readHistory() {
  try {
    return {
      recentIds: parseRecentlyViewed(
        window.localStorage.getItem(RECENTLY_VIEWED_KEY),
      ),
      storageAvailable: true,
    };
  } catch {
    return { recentIds: [], storageAvailable: false };
  }
}

export function useRecentlyViewed() {
  const [state, setState] = useState(readHistory);

  // History is written only when the visitor opens or clears a product, never on mount.
  function updateHistory(recentIds: number[]) {
    let storageAvailable = true;
    try {
      window.localStorage.setItem(
        RECENTLY_VIEWED_KEY,
        JSON.stringify(recentIds),
      );
    } catch {
      storageAvailable = false;
    }
    setState({ recentIds, storageAvailable });
  }

  return {
    ...state,
    recordView: (id: number) =>
      updateHistory(rememberProduct(state.recentIds, id)),
    clearHistory: () => updateHistory([]),
    restoreHistory: (ids: readonly number[]) =>
      updateHistory(restoreRecentlyViewed(state.recentIds, ids)),
  };
}
