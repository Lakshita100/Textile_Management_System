import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { STOCK_OUT_REASONS, formatQuantity, todayIsoDate, type RecordMovementInput } from '../movementLogic';
import type { ActionResult } from '../inventoryLogic';
import type { StockMovementType, Supplier, YarnItem } from '../types';

interface StockMovementModalProps {
  open: boolean;
  suppliers: Supplier[];
  items: YarnItem[];
  /** Pre-selected yarn when opened from a row action. */
  initialYarnId?: string;
  initialItem?: YarnItem;
  onClose: () => void;
  onSubmit: (input: RecordMovementInput) => Promise<ActionResult>;
}

const LABEL = 'block text-sm font-medium text-[var(--color-heading)]';
const INPUT =
  'mt-1.5 h-11 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] px-3 text-sm text-[var(--color-text)]';

export default function StockMovementModal({
  open,
  suppliers,
  items,
  initialYarnId,
  initialItem,
  onClose,
  onSubmit,
}: StockMovementModalProps) {
  const [yarnId, setYarnId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType>('Stock In');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [reference, setReference] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [reason, setReason] = useState<string>(STOCK_OUT_REASONS[0]);
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const item = initialItem ?? (initialYarnId ? items.find((entry) => entry.yarnId === initialYarnId) : undefined);
    setYarnId(item?.yarnId ?? initialYarnId ?? '');
    setMovementType('Stock In');
    setQuantity('');
    setDate(todayIsoDate());
    setReference('');
    setSupplierName(item?.supplierSource ?? '');
    setReason(STOCK_OUT_REASONS[0]);
    setOtherReason('');
    setNotes('');
    setError('');
    setSaving(false);
  }, [open, initialItem, initialYarnId, items]);

  const selected = useMemo(() => items.find((item) => item.yarnId === yarnId), [items, yarnId]);

  const handleSubmit = async () => {
    const parsed = Number(quantity.trim());
    if (yarnId === '') {
      setError('Select a yarn record.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    const isStockIn = movementType === 'Stock In';
    const finalReference = reference.trim();
    if (finalReference === '') {
      setError('A reference is required.');
      return;
    }
    const finalReason = reason === 'Other' ? otherReason.trim() : reason;
    if (!isStockIn && finalReason === '') {
      setError('A reason is required for a Consumption.');
      return;
    }

    setSaving(true);
    setError('');
    const result = await onSubmit({
      yarnId,
      movementType,
      quantity: parsed,
      date,
      reference: finalReference,
      ...(isStockIn
        ? { supplierName: supplierName.trim(), notes: notes.trim() }
        : { reason: finalReason }),
    });
    setSaving(false);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error ?? 'Could not record the movement.');
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      title="Record Stock Movement"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? 'Saving…' : 'Record movement'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p role="alert" className="rounded-[var(--radius-input)] border border-[var(--color-danger)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm font-medium text-[var(--color-heading)]">
            {error}
          </p>
        ) : null}

        <div>
          <label className={LABEL} htmlFor="movement-yarn">
            Yarn record
          </label>
          <select id="movement-yarn" className={INPUT} value={yarnId} onChange={(event) => setYarnId(event.target.value)}>
            <option value="">Select a yarn…</option>
            {items.map((item) => (
              <option key={item.yarnId} value={item.yarnId}>
                {item.yarnId} — {item.yarnName} ({formatQuantity(item.currentStock)} {item.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="movement-type">
              Movement type
            </label>
            <select
              id="movement-type"
              className={INPUT}
              value={movementType}
              onChange={(event) => setMovementType(event.target.value as StockMovementType)}
            >
              <option value="Stock In">Stock In</option>
              <option value="Consumption">Consumption</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="movement-quantity">
              Quantity{selected ? ` (${selected.unit})` : ''}
            </label>
            <input
              id="movement-quantity"
              type="number"
              min="0"
              step="any"
              className={INPUT}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="e.g. 25"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="movement-date">
              Date
            </label>
            <input
              id="movement-date"
              type="date"
              className={INPUT}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="movement-reference">
              Reference
            </label>
            <input
              id="movement-reference"
              type="text"
              maxLength={100}
              className={INPUT}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. GRN-1042"
            />
          </div>
        </div>

        {movementType === 'Stock In' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="movement-supplier">
                Supplier (stock in)
              </label>
              <select
                id="movement-supplier"
                className={INPUT}
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
              >
                <option value="">Select a supplier…</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.companyName}>
                    {supplier.companyName}
                  </option>
                ))}
                {supplierName !== '' && !suppliers.some((supplier) => supplier.companyName === supplierName) ? (
                  <option value={supplierName}>{supplierName}</option>
                ) : null}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="movement-notes">
                Notes
              </label>
              <input
                id="movement-notes"
                type="text"
                maxLength={2000}
                className={INPUT}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional receipt notes"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="movement-reason">
                Reason
              </label>
              <select
                id="movement-reason"
                className={INPUT}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {STOCK_OUT_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {reason === 'Other' ? (
              <div>
                <label className={LABEL} htmlFor="movement-other-reason">
                  Other reason
                </label>
                <input
                  id="movement-other-reason"
                  type="text"
                  maxLength={200}
                  className={INPUT}
                  value={otherReason}
                  onChange={(event) => setOtherReason(event.target.value)}
                />
              </div>
            ) : null}
          </div>
        )}

        {selected ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            Current stock: {formatQuantity(selected.currentStock)} {selected.unit} · minimum level{' '}
            {formatQuantity(selected.minimumStockLevel)} {selected.unit}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
