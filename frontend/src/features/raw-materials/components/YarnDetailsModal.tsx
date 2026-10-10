import type { ReactNode } from 'react';
import { Pencil, X } from 'lucide-react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { formatQuantity } from '../movementLogic';
import type { YarnItem } from '../types';

interface YarnDetailsModalProps {
  item: YarnItem | null;
  onClose: () => void;
  onEdit: (item: YarnItem) => void;
}

export default function YarnDetailsModal({ item, onClose, onEdit }: YarnDetailsModalProps) {
  const open = item !== null;

  const buildRows = (yarn: YarnItem): { label: string; value: ReactNode }[] => [
    { label: 'Yarn ID', value: <span className="font-mono text-xs">{yarn.yarnId}</span> },
    { label: 'Yarn name', value: yarn.yarnName },
    { label: 'Product code', value: <span className="font-mono text-xs">{yarn.productCode}</span> },
    { label: 'Category', value: yarn.category },
    { label: 'Material / composition', value: yarn.materialComposition },
    { label: 'Colour / shade', value: yarn.colourShade },
    { label: 'Denier / specification', value: yarn.denierSpecification },
    {
      label: 'Current stock',
      value: (
        <>
          <span className="font-semibold text-[var(--color-heading)]">{formatQuantity(yarn.currentStock)}</span>{' '}
          <span className="text-xs text-[var(--color-text-muted)]">{yarn.unit}</span>
        </>
      ),
    },
    {
      label: 'Unit cost',
      value: (
        <>
          <span className="font-medium text-[var(--color-heading)]">{yarn.unitCost.toFixed(2)}</span>{' '}
          <span className="text-xs text-[var(--color-text-muted)]">/{yarn.unit}</span>
        </>
      ),
    },
    { label: 'Supplier / source', value: yarn.supplierSource },
    {
      label: 'Minimum stock level',
      value: (
        <>
          {formatQuantity(yarn.minimumStockLevel)}{' '}
          <span className="text-xs text-[var(--color-text-muted)]">{yarn.unit}</span>
        </>
      ),
    },
    { label: 'Storage location', value: yarn.storageLocation },
    { label: 'Batch number', value: <span className="font-mono text-xs">{yarn.batchNumber}</span> },
    { label: 'Inventory stage', value: yarn.inventoryStage },
    { label: 'Stock status', value: <StatusBadge status={yarn.stockStatus} /> },
  ];

  return (
    <Modal
      open={open}
      title={item ? `Yarn Details — ${item.yarnId}` : 'Yarn Details'}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={
        item ? (
          <>
            <button type="button" className="btn-secondary" onClick={onClose}>
              <X size={16} aria-hidden />
              Close
            </button>
            <button type="button" className="btn-primary" onClick={() => onEdit(item)}>
              <Pencil size={16} aria-hidden />
              Edit Yarn
            </button>
          </>
        ) : undefined
      }
    >
      {item ? (
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="shrink-0">
            <span className="relative inline-flex h-28 w-40 items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <img
                src={item.imageFile}
                alt={`Sample thumbnail for ${item.yarnName}`}
                className="relative h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            </span>
            <p className="mt-1.5 max-w-40 break-all text-xs text-[var(--color-text-muted)]">{item.imageFile}</p>
          </div>

          <dl className="grid flex-1 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {buildRows(item).map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {row.label}
                </dt>
                <dd className="mt-0.5 text-sm text-[var(--color-heading)]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </Modal>
  );
}
