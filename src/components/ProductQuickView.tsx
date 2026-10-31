import { useEffect, useId, useRef } from 'react';
import { Check, GitCompareArrows, Heart, Star } from 'lucide-react';
import { formatCategory, type Product } from '../lib/catalogue';
import { formatAvailability, formatPrice } from '../lib/format';
import { Dialog } from './Dialog';
import { ProductGallery } from './ProductGallery';
import { ProductStrip } from './ProductStrip';

interface ProductQuickViewProps {
  product: Product;
  onClose: () => void;
  onSave: () => void;
  saved: boolean;
  onCompare: () => void;
  compared: boolean;
  compareDisabled: boolean;
  storageAvailable?: boolean;
  similarProducts?: Product[];
  onOpenProduct?: (product: Product) => void;
}

export function ProductQuickView({
  product,
  onClose,
  onSave,
  saved,
  onCompare,
  compared,
  compareDisabled,
  storageAvailable = true,
  similarProducts = [],
  onOpenProduct,
}: ProductQuickViewProps) {
  const limitNoteId = useId();
  const content = useRef<HTMLDivElement>(null);
  const previousProductId = useRef(product.id);
  const comparisonFull = compareDisabled && !compared;

  useEffect(() => {
    if (previousProductId.current !== product.id) {
      const dialog = content.current?.closest('dialog');
      dialog?.scrollTo({ top: 0 });
      dialog
        ?.querySelector<HTMLButtonElement>('.dialog-close')
        ?.focus({ preventScroll: true });
      previousProductId.current = product.id;
    }
  }, [product.id]);

  return (
    <Dialog
      title={product.title}
      onClose={onClose}
      className="quick-view-dialog"
    >
      <div className="qv-layout" ref={content}>
        <ProductGallery key={product.id} product={product} />
        <div className="qv-details">
          <p className="qv-category">
            {formatCategory(product.category)}
            {product.brand?.trim() && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{product.brand}</span>
              </>
            )}
          </p>
          <div className="qv-rating">
            <Star size={16} fill="currentColor" aria-hidden="true" />
            <span>{product.rating.toFixed(2)} out of 5</span>
          </div>
          <p className="qv-price">
            <strong>{formatPrice(product.price)}</strong> <span>USD</span>
          </p>
          <p className="qv-description">{product.description}</p>
          <p
            className={`qv-stock ${product.stock === 0 ? 'is-unavailable' : ''}`}
          >
            {product.stock > 0 && <Check size={15} aria-hidden="true" />}
            {formatAvailability(product.stock)}
          </p>
          <div className="qv-actions">
            <button
              type="button"
              className="primary-button"
              aria-pressed={saved}
              aria-label={
                saved ? `Unsave ${product.title}` : `Save ${product.title}`
              }
              onClick={onSave}
            >
              <Heart
                size={17}
                fill={saved ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              {saved ? 'Saved to wishlist' : 'Save to wishlist'}
            </button>
            <button
              type="button"
              className="secondary-button"
              aria-pressed={compared}
              aria-label={
                compared
                  ? `Remove ${product.title} from comparison`
                  : `Compare ${product.title}`
              }
              disabled={comparisonFull}
              aria-describedby={comparisonFull ? limitNoteId : undefined}
              onClick={onCompare}
            >
              {compared ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <GitCompareArrows size={17} aria-hidden="true" />
              )}
              {compared ? 'Added to compare' : 'Add to compare'}
            </button>
          </div>
          {comparisonFull && (
            <p className="qv-limit-note" id={limitNoteId}>
              Your comparison has 3 products. Remove one to add this find.
            </p>
          )}
          <p className="qv-note">
            {storageAvailable
              ? 'Keep your favourites close. Your wishlist stays on this browser.'
              : 'Saved for this visit. Your browser has disabled storage.'}
          </p>
        </div>
      </div>
      {onOpenProduct && similarProducts.length > 0 && (
        <ProductStrip
          title="Similar products"
          description="More from this category, close to this price."
          products={similarProducts}
          onOpen={onOpenProduct}
          headingLevel={3}
        />
      )}
    </Dialog>
  );
}
