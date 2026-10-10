import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { machinesApi, schedulingApi, apiErrorMessage } from '../services/api';
import type { MachineDetail, MachineTimelineOut, StatusEvent } from '../types';
import { ErrorAlert, Loading, PageHeader, ProgressBar, StatusBadge } from '../components/ui';

export default function MachineDetailPage() {
  const { id } = useParams();
  const [machine, setMachine] = useState<MachineDetail | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [timeline, setTimeline] = useState<MachineTimelineOut | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mid = Number(id);
    Promise.all([machinesApi.get(mid), machinesApi.statusEvents(mid), schedulingApi.machineTimeline(mid)])
      .then(([m, e, t]) => {
        setMachine(m);
        setEvents(e);
        setTimeline(t);
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;
  if (!machine) return null;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtMin = (v: number) => (v >= 90 ? `${(v / 60).toFixed(1)} h` : `${Math.round(v)} min`);

  return (
    <div>
      <PageHeader title={`${machine.code} — ${machine.name}`} subtitle={`Machine #${machine.id} · ${machine.machine_type}`}>
        <Link to="/app/machines" className="btn-secondary text-sm">← Back to machines</Link>
      </PageHeader>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold" style={{ color: 'var(--color-heading)' }}>Specifications</h2>
          <dl className="text-sm grid grid-cols-2 gap-2">
            <dt className="muted">Status</dt><dd><StatusBadge status={machine.status} /> {machine.status_reason && <span className="text-xs muted ml-1">({machine.status_reason})</span>}</dd>
            <dt className="muted">Processes</dt><dd>{machine.supported_processes || '—'}</dd>
            <dt className="muted">Materials</dt><dd>{machine.compatible_materials || '—'}</dd>
            <dt className="muted">Capacity</dt><dd>{machine.capacity_value} {machine.capacity_unit}</dd>
            <dt className="muted">Assignable</dt><dd>{machine.available_for_assignment ? 'Yes' : 'No (committed or maintenance)'}</dd>
            <dt className="muted">Efficiency</dt><dd>{machine.efficiency_percent != null ? 'loaded' : 'unknown — no completed jobs'}</dd>
          </dl>
        </div>
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold" style={{ color: 'var(--color-heading)' }}>Current assignment</h2>
          {machine.current_assignment ? (
            <dl className="text-sm grid grid-cols-2 gap-2">
              <dt className="muted">Order</dt><dd>{machine.current_assignment.order_ref}</dd>
              <dt className="muted">Material</dt><dd>{machine.current_assignment.material_spec}</dd>
              <dt className="muted">Process</dt><dd>{machine.current_assignment.required_process}</dd>
              <dt className="muted">Status</dt><dd><StatusBadge status={machine.current_assignment.status} /></dd>
              <dt className="muted">Quantity</dt><dd>{machine.current_assignment.actual_quantity} / {machine.current_assignment.planned_quantity} {machine.current_assignment.quantity_unit}</dd>
              <dt className="muted">Progress</dt>
              <dd className="col-span-2"><ProgressBar percent={machine.current_assignment.completion_percent} /></dd>
            </dl>
          ) : (
            <p className="text-sm muted">No active assignment.</p>
          )}
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-baseline gap-3 mb-3">
          <h2 className="font-semibold" style={{ color: 'var(--color-heading)' }}>Schedule timeline (14-day horizon)</h2>
          {timeline && (
            <span className="text-xs muted">
              next available {fmt(timeline.next_available_at)}
              {timeline.open_downtime_count > 0 && ` · ${timeline.open_downtime_count} open downtime (end unknown)`}
            </span>
          )}
        </div>
        {!timeline || timeline.busy_intervals.length === 0 ? (
          <p className="text-sm muted">No committed jobs in the horizon — machine is free (fixture/development data).</p>
        ) : (
          <ul className="text-sm divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {timeline.busy_intervals.map((iv) => (
              <li key={`${iv.kind}-${iv.job_id}`} className="py-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={iv.kind === 'active_job' ? 'IN_PROGRESS' : 'PLANNED'} />
                <span className="font-medium">{iv.order_ref}</span>
                <span className="text-xs muted">
                  {iv.kind === 'active_job' ? 'active (est. remainder)' : 'planned'} ·
                  {' '}{fmt(iv.start)} → {fmt(iv.end)} · {fmtMin(iv.minutes)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {timeline && timeline.warnings.length > 0 && (
          <ul className="text-xs muted list-disc pl-5 mt-2">
            {timeline.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
        {timeline && timeline.assumptions.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs muted cursor-pointer">Assumptions</summary>
            <ul className="text-xs muted list-disc pl-5 mt-1">
              {timeline.assumptions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </details>
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Status history</h2>
        {events.length === 0 ? (
          <p className="text-sm muted">No status events recorded.</p>
        ) : (
          <ul className="text-sm divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {events.map((e) => (
              <li key={e.id} className="py-2 flex flex-wrap items-center gap-2">
                <span className="text-xs muted">{new Date(e.created_at).toLocaleString()}</span>
                <StatusBadge status={e.from_status ?? '—'} />
                <span className="muted">→</span>
                <StatusBadge status={e.to_status} />
                {e.reason && <span className="text-xs muted">— {e.reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
