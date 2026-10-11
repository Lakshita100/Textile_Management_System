import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productionApi, machinesApi, apiErrorMessage } from '../services/api';
import { getInspectionCounts } from '../services/qualityService';
import { useInspectionForm } from '../store/inspectionFormContext';
import type { Job, MachineListItem, Page } from '../types';
import type { InspectionCount } from '../types/quality';
import { EmptyState, ErrorAlert, Loading, PageHeader, ProgressBar, StatusBadge, SuccessAlert } from '../components/ui';

const FILTERS = ['', 'PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED'];
const INSPECTABLE_STATUSES = ['IN_PROGRESS', 'PAUSED', 'COMPLETED'];

export default function JobsPage() {
  const { openForm } = useInspectionForm();
  const [searchParams] = useSearchParams();
  const focusJob = Number(searchParams.get('job')) || null;
  const [data, setData] = useState<Page<Job> | null>(null);
  const [machines, setMachines] = useState<MachineListItem[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [machinesError, setMachinesError] = useState('');
  const [quality, setQuality] = useState<Record<number, InspectionCount>>({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<number, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ machine_id: '', order_ref: '', material_spec: '', required_process: 'WEAVING', planned_quantity: '' });

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      productionApi.jobs({ status: status || undefined, page_size: 50 }),
      getInspectionCounts().catch(() => [] as InspectionCount[]),
    ])
      .then(([j, inspections]) => {
        setData(j);
        setQuality(Object.fromEntries(inspections.map((inspection) => [inspection.jobId, inspection])));
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (!showForm || machines.length > 0) return;
    setMachinesLoading(true);
    setMachinesError('');
    machinesApi.list({ page_size: 100 })
      .then((result) => setMachines(result.items))
      .catch((e) => setMachinesError(apiErrorMessage(e)))
      .finally(() => setMachinesLoading(false));
  }, [showForm, machines.length]);

  function retryLoad() {
    setData(null);
    load();
  }

  async function act(job: Job, action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel') {
    try {
      if (action === 'complete') {
        const entered = qty[job.id]?.trim();
        const actualQuantity = entered ? Number(entered) : job.actual_quantity;
        if (!Number.isFinite(actualQuantity) || actualQuantity <= 0) {
          setError(`Enter the actual output for job #${job.id} before completing it.`);
          return;
        }
        if (actualQuantity !== job.actual_quantity) {
          await productionApi.progress(job.id, actualQuantity);
        }
      }
      await productionApi.act(job.id, action);
      setNotice(`Job #${job.id} → ${action}`);
      load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }

  async function saveProgress(job: Job) {
    const v = Number(qty[job.id] ?? '');
    if (Number.isNaN(v)) return;
    try {
      await productionApi.progress(job.id, v);
      setNotice(`Job #${job.id} progress saved: ${v}`);
      load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }

  async function createJob() {
    try {
      await productionApi.createJob({
        machine_id: Number(form.machine_id),
        order_ref: form.order_ref,
        material_spec: form.material_spec,
        required_process: form.required_process,
        planned_quantity: Number(form.planned_quantity),
      });
      setNotice('Job created');
      setShowForm(false);
      setForm({ machine_id: '', order_ref: '', material_spec: '', required_process: 'WEAVING', planned_quantity: '' });
      load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader title="Production Board" subtitle="Jobs, lifecycle transitions and quantity tracking">
        <button className="btn-primary text-sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : 'New job'}
        </button>
      </PageHeader>
      {notice && <div className="mb-4"><SuccessAlert message={notice} /></div>}
      {error && data && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {showForm && (
        <div className="card p-4 mb-4 grid md:grid-cols-5 gap-3 text-sm">
          <select className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })} aria-label="Machine">
            <option value="">{machinesLoading ? 'Loading machines…' : 'Select machine'}</option>
            {machines.map((m) => <option key={m.id} value={m.id}>{m.code} ({m.status})</option>)}
          </select>
          <input className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} placeholder="Order ref" value={form.order_ref} onChange={(e) => setForm({ ...form, order_ref: e.target.value })} />
          <input className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} placeholder="Material spec" value={form.material_spec} onChange={(e) => setForm({ ...form, material_spec: e.target.value })} />
          <input className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} placeholder="Process" value={form.required_process} onChange={(e) => setForm({ ...form, required_process: e.target.value })} />
          <div className="flex gap-2">
            <input className="border rounded px-2 py-2 w-24" style={{ borderColor: 'var(--color-border)' }} placeholder="Qty" value={form.planned_quantity} onChange={(e) => setForm({ ...form, planned_quantity: e.target.value })} />
            <button className="btn-accent text-sm px-3" onClick={createJob}>Create</button>
          </div>
          {machinesError && <p className="text-xs col-span-full" role="alert" style={{ color: 'var(--color-heading)' }}>{machinesError}</p>}
        </div>
      )}

      <div className="card p-3 mb-4 flex items-center gap-3 text-sm">
        <label htmlFor="job-status">Status filter:</label>
        <select id="job-status" className="border rounded px-2 py-1" style={{ borderColor: 'var(--color-border)' }} value={status} onChange={(e) => setStatus(e.target.value)}>
          {FILTERS.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
        </select>
      </div>

      {focusJob ? (
        <div className="card mb-4 flex items-center justify-between gap-3 px-4 py-2 text-sm" role="status">
          <span>Linked from Quality: production job <span className="font-semibold">#{focusJob}</span></span>
          <Link to={`/quality/inspections?job=${focusJob}`} className="font-medium text-action">View its inspections</Link>
        </div>
      ) : null}

      {loading ? (
        <Loading />
      ) : error && !data ? (
        <div className="card p-5 flex flex-col items-start gap-3">
          <ErrorAlert message={error} />
          <button className="btn-secondary text-sm" onClick={retryLoad}>Retry</button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No jobs" hint="Create a job or approve a machine recommendation." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header text-left">
                <th className="p-3">#</th><th className="p-3">Order</th><th className="p-3">Machine</th>
                <th className="p-3">Process</th><th className="p-3">Status</th><th className="p-3">Quality</th>
                <th className="p-3">Planned window</th>
                <th className="p-3 w-36">Progress</th><th className="p-3">Update qty</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((j) => {
                const inspected = quality[j.id]?.count ?? 0;
                const canInspect = INSPECTABLE_STATUSES.includes(j.status) && j.actual_quantity > 0;
                const enteredQuantity = qty[j.id]?.trim();
                const completionQuantity = enteredQuantity ? Number(enteredQuantity) : j.actual_quantity;
                const canComplete = Number.isFinite(completionQuantity) && completionQuantity > 0;
                return (
                <tr key={j.id} className={`border-t ${focusJob === j.id ? 'bg-panel' : ''}`} style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3">{j.id}</td>
                  <td className="p-3">{j.order_ref}</td>
                  <td className="p-3">#{j.machine_id}</td>
                  <td className="p-3">{j.required_process}</td>
                  <td className="p-3"><StatusBadge status={j.status} /></td>
                  <td className="p-3 text-xs">
                    {inspected > 0 ? (
                      <Link to={`/quality/inspections?job=${j.id}`} className="text-action hover:underline">
                        {inspected} inspection{inspected === 1 ? '' : 's'}
                      </Link>
                    ) : canInspect ? (
                      <button type="button" onClick={() => openForm(String(j.machine_id))} className="btn-secondary text-xs px-2 py-1">Inspect</button>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {j.planned_start
                      ? <>{new Date(j.planned_start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          <div className="muted">→ {j.planned_end ? new Date(j.planned_end).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div></>
                      : <span className="muted">—</span>}
                  </td>
                  <td className="p-3">
                    <ProgressBar percent={j.completion_percent} />
                    <span className="text-xs muted">{j.actual_quantity}/{j.planned_quantity} {j.quantity_unit}</span>
                  </td>
                  <td className="p-3">
                    {['IN_PROGRESS', 'PAUSED'].includes(j.status) ? (
                      <div className="flex gap-1">
                        <input
                          className="border rounded px-2 py-1 w-20 text-xs"
                          style={{ borderColor: 'var(--color-border)' }}
                          placeholder={String(j.planned_quantity)}
                          value={qty[j.id] ?? ''}
                          onChange={(e) => setQty({ ...qty, [j.id]: e.target.value })}
                          aria-label={`Actual quantity for job ${j.id}`}
                        />
                        <button className="btn-secondary text-xs px-2" onClick={() => saveProgress(j)}>Save</button>
                      </div>
                    ) : <span className="text-xs muted">—</span>}
                  </td>
                  <td className="p-3 flex flex-wrap gap-1">
                    {j.status === 'PLANNED' && <button className="btn-primary text-xs px-2 py-1" onClick={() => act(j, 'start')}>Start</button>}
                    {j.status === 'IN_PROGRESS' && <button className="btn-secondary text-xs px-2 py-1" onClick={() => act(j, 'pause')}>Pause</button>}
                    {j.status === 'PAUSED' && <button className="btn-primary text-xs px-2 py-1" onClick={() => act(j, 'resume')}>Resume</button>}
                    {['IN_PROGRESS', 'PAUSED'].includes(j.status) && (
                      <button
                        className="btn-accent text-xs px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => act(j, 'complete')}
                        disabled={!canComplete}
                        title={canComplete ? 'Save output and complete this job' : 'Enter actual output before completing'}
                      >Complete</button>
                    )}
                    {['IN_PROGRESS', 'PAUSED'].includes(j.status) && !canComplete && <span className="self-center text-xs muted">Enter actual output to complete</span>}
                    {['PLANNED', 'IN_PROGRESS', 'PAUSED'].includes(j.status) && <button className="btn-secondary text-xs px-2 py-1" onClick={() => act(j, 'cancel')}>Cancel</button>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
