import type {
  ActiveJob,
  ApiInspection,
  ApiMachineSummary,
  CreateInspectionInput,
  DashboardBundle,
  DefectSeverity,
  InspectionFilters,
  MachineRef,
  QualityInspection,
} from '../types/quality'
import { EMPLOYEES } from './employeeService'
import { machinesApi, productionApi, qualityApi } from './api'

/**
 * Quality data service — everything below is fetched from the backend:
 * - machines         -> GET /machines
 * - active job       -> GET /production/jobs
 * - inspections      -> GET/POST /quality/inspections
 * - dashboard        -> GET /quality/dashboard
 * No hardcoded factory data lives here.
 */

export const DEFECT_TYPES = [
  'Holes',
  'Colour mismatch',
  'Uneven weaving',
  'Oil stain',
  'Selvedge damage',
  'Weft bar',
] as const

let machinesCache: Promise<MachineRef[]> | null = null
const machineNames = new Map<string, string>()
const machineApiIds = new Map<string, number>()

export function getMachines(): Promise<MachineRef[]> {
  if (!machinesCache) {
    machinesCache = machinesApi
      .list({ page: 1, page_size: 100 })
      .then((page) => {
        const list: MachineRef[] = page.items.map((m) => ({
          id: m.code,
          name: m.name,
          process: m.supported_processes.split(',')[0]?.trim() || m.machine_type,
        }))
        machineNames.clear()
        machineApiIds.clear()
        for (const item of page.items) {
          machineNames.set(item.code, item.name)
          machineApiIds.set(item.code, item.id)
        }
        return list
      })
      .catch((err: unknown) => {
        machinesCache = null
        throw err
      })
  }
  return machinesCache
}

/** Machine display name — falls back to the code until the machine list has loaded. */
export function getMachineName(machineId: string): string {
  return machineNames.get(machineId) ?? machineId
}

/** Active production job on a machine (IN_PROGRESS), or null when the machine is idle. */
export async function getMachineJob(machineId: string): Promise<ActiveJob | null> {
  await getMachines()
  const apiId = machineApiIds.get(machineId)
  if (!apiId) return null
  const page = await productionApi.jobs({ machine_id: apiId, page: 1, page_size: 20 })
  const job = page.items.find((j) => j.status === 'IN_PROGRESS')
  if (!job) return null
  return {
    machineId,
    batchNo: `BATCH-${job.id}`,
    orderId: job.order_ref,
    startedAt: (job.actual_start ?? job.planned_start ?? job.created_at).slice(0, 10),
    plannedQtyMeters: job.planned_quantity,
    producedQtyMeters: job.actual_quantity,
  }
}

/** Next roll ID for a batch — same value the backend will assign on save. */
export function previewRollId(batchNo: string): Promise<string> {
  return qualityApi.rollId(batchNo).then((r) => r.roll_id)
}

function toInspection(raw: ApiInspection): QualityInspection {
  return {
    id: raw.code,
    rollId: raw.roll_id,
    batchNo: raw.batch_no,
    orderId: raw.order_ref,
    machineId: raw.machine_code,
    inspectedAt: raw.inspected_at,
    employeeId: raw.employee_id,
    inspectorName: raw.inspector_name,
    inspectedQtyMeters: raw.inspected_qty_meters,
    acceptedQtyMeters: raw.accepted_qty_meters,
    defects: raw.defects.map((d) => ({
      type: d.type,
      count: d.count,
      severity: d.severity as DefectSeverity,
      ...(d.remarks ? { remarks: d.remarks } : {}),
    })),
    totalDefectCount: raw.total_defect_count,
    outcome: raw.outcome,
    remarks: raw.remarks ?? undefined,
    source: raw.source,
  }
}

export async function getInspections(filters?: InspectionFilters): Promise<QualityInspection[]> {
  const search = filters?.search?.trim() || undefined
  const outcome = filters?.outcome && filters.outcome !== 'All' ? filters.outcome : undefined
  const machineCode = filters?.machineId && filters.machineId !== 'All' ? filters.machineId : undefined
  const page = await qualityApi.inspections({
    search,
    outcome,
    machine_code: machineCode,
    page: 1,
    page_size: 100,
  })
  return page.items.map(toInspection)
}

export async function createInspection(input: CreateInspectionInput): Promise<QualityInspection> {
  const employee = EMPLOYEES.find((e) => e.id === input.employeeId)
  if (!employee) {
    return Promise.reject(new Error('Unknown employee session. Select an employee in the header.'))
  }
  const raw = await qualityApi.create({
    batch_no: input.batchNo,
    order_ref: input.orderId,
    machine_code: input.machineId,
    employee_id: input.employeeId,
    inspector_name: employee.name,
    inspected_at: input.inspectedAt,
    inspected_qty_meters: input.inspectedQtyMeters,
    defects: input.defects.map((d) => ({
      type: d.type,
      count: d.count,
      severity: d.severity,
    })),
    remarks: input.remarks ?? null,
  })
  return toInspection(raw)
}

/** One call that loads everything the quality dashboard needs (server-computed). */
export async function getDashboardBundle(): Promise<DashboardBundle> {
  const raw = await qualityApi.dashboard()
  return {
    stats: {
      totalInspections: raw.stats.total_inspections,
      efficiencyPct: raw.stats.efficiency_pct,
      passRatePct: raw.stats.pass_rate_pct,
      defectRatePer100m: raw.stats.defect_rate_per_100m,
      reworkCount: raw.stats.rework_count,
      rejectedCount: raw.stats.rejected_count,
      machinesFlagged: raw.stats.machines_flagged,
    },
    trend: raw.trend.map((p) => ({
      date: p.date,
      defectRatePer100m: p.defect_rate_per_100m,
      inspections: p.inspections,
    })),
    byType: raw.by_type.map((p) => ({ type: p.type, count: p.count })),
    summaries: raw.summaries.map((s: ApiMachineSummary) => ({
      machine: { id: s.machine.code, name: s.machine.name, process: s.machine.process },
      inspections: s.inspections,
      approved: s.approved,
      rework: s.rework,
      rejected: s.rejected,
      inspectedQtyMeters: s.inspected_qty_meters,
      acceptedQtyMeters: s.accepted_qty_meters,
      totalDefects: s.total_defects,
      defectRatePer100m: s.defect_rate_per_100m,
      passRatePct: s.pass_rate_pct,
      efficiencyPct: s.efficiency_pct,
      needsInvestigation: s.needs_investigation,
      flagReason: s.flag_reason,
    })),
    matrix: raw.matrix.map((row) => ({
      machineId: row.machine_code,
      machineName: row.machine_name,
      counts: row.counts,
      total: row.total,
    })),
  }
}
