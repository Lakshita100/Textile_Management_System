import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck2, CircleAlert, Clock3, LogIn, LogOut, Loader2 } from 'lucide-react';
import { http, errorMessage } from '../services/http';
import { useAuth } from '../store/AuthProvider';

interface AttendanceRecord {
  id: number;
  user_id: number;
  employee_name: string;
  login_id: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
}

function formatTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const admin = user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mine = await http.get<AttendanceRecord | null>('/attendance/me');
      setToday(mine);
      if (admin) setRecords(await http.get<AttendanceRecord[]>('/attendance/records'));
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => { void load(); }, [load]);

  async function punch(kind: 'check-in' | 'check-out') {
    setBusy(true);
    try {
      setToday(await http.post<AttendanceRecord>(`/attendance/${kind}`));
      setError('');
      if (admin) setRecords(await http.get<AttendanceRecord[]>('/attendance/records'));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Workday</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Attendance</h1>
        <p className="mt-2 text-sm text-muted">Check in when your shift starts and check out when it ends. Your attendance is recorded against your employee account.</p>
      </header>

      {error ? <div role="alert" className="flex gap-2 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><CircleAlert className="size-4 shrink-0" />{error}</div> : null}

      <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm text-muted">Today · {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
            <div className="mt-3 flex flex-wrap gap-6 text-sm">
              <p className="inline-flex items-center gap-2 text-ink"><LogIn className="size-4 text-success" />Check-in <strong>{formatTime(today?.check_in_at)}</strong></p>
              <p className="inline-flex items-center gap-2 text-ink"><LogOut className="size-4 text-primary" />Check-out <strong>{formatTime(today?.check_out_at)}</strong></p>
            </div>
          </div>
          <div className="flex gap-3">
            {!today ? <button type="button" disabled={busy || loading} onClick={() => void punch('check-in')} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}Check in</button> : null}
            {today && !today.check_out_at ? <button type="button" disabled={busy || loading} onClick={() => void punch('check-out')} className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink hover:border-primary disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}Check out</button> : null}
            {today?.check_out_at ? <span className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-semibold text-success"><CalendarCheck2 className="size-4" />Day complete</span> : null}
          </div>
        </div>
      </section>

      {admin ? <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="border-b border-line p-5"><h2 className="text-lg font-semibold text-ink">Attendance register</h2><p className="mt-1 text-sm text-muted">Latest employee check-ins. Records are shown in India Standard Time.</p></div>
        {loading ? <p className="p-5 text-sm text-muted">Loading attendance…</p> : records.length === 0 ? <p className="p-5 text-sm text-muted">No attendance entries have been recorded yet.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-canvas text-muted"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Check-in</th><th className="px-4 py-3">Check-out</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-line">{records.map((record) => <tr key={record.id}><td className="px-4 py-3"><span className="font-semibold text-ink">{record.employee_name}</span><span className="ml-2 font-mono text-xs text-muted">{record.login_id}</span></td><td className="px-4 py-3">{record.work_date}</td><td className="px-4 py-3">{formatTime(record.check_in_at)}</td><td className="px-4 py-3">{formatTime(record.check_out_at)}</td><td className="px-4 py-3">{record.check_out_at ? 'Complete' : 'On shift'}</td></tr>)}</tbody></table></div>}
      </section> : null}
      {!loading && !today ? <p className="inline-flex items-center gap-2 text-xs text-muted"><Clock3 className="size-3.5" />No check-in recorded for today yet.</p> : null}
    </div>
  );
}
