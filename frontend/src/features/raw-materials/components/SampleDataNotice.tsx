import { Database, Info } from 'lucide-react';

interface DataNoticeProps {
  /** Total records stored in the backend database. */
  count: number;
  /** Clearly-labelled demo records (DEMO-*), 0 when no demo seed was run. */
  demoCount: number;
}

/**
 * Data-source notice: all records shown come from the FastAPI backend database
 * (SQLite in development, PostgreSQL in production) — never from browser storage.
 */
export default function DataNotice({ count, demoCount }: DataNoticeProps) {
  return (
    <div
      role="note"
      className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6"
    >
      <div className="flex items-start gap-2.5">
        <Database size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
        <p className="text-xs leading-relaxed text-[var(--color-text-muted)] sm:text-sm">
          {count.toLocaleString('en-US')} record{count === 1 ? '' : 's'} loaded from the backend database. Changes are
          saved server-side and survive page refreshes.
        </p>
      </div>
      {demoCount > 0 ? (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-[var(--color-text-muted)] sm:max-w-xs">
          <Info size={14} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
          {demoCount.toLocaleString('en-US')} clearly-labelled demo record{demoCount === 1 ? ' is' : 's are'} included
          (DEMO- identifiers). Remove them with the seed script&apos;s <span className="font-mono">--clean</span> flag.
        </p>
      ) : null}
    </div>
  );
}
