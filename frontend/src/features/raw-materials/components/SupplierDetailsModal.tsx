import { Boxes, Mail, MapPin, Phone, X } from 'lucide-react';
import Modal from './Modal';
import { displayValue, mailtoHref, telHref } from '../supplierLogic';
import type { Supplier } from '../types';

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  onClose: () => void;
}

/** Read-only supplier profile: full contact details + supplied-yarn coverage. */
export default function SupplierDetailsModal({ supplier, onClose }: SupplierDetailsModalProps) {
  const open = supplier !== null;
  const phone = supplier ? telHref(supplier.phone) : null;
  const email = supplier ? mailtoHref(supplier.email) : null;

  return (
    <Modal
      open={open}
      title={supplier ? `Supplier — ${supplier.companyName}` : 'Supplier'}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      footer={
        <button type="button" className="btn-primary" onClick={onClose}>
          <X size={16} aria-hidden />
          Close
        </button>
      }
    >
      {supplier ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                supplier.active
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-heading)]'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
              }`}
            >
              {supplier.active ? 'Active' : 'Inactive'}
            </span>
            <span className="font-mono text-xs text-[var(--color-text-muted)]">{supplier.supplierId}</span>
            {supplier.isDemo ? (
              <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                demo
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              <Boxes size={13} aria-hidden />
              {supplier.suppliedYarnCount ?? 0} yarn record{(supplier.suppliedYarnCount ?? 0) === 1 ? '' : 's'} supplied
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Contact person
              </dt>
              <dd className="mt-0.5 text-sm text-[var(--color-heading)]">{displayValue(supplier.contactPerson)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Phone</dt>
              <dd className="mt-0.5 text-sm text-[var(--color-heading)]">
                {phone ? (
                  <a href={phone} className="inline-flex items-center gap-1.5 hover:text-[var(--color-link)]">
                    <Phone size={14} aria-hidden />
                    {supplier.phone}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                    <Phone size={14} aria-hidden />
                    Not provided
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Email</dt>
              <dd className="mt-0.5 text-sm text-[var(--color-heading)]">
                {email ? (
                  <a href={email} className="inline-flex items-center gap-1.5 hover:text-[var(--color-link)]">
                    <Mail size={14} aria-hidden />
                    {supplier.email}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                    <Mail size={14} aria-hidden />
                    Not provided
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Address</dt>
              <dd className="mt-0.5 text-sm text-[var(--color-heading)]">
                {supplier.address.trim() === '' ? (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                    <MapPin size={14} aria-hidden />
                    Not provided
                  </span>
                ) : (
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin size={14} aria-hidden className="mt-0.5 shrink-0" />
                    {supplier.address}
                  </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Yarn types supplied
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {supplier.yarnTypes.length > 0 ? (
                  supplier.yarnTypes.map((category) => (
                    <span
                      key={category}
                      className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-heading)]"
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-text-muted)]">—</span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Product codes
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--color-heading)]">
                {supplier.productCodes.join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Price per kg
              </dt>
              <dd className="mt-0.5 text-sm text-[var(--color-heading)]">
                {supplier.pricePerKg !== null ? `${supplier.pricePerKg} /kg` : 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Minimum order / lead time
              </dt>
              <dd className="mt-0.5 text-sm text-[var(--color-heading)]">
                {supplier.minOrderQty !== null ? `${supplier.minOrderQty} kg MOQ` : 'MOQ unknown'} ·{' '}
                {supplier.leadTimeDays !== null ? `${supplier.leadTimeDays} days` : 'Lead time unknown'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-[var(--color-heading)]">
                {supplier.notes.trim() || '—'}
              </dd>
            </div>
          </dl>

          <p className="text-xs text-[var(--color-text-muted)]">
            Use the supplier filter on the Inventory tab to see the yarn records assigned to this supplier.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
