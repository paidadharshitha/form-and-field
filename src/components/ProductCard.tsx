import {
  ArrowUpRight,
  Check,
  GitCompareArrows,
  Heart,
  Star,
} from 'lucide-react';
import { formatCategory, type Product } from '../lib/catalogue';
import { formatPrice } from '../lib/format';
import { ProductImage } from './ProductImage';

export interface ProductActions {
  savedIds: readonly number[];
  compareIds: readonly number[];
  onOpen: (product: Product) => void;
  onSave: (id: number) => void;
  onCompare: (id: number) => void;
}

export function ProductCard({
  product,
  priority,
  actions,
}: {
  product: Product;
  priority: boolean;
  actions: ProductActions;
}) {
  const saved = actions.savedIds.includes(product.id);
  const compared = actions.compareIds.includes(product.id);
  const compareDisabled = !compared && actions.compareIds.length >= 3;
  return (
    <article
      className={`product-card ${compared ? 'is-compared' : ''}`}
      aria-labelledby={`product-${product.id}`}
    >
      <div className={`product-image category-${product.category}`}>
        <button
          className="product-preview"
          aria-label={`View details for ${product.title}`}
          onClick={() => actions.onOpen(product)}
        >
          <ProductImage product={product} priority={priority} />
          <span className="quick-view-label">
            Quick view <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </button>
        <button
          className={`save-product ${saved ? 'is-saved' : ''}`}
          id={`save-product-${product.id}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${product.title}`}
          aria-pressed={saved}
          onClick={() => actions.onSave(product.id)}
        >
          <Heart
            size={17}
            fill={saved ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
        {product.stock === 0 && (
          <span className="stock-label">Out of stock</span>
        )}
      </div>
      <div className="product-info">
        <p className="product-category">{formatCategory(product.category)}</p>
        <h3 id={`product-${product.id}`}>
          <button
            className="product-title-button"
            onClick={() => actions.onOpen(product)}
          >
            {product.title}
          </button>
        </h3>
        <p className="list-description">{product.description}</p>
        <div className="product-meta">
          <span className="product-price">{formatPrice(product.price)}</span>
          <span
            className="product-rating"
            aria-label={`Rated ${product.rating.toFixed(2)} out of 5`}
          >
            <Star size={13} fill="currentColor" aria-hidden="true" />
            {product.rating.toFixed(2)}
            <span className="rating-scale"> / 5</span>
          </span>
        </div>
        <div className="product-card-footer">
          <span
            className={`availability ${product.stock === 0 ? 'unavailable' : ''}`}
          >
            <span aria-hidden="true" />
            {product.stock > 0 ? 'In stock' : 'Unavailable'}
          </span>
          <button
            className="compare-toggle"
            aria-label={
              compared
                ? `Remove ${product.title} from comparison`
                : `Compare ${product.title}`
            }
            aria-pressed={compared}
            disabled={compareDisabled}
            title={
              compareDisabled
                ? 'Remove a product to compare another (maximum 3).'
                : undefined
            }
            onClick={() => actions.onCompare(product.id)}
          >
            {compared ? (
              <Check size={13} aria-hidden="true" />
            ) : (
              <GitCompareArrows size={13} aria-hidden="true" />
            )}
            {compared ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>
    </article>
  );
}
