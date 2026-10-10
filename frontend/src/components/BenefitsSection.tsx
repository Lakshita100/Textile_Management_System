import { CircleCheck, Gauge, PackageSearch, ScanLine, Wallet } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { DEMO_BENEFITS } from '../constants/demoData';

const BENEFIT_ICONS = {
  gauge: Gauge,
  'package-search': PackageSearch,
  scan: ScanLine,
  wallet: Wallet,
} as const;

export function BenefitsSection() {
  return (
    <section id="benefits" className="scroll-mt-24 bg-canvas py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="reveal">
            <div className="relative">
              <img
                src="/images/finished-goods-inspection.jpg"
                alt="Factory worker wearing protective clothing inspecting finished textile goods on the production floor"
                className="aspect-4/3 w-full rounded-2xl border border-line object-cover"
                loading="lazy"
                decoding="async"
              />
              <div
                aria-hidden
                className="absolute -bottom-4 -right-4 hidden rounded-xl border border-line bg-surface px-5 py-4 shadow-elevated sm:block"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  End-to-end
                </p>
                <p className="mt-1 font-display text-sm font-bold text-ink">
                  Yarn receipt → delivery
                </p>
              </div>
            </div>
          </div>

          <div className="reveal">
            <SectionHeading
              align="left"
              eyebrow="Why It Matters"
              title="Built to Make Textile Operations Simpler"
              description="Practical gains for the people running the factory every day — no inflated promises, just clearer information."
            />

            <ul className="mt-8 space-y-6">
              {DEMO_BENEFITS.map((benefit) => {
                const Icon = BENEFIT_ICONS[benefit.icon];
                return (
                  <li key={benefit.id} className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-ink">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {benefit.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-muted">
              <CircleCheck aria-hidden className="size-4 text-accent" />
              Designed around real factory workflows, not generic templates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
