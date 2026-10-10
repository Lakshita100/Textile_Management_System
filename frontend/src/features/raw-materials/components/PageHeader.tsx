import { Download, Plus } from 'lucide-react';

interface PageHeaderProps {
  onAddYarn: () => void;
  /** Optional server-side CSV export trigger. */
  onExportCsv?: () => void;
  exporting?: boolean;
}

export default function PageHeader({ onAddYarn, onExportCsv, exporting = false }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-[var(--color-heading)] sm:text-3xl">Yarn Inventory</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-muted)] sm:text-base">
          Manage yarn stock, specifications and inventory availability
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
        <div className="flex flex-wrap gap-2">
          {onExportCsv ? (
            <button type="button" className="btn-secondary" onClick={onExportCsv} disabled={exporting}>
              <Download size={18} aria-hidden />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          ) : null}
          <button type="button" className="btn-primary" onClick={onAddYarn}>
            <Plus size={18} aria-hidden />
            Add Yarn
          </button>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Saved automatically after every change</p>
      </div>
    </header>
  );
}
