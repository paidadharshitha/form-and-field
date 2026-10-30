import { X } from 'lucide-react';
import { formatCategory, type Filters } from '../lib/catalogue';

export function ActiveFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onClear: () => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];
  if (filters.query)
    chips.push({
      label: `“${filters.query}”`,
      onRemove: () => onChange('query', ''),
    });
  if (filters.category)
    chips.push({
      label: formatCategory(filters.category),
      onRemove: () => onChange('category', ''),
    });
  if (filters.minPrice || filters.maxPrice)
    chips.push({
      label: `$${filters.minPrice || '0'} – ${filters.maxPrice ? `$${filters.maxPrice}` : 'Any'}`,
      onRemove: () => {
        onChange('minPrice', '');
        onChange('maxPrice', '');
      },
    });
  if (filters.minRating)
    chips.push({
      label: `${filters.minRating}+ rating`,
      onRemove: () => onChange('minRating', ''),
    });
  if (filters.inStockOnly)
    chips.push({
      label: 'In stock',
      onRemove: () => onChange('inStockOnly', false),
    });
  if (!chips.length) return null;

  return (
    <div className="active-filters" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={chip.onRemove}
          aria-label={`Remove ${chip.label} filter`}
        >
          {chip.label}
          <X size={13} aria-hidden="true" />
        </button>
      ))}
      <button className="clear-filters" onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}
