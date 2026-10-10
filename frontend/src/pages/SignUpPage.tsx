import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '../components/Logo';
import { buttonClass } from '../components/ui/Button';
import { useAuth } from '../store/AuthProvider';
import type { AuthRole } from '../services/authService';
import { errorMessage } from '../services/http';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  company?: string;
  phone?: string;
}

const homeForRole = (role: AuthRole): string =>
  role === 'admin' ? '/admin' : role === 'buyer' ? '/buyer' : '/dashboard';

/**
 * Real account creation — POST /api/v1/auth/register.
 * Reached from every "Get Started" call-to-action on the landing page.
 */
export default function SignUpPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'staff'>('buyer');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!fullName.trim()) nextErrors.fullName = 'Enter your full name.';
    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }
    if (role === 'buyer' && !company.trim()) {
      nextErrors.company = 'Enter your company name.';
    }
    if (phone.trim() && !/^\+?[0-9\s-]{7,}$/.test(phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const account = await register({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        role,
        ...(company.trim() ? { company: company.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      navigate(homeForRole(account.role), { replace: true });
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Everest Textile Mills — home">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
            <h1 className="font-display text-2xl font-extrabold text-ink">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-muted">
              Register to place orders (buyer) or run the factory workspace
              (staff). Admin accounts are provisioned separately.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              <fieldset>
                <legend className="block text-sm font-medium text-ink">
                  Account type
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    aria-pressed={role === 'buyer'}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      role === 'buyer'
                        ? 'border-primary bg-primary/5 text-ink'
                        : 'border-line bg-surface text-muted hover:border-primary/40'
                    }`}
                  >
                    <span className="block font-semibold text-ink">Buyer</span>
                    <span className="mt-0.5 block text-xs">
                      Place and track yarn orders.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    aria-pressed={role === 'staff'}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      role === 'staff'
                        ? 'border-primary bg-primary/5 text-ink'
                        : 'border-line bg-surface text-muted hover:border-primary/40'
                    }`}
                  >
                    <span className="block font-semibold text-ink">Staff</span>
                    <span className="mt-0.5 block text-xs">
                      Factory floor &amp; admin staff.
                    </span>
                  </button>
                </div>
              </fieldset>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-ink">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  aria-invalid={errors.fullName ? true : undefined}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                  placeholder="Your full name"
                />
                {errors.fullName ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error">
                    <CircleAlert aria-hidden className="size-3.5" />
                    {errors.fullName}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-ink">
                  Email address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                  placeholder="name@company.com"
                />
                {errors.email ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error">
                    <CircleAlert aria-hidden className="size-3.5" />
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ink">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={errors.password ? true : undefined}
                      className="h-11 w-full rounded-lg border border-line bg-surface px-3 pr-11 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error">
                      <CircleAlert aria-hidden className="size-3.5" />
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={errors.confirmPassword ? true : undefined}
                    className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                    placeholder="Repeat password"
                  />
                  {errors.confirmPassword ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error">
                      <CircleAlert aria-hidden className="size-3.5" />
                      {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-ink">
                    Company {role === 'buyer' ? '' : '(optional)'}
                  </label>
                  <input
                    id="company"
                    name="company"
                    autoComplete="organization"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    aria-invalid={errors.company ? true : undefined}
                    className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                    placeholder="Company name"
                  />
                  {errors.company ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error">
                      <CircleAlert aria-hidden className="size-3.5" />
                      {errors.company}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-ink">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    aria-invalid={errors.phone ? true : undefined}
                    className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error">
                      <CircleAlert aria-hidden className="size-3.5" />
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
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
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link to="/signin" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
