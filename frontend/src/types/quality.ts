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

/** Production job currently running on a machine (demo data). Null = machine idle. */
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
  outputMeters: number
  downtimeHours: number
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
