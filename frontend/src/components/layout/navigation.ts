import {
  ArrowLeftRight,
  CalendarCheck2,
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
  path?: string;
  icon: LucideIcon;
  /** Match the path exactly (used by the dashboard home route). */
  exact?: boolean;
  permission?: string;
  /** Sub-topics nested under a parent module. */
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    crumb: 'Dashboard',
    module: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
    permission: 'production',
  },
  {
    label: 'Production Management',
    crumb: 'Production Management',
    module: 'Production',
    icon: Boxes,
    permission: 'materials',
    children: [
      {
        label: 'Yarn Inventory',
        crumb: 'Inventory',
        module: 'Inventory',
        path: '/inventory',
        icon: Boxes,
        permission: 'materials',
      },
      {
        label: 'Low-Stock Alerts',
        crumb: 'Low-Stock Alerts',
        module: 'Alerts',
        path: '/alerts',
        icon: TriangleAlert,
        permission: 'materials',
      },
      {
        label: 'Stock Movements',
        crumb: 'Stock Movements',
        module: 'Movements',
        path: '/movements',
        icon: ArrowLeftRight,
        permission: 'materials',
      },
      {
        label: 'Suppliers',
        crumb: 'Suppliers',
        module: 'Suppliers',
        path: '/suppliers',
        icon: Truck,
        permission: 'materials',
      },
    ],
  },
  {
    label: 'Purchase Requests',
    crumb: 'Purchases',
    module: 'Purchases',
    path: '/purchases',
    icon: ClipboardList,
    permission: 'materials',
  },
  {
    label: 'Machines',
    crumb: 'Machines',
    module: 'Machines',
    path: '/machines',
    icon: Cpu,
    permission: 'machines',
  },
  {
    label: 'Production Jobs',
    crumb: 'Production Jobs',
    module: 'Production',
    path: '/jobs',
    icon: Activity,
    permission: 'production',
  },
  {
    label: 'Recommendations',
    crumb: 'Machine Recs',
    module: 'Scheduling',
    path: '/recommend',
    icon: Sparkles,
    permission: 'recommendations',
  },
  {
    label: 'Packing',
    crumb: 'Packing',
    module: 'Quality',
    path: '/quality/packing',
    icon: ClipboardList,
    permission: 'quality',
  },
  {
    label: 'Dispatch',
    crumb: 'Dispatch',
    module: 'Quality',
    path: '/quality/dispatch',
    icon: Truck,
    permission: 'dispatch',
  },
  {
    label: 'Quality Control',
    crumb: 'Quality Dashboard',
    module: 'Quality',
    path: '/quality',
    icon: ShieldCheck,
    permission: 'quality',
  },
  {
    label: 'Attendance',
    crumb: 'Attendance',
    module: 'Attendance',
    path: '/attendance',
    icon: CalendarCheck2,
    permission: 'attendance',
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  for (const item of NAV_ITEMS) {
    if (item.children) {
      const childMatch = item.children.find(
        (child) => child.path && (child.exact ? pathname === child.path : pathname.startsWith(child.path))
      );
      if (childMatch) return childMatch;
    }
    if (item.path && (item.exact ? pathname === item.path : pathname.startsWith(item.path))) {
      return item;
    }
  }
  return undefined;
}
