import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
}

export function SearchBar({ query, onChange }: SearchBarProps) {
  const input = useRef<HTMLInputElement>(null);

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

  return (
    <div className="search-field" role="search">
      <Search size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor="product-search">
        Search products by name
      </label>
      <input
        ref={input}
        id="product-search"
        type="search"
        placeholder="What are you looking for?"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onChange('');
        }}
        autoComplete="off"
      />
      {query ? (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            input.current?.focus();
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : (
        <kbd aria-hidden="true">/</kbd>
      )}
    </div>
  );
}
