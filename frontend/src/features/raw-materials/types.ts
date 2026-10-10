export const YARN_CATEGORIES = [
  'False-Twisted & Textured',
  'Mechanical Stretch',
  'Air-Textured Yarn (ATY)',
  'Melange & Multi-Tone',
  'Worsted & Wool-Like',
  'Eco-Innovative & Recycled',
] as const;

export type YarnCategory = (typeof YARN_CATEGORIES)[number];

export const INVENTORY_STAGES = ['Purchased Input', 'Work in Progress', 'Finished Yarn'] as const;

export type InventoryStage = (typeof INVENTORY_STAGES)[number];

export const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];

/**
 * Raw yarn record as it arrives from a dataset row (no derived fields).
 * Stock status is intentionally not stored — it is derived from the stock rules.
 */
export interface YarnRow {
  yarnId: string;
  /** Local public URL of the thumbnail image, e.g. `/samples/yarn_01.jpg`. */
  imageFile: string;
  yarnName: string;
  productCode: string;
  category: YarnCategory;
  materialComposition: string;
  colourShade: string;
  denierSpecification: string;
  currentStock: number;
  unit: string;
  unitCost: number;
  supplierSource: string;
  minimumStockLevel: number;
  storageLocation: string;
  batchNumber: string;
  inventoryStage: InventoryStage;
}

/** A yarn row plus the stock status derived from its stock quantities. */
export interface YarnItem extends YarnRow {
  stockStatus: StockStatus;
  /** True only for clearly-labelled demo records (DEMO-* ids) from the seed script. */
  isDemo?: boolean;
  /** ISO datetime of the last server-side change (dashboard "recently updated"). */
  updatedAt?: string | null;
}

export const MOVEMENT_TYPES = ['Stock In', 'Consumption'] as const;

export type StockMovementType = (typeof MOVEMENT_TYPES)[number];

/**
 * Supplier record. Contact fields start empty and render as "Not provided" —
 * this project never invents company phone numbers, emails or addresses.
 */
export interface Supplier {
  supplierId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  /** Yarn categories this supplier supplies (from the dataset or user edits). */
  yarnTypes: string[];
  /** Product codes this supplier supplies (from the dataset or user edits). */
  productCodes: string[];
  /** Price per kg in dataset units, null when unknown. */
  pricePerKg: number | null;
  /** Minimum order quantity in kg, null when unknown. */
  minOrderQty: number | null;
  /** Estimated lead time in days, null when unknown. */
  leadTimeDays: number | null;
  notes: string;
  /** Inactive suppliers stay in history but cannot be assigned to new work. */
  active: boolean;
  /** True only for clearly-labelled demo suppliers ([DEMO] prefix) from the seed script. */
  isDemo?: boolean;
  /** Yarn records whose Supplier / Source matches this company. */
  suppliedYarnCount?: number;
}

/** One auditable stock movement row as returned by the movements API. */
export interface StockMovement {
  movementId: string;
  yarnId: string;
  yarnName?: string;
  unit?: string;
  movementType: StockMovementType;
  quantity: number;
  date: string;
  reference: string;
  stockAfter: number;
  previousQuantity: number;
  supplierName?: string | null;
  notes?: string | null;
  reason?: string | null;
  reversalOf?: string | null;
  createdAt?: string | null;
}

export const PURCHASE_REQUEST_STATUSES = ['draft', 'submitted', 'cancelled'] as const;

export type PurchaseRequestStatus = (typeof PURCHASE_REQUEST_STATUSES)[number];

/** Purchase-request draft (never sent to a supplier by this app). */
export interface PurchaseRequest {
  requestId: string;
  yarnId: string;
  yarnName?: string;
  supplierId?: string | null;
  supplierName: string;
  quantity: number;
  unit: string;
  bufferQuantity: number;
  shortageQuantity?: number;
  estimatedUnitCost?: number | null;
  estimatedTotalCost?: number | null;
  minOrderQty?: number | null;
  expectedDeliveryDate?: string | null;
  status: PurchaseRequestStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string;
}

export const ALERT_STATUSES = ['active', 'acknowledged', 'resolved'] as const;

export type AlertStatus = (typeof ALERT_STATUSES)[number];

/**
 * Low-stock alert lifecycle: active → acknowledged → resolved.
 * One open (non-resolved) alert per yarn; reconciliation creates and closes them.
 */
export interface StockAlert {
  alertId: string;
  yarnId: string;
  status: AlertStatus;
  /** ISO date the alert first triggered. */
  createdAt: string;
  /** ISO date of the last status change. */
  updatedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  /* Enriched by the API from live inventory + supplier records: */
  yarnName: string;
  /** "Low Stock" | "Out of Stock" — computed by the backend. */
  kind: string;
  currentStock: number;
  minimumStockLevel: number;
  /** minimum stock level − current stock (0 when at/above the minimum). */
  shortage: number;
  unit: string;
  /** Current supplier contact for the yarn (null when none is stored). */
  supplier: AlertSupplier | null;
}

/** Contact snapshot returned with an alert — never fabricated. */
export interface AlertSupplier {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
  supplierId: string | null;
}
