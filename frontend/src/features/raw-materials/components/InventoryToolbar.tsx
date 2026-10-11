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
  'h-10 w-full appearance-none rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] py-2 pl-3 pr-7 text-xs sm:text-sm text-[var(--color-text)] truncate cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]';

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
    <div className="relative w-full xl:w-auto xl:flex-1 xl:min-w-[115px] xl:max-w-[170px]">
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
        size={14}
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
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
    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:flex-nowrap w-full">
      <div className="relative flex-1 min-w-[180px] xl:max-w-[260px] 2xl:max-w-[300px]">
        <label htmlFor="yarn-search" className="sr-only">
          Search yarn stock
        </label>
        <Search
          size={15}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          id="yarn-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by yarn ID, name or code"
          className="h-10 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] py-2 pl-9 pr-3 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:flex-1 xl:items-center xl:flex-nowrap gap-2.5">
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
          <button
            type="button"
            className="btn-secondary h-10 px-3 py-1.5 whitespace-nowrap shrink-0 text-xs sm:text-sm flex items-center gap-1.5 xl:w-auto col-span-2 sm:col-span-1"
            onClick={onClearFilters}
          >
            <X size={14} aria-hidden />
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
