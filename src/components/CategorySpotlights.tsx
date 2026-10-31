import { ArrowUpRight } from 'lucide-react';
import { formatCategory, type Product } from '../lib/catalogue';
import { ProductImage } from './ProductImage';

const spotlights = ['furniture', 'laptops', 'fragrances'];

export function CategorySpotlights({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (category: string) => void;
}) {
  const picks = spotlights.flatMap((category) => {
    const product =
      products.find(
        (item) => item.category === category && item.title.includes('Chair'),
      ) ?? products.find((item) => item.category === category);
    return product ? [product] : [];
  });
  if (!picks.length) return null;
  return (
    <div
      className="category-spotlights"
      role="group"
      aria-label="Explore a category"
    >
      {picks.map((product) => (
        <button
          key={product.id}
          className={`spotlight spotlight-${product.category}`}
          onClick={() => onSelect(product.category)}
          aria-label={`Explore ${formatCategory(product.category)}`}
        >
          <span className="spotlight-image">
            <ProductImage product={product} priority detailed />
          </span>
          <span className="spotlight-label">
            {formatCategory(product.category)}
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </button>
      ))}
    </div>
  );
}
