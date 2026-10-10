import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { ActionResult } from '../inventoryLogic';
import { formatQuantity } from '../movementLogic';
import type { PurchaseRequest, PurchaseRequestStatus, Supplier, YarnItem } from '../types';

/** Payload accepted by POST /purchase-requests. */
export interface CreatePurchasePayload {
  yarnId: string;
  supplierId: string;
  quantity: number;
  bufferQuantity?: number;
  expectedDeliveryDate?: string | null;
  notes?: string;
}

interface PurchaseRequestsSectionProps {
  requests: PurchaseRequest[];
  items?: YarnItem[];
  suppliers?: Supplier[];
  onCreate: (payload: CreatePurchasePayload) => Promise<ActionResult>;
  onUpdateStatus: (requestId: string, status: PurchaseRequestStatus) => Promise<ActionResult>;
}

const HEAD_CELL =
  'whitespace-nowrap border-b border-[var(--color-border)] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-heading)]';
const BODY_CELL = 'px-3 py-2.5 text-sm text-[var(--color-text)]';
const LABEL = 'block text-sm font-medium text-[var(--color-heading)]';
const INPUT =
  'mt-1.5 h-11 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] px-3 text-sm text-[var(--color-text)]';

const STATUS_BADGE: Record<PurchaseRequestStatus, string> = {
  draft: 'bg-[var(--color-surface-hover)] text-[var(--color-heading)]',
  submitted: 'bg-[var(--color-warning-bg)] text-[var(--color-heading)]',
  cancelled: 'bg-[var(--color-danger-bg)] text-[var(--color-heading)]',
};

export default function PurchaseRequestsSection({
  requests,
  items = [],
  suppliers = [],
  onCreate,
  onUpdateStatus,
}: PurchaseRequestsSectionProps) {
  const [creating, setCreating] = useState(false);
  const [yarnId, setYarnId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const yarnName = (request: PurchaseRequest): string =>
    request.yarnName || items.find((item) => item.yarnId === request.yarnId)?.yarnName || request.yarnId;

  const handleCreate = async () => {
    const parsed = Number(quantity.trim());
    if (yarnId === '') return setError('Select a yarn record.');
    if (supplierId === '') return setError('Select a supplier.');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Quantity must be greater than zero.');

    setError('');
    const result = await onCreate({
      yarnId,
      supplierId,
      quantity: parsed,
      notes: notes.trim(),
    });
    if (result.ok) {
      setCreating(false);
      setYarnId('');
      setSupplierId('');
      setQuantity('');
      setNotes('');
    } else {
      setError(result.error ?? 'Could not create the purchase request.');
    }
  };

  const handleStatus = async (requestId: string, status: PurchaseRequestStatus) => {
    setBusyId(requestId);
    setError('');
    const result = await onUpdateStatus(requestId, status);
    if (!result.ok) setError(result.error ?? 'Could not update the request.');
    setBusyId(null);
  };

  return (
    <section aria-labelledby="purchases-heading" className="space-y-6">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div>
            <h2 id="purchases-heading" className="text-lg font-semibold text-[var(--color-heading)]">
              Purchase Requests
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Request drafts for short stock. Nothing here is ever sent to a supplier automatically.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setCreating((current) => !current)}>
            <Plus size={16} aria-hidden />
            New request
          </button>
        </div>

        {error ? (
          <p role="alert" className="border-b border-[var(--color-danger)] bg-[var(--color-danger-bg)] px-5 py-2.5 text-sm font-medium text-[var(--color-heading)] sm:px-6">
            {error}
          </p>
        ) : null}

        {creating ? (
          <div className="grid grid-cols-1 gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
            <div>
              <label className={LABEL} htmlFor="pr-yarn">
                Yarn
              </label>
              <select id="pr-yarn" className={INPUT} value={yarnId} onChange={(event) => setYarnId(event.target.value)}>
                <option value="">Select a yarn…</option>
                {items.map((item) => (
                  <option key={item.yarnId} value={item.yarnId}>
                    {item.yarnId} — {item.yarnName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="pr-supplier">
                Supplier
              </label>
              <select
                id="pr-supplier"
                className={INPUT}
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                <option value="">Select a supplier…</option>
                {suppliers
                  .filter((supplier) => supplier.active)
                  .map((supplier) => (
                    <option key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.companyName}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="pr-quantity">
                Quantity
              </label>
              <input
                id="pr-quantity"
                type="number"
                min="0"
                step="any"
                className={INPUT}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="pr-notes">
                Notes
              </label>
              <input
                id="pr-notes"
                type="text"
                maxLength={2000}
                className={INPUT}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
              <button type="button" className="btn-primary" onClick={() => void handleCreate()}>
                Create draft
              </button>
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <caption className="sr-only">Purchase request drafts</caption>
              <thead className="table-header">
                <tr>
                  <th scope="col" className={HEAD_CELL}>Yarn</th>
                  <th scope="col" className={HEAD_CELL}>Supplier</th>
                  <th scope="col" className={HEAD_CELL}>Quantity</th>
                  <th scope="col" className={HEAD_CELL}>Est. Cost</th>
                  <th scope="col" className={HEAD_CELL}>Status</th>
                  <th scope="col" className={HEAD_CELL}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {requests.map((request) => (
                  <tr key={request.requestId} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                    <td className={BODY_CELL}>
                      <span className="block font-medium text-[var(--color-heading)]">{yarnName(request)}</span>
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">{request.yarnId}</span>
                    </td>
                    <td className={BODY_CELL}>{request.supplierName}</td>
                    <td className={BODY_CELL}>
                      {formatQuantity(request.quantity)} {request.unit}
                    </td>
                    <td className={BODY_CELL}>
                      {request.estimatedTotalCost !== null && request.estimatedTotalCost !== undefined
                        ? formatQuantity(request.estimatedTotalCost)
                        : '—'}
                    </td>
                    <td className={BODY_CELL}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[request.status]}`}
                      >
                        {request.status === 'draft' ? 'Draft' : request.status === 'submitted' ? 'Submitted' : 'Cancelled'}
                      </span>
                    </td>
                    <td className={BODY_CELL}>
                      <div className="flex flex-wrap gap-2">
                        {request.status === 'draft' ? (
                          <>
                            <button
                              type="button"
                              className="btn-secondary px-2.5 py-1.5 text-xs"
                              disabled={busyId === request.requestId}
                              onClick={() => void handleStatus(request.requestId, 'submitted')}
                            >
                              Submit
                            </button>
                            <button
                              type="button"
                              className="btn-secondary px-2.5 py-1.5 text-xs"
                              disabled={busyId === request.requestId}
                              onClick={() => void handleStatus(request.requestId, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        ) : null}
                        {request.status === 'submitted' ? (
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-1.5 text-xs"
                            disabled={busyId === request.requestId}
                            onClick={() => void handleStatus(request.requestId, 'cancelled')}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
            No purchase requests yet. Create a draft to plan a replenishment.
          </p>
        )}
      </div>
    </section>
  );
}
