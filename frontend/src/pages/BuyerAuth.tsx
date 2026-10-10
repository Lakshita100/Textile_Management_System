import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Info } from 'lucide-react'
import { buttonClass } from '../components/ui/Button'
import { demoCredentials, getCurrentSession, registerBuyer, signInDemo } from '../services/orderService'

export function BuyerLoginPage() {
  const navigate = useNavigate()
  const currentSession = getCurrentSession()
  const [email, setEmail] = useState(demoCredentials.buyer.email)
  const [password, setPassword] = useState(demoCredentials.buyer.password)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: { email?: string; password?: string; form?: string } = {}

    if (!email.trim()) nextErrors.email = 'Please provide your work email.'
    if (!password) nextErrors.password = 'Please provide your password.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const user = signInDemo(email, password)
    if (!user) {
      setErrors({ form: 'Invalid email or password. Use the demo buyer or admin credentials below.' })
      return
    }

    navigate(user.role === 'admin' ? '/admin' : '/buyer')
  }

  if (currentSession) {
    return <Navigate to={currentSession.role === 'admin' ? '/admin' : '/buyer'} replace />
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-elevated lg:grid-cols-2">
          <div className="bg-gradient-to-br from-primary to-sky-900 p-8 text-white">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/90">
              <ArrowLeft className="h-4 w-4" /> Back to website
            </Link>
            <div className="mt-12">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Buyer portal</p>
              <h1 className="mt-3 font-display text-4xl font-extrabold">Place orders with confidence.</h1>
              <p className="mt-4 max-w-md text-sm text-white/80">
                Track your material requirements, review status changes and continue communication with Everest Textile Mills.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/80">
              <p className="font-semibold text-white">Demo account</p>
              <p className="mt-2">Buyer: {demoCredentials.buyer.email}</p>
              <p>Password: {demoCredentials.buyer.password}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink">Buyer login</h2>
              <Link to="/signup" className="text-sm font-semibold text-primary">Create account</Link>
            </div>

            <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted">
              <Info className="mr-2 inline h-4 w-4 text-primary" />
              Demo-only authentication is included for local workflow validation.
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

              <button type="submit" className={buttonClass('primary', 'lg', 'w-full')}>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BuyerSignupPage() {
  const navigate = useNavigate()
  const currentSession = getCurrentSession()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    country: '',
    website: '',
    businessRegistration: '',
    consent: false,
  })

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (!form.companyName.trim()) nextErrors.companyName = 'Company name is required.'
    if (!form.contactName.trim()) nextErrors.contactName = 'Contact name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Use a valid business email.'
    if (!/^\+?[0-9\s-]{7,}$/.test(form.phone)) nextErrors.phone = 'Use a valid phone number with country code.'
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords must match.'
    if (!form.address.trim()) nextErrors.address = 'Business address is required.'
    if (!form.city.trim()) nextErrors.city = 'City is required.'
    if (!form.country.trim()) nextErrors.country = 'Country is required.'
    if (!form.consent) nextErrors.consent = 'You must consent before creating an account.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      registerBuyer({
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        address: form.address,
        city: form.city,
        country: form.country,
        website: form.website,
        businessRegistration: form.businessRegistration,
      })
      navigate('/buyer')
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Registration failed. Please try again.' })
    }
  }

  if (currentSession) {
    return <Navigate to={currentSession.role === 'admin' ? '/admin' : '/buyer'} replace />
  }

  return (
    <div className="flex min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-line bg-surface p-6 shadow-elevated sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Buyer registration</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Create your buyer account</h1>
          </div>
          <Link to="/login" className="text-sm font-semibold text-primary">Already have an account?</Link>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-line bg-canvas p-3 text-xs text-muted">
            <Info className="h-4 w-4 text-primary" />
            We only ask for order essentials during signup; product details are collected when placing an order.
          </div>

          <Field label="Company name" error={errors.companyName}>
            <input value={form.companyName} onChange={(event) => handleChange('companyName', event.target.value)} className="input-base" />
          </Field>
          <Field label="Contact person" error={errors.contactName}>
            <input value={form.contactName} onChange={(event) => handleChange('contactName', event.target.value)} className="input-base" />
          </Field>

          <Field label="Business email" error={errors.email}>
            <input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} className="input-base" />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} className="input-base" />
          </Field>

          <Field label="Password" error={errors.password}>
            <PasswordInput value={form.password} show={showPassword} onToggle={() => setShowPassword((value) => !value)} onChange={(value) => handleChange('password', value)} />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword}>
            <PasswordInput value={form.confirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} onChange={(value) => handleChange('confirmPassword', value)} />
          </Field>

          <Field label="Business address" error={errors.address} className="md:col-span-2">
            <input value={form.address} onChange={(event) => handleChange('address', event.target.value)} className="input-base" />
          </Field>
          <Field label="City" error={errors.city}>
            <input value={form.city} onChange={(event) => handleChange('city', event.target.value)} className="input-base" />
          </Field>
          <Field label="Country" error={errors.country}>
            <input value={form.country} onChange={(event) => handleChange('country', event.target.value)} className="input-base" />
          </Field>

          <Field label="Website (optional)">
            <input value={form.website} onChange={(event) => handleChange('website', event.target.value)} className="input-base" />
          </Field>
          <Field label="Business registration details (optional)">
            <input value={form.businessRegistration} onChange={(event) => handleChange('businessRegistration', event.target.value)} className="input-base" />
          </Field>

          <div className="md:col-span-2">
            <label className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-3 text-sm text-muted">
              <input type="checkbox" checked={form.consent} onChange={(event) => handleChange('consent', event.target.checked)} className="mt-1 h-4 w-4 rounded border-line" />
              <span>I agree to the terms and understand that my company details will be used for order and account management.</span>
            </label>
            {errors.consent ? <p className="mt-2 text-xs font-medium text-error">{errors.consent}</p> : null}
          </div>

          {errors.form ? <p className="md:col-span-2 rounded-xl border border-error/40 bg-error/5 p-3 text-xs font-medium text-error">{errors.form}</p> : null}

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link to="/" className={buttonClass('secondary', 'md')}>Back to website</Link>
            <button type="submit" className={buttonClass('primary', 'md')}>Create account</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-error">{error}</span> : null}
    </label>
  )
}

function PasswordInput({ value, show, onToggle, onChange }: { value: string; show: boolean; onToggle: () => void; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} className="input-base pr-11" />
      <button type="button" onClick={onToggle} aria-label="Toggle password visibility" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
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
