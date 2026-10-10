import { useEffect, useId, useState, type FormEvent } from 'react';
import { Ban, Minus, Plus, Save } from 'lucide-react';
import Modal from './Modal';
import { YARN_THUMBNAIL_OPTIONS } from '../images';
import {
  createEmptyYarnForm,
  REQUIRED_YARN_FIELDS,
  rowToYarnForm,
  validateYarnForm,
  yarnFormToRow,
  YARN_FIELD_LABELS,
  type ActionResult,
  type AdjustResult,
  type YarnFormErrors,
  type YarnFormValues,
} from '../inventoryLogic';
import {
  formatQuantity,
  roundQuantity,
  validateAdjustQuantity,
  type StockAdjustAction,
} from '../movementLogic';
import { INVENTORY_STAGES, YARN_CATEGORIES, type YarnItem, type YarnRow } from '../types';

interface YarnFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  /** Target record when `mode` is `edit`. */
  item?: YarnItem;
  items: YarnItem[];
  onClose: () => void;
  onSubmit: (row: YarnRow) => Promise<ActionResult>;
  /** Add/Subtract Stock (edit mode only) — saved through the movements API. */
  onAdjustStock?: (yarnId: string, action: StockAdjustAction, quantity: number, note: string) => Promise<AdjustResult>;
}

type FieldKind = 'text' | 'number' | 'select';

interface FieldDef {
  name: keyof YarnFormValues;
  kind: FieldKind;
  options?: readonly string[];
  placeholder?: string;
  min?: string;
  step?: string;
  wide?: boolean;
}

const FIELDS: FieldDef[] = [
  { name: 'yarnId', kind: 'text', placeholder: 'YRN-00001' },
  { name: 'productCode', kind: 'text', placeholder: 'RPY-100' },
  { name: 'yarnName', kind: 'text', placeholder: 'Recycled Polyester Yarn', wide: true },
  { name: 'category', kind: 'select', options: YARN_CATEGORIES },
  { name: 'inventoryStage', kind: 'select', options: INVENTORY_STAGES },
  { name: 'materialComposition', kind: 'text', placeholder: 'Polyester' },
  { name: 'colourShade', kind: 'text', placeholder: 'Black' },
  { name: 'denierSpecification', kind: 'text', placeholder: '150D/48F' },
  { name: 'currentStock', kind: 'number', min: '0', step: 'any', placeholder: '0' },
  { name: 'minimumStockLevel', kind: 'number', min: '0', step: 'any', placeholder: '0' },
  { name: 'unit', kind: 'text', placeholder: 'kg' },
  { name: 'unitCost', kind: 'number', min: '0', step: '0.01', placeholder: '0.00' },
  { name: 'supplierSource', kind: 'text', placeholder: 'Shakti Polymers' },
  { name: 'storageLocation', kind: 'text', placeholder: 'Warehouse A' },
  { name: 'batchNumber', kind: 'text', placeholder: 'B12281' },
  { name: 'imageFile', kind: 'select', options: YARN_THUMBNAIL_OPTIONS, wide: true },
];

interface FieldProps {
  field: FieldDef;
  baseId: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

function Field({ field, baseId, value, error, disabled = false, onChange }: FieldProps) {
  const id = `${baseId}-${field.name}`;
  const errorId = `${id}-error`;
  const label = YARN_FIELD_LABELS[field.name];
  const isRequired = REQUIRED_YARN_FIELDS.includes(field.name);
  const isImage = field.name === 'imageFile';

  const sharedClassName = `w-full rounded-[var(--radius-input)] border bg-[var(--color-input-background)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] ${
    error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
  }${disabled ? ' opacity-70' : ''}`;

  const selectableOptions =
    field.options && value !== '' && !field.options.includes(value)
      ? [value, ...(field.options as string[])]
      : (field.options ?? []);

  return (
    <div className={field.wide ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1 text-sm font-medium text-[var(--color-heading)]">
        {label}
        {isRequired ? (
          <>
            <span aria-hidden className="text-[var(--color-danger)]">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>

      {field.kind === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={error !== undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${sharedClassName} appearance-none`}
        >
          {isImage ? null : <option value="">Select {label.toLowerCase()}</option>}
          {selectableOptions.map((option) => (
            <option key={option} value={option}>
              {isImage ? option.replace('/samples/', '') : option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.kind === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          min={field.min}
          step={field.step}
          disabled={disabled}
          readOnly={disabled}
          aria-invalid={error !== undefined}
          aria-describedby={error ? errorId : undefined}
          className={sharedClassName}
        />
      )}

      {isImage && value ? (
        <span className="mt-2 flex items-center gap-3">
          <img
            src={value}
            alt="Selected yarn thumbnail preview"
            className="h-16 w-24 rounded-[var(--radius-button)] border border-[var(--color-border)] object-cover"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-xs text-[var(--color-text-muted)]">Local asset from public/samples</span>
        </span>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Add / Subtract Stock (edit mode) — goes through the movements API so the
 * change is audited, concurrency-safe and alert-aware on the server.
 * ------------------------------------------------------------------------- */

function StockAdjustPanel({
  item,
  serverStock,
  onAdjust,
}: {
  item: YarnItem;
  serverStock: number;
  onAdjust: (action: StockAdjustAction, quantity: number, note: string) => Promise<AdjustResult>;
}) {
  const baseId = useId();
  const [action, setAction] = useState<StockAdjustAction>('add');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);

  const status = serverStock <= 0 ? 'Out of Stock' : serverStock < item.minimumStockLevel ? 'Low Stock' : 'In Stock';

  const handleApply = async () => {
    const quantityError = validateAdjustQuantity(quantity, action, serverStock, item.unit);
    if (quantityError) {
      setError(quantityError);
      return;
    }
    setPending(true);
    const result = await onAdjust(action, roundQuantity(Number(quantity)), note.trim());
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      setSuccess('');
      return;
    }
    setError('');
    setSuccess(
      `${action === 'add' ? 'Added' : 'Subtracted'} ${formatQuantity(Number(quantity))} ${item.unit}. ` +
        `New stock: ${formatQuantity(result.stockAfter)} ${item.unit}.`,
    );
    setQuantity('');
    setNote('');
  };

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-heading)]">Stock adjustment</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Current stock:{' '}
          <span className="font-semibold text-[var(--color-heading)]">{formatQuantity(serverStock)}</span>{' '}
          {item.unit}{' '}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              status === 'In Stock'
                ? 'bg-[var(--color-success-bg)] text-[var(--color-heading)]'
                : status === 'Low Stock'
                  ? 'bg-[var(--color-warning-bg)] text-[var(--color-heading)]'
                  : 'bg-[var(--color-danger-bg)] text-[var(--color-heading)]'
            }`}
          >
            {status}
          </span>
        </p>
      </div>

      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Saved through the stock-movements API — audited, concurrency-safe, and low-stock alerts update automatically.
        Stock cannot go below zero.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Action
          </span>
          <div className="flex gap-2" role="group" aria-label="Stock adjustment action">
            <button
              type="button"
              onClick={() => {
                setAction('add');
                setError('');
              }}
              aria-pressed={action === 'add'}
              className={`inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border px-3 py-2 text-sm font-medium transition-colors ${
                action === 'add'
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)]'
              }`}
            >
              <Plus size={15} aria-hidden />
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => {
                setAction('subtract');
                setError('');
              }}
              aria-pressed={action === 'subtract'}
              className={`inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border px-3 py-2 text-sm font-medium transition-colors ${
                action === 'subtract'
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)]'
              }`}
            >
              <Minus size={15} aria-hidden />
              Subtract Stock
            </button>
          </div>
        </div>

        <div className="w-36">
          <label htmlFor={`${baseId}-qty`} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Quantity ({item.unit})
          </label>
          <input
            id={`${baseId}-qty`}
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setError('');
              setSuccess('');
            }}
            placeholder="0"
            aria-invalid={error !== ''}
            className={`w-full rounded-[var(--radius-input)] border bg-[var(--color-input-background)] px-3 py-2 text-sm text-[var(--color-text)] ${
              error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
            }`}
          />
        </div>

        <div className="min-w-44 flex-1">
          <label htmlFor={`${baseId}-note`} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Note {action === 'add' ? '(receipt note)' : '(reason)'}
          </label>
          <input
            id={`${baseId}-note`}
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={action === 'add' ? 'e.g. Delivery PO-1024' : 'e.g. Production consumption'}
            className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-input-background)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
        </div>

        <button type="button" className="btn-primary" onClick={() => void handleApply()} disabled={pending}>
          {pending ? 'Saving…' : action === 'add' ? 'Add Stock' : 'Subtract Stock'}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      {success && !error ? (
        <p role="status" className="mt-2 text-sm font-medium text-[var(--color-heading)]">
          {success}
        </p>
      ) : null}
    </section>
  );
}

export default function YarnFormModal({
  open,
  mode,
  item,
  items,
  onClose,
  onSubmit,
  onAdjustStock,
}: YarnFormModalProps) {
  const baseId = useId();
  const formId = `${baseId}-form`;
  const [values, setValues] = useState<YarnFormValues>(() =>
    mode === 'edit' && item ? rowToYarnForm(item) : createEmptyYarnForm(items),
  );
  const [errors, setErrors] = useState<YarnFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [pending, setPending] = useState(false);
  /* Stock shown in the edit-mode adjustment panel; updated from adjust results
     so unsaved form edits are never wiped by a parent refresh. */
  const [serverStock, setServerStock] = useState(item?.currentStock ?? 0);

  const editing = mode === 'edit' && item !== undefined;
  const targetId = editing ? item?.yarnId : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }
    setValues(mode === 'edit' && item ? rowToYarnForm(item) : createEmptyYarnForm(items));
    setServerStock(item?.currentStock ?? 0);
    setErrors({});
    setSubmitError('');
    setPending(false);
    // Reset whenever the dialog opens or its target yarn changes (id, not the
    // object — list refreshes keep the same id and must not wipe edits).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, targetId]);

  const handleChange = (name: keyof YarnFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
    setSubmitError('');
  };

  const handleAdjust = async (action: StockAdjustAction, quantity: number, note: string): Promise<AdjustResult> => {
    if (!onAdjustStock || !item) {
      return { ok: false, error: 'Stock adjustment is unavailable.' };
    }
    const result = await onAdjustStock(item.yarnId, action, quantity, note);
    if (result.ok) {
      setServerStock(roundQuantity(result.stockAfter));
    }
    return result;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateYarnForm(values, items, targetId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }
    setPending(true);
    // In edit mode the stock field is read-only — always send the latest
    // server-side quantity so a full replace cannot clobber recent adjustments.
    const row = yarnFormToRow(values, editing ? serverStock : undefined);
    const result = await onSubmit(row);
    setPending(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    onClose();
  };

  const title = mode === 'add' ? 'Add Yarn' : `Edit Yarn — ${item?.yarnId ?? ''}`;

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <Ban size={16} aria-hidden />
            Cancel
          </button>
          <button type="submit" form={formId} className="btn-primary" disabled={pending}>
            <Save size={16} aria-hidden />
            {pending ? 'Saving…' : mode === 'add' ? 'Save Yarn' : 'Save Changes'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        {submitError ? (
          <p
            role="alert"
            className="rounded-[var(--radius-input)] border border-[var(--color-danger)] bg-[var(--color-danger-bg)] px-3 py-2.5 text-sm font-medium text-[var(--color-heading)]"
          >
            {submitError}
          </p>
        ) : null}

        <p className="text-sm text-[var(--color-text-muted)]">
          {mode === 'add'
            ? 'Create a new yarn record. Fields marked with * are required; stock status is derived automatically.'
            : 'Update the specification details below. Use Add Stock / Subtract Stock to change the quantity — the stock field itself is read-only in edit mode.'}
        </p>

        {editing && item ? (
          <StockAdjustPanel item={item} serverStock={serverStock} onAdjust={handleAdjust} />
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <Field
              key={field.name}
              field={field}
              baseId={baseId}
              value={field.name === 'currentStock' && editing ? String(serverStock) : values[field.name]}
              error={errors[field.name]}
              disabled={field.name === 'currentStock' && editing}
              onChange={handleChange(field.name)}
            />
          ))}
        </div>
      </form>
    </Modal>
  );
}
