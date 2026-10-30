import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Product } from '../lib/catalogue';

interface ProductImageProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductImage({
  product,
  priority = false,
  className,
}: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (failedSource === product.thumbnail) {
    return (
      <div className="image-fallback">
        <ImageOff size={28} aria-hidden="true" />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={product.thumbnail}
      alt={product.title}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width="320"
      height="320"
      onError={() => setFailedSource(product.thumbnail)}
    />
  );
}
