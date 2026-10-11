import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from './navigation';
import { useAuth } from '../../store/AuthProvider';
import { useState, useEffect } from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Production Management': true,
  });

  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const hasChildActive = item.children.some(
          (child) => child.path && location.pathname.startsWith(child.path)
        );
        if (hasChildActive) {
          setExpandedGroups((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
            {NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => {
              if (item.children && item.children.length > 0) {
                const isExpanded = !!expandedGroups[item.label];
                const allowedChildren = item.children.filter(
                  (child) => !child.permission || hasPermission(child.permission)
                );
                if (allowedChildren.length === 0) return null;

                return (
                  <li key={item.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.label)}
                      className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon size={18} aria-hidden className="shrink-0 text-[var(--color-primary)]" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={16} className="shrink-0 text-[var(--color-text-muted)]" />
                      ) : (
                        <ChevronRight size={16} className="shrink-0 text-[var(--color-text-muted)]" />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className="ml-4 border-l border-[var(--color-border)] pl-2 space-y-1">
                        {allowedChildren.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path!}
                              end={child.exact}
                              onClick={onClose}
                              className={({ isActive }) =>
                                `flex items-center gap-2.5 rounded-[var(--radius-button)] px-3 py-2 text-xs font-medium transition-colors ${
                                  isActive
                                    ? 'bg-[var(--color-primary-hover)] text-[var(--color-background)] font-semibold'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-heading)]'
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <child.icon
                                    size={16}
                                    aria-hidden
                                    className={
                                      isActive
                                        ? 'shrink-0 text-[var(--color-background)]'
                                        : 'shrink-0 text-[var(--color-primary)]'
                                    }
                                  />
                                  <span className="truncate">{child.label}</span>
                                </>
                              )}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path!}
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
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--color-border)] px-5 py-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
          Frontend Phase 1 — Yarn Inventory module preview.
        </div>
      </aside>
    </>
  );
}
