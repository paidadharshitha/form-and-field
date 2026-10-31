import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { Product } from '../lib/catalogue';
import { formatPrice } from '../lib/format';
import { ProductImage } from './ProductImage';
import { HighlightedText } from './HighlightedText';

interface SearchBarProps {
  query: string;
  suggestions: Product[];
  isFuzzy: boolean;
  onChange: (value: string) => void;
}

export function SearchBar({
  query,
  suggestions,
  isFuzzy,
  onChange,
}: SearchBarProps) {
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const options = suggestions.slice(0, 5);
  const expanded = open && Boolean(query.trim()) && options.length > 0;
  const activeOption = expanded ? options[activeIndex] : undefined;

  useEffect(() => {
    if (activeOption) {
      document
        .getElementById(`${listId}-${activeOption.id}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeOption, listId]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target;
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if (
        target instanceof HTMLElement &&
        (target.closest('input, textarea, select, dialog') ||
          target.isContentEditable)
      )
        return;
      event.preventDefault();
      input.current?.focus();
    }
    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, []);

  function choose(product: Product) {
    input.current?.focus();
    onChange(product.title);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div
      className="search-combobox"
      role="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <div className="search-field">
        <Search size={20} aria-hidden="true" />
        <label className="sr-only" htmlFor="product-search">
          Search products by name
        </label>
        <input
          ref={input}
          id="product-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            activeOption ? `${listId}-${activeOption.id}` : undefined
          }
          placeholder="Search a name. Typos welcome."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              if (!options.length || !query.trim()) return;
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) =>
                event.key === 'ArrowDown'
                  ? (current + 1) % options.length
                  : current <= 0
                    ? options.length - 1
                    : current - 1,
              );
            } else if (event.key === 'Enter' && activeOption) {
              event.preventDefault();
              choose(activeOption);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              if (expanded) setOpen(false);
              else onChange('');
              setActiveIndex(-1);
            }
          }}
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button
            className="icon-button"
            aria-label="Clear search"
            onClick={() => {
              onChange('');
              setActiveIndex(-1);
              input.current?.focus();
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : (
          <kbd aria-hidden="true">/</kbd>
        )}
      </div>
      {expanded && (
        <div className="search-suggestions">
          <p className="suggestions-heading">
            {isFuzzy ? 'Close matches for your search' : 'Suggested products'}
          </p>
          <ul id={listId} role="listbox" aria-label="Product suggestions">
            {options.map((product, index) => (
              <li
                key={product.id}
                id={`${listId}-${product.id}`}
                role="option"
                aria-selected={index === activeIndex}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(product)}
                onPointerMove={() => setActiveIndex(index)}
              >
                <span className="suggestion-image" aria-hidden="true">
                  <ProductImage product={product} />
                </span>
                <span className="suggestion-name">
                  <HighlightedText text={product.title} query={query} />
                </span>
                <span className="suggestion-price">
                  {formatPrice(product.price)}
                </span>
              </li>
            ))}
          </ul>
          <p className="suggestions-hint">
            Select a product to refine your search.
          </p>
        </div>
      )}
    </div>
  );
}
