import { ImageOff, Star } from 'lucide-react';
import { useState } from 'react';
import { formatCategory, type Product } from '../lib/catalogue';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function ProductCard({
  product,
  priority,
}: {
  product: Product;
  priority: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="product-card" aria-labelledby={`product-${product.id}`}>
      <div className={`product-image category-${product.category}`}>
        {imageFailed ? (
          <div className="image-fallback">
            <ImageOff size={28} aria-hidden="true" />
            <span>Image unavailable</span>
          </div>
        ) : (
          <img
            src={product.thumbnail}
            alt={product.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            width="320"
            height="320"
            onError={() => setImageFailed(true)}
          />
        )}
        {product.stock === 0 && (
          <span className="stock-label">Out of stock</span>
        )}
      </div>
      <div className="product-info">
        <p className="product-category">{formatCategory(product.category)}</p>
        <h3 id={`product-${product.id}`}>{product.title}</h3>
        <div className="product-meta">
          <span className="product-price">
            {currency.format(product.price)}
          </span>
          <span
            className="product-rating"
            aria-label={`Rated ${product.rating.toFixed(2)} out of 5`}
          >
            <Star size={13} fill="currentColor" aria-hidden="true" />
            {product.rating.toFixed(2)}
            <span className="rating-scale"> / 5</span>
          </span>
        </div>
      </div>
    </article>
  );
}
