import type { Category, Filters, Product, SortOption } from '../lib/catalogue';
import { CategorySpotlights } from './CategorySpotlights';
import { GuidedFinder } from './GuidedFinder';
import { SearchBar } from './SearchBar';

interface CatalogueIntroProps {
  products: Product[];
  categories: Category[];
  filters: Filters;
  suggestions: Product[];
  isFuzzy: boolean;
  ready: boolean;
  onQueryChange: (query: string) => void;
  onSelectCategory: (category: string) => void;
  onApplyFinder: (filters: Filters, sort: SortOption) => void;
}

/** One set of discovery controls, arranged as an editorial spread or a phone stack. */
export function CatalogueIntro({
  products,
  categories,
  filters,
  suggestions,
  isFuzzy,
  ready,
  onQueryChange,
  onSelectCategory,
  onApplyFinder,
}: CatalogueIntroProps) {
  return (
    <section className="boutique-intro" aria-labelledby="page-title">
      <div className="intro-story">
        <h1 id="page-title">
          Good things.<em>Easy to find.</em>
        </h1>
        <p>Everyday essentials. Unexpected favourites.</p>
      </div>
      <div className="intro-search">
        <SearchBar
          query={filters.query}
          suggestions={suggestions}
          isFuzzy={isFuzzy}
          onChange={onQueryChange}
        />
        {ready && (
          <GuidedFinder
            categories={categories}
            currentFilters={filters}
            onApply={onApplyFinder}
          />
        )}
      </div>
      <CategorySpotlights products={products} onSelect={onSelectCategory} />
    </section>
  );
}
