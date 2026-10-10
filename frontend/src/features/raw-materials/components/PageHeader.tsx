import { Download, Plus } from 'lucide-react';

interface PageHeaderProps {
  onAddYarn: () => void;
  /** Optional server-side CSV export trigger. */
  onExportCsv?: () => void;
  exporting?: boolean;
}

export default function PageHeader({ onAddYarn, onExportCsv, exporting = false }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between sm:pb-8">
      <div className="min-w-0">
        <h1 className="text-[2.5rem] font-light leading-none tracking-[-0.06em] text-slate-800 sm:text-[3.4rem]">
          Yarn Inventory
        </h1>
        <p className="mt-3 text-base text-slate-500 sm:text-[1.05rem]">
          Manage yarn stock, specifications and inventory availability
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-3">
          {onExportCsv ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              onClick={onExportCsv}
              disabled={exporting}
            >
              <Download size={18} aria-hidden />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          ) : null}

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a6db5] px-5 py-3 text-base font-semibold text-white shadow-[0_8px_20px_rgba(10,109,181,0.2)] transition hover:bg-[#095d9a]"
            onClick={onAddYarn}
          >
            <Plus size={22} aria-hidden />
            Add Yarn
          </button>
        </div>
        <p className="text-sm text-slate-500">Saved automatically after every change</p>
      </div>
    </header>
  );
}
