import type { InventoryStage, StockStatus, YarnCategory, YarnItem, YarnRow } from './types';

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

/** Format numbers in compact 'k' notation (e.g. 12.35k, 10k, 480). */
export function formatKNumber(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}k`;
  }
  return value.toLocaleString('en-US');
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
  category: 'Category',
  materialComposition: 'Material / composition',
  colourShade: 'Colour / shade',
  denierSpecification: 'Denier / specification',
  currentStock: 'Current stock',
  unit: 'Unit',
  unitCost: 'Unit cost',
  supplierSource: 'Supplier / source',
  minimumStockLevel: 'Minimum stock level',
  storageLocation: 'Storage location',
  batchNumber: 'Batch number',
  inventoryStage: 'Inventory stage',
};

export const REQUIRED_YARN_FIELDS: (keyof YarnFormValues)[] = [
  'yarnId',
  'yarnName',
  'productCode',
  'category',
  'materialComposition',
  'colourShade',
  'denierSpecification',
  'currentStock',
  'unit',
  'unitCost',
  'supplierSource',
  'minimumStockLevel',
  'storageLocation',
  'batchNumber',
  'inventoryStage',
];

export function createEmptyYarnForm(items: YarnItem[] = []): YarnFormValues {
  return {
    yarnId: items.length > 0 ? nextYarnId(items) : 'YRN-00001',
    imageFile: DEFAULT_YARN_IMAGE,
    yarnName: '',
    productCode: '',
    category: '',
    materialComposition: '',
    colourShade: '',
    denierSpecification: '',
    currentStock: '',
    unit: 'kg',
    unitCost: '',
    supplierSource: '',
    minimumStockLevel: '100',
    storageLocation: '',
    batchNumber: '',
    inventoryStage: '',
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
    if (values[field].trim() === '') {
      errors[field] = `${YARN_FIELD_LABELS[field]} is required`;
    }
  }

  const numericFields: (keyof YarnFormValues)[] = ['currentStock', 'unitCost', 'minimumStockLevel'];
  for (const field of numericFields) {
    const raw = values[field].trim();
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

  const yarnId = values.yarnId.trim();
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
  return {
    yarnId: values.yarnId.trim(),
    imageFile: values.imageFile.trim() || DEFAULT_YARN_IMAGE,
    yarnName: values.yarnName.trim(),
    productCode: values.productCode.trim(),
    category: values.category.trim() as YarnCategory,
    materialComposition: values.materialComposition.trim(),
    colourShade: values.colourShade.trim(),
    denierSpecification: values.denierSpecification.trim(),
    currentStock: currentStockOverride ?? Number(values.currentStock),
    unit: values.unit.trim(),
    unitCost: Number(values.unitCost),
    supplierSource: values.supplierSource.trim(),
    minimumStockLevel: Number(values.minimumStockLevel),
    storageLocation: values.storageLocation.trim(),
    batchNumber: values.batchNumber.trim(),
    inventoryStage: values.inventoryStage.trim() as InventoryStage,
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
