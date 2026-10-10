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

const TONE_CLASSES = {
  primary: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white',
  accent: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white',
} as const;

export function FeaturesSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-canvas py-20 lg:py-28">
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
            className="mt-14 scroll-mt-28 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3"
          >
          {DEMO_FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.icon];
            return (
              <article
                key={feature.id}
                className="group flex flex-col rounded-xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
              >
                <span
                  aria-hidden
                  className={cx(
                    'flex size-11 items-center justify-center rounded-lg transition-colors duration-200',
                    TONE_CLASSES[feature.tone],
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
