import { Briefcase, Factory, Settings, ShieldCheck } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { DEMO_ROLES } from '../constants/demoData';

const ROLE_ICONS = {
  settings: Settings,
  factory: Factory,
  shield: ShieldCheck,
  briefcase: Briefcase,
} as const;

export function RolesSection() {
  return (
    <section id="roles" className="scroll-mt-24 bg-surface py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal">
          <SectionHeading
            eyebrow="Built for Every Team"
            title="The Right Tools for Every Team"
            description="Different people on the factory floor need different views. The platform is designed around the way each team actually works."
          />
        </div>

        <div className="reveal">
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {DEMO_ROLES.map((role) => {
              const Icon = ROLE_ICONS[role.icon];
              return (
                <li
                  key={role.id}
                  className="h-full rounded-xl border border-line bg-surface p-6 shadow-card"
                >
                  <span
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-full border border-line bg-canvas text-primary"
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-base font-bold text-ink">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {role.description}
                  </p>
                </li>
              );
            })}
          </ul>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted">
            These role descriptions outline the intended platform capabilities.
            Role-specific portals are not yet available in this demo build.
          </p>
        </div>
      </div>
    </section>
  );
}
