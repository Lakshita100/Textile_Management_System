import type {
  ActiveJob,
  CreateInspectionInput,
  DashboardBundle,
  DashboardStats,
  DefectTypePoint,
  InspectionFilters,
  MachineDefectMatrixRow,
  MachineQualitySummary,
  OrderRef,
  QualityInspection,
  TrendPoint,
} from '../types/quality'
import { EMPLOYEES, employeeIdByName } from './employeeService'

/**
 * DEMO DATA SERVICE — frontend-only phase.
 * All records below are synthetic demo/seed data, NOT live factory records.
 * No backend API is connected yet; session entries live in memory only.
 */

const LATENCY_MS = 450

export const DEFECT_TYPES = [
  'Holes',
  'Colour mismatch',
  'Uneven weaving',
  'Oil stain',
  'Selvedge damage',
  'Weft bar',
] as const

/** Demo flagging rule — not a validated factory parameter. */
export const FLAG_RULE = {
  defectRatePer100m: 0.5,
  passRatePct: 80,
}

const machines = [
  { id: 'M-01', name: 'Loom 01', process: 'Weaving', outputMeters: 12400, downtimeHours: 6 },
  { id: 'M-02', name: 'Loom 02', process: 'Weaving', outputMeters: 9800, downtimeHours: 14 },
  { id: 'M-03', name: 'Dyeing Unit 01', process: 'Dyeing', outputMeters: 8600, downtimeHours: 5 },
  { id: 'M-04', name: 'Printing Unit 01', process: 'Printing', outputMeters: 7200, downtimeHours: 3 },
  { id: 'M-05', name: 'Loom 03', process: 'Weaving', outputMeters: 11500, downtimeHours: 4 },
]

const orders: OrderRef[] = [
  { id: 'ORD-1001', buyer: 'Apex Textiles', fabric: 'Blue cotton fabric' },
  { id: 'ORD-1002', buyer: 'NordWeave GmbH', fabric: 'Grey polyester blend' },
  { id: 'ORD-1003', buyer: 'SariStyle Retail', fabric: 'Printed cotton' },
]

type SeedInspection = Omit<QualityInspection, 'employeeId' | 'batchNo'>

const BATCH_BY_ORDER: Record<string, string> = {
  'ORD-1001': 'BATCH-101',
  'ORD-1002': 'BATCH-102',
  'ORD-1003': 'BATCH-103',
}

const seedInspections: QualityInspection[] = ((): SeedInspection[] => [
  { id: 'QI-001', rollId: 'R-2401', orderId: 'ORD-1001', machineId: 'M-01', inspectedAt: '2026-09-26', inspectorName: 'Meera P.', inspectedQtyMeters: 1200, acceptedQtyMeters: 1180, defects: [{ type: 'Uneven weaving', count: 2, severity: 'Low' }], totalDefectCount: 2, outcome: 'Approved', remarks: 'Minor variation within tolerance.', source: 'demo-seed' },
  { id: 'QI-002', rollId: 'R-2402', orderId: 'ORD-1001', machineId: 'M-02', inspectedAt: '2026-09-27', inspectorName: 'Meera P.', inspectedQtyMeters: 1100, acceptedQtyMeters: 1010, defects: [{ type: 'Holes', count: 4, severity: 'High' }, { type: 'Oil stain', count: 2, severity: 'Medium' }], totalDefectCount: 6, outcome: 'Rework', remarks: 'Pin holes near selvedge.', source: 'demo-seed' },
  { id: 'QI-003', rollId: 'R-2403', orderId: 'ORD-1002', machineId: 'M-03', inspectedAt: '2026-09-28', inspectorName: 'Rahul S.', inspectedQtyMeters: 900, acceptedQtyMeters: 895, defects: [{ type: 'Colour mismatch', count: 1, severity: 'Low' }], totalDefectCount: 1, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-004', rollId: 'R-2404', orderId: 'ORD-1002', machineId: 'M-01', inspectedAt: '2026-09-29', inspectorName: 'Meera P.', inspectedQtyMeters: 1300, acceptedQtyMeters: 1290, defects: [{ type: 'Weft bar', count: 1, severity: 'Low' }], totalDefectCount: 1, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-005', rollId: 'R-2405', orderId: 'ORD-1001', machineId: 'M-02', inspectedAt: '2026-09-30', inspectorName: 'Rahul S.', inspectedQtyMeters: 1000, acceptedQtyMeters: 880, defects: [{ type: 'Holes', count: 6, severity: 'High' }, { type: 'Selvedge damage', count: 3, severity: 'Medium' }], totalDefectCount: 9, outcome: 'Rejected', remarks: 'Damage across full roll length.', source: 'demo-seed' },
  { id: 'QI-006', rollId: 'R-2406', orderId: 'ORD-1003', machineId: 'M-04', inspectedAt: '2026-10-01', inspectorName: 'Anita K.', inspectedQtyMeters: 700, acceptedQtyMeters: 690, defects: [{ type: 'Colour mismatch', count: 2, severity: 'Low' }], totalDefectCount: 2, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-007', rollId: 'R-2407', orderId: 'ORD-1003', machineId: 'M-05', inspectedAt: '2026-10-02', inspectorName: 'Anita K.', inspectedQtyMeters: 1250, acceptedQtyMeters: 1245, defects: [{ type: 'Oil stain', count: 1, severity: 'Low' }], totalDefectCount: 1, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-008', rollId: 'R-2408', orderId: 'ORD-1002', machineId: 'M-02', inspectedAt: '2026-10-03', inspectorName: 'Meera P.', inspectedQtyMeters: 1050, acceptedQtyMeters: 950, defects: [{ type: 'Holes', count: 5, severity: 'High' }, { type: 'Uneven weaving', count: 3, severity: 'Medium' }], totalDefectCount: 8, outcome: 'Rework', remarks: 'Repeat of previous hole issue.', source: 'demo-seed' },
  { id: 'QI-009', rollId: 'R-2409', orderId: 'ORD-1003', machineId: 'M-01', inspectedAt: '2026-10-04', inspectorName: 'Rahul S.', inspectedQtyMeters: 1400, acceptedQtyMeters: 1392, defects: [{ type: 'Weft bar', count: 2, severity: 'Low' }], totalDefectCount: 2, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-010', rollId: 'R-2410', orderId: 'ORD-1001', machineId: 'M-03', inspectedAt: '2026-10-05', inspectorName: 'Anita K.', inspectedQtyMeters: 950, acceptedQtyMeters: 935, defects: [{ type: 'Colour mismatch', count: 3, severity: 'Medium' }], totalDefectCount: 3, outcome: 'Approved', remarks: 'Shade band accepted after review.', source: 'demo-seed' },
  { id: 'QI-011', rollId: 'R-2411', orderId: 'ORD-1003', machineId: 'M-02', inspectedAt: '2026-10-06', inspectorName: 'Meera P.', inspectedQtyMeters: 1000, acceptedQtyMeters: 900, defects: [{ type: 'Holes', count: 4, severity: 'High' }, { type: 'Oil stain', count: 3, severity: 'Medium' }], totalDefectCount: 7, outcome: 'Rework', remarks: '', source: 'demo-seed' },
  { id: 'QI-012', rollId: 'R-2412', orderId: 'ORD-1002', machineId: 'M-05', inspectedAt: '2026-10-07', inspectorName: 'Rahul S.', inspectedQtyMeters: 1300, acceptedQtyMeters: 1296, defects: [{ type: 'Selvedge damage', count: 1, severity: 'Low' }], totalDefectCount: 1, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-013', rollId: 'R-2413', orderId: 'ORD-1002', machineId: 'M-04', inspectedAt: '2026-10-08', inspectorName: 'Anita K.', inspectedQtyMeters: 750, acceptedQtyMeters: 705, defects: [{ type: 'Weft bar', count: 4, severity: 'Medium' }, { type: 'Colour mismatch', count: 2, severity: 'Medium' }], totalDefectCount: 6, outcome: 'Rework', remarks: 'Print alignment off across repeat.', source: 'demo-seed' },
  { id: 'QI-014', rollId: 'R-2414', orderId: 'ORD-1001', machineId: 'M-01', inspectedAt: '2026-10-09', inspectorName: 'Meera P.', inspectedQtyMeters: 1350, acceptedQtyMeters: 1344, defects: [{ type: 'Holes', count: 1, severity: 'Low' }], totalDefectCount: 1, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-015', rollId: 'R-2415', orderId: 'ORD-1001', machineId: 'M-02', inspectedAt: '2026-10-09', inspectorName: 'Rahul S.', inspectedQtyMeters: 1100, acceptedQtyMeters: 970, defects: [{ type: 'Holes', count: 5, severity: 'High' }, { type: 'Uneven weaving', count: 4, severity: 'High' }], totalDefectCount: 9, outcome: 'Rejected', remarks: 'Machine inspection recommended before next run.', source: 'demo-seed' },
  { id: 'QI-016', rollId: 'R-2416', orderId: 'ORD-1003', machineId: 'M-03', inspectedAt: '2026-10-10', inspectorName: 'Anita K.', inspectedQtyMeters: 1000, acceptedQtyMeters: 990, defects: [{ type: 'Colour mismatch', count: 2, severity: 'Low' }], totalDefectCount: 2, outcome: 'Approved', remarks: '', source: 'demo-seed' },
  { id: 'QI-017', rollId: 'R-2417', orderId: 'ORD-1002', machineId: 'M-05', inspectedAt: '2026-10-10', inspectorName: 'Meera P.', inspectedQtyMeters: 1200, acceptedQtyMeters: 1196, defects: [{ type: 'Oil stain', count: 1, severity: 'Low' }], totalDefectCount: 1, outcome: 'Approved', remarks: '', source: 'demo-seed' },
])().map((s) => ({
  ...s,
  employeeId: employeeIdByName(s.inspectorName),
  batchNo: BATCH_BY_ORDER[s.orderId] ?? '—',
}))

let inspections: QualityInspection[] = [...seedInspections]

/** Production jobs currently running on each machine (demo data; null = idle). */
const activeJobs: Record<string, ActiveJob | null> = {
  'M-01': { machineId: 'M-01', batchNo: 'BATCH-101', orderId: 'ORD-1001', startedAt: '2026-10-08', plannedQtyMeters: 5000, producedQtyMeters: 1850 },
  'M-02': { machineId: 'M-02', batchNo: 'BATCH-102', orderId: 'ORD-1002', startedAt: '2026-10-09', plannedQtyMeters: 4200, producedQtyMeters: 2400 },
  'M-03': null,
  'M-04': { machineId: 'M-04', batchNo: 'BATCH-103', orderId: 'ORD-1003', startedAt: '2026-10-10', plannedQtyMeters: 3000, producedQtyMeters: 1200 },
  'M-05': null,
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

function machineName(machineId: string): string {
  return machines.find((m) => m.id === machineId)?.name ?? machineId
}

export function getMachines() {
  return [...machines]
}

export function getOrders() {
  return [...orders]
}

export function getMachineName(machineId: string) {
  return machineName(machineId)
}

export function getOrder(orderId: string) {
  return orders.find((o) => o.id === orderId)
}

/** Active production job on a machine, or null when the machine is idle. */
export function getMachineJob(machineId: string): Promise<ActiveJob | null> {
  return delay(machineId in activeJobs ? activeJobs[machineId] : null)
}

/** Next roll ID for a batch — same formula used when an inspection is saved. */
export function previewRollId(batchNo: string): string {
  const count = inspections.filter((i) => i.rollId.startsWith(`${batchNo}-R`)).length
  return `${batchNo}-R${count + 1}`
}

export function getInspections(filters?: InspectionFilters): Promise<QualityInspection[]> {
  const search = filters?.search?.trim().toLowerCase() ?? ''
  const result = [...inspections]
    .filter((insp) => {
      if (filters?.outcome && filters.outcome !== 'All' && insp.outcome !== filters.outcome) return false
      if (filters?.machineId && filters.machineId !== 'All' && insp.machineId !== filters.machineId) return false
      if (!search) return true
      return [insp.id, insp.rollId, insp.batchNo, insp.orderId, insp.machineId, machineName(insp.machineId), insp.inspectorName]
        .some((field) => field.toLowerCase().includes(search))
    })
    .sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt) || b.id.localeCompare(a.id))
  return delay(result)
}

export function createInspection(input: CreateInspectionInput): Promise<QualityInspection> {
  const inspected = input.inspectedQtyMeters
  const employee = EMPLOYEES.find((e) => e.id === input.employeeId)
  if (!employee) {
    return Promise.reject(new Error('Unknown employee session. Select an employee in the header.'))
  }
  if (!input.batchNo || !input.orderId) {
    return Promise.reject(new Error('Machine is idle — no active batch/order to inspect.'))
  }
  if (!Number.isFinite(inspected) || inspected <= 0) {
    return Promise.reject(new Error('Inspected quantity must be greater than zero.'))
  }
  if (input.defects.some((d) => !d.type || !Number.isInteger(d.count) || d.count < 1)) {
    return Promise.reject(new Error('Each defect needs a type and a whole-number count of 1 or more.'))
  }
  const totalDefectCount = input.defects.reduce((sum, d) => sum + d.count, 0)
  // Auto outcome: no defects -> everything to warehouse; defects -> defective metres held (rework).
  const acceptedQtyMeters = Math.max(0, inspected - totalDefectCount)
  const outcome: QualityInspection['outcome'] = totalDefectCount === 0 ? 'Approved' : 'Rework'
  const nextNumber = inspections.reduce((max, insp) => {
    const n = Number(insp.id.replace(/\D/g, ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 0) + 1
  const created: QualityInspection = {
    ...input,
    id: `QI-${String(nextNumber).padStart(3, '0')}`,
    rollId: previewRollId(input.batchNo),
    inspectorName: employee.name,
    acceptedQtyMeters,
    totalDefectCount,
    outcome,
    source: 'session-entry',
  }
  inspections = [created, ...inspections]
  return delay(created)
}

export function getDashboardStats(): Promise<DashboardStats> {
  const total = inspections.length
  const approved = inspections.filter((i) => i.outcome === 'Approved').length
  const inspectedMeters = inspections.reduce((s, i) => s + i.inspectedQtyMeters, 0)
  const acceptedMeters = inspections.reduce((s, i) => s + i.acceptedQtyMeters, 0)
  const totalDefects = inspections.reduce((s, i) => s + i.totalDefectCount, 0)
  const summaries = buildMachineSummaries()
  const stats: DashboardStats = {
    totalInspections: total,
    efficiencyPct: inspectedMeters === 0 ? 0 : Math.round((acceptedMeters / inspectedMeters) * 100),
    passRatePct: total === 0 ? 0 : Math.round((approved / total) * 100),
    defectRatePer100m: inspectedMeters === 0 ? 0 : Number(((totalDefects / inspectedMeters) * 100).toFixed(2)),
    reworkCount: inspections.filter((i) => i.outcome === 'Rework').length,
    rejectedCount: inspections.filter((i) => i.outcome === 'Rejected').length,
    machinesFlagged: summaries.filter((s) => s.needsInvestigation).length,
  }
  return delay(stats)
}

/** Per-machine counts of each defect type — "which machine produced which defect". */
export function getDefectMatrix(): Promise<MachineDefectMatrixRow[]> {
  const rows: MachineDefectMatrixRow[] = machines.map((machine) => {
    const counts: Record<string, number> = {}
    for (const type of DEFECT_TYPES) counts[type] = 0
    for (const insp of inspections) {
      if (insp.machineId !== machine.id) continue
      for (const defect of insp.defects) {
        counts[defect.type] = (counts[defect.type] ?? 0) + defect.count
      }
    }
    return {
      machineId: machine.id,
      machineName: machine.name,
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }
  })
  return delay(rows)
}

/** One call that loads everything the quality dashboard needs. */
export function getDashboardBundle(): Promise<DashboardBundle> {
  return Promise.all([
    getDashboardStats(),
    getDefectTrend(),
    getDefectTypeBreakdown(),
    getMachineSummaries(),
    getDefectMatrix(),
  ]).then(([stats, trend, byType, summaries, matrix]) => ({
    stats,
    trend,
    byType,
    summaries,
    matrix,
  }))
}

export function getDefectTrend(): Promise<TrendPoint[]> {
  const byDate = new Map<string, { defects: number; meters: number; count: number }>()
  for (const insp of inspections) {
    const bucket = byDate.get(insp.inspectedAt) ?? { defects: 0, meters: 0, count: 0 }
    bucket.defects += insp.totalDefectCount
    bucket.meters += insp.inspectedQtyMeters
    bucket.count += 1
    byDate.set(insp.inspectedAt, bucket)
  }
  const points: TrendPoint[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      defectRatePer100m: b.meters === 0 ? 0 : Number(((b.defects / b.meters) * 100).toFixed(2)),
      inspections: b.count,
    }))
  return delay(points)
}

export function getDefectTypeBreakdown(): Promise<DefectTypePoint[]> {
  const counts = new Map<string, number>()
  for (const insp of inspections) {
    for (const defect of insp.defects) {
      counts.set(defect.type, (counts.get(defect.type) ?? 0) + defect.count)
    }
  }
  const points = [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
  return delay(points)
}

function buildMachineSummaries(): MachineQualitySummary[] {
  return machines.map((machine) => {
    const own = inspections.filter((i) => i.machineId === machine.id)
    const inspectedQtyMeters = own.reduce((s, i) => s + i.inspectedQtyMeters, 0)
    const acceptedQtyMeters = own.reduce((s, i) => s + i.acceptedQtyMeters, 0)
    const totalDefects = own.reduce((s, i) => s + i.totalDefectCount, 0)
    const approved = own.filter((i) => i.outcome === 'Approved').length
    const rework = own.filter((i) => i.outcome === 'Rework').length
    const rejected = own.filter((i) => i.outcome === 'Rejected').length
    const defectRatePer100m = inspectedQtyMeters === 0 ? 0 : Number(((totalDefects / inspectedQtyMeters) * 100).toFixed(2))
    const passRatePct = own.length === 0 ? 0 : Math.round((approved / own.length) * 100)
    const efficiencyPct = inspectedQtyMeters === 0 ? 0 : Math.round((acceptedQtyMeters / inspectedQtyMeters) * 100)

    const reasons: string[] = []
    if (defectRatePer100m > FLAG_RULE.defectRatePer100m) {
      reasons.push(`defect rate ${defectRatePer100m}/100 m > ${FLAG_RULE.defectRatePer100m}`)
    }
    if (passRatePct < FLAG_RULE.passRatePct) {
      reasons.push(`pass rate ${passRatePct}% < ${FLAG_RULE.passRatePct}%`)
    }

    return {
      machine,
      inspections: own.length,
      approved,
      rework,
      rejected,
      inspectedQtyMeters,
      acceptedQtyMeters,
      totalDefects,
      defectRatePer100m,
      passRatePct,
      efficiencyPct,
      needsInvestigation: reasons.length > 0,
      flagReason: reasons.length > 0 ? reasons.join('; ') : 'Within thresholds',
    }
  })
}

export function getMachineSummaries(): Promise<MachineQualitySummary[]> {
  return delay(buildMachineSummaries())
}
