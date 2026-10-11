import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminRouteGuard } from '../../pages/AdminPanel';
import { useAuth } from '../../store/AuthProvider';

/**
 * Main Admin Layout with fixed sidebar, fixed header, and scrollable content area
 */
export function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [breadcrumb, setBreadcrumb] = useState('');

  // Page title mapping based on route
  useEffect(() => {
    const titles: Record<string, { title: string; breadcrumb: string }> = {
      '/admin': { title: 'Dashboard', breadcrumb: 'Dashboard' },
      '/admin/incoming': { title: 'Incoming Orders', breadcrumb: 'Incoming Orders' },
      '/admin/orders': { title: 'All Orders', breadcrumb: 'All Orders' },
      '/admin/manual-order': { title: 'Create Manual Order', breadcrumb: 'Create Manual Order' },
      '/admin/inquiries': { title: 'Order Inquiries', breadcrumb: 'Order Inquiries' },
      '/admin/materials': { title: 'Raw Materials & Inventory', breadcrumb: 'Raw Materials & Inventory' },
      '/admin/suppliers': { title: 'Suppliers & Purchases', breadcrumb: 'Suppliers & Purchases' },
      '/admin/movements': { title: 'Stock Movements', breadcrumb: 'Stock Movements' },
      '/admin/alerts': { title: 'Low-Stock Alerts', breadcrumb: 'Low-Stock Alerts' },
      '/admin/machines': { title: 'Machines', breadcrumb: 'Machines' },
      '/admin/jobs': { title: 'Production Jobs', breadcrumb: 'Production Jobs' },
      '/admin/recommend': { title: 'Production Recommendations', breadcrumb: 'Production Recommendations' },
      '/admin/quality': { title: 'Quality Control', breadcrumb: 'Quality Control' },
      '/admin/dispatch': { title: 'Packing & Dispatch', breadcrumb: 'Packing & Dispatch' },
      '/admin/employees': { title: 'Employee Access', breadcrumb: 'Employee Access' },
      '/admin/attendance': { title: 'Attendance Register', breadcrumb: 'Attendance Register' },
    };

    // Handle dynamic routes like /admin/orders/:id
    let matched = titles[location.pathname];
    if (!matched) {
      for (const [path, config] of Object.entries(titles)) {
        if (path !== '/admin' && location.pathname.startsWith(path)) {
          matched = config;
          break;
        }
      }
    }
    
    if (matched) {
      setPageTitle(matched.title);
      setBreadcrumb(matched.breadcrumb);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="admin-layout min-h-screen" style={{ ['--admin-sidebar-width' as any]: '240px', ['--admin-header-height' as any]: '64px' } as CSSProperties}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[calc(var(--admin-z-sidebar)-1)] bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar */}
      <AdminSidebar onClose={() => setSidebarOpen(false)} />

      {/* Main content area with fixed header */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[240px]">
        {/* Fixed Header */}
        <AdminHeader
          title={pageTitle}
          breadcrumb={breadcrumb}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        {/* Scrollable Main Content */}
        <main className="admin-layout__main" role="main">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Wrapper component that applies the route guard and layout
 */
export function AdminPanelWithLayout() {
  return (
    <AdminRouteGuard>
      <AdminLayout />
    </AdminRouteGuard>
  );
}