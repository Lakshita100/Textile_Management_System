export type PackStatus = 'Packed' | 'In warehouse' | 'Dispatched'
export type PackType = 'Roll' | 'Bale' | 'Box'

export interface PackedLot {
  id: string
  rollId: string
  batchNo: string
  orderId: string
  machineId: string
  qualityOutcome: 'Approved' | 'Rework'
  qtyMeters: number
  packType: PackType
  cartons: number
  packedAt: string
  packedBy: string
  status: PackStatus
  fromInspection?: boolean
}

export interface PackingStats {
  totalLots: number
  totalMeters: number
  totalCartons: number
  pendingPacking: number
  inWarehouse: number
  dispatched: number
}

export interface PackingBundle {
  stats: PackingStats
  lots: PackedLot[]
}
