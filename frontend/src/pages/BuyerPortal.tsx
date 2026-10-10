import { useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  ClipboardCheck,
  Factory,
  MapPin,
  Package,
  Search,
  Settings,
  Truck,
} from 'lucide-react'
import { buttonClass } from '../components/ui/Button'
import { useAuth } from '../store/AuthProvider'
import {
  createInquiryForOrder,
  addBuyerOrderResponse,
  getCurrentSession,
  getInquiriesForBuyer,
  getOrderById,
  getOrdersForBuyer,
  updateBuyerProfile,
} from '../services/orderService'

const navItems = [
  { to: '/buyer', label: 'Dashboard', icon: Factory, end: true },
  { to: '/buyer/orders', label: 'My Orders', icon: Package, end: false },
  { to: '/buyer/tracking', label: 'Tracking', icon: Truck, end: false },
  { to: '/buyer/inquiries', label: 'Inquiries', icon: ClipboardCheck, end: false },
  { to: '/buyer/profile', label: 'Profile & Settings', icon: Settings, end: false },
]

function isBuyerLoggedIn() {
  return Boolean(getCurrentSession()?.role === 'buyer')
}

export function BuyerRouteGuard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Checking your session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== 'buyer') {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  if (!isBuyerLoggedIn()) {
    // JWT is valid but portal session not synced yet (e.g. another tab cleared it).
    return <Navigate to="/login" replace />
  }

  return <BuyerPortalLayout />
}

export function BuyerPortalLayout() {
  const session = getCurrentSession()
  const navigate = useNavigate()

  const { signOut } = useAuth()
  const handleLogout = () => {
    void signOut().finally(() => navigate('/login'))
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-line bg-surface lg:w-72 lg:border-b-0 lg:border-r">
          <div className="border-b border-line px-5 py-4">
            <p className="font-display text-xl font-bold text-primary">Everest Buyer Portal</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-muted">Textile procurement</p>
          </div>

          <nav className="flex flex-col gap-1 p-3" aria-label="Buyer navigation">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-canvas hover:text-primary'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-line p-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Signed in</p>
              <p className="mt-2 text-sm font-semibold text-ink">{session?.name ?? 'Buyer'}</p>
              <p className="text-xs text-muted">{session?.companyName ?? 'Company'}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
            <div>
              <p className="text-sm font-medium text-muted">Buyer workspace</p>
              <p className="text-xl font-semibold text-ink">Welcome back</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-xl border border-line bg-canvas p-2 text-muted" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <Link to="/" className="text-sm font-medium text-primary">Back to website</Link>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone = 'primary' }: { label: string; value: string; tone?: 'primary' | 'success' | 'warning' | 'muted' }) {
  const tones = {
    primary: 'bg-primary/5 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    muted: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</div>
      <p className="mt-4 text-2xl font-bold text-ink">{value}</p>
    </div>
  )
}

export function BuyerDashboardPage() {
  const session = getCurrentSession()
  const orders = useMemo(() => getOrdersForBuyer(session?.userId ?? ''), [session])
  const inquiries = useMemo(() => getInquiriesForBuyer(session?.userId ?? ''), [session])

  const metrics = [
    { label: 'Active orders', value: String(orders.length), tone: 'primary' as const },
    { label: 'In production', value: String(orders.filter((order) => order.status === 'In Production').length), tone: 'success' as const },
    { label: 'Due soon', value: String(orders.filter((order) => order.requestedDeliveryDate).length), tone: 'warning' as const },
    { label: 'Open inquiries', value: String(inquiries.filter((inquiry) => inquiry.status !== 'Resolved').length), tone: 'muted' as const },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-gradient-to-r from-primary/10 via-white to-cyan-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Buyer dashboard</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{session?.companyName ?? 'Your textile orders'}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted">Track order progress, inquiries and delivery planning from one place.</p>
          </div>
          <Link to="/buyer/orders/new" className={buttonClass('primary', 'md')}>
            Place a new order
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent orders</h2>
            <Link to="/buyer/orders" className="text-sm font-medium text-primary">View all</Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{order.id}</p>
                    <p className="text-sm text-muted">{order.productName}</p>
                  </div>
                  <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Delivery snapshot</h2>
          <div className="mt-4 space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="rounded-xl bg-canvas p-3">
                <p className="text-sm font-semibold text-ink">{order.id}</p>
                <p className="mt-1 text-xs text-muted">Needed by {order.requestedDeliveryDate}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">{order.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export function BuyerOrdersPage() {
  const session = getCurrentSession()
  const orders = useMemo(() => getOrdersForBuyer(session?.userId ?? ''), [session])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filteredOrders = orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.productName}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'all' || order.status === status
    return matchesQuery && matchesStatus
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Orders</h1>
          <p className="text-sm text-muted">Search, review and keep track of active purchase orders.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/buyer" className={buttonClass('secondary', 'md')}>Back to dashboard</Link>
          <Link to="/buyer/orders/new" className={buttonClass('primary', 'md')}>Place new order</Link>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order ID or product"
              className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm text-ink"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-line bg-canvas px-3 text-sm text-ink">
            <option value="all">All status</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Quotation Sent">Quotation Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="In Production">In Production</option>
            <option value="Ready to Dispatch">Ready to Dispatch</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-canvas text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Requested</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">No orders match your current filters.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-canvas/80">
                    <td className="px-4 py-3 font-medium text-ink">{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{order.productName}</div>
                      <div className="text-xs text-muted">{order.shade}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{order.quantity} {order.unit}</td>
                    <td className="px-4 py-3 text-muted">{order.requestedDeliveryDate}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">{order.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/buyer/orders/${order.id}`} className="text-sm font-semibold text-primary">View details</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export function BuyerOrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [, setRevision] = useState(0)
  const [responseMessage, setResponseMessage] = useState('')
  const [responseError, setResponseError] = useState('')
  const [responseSent, setResponseSent] = useState(false)
  const session = getCurrentSession()
  const selectedOrder = orderId ? getOrderById(orderId) : undefined
  const order = selectedOrder?.buyerId === session?.userId ? selectedOrder : undefined

  if (!order) {
    return <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-muted">Order not found.</div>
  }

  const handleClarificationResponse = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session || !responseMessage.trim()) {
      setResponseError('Enter a response before submitting.')
      return
    }
    const updated = addBuyerOrderResponse(order.id, responseMessage, session.userId)
    if (!updated) {
      setResponseError('We could not match this order to your buyer account.')
      return
    }
    setResponseMessage('')
    setResponseError('')
    setResponseSent(true)
    setRevision((value) => value + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Order details</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">{order.id}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/buyer/inquiries')} className={buttonClass('secondary', 'md')}>Ask a question</button>
          <button type="button" onClick={() => navigate('/buyer/orders')} className={buttonClass('primary', 'md')}>Back to orders</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Product summary</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Product" value={order.productName} />
              <InfoRow label="Product code" value={order.productCode} />
              <InfoRow label="Material" value={order.materialComposition} />
              <InfoRow label="Shade" value={order.shade} />
              <InfoRow label="Quantity" value={`${order.quantity} ${order.unit}`} />
              <InfoRow label="Delivery date" value={order.requestedDeliveryDate} />
              <InfoRow label="Category" value={order.productCategory ?? 'Not provided'} />
              <InfoRow label="Yarn type / subtype" value={`${order.yarnType}${order.yarnSubtype ? ` / ${order.yarnSubtype}` : ''}`} />
              <InfoRow label="Technical specifications" value={order.technicalSpecifications || order.technicalNotes || 'Not provided'} />
              <InfoRow label="Priority" value={order.priority ?? 'Standard'} />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Status timeline</h2>
            <div className="mt-5 space-y-4">
              {order.statusHistory.map((event) => (
                <div key={`${event.status}-${event.timestamp}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
                    <div className="h-full w-px bg-line" />
                  </div>
                  <div className="flex-1 rounded-xl bg-canvas p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-ink">{event.status}</p>
                      <span className="text-xs text-muted">{new Date(event.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{event.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Commercial details</h2>
            <div className="mt-4 space-y-3">
              <InfoRow label="Order source" value={order.source} />
              <InfoRow label="Status" value={order.status} />
              <InfoRow label="Delivery address" value={order.deliveryAddress} />
              <InfoRow label="Target price / quotation" value={order.targetPrice || order.commercialNotes || 'Quotation requested'} />
              <InfoRow label="Buyer notes" value={order.buyerNotes || 'No notes shared'} />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Buyer-visible updates</h2>
            <div className="mt-4 space-y-3">
              {(order.buyerVisibleUpdates ?? []).length === 0
                ? <p className="rounded-xl bg-canvas p-3 text-sm text-muted">No additional messages yet. Internal review notes are not shown here.</p>
                : (order.buyerVisibleUpdates ?? []).map((update, index) => (
                  <div key={`${update.timestamp}-${index}`} className={`rounded-xl p-3 ${update.sender === 'admin' ? 'bg-primary/5' : 'bg-canvas'}`}>
                    <p className="text-xs font-semibold text-ink">{update.sender === 'admin' ? 'Everest Textile Mills' : 'You'} · {new Date(update.timestamp).toLocaleString()}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{update.message}</p>
                  </div>
                ))}
            </div>
            {order.status === 'Clarification Required' ? (
              <form onSubmit={handleClarificationResponse} className="mt-5 space-y-3 border-t border-line pt-4">
                <label className="block text-sm font-medium text-ink" htmlFor="clarification-response">Your response</label>
                <textarea id="clarification-response" required rows={3} value={responseMessage} onChange={(event) => setResponseMessage(event.target.value)} className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" placeholder="Provide the requested details or changes" />
                {responseError ? <p role="alert" className="text-sm text-error">{responseError}</p> : null}
                {responseSent ? <p role="status" className="text-sm font-medium text-success">Response sent. Your order is back under review.</p> : null}
                <div className="flex justify-end"><button type="submit" className={buttonClass('primary', 'md')}>Send response</button></div>
              </form>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Related inquiry</h2>
            <div className="mt-4 rounded-xl bg-canvas p-3 text-sm text-muted">
              Existing inquiries are available in the buyer inquiry center and can be created directly from this order.
            </div>
          </div>
        </div>
      </div>

      {(order.buyerVisibleUpdates ?? []).length > 0 ? (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Updates about this order</h2>
          <div className="mt-4 space-y-3">
            {(order.buyerVisibleUpdates ?? []).map((update, index) => (
              <div key={`${update.timestamp}-${index}`} className={`rounded-xl p-3 ${update.sender === 'admin' ? 'bg-primary/5' : 'bg-canvas'}`}>
                <p className="text-xs font-semibold text-ink">{update.sender === 'admin' ? 'Everest Textile Mills' : 'You'} · {new Date(update.timestamp).toLocaleString()}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{update.message}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export function BuyerTrackingPage() {
  const session = getCurrentSession()
  const orders = useMemo(() => getOrdersForBuyer(session?.userId ?? ''), [session])
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? '')
  const order = orders.find((entry) => entry.id === selectedOrderId) ?? orders[0]

  if (!order) {
    return <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">No tracking data is available yet.</div>
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tracking</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Order progress</h1>
          </div>
          <select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="h-11 rounded-xl border border-line bg-canvas px-3 text-sm text-ink">
            {orders.map((item) => (
              <option key={item.id} value={item.id}>{item.id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted">Currently tracking</p>
            <p className="text-xl font-bold text-ink">{order.productName}</p>
          </div>
          <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">{order.status}</span>
        </div>

        <div className="space-y-4">
          {order.statusHistory.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-3">
              <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{event.status}</p>
                  <span className="text-xs text-muted">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{event.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BuyerProfilePage() {
  const navigate = useNavigate()
  const session = getCurrentSession()
  const buyer = getCurrentSession() ? JSON.parse(localStorage.getItem('everest-buyer-users') || '[]').find((entry: { id: string }) => entry.id === session?.userId) : null
  const [form, setForm] = useState({
    companyName: buyer?.companyName ?? session?.companyName ?? '',
    contactName: buyer?.contactName ?? session?.name ?? '',
    email: buyer?.email ?? session?.email ?? '',
    phone: buyer?.phone ?? '',
    address: buyer?.address ?? '',
    city: buyer?.city ?? '',
    country: buyer?.country ?? '',
  })

  const { signOut } = useAuth()
  const handleLogout = () => {
    void signOut().finally(() => navigate('/login'))
  }

  const handleSave = () => {
    if (!session?.userId) {
      return
    }

    updateBuyerProfile(session.userId, {
      companyName: form.companyName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      country: form.country,
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Profile</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Company & account details</h1>
          </div>
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Active account</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Company profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="input-base" />
            </Field>
            <Field label="Contact person">
              <input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} className="input-base" />
            </Field>
            <Field label="Business email">
              <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input-base" />
            </Field>
            <Field label="Phone number">
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input-base" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="input-base" />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="input-base" />
            </Field>
            <Field label="Country">
              <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="input-base" />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={handleSave} className={buttonClass('primary', 'md')}>Save changes</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Account settings</h2>
            <div className="mt-4 space-y-4 text-sm text-muted">
              <div className="flex items-center justify-between rounded-xl bg-canvas p-3">
                <span>Notification preferences</span>
                <BadgeCheck className="h-4 w-4 text-success" />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-canvas p-3">
                <span>Session management</span>
                <button type="button" onClick={handleLogout} className="font-semibold text-primary">Log out</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Saved delivery addresses</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-ink">Primary address</p>
                    <p className="text-sm text-muted">14 Market Road, Andheri East, Mumbai</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BuyerInquiriesPage() {
  const session = getCurrentSession()
  const buyerId = session?.userId ?? ''
  const inquiries = useMemo(() => getInquiriesForBuyer(buyerId), [buyerId])
  const [subject, setSubject] = useState('')
  const [type, setType] = useState<'Product' | 'Pricing' | 'Delivery' | 'Production' | 'General'>('Product')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!buyerId || !subject.trim() || !message.trim()) {
      return
    }

    createInquiryForOrder(buyerId, 'ORD-2048', subject, type, message)
    setSubject('')
    setMessage('')
    setSubmitted(true)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h1 className="text-2xl font-bold text-ink">Order Inquiries</h1>
        <p className="mt-1 text-sm text-muted">Ask questions related to products, quotations, timing and production updates.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">New inquiry</h2>
          <div className="mt-4 space-y-4">
            <Field label="Subject">
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="input-base" />
            </Field>
            <Field label="Inquiry type">
              <select value={type} onChange={(event) => setType(event.target.value as 'Product' | 'Pricing' | 'Delivery' | 'Production' | 'General')} className="input-base">
                <option value="Product">Product</option>
                <option value="Pricing">Pricing</option>
                <option value="Delivery">Delivery</option>
                <option value="Production">Production</option>
                <option value="General">General</option>
              </select>
            </Field>
            <Field label="Your message">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="input-base min-h-28" />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={buttonClass('secondary', 'md')}>Clear</button>
            <button type="submit" className={buttonClass('primary', 'md')}>Send inquiry</button>
          </div>
          {submitted ? <p className="mt-3 text-sm font-medium text-success">Inquiry submitted successfully.</p> : null}
        </form>

        <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Recent inquiries</h2>
          {inquiries.length === 0 ? (
            <div className="rounded-xl bg-canvas p-6 text-center text-muted">No inquiries yet.</div>
          ) : (
            inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{inquiry.subject}</p>
                    <p className="text-xs text-muted">{inquiry.id} • {inquiry.type}</p>
                  </div>
                  <span className="rounded-full bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary">{inquiry.status}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {inquiry.messages.map((messageItem, index) => (
                    <div key={`${messageItem.timestamp}-${index}`} className={`rounded-lg p-2 text-sm ${messageItem.sender === 'buyer' ? 'bg-canvas' : 'bg-primary/5'}`}>
                      <span className="font-medium text-ink">{messageItem.sender === 'buyer' ? 'You' : 'Admin'}: </span>
                      {messageItem.text}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  )
}

export default BuyerRouteGuard
