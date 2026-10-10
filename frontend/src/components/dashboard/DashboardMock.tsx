import {
  BarChart3,
  Boxes,
  ClipboardList,
  Cog,
  Factory,
  Info,
  LayoutDashboard,
  Search,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  Truck,
  Users,
  Waves,
  Clock,
} from 'lucide-react';
import {
  DEMO_ACTIVITIES,
  DEMO_DASHBOARD_NAV,
  DEMO_MACHINE_STATUS,
  DEMO_MACHINES_TOTAL,
  DEMO_ORDER_DEADLINES,
  DEMO_PRODUCTION_CHART_MAX,
  DEMO_PRODUCTION_WEEK,
  DEMO_LOW_STOCK,
} from '../../constants/demoData';
import { cx } from '../../utils/cx';

const SIDEBAR_ICONS = {
  dashboard: LayoutDashboard,
  boxes: Boxes,
  factory: Factory,
  shield: ShieldCheck,
  clipboard: ClipboardList,
  truck: Truck,
  users: Users,
  chart: BarChart3,
} as const;

const KPI_ACCENT: Record<string, string> = {
  stock: 'bg-primary/10 text-primary',
  orders: 'bg-primary/10 text-primary',
  machines: 'bg-primary/10 text-primary',
  production: 'bg-accent/10 text-accent',
};

const MACHINE_SEGMENT_STROKE: Record<string, string> = {
  Running: 'stroke-primary',
  Idle: 'stroke-warning',
  Maintenance: 'stroke-muted',
};

const MACHINE_SEGMENT_RADIUS = 42;
const MACHINE_SEGMENT_CIRCUMFERENCE = 2 * Math.PI * MACHINE_SEGMENT_RADIUS;

const MACHINE_SEGMENTS = (() => {
  let accumulated = 0;
  return DEMO_MACHINE_STATUS.map((segment) => {
    const length =
      (segment.count / DEMO_MACHINES_TOTAL) * MACHINE_SEGMENT_CIRCUMFERENCE;
    const computed = {
      ...segment,
      length,
      dashOffset: -accumulated,
      stroke: MACHINE_SEGMENT_STROKE[segment.label],
    };
    accumulated += length;
    return computed;
  });
})();

const KPIS = [
  {
    id: 'stock',
    label: 'Raw material stock',
    value: '12,450 kg',
    delta: '+5% this week',
    icon: Boxes,
    tone: 'stock',
    deltaTone: 'text-success',
  },
  {
    id: 'orders',
    label: 'Active orders',
    value: '24',
    delta: '4 need attention',
    icon: ClipboardList,
    tone: 'orders',
    deltaTone: 'text-error',
  },
  {
    id: 'machines',
    label: 'Machines running',
    value: '18 / 24',
    delta: '75% utilisation',
    icon: Cog,
    tone: 'machines',
    deltaTone: 'text-primary',
  },
  {
    id: 'production',
    label: 'Fabric produced today',
    value: '5,230 m',
    delta: '+12% vs yesterday',
    icon: Waves,
    tone: 'production',
    deltaTone: 'text-success',
  },
] as const;

function ProductionChart() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Daily production</p>
          <p className="mt-0.5 text-xs text-muted">Fabric produced, last 7 days</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
          <TrendingUp aria-hidden className="size-3" />
          Trending up
        </span>
      </div>

      <div className="mt-4 grid h-44 grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
        <div
          aria-hidden
          className="flex h-full flex-col justify-between pb-7 text-[9px] tabular-nums text-muted"
        >
          <span>{(DEMO_PRODUCTION_CHART_MAX / 1000).toFixed(1)}k</span>
          <span>{((DEMO_PRODUCTION_CHART_MAX * 2) / 3000).toFixed(1)}k</span>
          <span>{((DEMO_PRODUCTION_CHART_MAX * 1) / 3000).toFixed(1)}k</span>
          <span>0</span>
        </div>
        <div
          role="img"
          aria-label="Illustrative daily production, in meters, for the last seven days"
          className="relative min-w-0"
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between"
          >
            <span className="border-t border-dashed border-line" />
            <span className="border-t border-dashed border-line" />
            <span className="border-t border-dashed border-line" />
            <span className="border-t border-line" />
          </div>
          <div className="absolute inset-x-0 top-0 bottom-7 grid grid-cols-7 items-end gap-2 sm:gap-3">
            {DEMO_PRODUCTION_WEEK.map((entry, index) => {
              const height = Math.round(
                (entry.meters / DEMO_PRODUCTION_CHART_MAX) * 100,
              );
              const isLatest = index === DEMO_PRODUCTION_WEEK.length - 1;
              return (
                <div
                  key={entry.day}
                  className="flex h-full min-w-0 items-end"
                  title={`${entry.day}: ${entry.meters.toLocaleString()} m`}
                >
                  <div
                    className={cx(
                      'w-full rounded-t-sm',
                      isLatest ? 'bg-accent' : 'bg-primary/70',
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="absolute inset-x-0 bottom-0 grid h-6 grid-cols-7 items-end gap-2 text-center sm:gap-3">
            {DEMO_PRODUCTION_WEEK.map((entry) => (
              <span key={entry.day} className="text-[10px] font-medium text-muted">
                {entry.day}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted">
        5,230 m produced today · sample data
      </p>
    </div>
  );
}

function MachineStatusChart() {
  const running = DEMO_MACHINE_STATUS.find((s) => s.label === 'Running')?.count ?? 0;
  const runningPercent = Math.round((running / DEMO_MACHINES_TOTAL) * 100);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink">Machine status</p>
      <p className="mt-0.5 text-xs text-muted">
        {DEMO_MACHINES_TOTAL} machines registered
      </p>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative size-28 shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="size-28 -rotate-90"
            aria-hidden
          >
            {MACHINE_SEGMENTS.map((segment) => (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                r={MACHINE_SEGMENT_RADIUS}
                fill="none"
                strokeWidth="12"
                className={segment.stroke}
                strokeDasharray={`${segment.length} ${MACHINE_SEGMENT_CIRCUMFERENCE - segment.length}`}
                strokeDashoffset={segment.dashOffset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-lg font-bold text-ink">
              {runningPercent}%
            </span>
            <span className="text-[10px] text-muted">running</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {MACHINE_SEGMENTS.map((segment) => (
            <li
              key={segment.label}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 text-muted">
                <span
                  aria-hidden
                  className={cx('size-2.5 shrink-0 rounded-full', segment.swatch)}
                />
                <span className="truncate">{segment.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-ink">
                {segment.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecentActivities() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink">Recent factory activities</p>
      <ul className="mt-3 space-y-3">
        {DEMO_ACTIVITIES.map((activity) => (
          <li key={activity.text} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
            />
            <div className="min-w-0">
              <p className="text-xs leading-relaxed text-ink">{activity.text}</p>
              <p className="mt-0.5 text-[11px] text-muted">{activity.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LowStockAlerts() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink">Low-stock alerts</p>
      <ul className="mt-3 space-y-3">
        {DEMO_LOW_STOCK.map((entry) => (
          <li key={entry.item} className="flex items-start gap-2.5">
            <TriangleAlert
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-warning"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">{entry.item}</p>
              <p className="mt-0.5 text-[11px] text-muted">{entry.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderDeadlines() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink">Upcoming order deadlines</p>
      <ul className="mt-3 space-y-3">
        {DEMO_ORDER_DEADLINES.map((entry) => (
          <li key={entry.order} className="flex items-start gap-2.5">
            <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">
                <span className="text-primary">{entry.order}</span> ·{' '}
                {entry.buyer}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">{entry.due}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Static, genuine React rendering of the factory dashboard used as a product
 * preview on the landing page. It is not interactive and uses sample data only.
 */
export function DashboardMock() {
  return (
    <div className="flex min-h-[520px] bg-canvas" aria-hidden="true">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <Waves className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ink">Everest Mills</p>
            <p className="truncate text-[10px] text-muted">
              Manufacturing System
            </p>
          </div>
        </div>
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {DEMO_DASHBOARD_NAV.map((item) => {
              const Icon = SIDEBAR_ICONS[item.icon];
              return (
                <li
                  key={item.label}
                  className={cx(
                    'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium',
                    item.active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted',
                  )}
                >
                  {item.active ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-accent"
                    />
                  ) : null}
                  <Icon className="size-4" />
                  {item.label}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
          <div className="hidden flex-1 items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-muted sm:flex">
            <Search className="size-3.5" />
            Search orders, rolls, materials…
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <Info aria-hidden className="size-3 text-primary" />
            Sample data
          </span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            ET
          </span>
        </div>

        <div className="flex-1 space-y-4 p-4 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display text-lg font-bold text-ink">
                Dashboard
              </p>
              <p className="text-xs text-muted">
                Factory overview · inventory, production, dispatch
              </p>
            </div>
            <span className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
              Shift A · Morning
            </span>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <li
                  key={kpi.id}
                  className="rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-muted">
                      {kpi.label}
                    </p>
                    <span
                      className={cx(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        KPI_ACCENT[kpi.tone],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <p className="mt-2 font-display text-xl font-bold text-ink">
                    {kpi.value}
                  </p>
                  <p
                    className={cx(
                      'mt-1 inline-flex items-center gap-1 text-[11px] font-medium',
                      kpi.deltaTone,
                    )}
                  >
                    {kpi.delta}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="grid gap-4 lg:grid-cols-3">
            <ProductionChart />
            <MachineStatusChart />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <RecentActivities />
            <LowStockAlerts />
            <OrderDeadlines />
          </div>
        </div>
      </div>
    </div>
  );
}
