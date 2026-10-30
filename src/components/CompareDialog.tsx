import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowLeftRight, Heart, Star, X } from 'lucide-react';
import { formatCategory, type Product } from '../lib/catalogue';
import { formatAvailability, formatPrice } from '../lib/format';
import { Dialog } from './Dialog';
import { ProductImage } from './ProductImage';

interface CompareDialogProps {
  products: Product[];
  onClose: () => void;
  onRemove: (id: number) => void;
  onSave: (id: number) => void;
  savedIds: readonly number[];
}

export function CompareDialog({
  products,
  onClose,
  onRemove,
  onSave,
  savedIds,
}: CompareDialogProps) {
  const table = useRef<HTMLTableElement>(null);
  const removedIndex = useRef<number | null>(null);

  useEffect(() => {
    if (removedIndex.current === null) return;
    const remainingButtons =
      table.current?.querySelectorAll<HTMLButtonElement>('.compare-remove');
    if (remainingButtons?.length) {
      const nextIndex = Math.min(
        removedIndex.current,
        remainingButtons.length - 1,
      );
      remainingButtons[nextIndex].focus({ preventScroll: true });
    }
    removedIndex.current = null;
  }, [products]);

  const lowestPrice = Math.min(...products.map((product) => product.price));
  const highestRating = Math.max(...products.map((product) => product.rating));
  const uniqueLowest =
    products.length > 1 &&
    products.filter((product) => product.price === lowestPrice).length === 1;
  const uniqueHighest =
    products.length > 1 &&
    products.filter((product) => product.rating === highestRating).length === 1;
  const rows: { label: string; render: (product: Product) => ReactNode }[] = [
    {
      label: 'Price',
      render: (product) => (
        <div className="compare-value">
          <strong>{formatPrice(product.price)}</strong>
          {uniqueLowest && product.price === lowestPrice && (
            <span className="compare-highlight">Lowest price</span>
          )}
        </div>
      ),
    },
    {
      label: 'Rating',
      render: (product) => (
        <div className="compare-value">
          <span className="compare-rating">
            <Star size={14} fill="currentColor" aria-hidden="true" />
            {product.rating.toFixed(2)} / 5
          </span>
          {uniqueHighest && product.rating === highestRating && (
            <span className="compare-highlight">Highest rated</span>
          )}
        </div>
      ),
    },
    {
      label: 'Category',
      render: (product) => formatCategory(product.category),
    },
    {
      label: 'Brand',
      render: (product) => product.brand?.trim() || 'Not specified',
    },
    {
      label: 'Availability',
      render: (product) => formatAvailability(product.stock),
    },
    {
      label: 'About',
      render: (product) => product.description || 'No description available.',
    },
  ];

  return (
    <Dialog
      title="Compare your finds"
      description="The details, side by side. Find what fits your everyday."
      onClose={onClose}
      className="compare-dialog"
    >
      {products.length === 0 ? (
        <div className="compare-empty">
          <p>
            Your comparison is clear. Choose up to 3 products from the catalogue
            to start again.
          </p>
          <button className="primary-button" type="button" onClick={onClose}>
            Back to the catalogue
          </button>
        </div>
      ) : (
        <>
          {products.length === 1 && (
            <p className="compare-hint">
              Add another product from the catalogue to see how they compare.
            </p>
          )}
          {products.length > 1 && (
            <p className="compare-scroll-hint">
              <ArrowLeftRight size={14} aria-hidden="true" />
              Scroll sideways to see every product
            </p>
          )}
          <div
            className="compare-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Product comparison table"
          >
            <table ref={table} className="compare-table">
              <caption className="sr-only">
                Compare product prices, ratings, category, brand, availability,
                and descriptions.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="compare-row-label">
                    Product
                  </th>
                  {products.map((product) => (
                    <th scope="col" key={product.id}>
                      <div className="compare-product">
                        <button
                          className="icon-button compare-remove"
                          type="button"
                          onClick={() => {
                            removedIndex.current = products.findIndex(
                              (item) => item.id === product.id,
                            );
                            onRemove(product.id);
                          }}
                          aria-label={`Remove ${product.title} from comparison`}
                        >
                          <X size={17} aria-hidden="true" />
                        </button>
                        <div className="compare-image">
                          <ProductImage product={product} priority />
                        </div>
                        <span className="compare-product-title">
                          {product.title}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {products.map((product) => (
                      <td key={product.id}>{row.render(product)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Wishlist</th>
                  {products.map((product) => {
                    const saved = savedIds.includes(product.id);
                    return (
                      <td key={product.id}>
                        <button
                          className="compare-save"
                          type="button"
                          aria-pressed={saved}
                          aria-label={
                            saved
                              ? `Unsave ${product.title}`
                              : `Save ${product.title}`
                          }
                          onClick={() => onSave(product.id)}
                        >
                          <Heart
                            size={15}
                            fill={saved ? 'currentColor' : 'none'}
                            aria-hidden="true"
                          />
                          {saved ? 'Saved' : 'Save this find'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="compare-footer">
            <p>Prices are shown in USD.</p>
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Continue exploring
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
