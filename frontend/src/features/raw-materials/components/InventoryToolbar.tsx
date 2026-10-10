import { ChevronDown, Search, X } from 'lucide-react';
import type { InventoryFacets } from '../inventoryLogic';
import { STOCK_STATUSES, YARN_CATEGORIES } from '../types';

interface InventoryToolbarProps {
  query: string;
  category: string;
  status: string;
  supplier: string;
  stage: string;
  colour: string;
  facets: InventoryFacets;
  hasActiveFilters: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onColourChange: (value: string) => void;
  onClearFilters: () => void;
}

const SELECT_CLASS =
  'h-11 w-full appearance-none rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] py-2 pl-3 pr-9 text-sm text-[var(--color-text)]';

function SelectFilter({
  id,
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  allLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative md:w-48">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT_CLASS}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
    </div>
  );
}

export default function InventoryToolbar({
  query,
  category,
  status,
  supplier,
  stage,
  colour,
  facets,
  hasActiveFilters,
  onQueryChange,
  onCategoryChange,
  onStatusChange,
  onSupplierChange,
  onStageChange,
  onColourChange,
  onClearFilters,
}: InventoryToolbarProps) {
  /* Facet values first, then any current selection that is not in the facet
     list (e.g. the value changed in another tab). */
  const withCurrent = (current: string, values: readonly string[]): string[] =>
    current !== '' && !values.includes(current) ? [current, ...values] : [...values];

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="relative min-w-56 flex-1">
        <label htmlFor="yarn-search" className="sr-only">
          Search yarn stock
        </label>
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          id="yarn-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by yarn ID, yarn name or product code"
          className="h-11 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <SelectFilter
          id="yarn-category-filter"
          label="Filter by category"
          value={category}
          options={withCurrent(category, YARN_CATEGORIES as readonly string[])}
          allLabel="All categories"
          onChange={onCategoryChange}
        />
        <SelectFilter
          id="yarn-status-filter"
          label="Filter by stock status"
          value={status}
          options={withCurrent(status, STOCK_STATUSES as readonly string[])}
          allLabel="All statuses"
          onChange={onStatusChange}
        />
        <SelectFilter
          id="yarn-supplier-filter"
          label="Filter by supplier"
          value={supplier}
          options={withCurrent(supplier, facets.suppliers)}
          allLabel="All suppliers"
          onChange={onSupplierChange}
        />
        <SelectFilter
          id="yarn-stage-filter"
          label="Filter by inventory stage"
          value={stage}
          options={withCurrent(stage, facets.stages)}
          allLabel="All stages"
          onChange={onStageChange}
        />
        <SelectFilter
          id="yarn-colour-filter"
          label="Filter by colour"
          value={colour}
          options={withCurrent(colour, facets.colours)}
          allLabel="All colours"
          onChange={onColourChange}
        />

        {hasActiveFilters ? (
          <button type="button" className="btn-secondary h-11" onClick={onClearFilters}>
            <X size={16} aria-hidden />
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
