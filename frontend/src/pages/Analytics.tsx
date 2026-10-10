import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { analyticsApi, apiErrorMessage } from '../services/api';
import type { AnalyticsRow } from '../types';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../components/ui';

export default function AnalyticsPage() {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi
      .query({ date_from: from || undefined, date_to: to || undefined })
      .then(setRows)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [from, to]);

  return (
    <div>
      <PageHeader
        title="Machine Analytics"
        subtitle="Planned vs actual output, efficiency, utilization and downtime — computed from persisted jobs only"
      />
      <div className="card p-3 mb-4 flex flex-wrap items-center gap-3 text-sm">
        <label>From <input type="date" className="border rounded px-2 py-1 ml-1" style={{ borderColor: 'var(--color-border)' }} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To <input type="date" className="border rounded px-2 py-1 ml-1" style={{ borderColor: 'var(--color-border)' }} value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <span className="muted text-xs">
          Efficiency = avg completion of completed jobs · Utilization = productive vs planned time · Defect rate shown only from real quality data (none yet)
        </span>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No machines to analyze" />
      ) : (
        <>
          <div className="card p-4 mb-4" style={{ height: 320 }}>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--color-heading)' }}>Planned vs actual quantity</h2>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="machine_code" stroke="var(--color-text)" fontSize={12} />
                <YAxis stroke="var(--color-text)" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="planned_quantity" name="Planned" fill="var(--color-primary)" />
                <Bar dataKey="actual_quantity" name="Actual" fill="var(--color-accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header text-left">
                  <th className="p-3">Machine</th><th className="p-3">Jobs</th><th className="p-3">Completed</th>
                  <th className="p-3">Planned</th><th className="p-3">Actual</th><th className="p-3">Completion %</th>
                  <th className="p-3">Efficiency %</th><th className="p-3">Utilization %</th>
                  <th className="p-3">Downtime (min)</th><th className="p-3">Defect rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.machine_id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3 font-medium">{r.machine_code}<div className="text-xs muted">{r.machine_name}</div></td>
                    <td className="p-3">{r.job_count}</td>
                    <td className="p-3">{r.completed_jobs}</td>
                    <td className="p-3">{r.planned_quantity}</td>
                    <td className="p-3">{r.actual_quantity}</td>
                    <td className="p-3">{r.completion_percent}%</td>
                    <td className="p-3">{r.efficiency_percent ?? <span className="muted text-xs">n/a</span>}</td>
                    <td className="p-3">{r.utilization_percent ?? <span className="muted text-xs">n/a</span>}</td>
                    <td className="p-3">{r.downtime_minutes}{Object.keys(r.downtime_reasons).length > 0 && <div className="text-xs muted">{Object.entries(r.downtime_reasons).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>}</td>
                    <td className="p-3 text-xs muted">{r.defect_rate_percent ?? r.defect_note ?? 'n/a'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
