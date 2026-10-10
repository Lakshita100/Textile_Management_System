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
  | 'Ready to Dispatch'
  | 'Dispatched'
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
  source: 'Ram demo check'
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

const seedOrders = (): OrderRecord[] => [
  {
    id: 'ORD-2048',
    buyerId: 'buyer-demo',
    buyerName: 'Aisha Rahman',
    companyName: 'Northwind Retail',
    source: 'Buyer Portal',
    productName: 'Cotton Twill Yarn',
    productCode: 'CTY-1001',
    yarnType: 'Cotton',
    materialComposition: '100% Cotton',
    shade: 'Navy Blue',
    quantity: 1200,
    unit: 'kg',
    requestedDeliveryDate: '2026-10-14',
    deliveryAddress: 'Plot 18, Bhiwandi Industrial Estate, Maharashtra',
    deliveryInstructions: 'Gate 3, forklift required',
    technicalNotes: 'Need low lint and high twist.',
    commercialNotes: 'Looking for 3% price flexibility if lead time is maintained.',
    status: 'In Production',
    createdAt: '2026-10-02T09:35:00.000Z',
    updatedAt: '2026-10-06T13:15:00.000Z',
    submittedAt: '2026-10-02T09:35:00.000Z',
    statusHistory: [
      { status: 'Submitted', note: 'Order submitted from buyer portal', timestamp: '2026-10-02T09:35:00.000Z' },
      { status: 'Under Review', note: 'Commercial team reviewing quantity and delivery', timestamp: '2026-10-02T12:00:00.000Z' },
      { status: 'Accepted', note: 'Order accepted with delivery commitment', timestamp: '2026-10-03T15:40:00.000Z' },
      { status: 'Material Check', note: 'Raw cotton allocation confirmed', timestamp: '2026-10-04T10:15:00.000Z' },
      { status: 'Scheduled', note: 'Production slot reserved for week 42', timestamp: '2026-10-05T08:15:00.000Z' },
      { status: 'In Production', note: 'Twill spinning initiated', timestamp: '2026-10-06T13:15:00.000Z' },
    ],
  },
  {
    id: 'ORD-2054',
    buyerId: 'buyer-demo',
    buyerName: 'Aisha Rahman',
    companyName: 'Northwind Retail',
    source: 'Buyer Portal',
    productName: 'Recycled Polyester Blend',
    productCode: 'RPB-880',
    yarnType: 'Synthetic',
    materialComposition: '65% Recycled Polyester / 35% Cotton',
    shade: 'Stone Grey',
    quantity: 850,
    unit: 'kg',
    requestedDeliveryDate: '2026-10-18',
    deliveryAddress: 'Plot 18, Bhiwandi Industrial Estate, Maharashtra',
    deliveryInstructions: 'Use palletised unloading',
    technicalNotes: 'Need medium twist and consistent dye lot.',
    commercialNotes: 'Please share quotation before production approval.',
    status: 'Quotation Sent',
    createdAt: '2026-10-05T16:25:00.000Z',
    updatedAt: '2026-10-07T08:25:00.000Z',
    submittedAt: '2026-10-05T16:25:00.000Z',
    statusHistory: [
      { status: 'Submitted', note: 'Buyer submitted RFQ for eco-friendly blend', timestamp: '2026-10-05T16:25:00.000Z' },
      { status: 'Under Review', note: 'Technical team validating yarn specification', timestamp: '2026-10-06T09:20:00.000Z' },
      { status: 'Quotation Sent', note: 'Quotation delivered for buyer review', timestamp: '2026-10-07T08:25:00.000Z' },
    ],
  },
  {
    id: 'ORD-2091',
    buyerId: 'buyer-2',
    buyerName: 'Riya Mehta',
    companyName: 'Bluepeak Apparel',
    source: 'Manual',
    productName: 'Premium Denim Yarn',
    productCode: 'DNY-412',
    yarnType: 'Denim',
    materialComposition: '98% Cotton / 2% Lycra',
    shade: 'Deep Indigo',
    quantity: 1400,
    unit: 'kg',
    requestedDeliveryDate: '2026-10-22',
    deliveryAddress: 'Warehouse 5, Surat Textile Cluster, Gujarat',
    deliveryInstructions: 'Packed in 25 kg bags',
    technicalNotes: 'Need stretch recovery and even dye consistency.',
    commercialNotes: 'Urgent dispatch preference if available.',
    status: 'Ready to Dispatch',
    createdAt: '2026-09-28T11:10:00.000Z',
    updatedAt: '2026-10-08T14:20:00.000Z',
    submittedAt: '2026-09-28T11:10:00.000Z',
    statusHistory: [
      { status: 'Submitted', note: 'Manual order received by sales desk', timestamp: '2026-09-28T11:10:00.000Z' },
      { status: 'Accepted', note: 'Order accepted after technical validation', timestamp: '2026-09-29T09:45:00.000Z' },
      { status: 'Material Check', note: 'Yarn lot aligned', timestamp: '2026-09-30T12:00:00.000Z' },
      { status: 'Scheduled', note: 'Production scheduled to complete by Oct 19', timestamp: '2026-10-02T10:00:00.000Z' },
      { status: 'In Production', note: 'Production in final shift', timestamp: '2026-10-05T16:00:00.000Z' },
      { status: 'Quality Check', note: 'Quality pass with minor rework', timestamp: '2026-10-07T18:25:00.000Z' },
      { status: 'Ready to Dispatch', note: 'Dispatch cleared for warehouse release', timestamp: '2026-10-08T14:20:00.000Z' },
    ],
  },
]

const seedBuyers = (): BuyerUser[] => [
  {
    id: 'buyer-demo',
    companyName: 'Northwind Retail',
    contactName: 'Aisha Rahman',
    email: 'buyer@everestmills.com',
    phone: '+91 98765 43210',
    address: '14 Market Road, Andheri East',
    city: 'Mumbai',
    country: 'India',
    website: 'https://northwindretail.example',
    businessRegistration: 'GSTIN: 27AABCN1234F1Z2',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'buyer-2',
    companyName: 'Bluepeak Apparel',
    contactName: 'Riya Mehta',
    email: 'riya@bluepeak.app',
    phone: '+91 99887 66554',
    address: '93 Textile Avenue, Ring Road',
    city: 'Surat',
    country: 'India',
    businessRegistration: 'GSTIN: 24ABCDQ1234F1Z5',
    createdAt: '2026-09-10T10:00:00.000Z',
  },
]

const seedInquiries = (): InquiryRecord[] => [
  {
    id: 'INQ-1001',
    buyerId: 'buyer-demo',
    orderId: 'ORD-2048',
    subject: 'Requesting technical clarification on twist specification',
    type: 'Product',
    status: 'Awaiting Response',
    createdAt: '2026-10-06T12:00:00.000Z',
    updatedAt: '2026-10-07T16:00:00.000Z',
    messages: [
      { sender: 'buyer', text: 'Can you confirm if 36s twist is acceptable for this batch?', timestamp: '2026-10-06T12:00:00.000Z' },
      { sender: 'admin', text: 'Yes, the mill can support 36s twist with a slight variation tolerance of ±3%.', timestamp: '2026-10-07T16:00:00.000Z' },
    ],
  },
  {
    id: 'INQ-1002',
    buyerId: 'buyer-2',
    orderId: 'ORD-2091',
    subject: 'Dispatch timing for warehouse handoff',
    type: 'Delivery',
    status: 'Open',
    createdAt: '2026-10-08T09:00:00.000Z',
    updatedAt: '2026-10-08T09:00:00.000Z',
    messages: [
      { sender: 'buyer', text: 'Please confirm whether a dispatch window is available for next Tuesday.', timestamp: '2026-10-08T09:00:00.000Z' },
    ],
  },
]

const readStored = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback
  }

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

  window.localStorage.setItem(key, JSON.stringify(value))
}

const ensureSeedData = () => {
  const buyers = readStored<BuyerUser[]>(STORAGE_KEYS.buyers, [])
  if (!buyers.length) {
    writeStored(STORAGE_KEYS.buyers, seedBuyers())
  }

  const orders = readStored<OrderRecord[]>(STORAGE_KEYS.orders, [])
  if (!orders.length) {
    writeStored(STORAGE_KEYS.orders, seedOrders())
  }

  const inquiries = readStored<InquiryRecord[]>(STORAGE_KEYS.inquiries, [])
  if (!inquiries.length) {
    writeStored(STORAGE_KEYS.inquiries, seedInquiries())
  }
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
    address: existing?.address ?? '',
    city: existing?.city ?? '',
    country: existing?.country ?? '',
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
> & { source?: 'Buyer Portal'; status?: OrderStatus }

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

export const recordDemoMaterialAvailability = (
  orderId: string,
  availableQuantity: number,
  notes: string,
  checkedBy: string,
) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId)
  if (index === -1) return null
  if (!Number.isFinite(availableQuantity) || availableQuantity < 0) {
    throw new Error('Available material quantity must be zero or greater.')
  }

  const order = orders[index]
  const checkedAt = isoNow()
  const checkedQuantity = Math.max(0, availableQuantity)
  const materialAvailability: MaterialAvailability = {
    orderId,
    status: checkedQuantity >= order.quantity
      ? 'Available'
      : checkedQuantity > 0
        ? 'Partially Available'
        : 'Insufficient Stock',
    availableQuantity: checkedQuantity,
    requiredQuantity: order.quantity,
    shortageQuantity: Math.max(0, order.quantity - checkedQuantity),
    unit: order.unit,
    notes,
    checkedBy,
    checkedAt,
    source: 'Ram demo check',
  }

  orders[index] = { ...order, materialAvailability, updatedAt: checkedAt }
  writeStored(STORAGE_KEYS.orders, orders)
  return materialAvailability
}

export const addOrderReviewNote = (orderId: string, note: string, reviewer: string) => {
  return recordOrderReviewAction(orderId, {
    action: 'note',
    reviewer,
    note,
  })
}

export const recordOrderReviewAction = (
  orderId: string,
  event: Omit<OrderReviewEvent, 'timestamp'> & { buyerMessage?: string; nextStatus?: OrderStatus },
) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId)

  if (index === -1) {
    return null
  }

  const order = orders[index]
  if (event.action === 'approved' && order.materialAvailability?.status !== 'Available') {
    throw new Error('An order can only be approved after an available material check.')
  }
  if (event.action === 'rejected' && !event.note.trim()) {
    throw new Error('A rejection reason is required.')
  }
  if (
    (event.action === 'clarification-requested' || event.action === 'delivery-revision-requested')
    && !event.buyerMessage?.trim()
  ) {
    throw new Error('A buyer-visible clarification message is required.')
  }
  const timestamp = isoNow()
  const status = event.nextStatus ?? order.status
  const buyerVisibleUpdates = event.buyerMessage?.trim()
    ? [...(order.buyerVisibleUpdates ?? []), { message: event.buyerMessage.trim(), sender: 'admin' as const, timestamp }]
    : order.buyerVisibleUpdates ?? []
  const updatedOrder = {
    ...order,
    status,
    updatedAt: timestamp,
    statusHistory: status === order.status
      ? order.statusHistory
      : [...order.statusHistory, {
        status,
        note: event.buyerMessage?.trim() || `Your order status was updated to ${status}.`,
        timestamp,
      }],
    buyerVisibleUpdates,
    reviewHistory: [...(order.reviewHistory ?? []), {
      action: event.action,
      reviewer: event.reviewer,
      note: event.note,
      timestamp,
    }],
  }

  orders[index] = updatedOrder
  writeStored(STORAGE_KEYS.orders, orders)
  return updatedOrder
}

export const addBuyerOrderResponse = (orderId: string, message: string, buyerId: string) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId && order.buyerId === buyerId)
  if (index === -1) return null

  const timestamp = isoNow()
  const order = orders[index]
  const updatedOrder: OrderRecord = {
    ...order,
    status: 'Under Review',
    updatedAt: timestamp,
    statusHistory: [...order.statusHistory, {
      status: 'Under Review',
      note: 'Your response was received and the order is back under review.',
      timestamp,
    }],
    buyerVisibleUpdates: [...(order.buyerVisibleUpdates ?? []), {
      message: message.trim(),
      sender: 'buyer',
      timestamp,
    }],
    reviewHistory: [...(order.reviewHistory ?? []), {
      action: 'buyer-response',
      reviewer: order.buyerName,
      note: 'Buyer submitted a response to the clarification request.',
      timestamp,
    }],
  }
  orders[index] = updatedOrder
  writeStored(STORAGE_KEYS.orders, orders)
  return updatedOrder
}

export const updateOrderStatus = (orderId: string, nextStatus: OrderStatus, note: string) => {
  const orders = getAllOrders()
  const index = orders.findIndex((order) => order.id === orderId)

  if (index === -1) return null

  const order = orders[index]
  const timestamp = isoNow()
  const updatedOrder = {
    ...order,
    status: nextStatus,
    updatedAt: timestamp,
    statusHistory: [...order.statusHistory, { status: nextStatus, note, timestamp }],
  }

  orders[index] = updatedOrder
  writeStored(STORAGE_KEYS.orders, orders)
  return updatedOrder
}
export const createInquiryForOrder = (buyerId: string, orderId: string, subject: string, type: InquiryRecord['type'], message: string) => {
  const createdAt = isoNow()
  const record: InquiryRecord = {
    id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
    buyerId,
    orderId,
    subject,
    type,
    status: 'Open',
    createdAt,
    updatedAt: createdAt,
    messages: [{ sender: 'buyer', text: message, timestamp: createdAt }],
  }

  const inquiries = getAllInquiries()
  inquiries.unshift(record)
  writeStored(STORAGE_KEYS.inquiries, inquiries)
  return record
}

export const getInquiriesForBuyer = (buyerId: string) => {
  return getAllInquiries().filter((inquiry) => inquiry.buyerId === buyerId)
}

export const respondToInquiry = (inquiryId: string, message: string) => {
  const inquiries = getAllInquiries()
  const index = inquiries.findIndex((inquiry) => inquiry.id === inquiryId)

  if (index === -1) {
    return null
  }

  const inquiry = inquiries[index]
  const timestamp = isoNow()
  const updatedInquiry: InquiryRecord = {
    ...inquiry,
    status: 'Awaiting Response',
    updatedAt: timestamp,
    messages: [...inquiry.messages, { sender: 'admin', text: message, timestamp }],
  }

  inquiries[index] = updatedInquiry
  writeStored(STORAGE_KEYS.inquiries, inquiries)
  return updatedInquiry
}

export const updateInquiryStatus = (inquiryId: string, status: InquiryStatus) => {
  const inquiries = getAllInquiries()
  const index = inquiries.findIndex((inquiry) => inquiry.id === inquiryId)

  if (index === -1) {
    return null
  }

  const inquiry = inquiries[index]
  const updatedInquiry = {
    ...inquiry,
    status,
    updatedAt: isoNow(),
  }

  inquiries[index] = updatedInquiry
  writeStored(STORAGE_KEYS.inquiries, inquiries)
  return updatedInquiry
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
