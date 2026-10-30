import { ArrowUpRight, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { MobileFilters } from './components/MobileFilters';
import { ProductResults } from './components/ProductResults';
import { SearchBar } from './components/SearchBar';
import { useCatalogueState } from './hooks/useCatalogueState';
import { useProducts } from './hooks/useProducts';
import {
  filterAndSortProducts,
  formatCategory,
  getCategories,
  validatePriceRange,
  type SortOption,
} from './lib/catalogue';

function Brand({ small = false }: { small?: boolean }) {
  return (
    <a
      className={`brand ${small ? 'brand-small' : ''}`}
      href="#top"
      aria-label="Form and Field home"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M2 2h11v11H2zM19 2h11v11H19zM2 19h11v11H2z" />
        <circle cx="24.5" cy="24.5" r="5.5" />
      </svg>
      <span>
        form <span className="brand-amp">&</span> field
        <span className="brand-period">.</span>
      </span>
    </a>
  );
}

export default function App() {
  const { products, status, retry } = useProducts();
  const { filters, sort, setFilter, setSort, clearFilters } =
    useCatalogueState();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const categories = useMemo(() => getCategories(products), [products]);
  const priceError = validatePriceRange(filters);
  const results = useMemo(
    () => filterAndSortProducts(products, filters, sort),
    [products, filters, sort],
  );
  const count = priceError ? 0 : results.length;
  const hasPrice = Boolean(filters.minPrice || filters.maxPrice);
  const filterCount = Number(Boolean(filters.category)) + Number(hasPrice);
  const hasFilters = filterCount > 0 || Boolean(filters.query);
  const title = filters.query.trim()
    ? 'Your search results'
    : filters.category
      ? formatCategory(filters.category)
      : 'All products';
  const filterProps = {
    categories,
    total: products.length,
    filters,
    onChange: setFilter,
    priceError,
  };

  return (
    <div id="top">
      <a className="skip-link" href="#results-heading">
        Skip to products
      </a>
      <header className="site-header">
        <div className="page-width header-inner">
          <Brand />
          <nav aria-label="Main navigation">
            <a className="nav-link is-current" href="#catalogue">
              The catalogue
            </a>
            <a className="nav-link" href="#about">
              A little about us <ArrowUpRight size={14} />
            </a>
          </nav>
          <span className="header-note">Consider your everyday, found.</span>
        </div>
      </header>
      <main className="page-width">
        <section className="intro" aria-labelledby="page-title">
          <h1 id="page-title">
            Good things.
            <br />
            <span>Easy to find.</span>
          </h1>
          <div className="intro-copy">
            <p>
              Everyday essentials. Unexpected favourites.
              <br className="desktop-break" /> Find a little of everything, all
              in one place.
            </p>
            <div className="collection-note">
              <span className="status-dot" />
              {status === 'success'
                ? `${products.length} products. ${categories.length} categories. Your next find.`
                : 'A whole collection of possibilities.'}
            </div>
          </div>
        </section>
        <div className="search-row">
          <SearchBar
            query={filters.query}
            onChange={(value) => setFilter('query', value)}
          />
          <span className="search-note">
            A little less searching.
            <br />
            <strong>A little more finding.</strong>
          </span>
        </div>
        <div className="catalogue-layout" id="catalogue">
          <aside className="desktop-filters" aria-label="Product filters">
            <div className="filter-heading">
              <h2>Filters</h2>
              {hasFilters && (
                <button
                  className="text-button reset-button"
                  onClick={clearFilters}
                >
                  Reset all
                </button>
              )}
            </div>
            <FilterPanel {...filterProps} />
            <div className="sidebar-note">
              <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <path
                  d="M18 2v32M2 18h32M6.7 6.7l22.6 22.6M6.7 29.3L29.3 6.7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <p>
                Good finds start
                <br />
                with a little curiosity.
              </p>
            </div>
          </aside>
          <section
            className="results"
            aria-labelledby="results-heading"
            aria-busy={status === 'loading'}
          >
            <div className="results-toolbar">
              <div className="results-title">
                <h2 id="results-heading" tabIndex={-1}>
                  {title}
                </h2>
                <p role="status" aria-live="polite" aria-atomic="true">
                  {status === 'loading'
                    ? 'Finding the good things…'
                    : status === 'error'
                      ? 'Catalogue unavailable'
                      : `${count} ${count === 1 ? 'product' : 'products'}${hasFilters ? ` of ${products.length}` : ' to explore'}`}
                </p>
              </div>
              <div className="result-controls">
                <button
                  className="mobile-filter-button"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal size={17} />
                  Filters{filterCount > 0 && <span>{filterCount}</span>}
                </button>
                <div className="sort-control">
                  <label htmlFor="sort-products">Sort by</label>
                  <div className="select-wrap">
                    <select
                      id="sort-products"
                      aria-label="Sort products"
                      value={sort}
                      onChange={(event) =>
                        setSort(event.target.value as SortOption)
                      }
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
            {hasFilters && (
              <div className="active-filters" aria-label="Active filters">
                {filters.query && (
                  <button onClick={() => setFilter('query', '')}>
                    “{filters.query}”{' '}
                    <X size={13} aria-label="Remove search filter" />
                  </button>
                )}
                {filters.category && (
                  <button onClick={() => setFilter('category', '')}>
                    {formatCategory(filters.category)}{' '}
                    <X size={13} aria-label="Remove category filter" />
                  </button>
                )}
                {hasPrice && (
                  <button
                    onClick={() => {
                      setFilter('minPrice', '');
                      setFilter('maxPrice', '');
                    }}
                  >
                    ${filters.minPrice || '0'} –{' '}
                    {filters.maxPrice ? `$${filters.maxPrice}` : 'Any'}{' '}
                    <X size={13} aria-label="Remove price filter" />
                  </button>
                )}
                <button className="clear-filters" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            )}
            <ProductResults
              key={JSON.stringify({ filters, sort, status })}
              products={results}
              status={status}
              query={filters.query}
              priceError={priceError}
              onReset={clearFilters}
              onRetry={retry}
            />
          </section>
        </div>
      </main>
      <footer className="site-footer" id="about">
        <div className="page-width footer-inner">
          <div>
            <Brand small />
            <p>A thoughtful way to find your everyday.</p>
          </div>
          <div className="footer-details">
            <p>A sample catalogue, built for the joy of finding.</p>
            <p>
              Product data by{' '}
              <a href="https://dummyjson.com" target="_blank" rel="noreferrer">
                DummyJSON <ArrowUpRight size={12} />
              </a>
              <span aria-hidden="true"> · </span>Prices in USD
            </p>
          </div>
        </div>
      </footer>
      {mobileFiltersOpen && (
        <MobileFilters
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          onClear={clearFilters}
          count={count}
        >
          <FilterPanel {...filterProps} />
        </MobileFilters>
      )}
    </div>
  );
}
