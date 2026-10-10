import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { machinesApi, apiErrorMessage } from '../services/api';
import type { MachineDetail, StatusEvent } from '../types';
import { ErrorAlert, Loading, PageHeader, ProgressBar, StatusBadge } from '../components/ui';

export default function MachineDetailPage() {
  const { id } = useParams();
  const [machine, setMachine] = useState<MachineDetail | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mid = Number(id);
    Promise.all([machinesApi.get(mid), machinesApi.statusEvents(mid)])
      .then(([m, e]) => {
        setMachine(m);
        setEvents(e);
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;
  if (!machine) return null;

  return (
    <div>
      <PageHeader title={`${machine.code} — ${machine.name}`} subtitle={`Machine #${machine.id} · ${machine.machine_type}`}>
        <Link to="/machines" className="btn-secondary text-sm">← Back to machines</Link>
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
