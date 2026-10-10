import { ArrowLeftRight, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { formatQuantity, todayIsoDate } from '../movementLogic';
import type { StockMovement, YarnItem } from '../types';

interface MovementsSectionProps {
  movements: StockMovement[];
  items: YarnItem[];
  onRecordMovement: () => void;
  onReverse: (movementId: string) => Promise<{ ok: boolean; error?: string }>;
}

const HEAD_CELL =
  'whitespace-nowrap border-b border-[var(--color-border)] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-heading)]';
const BODY_CELL = 'px-3 py-2.5 text-sm text-[var(--color-text)]';

function isReversible(movement: StockMovement): boolean {
  return !movement.reversalOf && movement.date <= todayIsoDate();
}

export default function MovementsSection({ movements, items, onRecordMovement, onReverse }: MovementsSectionProps) {
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const yarnName = (movement: StockMovement): string =>
    movement.yarnName || items.find((item) => item.yarnId === movement.yarnId)?.yarnName || movement.yarnId;

  const handleReverse = async (movementId: string) => {
    setBusyId(movementId);
    setError('');
    const result = await onReverse(movementId);
    if (!result.ok) setError(result.error ?? 'Could not reverse the movement.');
    setBusyId(null);
  };

  return (
    <section aria-labelledby="movements-heading" className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
        <div>
          <h2 id="movements-heading" className="text-lg font-semibold text-[var(--color-heading)]">
            Stock Movements
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Every stock change is recorded server-side. Reversals append an auditable correction — nothing is deleted.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={onRecordMovement}>
          <ArrowLeftRight size={16} aria-hidden />
          Record Stock Movement
        </button>
      </div>

      {error ? (
        <p role="alert" className="border-b border-[var(--color-danger)] bg-[var(--color-danger-bg)] px-5 py-2.5 text-sm font-medium text-[var(--color-heading)] sm:px-6">
          {error}
        </p>
      ) : null}

      {movements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <caption className="sr-only">Stock movements, newest first</caption>
            <thead className="table-header">
              <tr>
                <th scope="col" className={HEAD_CELL}>Date</th>
                <th scope="col" className={HEAD_CELL}>Yarn</th>
                <th scope="col" className={HEAD_CELL}>Type</th>
                <th scope="col" className={HEAD_CELL}>Quantity</th>
                <th scope="col" className={HEAD_CELL}>Stock After</th>
                <th scope="col" className={HEAD_CELL}>Reference</th>
                <th scope="col" className={HEAD_CELL}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {movements.map((movement) => (
                <tr key={movement.movementId} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                  <td className={BODY_CELL}>{movement.date}</td>
                  <td className={BODY_CELL}>
                    <span className="block font-medium text-[var(--color-heading)]">{yarnName(movement)}</span>
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">{movement.yarnId}</span>
                  </td>
                  <td className={BODY_CELL}>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        movement.movementType === 'Stock In'
                          ? 'bg-[var(--color-success-bg)] text-[var(--color-heading)]'
                          : 'bg-[var(--color-warning-bg)] text-[var(--color-heading)]'
                      }`}
                    >
                      {movement.movementType}
                    </span>
                  </td>
                  <td className={BODY_CELL}>
                    {formatQuantity(movement.quantity)} {movement.unit ?? ''}
                  </td>
                  <td className={BODY_CELL}>
                    {formatQuantity(movement.stockAfter)} {movement.unit ?? ''}
                  </td>
                  <td className={BODY_CELL}>
                    <span className="block">{movement.reference}</span>
                    {movement.reversalOf ? (
                      <span className="text-xs text-[var(--color-text-muted)]">Correction of {movement.reversalOf}</span>
                    ) : null}
                  </td>
                  <td className={BODY_CELL}>
                    {isReversible(movement) ? (
                      <button
                        type="button"
                        className="btn-secondary px-2.5 py-1.5 text-xs"
                        disabled={busyId === movement.movementId}
                        onClick={() => void handleReverse(movement.movementId)}
                      >
                        <Undo2 size={13} aria-hidden />
                        Reverse
                      </button>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
          No stock movements recorded yet.
        </p>
      )}
    </section>
  );
}
