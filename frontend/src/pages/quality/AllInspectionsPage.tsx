import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews'
import { useAsync } from '../../hooks/useAsync'
import { useInspectionForm } from '../../store/inspectionFormContext'
import { getInspections, getMachines } from '../../services/qualityService'
import { EMPLOYEES } from '../../services/employeeService'

export default function AllInspectionsPage() {
  const { openForm } = useInspectionForm()
  const [searchParams, setSearchParams] = useSearchParams()
  const jobFilter = Number(searchParams.get('job')) || undefined
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [machineId, setMachineId] = useState('All')
  const [inspectorId, setInspectorId] = useState('All')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const machines = useAsync(() => getMachines(), [])
  const inspections = useAsync(
    () => getInspections({ search, machineId, jobId: jobFilter }),
    [search, machineId, jobFilter],
  )

  const rows = (inspections.data ?? []).filter((i) => inspectorId === 'All' || i.employeeId === inspectorId)

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setMachineId('All')
    setInspectorId('All')
    if (jobFilter) setSearchParams({})
  }
  const hasFilters = search !== '' || machineId !== 'All' || inspectorId !== 'All' || Boolean(jobFilter)

  return (
    <div>
      <PageHeader
        title="All Inspections"
        actions={
          <button type="button" className="btn-primary" onClick={openForm}>
            New inspection
          </button>
        }
      />

      <form
        className="card mb-5 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filter inspections"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-search" className="text-sm font-medium text-title">
            Search
          </label>
          <input
            id="filter-search"
            type="search"
            className="rounded-md border bg-canvas px-3 py-2 text-sm"
            placeholder="Roll, batch, order, machine..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-machine" className="text-sm font-medium text-title">
            Machine
          </label>
          <select
            id="filter-machine"
            className="rounded-md border bg-canvas px-3 py-2 text-sm"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
          >
            <option value="All">All machines</option>
            {(machines.data ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-inspector" className="text-sm font-medium text-title">
            Inspector
          </label>
          <select
            id="filter-inspector"
            className="rounded-md border bg-canvas px-3 py-2 text-sm"
            value={inspectorId}
            onChange={(e) => setInspectorId(e.target.value)}
          >
            <option value="All">All inspectors</option>
            {EMPLOYEES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.id})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={clearFilters} disabled={!hasFilters}>
            Clear filters
          </button>
        </div>
      </form>

      {jobFilter ? (
        <div className="card mb-5 flex items-center justify-between gap-3 px-4 py-2 text-sm" role="status">
          <span>
            Filtered by production job <span className="font-semibold text-title">#{jobFilter}</span>
          </span>
          <button type="button" className="font-medium text-action" onClick={clearFilters}>
            Show all inspections
          </button>
        </div>
      ) : null}

      <section className="card min-w-0 overflow-hidden" aria-label="Inspection list">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-title">Inspections</h2>
          <p className="text-sm muted" aria-live="polite">
            {inspections.loading
              ? 'Loading...'
              : `${rows.length} record${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {inspections.loading ? (
          <div className="p-4">
            <LoadingState label="Loading inspections..." />
          </div>
        ) : inspections.error ? (
          <div className="p-4">
            <ErrorState message={inspections.error} onRetry={inspections.reload} />
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="table-header px-4 py-2 text-left">Inspection</th>
                  <th className="table-header px-4 py-2 text-left">Date</th>
                  <th className="table-header px-4 py-2 text-left">Roll / Batch</th>
                  <th className="table-header px-4 py-2 text-left">Order</th>
                  <th className="table-header px-4 py-2 text-left">Machine</th>
                  <th className="table-header px-4 py-2 text-left">Inspector</th>
                  <th className="table-header px-4 py-2 text-right">Inspected (m)</th>
                  <th className="table-header px-4 py-2 text-right">To warehouse (m)</th>
                  <th className="table-header px-4 py-2 text-right">Defects</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((insp) => (
                  <tr key={insp.id} className="border-b border-line hover:bg-panel">
                    <td className="px-4 py-2 font-medium text-title">#{insp.id}</td>
                    <td className="px-4 py-2">{insp.inspectedAt}</td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/app/jobs?job=${insp.jobId}`}
                        className="font-medium text-action hover:underline"
                        title={`Open production job #${insp.jobId}`}
                      >
                        {insp.rollId}
                      </Link>
                      <span className="muted ml-1 text-xs">{insp.batchNo}</span>
                    </td>
                    <td className="px-4 py-2">{insp.orderId}</td>
                    <td className="px-4 py-2">
                      {insp.machineName}
                      <span className="muted ml-1 text-xs">{insp.machineId}</span>
                    </td>
                    <td className="px-4 py-2">
                      {insp.inspectorName}
                      <span className="muted ml-1 text-xs">{insp.employeeId}</span>
                    </td>
                    <td className="px-4 py-2 text-right">{insp.inspectedQtyMeters}</td>
                    <td className="px-4 py-2 text-right">{insp.acceptedQtyMeters}</td>
                    <td className="px-4 py-2 text-right">{insp.totalDefectCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title={hasFilters ? 'No inspections match your filters' : 'No inspections yet'}
              description={hasFilters ? 'Try changing or clearing the filters.' : undefined}
              action={
                hasFilters ? (
                  <button type="button" className="btn-secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : (
                  <button type="button" className="btn-primary" onClick={openForm}>
                    New inspection
                  </button>
                )
              }
            />
          </div>
        )}
      </section>
    </div>
  )
}
