import { useEffect, useState } from 'react';
import { CircleAlert, Copy, Loader2, UserPlus } from 'lucide-react';
import type { AuthUser, ProvisionedEmployee } from '../services/authService';
import { createEmployee, listEmployeeAccounts, resetEmployeePassword, updateEmployee } from '../services/authService';
import { errorMessage } from '../services/http';
import { useAuth } from '../store/AuthProvider';

const PERMISSIONS = [
  ['materials', 'Raw materials'],
  ['machines', 'Machines'],
  ['production', 'Production jobs'],
  ['recommendations', 'Scheduling recommendations'],
  ['quality', 'Quality inspections'],
  ['dispatch', 'Dispatch'],
  ['attendance', 'Attendance'],
] as const;

export default function AdminEmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<AuthUser[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<ProvisionedEmployee | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', permissions: [] as string[] });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setEmployees(await listEmployeeAccounts());
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function toggle(list: string[], permission: string) {
    return list.includes(permission) ? list.filter((item) => item !== permission) : [...list, permission];
  }

  async function submitEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError('');
    try {
      const result = await createEmployee({
        full_name: form.full_name.trim(),
        ...(form.email.trim() ? { email: form.email.trim().toLowerCase() } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        permissions: form.permissions,
      });
      setCreated(result);
      setForm({ full_name: '', email: '', phone: '', permissions: [] });
      setEmployees((current) => [...current, result.user]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function saveAccess(employee: AuthUser) {
    setSavingId(employee.id);
    setError('');
    try {
      const updated = await updateEmployee(employee.id, { permissions: drafts[employee.id] ?? employee.permissions });
      setEmployees((items) => items.map((item) => item.id === employee.id ? updated : item));
      setDrafts((current) => {
        const next = { ...current };
        delete next[employee.id];
        return next;
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(employee: AuthUser) {
    setSavingId(employee.id);
    setError('');
    try {
      const updated = await updateEmployee(employee.id, { is_active: !employee.is_active });
      setEmployees((items) => items.map((item) => item.id === employee.id ? updated : item));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  async function resetPassword(employee: AuthUser) {
    setSavingId(employee.id);
    setError('');
    try {
      setCreated(await resetEmployeePassword(employee.id));
      setEmployees((items) => items.map((item) => item.id === employee.id ? { ...item, must_change_password: true } : item));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administrator controls</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Employees &amp; feature access</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Create employee accounts and grant only the factory features they need. New employees receive a unique ID and a temporary password they must change at first sign-in.</p>
      </header>

      <section className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        Your administrator login ID: <strong className="font-mono">{user?.login_id ?? 'Run the latest database migration, then rerun the seed command to print it.'}</strong>
      </section>

      {error ? <div role="alert" className="flex gap-2 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><CircleAlert className="size-4 shrink-0" />{error}</div> : null}

      {created ? (
        <section className="rounded-2xl border border-success/30 bg-success/5 p-5" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-ink">Employee account created</h2>
              <p className="mt-1 text-sm text-muted">Share these credentials with {created.user.full_name}. The temporary password is shown only once.</p>
            </div>
            <button type="button" onClick={() => setCreated(null)} className="text-sm font-medium text-primary">Dismiss</button>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">Employee ID</dt><dd className="mt-1 font-mono font-bold text-ink">{created.user.login_id}</dd></div>
            <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">Temporary password</dt><dd className="mt-1 break-all font-mono font-bold text-ink">{created.temporary_password}</dd></div>
          </dl>
          <button type="button" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" onClick={() => void navigator.clipboard?.writeText(`${created.user.login_id}\n${created.temporary_password}`)}><Copy className="size-4" />Copy credentials</button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink"><UserPlus className="size-5 text-primary" />Add employee</h2>
        <form onSubmit={submitEmployee} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-ink">Full name<input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3" /></label>
            <label className="text-sm font-medium text-ink">Work email (optional)<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3" /></label>
            <label className="text-sm font-medium text-ink">Phone (optional)<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3" /></label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-ink">Feature access</legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {PERMISSIONS.map(([key, label]) => <label key={key} className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={form.permissions.includes(key)} onChange={() => setForm({ ...form, permissions: toggle(form.permissions, key) })} />{label}</label>)}
            </div>
          </fieldset>
          <button type="submit" disabled={creating} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">{creating ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Create employee account</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="border-b border-line p-5"><h2 className="text-lg font-semibold text-ink">Employee accounts</h2><p className="mt-1 text-sm text-muted">Server access updates immediately. Employees may need to refresh to update their navigation.</p></div>
        {loading ? <p className="p-5 text-sm text-muted">Loading employee accounts…</p> : employees.filter((item) => item.role === 'staff').length === 0 ? <p className="p-5 text-sm text-muted">No employee accounts yet.</p> : (
          <div className="divide-y divide-line">
            {employees.filter((item) => item.role === 'staff').map((employee) => {
              const selected = drafts[employee.id] ?? employee.permissions;
              const changed = [...selected].sort().join(',') !== [...employee.permissions].sort().join(',');
              return <article key={employee.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h3 className="font-semibold text-ink">{employee.full_name}</h3><p className="mt-1 text-sm text-muted"><span className="font-mono">{employee.login_id}</span>{employee.email ? ` · ${employee.email}` : ''}</p></div>
                  <div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${employee.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{employee.is_active ? 'Active' : 'Disabled'}</span><button type="button" disabled={savingId === employee.id} onClick={() => void resetPassword(employee)} className="text-sm font-semibold text-primary disabled:opacity-50">Reset password</button><button type="button" disabled={savingId === employee.id} onClick={() => void toggleActive(employee)} className="text-sm font-semibold text-primary disabled:opacity-50">{employee.is_active ? 'Disable account' : 'Enable account'}</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {PERMISSIONS.map(([key, label]) => <label key={key} className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={selected.includes(key)} onChange={() => setDrafts((current) => ({ ...current, [employee.id]: toggle(selected, key) }))} />{label}</label>)}
                </div>
                {changed ? <button type="button" disabled={savingId === employee.id} onClick={() => void saveAccess(employee)} className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50">{savingId === employee.id ? 'Saving…' : 'Save access'}</button> : null}
              </article>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
