import type { PackStatus, PackedLot, PackingBundle, PackingStats } from '../types/packing'

const LATENCY_MS = 200

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

const seedLots: PackedLot[] = [
  { id: 'PK-001', rollId: 'R-2380', batchNo: 'B-101', orderId: 'ORD-1001', machineId: 'M-01', qualityOutcome: 'Approved', qtyMeters: 1180, packType: 'Bale', cartons: 12, packedAt: '2026-09-27', packedBy: 'Suresh T.', status: 'Dispatched' },
  { id: 'PK-002', rollId: 'R-2381', batchNo: 'B-101', orderId: 'ORD-1001', machineId: 'M-02', qualityOutcome: 'Rework', qtyMeters: 1010, packType: 'Roll', cartons: 8, packedAt: '2026-09-28', packedBy: 'Suresh T.', status: 'Dispatched' },
  { id: 'PK-003', rollId: 'R-2385', batchNo: 'B-102', orderId: 'ORD-1002', machineId: 'M-03', qualityOutcome: 'Approved', qtyMeters: 895, packType: 'Box', cartons: 6, packedAt: '2026-09-30', packedBy: 'Kavita R.', status: 'Dispatched' },
  { id: 'PK-004', rollId: 'R-2390', batchNo: 'B-102', orderId: 'ORD-1002', machineId: 'M-01', qualityOutcome: 'Approved', qtyMeters: 1290, packType: 'Bale', cartons: 13, packedAt: '2026-10-01', packedBy: 'Kavita R.', status: 'In warehouse' },
  { id: 'PK-005', rollId: 'R-2395', batchNo: 'B-103', orderId: 'ORD-1003', machineId: 'M-04', qualityOutcome: 'Approved', qtyMeters: 690, packType: 'Roll', cartons: 5, packedAt: '2026-10-02', packedBy: 'Suresh T.', status: 'Dispatched' },
  { id: 'PK-006', rollId: 'R-2396', batchNo: 'B-103', orderId: 'ORD-1003', machineId: 'M-05', qualityOutcome: 'Approved', qtyMeters: 1245, packType: 'Bale', cartons: 11, packedAt: '2026-10-03', packedBy: 'Amit D.', status: 'In warehouse' },
  { id: 'PK-007', rollId: 'R-2401', batchNo: 'B-104', orderId: 'ORD-1001', machineId: 'M-01', qualityOutcome: 'Approved', qtyMeters: 1180, packType: 'Box', cartons: 9, packedAt: '2026-10-04', packedBy: 'Amit D.', status: 'Dispatched' },
  { id: 'PK-008', rollId: 'R-2403', batchNo: 'B-104', orderId: 'ORD-1002', machineId: 'M-03', qualityOutcome: 'Approved', qtyMeters: 895, packType: 'Roll', cartons: 7, packedAt: '2026-10-05', packedBy: 'Kavita R.', status: 'In warehouse' },
  { id: 'PK-009', rollId: 'R-2404', batchNo: 'B-105', orderId: 'ORD-1001', machineId: 'M-01', qualityOutcome: 'Approved', qtyMeters: 1290, packType: 'Bale', cartons: 12, packedAt: '2026-10-06', packedBy: 'Suresh T.', status: 'Packed' },
  { id: 'PK-010', rollId: 'R-2407', batchNo: 'B-105', orderId: 'ORD-1003', machineId: 'M-05', qualityOutcome: 'Approved', qtyMeters: 1245, packType: 'Bale', cartons: 10, packedAt: '2026-10-07', packedBy: 'Amit D.', status: 'Packed' },
  { id: 'PK-011', rollId: 'R-2409', batchNo: 'B-106', orderId: 'ORD-1003', machineId: 'M-01', qualityOutcome: 'Approved', qtyMeters: 1392, packType: 'Box', cartons: 14, packedAt: '2026-10-08', packedBy: 'Kavita R.', status: 'Packed' },
  { id: 'PK-012', rollId: 'R-2410', batchNo: 'B-106', orderId: 'ORD-1001', machineId: 'M-03', qualityOutcome: 'Approved', qtyMeters: 935, packType: 'Roll', cartons: 7, packedAt: '2026-10-09', packedBy: 'Suresh T.', status: 'Packed' },
  { id: 'PK-013', rollId: 'R-2412', batchNo: 'B-107', orderId: 'ORD-1002', machineId: 'M-05', qualityOutcome: 'Approved', qtyMeters: 1296, packType: 'Bale', cartons: 11, packedAt: '2026-10-09', packedBy: 'Amit D.', status: 'In warehouse' },
  { id: 'PK-014', rollId: 'R-2416', batchNo: 'B-107', orderId: 'ORD-1003', machineId: 'M-03', qualityOutcome: 'Approved', qtyMeters: 990, packType: 'Box', cartons: 8, packedAt: '2026-10-10', packedBy: 'Kavita R.', status: 'Packed' },
]

let lots: PackedLot[] = [...seedLots]

export function queueFromInspection(event: {
  rollId: string
  batchNo: string
  orderId: string
  machineId: string
  qtyMeters: number
  packedBy: string
}): void {
  const nextNum = lots.reduce((max, lot) => {
    const n = Number(lot.id.replace('PK-', ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 0) + 1
  lots = [
    {
      id: `PK-${String(nextNum).padStart(3, '0')}`,
      rollId: event.rollId,
      batchNo: event.batchNo,
      orderId: event.orderId,
      machineId: event.machineId,
      qualityOutcome: 'Approved',
      qtyMeters: event.qtyMeters,
      packType: 'Roll',
      cartons: Math.max(1, Math.round(event.qtyMeters / 100)),
      packedAt: new Date().toISOString().slice(0, 10),
      packedBy: event.packedBy,
      status: 'Packed',
      fromInspection: true,
    },
    ...lots,
  ]
}

function buildStats(all: PackedLot[]): PackingStats {
  return {
    totalLots: all.length,
    totalMeters: all.reduce((s, lot) => s + lot.qtyMeters, 0),
    totalCartons: all.reduce((s, lot) => s + lot.cartons, 0),
    pendingPacking: all.filter((lot) => lot.status === 'Packed').length,
    inWarehouse: all.filter((lot) => lot.status === 'In warehouse').length,
    dispatched: all.filter((lot) => lot.status === 'Dispatched').length,
  }
}

export function getPackingBundle(status?: PackStatus): Promise<PackingBundle> {
  const filtered = status ? lots.filter((lot) => lot.status === status) : lots
  return delay({ stats: buildStats(lots), lots: filtered })
}
