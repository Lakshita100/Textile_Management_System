import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Factory,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
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
  { to: '/buyer', label: 'Dashboard', icon: LayoutDashboard, end: true },
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
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { signOut } = useAuth()
  const handleLogout = () => {
    void signOut().finally(() => navigate('/login'))
  }
  const currentPage = navItems.find(({ to, end }) =>
    end ? location.pathname === to : location.pathname.startsWith(to),
  )

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="admin-layout min-h-screen">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[99] bg-black/40 min-[1025px]:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        className={`admin-layout__sidebar flex flex-col transition-transform duration-200 ${sidebarOpen ? 'admin-layout__sidebar--open' : ''}`}
        aria-label="Buyer navigation"
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--admin-sidebar-border)] px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-primary)]">
            <Factory className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[var(--admin-sidebar-text)]">Everest Textile Mills</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-sidebar-text-muted)]">Buyer Portal</p>
          </div>
        </div>

        <nav className="admin-layout__sidebar-nav flex-1 overflow-y-auto px-3 py-5" aria-label="Buyer modules">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-sidebar-text-muted)]">Workspace</p>
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--admin-sidebar-active-bg)] text-white'
                        : 'text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover-bg)]'
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" aria-hidden />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--admin-sidebar-border)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
              {(session?.name ?? 'Buyer').split(' ').map((name) => name[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--admin-sidebar-text)]">{session?.name ?? 'Buyer'}</p>
              <p className="truncate text-xs text-[var(--admin-sidebar-text-muted)]">{session?.companyName ?? 'Company'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--admin-sidebar-text-muted)] transition hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col min-[1025px]:pl-[240px]">
        <header className="admin-layout__header">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white text-[var(--admin-text-secondary)] transition hover:bg-slate-50 min-[1025px]:hidden"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0">
              <nav className="mb-0.5 flex items-center gap-1.5 text-xs text-[var(--admin-text-muted)]" aria-label="Breadcrumb">
                <span>Buyer workspace</span>
                <ChevronRight className="h-3 w-3" aria-hidden />
                <span className="truncate font-medium text-[var(--admin-text-primary)]">{currentPage?.label ?? 'Dashboard'}</span>
              </nav>
              <h1 className="truncate text-lg font-semibold text-[var(--admin-text-primary)]">{currentPage?.label ?? 'Dashboard'}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/buyer/inquiries"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white text-[var(--admin-text-muted)] transition hover:bg-slate-50 hover:text-[var(--admin-text-primary)]"
              aria-label="View inquiries"
            >
              <Bell className="h-5 w-5" aria-hidden />
            </Link>
            <Link to="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--admin-primary)] transition hover:bg-blue-50 sm:flex">
              Back to website
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </header>

        <main className="admin-layout__main !pt-4 flex-1">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export function BuyerDashboardPage() {
  const session = getCurrentSession()
  const orders = useMemo(() => getOrdersForBuyer(session?.userId ?? ''), [session])
  const inquiries = useMemo(() => getInquiriesForBuyer(session?.userId ?? ''), [session])
  const dueOrders = orders
    .filter((order) => order.requestedDeliveryDate && !['Delivered', 'Cancelled', 'Rejected'].includes(order.status))
    .sort((a, b) => a.requestedDeliveryDate.localeCompare(b.requestedDeliveryDate))
  const activeOrders = orders.filter((order) => !['Delivered', 'Cancelled', 'Rejected'].includes(order.status))
  const inProduction = orders.filter((order) => ['In Production', 'Quality Check'].includes(order.status)).length
  const openInquiries = inquiries.filter((inquiry) => inquiry.status !== 'Resolved')
  const latestOrders = [...orders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4)
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  const metrics = [
    { label: 'Active orders', value: activeOrders.length, note: 'Orders currently being processed', icon: Package, tone: 'bg-[#f2f6ff] text-[#0f4ea3]' },
    { label: 'In production', value: inProduction, note: 'Production and quality stages', icon: Factory, tone: 'bg-[#eafaf3] text-[#20a86b]' },
    { label: 'Scheduled deliveries', value: dueOrders.length, note: 'Active orders with a delivery date', icon: Truck, tone: 'bg-[#fff7e8] text-[#d38b1f]' },
    { label: 'Open inquiries', value: openInquiries.length, note: 'Conversations awaiting resolution', icon: ClipboardCheck, tone: 'bg-[#f5f1ff] text-[#7c5af7]' },
  ]

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(94,130,216,0.32),_transparent_28%),linear-gradient(100deg,#0c254d_0%,#0f3d7c_54%,#1457a4_100%)] p-5 text-white shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[32px] border-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">{greeting}, {session?.name?.split(' ')[0] ?? 'Buyer'}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-[38px]">{session?.companyName ?? 'Your buyer workspace'}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Your orders, production updates and delivery plans — all in one place.</p>
          </div>
          <Link to="/buyer/orders/new" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#124887] shadow-sm transition hover:bg-blue-50">
            Place a new order
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Order summary">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Overview</span>
            </div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Recent orders</h2>
              <p className="mt-1 text-xs text-slate-500">Latest activity across your orders</p>
            </div>
            <Link to="/buyer/orders" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
              View all <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {latestOrders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[620px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="rounded-l-lg px-3 py-3 font-semibold">Order</th>
                    <th className="px-3 py-3 font-semibold">Product</th>
                    <th className="px-3 py-3 font-semibold">Quantity</th>
                    <th className="px-3 py-3 font-semibold">Delivery</th>
                    <th className="rounded-r-lg px-3 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestOrders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-slate-50/80">
                      <td className="px-3 py-3.5">
                        <Link to={`/buyer/orders/${order.id}`} className="font-semibold text-slate-800 hover:text-blue-700">{order.id}</Link>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-medium text-slate-700">{order.productName}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{order.shade}</p>
                      </td>
                      <td className="px-3 py-3.5 text-slate-600">{order.quantity.toLocaleString()} {order.unit}</td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                        {order.requestedDeliveryDate ? new Date(`${order.requestedDeliveryDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-slate-700">No orders yet</p>
              <p className="mt-1 text-sm text-slate-500">Your submitted orders will appear here.</p>
              <Link to="/buyer/orders/new" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                Place your first order <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Delivery schedule</h2>
              <p className="mt-1 text-xs text-slate-500">Requested delivery dates for active orders</p>
            </div>
            <CalendarDays className="h-5 w-5 text-slate-400" aria-hidden />
          </div>
          {dueOrders.length ? (
            <div className="space-y-3">
              {dueOrders.slice(0, 4).map((order, index) => (
                <Link key={order.id} to={`/buyer/orders/${order.id}`} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
                  <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg ${index === 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'}`}>
                    <span className="text-[9px] font-bold uppercase">{new Date(`${order.requestedDeliveryDate}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="text-sm font-bold leading-4">{new Date(`${order.requestedDeliveryDate}T00:00:00`).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{order.id}</p>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{order.productName}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Clock3 className="h-3 w-3" aria-hidden /> {order.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" aria-hidden />
              <p className="mt-2 text-sm font-medium text-slate-700">No upcoming deliveries</p>
              <p className="mt-1 text-xs text-slate-500">Delivery dates will show here when available.</p>
            </div>
          )}
          <Link to="/buyer/tracking" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Track all orders <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/buyer/tracking" className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Truck className="h-5 w-5" aria-hidden /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Track your order</p>
            <p className="mt-1 text-sm text-slate-500">Follow production and dispatch progress.</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden />
        </Link>
        <Link to="/buyer/inquiries" className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><ClipboardCheck className="h-5 w-5" aria-hidden /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Need help with an order?</p>
            <p className="mt-1 text-sm text-slate-500">{openInquiries.length ? `${openInquiries.length} open ${openInquiries.length === 1 ? 'inquiry' : 'inquiries'} to review.` : 'Start or review a conversation with our team.'}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden />
        </Link>
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
