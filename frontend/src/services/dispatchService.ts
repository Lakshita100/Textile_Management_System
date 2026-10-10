import type { DispatchBundle, DispatchStatRow, Shipment, ShipmentStatus } from '../types/dispatch'

const LATENCY_MS = 200

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

const OVERSEAS = 'Overseas'

const seedShipments: Shipment[] = [
  { id: 'SHP-001', orderId: 'ORD-1001', customer: 'Patel Textiles', country: 'India', state: 'Gujarat', city: 'Ahmedabad', rolls: 4, meters: 4200, dispatchDate: '2026-09-29', status: 'Delivered', courier: 'TCI Freight' },
  { id: 'SHP-002', orderId: 'ORD-1001', customer: 'Meera Fabrics', country: 'India', state: 'Gujarat', city: 'Surat', rolls: 3, meters: 3100, dispatchDate: '2026-09-30', status: 'Delivered', courier: 'TCI Freight' },
  { id: 'SHP-003', orderId: 'ORD-1002', customer: 'Shree Garments', country: 'India', state: 'Maharashtra', city: 'Mumbai', rolls: 5, meters: 5400, dispatchDate: '2026-10-01', status: 'Delivered', courier: 'VRL Logistics' },
  { id: 'SHP-004', orderId: 'ORD-1002', customer: 'Deccan Textiles', country: 'India', state: 'Tamil Nadu', city: 'Tiruppur', rolls: 4, meters: 3900, dispatchDate: '2026-10-02', status: 'In transit', courier: 'VRL Logistics' },
  { id: 'SHP-005', orderId: 'ORD-1003', customer: 'Bangalore Looms', country: 'India', state: 'Karnataka', city: 'Bengaluru', rolls: 3, meters: 2800, dispatchDate: '2026-10-03', status: 'Delivered', courier: 'Gati KWE' },
  { id: 'SHP-006', orderId: 'ORD-1003', customer: 'Jaipur Handloom', country: 'India', state: 'Rajasthan', city: 'Jaipur', rolls: 2, meters: 1900, dispatchDate: '2026-10-04', status: 'Delivered', courier: 'Gati KWE' },
  { id: 'SHP-007', orderId: 'ORD-1004', customer: 'Kanpur Weaves', country: 'India', state: 'Uttar Pradesh', city: 'Kanpur', rolls: 3, meters: 2600, dispatchDate: '2026-10-05', status: 'In transit', courier: 'TCI Freight' },
  { id: 'SHP-008', orderId: 'ORD-1004', customer: 'Chennai Silks', country: 'India', state: 'Tamil Nadu', city: 'Chennai', rolls: 4, meters: 4100, dispatchDate: '2026-10-05', status: 'Delayed', courier: 'VRL Logistics' },
  { id: 'SHP-009', orderId: 'ORD-1005', customer: 'Dhaka Apparels', country: 'Bangladesh', state: OVERSEAS, city: 'Dhaka', rolls: 6, meters: 6800, dispatchDate: '2026-10-06', status: 'In transit', courier: 'Maersk (sea)' },
  { id: 'SHP-010', orderId: 'ORD-1005', customer: 'Gulf Textiles LLC', country: 'UAE', state: OVERSEAS, city: 'Dubai', rolls: 5, meters: 5200, dispatchDate: '2026-10-06', status: 'Delivered', courier: 'Emirates SkyCargo' },
  { id: 'SHP-011', orderId: 'ORD-1006', customer: 'Kathmandu Fabrics', country: 'Nepal', state: OVERSEAS, city: 'Kathmandu', rolls: 2, meters: 1700, dispatchDate: '2026-10-07', status: 'Booked', courier: 'Agro Cargo' },
  { id: 'SHP-012', orderId: 'ORD-1006', customer: 'Colombo Exports', country: 'Sri Lanka', state: OVERSEAS, city: 'Colombo', rolls: 3, meters: 2900, dispatchDate: '2026-10-07', status: 'In transit', courier: 'Maersk (sea)' },
  { id: 'SHP-013', orderId: 'ORD-1007', customer: 'Surat Fashion', country: 'India', state: 'Gujarat', city: 'Surat', rolls: 4, meters: 3600, dispatchDate: '2026-10-08', status: 'In transit', courier: 'TCI Freight' },
  { id: 'SHP-014', orderId: 'ORD-1007', customer: 'Pune Retail Hub', country: 'India', state: 'Maharashtra', city: 'Pune', rolls: 2, meters: 1500, dispatchDate: '2026-10-08', status: 'Booked', courier: 'Gati KWE' },
  { id: 'SHP-015', orderId: 'ORD-1008', customer: 'Coimbatore Mills', country: 'India', state: 'Tamil Nadu', city: 'Coimbatore', rolls: 3, meters: 2750, dispatchDate: '2026-10-09', status: 'In transit', courier: 'VRL Logistics' },
  { id: 'SHP-016', orderId: 'ORD-1008', customer: 'Hyderabad Retail', country: 'India', state: 'Telangana', city: 'Hyderabad', rolls: 2, meters: 1600, dispatchDate: '2026-10-09', status: 'Booked', courier: 'Gati KWE' },
  { id: 'SHP-017', orderId: 'ORD-1009', customer: 'Delhi Wholesale', country: 'India', state: 'Delhi', city: 'Delhi', rolls: 5, meters: 4800, dispatchDate: '2026-10-10', status: 'Booked', courier: 'TCI Freight' },
  { id: 'SHP-018', orderId: 'ORD-1009', customer: 'Nepal Trade House', country: 'Nepal', state: OVERSEAS, city: 'Biratnagar', rolls: 2, meters: 1400, dispatchDate: '2026-10-10', status: 'Booked', courier: 'Agro Cargo' },
]

function groupBy(shipments: Shipment[], pick: (s: Shipment) => string): DispatchStatRow[] {
  const map = new Map<string, DispatchStatRow>()
  for (const s of shipments) {
    const key = pick(s)
    const row = map.get(key) ?? {
      key,
      shipments: 0,
      rolls: 0,
      meters: 0,
      delivered: 0,
      inTransit: 0,
    }
    row.shipments += 1
    row.rolls += s.rolls
    row.meters += s.meters
    if (s.status === 'Delivered') row.delivered += 1
    if (s.status === 'In transit') row.inTransit += 1
    map.set(key, row)
  }
  return [...map.values()].sort((a, b) => b.meters - a.meters)
}

export function getDispatchBundle(status?: ShipmentStatus): Promise<DispatchBundle> {
  const shipments = seedShipments
  const delivered = shipments.filter((s) => s.status === 'Delivered').length
  const totalMeters = shipments.reduce((s, x) => s + x.meters, 0)
  return delay({
    stats: {
      totalShipments: shipments.length,
      totalRolls: shipments.reduce((s, x) => s + x.rolls, 0),
      totalMeters,
      deliveredPct: shipments.length > 0 ? Math.round((delivered / shipments.length) * 100) : 0,
      inTransit: shipments.filter((s) => s.status === 'In transit').length,
      countries: new Set(shipments.map((s) => s.country)).size,
      states: new Set(shipments.map((s) => s.state)).size,
      cities: new Set(shipments.map((s) => s.city)).size,
    },
    byCountry: groupBy(shipments, (s) => s.country),
    byState: groupBy(shipments, (s) => s.state),
    byCity: groupBy(shipments, (s) => s.city),
    shipments: status ? shipments.filter((s) => s.status === status) : shipments,
  })
}
