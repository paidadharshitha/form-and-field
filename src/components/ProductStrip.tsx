import { useId, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Product } from '../lib/catalogue';
import { formatPrice } from '../lib/format';
import { ProductImage } from './ProductImage';

interface ProductStripProps {
  title: string;
  description?: string;
  products: Product[];
  onOpen: (product: Product) => void;
  action?: ReactNode;
  headingLevel?: 2 | 3;
}

export function ProductStrip({
  title,
  description,
  products,
  onOpen,
  action,
  headingLevel = 2,
}: ProductStripProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  if (products.length === 0) return null;

  return (
    <section className="product-strip" aria-labelledby={`${id}-title`}>
      <div className="product-strip-header">
        <div>
          <Heading id={`${id}-title`}>{title}</Heading>
          {description && <p>{description}</p>}
        </div>
        {action && <div className="product-strip-action">{action}</div>}
      </div>
      <ul className="product-strip-list">
        {products.map((product) => (
          <li key={product.id}>
            <button
              type="button"
              className="product-strip-item"
              aria-label={`View ${product.title}`}
              onClick={() => onOpen(product)}
            >
              <span className="product-strip-image">
                <ProductImage product={product} />
                <span className="product-strip-arrow" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </span>
              <span className="product-strip-name">{product.title}</span>
              <span className="product-strip-price">
                {formatPrice(product.price)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
