import { http } from './http'
import type { DispatchBundle, DispatchStatRow, Shipment, ShipmentStatus } from '../types/dispatch'
import type { PackedLot } from '../types/packing'

interface ShipmentWire extends Shipment { trackingNumber?: string | null; destination?: string | null }

function groupBy(shipments: Shipment[], pick: (shipment: Shipment) => string): DispatchStatRow[] {
  const grouped = new Map<string, DispatchStatRow>()
  for (const shipment of shipments) {
    const key = pick(shipment) || 'Address not provided'
    const row = grouped.get(key) ?? { key, shipments: 0, rolls: 0, meters: 0, delivered: 0, inTransit: 0 }
    row.shipments += 1
    row.rolls += shipment.rolls
    row.meters += shipment.meters
    if (shipment.status === 'Delivered') row.delivered += 1
    if (shipment.status === 'In transit') row.inTransit += 1
    grouped.set(key, row)
  }
  return [...grouped.values()].sort((a, b) => b.meters - a.meters)
}

export async function getDispatchBundle(status?: ShipmentStatus): Promise<DispatchBundle> {
  const result = await http.get<{ shipments: ShipmentWire[] }>('/fulfillment/shipments')
  const all = result.shipments.map((shipment) => ({ ...shipment, rolls: shipment.rolls || 1, meters: shipment.meters || 0 }))
  const delivered = all.filter((shipment) => shipment.status === 'Delivered').length
  return {
    stats: {
      totalShipments: all.length,
      totalRolls: all.reduce((sum, shipment) => sum + shipment.rolls, 0),
      totalMeters: all.reduce((sum, shipment) => sum + shipment.meters, 0),
      deliveredPct: all.length ? Math.round(delivered * 100 / all.length) : 0,
      inTransit: all.filter((shipment) => shipment.status === 'In transit').length,
      countries: new Set(all.map((shipment) => shipment.country).filter(Boolean)).size,
      states: new Set(all.map((shipment) => shipment.state).filter(Boolean)).size,
      cities: new Set(all.map((shipment) => shipment.city).filter(Boolean)).size,
    },
    byCountry: groupBy(all, (shipment) => shipment.country),
    byState: groupBy(all, (shipment) => shipment.state),
    byCity: groupBy(all, (shipment) => shipment.city),
    shipments: status ? all.filter((shipment) => shipment.status === status) : all,
  }
}

export function createShipment(input: { lotIds: string[]; courier: string; trackingNumber?: string }): Promise<Shipment> {
  return http.post<Shipment>('/fulfillment/shipments', {
    lot_ids: input.lotIds,
    courier: input.courier,
    tracking_number: input.trackingNumber,
  })
}

export function updateShipmentStatus(id: string, status: 'In transit' | 'Delivered' | 'Delayed'): Promise<Shipment> {
  return http.patch<Shipment>(`/fulfillment/shipments/${encodeURIComponent(id)}/status`, { status })
}

export async function getReadyToDispatchLots(): Promise<PackedLot[]> {
  const result = await http.get<{ lots: Array<Omit<PackedLot, 'packType' | 'cartons' | 'packedAt' | 'packedBy'> & {
    packType: PackedLot['packType'] | null; cartons: number | null; packedAt: string | null; packedBy: string | null
  }> }>('/fulfillment/ready-to-dispatch')
  return result.lots.map((lot) => ({
    ...lot, packType: lot.packType ?? 'Roll', cartons: lot.cartons ?? 1,
    packedAt: lot.packedAt ?? '', packedBy: lot.packedBy ?? '',
  }))
}
