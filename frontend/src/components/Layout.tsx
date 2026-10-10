import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Factory, LayoutDashboard, ListChecks, Sparkles } from 'lucide-react';

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/machines', label: 'Machines', icon: Factory, end: false },
  { to: '/app/jobs', label: 'Production Board', icon: ListChecks, end: false },
  { to: '/app/recommend', label: 'Recommendations', icon: Sparkles, end: false },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/quality', label: 'Quality', icon: ClipboardCheck, end: false },
];

export default function Layout() {
  return (
    <div className="page flex min-h-screen">
      <aside
        className="w-60 shrink-0 border-r flex flex-col"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>TextileMI</p>
          <p className="text-xs muted">Production &amp; Machines</p>
        </div>
        <nav className="p-2 flex flex-col gap-1" aria-label="Main navigation">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm border ${
                  isActive ? 'font-medium' : 'muted'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'var(--color-background)' : 'var(--color-text)',
                borderColor: isActive ? 'var(--color-primary)' : 'transparent',
              })}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-3 text-xs muted border-t" style={{ borderColor: 'var(--color-border)' }}>
          Feature 02 · Rule-based recommendations (not ML)
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="border-b px-6 py-3 flex items-center justify-between"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-heading)' }}>
            Textile Manufacturing Intelligence System
          </p>
          <span className="text-xs muted">Environment: development</span>
        </header>
        <main className="p-6 flex-1" style={{ background: 'var(--color-surface)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
