export type ShipmentStatus = 'Booked' | 'In transit' | 'Delivered' | 'Delayed'

export interface Shipment {
  id: string
  orderId: string
  customer: string
  country: string
  state: string
  city: string
  rolls: number
  meters: number
  dispatchDate: string
  status: ShipmentStatus
  courier: string
  trackingNumber?: string | null
  destination?: string | null
}

export interface DispatchStatRow {
  key: string
  shipments: number
  rolls: number
  meters: number
  delivered: number
  inTransit: number
}

export interface DispatchStats {
  totalShipments: number
  totalRolls: number
  totalMeters: number
  deliveredPct: number
  inTransit: number
  countries: number
  states: number
  cities: number
}

export interface DispatchBundle {
  stats: DispatchStats
  byCountry: DispatchStatRow[]
  byState: DispatchStatRow[]
  byCity: DispatchStatRow[]
  shipments: Shipment[]
}
