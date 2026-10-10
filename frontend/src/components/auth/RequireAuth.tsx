import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { AuthRole } from '../../services/authService';
import { useAuth } from '../../store/AuthProvider';

interface RequireAuthProps {
  /** When set, the signed-in user must hold one of these roles. */
  roles?: AuthRole[];
}

/**
 * Route guard for the factory application. Unauthenticated visitors are sent
 * to /signin (preserving where they were headed); signed-in users whose role
 * is not allowed are bounced to their own portal.
 */
export default function RequireAuth({ roles }: RequireAuthProps) {
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

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'buyer' ? '/buyer' : '/admin'} replace />;
  }

  return <Outlet />;
}
