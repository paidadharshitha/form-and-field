import { ArrowRight, ChevronDown, Compass } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';
import {
  EMPTY_FILTERS,
  type Category,
  type Filters,
  type SortOption,
} from '../lib/catalogue';

interface GuidedFinderProps {
  categories: Category[];
  currentFilters?: Filters;
  onApply: (filters: Filters, sort: SortOption) => void;
}

export function GuidedFinder({
  categories,
  currentFilters,
  onApply,
}: GuidedFinderProps) {
  const id = useId();
  const budgetInput = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [category, setCategory] = useState(currentFilters?.category ?? '');
  const [budget, setBudget] = useState(currentFilters?.maxPrice ?? '');
  const [priority, setPriority] = useState<'rating-desc' | 'price-asc'>(
    'rating-desc',
  );
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (!expanded) {
      setCategory(currentFilters?.category ?? '');
      setBudget(currentFilters?.maxPrice ?? '');
      setError(null);
    }
    setExpanded((value) => !value);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = budget.trim();
    if (
      budgetInput.current?.validity.badInput ||
      (value && (!Number.isFinite(Number(value)) || Number(value) < 0))
    ) {
      setError('Enter a budget of 0 or more, or leave it blank.');
      budgetInput.current?.focus();
      return;
    }
    setError(null);
    setExpanded(false);
    onApply({ ...EMPTY_FILTERS, category, maxPrice: value }, priority);
  }

  return (
    <section
      className={`guided-finder ${expanded ? 'is-expanded' : ''}`}
      aria-label="Guided product finder"
    >
      <div className="guided-finder-summary">
        <div className="guided-finder-intro">
          <Compass size={19} aria-hidden="true" />
          <p>
            <strong>A little direction?</strong>
            <span>Start with what matters to you.</span>
          </p>
        </div>
        <button
          className="guided-finder-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? `${id}-form` : undefined}
          onClick={toggle}
        >
          {expanded ? 'Close finder' : 'Help me choose'}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <form
          id={`${id}-form`}
          className="guided-finder-form"
          onSubmit={submit}
          noValidate
        >
          <div className="finder-fields">
            <label htmlFor={`${id}-category`}>
              <span>What are you looking for?</span>
              <select
                id={`${id}-category`}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">A little of everything</option>
                {currentFilters?.category &&
                  !categories.some(
                    (option) => option.value === currentFilters.category,
                  ) && (
                    <option value={currentFilters.category}>
                      {currentFilters.category}
                    </option>
                  )}
                {categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-budget`}>
              <span>
                Maximum budget <small>USD</small>
              </span>
              <input
                ref={budgetInput}
                id={`${id}-budget`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="No limit"
                value={budget}
                onChange={(event) => {
                  setBudget(event.target.value);
                  setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
              />
            </label>
            <label htmlFor={`${id}-priority`}>
              <span>What matters most?</span>
              <select
                id={`${id}-priority`}
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value === 'price-asc'
                      ? 'price-asc'
                      : 'rating-desc',
                  )
                }
              >
                <option value="rating-desc">Highest rated</option>
                <option value="price-asc">Lowest price</option>
              </select>
            </label>
            <button className="primary-button finder-submit" type="submit">
              Find my matches <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          {error && (
            <p className="finder-error" id={`${id}-error`} role="alert">
              {error}
            </p>
          )}
          <p className="finder-note">
            These choices replace your current search and filters.
          </p>
        </form>
      )}
    </section>
  );
}
