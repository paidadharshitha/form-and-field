import { ArrowDown, ArrowUpRight, Heart, SearchX, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Filters, Product } from '../lib/catalogue';
import type { FilterSuggestion } from '../lib/guidance';
import { ProductCard, type ProductActions } from './ProductCard';

interface ProductResultsProps {
  products: Product[];
  status: 'loading' | 'success' | 'error';
  query: string;
  priceError: string | null;
  onReset: () => void;
  onRetry: () => void;
  actions: ProductActions;
  view: 'grid' | 'list';
  emptySaved: boolean;
  onBrowseAll: () => void;
  suggestions?: FilterSuggestion[];
  onApplySuggestion?: (filters: Filters) => void;
}

export function ProductResults({
  products,
  status,
  query,
  priceError,
  onReset,
  onRetry,
  actions,
  view,
  emptySaved,
  onBrowseAll,
  suggestions = [],
  onApplySuggestion,
}: ProductResultsProps) {
  const [visibleCount, setVisibleCount] = useState(24);
  const progress = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // The load-more button disappears on the last batch; keep focus in context.
    if (visibleCount > 24 && visibleCount >= products.length) {
      progress.current?.focus({ preventScroll: true });
    }
  }, [visibleCount, products.length]);

  if (status === 'loading')
    return (
      <div
        className="product-grid skeleton-grid"
        role="status"
        aria-label="Loading products"
      >
        <span className="sr-only">Loading the catalogue…</span>
        {Array.from({ length: 9 }, (_, index) => (
          <div className="skeleton-card" key={index} aria-hidden="true">
            <div className="skeleton-image" />
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line medium" />
          </div>
        ))}
      </div>
    );

  if (status === 'error')
    return (
      <div className="empty-state" role="alert">
        <span className="state-icon">
          <WifiOff size={30} />
        </span>
        <h3>We couldn’t load the catalogue.</h3>
        <p>A connection hiccup got in the way. Please try again.</p>
        <button className="primary-button" onClick={onRetry}>
          Try again <ArrowUpRight size={16} />
        </button>
      </div>
    );

  if (priceError)
    return (
      <div className="empty-state">
        <span className="state-icon">
          <SearchX size={30} />
        </span>
        <h3>Let’s check that price range.</h3>
        <p>{priceError}</p>
        <button className="primary-button" onClick={onReset}>
          Reset filters <ArrowUpRight size={16} />
        </button>
      </div>
    );

  if (emptySaved)
    return (
      <div className="empty-state saved-empty">
        <span className="state-icon">
          <Heart size={30} aria-hidden="true" />
        </span>
        <h3>Your next favourites belong here.</h3>
        <p>
          Tap the heart on a product to keep it in your collection. A good find
          is worth coming back to.
        </p>
        <button className="primary-button" onClick={onBrowseAll}>
          Browse all products <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    );

  if (products.length === 0)
    return (
      <div className="empty-state">
        <span className="state-icon">
          <SearchX size={30} />
        </span>
        <h3>No finds this time.</h3>
        <p>
          {query.trim() ? (
            <>
              Nothing matches “
              <span className="empty-query">{query.trim()}</span>” with these
              filters.
            </>
          ) : (
            'No products match your current filters.'
          )}
          <br />
          Try a different search or give your filters a little room.
        </p>
        {suggestions.length > 0 && onApplySuggestion && (
          <div
            className="filter-recovery"
            role="group"
            aria-label="Ways to find a match"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                onClick={() => onApplySuggestion(suggestion.filters)}
              >
                <span>{suggestion.label}</span>
                <small>
                  {suggestion.count} matching{' '}
                  {suggestion.count === 1 ? 'product' : 'products'}
                </small>
              </button>
            ))}
          </div>
        )}
        <button className="primary-button" onClick={onReset}>
          Clear all filters <ArrowUpRight size={16} />
        </button>
      </div>
    );

  const visible = products.slice(0, visibleCount);
  return (
    <>
      <div className={`product-grid ${view === 'list' ? 'product-list' : ''}`}>
        {visible.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 6}
            actions={actions}
            query={query}
          />
        ))}
      </div>
      <div className="load-more">
        <p
          ref={progress}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          You’ve explored {visible.length} of {products.length} products
        </p>
        {visibleCount < products.length ? (
          <button
            className="secondary-button"
            onClick={() => {
              setVisibleCount((count) => count + 24);
            }}
          >
            Explore more <ArrowDown size={16} />
          </button>
        ) : (
          <span className="end-note">
            A little of everything. All in one place.
          </span>
        )}
      </div>
    </>
  );
}
