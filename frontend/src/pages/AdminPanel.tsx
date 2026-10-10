import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { buttonClass } from '../components/ui/Button'
import { useAuth } from '../store/AuthProvider'
import {
  addOrderReviewNote,
  getAdminOverview,
  getAllInquiries,
  getAllOrders,
  getCurrentSession,
  getMaterialAvailability,
  recordDemoMaterialAvailability,
  recordOrderReviewAction,
  respondToInquiry,
  updateInquiryStatus,
} from '../services/orderService'

const adminNavSections: ReadonlyArray<{
  title: string
  items: ReadonlyArray<{ to: string; label: string; end: boolean }>
}> = [
  {
    title: 'OVERVIEW',
    items: [{ to: '/admin', label: 'Dashboard', end: true }],
  },
  {
    title: 'ORDER MANAGEMENT',
    items: [
      { to: '/admin/incoming', label: 'Incoming Orders', end: false },
      { to: '/admin/orders', label: 'All Orders', end: false },
      { to: '/admin/inquiries', label: 'Order Inquiries', end: false },
    ],
  },
  {
    title: 'INVENTORY & OPERATIONS',
    items: [
      { to: '/admin/materials', label: 'Raw Materials & Inventory', end: false },
      { to: '/admin/suppliers', label: 'Suppliers & Purchases', end: false },
      { to: '/admin/movements', label: 'Stock Movements', end: false },
      { to: '/admin/alerts', label: 'Low-Stock Alerts', end: false },
      { to: '/admin/machines', label: 'Machines', end: false },
      { to: '/admin/jobs', label: 'Production Jobs', end: false },
      { to: '/admin/recommend', label: 'Production Recommendations', end: false },
      { to: '/admin/quality', label: 'Quality Control', end: false },
      { to: '/admin/dispatch', label: 'Packing & Dispatch', end: false },
    ],
  },
]

const adminNav: Array<{ to: string; label: string; end: boolean }> = adminNavSections.flatMap((group) => group.items)

export function AdminRouteGuard() {
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
  if (user.role !== 'admin') {
    return <Navigate to={user.role === 'buyer' ? '/buyer' : '/dashboard'} replace />
  }

  return <AdminPanelLayout />
}

export function AdminPanelLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getCurrentSession()

  const { signOut } = useAuth()
  const handleLogout = () => {
    void signOut().finally(() => navigate('/login'))
  }

  const activeLabel = adminNav.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))?.label ?? 'Dashboard'

  useEffect(() => {
    if (location.pathname === '/admin/manual-order') {
      const current = getAllOrders()
      const existing = current.find((order) => order.source === 'Manual' && order.status === 'Submitted' && order.companyName === 'Manual buyer')
      if (existing) {
        localStorage.setItem('everest-admin-last-location', '/admin/incoming')
      }
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex min-h-screen flex-col xl:flex-row">
        <aside className="border-b border-line bg-surface xl:w-72 xl:border-b-0 xl:border-r">
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-white">E</div>
              <div>
                <p className="font-display text-xl font-bold text-primary">EVEREST</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">TEXTILE MILLS</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Admin Panel</p>
          </div>

          <nav className="flex flex-col gap-4 p-3" aria-label="Admin navigation">
            {adminNavSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{section.title}</p>
                <div className="space-y-1">
                  {section.items.map(({ to, label, end }) => (
                    <NavLink
                      key={`${section.title}-${to}`}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-2xl border px-4 py-3 text-base font-medium transition-all ${
                          isActive
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-primary/70 bg-[rgba(226,238,255,0.8)] text-primary hover:border-primary hover:bg-primary/5'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <ArrowRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                          <span>{label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto border-t border-line p-4">
            <div className="flex items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">AD</div>
                <div>
                  <p className="text-sm font-semibold text-ink">{session?.name ?? 'Admin User'}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Administrator</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted" />
            </div>
            <button type="button" onClick={handleLogout} className="mt-3 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm font-medium text-ink">
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas text-muted xl:hidden" aria-label="Open navigation menu">
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-sm text-muted">Operations control</p>
                <p className="text-xl font-semibold text-ink">{activeLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-xl border border-line bg-canvas p-2 text-muted" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <Link to="/" className="text-sm font-medium text-primary">Website</Link>
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

export function AdminOverviewPage() {
  const { totalOrders, newRequests, awaitingReview, acceptedOrders, inProduction, qualityCheck, readyToDispatch, delayedOrders, recentOrders } = getAdminOverview()

  const cards = [
    { label: 'Total Orders', value: totalOrders, icon: ClipboardList },
    { label: 'New Requests', value: newRequests, icon: FileText },
    { label: 'Awaiting Review', value: awaitingReview, icon: AlertCircle },
    { label: 'Accepted Orders', value: acceptedOrders, icon: CheckCircle2 },
    { label: 'In Production', value: inProduction, icon: PackageCheck },
    { label: 'Quality Check', value: qualityCheck, icon: ShieldCheck },
    { label: 'Ready to Dispatch', value: readyToDispatch, icon: Truck },
    { label: 'Delayed Orders', value: delayedOrders, icon: AlertCircle },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-gradient-to-r from-slate-900 via-primary to-sky-700 p-6 text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">Operations overview</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Everest Textile Mills</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">Monitor current work, incoming orders and progress across all order-linked operational teams.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <div className="rounded-xl bg-primary/5 p-2 text-primary"><Icon className="h-4 w-4" /></div>
            </div>
            <p className="mt-5 text-3xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-primary">Open register</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                <div>
                  <p className="font-semibold text-ink">{order.id}</p>
                  <p className="text-sm text-muted">{order.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">{order.status}</p>
                  <p className="text-xs text-muted">{new Date(order.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Shortcuts</h2>
          <div className="mt-4 space-y-3">
            <Link to="/admin/incoming" className="flex items-center justify-between rounded-xl border border-line p-3 text-sm font-medium text-ink">
              Incoming Orders <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/admin/manual-order" className="flex items-center justify-between rounded-xl border border-line p-3 text-sm font-medium text-ink">
              Create Manual Order <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/admin/orders" className="flex items-center justify-between rounded-xl border border-line p-3 text-sm font-medium text-ink">
              All Orders <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/admin/materials" className="flex items-center justify-between rounded-xl border border-line p-3 text-sm font-medium text-ink">
              Raw Materials <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/admin/production" className="flex items-center justify-between rounded-xl border border-line p-3 text-sm font-medium text-ink">
              Production Dashboard <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/admin/machines" className="flex items-center justify-between rounded-xl border border-line p-3 text-sm font-medium text-ink">
              Machine Management <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export function AdminIncomingOrdersPage() {
  const orders = getAllOrders()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const filtered = orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.companyName} ${order.productName}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesSource = sourceFilter === 'all' || order.source === sourceFilter
    return matchesQuery && matchesStatus && matchesSource
  })

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h1 className="text-2xl font-bold text-ink">Incoming Orders</h1>
        <p className="mt-1 text-sm text-muted">New buyer submissions and manual orders that require review.</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm text-ink" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-line bg-canvas px-3 text-sm text-ink">
            <option value="all">All status</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Accepted">Accepted</option>
            <option value="Clarification Required">Clarification Required</option>
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-11 rounded-xl border border-line bg-canvas px-3 text-sm text-ink">
            <option value="all">All sources</option>
            <option value="Buyer Portal">Buyer Portal</option>
            <option value="Manual">Manual</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">No matching incoming orders.</td></tr>
            ) : filtered.map((order) => (
              <tr key={order.id} className="hover:bg-canvas/70">
                <td className="px-4 py-3 font-semibold text-ink">{order.id}</td>
                <td className="px-4 py-3">{order.companyName}</td>
                <td className="px-4 py-3">{order.productName}</td>
                <td className="px-4 py-3">{order.requestedDeliveryDate}</td>
                <td className="px-4 py-3">{order.source}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">{order.status}</span></td>
                <td className="px-4 py-3"><Link to={`/admin/orders/${order.id}`} className="text-sm font-semibold text-primary">Review</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminManualOrderPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    buyerCompany: '',
    productName: '',
    productCode: '',
    quantity: '1200',
    unit: 'kg',
    requestedDeliveryDate: '',
    deliveryAddress: '',
    notes: '',
  })

  const handleCreate = () => {
    const created = {
      buyerId: 'buyer-demo',
      buyerName: 'Admin created order',
      companyName: form.buyerCompany || 'Manual buyer',
      source: 'Manual' as const,
      productName: form.productName,
      productCode: form.productCode,
      yarnType: 'Cotton',
      materialComposition: 'General textile blend',
      shade: 'Custom',
      quantity: Number(form.quantity) || 1,
      unit: form.unit,
      requestedDeliveryDate: form.requestedDeliveryDate || '2026-10-30',
      deliveryAddress: form.deliveryAddress || 'Factory dispatch desk',
      technicalNotes: form.notes,
      commercialNotes: form.notes,
      status: 'Submitted',
    }

    const order = { ...created, id: 'ORD-SYNC', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), submittedAt: new Date().toISOString(), statusHistory: [{ status: 'Submitted', note: 'Manual order received', timestamp: new Date().toISOString() }] }

    const current = getAllOrders()
    current.unshift(order as any)
    localStorage.setItem('everest-orders', JSON.stringify(current))
    navigate('/admin/orders')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h1 className="text-2xl font-bold text-ink">Create Manual Order</h1>
        <p className="mt-1 text-sm text-muted">Capture buyer or offline orders into the central order register.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="grid gap-4">
            <FieldInput label="Buyer/company" value={form.buyerCompany} onChange={(value) => setForm({ ...form, buyerCompany: value })} />
            <FieldInput label="Product name" value={form.productName} onChange={(value) => setForm({ ...form, productName: value })} />
            <FieldInput label="Product code" value={form.productCode} onChange={(value) => setForm({ ...form, productCode: value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
              <FieldInput label="Unit" value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
            </div>
            <FieldInput label="Requested delivery date" type="date" value={form.requestedDeliveryDate} onChange={(value) => setForm({ ...form, requestedDeliveryDate: value })} />
            <FieldInput label="Delivery address" value={form.deliveryAddress} onChange={(value) => setForm({ ...form, deliveryAddress: value })} />
            <FieldInput label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} textarea />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={buttonClass('secondary', 'md')}>Save draft</button>
            <button type="button" onClick={handleCreate} className={buttonClass('primary', 'md')}>Submit order</button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Submission summary</h2>
          <div className="mt-4 space-y-3 text-sm text-muted">
            <p><span className="font-medium text-ink">Buyer:</span> {form.buyerCompany || 'Not provided'}</p>
            <p><span className="font-medium text-ink">Product:</span> {form.productName || 'Not provided'}</p>
            <p><span className="font-medium text-ink">Quantity:</span> {form.quantity || '0'} {form.unit || 'kg'}</p>
            <p><span className="font-medium text-ink">Delivery:</span> {form.requestedDeliveryDate || 'Not set'}</p>
            <p><span className="font-medium text-ink">Source:</span> Manual</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminOrdersPage() {
  const orders = getAllOrders()
  const [query, setQuery] = useState('')

  const filtered = orders.filter((order) => `${order.id} ${order.companyName} ${order.productName}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h1 className="text-2xl font-bold text-ink">All Orders</h1>
        <p className="mt-1 text-sm text-muted">Operational order register for the current textile production pipeline.</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by order, buyer or product" className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm text-ink" />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-canvas/70">
                <td className="px-4 py-3 font-semibold text-ink">{order.id}</td>
                <td className="px-4 py-3">{order.companyName}</td>
                <td className="px-4 py-3">{order.productName}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">{order.status}</span></td>
                <td className="px-4 py-3">{order.source}</td>
                <td className="px-4 py-3"><Link to={`/admin/orders/${order.id}`} className="text-sm font-semibold text-primary">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminOrderReviewPage() {
  const { orderId } = useParams()
  const orders = getAllOrders()
  const order = orders.find((entry) => entry.id === orderId)
  const session = getCurrentSession()
  const [revision, setRevision] = useState(0)
  const [reviewNote, setReviewNote] = useState('')
  const [buyerMessage, setBuyerMessage] = useState('')
  const [availableQuantity, setAvailableQuantity] = useState('')
  const [materialNote, setMaterialNote] = useState('')
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const material = order ? getMaterialAvailability(order.id) : null
  void revision

  if (!order) {
    return <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">Order not found. Open an order from Incoming Orders to review it.</div>
  }

  const reviewer = session?.name ?? 'Admin reviewer'
  const refresh = () => setRevision((value) => value + 1)

  const handleMaterialCheck = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const quantity = Number(availableQuantity)
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('Enter a valid available quantity (zero or more).')
      return
    }
    let result: ReturnType<typeof recordDemoMaterialAvailability>
    try {
      result = recordDemoMaterialAvailability(order.id, quantity, materialNote, reviewer)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the material check.')
      return
    }
    if (!result) {
      setError('Unable to save the material check for this order.')
      return
    }
    setFeedback(`Demo material check recorded: ${result.status}.`)
    setAvailableQuantity('')
    setMaterialNote('')
    refresh()
  }

  const handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!reviewNote.trim()) {
      setError('Enter an internal note before saving.')
      return
    }
    let savedNote: ReturnType<typeof addOrderReviewNote>
    try {
      savedNote = addOrderReviewNote(order.id, reviewNote.trim(), reviewer)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this review note.')
      return
    }
    if (!savedNote) {
      setError('Unable to save this review note.')
      return
    }
    setReviewNote('')
    setFeedback('Internal review note saved. It is not visible to the buyer.')
    refresh()
  }

  const handleAction = (
    action: 'approved' | 'rejected' | 'clarification-requested' | 'held' | 'procurement-requested' | 'delivery-revision-requested',
    status: 'Accepted' | 'Rejected' | 'Clarification Required' | 'Under Review',
  ) => {
    setError('')
    if (action === 'approved' && (!material || material.status !== 'Available' || !reviewConfirmed)) {
      setError('Approval requires an available material check and Ram’s confirmation that the other requirements have been reviewed.')
      return
    }
    if (action === 'rejected' && !reviewNote.trim()) {
      setError('Record the rejection reason in the internal review note before rejecting this request.')
      return
    }
    if ((action === 'clarification-requested' || action === 'delivery-revision-requested') && !buyerMessage.trim()) {
      setError('Write the clarification request that should be shared with the buyer.')
      return
    }
    const message = action === 'approved'
      ? 'Your order has been approved and is available for production planning.'
      : action === 'rejected'
        ? buyerMessage.trim() || 'Your order request was not approved. Please contact Everest Textile Mills if you need more information.'
        : buyerMessage.trim()
    const actionNote = reviewNote.trim() || (action === 'approved' ? 'Order requirements reviewed and approved.' : '')
    let updated: ReturnType<typeof recordOrderReviewAction>
    try {
      updated = recordOrderReviewAction(order.id, {
        action,
        reviewer,
        note: actionNote,
        nextStatus: status,
        ...(message ? { buyerMessage: message } : {}),
      })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to record this decision.')
      return
    }
    if (!updated) {
      setError('Unable to record this decision.')
      return
    }
    setReviewNote('')
    if (action === 'clarification-requested' || action === 'approved' || action === 'rejected') setBuyerMessage('')
    setFeedback(`Decision recorded for ${order.id}: ${status}.`)
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/admin/incoming" className="text-sm font-semibold text-primary">← Incoming Orders</Link>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Order review</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">{order.id}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Submitted {new Date(order.submittedAt).toLocaleString()}</p>
            <span className="mt-2 inline-flex rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{order.status}</span>
          </div>
        </div>
      </div>

      {feedback ? <p role="status" className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm font-medium text-success">{feedback}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-error/40 bg-error/5 p-3 text-sm font-medium text-error">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Buyer & delivery details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Company" value={order.companyName} />
              <InfoRow label="Contact" value={order.buyerName} />
              <InfoRow label="Email" value={order.buyerEmail ?? 'Not recorded'} />
              <InfoRow label="Phone" value={order.buyerPhone ?? 'Not recorded'} />
              <InfoRow label="Requested delivery" value={order.requestedDeliveryDate} />
              <InfoRow label="Delivery address" value={order.deliveryAddress} />
              <InfoRow label="Delivery instructions" value={order.deliveryInstructions || 'None'} />
              <InfoRow label="Priority" value={order.priority ?? 'Standard'} />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Product requirements</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Category / product" value={`${order.productCategory ?? 'Not specified'} · ${order.productName}`} />
              <InfoRow label="Product code" value={order.productCode || 'Not provided'} />
              <InfoRow label="Yarn / subtype" value={`${order.yarnType}${order.yarnSubtype ? ` / ${order.yarnSubtype}` : ''}`} />
              <InfoRow label="Composition" value={order.materialComposition} />
              <InfoRow label="Denier / count" value={order.denierCount || 'Not specified'} />
              <InfoRow label="Colour / shade" value={order.shade} />
              <InfoRow label="Quantity" value={`${order.quantity} ${order.unit}`} />
              <InfoRow label="Commercial target" value={order.targetPrice || order.commercialNotes || 'Quotation requested'} />
              <InfoRow label="Technical specifications" value={order.technicalSpecifications || order.technicalNotes || 'None'} />
              <InfoRow label="Special requirements" value={order.specialRequirements || 'None'} />
              <InfoRow label="Buyer notes" value={order.buyerNotes || 'None'} />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Maahi material availability</h2>
            {material ? (
              <>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${material.status === 'Available' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{material.status}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-warning">Ram demo check · not Maahi data</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SummaryTile label="Available" value={`${material.availableQuantity} ${material.unit}`} />
                  <SummaryTile label="Required" value={`${material.requiredQuantity} ${material.unit}`} />
                  <SummaryTile label="Shortage" value={`${material.shortageQuantity} ${material.unit}`} />
                </div>
                <p className="mt-3 text-xs text-muted">Checked by {material.checkedBy} · {new Date(material.checkedAt).toLocaleString()}</p>
                {material.notes ? <p className="mt-2 rounded-xl bg-canvas p-3 text-sm text-muted">{material.notes}</p> : null}
              </>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-line bg-canvas p-4 text-sm text-muted">Availability Not Checked · Awaiting Material Module Integration. No stock quantity is available from Maahi yet; do not assume material is available.</p>
            )}
            <form onSubmit={handleMaterialCheck} className="mt-5 space-y-3 border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">Manual demo check</p>
              <p className="text-xs text-muted">Ram may record a review value for workflow testing. This does not query Maahi inventory and is visibly labelled as demo data.</p>
              <label className="block text-sm font-medium text-ink">Available quantity ({order.unit})
                <input required type="number" min="0" step="any" value={availableQuantity} onChange={(event) => setAvailableQuantity(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink" />
              </label>
              <label className="block text-sm font-medium text-ink">Material notes
                <textarea rows={2} value={materialNote} onChange={(event) => setMaterialNote(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" />
              </label>
              <div className="flex justify-end"><button type="submit" className={buttonClass('secondary', 'md')}>Record demo material check</button></div>
            </form>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Review notes & decision</h2>
            <form onSubmit={handleAddNote} className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-ink">Internal review note <span className="font-normal text-muted">(visible only to admin)</span>
                <textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" placeholder="Keep internal observations here. They are not sent to the buyer." />
              </label>
              <button type="submit" className={buttonClass('secondary', 'md')}>Save internal note</button>
            </form>
            <label className="mt-5 block text-sm font-medium text-ink">Message to buyer <span className="font-normal text-muted">(shared explicitly)</span>
              <textarea rows={3} value={buyerMessage} onChange={(event) => setBuyerMessage(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" placeholder="Only text in this field is shown in the buyer portal." />
            </label>
            {material?.status === 'Partially Available' || material?.status === 'Insufficient Stock' ? (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3">
                <p className="text-sm font-semibold text-ink">Material shortage: {material.shortageQuantity} {material.unit}</p>
                <p className="mt-1 text-xs text-muted">Do not approve on the basis of a partial check. Ram can request procurement, ask for a revised delivery date, or hold the request.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleAction('procurement-requested', 'Under Review')} className={buttonClass('secondary', 'md')}>Request procurement</button>
                  <button type="button" onClick={() => handleAction('delivery-revision-requested', 'Clarification Required')} className={buttonClass('secondary', 'md')}>Request revised delivery</button>
                  <button type="button" onClick={() => handleAction('held', 'Under Review')} className={buttonClass('secondary', 'md')}>Hold for review</button>
                </div>
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-2 text-sm text-muted">
                <input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} className="mt-1" />
                I reviewed the product, commercial and delivery requirements.
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleAction('clarification-requested', 'Clarification Required')} className={buttonClass('secondary', 'md')}>Request clarification</button>
                <button type="button" onClick={() => handleAction('rejected', 'Rejected')} className="inline-flex h-11 items-center justify-center rounded-lg border border-error/40 px-5 text-sm font-semibold text-error">Reject with reason</button>
                <button type="button" disabled={!material || material.status !== 'Available' || !reviewConfirmed} onClick={() => handleAction('approved', 'Accepted')} className={buttonClass('primary', 'md', 'disabled:cursor-not-allowed disabled:opacity-50')}>Approve for production planning</button>
              </div>
              {!material || material.status !== 'Available' ? <p className="text-xs text-muted">Approval is disabled until the material check reports Available.</p> : null}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Decision history</h2>
            <div className="mt-4 space-y-3">
              {(order.reviewHistory ?? []).length === 0 ? <p className="text-sm text-muted">No reviewer actions recorded.</p> : (order.reviewHistory ?? []).map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="rounded-xl bg-canvas p-3">
                  <p className="font-semibold text-ink">{event.action.replace(/-/g, ' ')}</p>
                  <p className="mt-1 text-xs text-muted">{event.reviewer} · {new Date(event.timestamp).toLocaleString()}</p>
                  {event.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{event.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Buyer-visible status history</h2>
            <div className="mt-4 space-y-3">
              {order.statusHistory.map((event, index) => (
                <div key={`${event.timestamp}-${event.status}-${index}`} className="rounded-xl bg-canvas p-3">
                  <p className="font-semibold text-ink">{event.status}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(event.timestamp).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-muted">{event.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Internal notes</h2>
            <div className="mt-4 space-y-3">
              {(order.reviewHistory ?? []).filter((event) => event.action === 'note' && event.note).length === 0
                ? <p className="text-sm text-muted">No internal notes recorded.</p>
                : (order.reviewHistory ?? []).filter((event) => event.action === 'note' && event.note).map((event, index) => (
                  <div key={`${event.timestamp}-${index}`} className="rounded-xl border border-warning/20 bg-warning/5 p-3">
                    <p className="whitespace-pre-wrap text-sm text-ink">{event.note}</p>
                    <p className="mt-2 text-xs text-muted">{event.reviewer} · {new Date(event.timestamp).toLocaleString()}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminInquiriesPage() {
  const inquiries = getAllInquiries()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(inquiries[0]?.id ?? '')
  const inquiry = inquiries.find((entry) => entry.id === selectedId) ?? inquiries[0]

  const handleRespond = () => {
    if (!inquiry) return
    respondToInquiry(inquiry.id, 'Thanks for the update. We are reviewing the latest production plan and will respond shortly.')
    updateInquiryStatus(inquiry.id, 'Awaiting Response')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h1 className="text-2xl font-bold text-ink">Order Inquiries</h1>
        <p className="mt-1 text-sm text-muted">Review buyer questions and respond directly through the internal queue.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inquiries" className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm text-ink" />
          </label>
          <div className="mt-4 space-y-3">
            {inquiries.filter((entry) => `${entry.id} ${entry.subject}`.toLowerCase().includes(query.toLowerCase())).map((entry) => (
              <button key={entry.id} type="button" onClick={() => setSelectedId(entry.id)} className={`w-full rounded-xl border p-3 text-left ${selectedId === entry.id ? 'border-primary bg-primary/5' : 'border-line bg-canvas'}`}>
                <p className="font-semibold text-ink">{entry.subject}</p>
                <p className="mt-1 text-xs text-muted">{entry.id} • {entry.status}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          {inquiry ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Inquiry</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{inquiry.subject}</h2>
                </div>
                <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">{inquiry.status}</span>
              </div>

              <div className="mt-5 space-y-3">
                {inquiry.messages.map((message) => (
                  <div key={`${message.sender}-${message.timestamp}`} className={`rounded-xl p-3 ${message.sender === 'buyer' ? 'bg-canvas' : 'bg-primary/5'}`}>
                    <p className="text-sm font-medium text-ink">{message.sender === 'buyer' ? 'Buyer' : 'Admin'}</p>
                    <p className="mt-1 text-sm text-muted">{message.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => updateInquiryStatus(inquiry.id, 'Resolved')} className={buttonClass('secondary', 'md')}>Mark resolved</button>
                <button type="button" onClick={handleRespond} className={buttonClass('primary', 'md')}>Reply</button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AdminModulePlaceholderPage({ title, description }: { title: string; description: string }) {
  const productionOrders = title === 'Production Management'
    ? getAllOrders().filter((order) => ['Accepted', 'Scheduled', 'In Production'].includes(order.status))
    : []

  return (
    <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{description}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SummaryTile label="Current status" value="Awaiting integration" />
        <SummaryTile label="Orders covered" value="Linked via orderId" />
        <SummaryTile label="Next step" value="Connect module API" />
      </div>
      {title === 'Production Management' ? (
        <section className="mt-8 border-t border-line pt-6">
          <h2 className="text-lg font-semibold text-ink">Approved orders for Lakshita’s planning</h2>
          <p className="mt-1 text-sm text-muted">Accepted orders are visible here with their original Order ID. Production planning remains an integration boundary.</p>
          <div className="mt-4 space-y-3">
            {productionOrders.length === 0
              ? <p className="rounded-xl bg-canvas p-4 text-sm text-muted">No approved orders are ready for production planning.</p>
              : productionOrders.map((order) => (
                <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas p-4">
                  <span><span className="font-semibold text-primary">{order.id}</span><span className="ml-3 text-sm text-ink">{order.productName} · {order.quantity} {order.unit}</span></span>
                  <span className="text-xs font-semibold text-muted">{order.status} · {order.companyName}</span>
                </Link>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
    </div>
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

function FieldInput({ label, value, onChange, type = 'text', textarea = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink" />
      )}
    </label>
  )
}

export default AdminRouteGuard
