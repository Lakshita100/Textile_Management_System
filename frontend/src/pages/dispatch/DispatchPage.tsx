import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { packStatusTone } from '../../components/ui/badgeTone'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews'
import { useAsync } from '../../hooks/useAsync'
import { getDispatchBundle } from '../../services/dispatchService'
import type { ShipmentStatus } from '../../types/dispatch'

const axisProps = { stroke: 'var(--color-text)', fontSize: 12, tickLine: false } as const
const tooltipStyle = {
  background: 'var(--color-background)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)',
} as const

type GroupTab = 'country' | 'state' | 'city'

const TABS: Array<{ key: GroupTab; label: string }> = [
  { key: 'country', label: 'Country-wise' },
  { key: 'state', label: 'State-wise' },
  { key: 'city', label: 'City-wise' },
]

const STATUS_FILTERS: Array<{ label: string; value: ShipmentStatus | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Booked', value: 'Booked' },
  { label: 'In transit', value: 'In transit' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Delayed', value: 'Delayed' },
]

export default function DispatchPage() {
  const [tab, setTab] = useState<GroupTab>('country')
  const [status, setStatus] = useState<ShipmentStatus | undefined>(undefined)
  const bundle = useAsync(() => getDispatchBundle(status), [status])
  const b = bundle.data

  const rows = b ? (tab === 'country' ? b.byCountry : tab === 'state' ? b.byState : b.byCity) : []

  return (
    <div>
      <PageHeader title="Dispatch" />

      {bundle.loading ? (
        <LoadingState label="Loading dispatch data..." />
      ) : bundle.error ? (
        <ErrorState message={bundle.error} onRetry={bundle.reload} />
      ) : b ? (
        <>
          <section aria-label="Dispatch metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Shipments"
              value={String(b.stats.totalShipments)}
              hint={`${b.stats.totalRolls} rolls`}
            />
            <StatCard
              label="Metres dispatched"
              value={b.stats.totalMeters.toLocaleString('en-IN')}
              hint="Across all destinations"
            />
            <StatCard
              label="Delivery rate"
              value={`${b.stats.deliveredPct}%`}
              hint={`${b.stats.inTransit} in transit`}
            />
            <StatCard
              label="Destinations"
              value={`${b.stats.countries} countries`}
              hint={`${b.stats.states} regions / ${b.stats.cities} cities`}
            />
          </section>

          <section className="card mt-5 min-w-0 p-4" aria-label="Dispatch analytics">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-title">Dispatch analytics</h2>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics grouping">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={tab === t.key ? 'btn-primary px-3 py-1.5' : 'btn-secondary px-3 py-1.5'}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {rows.length > 0 ? (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" {...axisProps} />
                      <YAxis type="category" dataKey="key" {...axisProps} width={110} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-surface)' }} />
                      <Bar dataKey="meters" name="Metres" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-panel">
                        <th className="table-header px-4 py-2 text-left">{TABS.find((t) => t.key === tab)?.label.replace('-wise', '')}</th>
                        <th className="table-header px-4 py-2 text-right">Shipments</th>
                        <th className="table-header px-4 py-2 text-right">Rolls</th>
                        <th className="table-header px-4 py-2 text-right">Metres</th>
                        <th className="table-header px-4 py-2 text-right">Delivered</th>
                        <th className="table-header px-4 py-2 text-right">In transit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.key} className="border-b border-line last:border-b-0">
                          <td className="px-4 py-2 font-medium text-title">{row.key}</td>
                          <td className="px-4 py-2 text-right">{row.shipments}</td>
                          <td className="px-4 py-2 text-right">{row.rolls}</td>
                          <td className="px-4 py-2 text-right">{row.meters.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2 text-right">{row.delivered}</td>
                          <td className="px-4 py-2 text-right">{row.inTransit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState title="No dispatch data yet" />
            )}
          </section>

          <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter shipments by status">
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

          <section className="card mt-4 min-w-0 overflow-hidden" aria-label="Shipments">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold text-title">Shipments</h2>
              <p className="text-sm muted">
                {b.shipments.length} shipment{b.shipments.length === 1 ? '' : 's'}
              </p>
            </div>
            {b.shipments.length === 0 ? (
              <EmptyState title="No shipments match this filter" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel">
                      <th className="table-header px-4 py-2 text-left">Shipment</th>
                      <th className="table-header px-4 py-2 text-left">Order</th>
                      <th className="table-header px-4 py-2 text-left">Customer</th>
                      <th className="table-header px-4 py-2 text-left">Country</th>
                      <th className="table-header px-4 py-2 text-left">State / region</th>
                      <th className="table-header px-4 py-2 text-left">City</th>
                      <th className="table-header px-4 py-2 text-right">Rolls</th>
                      <th className="table-header px-4 py-2 text-right">Metres</th>
                      <th className="table-header px-4 py-2 text-left">Dispatched</th>
                      <th className="table-header px-4 py-2 text-left">Courier</th>
                      <th className="table-header px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.shipments.map((s) => (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-2 font-medium text-title">{s.id}</td>
                        <td className="px-4 py-2">{s.orderId}</td>
                        <td className="px-4 py-2">{s.customer}</td>
                        <td className="px-4 py-2">{s.country}</td>
                        <td className="px-4 py-2">{s.state}</td>
                        <td className="px-4 py-2">{s.city}</td>
                        <td className="px-4 py-2 text-right">{s.rolls}</td>
                        <td className="px-4 py-2 text-right">{s.meters.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2">{s.dispatchDate}</td>
                        <td className="px-4 py-2">{s.courier}</td>
                        <td className="px-4 py-2">
                          <StatusBadge label={s.status} tone={packStatusTone(s.status)} />
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
