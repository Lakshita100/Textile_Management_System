import { http } from './http'
import type { PackStatus, PackedLot, PackingBundle, PackingStats } from '../types/packing'

interface PackingWire {
  id: string; rollId: string; batchNo: string; orderId: string; machineId: string
  qualityOutcome: 'Approved' | 'Rework'; qtyMeters: number; status: PackStatus
  packType: 'Roll' | 'Bale' | 'Box' | null; cartons: number | null
  packedAt: string | null; packedBy: string | null
}

export async function getPackingBundle(status?: PackStatus): Promise<PackingBundle> {
  const result = await http.get<{ lots: PackingWire[] }>('/fulfillment/packing')
  const all: PackedLot[] = result.lots.map((lot) => ({
    ...lot,
    packType: lot.packType ?? 'Roll',
    cartons: lot.cartons ?? 1,
    packedAt: lot.packedAt ?? '',
    packedBy: lot.packedBy ?? '',
  }))
  const stats: PackingStats = {
    totalLots: all.length,
    totalMeters: all.reduce((sum, lot) => sum + lot.qtyMeters, 0),
    totalCartons: all.reduce((sum, lot) => sum + lot.cartons, 0),
    pendingPacking: all.filter((lot) => lot.status === 'Pending packing' || lot.status === 'Packed').length,
    inWarehouse: all.filter((lot) => lot.status === 'In warehouse').length,
    dispatched: all.filter((lot) => lot.status === 'Dispatched').length,
  }
  return { stats, lots: status ? all.filter((lot) => lot.status === status) : all }
}

export async function updatePackingLot(id: string, status: 'Packed' | 'In warehouse', packType = 'Roll', cartons = 1): Promise<PackedLot> {
  return http.patch<PackedLot>(`/fulfillment/packing/${encodeURIComponent(id)}`, {
    status,
    pack_type: packType,
    cartons,
  })
}
