import { Menu, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopbarProps {
  title: string;
  module?: string;
  showHomeCrumb: boolean;
  onMenuClick: () => void;
}

export default function Topbar({ title, module, showHomeCrumb, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] lg:hidden"
      >
        <Menu size={20} aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          {showHomeCrumb ? (
            <>
              <Link to="/dashboard" className="rounded-[4px] hover:text-[var(--color-primary)]">
                Home
              </Link>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span className="truncate" aria-current={showHomeCrumb ? 'page' : undefined}>
            {title}
          </span>
        </nav>
        <p className="truncate text-base font-semibold text-[var(--color-heading)]">{title}</p>
      </div>

      {module ? (
        <span className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] sm:inline-flex">
          <Package size={14} className="text-[var(--color-primary)]" aria-hidden />
          Module · {module}
        </span>
      ) : null}
    </header>
  );
}
