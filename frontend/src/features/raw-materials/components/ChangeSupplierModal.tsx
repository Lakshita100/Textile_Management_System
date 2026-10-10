import { useEffect, useId, useState, type FormEvent } from 'react';
import { ArrowRightLeft, Ban, Save } from 'lucide-react';
import Modal from './Modal';
import type { ActionResult } from '../inventoryLogic';
import type { Supplier, YarnItem } from '../types';

interface ChangeSupplierModalProps {
  open: boolean;
  suppliers: Supplier[];
  /** Yarn being reassigned (always set from an inventory row action). */
  item?: YarnItem;
  onClose: () => void;
  onSubmit: (yarnId: string, newSupplierName: string, note: string) => Promise<ActionResult>;
}

const INPUT_CLASS = (hasError: boolean) =>
  `w-full rounded-[var(--radius-input)] border bg-[var(--color-input-background)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] ${
    hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
  }`;

/**
 * Reassigns a yarn to another supplier. The backend writes an audit record
 * (supplier change history) and updates the yarn; past stock movements keep
 * the supplier they were received from.
 */
export default function ChangeSupplierModal({
  open,
  suppliers,
  item,
  onClose,
  onSubmit,
}: ChangeSupplierModalProps) {
  const baseId = useId();
  const formId = `${baseId}-form`;
  const [newSupplier, setNewSupplier] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setNewSupplier('');
    setNote('');
    setError('');
    setPending(false);
  }, [open, item?.yarnId]);

  const activeSuppliers = suppliers.filter((supplier) => supplier.active);
  const currentName = item?.supplierSource.trim().toLowerCase() ?? '';
  const choices = activeSuppliers.filter((supplier) => supplier.companyName.toLowerCase() !== currentName);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) {
      setError('No yarn selected.');
      return;
    }
    if (newSupplier === '') {
      setError('Select the new supplier.');
      return;
    }
    setPending(true);
    const result = await onSubmit(item.yarnId, newSupplier, note.trim());
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Change Yarn Supplier"
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <Ban size={16} aria-hidden />
            Cancel
          </button>
          <button type="submit" form={formId} className="btn-primary" disabled={pending}>
            <Save size={16} aria-hidden />
            {pending ? 'Saving…' : 'Change Supplier'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        {error ? (
          <p
            role="alert"
            className="rounded-[var(--radius-input)] border border-[var(--color-danger)] bg-[var(--color-danger-bg)] px-3 py-2.5 text-sm font-medium text-[var(--color-heading)]"
          >
            {error}
          </p>
        ) : null}

        {item ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Yarn record</p>
            <p className="mt-0.5 font-medium text-[var(--color-heading)]">
              {item.yarnName}{' '}
              <span className="font-mono text-xs text-[var(--color-text-muted)]">({item.yarnId})</span>
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Current supplier: <span className="font-medium text-[var(--color-heading)]">{item.supplierSource || '—'}</span>
            </p>
          </div>
        ) : null}

        <div>
          <label
            htmlFor={`${baseId}-supplier`}
            className="mb-1.5 block text-sm font-medium text-[var(--color-heading)]"
          >
            New supplier
            <span aria-hidden className="ms-1 text-[var(--color-danger)]">
              *
            </span>
          </label>
          <div className="relative">
            <ArrowRightLeft
              size={15}
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <select
              id={`${baseId}-supplier`}
              value={newSupplier}
              onChange={(event) => {
                setNewSupplier(event.target.value);
                setError('');
              }}
              aria-invalid={error !== '' && newSupplier === ''}
              className={`${INPUT_CLASS(error !== '' && newSupplier === '')} appearance-none ps-9`}
            >
              <option value="">Select an active supplier</option>
              {choices.map((supplier) => (
                <option key={supplier.supplierId} value={supplier.companyName}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
          </div>
          {choices.length === 0 ? (
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              No other active suppliers — add one in the Suppliers tab first.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${baseId}-note`} className="mb-1.5 block text-sm font-medium text-[var(--color-heading)]">
            Note <span className="font-normal text-[var(--color-text-muted)]">(optional, stored in the audit trail)</span>
          </label>
          <textarea
            id={`${baseId}-note`}
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Agreed rate from Q4 negotiation"
            className={INPUT_CLASS(false)}
          />
        </div>

        <p className="text-xs text-[var(--color-text-muted)]">
          The change is recorded in the supplier change history for {item?.yarnId ?? 'this yarn'}. Past stock
          movements keep the supplier they were received from.
        </p>
      </form>
    </Modal>
  );
}
