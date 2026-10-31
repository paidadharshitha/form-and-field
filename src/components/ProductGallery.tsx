import { useEffect, useId, useRef, useState } from 'react';
import { ImageOff, ZoomIn, ZoomOut } from 'lucide-react';
import type { Product } from '../lib/catalogue';

interface GalleryFrameProps {
  source: string;
  thumbnail: string;
  title: string;
  position: number;
  count: number;
}

function GalleryFrame({
  source,
  thumbnail,
  title,
  position,
  count,
}: GalleryFrameProps) {
  const viewportId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [displaySource, setDisplaySource] = useState(source);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [zoomed, setZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const usingFallback = displaySource !== source;

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    element.scrollLeft = zoomed
      ? (element.scrollWidth - element.clientWidth) / 2
      : 0;
    element.scrollTop = zoomed
      ? (element.scrollHeight - element.clientHeight) / 2
      : 0;
    if (zoomed) element.focus({ preventScroll: true });
  }, [zoomed]);

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  return (
    <>
      <div
        ref={viewport}
        id={viewportId}
        className={`gallery-viewport ${zoomed ? 'is-zoomed' : ''} ${dragging ? 'is-dragging' : ''}`}
        role="region"
        aria-label={zoomed ? 'Zoomed product image' : 'Product image viewer'}
        aria-describedby={zoomed ? `${viewportId}-hint` : undefined}
        tabIndex={zoomed ? 0 : -1}
        onKeyDown={(event) => {
          if (!zoomed) return;
          const movements: Record<string, [number, number]> = {
            ArrowLeft: [-60, 0],
            ArrowRight: [60, 0],
            ArrowUp: [0, -60],
            ArrowDown: [0, 60],
          };
          const movement = movements[event.key];
          if (!movement) return;
          event.preventDefault();
          event.currentTarget.scrollBy({ left: movement[0], top: movement[1] });
        }}
        onPointerDown={(event) => {
          if (!zoomed || event.pointerType === 'touch' || event.button !== 0)
            return;
          event.preventDefault();
          const element = event.currentTarget;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: element.scrollLeft,
            top: element.scrollTop,
          };
          setDragging(true);
          element.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          event.currentTarget.scrollLeft =
            drag.current.left - (event.clientX - drag.current.x);
          event.currentTarget.scrollTop =
            drag.current.top - (event.clientY - drag.current.y);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <div className="gallery-canvas">
          {status === 'error' ? (
            <div className="image-fallback">
              <ImageOff size={32} aria-hidden="true" />
              <span>Image unavailable</span>
            </div>
          ) : (
            <img
              src={displaySource}
              alt={title}
              width="480"
              height="480"
              decoding="async"
              draggable={false}
              onLoad={() => setStatus('ready')}
              onError={() => {
                setZoomed(false);
                if (displaySource !== thumbnail) {
                  setDisplaySource(thumbnail);
                  setStatus('loading');
                } else {
                  setStatus('error');
                }
              }}
            />
          )}
        </div>
      </div>
      <div className="gallery-toolbar">
        <p className="gallery-position" aria-live="polite">
          Image {position} of {count}
        </p>
        <button
          className="gallery-zoom"
          type="button"
          disabled={status !== 'ready'}
          aria-label={
            zoomed ? 'Zoom out of product image' : 'Zoom in on product image'
          }
          aria-pressed={zoomed}
          aria-controls={viewportId}
          onClick={() => setZoomed((value) => !value)}
        >
          {zoomed ? (
            <ZoomOut size={16} aria-hidden="true" />
          ) : (
            <ZoomIn size={16} aria-hidden="true" />
          )}
          {zoomed ? 'Zoom out' : 'Zoom in'}
        </button>
      </div>
      {zoomed && (
        <p className="gallery-hint" id={`${viewportId}-hint`}>
          Drag, swipe, or use arrow keys to explore.
        </p>
      )}
      {usingFallback && status !== 'error' && (
        <p className="gallery-hint" role="status">
          This view couldn’t load. Showing the product thumbnail.
        </p>
      )}
    </>
  );
}

function GalleryThumbnail({ source }: { source: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <ImageOff size={18} aria-hidden="true" />
  ) : (
    <img
      src={source}
      alt=""
      width="64"
      height="64"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function ProductGallery({ product }: { product: Product }) {
  const images = [
    ...new Set(product.images?.length ? product.images : [product.thumbnail]),
  ];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const thumbnails = useRef<HTMLDivElement>(null);

  return (
    <div
      className="product-gallery"
      role="group"
      aria-label={`Product images for ${product.title}`}
    >
      <GalleryFrame
        key={images[selectedIndex]}
        source={images[selectedIndex]}
        thumbnail={product.thumbnail}
        title={product.title}
        position={selectedIndex + 1}
        count={images.length}
      />
      {images.length > 1 && (
        <div
          className="gallery-thumbnails"
          ref={thumbnails}
          role="group"
          aria-label="Choose product image"
        >
          {images.map((source, index) => (
            <button
              key={source}
              type="button"
              className="gallery-thumbnail"
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
              onKeyDown={(event) => {
                let next: number;
                if (event.key === 'ArrowRight')
                  next = (index + 1) % images.length;
                else if (event.key === 'ArrowLeft')
                  next = (index - 1 + images.length) % images.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = images.length - 1;
                else return;
                event.preventDefault();
                setSelectedIndex(next);
                thumbnails.current
                  ?.querySelectorAll<HTMLButtonElement>('button')
                  [next]?.focus();
              }}
            >
              <GalleryThumbnail source={source} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
