import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../store/AuthProvider';
import { errorMessage } from '../services/http';
import { homePathForUser } from '../services/authService';

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/signin" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 12) return setError('Use at least 12 characters for your new password.');
    if (newPassword !== confirmPassword) return setError('The new passwords do not match.');
    setBusy(true);
    try {
      const updated = await changePassword(currentPassword, newPassword);
      navigate(homePathForUser(updated), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
    <section className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-card">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="size-5" /></div>
      <h1 className="mt-5 font-display text-2xl font-bold text-ink">Set a new password</h1>
      <p className="mt-2 text-sm text-muted">Your administrator issued a temporary password. Change it before opening your assigned features.</p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-ink">Temporary password<input required autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3" /></label>
        <label className="block text-sm font-medium text-ink">New password<input required minLength={12} autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3" /></label>
        <label className="block text-sm font-medium text-ink">Confirm new password<input required minLength={12} autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3" /></label>
        {error ? <p role="alert" className="flex gap-2 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p> : null}
        <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : null}Save new password</button>
      </form>
    </section>
  </main>;
}
