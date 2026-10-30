import { ChevronDown, Grid2X2, List, SlidersHorizontal } from 'lucide-react';
import type { SortOption } from '../lib/catalogue';

interface CatalogueToolbarProps {
  title: string;
  resultText: string;
  filterCount: number;
  sort: SortOption;
  onSort: (sort: SortOption) => void;
  view: 'grid' | 'list';
  onView: (view: 'grid' | 'list') => void;
  onOpenFilters: () => void;
}

export function CatalogueToolbar({
  title,
  resultText,
  filterCount,
  sort,
  onSort,
  view,
  onView,
  onOpenFilters,
}: CatalogueToolbarProps) {
  return (
    <div className="results-toolbar">
      <div className="results-overview">
        <div className="results-title">
          <h2 id="results-heading" tabIndex={-1}>
            {title}
          </h2>
          <p role="status" aria-live="polite" aria-atomic="true">
            {resultText}
          </p>
        </div>
        <div className="view-switch" role="group" aria-label="Product layout">
          <button
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => onView('grid')}
          >
            <Grid2X2 size={16} aria-hidden="true" />
          </button>
          <button
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => onView('list')}
          >
            <List size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="result-controls">
        <button className="mobile-filter-button" onClick={onOpenFilters}>
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters{filterCount > 0 && <span>{filterCount}</span>}
        </button>
        <div className="sort-control">
          <label htmlFor="sort-products">Sort by</label>
          <div className="select-wrap">
            <select
              id="sort-products"
              aria-label="Sort products"
              value={sort}
              onChange={(event) => onSort(event.target.value as SortOption)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating-desc">Rating: high to low</option>
              <option value="rating-asc">Rating: low to high</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
