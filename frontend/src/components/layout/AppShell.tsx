import { NavLink, Outlet } from 'react-router-dom'
import { useSession } from '../../store/session'
import { useInspectionForm } from '../../store/inspectionFormContext'
import { EMPLOYEES } from '../../services/employeeService'

const qualityNav = [
  { to: '/quality', label: 'Quality Dashboard', end: true },
  { to: '/quality/inspections', label: 'All Inspections', end: true },
]

const otherModules = [
  'Inventory & Suppliers',
  'Orders',
  'Production & Machines',
  'Warehouse & Dispatch',
  'Employees & Accounts',
]

const navItemClass =
  'rounded-md px-3 py-2 text-left text-sm font-medium transition-colors text-copy hover:bg-panel focus-visible:bg-panel'

export default function AppShell() {
  const { employee, setEmployeeId } = useSession()
  const { openForm } = useInspectionForm()

  return (
    <div className="page flex min-h-screen flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-line bg-canvas lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="border-b border-line px-5 py-4">
          <p className="text-lg font-semibold text-title">Textile MS</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-action">
            Quality Management
          </p>
        </div>

        <nav aria-label="Quality module" className="flex flex-col gap-1 px-3 py-4">
          {qualityNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-action text-white'
                    : 'text-copy hover:bg-panel focus-visible:bg-panel'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button type="button" className={navItemClass} onClick={openForm}>
            New Inspection
          </button>
        </nav>

        <div className="border-t border-line px-3 py-4">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide muted">Other modules</p>
          <ul className="mt-2 flex flex-col gap-1">
            {otherModules.map((label) => (
              <li key={label}>
                <span
                  className="block rounded-md px-3 py-2 text-sm text-copy opacity-50"
                  aria-disabled="true"
                  title="Not in this module yet"
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold text-title">Quality Management System</p>
          <label className="flex items-center gap-2 text-xs muted">
            <span>Signed in</span>
            <select
              aria-label="Signed-in employee"
              className="rounded-md border bg-canvas px-2 py-1 text-sm text-title"
              value={employee.id}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              {EMPLOYEES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} - {e.id}
                </option>
              ))}
            </select>
          </label>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
