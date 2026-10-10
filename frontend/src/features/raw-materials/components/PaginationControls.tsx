import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  page,
  totalPages,
  pageSize,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems === 0) {
    return (
      <div className="border-t border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-text-muted)] sm:px-6">
        0 matching records
      </div>
    );
  }

  return (
    <nav
      aria-label="Inventory pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-3 sm:px-6"
    >
      <p className="text-xs text-[var(--color-text-muted)]">
        Showing{' '}
        <span className="font-semibold text-[var(--color-heading)] tabular-nums">
          {startIndex + 1}–{endIndex}
        </span>{' '}
        of <span className="font-semibold text-[var(--color-heading)] tabular-nums">{totalItems}</span> matching
        records · {pageSize} rows per page
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-muted)] tabular-nums" aria-live="polite">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn-secondary h-9 px-3"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft size={16} aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          type="button"
          className="btn-secondary h-9 px-3"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          title="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
