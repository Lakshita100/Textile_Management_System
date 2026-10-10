import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';
import type { MachineStatus, JobStatus, RecommendationDecision } from '../types';

export function StatusBadge({ status }: { status: MachineStatus | JobStatus | RecommendationDecision | string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    RUNNING: { label: 'Running', bg: 'var(--color-accent)', fg: '#fff' },
    IDLE: { label: 'Idle', bg: 'var(--color-surface)', fg: 'var(--color-heading)' },
    MAINTENANCE: { label: 'Maintenance', bg: 'var(--color-heading)', fg: '#fff' },
    IN_PROGRESS: { label: 'In Progress', bg: 'var(--color-primary)', fg: '#fff' },
    PLANNED: { label: 'Planned', bg: 'var(--color-surface)', fg: 'var(--color-heading)' },
    PAUSED: { label: 'Paused', bg: 'var(--color-heading)', fg: '#fff' },
    COMPLETED: { label: 'Completed', bg: 'var(--color-accent)', fg: '#fff' },
    CANCELLED: { label: 'Cancelled', bg: 'var(--color-border)', fg: 'var(--color-text)' },
    PENDING: { label: 'Pending', bg: 'var(--color-surface)', fg: 'var(--color-heading)' },
    APPROVED: { label: 'Approved', bg: 'var(--color-accent)', fg: '#fff' },
    REJECTED: { label: 'Rejected', bg: 'var(--color-heading)', fg: '#fff' },
    FAILED_REVALIDATION: { label: 'Revalidation Failed', bg: 'var(--color-heading)', fg: '#fff' },
  };
  const s = map[status] ?? { label: status, bg: 'var(--color-surface)', fg: 'var(--color-text)' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border"
      style={{ background: s.bg, color: s.fg, borderColor: 'var(--color-border)' }}
    >
      {s.label}
    </span>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-sm muted">{label}</span>
      <span className="text-2xl font-semibold" style={{ color: 'var(--color-heading)' }}>{value}</span>
      {hint && <span className="text-xs muted">{hint}</span>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 p-8 justify-center muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
      Loading…
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="card p-4 flex items-start gap-2" style={{ borderColor: 'var(--color-heading)' }} role="alert">
      <AlertCircle className="h-5 w-5 shrink-0" style={{ color: 'var(--color-heading)' }} />
      <div>
        <p className="font-medium" style={{ color: 'var(--color-heading)' }}>Something went wrong</p>
        <p className="text-sm muted">{message}</p>
      </div>
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="card p-4 flex items-start gap-2" role="status">
      <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--color-accent)' }} />
      <p className="text-sm" style={{ color: 'var(--color-text)' }}>{message}</p>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-10 flex flex-col items-center gap-2 text-center">
      <Inbox className="h-8 w-8 muted" />
      <p className="font-medium" style={{ color: 'var(--color-heading)' }}>{title}</p>
      {hint && <p className="text-sm muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, background: clamped >= 100 ? 'var(--color-accent)' : 'var(--color-primary)' }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-heading)' }}>{title}</h1>
        {subtitle && <p className="text-sm muted mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
