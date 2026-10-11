import { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  ChevronDown,
  ChevronUp,
  Layers,
  TriangleAlert,
  Truck,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { formatKNumber } from '../raw-materials/inventoryLogic';
import { useInventory } from '../raw-materials/useInventory';

export default function DashboardPage() {
  const { summary, loading } = useInventory();
  const location = useLocation();
  const [productionExpanded, setProductionExpanded] = useState(true);

  const isAdmin = location.pathname.startsWith('/admin');
  const pathPrefix = isAdmin ? '/admin' : '';

  const subTopics = [
    {
      title: 'Yarn Inventory',
      description: 'Manage yarn items, stock levels and batch details',
      icon: Boxes,
      path: `${pathPrefix}/inventory`,
      metric: summary ? `${formatKNumber(summary.totalYarnTypes)} Types` : loading ? '...' : '0 Types',
      subText: summary ? `${formatKNumber(summary.totalAvailableStock)} ${summary.stockUnit} Total Stock` : '',
      badge: 'Main Stock',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Low-Stock Alerts',
      description: 'Review items below minimum threshold and reorder',
      icon: TriangleAlert,
      path: `${pathPrefix}/alerts`,
      metric: summary ? `${formatKNumber(summary.lowStockItems + summary.outOfStockItems)} Alerts` : loading ? '...' : '0 Alerts',
      subText: summary && (summary.lowStockItems > 0 || summary.outOfStockItems > 0) ? 'Requires attention' : 'Stock levels healthy',
      badge: summary && (summary.lowStockItems > 0 || summary.outOfStockItems > 0) ? 'Action Needed' : 'Normal',
      color: summary && (summary.lowStockItems > 0 || summary.outOfStockItems > 0) ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Stock Movements',
      description: 'Track stock additions, usage, and movement history',
      icon: ArrowLeftRight,
      path: `${pathPrefix}/movements`,
      metric: 'Audited History',
      subText: 'Real-time stock ledger entries',
      badge: 'Ledger',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Suppliers',
      description: 'Directory of registered yarn suppliers and contacts',
      icon: Truck,
      path: `${pathPrefix}/suppliers`,
      metric: summary ? `${formatKNumber(summary.totalSuppliers)} Suppliers` : loading ? '...' : '0 Suppliers',
      subText: 'Active supplier directory',
      badge: 'Directory',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-heading)] sm:text-3xl">Dashboard</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-muted)] sm:text-base">
          Overview of your textile yarn inventory system modules
        </p>
      </header>

      {/* Production Management Main Parent Group Card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all overflow-hidden">
        {/* Production Management Collapsible Header */}
        <button
          type="button"
          onClick={() => setProductionExpanded(!productionExpanded)}
          className="w-full flex items-center justify-between p-5 text-left bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors border-b border-[var(--color-border)]"
        >
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center rounded-xl p-3 text-primary bg-primary/10 border border-primary/20">
              <Layers size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--color-heading)]">Production Management</h2>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                  4 Sub-Topics
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                Centralized Yarn Inventory, Low-Stock Alerts, Movements & Supplier Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <span>{productionExpanded ? 'Hide Sub-Topics' : 'Show 4 Sub-Topics'}</span>
            {productionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {/* 4 Sub-Topics Nested List */}
        {productionExpanded && (
          <div className="p-5 bg-[var(--color-background)]/50">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {subTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <Link
                    key={topic.title}
                    to={topic.path}
                    className="group relative flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className={`inline-flex items-center justify-center rounded-lg p-2.5 ${topic.color}`}>
                          <Icon size={20} />
                        </div>
                        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                          {topic.badge}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[var(--color-heading)] group-hover:text-[var(--color-primary)]">
                        {topic.title}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{topic.description}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                      <div>
                        <p className="text-base font-bold text-[var(--color-heading)]">{topic.metric}</p>
                        {topic.subText ? <p className="text-[11px] text-[var(--color-text-muted)]">{topic.subText}</p> : null}
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform">
                        Open Page <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
