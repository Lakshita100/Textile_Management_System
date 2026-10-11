import { http } from './http'

export type BuyerRole = 'buyer' | 'admin'

export type OrderStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Clarification Required'
  | 'Quotation Sent'
  | 'Accepted'
  | 'Material Check'
  | 'Scheduled'
  | 'In Production'
  | 'Quality Check'
  | 'Packing'
  | 'Ready to Dispatch'
  | 'Dispatched'
  | 'Partially Dispatched'
  | 'In Transit'
  | 'Partially Delivered'
  | 'Delivered'
  | 'Rejected'
  | 'Cancelled'

export type InquiryStatus = 'Open' | 'Awaiting Response' | 'Resolved'
export type MaterialAvailabilityStatus = 'Available' | 'Partially Available' | 'Insufficient Stock'

export interface MaterialAvailability {
  orderId: string
  status: MaterialAvailabilityStatus
  availableQuantity: number
  requiredQuantity: number
  shortageQuantity: number
  unit: string
  notes: string
  checkedBy: string
  checkedAt: string
  source: 'Ram demo check' | 'Raw material inventory' | 'Fabric recipe inventory'
  consumedAt?: string
  consumedMaterials?: Array<{ yarnId: string; quantity: number; unit: string; movementId: string }>
  components?: Array<{
    material: string
    yarnId: string | null
    requiredQuantity: number
    availableQuantity: number
    shortageQuantity: number
    unit: string
    status: MaterialAvailabilityStatus
  }>
}

export interface BuyerVisibleUpdate {
  message: string
  sender: 'buyer' | 'admin'
  timestamp: string
}

export interface OrderReviewEvent {
  action: 'note' | 'approved' | 'rejected' | 'clarification-requested' | 'held' | 'procurement-requested' | 'delivery-revision-requested' | 'buyer-response'
  reviewer: string
  note: string
  timestamp: string
}

export interface BuyerUser {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  postalCode: string
  website?: string
  businessRegistration?: string
  createdAt: string
}

export interface OrderStatusEvent {
  status: OrderStatus
  note: string
  timestamp: string
}

export interface OrderRecord {
  id: string
  buyerId: string
  buyerName: string
  companyName: string
  source: 'Buyer Portal' | 'Manual'
  productName: string
  productCode: string
  yarnId?: string
  yarnType: string
  materialComposition: string
  shade: string
  quantity: number
  unit: string
  requestedDeliveryDate: string
  deliveryAddress: string
  deliveryInstructions?: string
  technicalNotes?: string
  commercialNotes?: string
  buyerEmail?: string
  buyerPhone?: string
  productCategory?: string
  yarnSubtype?: string
  technicalSpecifications?: string
  denierCount?: string
  specialRequirements?: string
  priority?: 'Standard' | 'Urgent' | 'Flexible'
  targetPrice?: string
  buyerNotes?: string
  buyerVisibleUpdates?: BuyerVisibleUpdate[]
  reviewHistory?: OrderReviewEvent[]
  materialAvailability?: MaterialAvailability
  productionJobId?: number | null
  status: OrderStatus
  createdAt: string
  updatedAt: string
  submittedAt: string
  statusHistory: OrderStatusEvent[]
}

export interface InquiryRecord {
  id: string
  buyerId: string
  orderId: string
  subject: string
  type: 'Product' | 'Pricing' | 'Delivery' | 'Production' | 'General'
  status: InquiryStatus
  createdAt: string
  updatedAt: string
  messages: InquiryMessage[]
}

export interface InquiryMessage {
  sender: 'buyer' | 'admin'
  text: string
  timestamp: string
}

export interface SessionUser {
  userId: string
  role: BuyerRole
  name: string
  email: string
  companyName?: string
}

const STORAGE_KEYS = {
  buyers: 'everest-buyer-users',
  orders: 'everest-orders',
  inquiries: 'everest-inquiries',
  session: 'everest-demo-session',
}

const isoNow = () => new Date().toISOString()
const workspaceCache = new Map<string, unknown>()

const readStored = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback
  }

  if (key !== STORAGE_KEYS.session) return (workspaceCache.get(key) as T | undefined) ?? fallback

  const value = window.localStorage.getItem(key)
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const writeStored = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return
  }

  if (key !== STORAGE_KEYS.session) {
    workspaceCache.set(key, value)
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

const ensureSeedData = () => {
  // Buyer, order, and inquiry records are loaded from the authenticated API.
}

export const hydrateBuyerWorkspace = async (): Promise<void> => {
  const [orders, inquiries] = await Promise.all([
    http.get<OrderRecord[]>('/orders'),
    http.get<InquiryRecord[]>('/inquiries'),
  ])
  writeStored(STORAGE_KEYS.orders, orders)
  writeStored(STORAGE_KEYS.inquiries, inquiries)
}

export const clearBuyerWorkspace = () => {
  workspaceCache.delete(STORAGE_KEYS.buyers)
  workspaceCache.delete(STORAGE_KEYS.orders)
  workspaceCache.delete(STORAGE_KEYS.inquiries)
}

const cacheOrder = (updated: OrderRecord) => {
  writeStored(STORAGE_KEYS.orders, getAllOrders().map((order) => order.id === updated.id ? updated : order))
  return updated
}

const cacheInquiry = (updated: InquiryRecord) => {
  writeStored(STORAGE_KEYS.inquiries, getAllInquiries().map((inquiry) => inquiry.id === updated.id ? updated : inquiry))
  return updated
}

export const submitBuyerOrder = async (order: BuyerOrderDraft): Promise<OrderRecord> => {
  const created = await http.post<OrderRecord>('/orders', order)
  writeStored(STORAGE_KEYS.orders, [created, ...getAllOrders()])
  return created
}

export const createManualOrder = async (input: {
  companyName: string; productName: string; productCode: string; quantity: number; unit: string;
  requestedDeliveryDate: string; deliveryAddress: string; notes: string;
}): Promise<OrderRecord> => {
  const created = await http.post<OrderRecord>('/orders/manual', input)
  writeStored(STORAGE_KEYS.orders, [created, ...getAllOrders()])
  return created
}

export const getAllBuyers = () => {
  ensureSeedData()
  return readStored<BuyerUser[]>(STORAGE_KEYS.buyers, [])
}

export const getAllOrders = () => {
  ensureSeedData()
  return readStored<OrderRecord[]>(STORAGE_KEYS.orders, [])
}

export const getAllInquiries = () => {
  ensureSeedData()
  return readStored<InquiryRecord[]>(STORAGE_KEYS.inquiries, [])
}

export const getCurrentSession = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const session = window.localStorage.getItem(STORAGE_KEYS.session)
  if (!session) {
    return null
  }

  try {
    return JSON.parse(session) as SessionUser
  } catch {
    return null
  }
}

export const setCurrentSession = (session: SessionUser | null) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEYS.session)
    clearBuyerWorkspace()
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
}

export const logoutCurrentUser = () => setCurrentSession(null)

export const getBuyerByEmail = (email: string) => {
  const buyers = getAllBuyers()
  return buyers.find((buyer) => buyer.email.toLowerCase() === email.trim().toLowerCase())
}

export const getBuyerById = (buyerId: string) => {
  return getAllBuyers().find((buyer) => buyer.id === buyerId)
}

/** Keep the local order prototype's buyer profile aligned with the authenticated account. */
export const syncAuthenticatedBuyer = (account: {
  id: number
  full_name: string
  email: string | null
  company: string | null
  phone: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  postal_code?: string | null
}) => {
  if (!account.email) return
  const id = `user-${account.id}`
  const buyers = getAllBuyers()
  const existing = buyers.find((buyer) => buyer.id === id)
  const profile: BuyerUser = {
    id,
    companyName: account.company ?? existing?.companyName ?? '',
    contactName: account.full_name,
    email: account.email,
    phone: account.phone ?? existing?.phone ?? '',
    address: account.address ?? existing?.address ?? '',
    city: account.city ?? existing?.city ?? '',
    country: account.country ?? existing?.country ?? '',
    postalCode: account.postal_code ?? existing?.postalCode ?? '',
    website: existing?.website,
    businessRegistration: existing?.businessRegistration,
    createdAt: existing?.createdAt ?? isoNow(),
  }
  const index = buyers.findIndex((buyer) => buyer.id === id)
  if (index === -1) buyers.push(profile)
  else buyers[index] = profile
  writeStored(STORAGE_KEYS.buyers, buyers)
}

export const getOrdersForBuyer = (buyerId: string) => {
  return getAllOrders().filter((order) => order.buyerId === buyerId)
}

export const getOrderById = (orderId: string) => {
  return getAllOrders().find((order) => order.id === orderId)
}

export type BuyerOrderDraft = Omit<
  OrderRecord,
  | 'id'
  | 'buyerId'
  | 'buyerName'
  | 'companyName'
  | 'createdAt'
  | 'updatedAt'
  | 'submittedAt'
  | 'statusHistory'
  | 'status'
  | 'source'
  | 'buyerVisibleUpdates'
  | 'reviewHistory'
  | 'materialAvailability'
> & { status?: OrderStatus }

export const createOrderForBuyer = (buyerId: string, order: BuyerOrderDraft) => {
  const buyer = getAllBuyers().find((entry) => entry.id === buyerId)

  if (!buyer) {
    throw new Error('Buyer account not found')
  }
  if (!Number.isFinite(order.quantity) || order.quantity <= 0) {
    throw new Error('Order quantity must be greater than zero.')
  }

  const createdAt = isoNow()
  const orders = getAllOrders()
  let orderId = ''
  do {
    orderId = `ORD-${Date.now().toString().slice(-7)}-${Math.floor(100 + Math.random() * 900)}`
  } while (orders.some((existing) => existing.id === orderId))

  const record: OrderRecord = {
    ...order,
    id: orderId,
    buyerId,
    buyerName: buyer.contactName,
    companyName: buyer.companyName,
    buyerEmail: buyer.email,
    buyerPhone: buyer.phone,
    createdAt,
    updatedAt: createdAt,
    submittedAt: createdAt,
    source: 'Buyer Portal',
    status: 'Submitted',
    buyerVisibleUpdates: [],
    reviewHistory: [],
    statusHistory: [
      {
        status: 'Submitted',
        note: 'Order submitted and awaiting Ram’s review.',
        timestamp: createdAt,
      },
    ],
  }

  orders.unshift(record)
  writeStored(STORAGE_KEYS.orders, orders)
  return record
}

export const getMaterialAvailability = (orderId: string) => {
  return getOrderById(orderId)?.materialAvailability ?? null
}

export const recordDemoMaterialAvailability = async (
  orderId: string,
  availableQuantity: number,
  notes: string,
) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId)
  if (index === -1) return null
  if (!Number.isFinite(availableQuantity) || availableQuantity < 0) {
    throw new Error('Available material quantity must be zero or greater.')
  }

  const order = orders[index]
  const saved = await http.post<OrderRecord>(`/orders/${encodeURIComponent(orderId)}/material-check`, {
    availableQuantity,
    unit: order.unit,
    notes,
  })
  cacheOrder(saved)
  return saved.materialAvailability ?? null
}

export const recordInventoryMaterialAvailability = async (
  orderId: string,
  notes: string,
) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId)
  if (index === -1) return null

  const order = orders[index]
  if (!order.yarnId) throw new Error('This order is not linked to a yarn inventory row.')
  const saved = await http.post<OrderRecord>(`/orders/${encodeURIComponent(orderId)}/material-check`, { notes })
  cacheOrder(saved)
  return saved.materialAvailability ?? null
}

export const addOrderReviewNote = async (orderId: string, note: string, reviewer: string) => {
  return recordOrderReviewAction(orderId, {
    action: 'note',
    reviewer,
    note,
  })
}

export const recordOrderReviewAction = async (
  orderId: string,
  event: Omit<OrderReviewEvent, 'timestamp'> & { buyerMessage?: string; nextStatus?: OrderStatus },
) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId)

  if (index === -1) {
    return null
  }

  const saved = await http.post<OrderRecord>(`/orders/${encodeURIComponent(orderId)}/review`, event, { timeoutMs: 120_000 })
  return cacheOrder(saved)
}

export const addBuyerOrderResponse = async (orderId: string, message: string, buyerId: string) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId && order.buyerId === buyerId)
  if (index === -1) return null

  const saved = await http.post<OrderRecord>(`/orders/${encodeURIComponent(orderId)}/buyer-response`, { message })
  return cacheOrder(saved)
}

export const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus, note: string) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId)

  if (index === -1) return null

  const saved = await http.patch<OrderRecord>(`/orders/${encodeURIComponent(orderId)}/status`, { status: nextStatus, note })
  return cacheOrder(saved)
}
export const createInquiryForOrder = async (orderId: string, subject: string, type: InquiryRecord['type'], message: string) => {
  const record = await http.post<InquiryRecord>('/inquiries', { orderId, subject, type, message })
  writeStored(STORAGE_KEYS.inquiries, [record, ...getAllInquiries()])
  return record
}

export const getInquiriesForBuyer = (buyerId: string) => {
  return getAllInquiries().filter((inquiry) => inquiry.buyerId === buyerId)
}

export const respondToInquiry = async (inquiryId: string, message: string) => {
  const inquiries = getAllInquiries()
  const index = inquiries.findIndex((inquiry) => inquiry.id === inquiryId)

  if (index === -1) {
    return null
  }

  const saved = await http.post<InquiryRecord>(`/inquiries/${encodeURIComponent(inquiryId)}/messages`, { message })
  return cacheInquiry(saved)
}

export const updateInquiryStatus = async (inquiryId: string, status: InquiryStatus) => {
  const inquiries = getAllInquiries()
  const index = inquiries.findIndex((inquiry) => inquiry.id === inquiryId)

  if (index === -1) {
    return null
  }

  const saved = await http.patch<InquiryRecord>(`/inquiries/${encodeURIComponent(inquiryId)}/status`, { status })
  return cacheInquiry(saved)
}

export const getAdminOverview = () => {
  const orders = getAllOrders()
  const counts = {
    totalOrders: orders.length,
    newRequests: orders.filter((order) => order.status === 'Submitted').length,
    awaitingReview: orders.filter((order) => order.status === 'Under Review').length,
    acceptedOrders: orders.filter((order) => order.status === 'Accepted').length,
    inProduction: orders.filter((order) => order.status === 'In Production').length,
    qualityCheck: orders.filter((order) => order.status === 'Quality Check').length,
    readyToDispatch: orders.filter((order) => order.status === 'Ready to Dispatch').length,
    delayedOrders: orders.filter((order) => order.status === 'Clarification Required' || order.status === 'Rejected').length,
  }
  return { ...counts, recentOrders: [...orders].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6) }
}

export const updateBuyerProfile = (buyerId: string, updates: Partial<BuyerUser>) => {
  const buyers = getAllBuyers()
  const index = buyers.findIndex((buyer) => buyer.id === buyerId)

  if (index === -1) {
    return null
  }

  const updatedBuyer = {
    ...buyers[index],
    ...updates,
  }
  buyers[index] = updatedBuyer
  writeStored(STORAGE_KEYS.buyers, buyers)

  const session = getCurrentSession()
  if (session && session.userId === buyerId) {
    setCurrentSession({
      ...session,
      name: updatedBuyer.contactName,
      companyName: updatedBuyer.companyName,
    })
  }

  return updatedBuyer
}
