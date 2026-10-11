import { cx } from '../../../utils/cx';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'outline';
export type BadgeSize = 'sm' | 'md';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success-light text-success border border-success/20',
  warning: 'bg-warning-light text-warning border border-warning/20',
  danger: 'bg-danger-light text-danger border border-danger/20',
  info: 'bg-primary-light text-primary border border-primary/20',
  primary: 'bg-primary text-white',
  outline: 'bg-transparent text-text-primary border border-border',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cx(
            'relative flex h-1.5 w-1.5 shrink-0 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'danger' && 'bg-danger',
            variant === 'info' && 'bg-primary',
            variant === 'primary' && 'bg-white',
            variant === 'default' && 'bg-primary',
            variant === 'outline' && 'bg-text-muted',
          )}
        />
      )}
      {children}
    </span>
  );
}

// Status-specific badges for order statuses
export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    'Submitted': { variant: 'info', label: 'Submitted' },
    'Under Review': { variant: 'warning', label: 'Under Review' },
    'Clarification Required': { variant: 'warning', label: 'Clarification Required' },
    'Accepted': { variant: 'success', label: 'Accepted' },
    'Scheduled': { variant: 'primary', label: 'Scheduled' },
    'In Production': { variant: 'primary', label: 'In Production' },
    'Quality Check': { variant: 'info', label: 'Quality Check' },
    'Ready to Dispatch': { variant: 'success', label: 'Ready to Dispatch' },
    'Dispatched': { variant: 'primary', label: 'Dispatched' },
    'Delivered': { variant: 'success', label: 'Delivered' },
    'Rejected': { variant: 'danger', label: 'Rejected' },
    'Cancelled': { variant: 'outline', label: 'Cancelled' },
    'On Hold': { variant: 'outline', label: 'On Hold' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

// Material availability status badges
export function MaterialStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    'Available': { variant: 'success', label: 'Available' },
    'Partially Available': { variant: 'warning', label: 'Partially Available' },
    'Insufficient Stock': { variant: 'danger', label: 'Insufficient Stock' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };
  return <Badge variant={config.variant} size="sm" dot>{config.label}</Badge>;
}

// Inquiry status badges
export function InquiryStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    'Open': { variant: 'info', label: 'Open' },
    'Awaiting Response': { variant: 'warning', label: 'Awaiting Response' },
    'Resolved': { variant: 'success', label: 'Resolved' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}