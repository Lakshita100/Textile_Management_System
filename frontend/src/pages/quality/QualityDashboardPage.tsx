import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews'
import { useAsync } from '../../hooks/useAsync'
import { useInspectionForm } from '../../store/inspectionFormContext'
import { DEFECT_TYPES, getDashboardBundle } from '../../services/qualityService'

const axisProps = { stroke: 'var(--color-text)', fontSize: 12, tickLine: false } as const
const tooltipStyle = {
  background: 'var(--color-background)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)',
} as const

export default function QualityDashboardPage() {
  const dash = useAsync(getDashboardBundle, [])
  const { openForm } = useInspectionForm()
  const d = dash.data

  return (
    <div>
      <PageHeader
        title="Quality Dashboard"
        actions={
          <button type="button" className="btn-primary" onClick={openForm}>
            New inspection
          </button>
        }
      />

      {dash.loading ? (
        <LoadingState label="Loading quality dashboard..." />
      ) : dash.error ? (
        <ErrorState message={dash.error} onRetry={dash.reload} />
      ) : d ? (
        <>
          <section aria-label="Key quality metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Overall efficiency"
              value={`${d.stats.efficiencyPct}%`}
              hint="Accepted / inspected metres"
            />
            <StatCard
              label="Defect rate"
              value={`${d.stats.defectRatePer100m}`}
              hint="Defects per 100 m inspected"
            />
            <StatCard
              label="Total defects"
              value={String(d.summaries.reduce((s, m) => s + m.totalDefects, 0))}
              hint={`Across ${d.stats.totalInspections} inspections`}
            />
            <StatCard
              label="Machines flagged"
              value={`${d.stats.machinesFlagged} / ${d.summaries.length}`}
              hint="Flagged for investigation"
            />
          </section>

          <section className="card mt-5 min-w-0 p-4" aria-label="Defect rate trend">
            <h2 className="mb-3 text-base font-semibold text-title">Defect rate trend</h2>
            {d.trend.length > 0 ? (
              <figure className="m-0">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={d.trend} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" {...axisProps} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis {...axisProps} width={44} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="defectRatePer100m"
                        name="Defects / 100 m"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--color-primary)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </figure>
            ) : (
              <EmptyState title="No trend data yet" />
            )}
          </section>

          <section className="mt-5" aria-label="Machine focus">
            <h2 className="mb-3 text-lg font-semibold text-title">Machines</h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="card min-w-0 p-4">
                <h3 className="mb-3 text-sm font-semibold text-title">Efficiency by machine</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={d.summaries.map((s) => ({
                        name: s.machine.name,
                        efficiency: s.efficiencyPct,
                        flagged: s.needsInvestigation,
                      }))}
                      layout="vertical"
                      margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" {...axisProps} domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="name" {...axisProps} width={120} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-surface)' }} />
                      <Bar dataKey="efficiency" name="Efficiency %" radius={[0, 4, 4, 0]}>
                        {d.summaries.map((s) => (
                          <Cell
                            key={s.machine.id}
                            fill={s.needsInvestigation ? 'var(--color-heading)' : 'var(--color-accent)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card min-w-0 p-4">
                <h3 className="mb-3 text-sm font-semibold text-title">Defects produced by machine</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={d.summaries.map((s) => ({
                        name: s.machine.name,
                        defects: s.totalDefects,
                        flagged: s.needsInvestigation,
                      }))}
                      layout="vertical"
                      margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" {...axisProps} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" {...axisProps} width={120} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-surface)' }} />
                      <Bar dataKey="defects" name="Defects" radius={[0, 4, 4, 0]}>
                        {d.summaries.map((s) => (
                          <Cell
                            key={s.machine.id}
                            fill={s.needsInvestigation ? 'var(--color-heading)' : 'var(--color-primary)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5" aria-label="Defect focus">
            <h2 className="mb-3 text-lg font-semibold text-title">Defects</h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="card min-w-0 p-4">
                <h3 className="mb-3 text-sm font-semibold text-title">Defects by type</h3>
                {d.byType.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={d.byType} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="type" {...axisProps} interval={0} angle={-18} textAnchor="end" height={56} />
                        <YAxis {...axisProps} width={44} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-surface)' }} />
                        <Bar dataKey="count" name="Defects" radius={[4, 4, 0, 0]}>
                          {d.byType.map((point, index) => (
                            <Cell
                              key={point.type}
                              fill={index === 0 ? 'var(--color-accent)' : 'var(--color-primary)'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState title="No defects recorded" />
                )}
              </div>

              <div className="card min-w-0 overflow-hidden">
                <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-title">
                  Which machine produced which defect
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="table-header px-3 py-2 text-left">Machine</th>
                        {DEFECT_TYPES.map((type) => (
                          <th key={type} className="table-header px-3 py-2 text-right" title={type}>
                            {type}
                          </th>
                        ))}
                        <th className="table-header px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.matrix.map((row) => (
                        <tr key={row.machineId} className="border-b border-line hover:bg-panel">
                          <td className="px-3 py-2 font-medium text-title">{row.machineName}</td>
                          {DEFECT_TYPES.map((type) => (
                            <td key={type} className="px-3 py-2 text-right">
                              {row.counts[type] > 0 ? row.counts[type] : '-'}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-semibold text-title">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-line">
                        <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide muted">Total</td>
                        {DEFECT_TYPES.map((type) => (
                          <td key={type} className="px-3 py-2 text-right font-semibold text-title">
                            {d.matrix.reduce((s, r) => s + (r.counts[type] ?? 0), 0)}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold text-title">
                          {d.matrix.reduce((s, r) => s + r.total, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
