export type InspectionOutcome = 'Approved' | 'Rework' | 'Rejected'

export type DefectSeverity = 'Low' | 'Medium' | 'High'

export interface DefectRecord {
  type: string
  count: number
  severity: DefectSeverity
  remarks?: string
}

export interface QualityInspection {
  id: number
  jobId: number
  rollId: string
  batchNo: string
  orderId: string
  /** Machine code — Anand's display key. */
  machineId: string
  /** Numeric machine id for API links. */
  machineIdNum: number
  machineName: string
  jobStatus: string
  inspectedAt: string
  employeeId: string
  inspectorName: string
  inspectedQtyMeters: number
  acceptedQtyMeters: number
  defects: DefectRecord[]
  totalDefectCount: number
  outcome: InspectionOutcome
  remarks?: string | null
  /** Where the record came from. Persisted records are always live session entries. */
  source: 'demo-seed' | 'session-entry'
}

/** Production job available for inspection on a machine (from the API). Null = nothing to inspect. */
export interface ActiveJob {
  jobId: number
  /** Machine code. */
  machineId: string
  machineIdNum: number
  status: string
  batchNo: string
  orderId: string
  startedAt: string | null
  plannedQtyMeters: number
  /** Actual output produced so far — becomes the inspected quantity. */
  producedQtyMeters: number
}

export interface MachineRef {
  /** Numeric machine id. */
  machineId: number
  /** Machine code — Anand's display/filter key. */
  id: string
  name: string
  process: string
  /** Real output/downtime — only set where the dashboard computes them (never invented). */
  outputMeters?: number
  downtimeHours?: number
}

export interface OrderRef {
  id: string
  buyer: string
  fabric: string
}

export interface InspectionFilters {
  search?: string
  outcome?: InspectionOutcome | 'All'
  machineId?: string
  jobId?: number
}

export interface CreateInspectionInput {
  jobId: number
  /** Machine cross-check (must match the job's machine). */
  machineCode: string
  employeeId: string
  inspectorName: string
  inspectedAt: string
  inspectedQtyMeters: number
  defects: DefectRecord[]
  remarks?: string
}

export interface DashboardStats {
  totalInspections: number
  efficiencyPct: number
  passRatePct: number
  defectRatePer100m: number
  reworkCount: number
  rejectedCount: number
  machinesFlagged: number
}

export interface MachineDefectMatrixRow {
  machineId: string
  machineName: string
  counts: Record<string, number>
  total: number
}

export interface DashboardBundle {
  stats: DashboardStats
  trend: TrendPoint[]
  byType: DefectTypePoint[]
  summaries: MachineQualitySummary[]
  matrix: MachineDefectMatrixRow[]
}

export interface TrendPoint {
  date: string
  defectRatePer100m: number
  inspections: number
}

export interface DefectTypePoint {
  type: string
  count: number
}

export interface MachineQualitySummary {
  machine: MachineRef
  inspections: number
  approved: number
  rework: number
  rejected: number
  inspectedQtyMeters: number
  acceptedQtyMeters: number
  totalDefects: number
  defectRatePer100m: number
  passRatePct: number
  efficiencyPct: number
  needsInvestigation: boolean
  flagReason: string
}

/** Per-job inspection counts (Jobs board cross-link). */
export interface InspectionCount {
  jobId: number
  count: number
  latestInspectionId: number | null
}

/** Snake_case wire types as returned by the quality API. */
export interface InspectionWire {
  id: number
  job_id: number
  machine_id: number
  machine_code: string
  machine_name: string
  job_status: string
  order_ref: string
  batch_no: string
  roll_id: string
  employee_id: string
  inspector_name: string
  inspected_at: string
  inspected_qty_meters: number
  accepted_qty_meters: number
  defects: DefectRecord[]
  total_defect_count: number
  outcome: InspectionOutcome
  remarks?: string | null
  source: 'demo-seed' | 'session-entry'
  created_at: string
  updated_at: string
}

export interface ActiveJobWire {
  job_id: number
  machine_id: number
  machine_code: string
  status: string
  batch_no: string
  order_ref: string
  started_at: string | null
  planned_qty_meters: number
  produced_qty_meters: number
}

export interface DashboardBundleWire {
  stats: {
    total_inspections: number
    efficiency_percent: number
    pass_rate_percent: number
    defect_rate_per_100m: number
    rework_count: number
    rejected_count: number
    machines_flagged: number
  }
  trend: { date: string; defect_rate_per_100m: number; inspections: number }[]
  by_type: { type: string; count: number }[]
  summaries: {
    machine: {
      machine_id: number
      id: string
      name: string
      process: string
      output_meters: number
      downtime_hours: number
    }
    inspections: number
    approved: number
    rework: number
    rejected: number
    inspected_qty_meters: number
    accepted_qty_meters: number
    total_defects: number
    defect_rate_per_100m: number
    pass_rate_percent: number
    efficiency_percent: number
    needs_investigation: boolean
    flag_reason: string
  }[]
  matrix: { machine_id: string; machine_name: string; counts: Record<string, number>; total: number }[]
}
