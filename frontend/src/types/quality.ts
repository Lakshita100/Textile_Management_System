export type InspectionOutcome = 'Approved' | 'Rework' | 'Rejected'

export type DefectSeverity = 'Low' | 'Medium' | 'High'

export interface DefectRecord {
  type: string
  count: number
  severity: DefectSeverity
  remarks?: string
}

export interface QualityInspection {
  id: string
  rollId: string
  batchNo: string
  orderId: string
  machineId: string
  inspectedAt: string
  employeeId: string
  inspectorName: string
  inspectedQtyMeters: number
  acceptedQtyMeters: number
  defects: DefectRecord[]
  totalDefectCount: number
  outcome: InspectionOutcome
  remarks?: string
  /** Where the record came from. Demo records are never presented as live factory data. */
  source: 'demo-seed' | 'session-entry'
}

/** Production job currently running on a machine (live from /production/jobs). Null = machine idle. */
export interface ActiveJob {
  machineId: string
  batchNo: string
  orderId: string
  startedAt: string
  plannedQtyMeters: number
  /** Actual output produced so far — becomes the inspected quantity. */
  producedQtyMeters: number
}

export interface MachineRef {
  id: string
  name: string
  process: string
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
}

export interface CreateInspectionInput {
  batchNo: string
  orderId: string
  machineId: string
  employeeId: string
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

/* ---------- Backend (snake_case) DTOs for /api/v1/quality/* ---------- */

export interface ApiDefectRecord {
  type: string
  count: number
  severity: string
  remarks?: string | null
}

export interface ApiInspection {
  code: string
  roll_id: string
  batch_no: string
  order_ref: string
  machine_id: number
  machine_code: string
  employee_id: string
  inspector_name: string
  inspected_at: string
  inspected_qty_meters: number
  accepted_qty_meters: number
  total_defect_count: number
  defects: ApiDefectRecord[]
  outcome: InspectionOutcome
  remarks: string | null
  source: 'demo-seed' | 'session-entry'
}

export interface ApiCreateInspection {
  batch_no: string
  order_ref: string
  machine_code: string
  employee_id: string
  inspector_name: string
  inspected_at: string
  inspected_qty_meters: number
  defects: { type: string; count: number; severity: string }[]
  remarks?: string | null
}

export interface ApiRollId {
  roll_id: string
}

export interface ApiMachineRef {
  code: string
  name: string
  process: string
}

export interface ApiDashboardStats {
  total_inspections: number
  efficiency_pct: number
  pass_rate_pct: number
  defect_rate_per_100m: number
  rework_count: number
  rejected_count: number
  machines_flagged: number
}

export interface ApiTrendPoint {
  date: string
  defect_rate_per_100m: number
  inspections: number
}

export interface ApiDefectTypePoint {
  type: string
  count: number
}

export interface ApiMachineSummary {
  machine: ApiMachineRef
  inspections: number
  approved: number
  rework: number
  rejected: number
  inspected_qty_meters: number
  accepted_qty_meters: number
  total_defects: number
  defect_rate_per_100m: number
  pass_rate_pct: number
  efficiency_pct: number
  needs_investigation: boolean
  flag_reason: string
}

export interface ApiMatrixRow {
  machine_code: string
  machine_name: string
  counts: Record<string, number>
  total: number
}

export interface ApiQualityDashboard {
  stats: ApiDashboardStats
  trend: ApiTrendPoint[]
  by_type: ApiDefectTypePoint[]
  summaries: ApiMachineSummary[]
  matrix: ApiMatrixRow[]
}
