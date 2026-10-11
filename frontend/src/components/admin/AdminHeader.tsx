import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthProvider';
import { Search, Bell, Globe, LogOut, Menu } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  breadcrumb?: string;
  onMenuClick: () => void;
  onLogout: () => void;
}

export function AdminHeader({ title, breadcrumb, onMenuClick, onLogout }: AdminHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/signin', { replace: true });
  };

  return (
    <header className="admin-layout__header flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-primary transition-colors hover:bg-gray-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          {breadcrumb && (
            <nav className="mb-1 flex items-center gap-1.5 text-xs text-text-muted" aria-label="Breadcrumb">
              <span>Operations control</span>
              <span aria-hidden>›</span>
              <span className="truncate font-medium text-text-primary" aria-current="page">{breadcrumb}</span>
            </nav>
          )}
          <h1 className="truncate text-xl font-semibold text-text-primary">{title}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            placeholder="Search orders, materials, machines..."
            className="h-10 w-64 rounded-lg border border-border bg-white pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Global search"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-text-muted transition-colors hover:bg-gray-50 hover:text-text-primary"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-5 w-5" aria-hidden />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" aria-label="3 unread" />
          </button>
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} aria-hidden />
              <div className="fixed right-4 top-[calc(var(--admin-header-height)+8px)] z-50 w-80 rounded-xl border border-border bg-white shadow-[var(--admin-shadow-lg)]">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="font-semibold text-text-primary">Notifications</h3>
                  <button type="button" onClick={() => setNotificationsOpen(false)} className="text-text-muted hover:text-text-primary" aria-label="Close">
                    ×
                  </button>
                </div>
                <div className="divide-y divide-border">
                  <div className="p-4"><p className="text-sm font-medium text-text-primary">Order ORD-1042</p><p className="text-xs text-text-muted">Moved to weaving stage</p></div>
                  <div className="p-4"><p className="text-sm font-medium text-text-primary">Low stock alert</p><p className="text-xs text-text-muted">Cotton yarn 40s below minimum</p></div>
                  <div className="p-4"><p className="text-sm font-medium text-text-primary">Quality check passed</p><p className="text-xs text-text-muted">Roll R-2291 approved</p></div>
                </div>
              </div>
            </>
          )}
        </div>

        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 hover:text-primary-hover sm:flex"
        >
          <Globe className="h-4 w-4" aria-hidden />
          Website
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {user?.full_name?.split(' ').map(n => n[0]).join('') || 'AD'}
            </div>
            <span className="hidden max-w-[140px] truncate sm:block">{user?.full_name || 'Administrator'}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-text-muted transition-colors hover:bg-danger/5 hover:text-danger"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
