import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navigation';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          className="scrim fixed inset-0 z-40 lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      ) : null}

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-primary)] text-sm font-bold text-[var(--color-background)]"
          >
            E
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-heading)]">Everest Textile</p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">Manufacturing Intelligence</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] lg:hidden"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Modules">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Modules
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.exact}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-primary-hover)] text-[var(--color-background)]'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={18}
                        aria-hidden
                        className={
                          isActive
                            ? 'shrink-0 text-[var(--color-background)]'
                            : 'shrink-0 text-[var(--color-primary)]'
                        }
                      />
                      <span className="truncate">{item.label}</span>
                      {isActive ? <span className="sr-only">(current page)</span> : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--color-border)] px-5 py-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
          Frontend Phase 1 — Yarn Inventory module preview.
        </div>
      </aside>
    </>
  );
}
