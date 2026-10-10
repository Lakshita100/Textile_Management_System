import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Factory, Activity, AlertTriangle, PackageCheck } from 'lucide-react';
import { productionApi, apiErrorMessage } from '../services/api';
import type { Dashboard as DashboardData, Job } from '../types';
import { ErrorAlert, KpiCard, Loading, ProgressBar, StatusBadge, PageHeader, EmptyState } from '../components/ui';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productionApi.dashboard(), productionApi.jobs({ page_size: 8 })])
      .then(([d, j]) => {
        setData(d);
        setJobs(j.items);
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <PageHeader title="Production Dashboard" subtitle="Machine overview and live production snapshot" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total machines" value={data?.total_machines ?? 0} hint={<span className="inline-flex items-center gap-1"><Factory className="h-3 w-3" /> registered</span>} />
        <KpiCard label="Running" value={data?.running ?? 0} hint="operational status" />
        <KpiCard label="Idle" value={data?.idle ?? 0} hint="available or unassigned" />
        <KpiCard label="Maintenance" value={data?.maintenance ?? 0} hint="out of service" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active jobs" value={data?.active_jobs ?? 0} hint={<span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" /> in progress or paused</span>} />
        <KpiCard label="Completed jobs" value={data?.completed_jobs ?? 0} hint={<span className="inline-flex items-center gap-1"><PackageCheck className="h-3 w-3" /> all time</span>} />
        <KpiCard label="Delayed jobs" value={data?.delayed_jobs ?? 0} hint={<span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> past planned end</span>} />
        <KpiCard label="Output today" value={(data?.output_today ?? 0).toLocaleString()} hint="units recorded today" />
      </div>

      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Recent jobs</h2>
      {jobs.length === 0 ? (
        <EmptyState title="No production jobs yet" hint="Create a job from the Production Board or approve a recommendation." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header text-left">
                <th className="p-3">Job</th><th className="p-3">Order</th><th className="p-3">Machine</th>
                <th className="p-3">Status</th><th className="p-3 w-40">Progress</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3"><Link to={`/app/jobs`} style={{ color: 'var(--color-link)' }}>#{j.id}</Link></td>
                  <td className="p-3">{j.order_ref}</td>
                  <td className="p-3">#{j.machine_id}</td>
                  <td className="p-3"><StatusBadge status={j.status} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar percent={j.completion_percent} />
                      <span className="text-xs muted whitespace-nowrap">{j.actual_quantity}/{j.planned_quantity}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
