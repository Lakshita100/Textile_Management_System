import { Boxes, Layers, Truck, TriangleAlert, Wallet, type LucideIcon } from 'lucide-react';
import { formatKNumber, type InventorySummary } from '../inventoryLogic';

interface SummaryCardsProps {
  summary: InventorySummary;
}

interface CardIcon {
  Icon: LucideIcon;
  className: string;
}

const CARD_ICONS: Record<string, CardIcon> = {
  'total-yarn-types': { Icon: Layers, className: 'text-[var(--color-primary)]' },
  'total-available-stock': { Icon: Boxes, className: 'text-[var(--color-accent)]' },
  'low-stock-items': { Icon: TriangleAlert, className: 'text-[var(--color-warning)]' },
  'inventory-value': { Icon: Wallet, className: 'text-[var(--color-primary)]' },
  'total-suppliers': { Icon: Truck, className: 'text-[var(--color-accent)]' },
};

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      id: 'total-yarn-types',
      label: 'Total Yarn Types',
      value: formatKNumber(summary.totalYarnTypes),
      hint: 'Yarn records in inventory',
    },
    {
      id: 'total-available-stock',
      label: 'Total Available Stock',
      value: `${formatKNumber(summary.totalAvailableStock)} ${summary.stockUnit || 'kg'}`,
      hint: 'Current aggregate stock',
    },
    {
      id: 'low-stock-items',
      label: 'Low Stock Items',
      value: formatKNumber(summary.lowStockItems),
      hint: summary.outOfStockItems > 0
        ? `${formatKNumber(summary.outOfStockItems)} out of stock`
        : 'Below minimum stock level',
    },
    {
      id: 'inventory-value',
      label: 'Inventory Value',
      value: formatKNumber(summary.inventoryValue),
      hint: 'Stock quantity × unit cost',
    },
    {
      id: 'total-suppliers',
      label: 'Total Suppliers',
      value: formatKNumber(summary.totalSuppliers),
      hint: 'Registered active suppliers',
    },
  ];

  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Inventory summary
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const { Icon, className } = CARD_ICONS[card.id];
          return (
            <li
              key={card.id}
              className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[1.15rem] font-medium text-slate-600">{card.label}</p>
                <span
                  aria-hidden
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
                >
                  <Icon size={18} className={className} />
                </span>
              </div>

              <p className="mt-4 text-[2.1rem] font-semibold leading-none tracking-[-0.05em] text-slate-800 tabular-nums">
                {card.value}
              </p>
              <p className="mt-3 text-sm text-slate-500">{card.hint}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
