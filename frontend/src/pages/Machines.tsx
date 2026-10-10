import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { machinesApi, apiErrorMessage } from '../services/api';
import type { MachineListItem, Page } from '../types';
import { EmptyState, ErrorAlert, Loading, PageHeader, ProgressBar, StatusBadge } from '../components/ui';

const STATUSES = ['', 'RUNNING', 'IDLE', 'MAINTENANCE'];

export default function MachinesPage() {
  const [data, setData] = useState<Page<MachineListItem> | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [process, setProcess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    machinesApi
      .list({ search: search || undefined, status: status || undefined, process: process || undefined, page_size: 50 })
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [search, status, process]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function changeStatus(m: MachineListItem, newStatus: string) {
    const reason = newStatus === 'MAINTENANCE' ? window.prompt('Maintenance reason:') : null;
    if (newStatus === 'MAINTENANCE' && !reason) return;
    try {
      await machinesApi.changeStatus(m.id, newStatus, reason || undefined);
      setStatusMsg(`${m.code} → ${newStatus}`);
      load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader title="Machines" subtitle="Overview, search, filters and status control" />
      {statusMsg && <div className="card p-3 mb-4 text-sm" style={{ borderColor: 'var(--color-accent)' }}>{statusMsg}</div>}
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input
          className="border rounded px-3 py-2 text-sm flex-1 min-w-40"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="Search by code or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search machines"
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <input
          className="border rounded px-3 py-2 text-sm w-40"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="Process (e.g. WEAVING)"
          value={process}
          onChange={(e) => setProcess(e.target.value)}
          aria-label="Filter by process"
        />
      </div>

      {loading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No machines match" hint="Clear filters or add machines via the API." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header text-left">
                <th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Type</th>
                <th className="p-3">Processes</th><th className="p-3">Capacity</th><th className="p-3">Status</th>
                <th className="p-3">Assignment</th><th className="p-3">Efficiency</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr key={m.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3 font-medium"><Link to={`/machines/${m.id}`} style={{ color: 'var(--color-link)' }}>{m.code}</Link></td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">{m.machine_type}</td>
                  <td className="p-3 text-xs">{m.supported_processes}</td>
                  <td className="p-3">{m.capacity_value} <span className="muted text-xs">{m.capacity_unit}</span></td>
                  <td className="p-3"><StatusBadge status={m.status} /></td>
                  <td className="p-3 min-w-40">
                    {m.current_assignment ? (
                      <div>
                        <span className="text-xs">{m.current_assignment.order_ref}</span>
                        <ProgressBar percent={m.current_assignment.completion_percent} />
                      </div>
                    ) : (
                      <span className="text-xs muted">— {m.available_for_assignment ? '(available)' : ''}</span>
                    )}
                  </td>
                  <td className="p-3">{m.efficiency_percent != null ? `${m.efficiency_percent}%` : <span className="text-xs muted">unknown</span>}</td>
                  <td className="p-3">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      style={{ borderColor: 'var(--color-border)' }}
                      value=""
                      onChange={(e) => e.target.value && changeStatus(m, e.target.value)}
                      aria-label={`Change status for ${m.code}`}
                    >
                      <option value="">Set status…</option>
                      {STATUSES.filter((s) => s && s !== m.status).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-xs muted">Showing {data.items.length} of {data.total} machines</p>
        </div>
      )}
    </div>
  );
}
