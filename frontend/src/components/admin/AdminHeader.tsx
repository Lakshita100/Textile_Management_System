import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthProvider';
import { cx } from '../../utils/cx';
import { Search, Bell, Globe, LogOut, ChevronDown, Menu } from 'lucide-react';

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/signin', { replace: true });
  };

  return (
    <header className="admin-layout__header flex items-center justify-between gap-4">
      {/* Left: Mobile menu + Breadcrumb + Page Title */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-primary hover:bg-gray-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          {breadcrumb && (
            <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-1" aria-label="Breadcrumb">
              <span>Operations control</span>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="truncate font-medium text-text-primary" aria-current="page">{breadcrumb}</span>
            </nav>
          )}
          <h1 className="truncate text-xl font-semibold text-text-primary">{title}</h1>
        </div>
      </div>

      {/* Right: Search + Notifications + Website + User Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Global Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            placeholder="Search orders, materials, machines..."
            className="h-10 w-64 rounded-lg border border-border bg-white pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            aria-label="Global search"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-text-muted hover:bg-gray-50 hover:text-text-primary transition-colors"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-5 w-5" aria-hidden />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" aria-label="3 unread" />
          </button>
          
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} aria-hidden />
              <div className="fixed right-4 top-[calc(var(--admin-header-height)+8px)] z-50 w-80 rounded-xl border border-border bg-white shadow-[var(--admin-shadow-lg)] animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="font-semibold text-text-primary">Notifications</h3>
                  <button onClick={() => setNotificationsOpen(false)} className="text-text-muted hover:text-text-primary" aria-label="Close">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-border">
                  <div className="p-4">
                    <p className="text-sm font-medium text-text-primary">Order ORD-1042</p>
                    <p className="text-xs text-text-muted">Moved to weaving stage</p>
                    <p className="mt-1 text-[10px] text-text-muted">5 minutes ago</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-text-primary">Low stock alert</p>
                    <p className="text-xs text-text-muted">Cotton yarn 40s below minimum</p>
                    <p className="mt-1 text-[10px] text-text-muted">12 minutes ago</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-text-primary">Quality check passed</p>
                    <p className="text-xs text-text-muted">Roll R-2291 approved</p>
                    <p className="mt-1 text-[10px] text-text-muted">1 hour ago</p>
                  </div>
                </div>
                <div className="border-t border-border px-4 py-3">
                  <button className="text-sm font-medium text-primary hover:text-primary-hover w-full text-left">View all notifications</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Website Link */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:text-primary-hover hover:bg-primary/5 transition-colors"
        >
          <Globe className="h-4 w-4" aria-hidden />
          Website
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {user?.full_name?.split(' ').map(n => n[0]).join('') || 'AD'}
            </div>
            <span className="hidden sm:block truncate max-w-[140px]">{user?.full_name || 'Administrator'}</span>
            <ChevronDown className={cx('h-4 w-4 shrink-0 text-text-muted transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
              <div className="fixed right-4 top-[calc(var(--admin-header-height)+8px)] z-50 w-56 rounded-xl border border-border bg-white shadow-[var(--admin-shadow-lg)] animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">{user?.full_name || 'Administrator'}</p>
                  <p className="text-xs text-text-muted">{user?.login_id || user?.email}</p>
                </div>
                <nav className="py-2">
                  <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-gray-50">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile
                  </a>
                  <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-gray-50">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                    Settings
                  </a>
                </nav>
                <div className="border-t border-border py-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}