import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  Cpu,
  Activity,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  TriangleAlert,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** Full label shown in the sidebar. */
  label: string;
  /** Short label used in the topbar breadcrumb and page title. */
  crumb: string;
  /** Short module name shown in the topbar module chip. */
  module: string;
  path: string;
  icon: LucideIcon;
  /** Match the path exactly (used by the dashboard home route). */
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    crumb: 'Dashboard',
    module: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Yarn Inventory',
    crumb: 'Inventory',
    module: 'Inventory',
    path: '/inventory',
    icon: Boxes,
  },
  {
    label: 'Low-Stock Alerts',
    crumb: 'Low-Stock Alerts',
    module: 'Alerts',
    path: '/alerts',
    icon: TriangleAlert,
  },
  {
    label: 'Stock Movements',
    crumb: 'Stock Movements',
    module: 'Movements',
    path: '/movements',
    icon: ArrowLeftRight,
  },
  {
    label: 'Suppliers',
    crumb: 'Suppliers',
    module: 'Suppliers',
    path: '/suppliers',
    icon: Truck,
  },
  {
    label: 'Purchase Requests',
    crumb: 'Purchases',
    module: 'Purchases',
    path: '/purchases',
    icon: ClipboardList,
  },
  {
    label: 'Machines',
    crumb: 'Machines',
    module: 'Machines',
    path: '/machines',
    icon: Cpu,
  },
  {
    label: 'Production Jobs',
    crumb: 'Production Jobs',
    module: 'Production',
    path: '/jobs',
    icon: Activity,
  },
  {
    label: 'Recommendations',
    crumb: 'Machine Recs',
    module: 'Scheduling',
    path: '/recommend',
    icon: Sparkles,
  },
  {
    label: 'Packing',
    crumb: 'Packing',
    module: 'Quality',
    path: '/quality/packing',
    icon: ClipboardList,
  },
  {
    label: 'Dispatch',
    crumb: 'Dispatch',
    module: 'Quality',
    path: '/quality/dispatch',
    icon: Truck,
  },
  {
    label: 'Quality Control',
    crumb: 'Quality Dashboard',
    module: 'Quality',
    path: '/quality',
    icon: ShieldCheck,
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => (item.exact ? pathname === item.path : pathname.startsWith(item.path)));
}
