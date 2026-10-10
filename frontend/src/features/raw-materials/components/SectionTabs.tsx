import type { LucideIcon } from 'lucide-react';

export interface SectionTab {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Optional count bubble (e.g. open low-stock alerts). */
  badge?: number;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function SectionTabs({ tabs, activeId, onChange }: SectionTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Yarn inventory sections"
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-[var(--color-border)] px-1"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
              selected
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-heading)]'
            }`}
          >
            <Icon size={16} aria-hidden />
            {tab.label}
            {typeof tab.badge === 'number' && tab.badge > 0 ? (
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  selected
                    ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
