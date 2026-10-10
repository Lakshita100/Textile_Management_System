import {
  ClipboardList,
  Factory,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { DEMO_FEATURES } from '../constants/demoData';
import { cx } from '../utils/cx';

const FEATURE_ICONS = {
  package: Package,
  factory: Factory,
  shield: ShieldCheck,
  clipboard: ClipboardList,
  truck: Truck,
  users: Users,
} as const;

export function FeaturesSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-canvas py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal">
          <SectionHeading
            eyebrow="The Platform"
            title="Everything Your Textile Factory Needs, In One Place"
            description="Manage inventory, production, quality, dispatch, and factory operations through one connected platform."
          />
        </div>

        <div className="reveal">
          <div
            id="features"
            className="mt-12 scroll-mt-28 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3"
          >
          {DEMO_FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.icon];
            return (
              <article
                key={feature.id}
                className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 shadow-card"
              >
                <span
                  aria-hidden
                  className={cx(
                    'flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </article>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
