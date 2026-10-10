import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cx } from '../../utils/cx';
import { ChevronDown, ChevronRight, LayoutDashboard, ClipboardList, FileText, AlertCircle, Factory, Cog, Users, Calendar, Package, Truck as TruckIcon, Shield, Activity, Zap, LogOut } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: string;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'ORDER MANAGEMENT',
    items: [
      { to: '/admin/incoming', label: 'Incoming Orders', icon: FileText, badge: '4' },
      { to: '/admin/orders', label: 'All Orders', icon: ClipboardList },
      { to: '/admin/manual-order', label: 'Create Manual Order', icon: FileText },
      { to: '/admin/inquiries', label: 'Order Inquiries', icon: AlertCircle },
    ],
  },
  {
    title: 'INVENTORY & OPERATIONS',
    items: [
      { to: '/admin/materials', label: 'Raw Materials & Inventory', icon: Package },
      { to: '/admin/suppliers', label: 'Suppliers & Purchases', icon: TruckIcon },
      { to: '/admin/movements', label: 'Stock Movements', icon: Activity },
      { to: '/admin/alerts', label: 'Low-Stock Alerts', icon: AlertCircle },
      { to: '/admin/machines', label: 'Machines', icon: Cog },
      { to: '/admin/jobs', label: 'Production Jobs', icon: Factory },
      { to: '/admin/recommend', label: 'Production Recommendations', icon: Zap },
      { to: '/admin/quality', label: 'Quality Control', icon: Shield },
      { to: '/admin/dispatch', label: 'Packing & Dispatch', icon: TruckIcon },
    ],
  },
  {
    title: 'TEAM & ATTENDANCE',
    items: [
      { to: '/admin/employees', label: 'Employee Access', icon: Users },
      { to: '/admin/attendance', label: 'Attendance Register', icon: Calendar },
    ],
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(navSections.map(s => s.title)));

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const hasActiveChild = (section: NavSection) => {
    return section.items.some(item =>
      item.children?.some(child => isActive(child.to, child.end)) || isActive(item.to, item.end)
    );
  };

  void hasActiveChild;

  return (
    <aside
      className="admin-layout__sidebar flex flex-col"
      aria-label="Admin navigation"
      role="navigation"
    >
      {/* Branding Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--admin-sidebar-border)] px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <svg viewBox="0 0 56 34" className="h-6 w-auto" aria-hidden>
            <path d="M4 24C11 10 19 8 28 18" fill="none" className="stroke-accent" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M16 26C23 12 33 9 43 17" fill="none" className="stroke-primary" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M32 27c6-8 13-10 21-6" fill="none" className="stroke-primary-dark" strokeWidth="5.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-sidebar-text">Everest Textile Mills</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-text-muted">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="admin-layout__sidebar-nav flex-1 overflow-y-auto px-3 py-4" aria-label="Admin modules">
        {navSections.map((section) => {
          const sectionHasActive = hasActiveChild(section);
          const isExpanded = expandedSections.has(section.title) || sectionHasActive;
          
          return (
            <div key={section.title} className="mb-6">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-text-muted">
                  {section.title}
                </p>
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={cx(
                    'flex h-6 w-6 items-center justify-center rounded text-sidebar-text-muted hover:text-sidebar-text transition-colors',
                    isExpanded && 'rotate-90'
                  )}
                  aria-expanded={isExpanded}
                  aria-controls={`section-${section.title}`}
                  aria-label={isExpanded ? `Collapse ${section.title}` : `Expand ${section.title}`}
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              
              <div
                id={`section-${section.title}`}
                className={cx('overflow-hidden transition-all duration-200', !isExpanded && 'max-h-0 opacity-0')}
                role="group"
                aria-label={section.title}
              >
                <ul className="space-y-0.5" role="list">
                  {section.items.map((item) => {
                    const active = isActive(item.to, item.end);
                    const hasChildren = item.children && item.children.length > 0;
                    
                    return (
                      <li key={item.to}>
                        {hasChildren ? (
                          <details className="group">
                            <summary
                              className={cx(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors list-none cursor-pointer',
                                active
                                  ? 'bg-[var(--admin-sidebar-active-bg)] text-[var(--admin-sidebar-active-text)]'
                                  : 'text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-[var(--admin-sidebar-text)]'
                              )}
                              aria-expanded={active}
                            >
                              <item.icon
                                size={18}
                                aria-hidden
                                className={cx(
                                  'shrink-0',
                                  active ? 'text-[var(--admin-sidebar-icon-active)]' : 'text-[var(--admin-sidebar-icon-inactive)]'
                                )}
                              />
                              <span className="truncate flex-1">{item.label}</span>
                              {item.badge && (
                                <span className={cx(
                                  'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                                  active ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                                )}>
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight
                                className={cx(
                                  'h-3.5 w-3.5 shrink-0 transition-transform',
                                  active ? 'text-[var(--admin-sidebar-icon-active)]' : 'text-[var(--admin-sidebar-icon-inactive)]',
                                  'group-open:rotate-90'
                                )}
                                aria-hidden
                              />
                            </summary>
                            <ul className="mt-1 ml-6 space-y-0.5 pl-2 border-l border-[var(--admin-sidebar-border)]">
                              {item.children!.map((child) => (
                                <li key={child.to}>
                                  <NavLink
                                    to={child.to}
                                    end={child.end}
                                    onClick={onClose}
                                    className={({ isActive: childActive }) => cx(
                                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                      childActive
                                        ? 'bg-[var(--admin-sidebar-active-bg)] text-[var(--admin-sidebar-active-text)]'
                                        : 'text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-[var(--admin-sidebar-text)]'
                                    )}
                                  >
                                    <child.icon
                                      size={16}
                                      aria-hidden
                                      className={cx(
                                        'shrink-0',
                                        active ? 'text-[var(--admin-sidebar-icon-active)]' : 'text-[var(--admin-sidebar-icon-inactive)]'
                                      )}
                                    />
                                    <span className="truncate">{child.label}</span>
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <NavLink
                            to={item.to}
                            end={item.end}
                            onClick={onClose}
                            className={({ isActive }) => cx(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-[var(--admin-sidebar-active-bg)] text-[var(--admin-sidebar-active-text)] shadow-sm'
                                : 'text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-[var(--admin-sidebar-text)]'
                            )}
                            aria-current={isActive(item.to, item.end) ? 'page' : undefined}
                          >
                            <item.icon
                              size={18}
                              aria-hidden
                              className={cx(
                                'shrink-0',
                                active ? 'text-[var(--admin-sidebar-icon-active)]' : 'text-[var(--admin-sidebar-icon-inactive)]'
                              )}
                            />
                            <span className="truncate flex-1">{item.label}</span>
                            {item.badge && (
                              <span className={cx(
                                'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                                active ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Account Footer */}
      <div className="mt-auto border-t border-[var(--admin-sidebar-border)] p-4">
        <div className="flex items-center justify-between rounded-lg border border-[var(--admin-sidebar-border)] bg-[rgba(255,255,255,0.03)] px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              AD
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-text">Factory Administrator</p>
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-sidebar-text-muted">Administrator</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-text-muted" />
        </div>
        <button
          type="button"
          onClick={() => {
            // Logout handled by parent
            window.dispatchEvent(new CustomEvent('admin-logout'));
          }}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-[var(--admin-sidebar-border)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm font-medium text-sidebar-text hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Logout
        </button>
      </div>
    </aside>
  );
}