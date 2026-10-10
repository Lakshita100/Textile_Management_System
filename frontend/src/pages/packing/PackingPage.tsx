import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { packStatusTone } from '../../components/ui/badgeTone'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews'
import { useAsync } from '../../hooks/useAsync'
import { getPackingBundle } from '../../services/packingService'
import type { PackStatus } from '../../types/packing'

const STATUS_FILTERS: Array<{ label: string; value: PackStatus | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Packed', value: 'Packed' },
  { label: 'In warehouse', value: 'In warehouse' },
  { label: 'Dispatched', value: 'Dispatched' },
]

export default function PackingPage() {
  const [status, setStatus] = useState<PackStatus | undefined>(undefined)
  const bundle = useAsync(() => getPackingBundle(status), [status])
  const b = bundle.data

  return (
    <div>
      <PageHeader title="Packing" />

      {bundle.loading ? (
        <LoadingState label="Loading packing data..." />
      ) : bundle.error ? (
        <ErrorState message={bundle.error} onRetry={bundle.reload} />
      ) : b ? (
        <>
          <section aria-label="Packing metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Lots packed" value={String(b.stats.totalLots)} hint="Rolls / bales / boxes" />
            <StatCard
              label="Metres packed"
              value={b.stats.totalMeters.toLocaleString('en-IN')}
              hint={`Across ${b.stats.totalCartons} cartons`}
            />
            <StatCard
              label="Pending packing"
              value={String(b.stats.pendingPacking)}
              hint={`${b.stats.inWarehouse} ready in warehouse`}
            />
            <StatCard label="Dispatched lots" value={String(b.stats.dispatched)} hint="Already shipped out" />
          </section>

          <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setStatus(f.value)}
                className={status === f.value ? 'btn-primary px-3 py-1.5' : 'btn-secondary px-3 py-1.5'}
                aria-pressed={status === f.value}
              >
                {f.label}
              </button>
            ))}
          </div>

          <section className="card mt-4 min-w-0 overflow-hidden" aria-label="Packed lots">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold text-title">Packed lots</h2>
              <p className="text-sm muted">
                {b.lots.length} lot{b.lots.length === 1 ? '' : 's'}
              </p>
            </div>
            {b.lots.length === 0 ? (
              <EmptyState title="No packed lots match this filter" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel">
                      <th className="table-header px-4 py-2 text-left">Lot</th>
                      <th className="table-header px-4 py-2 text-left">Roll</th>
                      <th className="table-header px-4 py-2 text-left">Batch</th>
                      <th className="table-header px-4 py-2 text-left">Order</th>
                      <th className="table-header px-4 py-2 text-left">Machine</th>
                      <th className="table-header px-4 py-2 text-right">Metres</th>
                      <th className="table-header px-4 py-2 text-left">Pack</th>
                      <th className="table-header px-4 py-2 text-right">Cartons</th>
                      <th className="table-header px-4 py-2 text-left">Packed at</th>
                      <th className="table-header px-4 py-2 text-left">Packed by</th>
                      <th className="table-header px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.lots.map((lot) => (
                      <tr key={lot.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-2 font-medium text-title">{lot.id}</td>
                        <td className="px-4 py-2">{lot.rollId}</td>
                        <td className="px-4 py-2">{lot.batchNo}</td>
                        <td className="px-4 py-2">{lot.orderId}</td>
                        <td className="px-4 py-2">{lot.machineId}</td>
                        <td className="px-4 py-2 text-right">{lot.qtyMeters.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2">{lot.packType}</td>
                        <td className="px-4 py-2 text-right">{lot.cartons}</td>
                        <td className="px-4 py-2">{lot.packedAt}</td>
                        <td className="px-4 py-2">{lot.packedBy}</td>
                        <td className="px-4 py-2">
                          <StatusBadge label={lot.status} tone={packStatusTone(lot.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
