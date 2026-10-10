import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./api', () => ({
  apiErrorMessage: (e: unknown) => (e as { message?: string })?.message ?? 'Unexpected error',
  machinesApi: { list: vi.fn() },
  qualityApi: {
    inspections: vi.fn(),
    createInspection: vi.fn(),
    dashboard: vi.fn(),
    inspectableJob: vi.fn(),
    rollPreview: vi.fn(),
    inspectionCounts: vi.fn(),
  },
}))

import { machinesApi, qualityApi } from './api'
import {
  createInspection,
  getDashboardBundle,
  getInspections,
  getMachineJob,
  getMachines,
  previewRollId,
} from './qualityService'
import type { InspectionWire } from '../types/quality'

const wire = (over: Partial<InspectionWire> = {}): InspectionWire => ({
  id: 7,
  job_id: 3,
  machine_id: 2,
  machine_code: 'W-02',
  machine_name: 'Loom 2',
  job_status: 'COMPLETED',
  order_ref: 'ORD-1',
  batch_no: 'BATCH-3',
  roll_id: 'BATCH-3-R1',
  employee_id: 'EMP-001',
  inspector_name: 'Meera P.',
  inspected_at: '2026-10-10',
  inspected_qty_meters: 120,
  accepted_qty_meters: 118,
  defects: [{ type: 'Holes', count: 2, severity: 'High' }],
  total_defect_count: 2,
  outcome: 'Rework',
  remarks: null,
  source: 'session-entry',
  created_at: '2026-10-10T10:00:00Z',
  updated_at: '2026-10-10T10:00:00Z',
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('qualityService (API-backed)', () => {
  it('maps inspection list filters to API params and wire rows to domain shape', async () => {
    vi.mocked(qualityApi.inspections).mockResolvedValue({
      items: [wire()],
      total: 1,
      page: 1,
      page_size: 500,
      pages: 1,
    })

    const rows = await getInspections({ search: ' roll-1 ', outcome: 'All', machineId: 'All', jobId: 3 })

    expect(qualityApi.inspections).toHaveBeenCalledWith({
      search: 'roll-1',
      outcome: undefined,
      machine_code: undefined,
      job_id: 3,
      page_size: 500,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 7,
      jobId: 3,
      rollId: 'BATCH-3-R1',
      orderId: 'ORD-1',
      machineId: 'W-02',
      machineIdNum: 2,
      machineName: 'Loom 2',
      outcome: 'Rework',
      source: 'session-entry',
    })
  })

  it('passes machine/outcome filters through to the API', async () => {
    vi.mocked(qualityApi.inspections).mockResolvedValue({ items: [], total: 0, page: 1, page_size: 500, pages: 0 })
    await getInspections({ outcome: 'Rejected', machineId: 'W-02' })
    expect(qualityApi.inspections).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'Rejected', machine_code: 'W-02' }),
    )
  })

  it('creates an inspection with the job-linked payload and maps the response', async () => {
    vi.mocked(qualityApi.createInspection).mockResolvedValue(wire({ id: 8, roll_id: 'BATCH-3-R2' }))

    const created = await createInspection({
      jobId: 3,
      machineCode: 'W-02',
      employeeId: 'EMP-001',
      inspectorName: 'Meera P.',
      inspectedAt: '2026-10-10',
      inspectedQtyMeters: 120,
      defects: [{ type: 'Holes', count: 2, severity: 'High' }],
      remarks: 'checked',
    })

    expect(qualityApi.createInspection).toHaveBeenCalledWith({
      job_id: 3,
      employee_id: 'EMP-001',
      inspector_name: 'Meera P.',
      inspected_at: '2026-10-10',
      inspected_qty_meters: 120,
      defects: [{ type: 'Holes', count: 2, severity: 'High' }],
      remarks: 'checked',
      machine_code: 'W-02',
    })
    expect(created.id).toBe(8)
    expect(created.rollId).toBe('BATCH-3-R2')
    expect(created.jobId).toBe(3)
  })

  it('surfaces API errors as Error messages', async () => {
    vi.mocked(qualityApi.createInspection).mockRejectedValue(new Error('Inspected quantity exceeds job output'))
    await expect(
      createInspection({
        jobId: 3,
        machineCode: 'W-02',
        employeeId: 'EMP-001',
        inspectorName: 'Meera P.',
        inspectedAt: '2026-10-10',
        inspectedQtyMeters: 999,
        defects: [],
      }),
    ).rejects.toThrow('Inspected quantity exceeds job output')
  })

  it('maps the dashboard bundle snake_case -> Anand camelCase contract', async () => {
    vi.mocked(qualityApi.dashboard).mockResolvedValue({
      stats: {
        total_inspections: 4,
        efficiency_percent: 97,
        pass_rate_percent: 75,
        defect_rate_per_100m: 1.25,
        rework_count: 1,
        rejected_count: 0,
        machines_flagged: 1,
      },
      trend: [{ date: '2026-10-10', defect_rate_per_100m: 2.5, inspections: 2 }],
      by_type: [{ type: 'Holes', count: 5 }],
      summaries: [
        {
          machine: { machine_id: 2, id: 'W-02', name: 'Loom 2', process: 'WEAVING', output_meters: 800, downtime_hours: 1.5 },
          inspections: 4,
          approved: 3,
          rework: 1,
          rejected: 0,
          inspected_qty_meters: 400,
          accepted_qty_meters: 390,
          total_defects: 5,
          defect_rate_per_100m: 1.25,
          pass_rate_percent: 75,
          efficiency_percent: 97,
          needs_investigation: false,
          flag_reason: 'Within thresholds',
        },
      ],
      matrix: [{ machine_id: 'W-02', machine_name: 'Loom 2', counts: { Holes: 5 }, total: 5 }],
    })

    const b = await getDashboardBundle()
    expect(b.stats).toEqual({
      totalInspections: 4,
      efficiencyPct: 97,
      passRatePct: 75,
      defectRatePer100m: 1.25,
      reworkCount: 1,
      rejectedCount: 0,
      machinesFlagged: 1,
    })
    expect(b.trend[0]).toEqual({ date: '2026-10-10', defectRatePer100m: 2.5, inspections: 2 })
    expect(b.summaries[0].machine).toEqual({
      machineId: 2,
      id: 'W-02',
      name: 'Loom 2',
      process: 'WEAVING',
      outputMeters: 800,
      downtimeHours: 1.5,
    })
    expect(b.summaries[0].flagReason).toBe('Within thresholds')
    expect(b.matrix[0]).toEqual({ machineId: 'W-02', machineName: 'Loom 2', counts: { Holes: 5 }, total: 5 })
  })

  it('loads real machines from the machines API', async () => {
    vi.mocked(machinesApi.list).mockResolvedValue({
      items: [
        {
          id: 2,
          code: 'W-02',
          name: 'Loom 2',
          machine_type: 'LOOM',
          supported_processes: 'WEAVING',
          capacity_value: 500,
          capacity_unit: 'meters/day',
          status: 'IDLE',
          current_assignment: null,
          available_for_assignment: true,
          efficiency_percent: null,
        },
      ],
      total: 1,
      page: 1,
      page_size: 100,
      pages: 1,
    })
    const machines = await getMachines()
    expect(machines[0]).toEqual({ machineId: 2, id: 'W-02', name: 'Loom 2', process: 'WEAVING' })
  })

  it('maps the inspectable job and roll preview', async () => {
    vi.mocked(qualityApi.inspectableJob).mockResolvedValue({
      job_id: 3,
      machine_id: 2,
      machine_code: 'W-02',
      status: 'IN_PROGRESS',
      batch_no: 'BATCH-3',
      order_ref: 'ORD-1',
      started_at: '2026-10-10T08:00:00Z',
      planned_qty_meters: 500,
      produced_qty_meters: 120,
    })
    vi.mocked(qualityApi.rollPreview).mockResolvedValue({ job_id: 3, batch_no: 'BATCH-3', roll_id: 'BATCH-3-R2', inspection_count: 1 })

    const job = await getMachineJob(2)
    expect(job).toMatchObject({ jobId: 3, machineId: 'W-02', machineIdNum: 2, status: 'IN_PROGRESS', producedQtyMeters: 120 })
    expect(await previewRollId(3)).toBe('BATCH-3-R2')

    vi.mocked(qualityApi.inspectableJob).mockResolvedValue(null)
    expect(await getMachineJob(9)).toBeNull()
  })
})
