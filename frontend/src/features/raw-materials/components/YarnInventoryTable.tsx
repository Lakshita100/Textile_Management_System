import { Eye, ImageOff, Pencil, SearchX, Trash2, Truck } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatKNumber } from '../inventoryLogic';
import { displayValue, mailtoHref, supplierByCompany, telHref } from '../supplierLogic';
import type { Supplier, YarnItem } from '../types';

interface YarnInventoryTableProps {
  items: YarnItem[];
  suppliers: Supplier[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onViewItem: (item: YarnItem) => void;
  onEditItem: (item: YarnItem) => void;
  onDeleteItem: (item: YarnItem) => void;
  onChangeSupplier: (item: YarnItem) => void;
}

const COLUMNS = [
  'Yarn ID',
  'Yarn Image',
  'Yarn Name',
  'Product Code',
  'Category',
  'Current Stock',
  'Material / Composition',
  'Colour / Shade',
  'Denier / Specification',
  'Unit Cost',
  'Supplier / Source',
  'Minimum Stock Level',
  'Storage Location',
  'Batch Number',
  'Inventory Stage',
  'Stock Status',
  'Actions',
] as const;

const CELL_CLASS = 'whitespace-nowrap px-4 py-3 text-sm text-[var(--color-text)]';

const ACTION_BUTTON_CLASS =
  'inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-heading)]';

export default function YarnInventoryTable({
  items,
  suppliers,
  hasActiveFilters,
  onClearFilters,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onChangeSupplier,
}: YarnInventoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1840px] border-collapse">
        <caption className="sr-only">
          Yarn stock overview — records with specifications, stock levels, status and row actions
        </caption>
        <thead>
          <tr className="table-header">
            {COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="whitespace-nowrap border-b border-[var(--color-border)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-heading)]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        {items.length > 0 ? (
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((item) => {
              const supplier = item.stockStatus === 'In Stock' ? undefined : supplierByCompany(suppliers, item.supplierSource);
              const phone = supplier ? telHref(supplier.phone) : null;
              const email = supplier ? mailtoHref(supplier.email) : null;

              return (
                <tr key={item.yarnId} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                  <td className={`${CELL_CLASS} font-mono text-xs font-medium text-[var(--color-heading)]`}>
                    {item.yarnId}
                  </td>
                  <td className={CELL_CLASS}>
                    <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <ImageOff size={16} aria-hidden className="absolute text-[var(--color-text-muted)]" />
                      <img
                        src={item.imageFile}
                        alt={`Sample thumbnail for ${item.yarnName}`}
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="relative h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </span>
                  </td>
                  <td className={`${CELL_CLASS} font-medium text-[var(--color-heading)]`}>{item.yarnName}</td>
                  <td className={`${CELL_CLASS} font-mono text-xs`}>{item.productCode}</td>
                  <td className={CELL_CLASS}>
                    <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-heading)]">
                      {item.category}
                    </span>
                  </td>
                  <td className={CELL_CLASS}>
                    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-2.5 py-1 text-sm font-bold text-[var(--color-heading)]">
                      {formatKNumber(item.currentStock)}{' '}
                      <span className="text-xs font-normal text-[var(--color-text-muted)]">{item.unit}</span>
                    </span>
                  </td>
                  <td className={CELL_CLASS}>{item.materialComposition}</td>
                  <td className={CELL_CLASS}>{item.colourShade}</td>
                  <td className={`${CELL_CLASS} font-medium text-[var(--color-heading)]`}>
                    {item.denierSpecification}
                  </td>
                  <td className={CELL_CLASS}>
                    <span className="font-medium text-[var(--color-heading)]">{item.unitCost.toFixed(2)}</span>{' '}
                    <span className="text-xs text-[var(--color-text-muted)]">/{item.unit}</span>
                  </td>
                  <td className={CELL_CLASS}>
                    <span className="block">{item.supplierSource}</span>
                    {supplier ? (
                      <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-text-muted)]">
                        {displayValue(supplier.contactPerson)}
                        {' · '}
                        {phone ? (
                          <a href={phone} className="hover:text-[var(--color-link)]">
                            {supplier.phone}
                          </a>
                        ) : (
                          'phone not provided'
                        )}
                        {' · '}
                        {email ? (
                          <a href={email} className="hover:text-[var(--color-link)]">
                            {supplier.email}
                          </a>
                        ) : (
                          'email not provided'
                        )}
                      </span>
                    ) : null}
                  </td>
                  <td className={CELL_CLASS}>
                    <span className="font-semibold text-[var(--color-heading)]">{formatKNumber(item.minimumStockLevel)}</span>{' '}
                    <span className="text-xs text-[var(--color-text-muted)]">{item.unit}</span>
                  </td>
                  <td className={CELL_CLASS}>{item.storageLocation}</td>
                  <td className={`${CELL_CLASS} font-mono text-xs`}>{item.batchNumber}</td>
                  <td className={CELL_CLASS}>
                    <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                      {item.inventoryStage}
                    </span>
                  </td>
                  <td className={CELL_CLASS}>
                    <StatusBadge status={item.stockStatus} />
                  </td>
                  <td className={CELL_CLASS}>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className={ACTION_BUTTON_CLASS}
                        onClick={() => onViewItem(item)}
                        aria-label={`View details for ${item.yarnId} ${item.yarnName}`}
                        title="View details"
                      >
                        <Eye size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={ACTION_BUTTON_CLASS}
                        onClick={() => onEditItem(item)}
                        aria-label={`Edit ${item.yarnId} ${item.yarnName}`}
                        title="Edit yarn"
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={ACTION_BUTTON_CLASS}
                        onClick={() => onChangeSupplier(item)}
                        aria-label={`Change supplier for ${item.yarnId} ${item.yarnName}`}
                        title="Change supplier (audited)"
                      >
                        <Truck size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={`${ACTION_BUTTON_CLASS} hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]`}
                        onClick={() => onDeleteItem(item)}
                        aria-label={`Delete ${item.yarnId} ${item.yarnName}`}
                        title="Delete yarn"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        ) : (
          <tbody>
            <tr>
              <td colSpan={COLUMNS.length} className="px-6 py-16 text-center">
                <span
                  aria-hidden
                  className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-surface)]"
                >
                  <SearchX size={22} className="text-[var(--color-text-muted)]" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[var(--color-heading)]">
                  No yarn matches your filters
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Try a different search term or adjust the category, status, supplier, stage or colour filters.
                </p>
                {hasActiveFilters ? (
                  <button type="button" className="btn-secondary mt-5" onClick={onClearFilters}>
                    Clear filters
                  </button>
                ) : null}
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
}
