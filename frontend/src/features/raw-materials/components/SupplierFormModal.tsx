import { useEffect, useId, useState, type FormEvent } from 'react';
import { Ban, Save } from 'lucide-react';
import Modal from './Modal';
import {
  createEmptySupplierForm,
  supplierToForm,
  validateSupplierForm,
  type SupplierFormErrors,
  type SupplierFormValues,
} from '../supplierLogic';
import type { ActionResult } from '../inventoryLogic';
import { YARN_CATEGORIES, type Supplier } from '../types';

interface SupplierFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  /** Target record when `mode` is `edit`. */
  supplier?: Supplier;
  suppliers: Supplier[];
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<ActionResult>;
}

const INPUT_CLASS = (hasError: boolean) =>
  `w-full rounded-[var(--radius-input)] border bg-[var(--color-input-background)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] ${
    hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
  }`;

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1 text-sm font-medium text-[var(--color-heading)]">
        {label}
        {required ? (
          <>
            <span aria-hidden className="text-[var(--color-danger)]">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function SupplierFormModal({
  open,
  mode,
  supplier,
  suppliers,
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const baseId = useId();
  const formId = `${baseId}-form`;
  const [values, setValues] = useState<SupplierFormValues>(() =>
    mode === 'edit' && supplier ? supplierToForm(supplier) : createEmptySupplierForm(),
  );
  const [errors, setErrors] = useState<SupplierFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValues(mode === 'edit' && supplier ? supplierToForm(supplier) : createEmptySupplierForm());
    setErrors({});
    setSubmitError('');
    setPending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, supplier]);

  const handleChange = (name: keyof SupplierFormValues) => (value: string | string[]) => {
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

  const toggleYarnType = (category: string) => {
    const has = values.yarnTypes.includes(category);
    handleChange('yarnTypes')(has ? values.yarnTypes.filter((entry) => entry !== category) : [...values.yarnTypes, category]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSupplierForm(values, suppliers, mode === 'edit' ? supplier?.supplierId : undefined);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }
    setPending(true);
    const result = await onSubmit(values);
    setPending(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    onClose();
  };

  const numberInput = (name: 'pricePerKg' | 'minOrderQty' | 'leadTimeDays', placeholder: string) => (
    <input
      id={`${baseId}-${name}`}
      type="number"
      min="0"
      step="any"
      value={values[name]}
      onChange={(event) => handleChange(name)(event.target.value)}
      placeholder={placeholder}
      aria-invalid={errors[name] !== undefined}
      aria-describedby={errors[name] ? `${baseId}-${name}-error` : undefined}
      className={INPUT_CLASS(errors[name] !== undefined)}
    />
  );

  return (
    <Modal
      open={open}
      title={mode === 'add' ? 'Add Supplier' : `Edit Supplier — ${supplier?.companyName ?? ''}`}
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
            {pending ? 'Saving…' : mode === 'add' ? 'Add Supplier' : 'Save Changes'}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id={`${baseId}-company`} label="Company name" required error={errors.companyName}>
            <input
              id={`${baseId}-company`}
              type="text"
              value={values.companyName}
              onChange={(event) => handleChange('companyName')(event.target.value)}
              aria-invalid={errors.companyName !== undefined}
              className={INPUT_CLASS(errors.companyName !== undefined)}
            />
          </Field>

          <Field id={`${baseId}-contact`} label="Contact person">
            <input
              id={`${baseId}-contact`}
              type="text"
              value={values.contactPerson}
              onChange={(event) => handleChange('contactPerson')(event.target.value)}
              className={INPUT_CLASS(false)}
            />
          </Field>

          <Field id={`${baseId}-phone`} label="Phone" error={errors.phone}>
            <input
              id={`${baseId}-phone`}
              type="tel"
              value={values.phone}
              onChange={(event) => handleChange('phone')(event.target.value)}
              placeholder="Only if you have a real number"
              aria-invalid={errors.phone !== undefined}
              className={INPUT_CLASS(errors.phone !== undefined)}
            />
          </Field>

          <Field id={`${baseId}-email`} label="Email" error={errors.email}>
            <input
              id={`${baseId}-email`}
              type="email"
              value={values.email}
              onChange={(event) => handleChange('email')(event.target.value)}
              placeholder="Only if you have a real address"
              aria-invalid={errors.email !== undefined}
              className={INPUT_CLASS(errors.email !== undefined)}
            />
          </Field>
        </div>

        <Field id={`${baseId}-address`} label="Address">
          <input
            id={`${baseId}-address`}
            type="text"
            value={values.address}
            onChange={(event) => handleChange('address')(event.target.value)}
            className={INPUT_CLASS(false)}
          />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-[var(--color-heading)]">Yarn types supplied</legend>
          <div className="flex flex-wrap gap-2">
            {YARN_CATEGORIES.map((category) => {
              const checked = values.yarnTypes.includes(category);
              return (
                <label key={category} className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleYarnType(category)}
                    className="peer sr-only"
                  />
                  <span className="inline-block rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-medium text-[var(--color-heading)] transition-colors peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-surface-hover)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-focus)]">
                    {category}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field id={`${baseId}-codes`} label="Product codes" hint="Comma-separated, e.g. PET-150D, NYL-70D">
          <input
            id={`${baseId}-codes`}
            type="text"
            value={values.productCodes}
            onChange={(event) => handleChange('productCodes')(event.target.value)}
            className={INPUT_CLASS(false)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id={`${baseId}-pricePerKg`} label="Price per kg" error={errors.pricePerKg}>
            {numberInput('pricePerKg', 'unknown')}
          </Field>
          <Field id={`${baseId}-minOrderQty`} label="Minimum order (kg)" error={errors.minOrderQty}>
            {numberInput('minOrderQty', 'unknown')}
          </Field>
          <Field id={`${baseId}-leadTimeDays`} label="Lead time (days)" error={errors.leadTimeDays}>
            {numberInput('leadTimeDays', 'unknown')}
          </Field>
        </div>

        <Field id={`${baseId}-notes`} label="Notes">
          <textarea
            id={`${baseId}-notes`}
            rows={3}
            value={values.notes}
            onChange={(event) => handleChange('notes')(event.target.value)}
            className={INPUT_CLASS(false)}
          />
        </Field>

        <p className="text-xs text-[var(--color-text-muted)]">
          Leave commercial fields empty when unknown — this project never invents prices, MOQs or contact details.
        </p>
      </form>
    </Modal>
  );
}
