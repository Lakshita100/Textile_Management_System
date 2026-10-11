import { cx } from '../../../utils/cx';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  loadingRows?: number;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  loading = false,
  loadingRows = 5,
  rowClassName,
  onRowClick,
  striped = true,
  hoverable = true,
  compact = false,
  className,
}: TableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = compact ? 'px-3 py-2.5' : 'px-4 py-3';

  if (loading) {
    return (
      <div className={cx('rounded-xl border border-border bg-white overflow-hidden', className)}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border" role="table">
            <thead className="bg-gray-50 text-text-muted">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cx(
                      headerPadding,
                      'font-medium text-sm truncate',
                      alignClasses[col.align || 'left'],
                      col.className
                    )}
                    style={{ width: col.width }}
                    scope="col"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="hover:bg-gray-50/50">
                  {columns.map((col) => (
                    <td key={col.key} className={cx(cellPadding, alignClasses[col.align || 'left'])}>
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cx('rounded-xl border border-border bg-white', className)}>
        <div className="px-6 py-12 text-center">
          <p className="text-text-muted">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('rounded-xl border border-border bg-white overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border" role="table">
          <thead className="bg-gray-50 text-text-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cx(
                    headerPadding,
                    'font-medium text-sm truncate',
                    alignClasses[col.align || 'left'],
                    col.className
                  )}
                  style={{ width: col.width }}
                  scope="col"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cx('divide-y divide-border bg-white', striped && 'even:bg-gray-50/30')}>
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={cx(
                  rowClassName?.(row),
                  hoverable && 'hover:bg-gray-50/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      cellPadding,
                      'text-sm text-text-primary',
                      alignClasses[col.align || 'left'],
                      col.className
                    )}
                  >
                    {col.render ? col.render(row, rowIndex) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface TableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: React.ReactNode;
}

export function TableToolbar({ title, description, actions, search, filters, children, className, ...props }: TableToolbarProps) {
  return (
    <div className={cx('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)} {...props}>
      <div className="flex-1 min-w-0">
        {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
        {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center gap-3">
        {search && (
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || 'Search...'}
              className="w-full h-10 rounded-lg border border-border bg-white pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              aria-label={search.placeholder || 'Search'}
            />
          </div>
        )}
        {filters && <div className="flex items-center gap-2">{filters}</div>}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        {children}
      </div>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxPageNumbers = 5,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  
  if (totalPages <= maxPageNumbers) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPageNumbers - 1);
    
    if (end - start + 1 < maxPageNumbers) {
      start = Math.max(1, end - maxPageNumbers + 1);
    }
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('ellipsis');
    }
    
    for (let i = start; i <= end; i++) pages.push(i);
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }
  }

  return (
    <nav className={cx('flex items-center gap-2', className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 px-3 rounded-lg border border-border bg-white text-sm font-medium text-text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {showPageNumbers && (
        <div className="flex items-center gap-1" role="navigation" aria-label="Page numbers">
          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-text-muted" aria-hidden>
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cx(
                  'h-9 min-w-9 rounded-lg text-sm font-medium transition-colors',
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'text-text-primary hover:bg-gray-100'
                )}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 px-3 rounded-lg border border-border bg-white text-sm font-medium text-text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}