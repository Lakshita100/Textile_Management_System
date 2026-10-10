import {
  Calculator,
  ClipboardList,
  Factory,
  PackagePlus,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { DEMO_WORKFLOW } from '../constants/demoData';

const STEP_ICONS = {
  'package-plus': PackagePlus,
  clipboard: ClipboardList,
  factory: Factory,
  shield: ShieldCheck,
  truck: Truck,
  calculator: Calculator,
} as const;

export function WorkflowSection() {
  return (
    <section id="solutions" className="scroll-mt-24 bg-canvas py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal">
          <SectionHeading
            eyebrow="How It Works"
            title="From Raw Material to Ready-to-Ship Fabric"
            description="One connected workflow covering the complete journey of every order through your factory."
          />
        </div>

        <div className="reveal">
          <ol className="mt-14 space-y-8 lg:mt-16 lg:grid lg:grid-cols-6 lg:gap-5 lg:space-y-0">
            {DEMO_WORKFLOW.map((step, index) => {
              const Icon = STEP_ICONS[step.icon];
              const isLast = index === DEMO_WORKFLOW.length - 1;
              return (
                <li
                  key={step.id}
                  className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
                >
                  {!isLast ? (
                    <span
                      aria-hidden
                      className="absolute left-6 top-14 h-[calc(100%-2rem)] w-px bg-line lg:left-1/2 lg:top-7 lg:h-px lg:w-full"
                    />
                  ) : null}
                  <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-primary shadow-card">
                    <Icon aria-hidden className="size-5" />
                  </div>
                  <div className="min-w-0 lg:mt-4 lg:px-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
