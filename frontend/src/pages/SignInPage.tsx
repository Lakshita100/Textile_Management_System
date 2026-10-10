import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, Loader2 } from 'lucide-react';
import { buttonClass } from '../components/ui/Button';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import AuthPageShell from '../components/auth/AuthPageShell';
import { useAuth } from '../store/AuthProvider';
import { homePathForUser } from '../services/authService';
import { errorMessage } from '../services/http';

interface FormErrors {
  identifier?: string;
  password?: string;
}

export default function SignInPage() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? homePathForUser(user)} replace />;
  }

  async function handleGoogleCredential(credential: string) {
    try {
      const account = await signInWithGoogle(credential);
      navigate(homePathForUser(account), { replace: true });
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!identifier.trim()) nextErrors.identifier = 'Enter your employee/admin ID or buyer email.';
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const account = await signIn(identifier.trim(), password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homePathForUser(account), { replace: true });
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      eyebrow="FACTORY WORKSPACE"
      heading="Welcome back to Everest."
      description="Sign in to manage textile operations, production and order progress from one connected workspace."
    >
            <h1 className="font-display text-2xl font-extrabold text-ink">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted">
              Access your Everest Textile Mills factory workspace.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-ink"
                >
                  Employee / Admin ID or buyer email
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  aria-invalid={errors.identifier ? true : undefined}
                  aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                  placeholder="EMP-000123 or name@company.com"
                />
                {errors.identifier ? (
                  <p
                    id="identifier-error"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error"
                  >
                    <CircleAlert aria-hidden className="size-3.5" />
                    {errors.identifier}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                  placeholder="Enter your password"
                />
                {errors.password ? (
                  <p
                    id="password-error"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error"
                  >
                    <CircleAlert aria-hidden className="size-3.5" />
                    {errors.password}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p className="flex items-start gap-2.5 rounded-lg border border-error/40 bg-error/5 p-3 text-xs leading-relaxed text-error">
                  <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={buttonClass('primary', 'md', 'h-12 w-full text-base disabled:opacity-60')}
              >
                {submitting ? (
                  <>
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or buyer sign-in<span className="h-px flex-1 bg-line" /></div>
            <GoogleSignInButton onCredential={handleGoogleCredential} />

            <div className="mt-5 flex items-center justify-between text-xs text-muted">
              <Link to="/forgot-password" className="font-medium text-primary">
                Forgot password?
              </Link>
              <Link to="/login" className="font-medium text-primary">
                Buyer portal
              </Link>
            </div>
          <p className="mt-6 text-center text-xs text-muted">
            No account yet?{' '}
            <Link to="/signup" className="font-semibold text-primary">
              Create one
            </Link>{' '}
            — buyer accounts can self-register; employee and administrator IDs are
            assigned by the factory administrator.
          </p>
    </AuthPageShell>
  );
}
