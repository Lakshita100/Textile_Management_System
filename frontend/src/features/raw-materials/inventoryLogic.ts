import { INVENTORY_STAGES, YARN_CATEGORIES, type InventoryStage, type StockStatus, type YarnCategory, type YarnItem, type YarnRow } from './types';

/** Rows shown per page in the inventory table. */
export const PAGE_SIZE = 10;

/** Default thumbnail for newly added yarn records (local asset in `public/samples/`). */
export const DEFAULT_YARN_IMAGE = '/samples/yarn_01.jpg';

export interface InventoryFilters {
  /** Free-text search across yarn ID, yarn name and product code. */
  query: string;
  /** Empty string means "all categories". */
  category: string;
  /** Empty string means "all stock statuses". */
  status: string;
  /** Empty string means "all suppliers" (exact company name). */
  supplier: string;
  /** Empty string means "all inventory stages". */
  stage: string;
  /** Empty string means "all colours" (contains match). */
  colour: string;
}

export const EMPTY_FILTERS: InventoryFilters = {
  query: '',
  category: '',
  status: '',
  supplier: '',
  stage: '',
  colour: '',
};

export function hasActiveFilters(filters: InventoryFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.category !== '' ||
    filters.status !== '' ||
    filters.supplier !== '' ||
    filters.stage !== '' ||
    filters.colour !== ''
  );
}

/**
 * Stock rules:
 * - Out of Stock: quantity is zero
 * - Low Stock: quantity is above zero and below the minimum stock level
 * - In Stock: quantity is at or above the minimum stock level
 */
export function resolveStockStatus(currentStock: number, minimumStockLevel: number): StockStatus {
  if (currentStock <= 0) {
    return 'Out of Stock';
  }
  if (currentStock < minimumStockLevel) {
    return 'Low Stock';
  }
  return 'In Stock';
}

/** Format numbers in compact 'k', 'M', 'B' notation (e.g. 12.35k, 3.56M, 1.2B). */
export function formatKNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  const absVal = Math.abs(value);
  if (absVal >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `${b % 1 === 0 ? b.toFixed(0) : b.toFixed(2).replace(/\.?0+$/, '')}B`;
  }
  if (absVal >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (absVal >= 1_000) {
    const k = value / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(2).replace(/\.?0+$/, '')}k`;
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Server-side inventory summary (SQL aggregates — never computed in the browser). */
export interface InventorySummary {
  /** Number of yarn records in the inventory. */
  totalYarnTypes: number;
  /** Sum of current stock quantities. */
  totalAvailableStock: number;
  /** Number of records whose derived status is "Low Stock". */
  lowStockItems: number;
  /** Number of records whose derived status is "Out of Stock". */
  outOfStockItems: number;
  /** Sum of current stock quantity × unit cost (no currency applied). */
  inventoryValue: number;
  /** Stock unit shared by the dataset rows (e.g. "kg"). */
  stockUnit: string;
  /** Suppliers stored in the database. */
  totalSuppliers: number;
  /** Clearly-labelled demo records (DEMO-*), 0 when no demo seed was run. */
  demoCount: number;
  /** Open (active + acknowledged) low-stock alerts. */
  openAlerts: number;
}

/** Distinct filter values for the inventory toolbar dropdowns. */
export interface InventoryFacets {
  categories: string[];
  stages: string[];
  colours: string[];
  suppliers: string[];
}

export const EMPTY_FACETS: InventoryFacets = { categories: [], stages: [], colours: [], suppliers: [] };

/* ---------------------------------------------------------------------------
 * Yarn form (add / edit)
 * ------------------------------------------------------------------------- */

/** Form model: every value is a string so inputs stay controlled. */
export interface YarnFormValues {
  yarnId: string;
  imageFile: string;
  yarnName: string;
  productCode: string;
  category: string;
  materialComposition: string;
  colourShade: string;
  denierSpecification: string;
  currentStock: string;
  unit: string;
  unitCost: string;
  supplierSource: string;
  minimumStockLevel: string;
  storageLocation: string;
  batchNumber: string;
  inventoryStage: string;
}

export type YarnFormErrors = Partial<Record<keyof YarnFormValues, string>>;

export const YARN_FIELD_LABELS: Record<keyof YarnFormValues, string> = {
  yarnId: 'Yarn ID',
  imageFile: 'Yarn image',
  yarnName: 'Yarn name',
  productCode: 'Product code',
  category: 'Yarn Type / Category',
  materialComposition: 'Material / composition',
  colourShade: 'Colour / shade',
  denierSpecification: 'Denier / specification',
  currentStock: 'Current stock quantity',
  unit: 'Stock unit',
  unitCost: 'Unit cost (₹)',
  supplierSource: 'Supplier / source',
  minimumStockLevel: 'Minimum stock level',
  storageLocation: 'Storage location',
  batchNumber: 'Batch number',
  inventoryStage: 'Inventory stage',
};

export const REQUIRED_YARN_FIELDS: (keyof YarnFormValues)[] = [
  'yarnId',
  'yarnName',
  'category',
  'currentStock',
  'unitCost',
];

export function createEmptyYarnForm(items: YarnItem[] = []): YarnFormValues {
  const nextId = items.length > 0 ? nextYarnId(items) : 'YRN-00001';
  const numPart = nextId.replace('YRN-', '');
  return {
    yarnId: nextId,
    imageFile: DEFAULT_YARN_IMAGE,
    yarnName: '',
    productCode: `PC-${numPart}`,
    category: YARN_CATEGORIES[0],
    materialComposition: 'Polyester / Cotton Blend',
    colourShade: 'Natural / Raw',
    denierSpecification: '150D/48F',
    currentStock: '0',
    unit: 'kg',
    unitCost: '0.00',
    supplierSource: '',
    minimumStockLevel: '100',
    storageLocation: 'Warehouse A',
    batchNumber: `B-${numPart}`,
    inventoryStage: INVENTORY_STAGES[0],
  };
}

export function rowToYarnForm(row?: YarnRow): YarnFormValues {
  if (!row) {
    return createEmptyYarnForm();
  }
  return {
    yarnId: row.yarnId,
    imageFile: row.imageFile,
    yarnName: row.yarnName,
    productCode: row.productCode,
    category: row.category,
    materialComposition: row.materialComposition,
    colourShade: row.colourShade,
    denierSpecification: row.denierSpecification,
    currentStock: String(row.currentStock),
    unit: row.unit,
    unitCost: String(row.unitCost),
    supplierSource: row.supplierSource,
    minimumStockLevel: String(row.minimumStockLevel),
    storageLocation: row.storageLocation,
    batchNumber: row.batchNumber,
    inventoryStage: row.inventoryStage,
  };
}

export function validateYarnForm(
  values: YarnFormValues,
  existingItems: YarnItem[],
  editingYarnId?: string,
): YarnFormErrors {
  const errors: YarnFormErrors = {};

  for (const field of REQUIRED_YARN_FIELDS) {
    if (!values[field] || values[field].trim() === '') {
      errors[field] = `${YARN_FIELD_LABELS[field]} is required`;
    }
  }

  const numericFields: (keyof YarnFormValues)[] = ['currentStock', 'unitCost', 'minimumStockLevel'];
  for (const field of numericFields) {
    const raw = (values[field] ?? '').trim();
    if (raw === '' || errors[field]) {
      continue;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      errors[field] = 'Enter a valid number';
    } else if (parsed < 0) {
      errors[field] = 'Cannot be negative';
    }
  }

  const yarnId = (values.yarnId ?? '').trim();
  if (!errors.yarnId) {
    const duplicate = existingItems.some(
      (item) => item.yarnId.toLowerCase() === yarnId.toLowerCase() && item.yarnId !== editingYarnId,
    );
    if (duplicate) {
      errors.yarnId = 'Yarn ID already exists';
    }
  }

  return errors;
}

/** Builds a typed row from validated form values. Only call after `validateYarnForm` passes. */
export function yarnFormToRow(values: YarnFormValues, currentStockOverride?: number): YarnRow {
  const yarnId = values.yarnId.trim();
  const numPart = yarnId.replace(/^YRN-?/i, '');
  return {
    yarnId,
    imageFile: values.imageFile.trim() || DEFAULT_YARN_IMAGE,
    yarnName: values.yarnName.trim(),
    productCode: values.productCode.trim() || `PC-${numPart || '100'}`,
    category: (values.category.trim() || YARN_CATEGORIES[0]) as YarnCategory,
    materialComposition: values.materialComposition.trim() || 'Polyester / Cotton Blend',
    colourShade: values.colourShade.trim() || 'Natural / Raw',
    denierSpecification: values.denierSpecification.trim() || '150D/48F',
    currentStock: currentStockOverride ?? (Number(values.currentStock) || 0),
    unit: values.unit.trim() || 'kg',
    unitCost: Number(values.unitCost) || 0,
    supplierSource: values.supplierSource.trim() || 'Direct Supplier',
    minimumStockLevel: Number(values.minimumStockLevel) || 100,
    storageLocation: values.storageLocation.trim() || 'Warehouse A',
    batchNumber: values.batchNumber.trim() || `B-${numPart || '001'}`,
    inventoryStage: (values.inventoryStage.trim() || INVENTORY_STAGES[0]) as InventoryStage,
  };
}

/** Suggests the next free `YRN-#####` identifier. */
export function nextYarnId(items: YarnItem[]): string {
  let max = 0;
  for (const item of items) {
    const match = /^YRN-(\d+)$/.exec(item.yarnId.trim().toUpperCase());
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `YRN-${String(max + 1).padStart(5, '0')}`;
}

/* ---------------------------------------------------------------------------
 * Action results shared by the inventory hook and its dialogs
 * ------------------------------------------------------------------------- */

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Stock adjustment result: includes the new quantity from the server. */
export type AdjustResult = { ok: true; stockAfter: number } | { ok: false; error: string };
