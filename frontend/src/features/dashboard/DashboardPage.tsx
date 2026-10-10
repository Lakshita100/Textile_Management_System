import { ArrowLeftRight, ArrowRight, Boxes, TriangleAlert, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatKNumber } from '../raw-materials/inventoryLogic';
import { useInventory } from '../raw-materials/useInventory';

export default function DashboardPage() {
  const { summary, loading } = useInventory();

  const cards = [
    {
      title: 'Yarn Inventory',
      description: 'Manage yarn items, stock levels and batch details',
      icon: Boxes,
      path: '/inventory',
      metric: summary ? `${formatKNumber(summary.totalYarnTypes)} Types` : loading ? '...' : '0 Types',
      subText: summary ? `${formatKNumber(summary.totalAvailableStock)} ${summary.stockUnit} Total Stock` : '',
      badge: 'Main Stock',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Low-Stock Alerts',
      description: 'Review items below minimum threshold and reorder',
      icon: TriangleAlert,
      path: '/alerts',
      metric: summary ? `${formatKNumber(summary.lowStockItems + summary.outOfStockItems)} Alerts` : loading ? '...' : '0 Alerts',
      subText: summary && (summary.lowStockItems > 0 || summary.outOfStockItems > 0) ? 'Requires attention' : 'Stock levels healthy',
      badge: summary && (summary.lowStockItems > 0 || summary.outOfStockItems > 0) ? 'Action Needed' : 'Normal',
      color: summary && (summary.lowStockItems > 0 || summary.outOfStockItems > 0) ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Stock Movements',
      description: 'Track stock additions, usage, and movement history',
      icon: ArrowLeftRight,
      path: '/movements',
      metric: 'Audited History',
      subText: 'Real-time stock ledger entries',
      badge: 'Ledger',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Suppliers',
      description: 'Directory of registered yarn suppliers and contacts',
      icon: Truck,
      path: '/suppliers',
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.path}
              className="group relative flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`inline-flex items-center justify-center rounded-lg p-3 ${card.color}`}>
                    <Icon size={24} />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[var(--color-surface-hover)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                    {card.badge}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[var(--color-heading)] group-hover:text-[var(--color-primary)]">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{card.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <div>
                  <p className="text-lg font-bold text-[var(--color-heading)]">{card.metric}</p>
                  {card.subText ? <p className="text-xs text-[var(--color-text-muted)]">{card.subText}</p> : null}
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform">
                  Open Page <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
