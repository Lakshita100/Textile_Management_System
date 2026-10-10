import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, Pencil, Plus, Power, Search, Trash2, XCircle } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { displayValue, mailtoHref, telHref } from '../supplierLogic';
import type { Supplier } from '../types';

interface SuppliersSectionProps {
  suppliers: Supplier[];
  onAdd: () => void;
  onEdit: (supplier: Supplier) => void;
  onView: (supplier: Supplier) => void;
  onToggleActive: (supplier: Supplier) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (supplier: Supplier) => Promise<{ ok: boolean; error?: string }>;
}

const HEAD_CELL =
  'whitespace-nowrap border-b border-[var(--color-border)] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-heading)]';
const BODY_CELL = 'px-3 py-2.5 text-sm text-[var(--color-text)]';

const ACTIVE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function SuppliersSection({
  suppliers,
  onAdd,
  onEdit,
  onView,
  onToggleActive,
  onDelete,
}: SuppliersSectionProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => {
    const all = new Set<string>();
    for (const supplier of suppliers) {
      for (const entry of supplier.yarnTypes) all.add(entry);
    }
    return [...all].sort((a, b) => a.localeCompare(b));
  }, [suppliers]);

  const filtered = suppliers.filter((supplier) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      supplier.companyName.toLowerCase().includes(q) ||
      supplier.contactPerson.toLowerCase().includes(q) ||
      supplier.productCodes.some((code) => code.toLowerCase().includes(q));
    const matchesStatus = status === '' || (status === 'active' ? supplier.active : !supplier.active);
    const matchesCategory = category === '' || supplier.yarnTypes.includes(category);
    return matchesQuery && matchesStatus && matchesCategory;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const result = await onDelete(deleteTarget);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not delete the supplier.');
      setDeleteTarget(null);
      return;
    }
    setError('');
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="suppliers-heading" className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div>
            <h2 id="suppliers-heading" className="text-lg font-semibold text-[var(--color-heading)]">
              Supplier Management
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Registered yarn suppliers, contacts and catalog details.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={onAdd}>
            <Plus size={16} aria-hidden />
            Add Supplier
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-b border-[var(--color-border)] px-5 py-3 sm:px-6">
          <div className="relative min-w-56 flex-1">
            <Search
              size={15}
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, contact or product code…"
              aria-label="Search suppliers"
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] px-3 py-2 ps-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter by status">
            {ACTIVE_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                aria-pressed={status === option.value}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === option.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-hover)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-heading)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by yarn type"
            className="rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] px-3 py-2 text-sm text-[var(--color-text)]"
          >
            <option value="">All yarn types</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p
            role="alert"
            className="border-b border-[var(--color-border)] bg-[var(--color-danger-bg)] px-5 py-2.5 text-sm font-medium text-[var(--color-heading)] sm:px-6"
          >
            {error}
          </p>
        ) : null}

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <caption className="sr-only">
                Suppliers with contact details, coverage, supplied yarn counts and actions
              </caption>
              <thead className="table-header">
                <tr>
                  <th scope="col" className={HEAD_CELL}>
                    Supplier
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Contact
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Address
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Coverage
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Supplied Yarns
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Terms
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Status
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((supplier) => {
                  const phone = telHref(supplier.phone);
                  const email = mailtoHref(supplier.email);
                  return (
                    <tr key={supplier.supplierId} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                      <td className={BODY_CELL}>
                        <span className="block font-medium text-[var(--color-heading)]">{supplier.companyName}</span>
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">{supplier.supplierId}</span>
                        {supplier.isDemo ? (
                          <span className="ms-2 rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                            demo
                          </span>
                        ) : null}
                      </td>
                      <td className={BODY_CELL}>
                        <span className="block">{displayValue(supplier.contactPerson)}</span>
                        <span className="flex flex-wrap gap-x-3 text-xs text-[var(--color-text-muted)]">
                          {phone ? (
                            <a href={phone} className="hover:text-[var(--color-link)]">
                              {supplier.phone}
                            </a>
                          ) : (
                            <span>Phone: not provided</span>
                          )}
                          {email ? (
                            <a href={email} className="hover:text-[var(--color-link)]">
                              {supplier.email}
                            </a>
                          ) : (
                            <span>Email: not provided</span>
                          )}
                        </span>
                      </td>
                      <td className={`${BODY_CELL} max-w-48`}>
                        <span className="block truncate" title={supplier.address || undefined}>
                          {supplier.address.trim() === '' ? (
                            <span className="text-[var(--color-text-muted)]">Not provided</span>
                          ) : (
                            supplier.address
                          )}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <span className="block text-xs">{supplier.yarnTypes.join(', ') || '—'}</span>
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">
                          {supplier.productCodes.join(', ') || 'no product codes'}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-heading)]">
                          {supplier.suppliedYarnCount ?? 0}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <span className="block text-xs">
                          {supplier.pricePerKg !== null ? `${supplier.pricePerKg} /kg` : 'Price: unknown'}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {supplier.minOrderQty !== null ? `MOQ ${supplier.minOrderQty} kg` : 'MOQ: unknown'} ·{' '}
                          {supplier.leadTimeDays !== null ? `${supplier.leadTimeDays}d lead` : 'Lead: unknown'}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            supplier.active
                              ? 'bg-[var(--color-success-bg)] text-[var(--color-heading)]'
                              : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {supplier.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-1.5 text-xs"
                            onClick={() => onView(supplier)}
                          >
                            <Eye size={13} aria-hidden />
                            View
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-1.5 text-xs"
                            onClick={() => onEdit(supplier)}
                          >
                            <Pencil size={13} aria-hidden />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-1.5 text-xs"
                            onClick={() => {
                              setError('');
                              void onToggleActive(supplier).then((result) => {
                                if (!result.ok) {
                                  setError(result.error ?? 'Could not update the supplier.');
                                }
                              });
                            }}
                            title={supplier.active ? 'Deactivate — kept for history, cannot be assigned' : 'Reactivate'}
                          >
                            {supplier.active ? <XCircle size={13} aria-hidden /> : <Power size={13} aria-hidden />}
                            {supplier.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-1.5 text-xs text-[var(--color-danger)]"
                            onClick={() => {
                              setError('');
                              setDeleteTarget(supplier);
                            }}
                          >
                            <Trash2 size={13} aria-hidden />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <span
              aria-hidden
              className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-surface-hover)]"
            >
              <CheckCircle2 size={22} className="text-[var(--color-text-muted)]" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-[var(--color-heading)]">No suppliers match</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {suppliers.length === 0
                ? 'Add your first supplier — suppliers assigned to yarn records can be changed from the Inventory tab.'
                : 'Adjust the search or filters above.'}
            </p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete supplier"
        message={`Delete ${deleteTarget?.companyName ?? ''} permanently?`}
        detail="Referenced suppliers cannot be deleted — the backend will suggest deactivating instead so history is preserved."
        confirmLabel={busy ? 'Deleting…' : 'Delete supplier'}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
