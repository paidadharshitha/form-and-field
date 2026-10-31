import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId, useState } from 'react';
import { type Category, type Filters } from '../lib/catalogue';

interface FilterPanelProps {
  categories: Category[];
  brands: string[];
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  priceError: string | null;
}

export function FilterPanel({
  categories,
  brands,
  filters,
  onChange,
  priceError,
}: FilterPanelProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const selectedIndex = categories.findIndex(
    (category) => category.value === filters.category,
  );
  const visibleCategories = expanded ? categories : categories.slice(0, 7);
  if (!expanded && selectedIndex >= 7)
    visibleCategories.push(categories[selectedIndex]);
  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...visibleCategories,
  ];

  return (
    <div className="filter-panel">
      <fieldset className="category-filter">
        <legend>Category</legend>
        <div className="category-options">
          {categoryOptions.map((category) => (
            <label
              className={`category-option ${filters.category === category.value ? 'is-selected' : ''}`}
              key={category.value}
            >
              <input
                type="radio"
                name={`${id}-category`}
                value={category.value}
                checked={filters.category === category.value}
                onChange={() => onChange('category', category.value)}
              />
              <span>{category.label}</span>
            </label>
          ))}
        </div>
        {categories.length > 7 && (
          <button
            className="text-button category-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded
              ? 'Show fewer categories'
              : `View all ${categories.length} categories`}
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}
      </fieldset>
      <fieldset className="brand-filter">
        <legend>Brand</legend>
        <label className="sr-only" htmlFor={`${id}-brand`}>
          Filter by brand
        </label>
        <div className="select-wrap brand-filter-select">
          <select
            id={`${id}-brand`}
            value={filters.brand || ''}
            onChange={(event) => onChange('brand', event.target.value)}
          >
            <option value="">All brands</option>
            {filters.brand && !brands.includes(filters.brand) && (
              <option value={filters.brand}>{filters.brand}</option>
            )}
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      </fieldset>
      <fieldset className="price-filter">
        <legend>
          Price range <span>USD</span>
        </legend>
        <div className="price-inputs">
          <label htmlFor={`${id}-min`}>
            <span>Min price</span>
            <div className="price-input">
              <span aria-hidden="true">$</span>
              <input
                id={`${id}-min`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={filters.minPrice}
                onChange={(event) => onChange('minPrice', event.target.value)}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? `${id}-price-error` : undefined}
              />
            </div>
          </label>
          <span className="price-separator" aria-hidden="true">
            –
          </span>
          <label htmlFor={`${id}-max`}>
            <span>Max price</span>
            <div className="price-input">
              <span aria-hidden="true">$</span>
              <input
                id={`${id}-max`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="Any"
                value={filters.maxPrice}
                onChange={(event) => onChange('maxPrice', event.target.value)}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? `${id}-price-error` : undefined}
              />
            </div>
          </label>
        </div>
        {priceError ? (
          <p className="field-error" id={`${id}-price-error`} role="alert">
            {priceError}
          </p>
        ) : (
          <p className="field-hint">A good find, within your budget.</p>
        )}
        <div className="price-presets" aria-label="Quick price ranges">
          {[50, 100, 200].map((price) => (
            <button
              key={price}
              aria-pressed={
                filters.minPrice === '' && filters.maxPrice === String(price)
              }
              onClick={() => {
                onChange('minPrice', '');
                onChange('maxPrice', String(price));
              }}
            >
              Up to ${price}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="quality-filter">
        <legend>A few good preferences</legend>
        <label className="rating-filter-label" htmlFor={`${id}-rating`}>
          Minimum rating
        </label>
        <div className="select-wrap rating-filter-select">
          <select
            id={`${id}-rating`}
            value={filters.minRating || ''}
            onChange={(event) => onChange('minRating', event.target.value)}
          >
            <option value="">Any rating</option>
            <option value="4">4 stars & up</option>
            <option value="4.5">4.5 stars & up</option>
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
        <label className="stock-filter">
          <input
            type="checkbox"
            checked={Boolean(filters.inStockOnly)}
            onChange={(event) => onChange('inStockOnly', event.target.checked)}
          />
          <span>In stock only</span>
        </label>
      </fieldset>
    </div>
  );
}
