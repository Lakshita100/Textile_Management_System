import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSession } from '../../store/session'
import { useInspectionForm } from '../../store/inspectionFormContext'
import {
  createInspection,
  DEFECT_TYPES,
  getMachineJob,
  getMachines,
  previewRollId,
} from '../../services/qualityService'
import type { ActiveJob, DefectSeverity } from '../../types/quality'

interface FormDefect {
  type: string
  count: string
  severity: DefectSeverity
}

type JobOutcome =
  | { status: 'error'; message: string }
  | { status: 'ready'; job: ActiveJob | null }

type JobState = { status: 'none' } | { status: 'loading' } | JobOutcome

const SEVERITIES: DefectSeverity[] = ['Low', 'Medium', 'High']

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const inputClass = (hasError: boolean) =>
  `rounded-md border bg-canvas px-3 py-2 text-sm ${hasError ? 'border-title border-2' : ''}`

export default function InspectionFormModal() {
  const { closeForm } = useInspectionForm()
  const { employee } = useSession()
  const machines = getMachines()
  const machineRef = useRef<HTMLSelectElement>(null)

  const [machineId, setMachineId] = useState('')
  const [defects, setDefects] = useState<FormDefect[]>([
    { type: '', count: '1', severity: 'Medium' },
  ])
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [jobResult, setJobResult] = useState<{ machineId: string; outcome: JobOutcome } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [created, setCreated] = useState<{
    id: string
    rollId: string
    toWarehouse: number
  } | null>(null)

  useEffect(() => {
    machineRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeForm()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [closeForm])

  useEffect(() => {
    if (!machineId) return
    let cancelled = false
    getMachineJob(machineId)
      .then((job) => {
        if (!cancelled) setJobResult({ machineId, outcome: { status: 'ready', job } })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setJobResult({
            machineId,
            outcome: {
              status: 'error',
              message: err instanceof Error ? err.message : 'Could not load the active batch.',
            },
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [machineId])

  const jobState: JobState = !machineId
    ? { status: 'none' }
    : jobResult && jobResult.machineId === machineId
      ? jobResult.outcome
      : { status: 'loading' }

  const activeJob = jobState.status === 'ready' ? jobState.job : null

  const setDefect = (index: number, patch: Partial<FormDefect>) => {
    setDefects((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!machineId) next.machineId = 'Select a machine.'
    else if (!activeJob) next.machineId = 'This machine is idle - select a machine with an active batch.'

    defects.forEach((defect, index) => {
      if (!defect.type) next[`defect-${index}`] = 'Choose a type or remove this row.'
      const count = Number(defect.count)
      if (!Number.isInteger(count) || count < 1) {
        next[`defect-count-${index}`] = 'Whole number of 1 or more.'
      }
    })
    return next
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0 || !activeJob) {
      document.getElementById(Object.keys(found)[0] ?? 'machineId')?.focus()
      return
    }

    setSubmitting(true)
    try {
      const result = await createInspection({
        batchNo: activeJob.batchNo,
        orderId: activeJob.orderId,
        machineId,
        employeeId: employee.id,
        inspectedAt: today(),
        inspectedQtyMeters: activeJob.producedQtyMeters,
        defects: defects.map((d) => ({
          type: d.type,
          count: Number(d.count),
          severity: d.severity,
        })),
        remarks: remarks.trim() || undefined,
      })
      setCreated({ id: result.id, rollId: result.rollId, toWarehouse: result.acceptedQtyMeters })
      setDefects([{ type: '', count: '1', severity: 'Medium' }])
      setRemarks('')
      setErrors({})
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save the inspection.')
    } finally {
      setSubmitting(false)
    }
  }

  const inspectedMeters = activeJob?.producedQtyMeters ?? 0
  const totalDefects = defects.reduce((sum, d) => {
    const count = Number(d.count)
    return Number.isInteger(count) && count > 0 ? sum + count : sum
  }, 0)
  const heldMeters = Math.min(inspectedMeters, totalDefects)
  const toWarehouseMeters = inspectedMeters - heldMeters

  const row = (label: string, value: string) => (
    <div className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
      <span className="text-xs uppercase tracking-wide muted">{label}</span>
      <span className="text-sm font-medium text-title">{value}</span>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-title/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeForm()
      }}
    >
      <div className="flex min-h-full items-start justify-center px-4 py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-inspection-title"
          className="card w-full max-w-2xl p-5 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
            <h2 id="new-inspection-title" className="text-lg font-semibold text-title">
              New Inspection
            </h2>
            <button
              type="button"
              className="btn-secondary px-3 py-1.5"
              onClick={closeForm}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {created ? (
            <div
              className="mb-4 rounded-md border border-line border-l-4 border-l-highlight px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-semibold text-title">
                {created.id} saved - roll {created.rollId} - {created.toWarehouse} m to warehouse
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                <button type="button" className="btn-primary px-3 py-1.5" onClick={closeForm}>
                  Done
                </button>
                <button
                  type="button"
                  className="font-medium text-action"
                  onClick={() => setCreated(null)}
                >
                  Record another
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate aria-label="Inspection form">
            <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel px-3 py-2">
              <div>
                <p className="text-xs uppercase tracking-wide muted">Inspector</p>
                <p className="font-medium text-title">{employee.name}</p>
              </div>
              <span className="text-sm muted">{employee.id}</span>
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <label htmlFor="machineId" className="text-sm font-medium text-title">
                Machine <span aria-hidden="true">*</span>
              </label>
              <select
                id="machineId"
                ref={machineRef}
                className={inputClass(Boolean(errors.machineId))}
                value={machineId}
                onChange={(e) => {
                  setMachineId(e.target.value)
                  setErrors((prev) => {
                    const { machineId: _ignored, ...rest } = prev
                    return rest
                  })
                }}
                aria-invalid={Boolean(errors.machineId)}
              >
                <option value="">Select a machine...</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id}) - {m.process}
                  </option>
                ))}
              </select>
              {errors.machineId ? (
                <p role="alert" className="text-sm font-medium text-title">
                  <span aria-hidden="true">! </span>
                  {errors.machineId}
                </p>
              ) : null}
            </div>

            <div className="mt-4 rounded-md border border-line px-3 py-2" aria-label="Job details">
              {jobState.status === 'none' ? (
                <p className="py-1 text-sm muted">Select a machine to load its active batch and order.</p>
              ) : jobState.status === 'loading' ? (
                <p className="py-1 text-sm muted" role="status">
                  Fetching active batch...
                </p>
              ) : jobState.status === 'error' ? (
                <div className="py-1">
                  <p role="alert" className="text-sm font-medium text-title">
                    <span aria-hidden="true">! </span>
                    {jobState.message}
                  </p>
                </div>
              ) : jobState.job ? (
                <div>
                  {row('Status', 'Running')}
                  {row('Batch no', jobState.job.batchNo)}
                  {row('Order', jobState.job.orderId)}
                  {row('Roll ID', previewRollId(jobState.job.batchNo))}
                  {row('Output', `${jobState.job.producedQtyMeters} of ${jobState.job.plannedQtyMeters} m`)}
                  {row('Inspected', `${jobState.job.producedQtyMeters} m`)}
                  {row('Date', today())}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-title">
                    <span aria-hidden="true">! </span> Machine idle
                  </p>
                  <p className="mt-1 text-sm muted">
                    No active batch or order on this machine - inspection cannot be recorded.
                  </p>
                </div>
              )}
            </div>

            <fieldset className="mt-5" disabled={!activeJob}>
              <h3 className="mb-3 text-base font-semibold text-title">Defects</h3>
              <div className="flex flex-col gap-3">
                {defects.map((defect, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-2 gap-3 rounded-md border border-line p-3 sm:grid-cols-[1.4fr_0.6fr_0.8fr_auto]"
                  >
                    <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <label htmlFor={`defect-${index}`} className="text-xs font-medium text-title">
                        Type <span aria-hidden="true">*</span>
                      </label>
                      <select
                        id={`defect-${index}`}
                        className={inputClass(Boolean(errors[`defect-${index}`]))}
                        value={defect.type}
                        onChange={(e) => setDefect(index, { type: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {DEFECT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {errors[`defect-${index}`] ? (
                        <p role="alert" className="text-xs font-medium text-title">
                          {errors[`defect-${index}`]}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`defect-count-${index}`} className="text-xs font-medium text-title">
                        Count <span aria-hidden="true">*</span>
                      </label>
                      <input
                        id={`defect-count-${index}`}
                        type="number"
                        min={1}
                        step="1"
                        className={inputClass(Boolean(errors[`defect-count-${index}`]))}
                        value={defect.count}
                        onChange={(e) => setDefect(index, { count: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`defect-severity-${index}`}
                        className="text-xs font-medium text-title"
                      >
                        Severity
                      </label>
                      <select
                        id={`defect-severity-${index}`}
                        className={inputClass(false)}
                        value={defect.severity}
                        onChange={(e) => setDefect(index, { severity: e.target.value as DefectSeverity })}
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 flex items-end sm:col-span-1">
                      <button
                        type="button"
                        className="btn-secondary w-full sm:w-auto"
                        onClick={() => setDefects((prev) => prev.filter((_, i) => i !== index))}
                        disabled={defects.length === 1}
                        aria-label={`Remove defect ${index + 1}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={() => setDefects((prev) => [...prev, { type: '', count: '1', severity: 'Medium' }])}
              >
                + Add defect
              </button>

              <div className="mt-5 rounded-md border border-line bg-panel px-3 py-3" aria-live="polite">
                <p className="text-xs uppercase tracking-wide muted">Warehouse split</p>
                {inspectedMeters > 0 ? (
                  <div className="mt-1 flex flex-col gap-1 text-sm">
                    <p className="text-copy">
                      Inspected <span className="font-semibold text-title">{inspectedMeters} m</span> =
                      machine output of this batch
                    </p>
                    <p className="text-copy">
                      <span className="font-semibold text-title">{heldMeters} m</span> with defects (
                      {totalDefects} defect{totalDefects === 1 ? '' : 's'}) - held, not sent to warehouse
                    </p>
                    <p className="text-copy">
                      <span className="font-semibold text-title">{toWarehouseMeters} m</span> accepted -
                      goes to warehouse
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm muted">
                    Select a machine with an active batch to see the split.
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-1">
                <label htmlFor="remarks" className="text-sm font-medium text-title">
                  Remarks (optional)
                </label>
                <textarea
                  id="remarks"
                  rows={2}
                  className={`${inputClass(false)} w-full`}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {submitError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-md border border-line px-3 py-2 text-sm font-medium text-title"
                >
                  <span aria-hidden="true">! </span>
                  {submitError}
                </p>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-3">
                <button type="button" className="text-sm" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting || !activeJob}>
                  {submitting ? 'Saving...' : 'Save inspection'}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  )
}
