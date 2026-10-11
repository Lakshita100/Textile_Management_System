import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { buttonClass } from '../components/ui/Button'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import AuthPageShell from '../components/auth/AuthPageShell'
import { getCurrentSession } from '../services/orderService'
import { useAuth } from '../store/AuthProvider'
import { errorMessage } from '../services/http'
import { homePathForUser } from '../services/authService'

export function BuyerLoginPage() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle, user, loading } = useAuth()
  const currentSession = getCurrentSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: { email?: string; password?: string; form?: string } = {}

    if (!email.trim()) nextErrors.email = 'Please provide your work email.'
    if (!password) nextErrors.password = 'Please provide your password.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const account = await signIn(email.trim().toLowerCase(), password)
      navigate(homePathForUser(account), { replace: true })
    } catch (error) {
      setErrors({ form: errorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleCredential = async (credential: string) => {
    try {
      const account = await signInWithGoogle(credential)
      navigate(homePathForUser(account), { replace: true })
    } catch (error) {
      setErrors({ form: errorMessage(error) })
    }
  }

  if (!loading && user) {
    return <Navigate to={homePathForUser(user)} replace />
  }
  if (!loading && !user && currentSession && currentSession.role === 'buyer') {
    // Legacy portal session without a backend token — send them to re-auth.
    return <Navigate to="/signin" replace />
  }

  return (
    <AuthPageShell
      eyebrow="BUYER PORTAL"
      heading="Place orders with confidence."
      description="Track your material requirements, review status changes and stay connected with Everest Textile Mills."
    >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink">Buyer login</h2>
              <Link to="/signup" className="text-sm font-semibold text-primary">Create account</Link>
            </div>

            <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted">
              <Info className="mr-2 inline h-4 w-4 text-primary" />
              Credentials are verified against the backend account service (JWT sessions).
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">Business email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
                  placeholder="name@company.com"
                />
                {errors.email ? <p className="mt-1 text-xs font-medium text-error">{errors.email}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-canvas px-3 pr-11 text-sm text-ink"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1 text-xs font-medium text-error">{errors.password}</p> : null}
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="font-medium text-primary">Forgot password?</Link>
                <span className="text-muted">Need access? Ask your sales team.</span>
              </div>

              {errors.form ? <p className="rounded-xl border border-error/40 bg-error/5 p-3 text-xs font-medium text-error">{errors.form}</p> : null}

              <button type="submit" disabled={submitting} className={buttonClass('primary', 'lg', 'w-full disabled:opacity-60')}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or buyer sign-in<span className="h-px flex-1 bg-line" /></div>
            <GoogleSignInButton onCredential={handleGoogleCredential} />
    </AuthPageShell>
  )
}

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl border border-line bg-surface p-8 shadow-elevated">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Password reset</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">Reset your password</h1>
        <p className="mt-3 text-sm text-muted">We will send reset instructions to the email associated with your buyer account.</p>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-ink">Business email</label>
          <input type="email" className="input-base" placeholder="company@example.com" />
        </div>
        <button type="button" className={`${buttonClass('primary', 'md')} mt-5 w-full`}>
          Send reset link
        </button>
      </div>
    </div>
  )
}

export function BuyerAuthReady() {
  return <div />
}
