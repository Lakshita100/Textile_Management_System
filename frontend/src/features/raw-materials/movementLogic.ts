import type { StockMovementType } from './types';

/** Reasons offered on a Stock Out; "Other" still requires a reference. */
export const STOCK_OUT_REASONS = [
  'Production consumption',
  'Order issue',
  'Wastage / damage',
  'Sampling / testing',
  'Stock correction',
  'Other',
] as const;

export type StockAdjustAction = 'add' | 'subtract';

/** Input for the Add/Subtract Stock actions inside the yarn edit form. */
export interface AdjustStockInput {
  yarnId: string;
  action: StockAdjustAction;
  quantity: number;
  /** Optional free-text note stored as receipt notes (add) or the reason (subtract). */
  note: string;
}

/** Payload for POST /movements (Stock In / Consumption). */
export interface RecordMovementInput {
  yarnId: string;
  movementType: StockMovementType;
  quantity: number;
  date: string;
  reference: string;
  supplierName?: string;
  notes?: string;
  reason?: string;
}

/** Maps the UI action onto the movements API movement type. */
export function movementTypeForAction(action: StockAdjustAction): StockMovementType {
  return action === 'add' ? 'Stock In' : 'Consumption';
}

export function todayIsoDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Rounds to 3 decimals to avoid floating point drift (e.g. 10.000000000000002). */
export function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function formatQuantity(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 3 });
}

/** Validates the quantity typed into the Add/Subtract Stock control. */
export function validateAdjustQuantity(
  raw: string,
  action: StockAdjustAction,
  currentStock: number,
  unit: string,
): string | undefined {
  const trimmed = raw.trim();
  const quantity = Number(trimmed);
  if (trimmed === '') {
    return 'Quantity is required';
  }
  if (!Number.isFinite(quantity)) {
    return 'Enter a valid number';
  }
  if (quantity <= 0) {
    return 'Quantity must be greater than zero';
  }
  if (action === 'subtract' && quantity > currentStock) {
    return `Cannot subtract more than the available stock (${formatQuantity(currentStock)} ${unit})`;
  }
  return undefined;
}
