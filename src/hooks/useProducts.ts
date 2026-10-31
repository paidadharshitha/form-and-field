import { useEffect, useState } from 'react';
import { parseProducts, type Product } from '../lib/catalogue';

export const PRODUCTS_URL =
  'https://dummyjson.com/products?limit=0&select=id,title,description,category,price,rating,thumbnail,images,reviews,brand,stock';

type ProductState =
  | { status: 'loading'; products: Product[] }
  | { status: 'success'; products: Product[] }
  | { status: 'error'; products: Product[] };

export function useProducts() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ProductState>({
    status: 'loading',
    products: [],
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setState({ status: 'loading', products: [] });

    async function load() {
      try {
        const response = await fetch(PRODUCTS_URL, {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(`Catalogue request failed: ${response.status}`);
        const products = parseProducts(await response.json());
        if (active) setState({ status: 'success', products });
      } catch {
        if (active) setState({ status: 'error', products: [] });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
