import { useState } from 'react';
import { recommendationsApi, apiErrorMessage } from '../services/api';
import type { Recommendation } from '../types';
import { ErrorAlert, Loading, PageHeader, StatusBadge, SuccessAlert } from '../components/ui';

export default function RecommendPage() {
  const [form, setForm] = useState({
    order_ref: 'ORD-DEMO-001',
    required_process: 'WEAVING',
    required_material: 'COTTON',
    required_quantity: '1000',
    deadline: '',
  });
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [approver, setApprover] = useState('Supervisor');

  async function generate() {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const r = await recommendationsApi.generate({
        order_ref: form.order_ref,
        required_process: form.required_process,
        required_material: form.required_material,
        required_quantity: Number(form.required_quantity),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      });
      setRec(r);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!rec) return;
    try {
      const r = await recommendationsApi.approve(rec.id, { decided_by: approver });
      setRec(r);
      setNotice(`Approved — production job #${r.assigned_job_id} created on ${r.recommended_machine_code}`);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader
        title="Machine Recommendations"
        subtitle="Explainable rule-based engine — 0.40×Efficiency + 0.35×Workload + 0.25×Quality (not trained ML)"
      />
      {notice && <div className="mb-4"><SuccessAlert message={notice} /></div>}
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      <div className="card p-4 mb-6 grid md:grid-cols-6 gap-3 text-sm">
        <label className="flex flex-col gap-1">Order ref
          <input className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} value={form.order_ref} onChange={(e) => setForm({ ...form, order_ref: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">Process
          <input className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} value={form.required_process} onChange={(e) => setForm({ ...form, required_process: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">Material
          <input className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} value={form.required_material} onChange={(e) => setForm({ ...form, required_material: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">Quantity
          <input className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} value={form.required_quantity} onChange={(e) => setForm({ ...form, required_quantity: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">Deadline (optional)
          <input type="datetime-local" className="border rounded px-2 py-2" style={{ borderColor: 'var(--color-border)' }} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </label>
        <div className="flex items-end">
          <button className="btn-primary text-sm w-full" onClick={generate} disabled={loading}>
            {loading ? 'Ranking…' : 'Get recommendation'}
          </button>
        </div>
      </div>

      {loading && <Loading />}

      {rec && !loading && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="font-semibold" style={{ color: 'var(--color-heading)' }}>
                {rec.recommended_machine_code
                  ? `Recommended: ${rec.recommended_machine_code}`
                  : 'No eligible machine'}
              </h2>
              <StatusBadge status={rec.decision} />
              <span className="text-xs muted">algorithm {rec.algorithm_version} · rec #{rec.id}</span>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>{rec.explanation}</p>
            <p className="text-sm mb-2">
              <strong>Material:</strong>{' '}
              <span style={{ color: rec.material_available === false ? 'var(--color-heading)' : 'var(--color-accent)' }}>
                {rec.material_note}
              </span>
            </p>
            {rec.warnings.length > 0 && (
              <ul className="text-xs muted list-disc pl-5">
                {rec.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
            {rec.decision === 'PENDING' && rec.recommended_machine_id && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  aria-label="Approver name"
                />
                <button className="btn-accent text-sm" onClick={approve}>Supervisor approval</button>
                <span className="text-xs muted">revalidates material, status &amp; schedule before assigning</span>
              </div>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header text-left">
                  <th className="p-3">Rank</th><th className="p-3">Machine</th><th className="p-3">Eligible</th>
                  <th className="p-3">Score</th><th className="p-3">Efficiency</th><th className="p-3">Workload</th>
                  <th className="p-3">Quality</th><th className="p-3">Est. days</th><th className="p-3">Exclusions</th>
                </tr>
              </thead>
              <tbody>
                {rec.candidates.map((c, i) => (
                  <tr key={c.machine_id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3">{c.eligible ? i + 1 : '—'}</td>
                    <td className="p-3 font-medium">{c.machine_code}<div className="text-xs muted">{c.machine_name}</div></td>
                    <td className="p-3">{c.eligible ? 'Yes' : 'No'}</td>
                    <td className="p-3 font-semibold">{c.score ? c.score.final_score : '—'}</td>
                    <td className="p-3">{c.score ? `${c.score.efficiency}${c.score.efficiency_known ? '%' : '* (unknown)'}` : '—'}</td>
                    <td className="p-3">{c.score ? `${c.score.workload_suitability}` : '—'}</td>
                    <td className="p-3">{c.score ? `${c.score.quality}${c.score.quality_known ? '%' : '* (unknown)'}` : '—'}</td>
                    <td className="p-3">{c.estimated_days ?? '—'}</td>
                    <td className="p-3 text-xs muted">{c.exclusion_reasons.join('; ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="p-3 text-xs muted">* unknown history → neutral {rec.candidates.find((c) => c.score && !c.score.efficiency_known) ? '50' : ''} fallback, never silently perfect. Eligibility always precedes scoring.</p>
          </div>
        </div>
      )}
    </div>
  );
}
