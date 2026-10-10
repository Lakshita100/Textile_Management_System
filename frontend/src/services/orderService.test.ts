import { beforeEach, describe, expect, it } from 'vitest'
import {
  addBuyerOrderResponse,
  createOrderForBuyer,
  getMaterialAvailability,
  getOrdersForBuyer,
  recordDemoMaterialAvailability,
  recordOrderReviewAction,
  signInDemo,
} from './orderService'

const createTestOrder = () => createOrderForBuyer('buyer-demo', {
  productName: 'Test cotton yarn',
  productCode: 'TEST-01',
  productCategory: 'Yarn',
  yarnType: 'Cotton',
  yarnSubtype: 'Combed',
  materialComposition: '100% cotton',
  technicalSpecifications: 'Even twist',
  denierCount: '30s Ne',
  shade: 'Natural',
  specialRequirements: '',
  quantity: 100,
  unit: 'kg',
  priority: 'Standard',
  requestedDeliveryDate: '2026-12-01',
  deliveryAddress: 'Test delivery address',
  deliveryInstructions: '',
  targetPrice: '',
  buyerNotes: '',
  technicalNotes: '',
  commercialNotes: 'Quotation requested',
})

describe('buyer order review workflow', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    const storage: Storage = {
      get length() { return values.size },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => { values.delete(key) },
      setItem: (key, value) => { values.set(key, value) },
    }
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
    signInDemo('buyer@everestmills.com', 'Demo@1234')
  })

  it('creates a unique buyer-portal order and leaves availability unchecked', () => {
    const first = createTestOrder()
    const second = createTestOrder()

    expect(first.id).not.toBe(second.id)
    expect(first.source).toBe('Buyer Portal')
    expect(first.status).toBe('Submitted')
    expect(getOrdersForBuyer('buyer-demo').map((order) => order.id)).toContain(first.id)
    expect(getMaterialAvailability(first.id)).toBeNull()
  })

  it('derives the demo material state from Ram-entered availability, not assumed stock', () => {
    const order = createTestOrder()

    expect(recordDemoMaterialAvailability(order.id, 0, '', 'Ram')?.status).toBe('Insufficient Stock')
    expect(recordDemoMaterialAvailability(order.id, 25, 'Partial lot identified', 'Ram')?.status).toBe('Partially Available')
    const fullCheck = recordDemoMaterialAvailability(order.id, 100, 'Confirmed for demo review', 'Ram')
    expect(fullCheck?.status).toBe('Available')
    expect(fullCheck?.shortageQuantity).toBe(0)
    expect(fullCheck?.source).toBe('Ram demo check')
    expect(fullCheck?.orderId).toBe(order.id)
  })

  it('requires an available material check for approval and keeps internal notes private', () => {
    const order = createTestOrder()

    expect(() => recordOrderReviewAction(order.id, {
      action: 'approved',
      reviewer: 'Ram',
      note: 'Internal commercial review note',
      nextStatus: 'Accepted',
      buyerMessage: 'Your order is approved.',
    })).toThrow('An order can only be approved after an available material check.')

    recordDemoMaterialAvailability(order.id, 100, '', 'Ram')
    const approved = recordOrderReviewAction(order.id, {
      action: 'approved',
      reviewer: 'Ram',
      note: 'Internal commercial review note',
      nextStatus: 'Accepted',
      buyerMessage: 'Your order is approved.',
    })

    expect(approved?.status).toBe('Accepted')
    expect(approved?.reviewHistory?.[approved.reviewHistory.length - 1]?.note).toBe('Internal commercial review note')
    expect(approved?.buyerVisibleUpdates?.[approved.buyerVisibleUpdates.length - 1]?.message).toBe('Your order is approved.')
    expect(approved?.statusHistory[approved.statusHistory.length - 1]?.note).toBe('Your order is approved.')
  })

  it('sends clarification to the buyer and returns the response to review', () => {
    const order = createTestOrder()
    recordOrderReviewAction(order.id, {
      action: 'clarification-requested',
      reviewer: 'Ram',
      note: 'Internal note not for the buyer',
      nextStatus: 'Clarification Required',
      buyerMessage: 'Please confirm the shade reference.',
    })

    const returned = addBuyerOrderResponse(order.id, 'Use shade reference NAV-204.', 'buyer-demo')
    expect(returned?.status).toBe('Under Review')
    expect(returned?.buyerVisibleUpdates?.map((item) => item.message)).toEqual([
      'Please confirm the shade reference.',
      'Use shade reference NAV-204.',
    ])
    expect(returned?.buyerVisibleUpdates?.some((item) => item.message.includes('Internal note'))).toBe(false)
  })
})
