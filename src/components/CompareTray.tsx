import { ArrowRight, GitCompareArrows, X } from 'lucide-react';
import type { Product } from '../lib/catalogue';
import { ProductImage } from './ProductImage';

export function CompareTray({
  products,
  onRemove,
  onClear,
  onCompare,
}: {
  products: Product[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onCompare: () => void;
}) {
  if (!products.length) return null;
  return (
    <aside
      className="compare-tray"
      aria-label="Products selected for comparison"
    >
      <div className="tray-summary">
        <GitCompareArrows size={19} aria-hidden="true" />
        <div>
          <strong>Your comparison</strong>
          <p role="status" aria-live="polite">
            {products.length} of 3 selected
            {products.length === 1 ? ' · Pick one more' : ''}
          </p>
        </div>
      </div>
      <div className="tray-products">
        {products.map((product) => (
          <div className="tray-product" key={product.id}>
            <ProductImage product={product} />
            <button
              id={`tray-remove-${product.id}`}
              aria-label={`Remove ${product.title} from comparison`}
              onClick={() => onRemove(product.id)}
            >
              <X size={11} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button className="text-button tray-clear" onClick={onClear}>
        Clear
      </button>
      <button
        className="primary-button"
        disabled={products.length < 2}
        onClick={onCompare}
        aria-label="Compare products"
      >
        Compare <ArrowRight size={15} aria-hidden="true" />
      </button>
    </aside>
  );
}
