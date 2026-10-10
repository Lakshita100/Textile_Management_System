import { Lock } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { DashboardMock } from './dashboard/DashboardMock';

export function DashboardPreview() {
  return (
    <section id="dashboard" className="scroll-mt-24 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal">
          <SectionHeading
            eyebrow="Product Preview"
            title="Your Factory. One Clear View."
            description="Preview a consolidated view of inventory, production, machine availability, order progress, and dispatch operations."
          />
        </div>

        <div className="reveal">
          <p className="sr-only">
            The preview below shows a factory dashboard containing raw material
            stock, active orders, machine status, daily production charts,
            recent factory activities, low-stock alerts and upcoming order
            deadlines. All figures are sample demonstration data.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-elevated">
            <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-line" />
                <span className="size-2.5 rounded-full bg-line" />
                <span className="size-2.5 rounded-full bg-line" />
              </span>
              <span className="mx-auto flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1 text-[11px] font-medium text-muted">
                <Lock aria-hidden className="size-3" />
                Textile Manufacturing System — dashboard preview
              </span>
              <span aria-hidden className="hidden w-12 sm:block" />
            </div>
            <DashboardMock />
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Interface preview rendered with sample demonstration data — not a
            live system.
          </p>
        </div>
      </div>
    </section>
  );
}
