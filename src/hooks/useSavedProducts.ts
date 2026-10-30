import { useEffect, useState } from 'react';
import {
  isProductId,
  parseSavedIds,
  SAVED_PRODUCTS_KEY,
  toggleSavedId,
} from '../lib/savedProducts';

interface SavedState {
  savedIds: number[];
  storageAvailable: boolean;
}

function readSavedProducts(): SavedState {
  try {
    return {
      savedIds: parseSavedIds(window.localStorage.getItem(SAVED_PRODUCTS_KEY)),
      storageAvailable: true,
    };
  } catch {
    return { savedIds: [], storageAvailable: false };
  }
}

export function useSavedProducts() {
  const [state, setState] = useState(readSavedProducts);

  useEffect(() => {
    let available = true;
    try {
      window.localStorage.setItem(
        SAVED_PRODUCTS_KEY,
        JSON.stringify(state.savedIds),
      );
    } catch {
      available = false;
    }
    setState((current) =>
      current.storageAvailable === available
        ? current
        : { ...current, storageAvailable: available },
    );
  }, [state.savedIds]);

  useEffect(() => {
    function syncSavedProducts(event: StorageEvent) {
      if (event.key !== SAVED_PRODUCTS_KEY && event.key !== null) return;
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }

      const savedIds = parseSavedIds(event.newValue);
      setState((current) => {
        // Returning the same state also prevents storage events bouncing between tabs.
        const unchanged =
          savedIds.length === current.savedIds.length &&
          savedIds.every((id, index) => id === current.savedIds[index]);
        return unchanged ? current : { savedIds, storageAvailable: true };
      });
    }

    window.addEventListener('storage', syncSavedProducts);
    return () => window.removeEventListener('storage', syncSavedProducts);
  }, []);

  function toggleSaved(id: number) {
    if (!isProductId(id)) return;
    setState((current) => ({
      ...current,
      savedIds: toggleSavedId(current.savedIds, id),
    }));
  }

  return { ...state, toggleSaved };
}
