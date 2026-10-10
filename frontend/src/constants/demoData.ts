/**
 * SAMPLE DEMONSTRATION DATA
 *
 * Every value in this file is illustrative demo data used by the marketing
 * landing page and the dashboard preview. None of it is live factory data and
 * it must never be presented as verified production information.
 */

export type StatTone = 'success' | 'error' | 'info' | 'warning';

export interface DemoStat {
  id: string;
  icon: 'package' | 'clipboard' | 'cog' | 'waves';
  value: string;
  label: string;
  indicator: {
    text: string;
    tone: StatTone;
    icon: 'trend' | 'alert' | 'activity';
  };
}

export const DEMO_STATS: DemoStat[] = [
  {
    id: 'raw-material',
    icon: 'package',
    value: '12,450 kg',
    label: 'Raw Material in Stock',
    indicator: { text: '+5% from last week', tone: 'success', icon: 'trend' },
  },
  {
    id: 'active-orders',
    icon: 'clipboard',
    value: '24',
    label: 'Active Orders',
    indicator: { text: '4 need attention', tone: 'error', icon: 'alert' },
  },
  {
    id: 'machines-running',
    icon: 'cog',
    value: '18 / 24',
    label: 'Machines Running',
    indicator: { text: '75% utilisation', tone: 'info', icon: 'activity' },
  },
  {
    id: 'fabric-today',
    icon: 'waves',
    value: '5,230 m',
    label: 'Fabric Produced Today',
    indicator: { text: '+12% from yesterday', tone: 'success', icon: 'trend' },
  },
];

export interface DemoFeature {
  id: string;
  icon: 'package' | 'factory' | 'shield' | 'clipboard' | 'truck' | 'users';
  title: string;
  description: string;
}

export const DEMO_FEATURES: DemoFeature[] = [
  {
    id: 'smart-inventory',
    icon: 'package',
    title: 'Smart Inventory',
    description:
      'Track incoming yarn, material types, colours, available quantities, and low-stock alerts.',
  },
  {
    id: 'production-management',
    icon: 'factory',
    title: 'Production Management',
    description:
      'Monitor spinning, weaving, and dyeing progress, assigned machines, production quantities, and delays.',
  },
  {
    id: 'quality-control',
    icon: 'shield',
    title: 'Quality Control',
    description:
      'Record fabric defects, manage inspections, and trace each roll back to its production order and machine.',
  },
  {
    id: 'order-tracking',
    icon: 'clipboard',
    title: 'Order Tracking',
    description:
      'Track buyer orders from confirmation to production, quality inspection, and dispatch.',
  },
  {
    id: 'dispatch-management',
    icon: 'truck',
    title: 'Dispatch Management',
    description:
      'Manage finished rolls, packing, shipment quantities, delivery information, and invoice matching.',
  },
  {
    id: 'workforce-accounts',
    icon: 'users',
    title: 'Workforce and Accounts',
    description:
      'Maintain worker attendance, wage records, material expenses, buyer payments, and order-wise costing.',
  },
];

export interface DemoWorkflowStep {
  id: string;
  icon: 'package-plus' | 'clipboard' | 'factory' | 'shield' | 'truck' | 'calculator';
  title: string;
  description: string;
}

export const DEMO_WORKFLOW: DemoWorkflowStep[] = [
  {
    id: 'receive-materials',
    icon: 'package-plus',
    title: 'Receive Materials',
    description: 'Record incoming yarn and update inventory.',
  },
  {
    id: 'manage-orders',
    icon: 'clipboard',
    title: 'Manage Orders',
    description:
      'Record buyer requirements, fabric specifications, quantities, and deadlines.',
  },
  {
    id: 'start-production',
    icon: 'factory',
    title: 'Start Production',
    description: 'Assign machines and monitor production progress.',
  },
  {
    id: 'inspect-quality',
    icon: 'shield',
    title: 'Inspect Quality',
    description: 'Record defects, rework, and approved fabric rolls.',
  },
  {
    id: 'dispatch-orders',
    icon: 'truck',
    title: 'Dispatch Orders',
    description: 'Pack finished rolls and record shipments.',
  },
  {
    id: 'track-costs',
    icon: 'calculator',
    title: 'Track Costs',
    description:
      'Review material costs, wages, payments, and order profitability.',
  },
];

export interface DemoRole {
  id: string;
  icon: 'settings' | 'factory' | 'shield' | 'briefcase';
  title: string;
  description: string;
}

export const DEMO_ROLES: DemoRole[] = [
  {
    id: 'administrators',
    icon: 'settings',
    title: 'Factory Administrators',
    description: 'Oversee operations, orders, inventory, and reports.',
  },
  {
    id: 'production-teams',
    icon: 'factory',
    title: 'Production Teams',
    description: 'Track machines, production tasks, and output.',
  },
  {
    id: 'quality-inspectors',
    icon: 'shield',
    title: 'Quality Inspectors',
    description: 'Record defects, inspections, and roll-level traceability.',
  },
  {
    id: 'buyers',
    icon: 'briefcase',
    title: 'Buyers',
    description:
      'View order status, expected delivery information, and relevant documents.',
  },
];

export interface DemoBenefit {
  id: string;
  icon: 'gauge' | 'package-search' | 'scan' | 'wallet';
  title: string;
  description: string;
}

export const DEMO_BENEFITS: DemoBenefit[] = [
  {
    id: 'production-visibility',
    icon: 'gauge',
    title: 'Better Production Visibility',
    description:
      'Understand which orders are progressing and which need attention.',
  },
  {
    id: 'inventory-control',
    icon: 'package-search',
    title: 'Smarter Inventory Control',
    description: 'Identify low-stock materials before they delay production.',
  },
  {
    id: 'quality-traceability',
    icon: 'scan',
    title: 'Improved Quality Traceability',
    description:
      'Link inspection results to the relevant order, roll, and machine.',
  },
  {
    id: 'cost-tracking',
    icon: 'wallet',
    title: 'Clearer Cost Tracking',
    description:
      'Bring material bills, wages, and buyer payments together.',
  },
];

export interface DemoHeroBenefit {
  id: string;
  icon: 'pointer' | 'gauge' | 'network';
  title: string;
  description: string;
}

export const DEMO_HERO_BENEFITS: DemoHeroBenefit[] = [
  {
    id: 'simple',
    icon: 'pointer',
    title: 'Simple',
    description: 'Easy-to-use factory management.',
  },
  {
    id: 'efficient',
    icon: 'gauge',
    title: 'Efficient',
    description: 'Streamlined production operations.',
  },
  {
    id: 'connected',
    icon: 'network',
    title: 'Connected',
    description: 'Better visibility across the entire factory.',
  },
];

/* ---------- Dashboard preview sample data ---------- */

export const DEMO_PRODUCTION_WEEK: Array<{ day: string; meters: number }> = [
  { day: 'Sat', meters: 3820 },
  { day: 'Sun', meters: 4110 },
  { day: 'Mon', meters: 4560 },
  { day: 'Tue', meters: 4980 },
  { day: 'Wed', meters: 4720 },
  { day: 'Thu', meters: 5040 },
  { day: 'Fri', meters: 5230 },
];

export const DEMO_PRODUCTION_CHART_MAX = 5600;

export const DEMO_MACHINES_TOTAL = 24;

export const DEMO_MACHINE_STATUS: Array<{ label: string; count: number; swatch: string }> = [
  { label: 'Running', count: 18, swatch: 'bg-primary' },
  { label: 'Idle', count: 4, swatch: 'bg-warning' },
  { label: 'Maintenance', count: 2, swatch: 'bg-muted' },
];

export const DEMO_ACTIVITIES: Array<{ text: string; time: string }> = [
  { text: 'Roll R-2291 approved after quality inspection', time: '12 min ago' },
  { text: 'Order ORD-1042 moved to weaving', time: '40 min ago' },
  { text: 'Yarn receipt recorded — 1,200 kg cotton', time: '1 h ago' },
  { text: 'Shipment SH-118 dispatched from finished goods store', time: '2 h ago' },
  { text: 'Loom-07 scheduled for preventive maintenance', time: '3 h ago' },
];

export const DEMO_LOW_STOCK: Array<{ item: string; detail: string }> = [
  { item: 'Cotton yarn 40s', detail: '320 kg left · minimum 500 kg' },
  { item: 'Reactive dye — Navy', detail: '18 kg left · minimum 40 kg' },
  { item: 'Packaging roll cores', detail: '85 pcs left · minimum 150 pcs' },
];

export const DEMO_ORDER_DEADLINES: Array<{ order: string; buyer: string; due: string }> = [
  { order: 'ORD-1039', buyer: 'Northwind Retail', due: 'Due in 2 days' },
  { order: 'ORD-1042', buyer: 'Bluepeak Apparel', due: 'Due in 5 days' },
  { order: 'ORD-1051', buyer: 'Harbor Textiles', due: 'Due in 8 days' },
];

export const DEMO_DASHBOARD_NAV: Array<{
  label: string;
  icon: 'dashboard' | 'boxes' | 'factory' | 'shield' | 'clipboard' | 'truck' | 'users' | 'chart';
  active?: boolean;
}> = [
  { label: 'Dashboard', icon: 'dashboard', active: true },
  { label: 'Inventory', icon: 'boxes' },
  { label: 'Production', icon: 'factory' },
  { label: 'Quality', icon: 'shield' },
  { label: 'Orders', icon: 'clipboard' },
  { label: 'Dispatch', icon: 'truck' },
  { label: 'Workforce', icon: 'users' },
  { label: 'Reports', icon: 'chart' },
];
