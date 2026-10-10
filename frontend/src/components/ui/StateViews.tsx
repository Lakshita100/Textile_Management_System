import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="card flex items-center justify-center gap-3 px-4 py-10" role="status">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-action"
        aria-hidden="true"
      />
      <span className="text-sm text-copy">{label}</span>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card px-4 py-10 text-center">
      <p className="font-medium text-title">{title}</p>
      {description ? <p className="muted mt-1 text-sm">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="card border-l-4 border-l-title px-4 py-5" role="alert">
      <p className="font-semibold text-title">
        <span aria-hidden="true">! </span>Could not load data
      </p>
      <p className="mt-1 text-sm text-copy">{message}</p>
      {onRetry ? (
        <button type="button" className="btn-secondary mt-3" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}
