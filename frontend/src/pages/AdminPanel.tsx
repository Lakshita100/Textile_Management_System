import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
   AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  Loader2,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { buttonClass } from '../components/ui/Button'
import { productionApi } from '../services/api'
import { useAuth } from '../store/AuthProvider'
import { getBuyerFabricCatalog, getBuyerYarnCatalog } from '../services/authService'
import type { BuyerFabricCatalogItem, BuyerYarnCatalogItem } from '../services/authService'
import { getCountries, isFullContactName } from '../services/locationService'
import type { CountryOption } from '../services/locationService'
import {
  addOrderReviewNote,
  createManualOrder,
  getAdminOverview,
  getAllInquiries,
  getAllOrders,
  getCurrentSession,
  getMaterialAvailability,
  recordDemoMaterialAvailability,
  recordInventoryMaterialAvailability,
  recordOrderReviewAction,
  respondToInquiry,
  updateInquiryStatus,
} from '../services/orderService'

interface AdminNavItem {
  to?: string;
  label: string;
  end?: boolean;
  children?: { to: string; label: string }[];
}

const adminNavSections: ReadonlyArray<{
  title: string
  items: ReadonlyArray<AdminNavItem>
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
      { to: '/admin/manual-order', label: 'Create Manual Order', end: false },
      { to: '/admin/inquiries', label: 'Order Inquiries', end: false },
    ],
  },
  {
    title: 'INVENTORY & OPERATIONS',
    items: [
      {
        label: 'Production Management',
        to: '/admin/production',
        children: [
          { to: '/admin/inventory', label: 'Yarn Inventory' },
          { to: '/admin/alerts', label: 'Low-Stock Alerts' },
          { to: '/admin/movements', label: 'Stock Movements' },
          { to: '/admin/suppliers', label: 'Suppliers' },
        ],
      },
      { to: '/admin/machines', label: 'Machines', end: false },
      { to: '/admin/jobs', label: 'Production Jobs', end: false },
      { to: '/admin/recommend', label: 'Production Recommendations', end: false },
      { to: '/admin/quality', label: 'Quality Control', end: false },
      { to: '/admin/dispatch', label: 'Packing & Dispatch', end: false },
    ],
  },
  {
    title: 'TEAM & ATTENDANCE',
    items: [
      { to: '/admin/employees', label: 'Employee Access', end: false },
      { to: '/admin/attendance', label: 'Attendance Register', end: false },
    ],
  },
]

export function AdminRouteGuard({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Checking your session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }
  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />
  }
  if (user.role !== 'admin') {
    return <Navigate to={user.role === 'buyer' ? '/buyer' : '/dashboard'} replace />
  }

  return children ?? <AdminPanelLayout />
}

export function AdminPanelLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getCurrentSession()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Production Management': true,
  })

  const { signOut } = useAuth()
  const handleLogout = () => {
    void signOut().finally(() => navigate('/login'))
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const activeLabel =
    adminNavSections
      .flatMap((group) => group.items.flatMap((item) => (item.children ? [item, ...item.children] : [item])))
      .find((item) => item.to && ('end' in item && item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
      ?.label ?? 'Dashboard'

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
    <div className="admin-panel min-h-screen bg-[#edf3f8] text-slate-800">
      <div className="relative min-h-screen xl:pl-[260px]">
        <aside className="fixed left-0 top-0 z-30 h-screen w-full text-white xl:w-[260px] xl:border-r xl:border-slate-700" style={{ background: 'var(--admin-sidebar-bg)' }}>
          <div className="flex items-center gap-3 border-b border-slate-700 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1b4a8a] text-lg font-extrabold text-white">E</div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white">EVEREST</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-slate-300">TEXTILE MILLS</p>
            </div>
          </div>

          <nav className="flex h-[calc(100vh-140px)] flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
            {adminNavSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">{section.title}</p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (item.children && item.children.length > 0) {
                      const isExpanded = !!expandedGroups[item.label]
                      const isChildActive = item.children.some((c) => location.pathname.startsWith(c.to))
                      const isParentActive = item.to ? location.pathname === item.to || isChildActive : isChildActive

                      return (
                        <div key={item.label} className="space-y-1">
                          <div
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                              isParentActive ? 'bg-[#0f2d5b] text-white shadow-inner' : 'text-slate-200 hover:bg-[#102749] hover:text-white'
                            }`}
                          >
                            <NavLink
                              to={item.to!}
                              className="flex flex-1 items-center gap-2.5 font-semibold text-slate-100"
                            >
                              <ArrowRight className={`h-4 w-4 ${isParentActive ? 'text-white' : 'text-sky-300'}`} />
                              <span>{item.label}</span>
                            </NavLink>
                            <button
                              type="button"
                              onClick={() => toggleGroup(item.label)}
                              className="p-1 text-slate-300 hover:text-white"
                              aria-label="Toggle sub-modules"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="ml-4 space-y-1 border-l border-slate-600 pl-2">
                              {item.children.map((child) => (
                                <NavLink
                                  key={child.to}
                                  to={child.to}
                                  className={({ isActive }) =>
                                    `block rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                      isActive
                                        ? 'bg-sky-600 text-white font-semibold shadow-sm'
                                        : 'text-slate-300 hover:bg-[#102749] hover:text-white'
                                    }`
                                  }
                                >
                                  {child.label}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <NavLink
                        key={`${section.title}-${item.to}`}
                        to={item.to!}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[#0f2d5b] text-white shadow-inner'
                              : 'text-slate-200 hover:bg-[#102749] hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <ArrowRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-sky-300'}`} />
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="relative border-t border-slate-700 p-4">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-white/15 bg-[#0d2347]/80 px-3 py-2 text-left transition hover:bg-[#0d2347] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f4f8] text-[10px] font-bold text-slate-800">FA</span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{session?.name ?? 'Factory Admin'}</span>
                    <span className="block text-[9px] uppercase tracking-[0.18em] text-slate-300">Administrator</span>
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-300 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute bottom-full left-4 right-4 z-50 mb-2 rounded-xl border border-white/15 bg-[#0d2347] p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <LogOut className="h-4 w-4 text-slate-300" aria-hidden />
                  Logout
                </button>
              </div>
            </details>
          </div>
        </aside>

        <div className="relative min-h-screen">
          <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.06)] sm:px-5 xl:left-[260px]">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 xl:hidden" aria-label="Open navigation menu">
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">Operations control</p>
                <p className="truncate text-xl font-semibold text-slate-800">{activeLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input aria-label="Search orders" placeholder="Search orders, materials, machines, employees..." className="w-[260px] border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none" />
                <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Ctrl K</span>
              </div>
              <button type="button" className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600" aria-label="Theme settings">
                <Bell className="h-4 w-4" />
              </button>
              <button type="button" className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600" aria-label="Notifications">
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <Link to="/" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">Website</Link>
            </div>
          </header>

          <main className="min-h-screen bg-[#edf3f8] px-4 pb-6 pt-[88px] sm:px-6 xl:pl-6">
            <div className="mx-auto max-w-[1550px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export function AdminOverviewPage() {
  const { totalOrders, newRequests, inProduction, qualityCheck, readyToDispatch, delayedOrders, recentOrders } = getAdminOverview()

  const kpis = [
    { label: 'Total Orders', value: totalOrders, delta: '+12% from last month', tone: 'bg-[#f2f6ff] text-[#0f4ea3]', icon: ClipboardList },
    { label: 'New Requests', value: newRequests, delta: '+3% from last week', tone: 'bg-[#f5f1ff] text-[#7c5af7]', icon: FileText },
    { label: 'In Production', value: inProduction, delta: '+25% from last week', tone: 'bg-[#eafaf3] text-[#20a86b]', icon: PackageCheck },
    { label: 'Quality Check', value: qualityCheck, delta: '+18% from last week', tone: 'bg-[#eefaf5] text-[#1ba973]', icon: ShieldCheck },
    { label: 'Ready to Dispatch', value: readyToDispatch, delta: '+33% from last week', tone: 'bg-[#edf4ff] text-[#1767d3]', icon: Truck },
    { label: 'Delayed Orders', value: delayedOrders, delta: '+2% from last week', tone: 'bg-[#fff2f2] text-[#e95b5b]', icon: AlertCircle },
  ]

  const chartPoints = [50, 80, 90, 120, 140, 180, 220]
  const chartHeight = 176
  const chartWidth = 360
  const chartMax = 260
  const chartPath = chartPoints.map((point, index) => {
    const x = 24 + index * 52
    const y = chartHeight - (point / chartMax) * chartHeight + 10
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const orderBreakdown = [
    { label: 'Incoming', value: 12, color: '#3b82f6' },
    { label: 'In Production', value: 18, color: '#22c55e' },
    { label: 'Quality Check', value: 17, color: '#f59e0b' },
    { label: 'Ready to Dispatch', value: 13, color: '#a855f7' },
    { label: 'Delivered', value: 8, color: '#94a3b8' },
  ]

  const donutGradient = `conic-gradient(#3b82f6 0 12%, #22c55e 12% 30%, #f59e0b 30% 47%, #a855f7 47% 60%, #94a3b8 60% 68%, #f97316 68% 100%)`

  const quickActions = [
    { label: 'Create', icon: FileText },
    { label: 'Add Manual Order', icon: ClipboardList },
    { label: 'View All Orders', icon: Truck },
    { label: 'Manage Machines', icon: PackageCheck },
    { label: 'Production', icon: CheckCircle2 },
    { label: 'Quality Control', icon: ShieldCheck },
  ]

  const alerts = [
    { title: 'Low stock alert', detail: 'Cotton yarn stock is below threshold (500 kg).', time: '2h ago', color: 'bg-rose-100 text-rose-500', icon: AlertCircle },
    { title: 'Order at risk', detail: 'ORD-2048 may be delayed by 2 days.', time: '4h ago', color: 'bg-amber-100 text-amber-500', icon: AlertCircle },
    { title: 'Machine maintenance', detail: 'Machine M-03 scheduled maintenance due.', time: '5h ago', color: 'bg-sky-100 text-sky-600', icon: CheckCircle2 },
    { title: 'Quality issue', detail: '2 batches failed quality check.', time: '6h ago', color: 'bg-emerald-100 text-emerald-600', icon: ShieldCheck },
    { title: 'Dispatch ready', detail: '3 orders are ready for dispatch.', time: '8h ago', color: 'bg-violet-100 text-violet-600', icon: Truck },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-[18px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(94,130,216,0.28),_transparent_22%),linear-gradient(90deg,#0c254d_0%,#0f3d7c_48%,#0f3d7c_100%)] p-5 text-white shadow-sm md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[680px] flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">Operations overview</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-[40px]">Everest Textile Mills</h1>
            <p className="mt-2 max-w-[560px] text-sm text-slate-200 md:text-base">Monitor current work, incoming orders and progress across all order-linked operational teams.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/95 backdrop-blur-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Factory Operational
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              {delta}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr_0.75fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg text-slate-700">📈</span>
              <h2 className="text-xl font-semibold text-slate-800">Production Progress</h2>
            </div>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500">This Week</button>
          </div>

          <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Production Output</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />Target Output</span>
          </div>

          <div className="relative h-[220px] overflow-hidden rounded-xl bg-slate-50 p-3">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full" aria-label="Production progress chart">
              {[0, 1, 2, 3].map((row) => (
                <line key={row} x1="0" x2={chartWidth} y1={20 + row * 42} y2={20 + row * 42} stroke="#dfe7f1" strokeDasharray="4 6" />
              ))}
              <path d={chartPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              <path d={`${chartPath} L 310 170 L 24 170 Z`} fill="rgba(37, 99, 235, 0.08)" />
            </svg>
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-between text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg text-slate-700">🧭</span>
            <h2 className="text-xl font-semibold text-slate-800">Order Status Distribution</h2>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: donutGradient }}>
              <div className="flex h-[95px] w-[95px] items-center justify-center rounded-full bg-white text-center shadow-inner">
                <div>
                  <div className="text-2xl font-bold text-slate-800">48</div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Total Orders</div>
                </div>
              </div>
            </div>

            <ul className="flex-1 space-y-2 text-sm text-slate-700">
              {orderBreakdown.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg text-slate-700">⚡</span>
            <h2 className="text-xl font-semibold text-slate-800">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon }) => (
              <button key={label} type="button" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium text-slate-700">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg text-slate-700">🧾</span>
              <h2 className="text-xl font-semibold text-slate-800">Recent Orders</h2>
            </div>
            <Link to="/admin/orders" className="text-sm font-semibold text-blue-600">View All</Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Order No.</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Quantity</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Expected Date</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-t border-slate-200 bg-white">
                    <td className="px-3 py-3 font-semibold text-slate-800">{order.id}</td>
                    <td className="px-3 py-3 text-slate-600">{order.companyName}</td>
                    <td className="px-3 py-3 text-slate-600">{order.productName}</td>
                    <td className="px-3 py-3 text-slate-600">{order.quantity.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">{order.status}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{new Date(order.requestedDeliveryDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-3 py-3 text-center text-slate-400">•••</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg text-slate-700">🔔</span>
              <h2 className="text-xl font-semibold text-slate-800">Alerts & Notifications</h2>
            </div>
            <Link to="/admin/alerts" className="text-sm font-semibold text-blue-600">View All</Link>
          </div>

          <div className="space-y-3">
            {alerts.map(({ title, detail, time, color, icon: Icon }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-800">{title}</p>
                    <span className="text-[10px] text-slate-400">{time}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{detail}</p>
                </div>
              </div>
            ))}
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
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [yarnCatalog, setYarnCatalog] = useState<BuyerYarnCatalogItem[]>([])
  const [fabricCatalog, setFabricCatalog] = useState<BuyerFabricCatalogItem[]>([])
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [submittedOrderId, setSubmittedOrderId] = useState('')

  const [buyerForm, setBuyerForm] = useState({
    companyName: '', buyerName: '', buyerEmail: '', dialCode: '+91', phone: '', country: '', city: '', postalCode: '',
  })

  type OrderForm = {
    productCategory: string
    productName: string
    yarnType: string
    yarnSubtype: string
    productCode: string
    yarnId: string
    materialComposition: string
    technicalSpecifications: string
    denierCount: string
    shade: string
    specialRequirements: string
    quantity: string
    unit: 'kg' | 'metres'
    priority: 'Standard' | 'Urgent' | 'Flexible'
    requestedDeliveryDate: string
    deliveryAddress: string
    deliveryInstructions: string
    targetPrice: string
    buyerNotes: string
  }

  const [form, setForm] = useState<OrderForm>({
    productCategory: 'Yarn',
    productName: '',
    yarnType: '',
    yarnSubtype: '',
    productCode: '',
    yarnId: '',
    materialComposition: '',
    technicalSpecifications: '',
    denierCount: '',
    shade: '',
    specialRequirements: '',
    quantity: '',
    unit: 'kg',
    priority: 'Standard',
    requestedDeliveryDate: '',
    deliveryAddress: '',
    deliveryInstructions: '',
    targetPrice: '',
    buyerNotes: '',
  })

  const earliestDeliveryDate = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let active = true
    Promise.all([getBuyerYarnCatalog(), getBuyerFabricCatalog(), getCountries()])
      .then(([yarns, fabrics, countryRows]) => {
        if (active) {
          setYarnCatalog(yarns)
          setFabricCatalog(fabrics)
          setCountries(countryRows)
        }
      })
      .catch((reason: unknown) => {
        if (active) setCatalogError(reason instanceof Error ? reason.message : 'Could not load product catalogs.')
      })
      .finally(() => {
        if (active) setCatalogLoading(false)
      })
    return () => { active = false }
  }, [])

  const yarnTypes = useMemo(() => [...new Set(yarnCatalog.map((item) => item.category))].sort(), [yarnCatalog])
  const yarnSubtypes = useMemo(
    () => [...new Set(yarnCatalog.filter((item) => !form.yarnType || item.category === form.yarnType).map((item) => `${item.materialComposition} · ${item.denierSpecification}`))].sort(),
    [form.yarnType, yarnCatalog],
  )
  const matchingYarns = useMemo(
    () => yarnCatalog.filter((item) => (!form.yarnType || item.category === form.yarnType) && (!form.yarnSubtype || `${item.materialComposition} · ${item.denierSpecification}` === form.yarnSubtype)),
    [form.yarnSubtype, form.yarnType, yarnCatalog],
  )
  const matchingFabrics = useMemo(
    () => fabricCatalog.filter((item) => !form.yarnType || item.fabricCategory === form.yarnType),
    [fabricCatalog, form.yarnType],
  )

  const setField = <K extends keyof OrderForm>(field: K, value: OrderForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const setBuyerField = (key: keyof typeof buyerForm, value: string) => {
    setBuyerForm((current) => ({ ...current, [key]: value }))
  }

  const continueToReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!buyerForm.companyName.trim() || !isFullContactName(buyerForm.buyerName) || !buyerForm.buyerEmail.trim() || !/^\d{10}$/.test(buyerForm.phone) || !buyerForm.country || !buyerForm.city.trim() || !buyerForm.postalCode.trim()) {
      setError('Enter company name, a full contact name, valid email, 10 digit phone, country, city and postal code.')
      return
    }
    if (form.productCategory === 'Yarn' && !form.yarnId) {
      setError('Select an available yarn product from the inventory catalog.')
      return
    }
    if (Number(form.quantity) <= 0) {
      setError('Enter a quantity greater than zero.')
      return
    }
    setStep('review')
  }

  const submitOrder = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const created = await createManualOrder({
        companyName: buyerForm.companyName.trim(),
        buyerName: buyerForm.buyerName.trim(),
        buyerEmail: buyerForm.buyerEmail.trim(),
        buyerPhone: `${buyerForm.dialCode} ${buyerForm.phone}`,
        productName: form.productName.trim(),
        productCode: form.productCode.trim(),
        yarnId: form.yarnId || undefined,
        productCategory: form.productCategory,
        yarnType: form.yarnType,
        yarnSubtype: form.yarnSubtype.trim(),
        materialComposition: form.materialComposition.trim(),
        technicalSpecifications: form.technicalSpecifications.trim(),
        denierCount: form.denierCount.trim(),
        shade: form.shade.trim(),
        specialRequirements: form.specialRequirements.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        priority: form.priority,
        requestedDeliveryDate: form.requestedDeliveryDate,
        deliveryAddress: `${form.deliveryAddress}, ${buyerForm.city}, ${buyerForm.country} ${buyerForm.postalCode}`,
        deliveryInstructions: form.deliveryInstructions.trim(),
        targetPrice: form.targetPrice.trim(),
        buyerNotes: form.buyerNotes.trim(),
        technicalNotes: [form.technicalSpecifications, form.denierCount ? `Denier/count: ${form.denierCount}` : '', form.specialRequirements].filter(Boolean).join('\n'),
        commercialNotes: form.targetPrice ? `Target price / quotation request: ${form.targetPrice}` : form.buyerNotes ? form.buyerNotes : 'Quotation requested.',
      })
      setSubmittedOrderId(created.id)
      setStep('review')
      setTimeout(() => { navigate(`/admin/orders/${created.id}`) }, 1500)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The order could not be created. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink'

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <Link to="/admin/incoming" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Manual order</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Create order on behalf of a buyer</h1>
            <p className="mt-1 text-sm text-muted">Enter the buyer details manually, then fill the product requirements. The form mirrors the buyer portal, with the buyer information entered by the administrator.</p>
          </div>
          <span className="hidden rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">
            {step === 'form' ? '1 of 2 · Requirements' : '2 of 2 · Review'}
          </span>
        </div>
      </div>

      {step === 'form' ? (
        <form onSubmit={continueToReview} className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Buyer details</h2>
            <p className="mt-1 text-sm text-muted">All buyer information is entered by the administrator.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Company / buyer name *" required>
                <input required value={buyerForm.companyName} onChange={(event) => setBuyerField('companyName', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Contact person full name *" required>
                <input required value={buyerForm.buyerName} onChange={(event) => setBuyerField('buyerName', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Business email *" required>
                <input required type="email" value={buyerForm.buyerEmail} onChange={(event) => setBuyerField('buyerEmail', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Phone *" required>
                <span className="mt-2 flex gap-2">
                  <select aria-label="Country phone code" value={buyerForm.dialCode} onChange={(event) => setBuyerField('dialCode', event.target.value)} className="h-11 w-32 rounded-xl border border-line bg-canvas px-3 text-sm text-ink">
                    {countries.map((c) => <option key={c.code} value={c.dialCode}>{c.name} ({c.dialCode})</option>)}
                  </select>
                  <input required inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={buyerForm.phone} onChange={(event) => setBuyerField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))} className={inputClass} placeholder="10 digit number" />
                </span>
              </Field>
              <Field label="Country *" required>
                <select required value={buyerForm.country} onChange={(event) => setBuyerField('country', countries.find((c) => c.name === event.target.value)?.name ?? event.target.value)} className={inputClass}>
                  <option value="">Select country</option>
                  {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="City *" required>
                <input required value={buyerForm.city} onChange={(event) => setBuyerField('city', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Postal code *" required>
                <input required value={buyerForm.postalCode} onChange={(event) => setBuyerField('postalCode', event.target.value)} className={inputClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Product requirements</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Product category" required>
                <select required value={form.productCategory} onChange={(event) => {
                  const value = event.target.value
                  setForm((current) => ({
                    ...current,
                    productCategory: value as OrderForm['productCategory'],
                    unit: value === 'Fabric' ? 'kg' : current.unit,
                    productName: '', yarnId: '', productCode: '', yarnType: '', yarnSubtype: '',
                    materialComposition: '', denierCount: '', shade: '',
                  }))
                }} className={inputClass}>
                  <option value="">Select a category</option>
                  <option>Yarn</option>
                  <option>Fabric</option>
                  <option>Garment / made-up</option>
                  <option>Other textile</option>
                </select>
              </Field>
              {form.productCategory === 'Yarn' ? (
                <>
                  <Field label="Yarn type" required>
                    <select required value={form.yarnType} onChange={(event) => setForm((current) => ({ ...current, yarnType: event.target.value, yarnSubtype: '', yarnId: '', productName: '', productCode: '' }))} className={inputClass}>
                      <option value="">{catalogLoading ? 'Loading yarn types…' : 'Select yarn type'}</option>
                      {yarnTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </Field>
                  <Field label="Yarn subtype / composition" required>
                    <select required value={form.yarnSubtype} onChange={(event) => setForm((current) => ({ ...current, yarnSubtype: event.target.value, yarnId: '', productName: '', productCode: '' }))} className={inputClass}>
                      <option value="">Select a valid type and composition</option>
                      {yarnSubtypes.map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}
                    </select>
                  </Field>
                  <Field label="Product name" required>
                    <select required value={form.yarnId} onChange={(event) => {
                      const item = yarnCatalog.find((candidate) => candidate.yarnId === event.target.value)
                      setForm((current) => ({
                        ...current,
                        yarnId: item?.yarnId ?? '',
                        productName: item?.yarnName ?? '',
                        productCode: item?.productCode ?? '',
                        yarnType: item?.category ?? current.yarnType,
                        yarnSubtype: item ? `${item.materialComposition} · ${item.denierSpecification}` : current.yarnSubtype,
                        materialComposition: item?.materialComposition ?? '',
                        denierCount: item?.denierSpecification ?? '',
                        shade: item?.colourShade ?? '',
                        unit: item?.unit.toLowerCase().includes('meter') ? 'metres' : 'kg',
                      }))
                    }} className={inputClass}>
                      <option value="">{!form.yarnType || !form.yarnSubtype ? 'Choose yarn type and subtype first' : 'Select product'}</option>
                      {matchingYarns.map((item) => <option key={item.yarnId} value={item.yarnId}>{item.yarnName} ({item.productCode})</option>)}
                    </select>
                  </Field>
                  {catalogError ? <p role="alert" className="sm:col-span-2 rounded-lg bg-error/5 p-3 text-sm text-error">{catalogError}</p> : null}
                  {!catalogLoading && !yarnCatalog.length ? <p className="sm:col-span-2 text-sm text-muted">No yarn products are currently listed in inventory.</p> : null}
                </>
              ) : form.productCategory === 'Fabric' ? (
                <>
                  <Field label="Fabric category" required>
                    <select required value={form.yarnType} onChange={(event) => setForm((current) => ({ ...current, yarnType: event.target.value, productName: '', productCode: '', materialComposition: '', technicalSpecifications: '' }))} className={inputClass}>
                      <option value="">{catalogLoading ? 'Loading fabric categories…' : 'Select a fabric category'}</option>
                      {[...new Set(fabricCatalog.map((item) => item.fabricCategory))].sort().map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </Field>
                  <Field label="Fabric product" required>
                    <select required value={form.productCode} onChange={(event) => {
                      const item = fabricCatalog.find((candidate) => candidate.recipeCode === event.target.value)
                      setForm((current) => ({
                        ...current,
                        productName: item?.fabricName ?? '',
                        productCode: item?.recipeCode ?? '',
                        materialComposition: item?.ingredients.map((ingredient) => `${ingredient.yarnType} ${ingredient.specification}`).join(' + ') ?? '',
                        technicalSpecifications: item?.construction ?? '',
                      }))
                    }} className={inputClass}>
                      <option value="">Select a fabric recipe</option>
                      {matchingFabrics.map((item) => <option key={item.recipeCode} value={item.recipeCode}>{item.fabricName} ({item.recipeCode})</option>)}
                    </select>
                  </Field>
                  {!catalogLoading && !fabricCatalog.length ? <p className="sm:col-span-2 text-sm text-muted">No active fabric recipes are listed in inventory.</p> : null}
                </>
              ) : (
                <>
                  <Field label="Product name" required>
                    <input required value={form.productName} onChange={(event) => setField('productName', event.target.value)} className={inputClass} placeholder="Enter requested product" />
                  </Field>
                  <Field label="Product code (if available)">
                    <input value={form.productCode} onChange={(event) => setField('productCode', event.target.value)} className={inputClass} />
                  </Field>
                </>
              )}
              {form.productCategory !== 'Fabric' ? (
                <>
                  <Field label="Material composition" required>
                    <input required value={form.materialComposition} onChange={(event) => setField('materialComposition', event.target.value)} className={inputClass} placeholder="e.g. 100% organic cotton" />
                  </Field>
                  <Field label="Denier / count (if applicable)">
                    <input value={form.denierCount} onChange={(event) => setField('denierCount', event.target.value)} className={inputClass} placeholder="e.g. 30s Ne / 150D" />
                  </Field>
                </>
              ) : null}
              <Field label="Colour / shade" required>
                <input required value={form.shade} onChange={(event) => setField('shade', event.target.value)} className={inputClass} placeholder="Name or shade reference" />
              </Field>
              <Field label="Technical specifications" className="sm:col-span-2">
                <textarea value={form.technicalSpecifications} onChange={(event) => setField('technicalSpecifications', event.target.value)} rows={3} className={`${inputClass} h-auto py-2`} placeholder="Twist, finish, tolerances, construction or other specifications" />
              </Field>
              <Field label="Special requirements" className="sm:col-span-2">
                <textarea value={form.specialRequirements} onChange={(event) => setField('specialRequirements', event.target.value)} rows={2} className={`${inputClass} h-auto py-2`} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Quantity & delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Required quantity" required>
                <input required type="number" min="0.01" step="any" value={form.quantity} onChange={(event) => setField('quantity', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Unit" required>
                <select value={form.unit} onChange={(event) => setField('unit', event.target.value as OrderForm['unit'])} className={inputClass}>
                  <option value="kg">kg</option>
                  <option value="metres" disabled={form.productCategory === 'Fabric'}>metres</option>
                </select>
                {form.productCategory === 'Fabric' ? <span className="mt-1 block text-xs text-muted">Fabric recipe ingredients are defined in kg, so this order is measured in kg.</span> : null}
              </Field>
              <Field label="Order priority">
                <select value={form.priority} onChange={(event) => setField('priority', event.target.value as OrderForm['priority'])} className={inputClass}>
                  <option>Standard</option>
                  <option>Urgent</option>
                  <option>Flexible</option>
                </select>
              </Field>
              <Field label="Requested delivery date" required>
                <input required type="date" min={earliestDeliveryDate} value={form.requestedDeliveryDate} onChange={(event) => setField('requestedDeliveryDate', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Delivery address" required className="sm:col-span-2">
                <textarea required rows={2} value={form.deliveryAddress} onChange={(event) => setField('deliveryAddress', event.target.value)} className={`${inputClass} h-auto py-2`} />
              </Field>
              <Field label="Delivery instructions" className="sm:col-span-2">
                <textarea rows={2} value={form.deliveryInstructions} onChange={(event) => setField('deliveryInstructions', event.target.value)} className={`${inputClass} h-auto py-2`} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Commercial & additional information</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Target price or quotation request">
                <input value={form.targetPrice} onChange={(event) => setField('targetPrice', event.target.value)} className={inputClass} placeholder="Optional target price; leave blank to request a quotation" />
              </Field>
              <Field label="Buyer notes">
                <textarea rows={3} value={form.buyerNotes} onChange={(event) => setField('buyerNotes', event.target.value)} className={`${inputClass} h-auto py-2`} placeholder="Anything else the buyer should consider" />
              </Field>
            </div>
            <p className="mt-3 text-xs text-muted">File attachments are not supported by this local demo. Add colour-reference or specification details in the notes above.</p>
          </section>

          {error ? <div role="alert" className="rounded-xl border border-error/40 bg-error/5 p-3 text-sm font-medium text-error"><p>{error}</p></div> : null}
          <div className="flex justify-end">
            <button type="submit" className={buttonClass('primary', 'md')}>Review order <ArrowRight className="h-4 w-4" /></button>
          </div>
        </form>
      ) : (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-ink">Review & submit</h2>
              <p className="mt-1 text-sm text-muted">Confirm the buyer details and requirements before creating the order.</p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Buyer', `${buyerForm.companyName} · ${buyerForm.buyerName}`],
              ['Contact', `${buyerForm.buyerEmail} · ${buyerForm.dialCode} ${buyerForm.phone}`],
              ['Location', `${buyerForm.city}, ${buyerForm.country} ${buyerForm.postalCode}`],
              ['Category / product', `${form.productCategory} · ${form.productName}`],
              ['Yarn', `${form.yarnType}${form.yarnSubtype ? ` / ${form.yarnSubtype}` : ''}`],
              ['Product code', form.productCode || 'Not provided'],
              ['Composition', form.materialComposition || 'Not provided'],
              ['Technical specifications', form.technicalSpecifications || 'Not provided'],
              ['Denier / count', form.denierCount || 'Not applicable'],
              ['Colour / shade', form.shade || 'Not provided'],
              ['Special requirements', form.specialRequirements || 'None'],
              ['Quantity', `${form.quantity} ${form.unit} · ${form.priority} priority`],
              ['Requested delivery', form.requestedDeliveryDate || 'Not specified'],
              ['Delivery address', form.deliveryAddress || 'Not provided'],
              ['Delivery instructions', form.deliveryInstructions || 'None'],
              ['Target price / quotation', form.targetPrice || 'Please provide a quotation'],
              ['Buyer notes', form.buyerNotes || 'None'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-canvas p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted">Creating the order sets its status to <strong className="text-ink">Submitted</strong> and sends it to incoming order review. Material availability remains unchecked until Ram records a check.</p>
          {error ? <p role="alert" className="mt-4 rounded-xl border border-error/40 bg-error/5 p-3 text-sm font-medium text-error">{error}</p> : null}
          <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button type="button" onClick={() => setStep('form')} className={buttonClass('secondary', 'md')}>Edit requirements</button>
            <button type="button" disabled={submitting} onClick={submitOrder} className={buttonClass('primary', 'md', 'disabled:cursor-not-allowed disabled:opacity-60')}>
              {submitting ? 'Creating order…' : 'Create order'}
            </button>
          </div>
          {submittedOrderId ? (
            <p className="mt-3 text-sm text-muted">Created order <span className="font-semibold text-ink">{submittedOrderId}</span>. Redirecting…</p>
          ) : null}
        </section>
      )}
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
  const [actionPending, setActionPending] = useState(false)
  const [schedulingPending, setSchedulingPending] = useState(false)
  const [actionProgress, setActionProgress] = useState('')
  const material = order ? getMaterialAvailability(order.id) : null
  const approvalBlockReason = !material
    ? 'Run the material availability check before approval.'
    : material.consumedAt
      ? order?.productionJobId
        ? 'Production jobs have already been scheduled for this order.'
        : ''
    : !['Raw material inventory', 'Fabric recipe inventory'].includes(material.source)
      ? 'Approval requires a check against live inventory or a fabric recipe, not a manual/demo quantity.'
    : material.status !== 'Available'
      ? `Approval requires enough material. Current check: ${material.status}${material.shortageQuantity > 0 ? ` (${material.shortageQuantity} ${material.unit} short)` : ''}.`
      : !reviewConfirmed
        ? 'Confirm that you reviewed the product, commercial and delivery requirements.'
        : ''

  useEffect(() => {
    if (!actionPending || !schedulingPending) return
    const machineCheckTimer = window.setTimeout(
      () => setActionProgress('Finding compatible machines and checking their production windows…'),
      3000,
    )
    const scheduleTimer = window.setTimeout(
      () => setActionProgress('The production route is still being scheduled. Keep this page open; this can take a little while.'),
      10000,
    )
    return () => {
      window.clearTimeout(machineCheckTimer)
      window.clearTimeout(scheduleTimer)
    }
  }, [actionPending, schedulingPending])
  void revision

  if (!order) {
    return <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">Order not found. Open an order from Incoming Orders to review it.</div>
  }

  const reviewer = session?.name ?? 'Admin reviewer'
  const refresh = () => setRevision((value) => value + 1)

  const handleMaterialCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      let result: Awaited<ReturnType<typeof recordDemoMaterialAvailability>>
      if (order.yarnId) {
        result = await recordInventoryMaterialAvailability(order.id, materialNote)
      } else if (order.productCategory === 'Fabric') {
        result = await recordDemoMaterialAvailability(order.id, 0, materialNote)
      } else {
        const quantity = Number(availableQuantity)
        if (!Number.isFinite(quantity) || quantity < 0) {
          setError('Enter a valid available quantity (zero or more).')
          return
        }
        result = await recordDemoMaterialAvailability(order.id, quantity, materialNote)
      }
      if (!result) throw new Error('Unable to save the material check for this order.')
      setFeedback(order.yarnId || order.productCategory === 'Fabric'
        ? `Live ${order.productCategory === 'Fabric' ? 'recipe inventory' : 'inventory'} check recorded: ${result.status}.`
        : `Demo material check recorded: ${result.status}.`)
      setAvailableQuantity('')
      setMaterialNote('')
      refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the material check.')
    }
  }

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!reviewNote.trim()) {
      setError('Enter an internal note before saving.')
      return
    }
    let savedNote: Awaited<ReturnType<typeof addOrderReviewNote>>
    try {
      savedNote = await addOrderReviewNote(order.id, reviewNote.trim(), reviewer)
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

  const handleAction = async (
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
    setError('')
    setActionPending(true)
    setSchedulingPending(action === 'approved')
    setActionProgress(action === 'approved'
      ? 'Sending this order to production and reserving machine time…'
      : 'Saving the order decision…')
    let updated: Awaited<ReturnType<typeof recordOrderReviewAction>>
    try {
      updated = await recordOrderReviewAction(order.id, {
        action,
        reviewer,
        note: actionNote,
        nextStatus: status,
        ...(message ? { buyerMessage: message } : {}),
      })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to record this decision.')
      return
    } finally {
      setActionPending(false)
      setSchedulingPending(false)
    }
    if (!updated) {
      setError('Unable to record this decision.')
      return
    }
    setReviewNote('')
    if (action === 'clarification-requested' || action === 'approved' || action === 'rejected') setBuyerMessage('')
    setFeedback(action === 'approved' && updated.productionJobId
      ? `Order scheduled for production. Machine assignments are reserved; first job #${updated.productionJobId}.`
      : `Decision recorded for ${order.id}: ${updated.status}.`)
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
      {actionPending ? (
        <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-ink">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />
          <div>
            <p className="font-semibold">{actionProgress}</p>
            {schedulingPending ? <p className="mt-1 text-xs text-muted">The system is checking live inventory, building the route, and reserving each machine step.</p> : null}
          </div>
        </div>
      ) : null}

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
            <h2 className="text-lg font-semibold text-ink">Material availability</h2>
            {material ? (
              <>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${material.status === 'Available' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{material.status}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-warning">{material.source === 'Ram demo check' ? 'Manual demo check' : material.source === 'Fabric recipe inventory' ? 'Live recipe + inventory' : 'Live inventory'}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SummaryTile label="Available" value={`${material.availableQuantity} ${material.unit}`} />
                  <SummaryTile label="Required" value={`${material.requiredQuantity} ${material.unit}`} />
                  <SummaryTile label="Shortage" value={`${material.shortageQuantity} ${material.unit}`} />
                </div>
                {material.components?.length ? <div className="mt-4 space-y-2">
                  {material.components.map((component) => <div key={`${component.yarnId ?? component.material}-${component.material}`} className="flex flex-wrap justify-between gap-2 rounded-lg bg-canvas px-3 py-2 text-xs">
                    <span className="font-medium text-ink">{component.material}{component.yarnId ? ` · ${component.yarnId}` : ''}</span>
                    <span className={component.shortageQuantity > 0 ? 'font-semibold text-warning' : 'text-muted'}>{component.availableQuantity} / {component.requiredQuantity} {component.unit}{component.shortageQuantity > 0 ? ` · short ${component.shortageQuantity}` : ''}</span>
                  </div>)}
                </div> : null}
                <p className="mt-3 text-xs text-muted">Checked by {material.checkedBy} · {new Date(material.checkedAt).toLocaleString()}</p>
                {material.notes ? <p className="mt-2 rounded-xl bg-canvas p-3 text-sm text-muted">{material.notes}</p> : null}
              </>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-line bg-canvas p-4 text-sm text-muted">{order.yarnId ? 'Live inventory has not been checked yet. Use the check below to read current stock for the selected yarn.' : 'This order is not linked to an inventory row, so availability needs a manual demo value and cannot verify real stock.'}</p>
            )}
            <form onSubmit={handleMaterialCheck} className="mt-5 space-y-3 border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">{order.yarnId ? 'Check linked inventory stock' : 'Manual demo check'}</p>
              <p className="text-xs text-muted">{order.yarnId ? 'Reads the selected yarn row from raw material inventory. This check does not reserve or consume stock.' : order.productCategory === 'Fabric' ? 'Scales the selected recipe to this order quantity and checks each required yarn against live stock.' : 'For workflow testing only; this order is not linked to a raw material inventory row.'}</p>
              {!order.yarnId && order.productCategory !== 'Fabric' ? <label className="block text-sm font-medium text-ink">Available quantity ({order.unit})
                <input required type="number" min="0" step="any" value={availableQuantity} onChange={(event) => setAvailableQuantity(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink" />
              </label> : null}
              <label className="block text-sm font-medium text-ink">Material notes
                <textarea rows={2} value={materialNote} onChange={(event) => setMaterialNote(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" />
              </label>
              <div className="flex justify-end"><button type="submit" className={buttonClass('secondary', 'md')}>{order.yarnId ? 'Check live inventory' : order.productCategory === 'Fabric' ? 'Check recipe inventory' : 'Record demo material check'}</button></div>
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
                <button type="button" disabled={actionPending} onClick={() => handleAction('clarification-requested', 'Clarification Required')} className={buttonClass('secondary', 'md', 'disabled:cursor-not-allowed disabled:opacity-50')}>Request clarification</button>
                <button type="button" disabled={actionPending} onClick={() => handleAction('rejected', 'Rejected')} className="inline-flex h-11 items-center justify-center rounded-lg border border-error/40 px-5 text-sm font-semibold text-error disabled:cursor-not-allowed disabled:opacity-50">Reject with reason</button>
                <button type="button" disabled={Boolean(approvalBlockReason) || actionPending} title={approvalBlockReason || undefined} onClick={() => handleAction('approved', 'Accepted')} className={buttonClass('primary', 'md', 'disabled:cursor-not-allowed disabled:opacity-50')}>
                  {actionPending && schedulingPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending to production…</> : material?.consumedAt && !order.productionJobId ? 'Schedule production jobs' : 'Approve for production planning'}
                </button>
              </div>
              {approvalBlockReason ? <p className="text-xs text-muted">{approvalBlockReason}</p> : null}
              <p className="text-xs text-muted">{order.productCategory === 'Yarn' ? 'Approval allocates live yarn stock and schedules the inferred yarn process, dyeing when the selected shade requires it, and finishing on configured factory machines. Previously allocated stock is not consumed again when scheduling is retried.' : 'Approval allocates the live yarn requirements and schedules the inferred production route. Stock movements, order approval, and production jobs commit together.'}</p>
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
  const [, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(inquiries[0]?.id ?? '')
  const inquiry = inquiries.find((entry) => entry.id === selectedId) ?? inquiries[0]

  const handleRespond = async () => {
    if (!inquiry) return
    await respondToInquiry(inquiry.id, 'Thanks for the update. We are reviewing the latest production plan and will respond shortly.')
    setRevision((value) => value + 1)
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
                <button type="button" onClick={() => void updateInquiryStatus(inquiry.id, 'Resolved').then(() => setRevision((value) => value + 1))} className={buttonClass('secondary', 'md')}>Mark resolved</button>
                <button type="button" onClick={() => void handleRespond()} className={buttonClass('primary', 'md')}>Reply</button>
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
  const [scheduledJobs, setScheduledJobs] = useState<import('../types').Job[]>([])
  const [jobLoadError, setJobLoadError] = useState('')
  const orderIds = productionOrders.map((order) => order.id).join('|')

  useEffect(() => {
    if (title !== 'Production Management') return
    let active = true
    productionApi.jobs({ page: 1, page_size: 100 })
      .then((result) => {
        if (active) setScheduledJobs(result.items.filter((job) => productionOrders.some((order) => order.id === job.order_ref)))
      })
      .catch((loadError: unknown) => {
        if (active) setJobLoadError(loadError instanceof Error ? loadError.message : 'Could not load assigned production jobs.')
      })
    return () => { active = false }
  }, [title, orderIds])

  return (
    <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{description}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SummaryTile label="Current status" value={title === 'Production Management' ? 'Scheduled jobs' : 'Awaiting integration'} />
        <SummaryTile label="Orders covered" value={title === 'Production Management' ? 'Linked to buyer orders' : 'Linked via orderId'} />
        <SummaryTile label="Next step" value={title === 'Production Management' ? 'Track assigned machine jobs' : 'Connect module API'} />
      </div>
      {title === 'Production Management' ? (
        <section className="mt-8 border-t border-line pt-6">
          <h2 className="text-lg font-semibold text-ink">Approved orders and assigned production jobs</h2>
          <p className="mt-1 text-sm text-muted">Each scheduled process is linked to its buyer order and assigned machine.</p>
          <div className="mt-4 space-y-3">
            {productionOrders.length === 0
              ? <p className="rounded-xl bg-canvas p-4 text-sm text-muted">No approved orders are ready for production planning.</p>
              : productionOrders.map((order) => (
                <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas p-4">
                  <span><span className="font-semibold text-primary">{order.id}</span><span className="ml-3 text-sm text-ink">{order.productName} · {order.quantity} {order.unit}</span>{order.productionJobId ? <span className="ml-2 text-xs text-muted">First job #{order.productionJobId}</span> : null}</span>
                  <span className="text-xs font-semibold text-muted">{order.status} · {order.companyName}</span>
                </Link>
              ))}
          </div>
          {jobLoadError ? <p role="alert" className="mt-4 text-sm text-error">{jobLoadError}</p> : null}
          {scheduledJobs.length ? <div className="mt-5 overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-canvas text-xs uppercase text-muted"><tr><th className="p-3">Job</th><th className="p-3">Order</th><th className="p-3">Process</th><th className="p-3">Machine</th><th className="p-3">Status</th><th className="p-3">Planned window</th></tr></thead><tbody>{scheduledJobs.map((job) => <tr key={job.id} className="border-t border-line"><td className="p-3 font-semibold">#{job.id}</td><td className="p-3">{job.order_ref}</td><td className="p-3">{job.required_process}</td><td className="p-3">#{job.machine_id}</td><td className="p-3">{job.status}</td><td className="p-3">{job.planned_start ? new Date(job.planned_start).toLocaleString() : 'Unscheduled'}</td></tr>)}</tbody></table></div> : productionOrders.length ? <p className="mt-4 text-sm text-muted">No machine jobs are linked to these accepted orders yet.</p> : null}
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

function Field({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}>  <span className="mb-2 block text-sm font-medium text-ink">{label}{required ? <span className="ml-1 text-error">*</span> : null}</span>{children}</label>
}

export default AdminRouteGuard
