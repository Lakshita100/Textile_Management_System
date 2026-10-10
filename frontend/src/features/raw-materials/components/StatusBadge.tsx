import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { StockStatus } from '../types';

interface StatusStyle {
  badgeClassName: string;
  iconClassName: string;
  Icon: LucideIcon;
}

const STATUS_STYLES: Record<StockStatus, StatusStyle> = {
  'In Stock': {
    badgeClassName: 'bg-[var(--color-success-bg)]',
    iconClassName: 'text-[var(--color-success)]',
    Icon: CircleCheck,
  },
  'Low Stock': {
    badgeClassName: 'bg-[var(--color-warning-bg)]',
    iconClassName: 'text-[var(--color-warning)]',
    Icon: TriangleAlert,
  },
  'Out of Stock': {
    badgeClassName: 'bg-[var(--color-danger-bg)]',
    iconClassName: 'text-[var(--color-danger)]',
    Icon: CircleX,
  },
};

interface StatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusStyle = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--color-heading)] ${statusStyle.badgeClassName} ${className}`}
    >
      <statusStyle.Icon size={14} aria-hidden className={statusStyle.iconClassName} />
      {status}
    </span>
  );
}
