import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { findNavItem } from './navigation';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const activeItem = findNavItem(pathname);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="page flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <Topbar
          title={activeItem?.crumb ?? 'Page not found'}
          module={activeItem?.module}
          showHomeCrumb={Boolean(activeItem) && !activeItem?.exact}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
