import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Product } from '../lib/catalogue';

interface ProductImageProps {
  product: Product;
  priority?: boolean;
  className?: string;
  detailed?: boolean;
}

export function ProductImage({
  product,
  priority = false,
  className,
  detailed = false,
}: ProductImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const preferredSource = detailed
    ? (product.images?.[0] ?? product.thumbnail)
    : product.thumbnail;
  const source = failedSources.includes(preferredSource)
    ? product.thumbnail
    : preferredSource;

  if (failedSources.includes(source)) {
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
      src={source}
      alt={product.title}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width="320"
      height="320"
      onError={() => setFailedSources((current) => [...current, source])}
    />
  );
}
