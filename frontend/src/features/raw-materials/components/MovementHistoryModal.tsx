import Modal from './Modal';
import { formatQuantity } from '../movementLogic';
import type { StockMovement, YarnItem } from '../types';

interface MovementHistoryModalProps {
  open: boolean;
  movements: StockMovement[];
  items: YarnItem[];
  onClose: () => void;
}

const HEAD_CELL =
  'whitespace-nowrap border-b border-[var(--color-border)] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-heading)]';
const BODY_CELL = 'px-3 py-2.5 text-sm text-[var(--color-text)]';

export default function MovementHistoryModal({ open, movements, items, onClose }: MovementHistoryModalProps) {
  const yarnName = (movement: StockMovement): string =>
    movement.yarnName || items.find((item) => item.yarnId === movement.yarnId)?.yarnName || movement.yarnId;

  return (
    <Modal open={open} title="Movement History" onClose={onClose} maxWidthClassName="max-w-4xl">
      {movements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <caption className="sr-only">All recorded stock movements, newest first</caption>
            <thead className="table-header">
              <tr>
                <th scope="col" className={HEAD_CELL}>Date</th>
                <th scope="col" className={HEAD_CELL}>Yarn</th>
                <th scope="col" className={HEAD_CELL}>Type</th>
                <th scope="col" className={HEAD_CELL}>Quantity</th>
                <th scope="col" className={HEAD_CELL}>Stock After</th>
                <th scope="col" className={HEAD_CELL}>Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {movements.map((movement) => (
                <tr key={movement.movementId}>
                  <td className={BODY_CELL}>{movement.date}</td>
                  <td className={BODY_CELL}>
                    <span className="block font-medium text-[var(--color-heading)]">{yarnName(movement)}</span>
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">{movement.yarnId}</span>
                  </td>
                  <td className={BODY_CELL}>{movement.movementType}</td>
                  <td className={BODY_CELL}>
                    {formatQuantity(movement.quantity)} {movement.unit ?? ''}
                  </td>
                  <td className={BODY_CELL}>
                    {formatQuantity(movement.stockAfter)} {movement.unit ?? ''}
                  </td>
                  <td className={BODY_CELL}>
                    <span className="block">{movement.reference}</span>
                    {movement.reason ? (
                      <span className="text-xs text-[var(--color-text-muted)]">{movement.reason}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No movements recorded yet.</p>
      )}
    </Modal>
  );
}
