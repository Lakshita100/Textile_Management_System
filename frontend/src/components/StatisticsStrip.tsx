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

const ACCENT_CLASSES = {
  package: 'bg-primary/10 text-primary',
  clipboard: 'bg-primary/10 text-primary',
  cog: 'bg-primary/10 text-primary',
  waves: 'bg-primary/10 text-primary',
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
      className="border-b border-line bg-surface"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_STATS.map((stat) => {
            const Icon = STAT_ICONS[stat.icon];
            const IndicatorIcon = INDICATOR_ICONS[stat.indicator.icon];
            return (
              <li
                key={stat.id}
                className="flex items-start gap-4 bg-surface p-6"
              >
                <span
                  aria-hidden
                  className={cx(
                    'flex size-12 shrink-0 items-center justify-center rounded-lg',
                    ACCENT_CLASSES[stat.icon],
                  )}
                >
                  <Icon className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold tracking-tight text-ink">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{stat.label}</p>
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
