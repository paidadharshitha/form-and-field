import { ArrowUpRight, Heart } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActiveFilters } from './components/ActiveFilters';
import { CatalogueToolbar } from './components/CatalogueToolbar';
import { CatalogueIntro } from './components/CatalogueIntro';
import { CompareDialog } from './components/CompareDialog';
import { CompareTray } from './components/CompareTray';
import { FilterPanel } from './components/FilterPanel';
import { MobileFilters } from './components/MobileFilters';
import { ProductQuickView } from './components/ProductQuickView';
import { ProductResults } from './components/ProductResults';
import { ProductStrip } from './components/ProductStrip';
import { UndoNotice } from './components/UndoNotice';
import { getFilterSuggestions } from './lib/guidance';
import { buildProductLink } from './lib/productLink';
import { useCatalogueState } from './hooks/useCatalogueState';
import { useProducts } from './hooks/useProducts';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';
import { useSavedProducts } from './hooks/useSavedProducts';
import {
  filterAndSortProducts,
  formatCategory,
  getBrands,
  getCategories,
  getSimilarProducts,
  searchProducts,
  validatePriceRange,
  type Product,
  type Filters,
  type SortOption,
} from './lib/catalogue';

type UndoAction =
  | { kind: 'saved'; id: number; title: string }
  | { kind: 'history'; ids: number[] };

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
  const {
    filters,
    sort,
    setFilter,
    setSort,
    clearFilters,
    linkedProduct,
    selectProduct,
    applyFilters,
  } = useCatalogueState();
  const { savedIds, toggleSaved, restoreSaved, storageAvailable } =
    useSavedProducts();
  const {
    recentIds,
    recordView,
    clearHistory,
    restoreHistory,
    storageAvailable: historyAvailable,
  } = useRecentlyViewed();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [savedView, setSavedView] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const quickView =
    products.find((product) => String(product.id) === linkedProduct) ?? null;
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const focusAfterRemoval = useRef<string | null>(null);
  const lastViewed = useRef<number | null>(null);

  useEffect(() => {
    if (quickView && lastViewed.current !== quickView.id) {
      lastViewed.current = quickView.id;
      recordView(quickView.id);
    } else if (!quickView) {
      lastViewed.current = null;
    }
  }, [quickView, recordView]);

  useEffect(() => {
    if (focusAfterRemoval.current) {
      const target =
        focusAfterRemoval.current === 'dialog-close'
          ? document.querySelector<HTMLButtonElement>(
              '.catalogue-dialog[open] .dialog-close',
            )
          : document.getElementById(focusAfterRemoval.current);
      target?.focus({ preventScroll: true });
      focusAfterRemoval.current = null;
    }
  }, [savedIds, compareIds, recentIds, undoAction, filters]);

  const savedProducts = useMemo(
    () => products.filter((product) => savedIds.includes(product.id)),
    [products, savedIds],
  );
  const sourceProducts = savedView ? savedProducts : products;
  const comparedProducts = products.filter((product) =>
    compareIds.includes(product.id),
  );
  const categories = useMemo(() => getCategories(products), [products]);
  const brands = useMemo(() => getBrands(products), [products]);
  const recentlyViewed = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    return recentIds.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    });
  }, [products, recentIds]);
  const similarProducts = useMemo(
    () => (quickView ? getSimilarProducts(products, quickView) : []),
    [products, quickView],
  );
  const isFuzzy = useMemo(
    () => searchProducts(sourceProducts, filters.query).isFuzzy,
    [sourceProducts, filters.query],
  );
  const priceError = validatePriceRange(filters);
  const results = useMemo(
    () => filterAndSortProducts(sourceProducts, filters, sort),
    [sourceProducts, filters, sort],
  );
  const count = priceError ? 0 : results.length;
  const recoverySuggestions = useMemo(
    () =>
      status === 'success' && !priceError && results.length === 0
        ? getFilterSuggestions(sourceProducts, filters)
        : [],
    [sourceProducts, filters, results.length, priceError, status],
  );
  const filterCount =
    Number(Boolean(filters.category)) +
    Number(Boolean(filters.brand)) +
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
    brands,
    filters,
    onChange: setFilter,
    priceError,
  };

  function openProduct(product: Product) {
    selectProduct(product.id);
  }

  function applyFinder(nextFilters: Filters, nextSort: SortOption) {
    setSavedView(false);
    applyFilters(nextFilters, nextSort);
    focusAfterRemoval.current = 'results-heading';
    scrollToCatalogue();
  }

  function undoLastAction() {
    if (!undoAction) return;
    if (undoAction.kind === 'saved') restoreSaved(undoAction.id);
    else restoreHistory(undoAction.ids);
    focusAfterRemoval.current =
      quickView || compareOpen ? 'dialog-close' : 'results-heading';
    setUndoAction(null);
  }

  function dismissUndo() {
    focusAfterRemoval.current =
      quickView || compareOpen ? 'dialog-close' : 'results-heading';
    setUndoAction(null);
  }

  function clearViewedHistory() {
    setUndoAction({ kind: 'history', ids: [...recentIds] });
    clearHistory();
    focusAfterRemoval.current = 'results-heading';
  }

  function saveProduct(id: number) {
    const wasSaved = savedIds.includes(id);
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
    if (wasSaved) {
      setUndoAction({
        kind: 'saved',
        id,
        title:
          products.find((product) => product.id === id)?.title ?? 'Product',
      });
    } else {
      setUndoAction((current) =>
        current?.kind === 'saved' && current.id === id ? null : current,
      );
    }
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
    onOpen: openProduct,
    onSave: saveProduct,
    onCompare: toggleCompare,
  };
  const undoFeedback = undoAction ? (
    <UndoNotice
      message={
        undoAction.kind === 'saved'
          ? `${undoAction.title} removed from Saved.`
          : 'Recently viewed history cleared.'
      }
      onUndo={undoLastAction}
      onDismiss={dismissUndo}
    />
  ) : null;

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
              About the catalogue <ArrowUpRight size={14} />
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
        <CatalogueIntro
          products={products}
          categories={categories}
          filters={filters}
          suggestions={priceError ? [] : results}
          isFuzzy={isFuzzy}
          ready={status === 'success'}
          onQueryChange={(value) => setFilter('query', value)}
          onApplyFinder={applyFinder}
          onSelectCategory={(category) => {
            setSavedView(false);
            setFilter('category', category);
            scrollToCatalogue();
          }}
        />
        {linkedProduct && !quickView && status === 'success' && (
          <div className="linked-product-note" role="status">
            <p>
              This product link is unavailable. You can still explore the
              catalogue.
            </p>
            <button className="text-button" onClick={() => selectProduct(null)}>
              Dismiss product link
            </button>
          </div>
        )}
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
            {isFuzzy && count > 0 && (
              <p className="fuzzy-search-note" role="status">
                No exact name matches. Showing close matches for “
                {filters.query.trim()}”.
              </p>
            )}
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
              suggestions={recoverySuggestions}
              onApplySuggestion={(nextFilters) => {
                applyFilters(nextFilters);
                focusAfterRemoval.current = 'results-heading';
              }}
            />
          </section>
        </div>
        {recentlyViewed.length > 0 && (
          <ProductStrip
            title="Recently viewed"
            description={
              historyAvailable
                ? 'Pick up where you left off. Kept on this browser.'
                : 'Your recent finds, kept for this visit.'
            }
            products={recentlyViewed}
            onOpen={openProduct}
            action={
              <button className="text-button" onClick={clearViewedHistory}>
                Clear recently viewed
              </button>
            }
          />
        )}
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
      {undoFeedback && !quickView && !compareOpen && !mobileFiltersOpen && (
        <div className="global-feedback">{undoFeedback}</div>
      )}
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
          onClose={() => selectProduct(null)}
          saved={savedIds.includes(quickView.id)}
          onSave={() => saveProduct(quickView.id)}
          compared={compareIds.includes(quickView.id)}
          compareDisabled={
            !compareIds.includes(quickView.id) && compareIds.length >= 3
          }
          onCompare={() => toggleCompare(quickView.id)}
          similarProducts={similarProducts}
          onOpenProduct={openProduct}
          shareUrl={buildProductLink(window.location.href, quickView.id)}
          feedback={undoFeedback}
        />
      )}
      {compareOpen && comparedProducts.length > 0 && (
        <CompareDialog
          products={comparedProducts}
          onClose={() => setCompareOpen(false)}
          onRemove={removeCompared}
          onSave={saveProduct}
          savedIds={savedIds}
          feedback={undoFeedback}
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
