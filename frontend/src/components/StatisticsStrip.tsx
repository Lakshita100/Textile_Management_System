import {
  Activity,
  ClipboardList,
  Cog,
  Package,
  TriangleAlert,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { DEMO_STATS } from '../constants/demoData';
import type { StatTone } from '../constants/demoData';
import { cx } from '../utils/cx';

const STAT_ICONS = {
  package: Package,
  clipboard: ClipboardList,
  cog: Cog,
  waves: Waves,
} as const;

const INDICATOR_ICONS = {
  trend: TrendingUp,
  alert: TriangleAlert,
  activity: Activity,
} as const;

const TONE_CLASSES: Record<StatTone, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-primary',
  warning: 'text-warning',
};

export function StatisticsStrip() {
  return (
    <section
      aria-label="Sample operational statistics"
      className="bg-white border-y border-line"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <ul className="grid gap-0 overflow-hidden lg:grid-cols-4">
          {DEMO_STATS.map((stat) => {
            const Icon = STAT_ICONS[stat.icon];
            const IndicatorIcon = INDICATOR_ICONS[stat.indicator.icon];
            return (
              <li
                key={stat.id}
                className="flex items-start gap-4 bg-white p-6 border-r border-line/50 lg:border-r last:border-r-0"
              >
                <span
                  aria-hidden
                  className={cx(
                    'flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
                  )}
                >
                  <Icon className="size-5.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold tracking-tight text-ink">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                  <p
                    className={cx(
                      'mt-2 inline-flex items-center gap-1.5 text-xs font-medium',
                      TONE_CLASSES[stat.indicator.tone],
                    )}
                  >
                    <IndicatorIcon aria-hidden className="size-3.5" />
                    {stat.indicator.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-xs text-muted">
          Illustrative sample data for demonstration — not live factory figures.
        </p>
      </div>
    </section>
  );
}
