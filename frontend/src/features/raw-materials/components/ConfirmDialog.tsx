import { CircleAlert } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  /** Optional secondary line (e.g. what will be preserved). */
  detail?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Generic confirmation dialog for destructive or reassignment actions. */
export default function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            <CircleAlert size={16} aria-hidden />
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-[var(--color-text)]">{message}</p>
        {detail ? <p className="text-sm text-[var(--color-text-muted)]">{detail}</p> : null}
      </div>
    </Modal>
  );
}
