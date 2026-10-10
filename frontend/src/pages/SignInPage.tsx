import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CircleAlert, Info } from 'lucide-react';
import { Logo } from '../components/Logo';
import { buttonClass } from '../components/ui/Button';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Enter your work email address.';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setStatus(
        'This preview build is not connected to an authentication service yet — your credentials were not sent anywhere. Sign-in will work once the backend API is connected.',
      );
    } else {
      setStatus(null);
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

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
            <h1 className="font-display text-2xl font-extrabold text-ink">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted">
              Access your Everest Textile Mills factory workspace.
            </p>

            <p className="mt-5 flex items-start gap-2.5 rounded-lg border border-line bg-canvas p-3 text-xs leading-relaxed text-muted">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              Authentication is not connected in this preview build. The form
              below demonstrates the intended sign-in flow only.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink"
                >
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30"
                  placeholder="name@factory.com"
                />
                {errors.email ? (
                  <p
                    id="email-error"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-error"
                  >
                    <CircleAlert aria-hidden className="size-3.5" />
                    {errors.email}
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

              <button
                type="submit"
                className={buttonClass('primary', 'md', 'h-12 w-full text-base')}
              >
                Sign In
              </button>
            </form>

            <div aria-live="polite" className="mt-5">
              {status ? (
                <p className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-ink">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  {status}
                </p>
              ) : null}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Don't have an account yet? Factory workspaces are created by your
            administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
