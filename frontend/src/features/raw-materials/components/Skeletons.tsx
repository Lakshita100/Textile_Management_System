/** Lightweight loading skeletons — keep the layout stable while data loads. */

export function SummaryCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="card animate-pulse p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="h-4 w-28 rounded bg-[var(--color-surface-hover)]" />
            <div className="h-9 w-9 rounded-[var(--radius-button)] bg-[var(--color-surface-hover)]" />
          </div>
          <div className="mt-4 h-8 w-24 rounded bg-[var(--color-surface-hover)]" />
          <div className="mt-2 h-3 w-36 rounded bg-[var(--color-surface-hover)]" />
        </li>
      ))}
    </ul>
  );
}

export function TableSkeleton({ rows = 6, columns = 8 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto" aria-hidden>
      <div className="min-w-[720px] space-y-3 p-5">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex gap-3">
            {Array.from({ length: columns }, (_, column) => (
              <div
                key={column}
                className="h-9 flex-1 animate-pulse rounded bg-[var(--color-surface-hover)]"
                style={{ animationDelay: `${(row * columns + column) * 20}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-[var(--color-border)]" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-[var(--radius-button)] bg-[var(--color-surface-hover)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          </div>
          <div className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />
        </li>
      ))}
    </ul>
  );
}
