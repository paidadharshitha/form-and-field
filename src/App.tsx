import { ArrowUpRight, Heart } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActiveFilters } from './components/ActiveFilters';
import { CatalogueToolbar } from './components/CatalogueToolbar';
import { CategorySpotlights } from './components/CategorySpotlights';
import { CompareDialog } from './components/CompareDialog';
import { CompareTray } from './components/CompareTray';
import { FilterPanel } from './components/FilterPanel';
import { MobileFilters } from './components/MobileFilters';
import { ProductQuickView } from './components/ProductQuickView';
import { ProductResults } from './components/ProductResults';
import { SearchBar } from './components/SearchBar';
import { useCatalogueState } from './hooks/useCatalogueState';
import { useProducts } from './hooks/useProducts';
import { useSavedProducts } from './hooks/useSavedProducts';
import {
  filterAndSortProducts,
  formatCategory,
  getCategories,
  validatePriceRange,
  type Product,
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
  const { savedIds, toggleSaved, storageAvailable } = useSavedProducts();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [savedView, setSavedView] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const focusAfterRemoval = useRef<string | null>(null);

  useEffect(() => {
    if (focusAfterRemoval.current) {
      document
        .getElementById(focusAfterRemoval.current)
        ?.focus({ preventScroll: true });
      focusAfterRemoval.current = null;
    }
  }, [savedIds, compareIds]);

  const savedProducts = useMemo(
    () => products.filter((product) => savedIds.includes(product.id)),
    [products, savedIds],
  );
  const sourceProducts = savedView ? savedProducts : products;
  const comparedProducts = products.filter((product) =>
    compareIds.includes(product.id),
  );
  const categories = useMemo(() => getCategories(products), [products]);
  const priceError = validatePriceRange(filters);
  const results = useMemo(
    () => filterAndSortProducts(sourceProducts, filters, sort),
    [sourceProducts, filters, sort],
  );
  const count = priceError ? 0 : results.length;
  const filterCount =
    Number(Boolean(filters.category)) +
    Number(Boolean(filters.minPrice || filters.maxPrice)) +
    Number(Boolean(filters.minRating)) +
    Number(Boolean(filters.inStockOnly));
  const hasFilters = filterCount > 0 || Boolean(filters.query);
  const title = savedView
    ? 'Your saved finds'
    : filters.query.trim()
      ? 'Your search results'
      : filters.category
        ? formatCategory(filters.category)
        : 'All products';
  const resultText =
    status === 'loading'
      ? 'Finding the good things…'
      : status === 'error'
        ? 'Catalogue unavailable'
        : `${count} ${count === 1 ? 'product' : 'products'}${hasFilters ? ` of ${sourceProducts.length}` : ' to explore'}`;
  const filterProps = {
    categories,
    filters,
    onChange: setFilter,
    priceError,
  };

  function saveProduct(id: number) {
    if (
      savedView &&
      savedIds.includes(id) &&
      document.activeElement?.closest('.product-card')
    ) {
      const index = results.findIndex((product) => product.id === id);
      const next = results[index + 1] ?? results[index - 1];
      focusAfterRemoval.current = next
        ? `save-product-${next.id}`
        : 'results-heading';
    }
    toggleSaved(id);
  }
  function toggleCompare(id: number) {
    setCompareIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }
  function removeCompared(id: number) {
    if (document.activeElement?.closest('.compare-tray')) {
      const index = comparedProducts.findIndex((product) => product.id === id);
      const next = comparedProducts[index + 1] ?? comparedProducts[index - 1];
      focusAfterRemoval.current = next
        ? `tray-remove-${next.id}`
        : 'results-heading';
    }
    if (compareIds.length === 1) {
      setCompareOpen(false);
      document
        .getElementById('results-heading')
        ?.focus({ preventScroll: true });
    }
    setCompareIds((current) => current.filter((value) => value !== id));
  }
  function clearComparison() {
    setCompareIds([]);
    setCompareOpen(false);
    document.getElementById('results-heading')?.focus({ preventScroll: true });
  }
  function browseAll() {
    setSavedView(false);
    clearFilters();
  }
  function scrollToCatalogue() {
    document.getElementById('catalogue')?.scrollIntoView({ block: 'start' });
  }
  const productActions = {
    savedIds,
    compareIds,
    onOpen: setQuickView,
    onSave: saveProduct,
    onCompare: toggleCompare,
  };

  return (
    <div id="top" className={compareIds.length ? 'has-comparison' : undefined}>
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
          <button
            className="saved-items-button"
            aria-label="Saved items"
            aria-pressed={savedView}
            onClick={() => {
              setSavedView(!savedView);
              scrollToCatalogue();
            }}
          >
            <Heart
              size={17}
              fill={savedView ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span>Saved</span>
            <span className="saved-count">{savedProducts.length}</span>
          </button>
        </div>
      </header>
      <main className="page-width">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-text">
            <h1 id="page-title">
              Good things.
              <br />
              <span>Easy to find.</span>
            </h1>
            <p className="intro-description">
              Everyday essentials. Unexpected favourites.
            </p>
            <div className="collection-note">
              <span className="status-dot" />
              {status === 'success'
                ? `${products.length} products. ${categories.length} categories. Your next find.`
                : 'A whole collection of possibilities.'}
            </div>
          </div>
          <CategorySpotlights
            products={products}
            onSelect={(category) => {
              setSavedView(false);
              setFilter('category', category);
              scrollToCatalogue();
            }}
          />
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
            <CatalogueToolbar
              title={title}
              resultText={resultText}
              filterCount={filterCount}
              sort={sort}
              onSort={setSort}
              view={view}
              onView={setView}
              onOpenFilters={() => setMobileFiltersOpen(true)}
            />
            {savedView && (
              <div className="saved-view-note">
                <span>
                  {storageAvailable
                    ? 'A few favourites, saved for later on this browser.'
                    : 'Saved for this visit. Your browser has disabled storage.'}
                </span>
                {savedProducts.length > 0 && (
                  <button className="text-button" onClick={browseAll}>
                    Browse all products
                  </button>
                )}
              </div>
            )}
            <ActiveFilters
              filters={filters}
              onChange={setFilter}
              onClear={clearFilters}
            />
            <ProductResults
              key={JSON.stringify({ filters, sort, status, savedView })}
              products={results}
              status={status}
              query={filters.query}
              priceError={priceError}
              onReset={clearFilters}
              onRetry={retry}
              actions={productActions}
              view={view}
              emptySaved={savedView && savedProducts.length === 0}
              onBrowseAll={browseAll}
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
      <CompareTray
        products={comparedProducts}
        onRemove={removeCompared}
        onClear={clearComparison}
        onCompare={() => setCompareOpen(true)}
      />
      {quickView && (
        <ProductQuickView
          product={quickView}
          storageAvailable={storageAvailable}
          onClose={() => setQuickView(null)}
          saved={savedIds.includes(quickView.id)}
          onSave={() => toggleSaved(quickView.id)}
          compared={compareIds.includes(quickView.id)}
          compareDisabled={
            !compareIds.includes(quickView.id) && compareIds.length >= 3
          }
          onCompare={() => toggleCompare(quickView.id)}
        />
      )}
      {compareOpen && comparedProducts.length > 0 && (
        <CompareDialog
          products={comparedProducts}
          onClose={() => setCompareOpen(false)}
          onRemove={removeCompared}
          onSave={toggleSaved}
          savedIds={savedIds}
        />
      )}
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
