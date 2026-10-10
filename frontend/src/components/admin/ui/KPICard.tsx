import { cx } from '../../../utils/cx';

export interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  } | null;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

export function KPICard({
  label,
  value,
  icon,
  trend = null,
  variant = 'default',
  onClick,
  loading = false,
  className,
}: KPICardProps) {
  const variants = {
    default: 'border-border hover:border-border-strong',
    primary: 'border-primary/30 bg-primary/5 hover:bg-primary/10',
    success: 'border-success/30 bg-success-light/50 hover:bg-success-light',
    warning: 'border-warning/30 bg-warning-light/50 hover:bg-warning-light',
    danger: 'border-danger/30 bg-danger-light/50 hover:bg-danger-light',
  };

  const iconVariants = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    danger: 'bg-danger-light text-danger',
  };

  return (
    <div
      className={cx(
        'relative rounded-xl border p-5 transition-all duration-200',
        variants[variant],
        onClick && 'cursor-pointer hover:shadow-[var(--admin-shadow-md)]',
        loading && 'opacity-70 pointer-events-none',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }} : undefined}
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-8 w-1/2 bg-gray-200 rounded" />
          {trend && <div className="h-3 w-1/3 bg-gray-200 rounded" />}
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-secondary truncate">{label}</p>
              <p className="mt-2 text-2xl font-bold text-text-primary truncate">{value}</p>
            </div>
            <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconVariants[variant])}>
              {icon}
            </div>
          </div>
          {trend && (
            <div className="mt-4 flex items-center gap-1.5 text-sm">
              <span className={cx('font-medium', trend.positive ? 'text-success' : 'text-danger')}>
                {trend.positive ? '▲' : '▼'} {trend.value}
              </span>
              {trend.label && <span className="text-text-muted">{trend.label}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subValue?: string;
  subLabel?: string;
  className?: string;
}

export function StatCard({ label, value, icon, subValue, subLabel, className }: StatCardProps) {
  return (
    <div className={cx('rounded-xl border border-border bg-white p-5', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {subValue && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-semibold text-text-primary">{subValue}</span>
          {subLabel && <span className="text-text-muted">{subLabel}</span>}
        </div>
      )}
    </div>
  );
}