import { qualityApi, machinesApi, apiErrorMessage } from './api'
import type {
  ActiveJob,
  CreateInspectionInput,
  DashboardBundle,
  InspectionCount,
  InspectionFilters,
  InspectionWire,
  MachineRef,
  QualityInspection,
} from '../types/quality'

/**
 * API-backed quality service (Anand's Feature 03 contract, persisted).
 * All records come from the FastAPI backend (quality_inspections table);
 * no demo/seed data is ever shown as live factory data.
 */

export const DEFECT_TYPES = [
  'Holes',
  'Colour mismatch',
  'Uneven weaving',
  'Oil stain',
  'Selvedge damage',
  'Weft bar',
] as const

/** Flagging rule mirrored from the backend (documented, not a validated factory parameter). */
export const FLAG_RULE = {
  defectRatePer100m: 0.5,
  passRatePct: 80,
}

function toInspection(w: InspectionWire): QualityInspection {
  return {
    id: w.id,
    jobId: w.job_id,
    rollId: w.roll_id,
    batchNo: w.batch_no,
    orderId: w.order_ref,
    machineId: w.machine_code,
    machineIdNum: w.machine_id,
    machineName: w.machine_name,
    jobStatus: w.job_status,
    inspectedAt: w.inspected_at,
    employeeId: w.employee_id,
    inspectorName: w.inspector_name,
    inspectedQtyMeters: w.inspected_qty_meters,
    acceptedQtyMeters: w.accepted_qty_meters,
    defects: w.defects ?? [],
    totalDefectCount: w.total_defect_count,
    outcome: w.outcome,
    remarks: w.remarks,
    source: w.source,
  }
}

/** All machines (real DB records) as quality display refs (code/name/process). */
export async function getMachines(): Promise<MachineRef[]> {
  try {
    const page = await machinesApi.list({ page_size: 100 })
    return page.items.map((m) => ({
      machineId: m.id,
      id: m.code,
      name: m.name,
      process: m.supported_processes,
    }))
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}

/** Job available for inspection on a machine (numeric id), or null when nothing to inspect. */
export async function getMachineJob(machineIdNum: number): Promise<ActiveJob | null> {
  try {
    const j = await qualityApi.inspectableJob(machineIdNum)
    if (!j) return null
    return {
      jobId: j.job_id,
      machineId: j.machine_code,
      machineIdNum: j.machine_id,
      status: j.status,
      batchNo: j.batch_no,
      orderId: j.order_ref,
      startedAt: j.started_at,
      plannedQtyMeters: j.planned_qty_meters,
      producedQtyMeters: j.produced_qty_meters,
    }
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}

/** Next roll ID for a job — same endpoint used when an inspection is saved. */
export async function previewRollId(jobId: number): Promise<string> {
  try {
    const r = await qualityApi.rollPreview(jobId)
    return r.roll_id
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}

export async function getInspections(filters?: InspectionFilters): Promise<QualityInspection[]> {
  try {
    const page = await qualityApi.inspections({
      search: filters?.search?.trim() || undefined,
      outcome: filters?.outcome && filters.outcome !== 'All' ? filters.outcome : undefined,
      machine_code: filters?.machineId && filters.machineId !== 'All' ? filters.machineId : undefined,
      job_id: filters?.jobId,
      page_size: 500,
    })
    return page.items.map(toInspection)
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}

export async function createInspection(input: CreateInspectionInput): Promise<QualityInspection> {
  try {
    const w = await qualityApi.createInspection({
      job_id: input.jobId,
      employee_id: input.employeeId,
      inspector_name: input.inspectorName,
      inspected_at: input.inspectedAt,
      inspected_qty_meters: input.inspectedQtyMeters,
      defects: input.defects,
      remarks: input.remarks,
      machine_code: input.machineCode,
    })
    return toInspection(w)
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}

export async function updateInspection(
  id: number,
  patch: { outcome?: QualityInspection['outcome']; remarks?: string },
): Promise<QualityInspection> {
  try {
    const w = await qualityApi.updateInspection(id, patch)
    return toInspection(w)
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}

/** One call that loads everything the quality dashboard needs (server-computed). */
export async function getDashboardBundle(): Promise<DashboardBundle> {
  try {
    const w = await qualityApi.dashboard()
    return {
      stats: {
        totalInspections: w.stats.total_inspections,
        efficiencyPct: w.stats.efficiency_percent,
        passRatePct: w.stats.pass_rate_percent,
        defectRatePer100m: w.stats.defect_rate_per_100m,
        reworkCount: w.stats.rework_count,
        rejectedCount: w.stats.rejected_count,
        machinesFlagged: w.stats.machines_flagged,
      },
      trend: w.trend.map((t) => ({
        date: t.date,
        defectRatePer100m: t.defect_rate_per_100m,
        inspections: t.inspections,
      })),
      byType: w.by_type.map((b) => ({ type: b.type, count: b.count })),
      summaries: w.summaries.map((s) => ({
        machine: {
          machineId: s.machine.machine_id,
          id: s.machine.id,
          name: s.machine.name,
          process: s.machine.process,
          outputMeters: s.machine.output_meters,
          downtimeHours: s.machine.downtime_hours,
        },
        inspections: s.inspections,
        approved: s.approved,
        rework: s.rework,
        rejected: s.rejected,
        inspectedQtyMeters: s.inspected_qty_meters,
        acceptedQtyMeters: s.accepted_qty_meters,
        totalDefects: s.total_defects,
        defectRatePer100m: s.defect_rate_per_100m,
        passRatePct: s.pass_rate_percent,
        efficiencyPct: s.efficiency_percent,
        needsInvestigation: s.needs_investigation,
        flagReason: s.flag_reason,
      })),
      matrix: w.matrix.map((m) => ({
        machineId: m.machine_id,
        machineName: m.machine_name,
        counts: m.counts,
        total: m.total,
      })),
    }
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}

/** Per-job inspection counts for the production board cross-link. */
export async function getInspectionCounts(): Promise<Record<number, InspectionCount>> {
  try {
    const rows = await qualityApi.inspectionCounts()
    const map: Record<number, InspectionCount> = {}
    for (const r of rows) {
      map[r.job_id] = { jobId: r.job_id, count: r.count, latestInspectionId: r.latest_inspection_id }
    }
    return map
  } catch (err) {
    throw new Error(apiErrorMessage(err))
  }
}
