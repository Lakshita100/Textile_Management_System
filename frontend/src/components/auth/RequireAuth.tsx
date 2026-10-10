import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { AuthRole } from '../../services/authService';
import { useAuth } from '../../store/AuthProvider';

interface RequireAuthProps {
  /** When set, the signed-in user must hold one of these roles. */
  roles?: AuthRole[];
  permission?: string;
  children?: ReactNode;
}

/**
 * Route guard for the factory application. Unauthenticated visitors are sent
 * to /signin (preserving where they were headed); signed-in users whose role
 * is not allowed are bounced to their own portal.
 */
export default function RequireAuth({ roles, permission, children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  if (user.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'buyer' ? '/buyer' : '/admin'} replace />;
  }

  if (permission && user.role !== 'admin' && !user.permissions.includes(permission)) {
    return <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
      <h1 className="text-xl font-bold text-ink">This feature is not assigned to your account</h1>
      <p className="mt-2 text-sm text-muted">Ask your administrator to grant access if you need this page.</p>
      <Link to="/" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Back to home</Link>
    </div>;
  }

  return children ?? <Outlet />;
}
