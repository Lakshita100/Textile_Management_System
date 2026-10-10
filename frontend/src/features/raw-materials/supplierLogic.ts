import type { Supplier, YarnItem } from './types';
import { YARN_CATEGORIES } from './types';

/** Shown wherever a supplier contact field has not been provided yet. */
export const NOT_PROVIDED = 'Not provided';

export function displayValue(value: string): string {
  return value.trim() === '' ? NOT_PROVIDED : value.trim();
}

/** Phone shape check — only applied when a phone number is actually supplied. */
const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{5,19}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (trimmed === '') {
    return true;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 && PHONE_PATTERN.test(trimmed);
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed === '' || EMAIL_PATTERN.test(trimmed);
}

/** `tel:` href when a real stored phone exists, never a fabricated number. */
export function telHref(phone: string): string | null {
  const trimmed = phone.trim();
  if (trimmed === '' || !isValidPhone(trimmed)) {
    return null;
  }
  return `tel:${trimmed.replace(/[^\d+]/g, '')}`;
}

/** `mailto:` href when a real stored email exists. */
export function mailtoHref(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed === '' || !isValidEmail(trimmed)) {
    return null;
  }
  return `mailto:${trimmed}`;
}

/** Case-insensitive lookup of a supplier by company name. */
export function supplierByCompany(suppliers: Supplier[], companyName: string): Supplier | undefined {
  const key = companyName.trim().toLowerCase();
  return suppliers.find((supplier) => supplier.companyName.toLowerCase() === key);
}

export interface SupplierFormValues {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  /** Selected yarn categories (checkbox model). */
  yarnTypes: string[];
  /** Comma-separated product codes (text model). */
  productCodes: string;
  pricePerKg: string;
  minOrderQty: string;
  leadTimeDays: string;
  notes: string;
}

export type SupplierFormErrors = Partial<Record<keyof SupplierFormValues, string>>;

export function createEmptySupplierForm(): SupplierFormValues {
  return {
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    yarnTypes: [],
    productCodes: '',
    pricePerKg: '',
    minOrderQty: '',
    leadTimeDays: '',
    notes: '',
  };
}

export function supplierToForm(supplier: Supplier): SupplierFormValues {
  return {
    companyName: supplier.companyName,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    yarnTypes: [...supplier.yarnTypes],
    productCodes: supplier.productCodes.join(', '),
    pricePerKg: supplier.pricePerKg === null ? '' : String(supplier.pricePerKg),
    minOrderQty: supplier.minOrderQty === null ? '' : String(supplier.minOrderQty),
    leadTimeDays: supplier.leadTimeDays === null ? '' : String(supplier.leadTimeDays),
    notes: supplier.notes,
  };
}

export function parseProductCodes(raw: string): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const part of raw.split(',')) {
    const code = part.trim();
    if (code !== '' && !seen.has(code.toLowerCase())) {
      seen.add(code.toLowerCase());
      codes.push(code);
    }
  }
  return codes;
}

export function validateSupplierForm(
  values: SupplierFormValues,
  suppliers: Supplier[],
  editingSupplierId?: string,
): SupplierFormErrors {
  const errors: SupplierFormErrors = {};

  const companyName = values.companyName.trim();
  if (companyName === '') {
    errors.companyName = 'Company name is required';
  } else if (
    suppliers.some(
      (supplier) =>
        supplier.companyName.toLowerCase() === companyName.toLowerCase() && supplier.supplierId !== editingSupplierId,
    )
  ) {
    errors.companyName = 'A supplier with this company name already exists';
  }

  if (!isValidPhone(values.phone)) {
    errors.phone = 'Enter a valid phone number (7–15 digits, optional +, -, spaces)';
  }

  if (!isValidEmail(values.email)) {
    errors.email = 'Enter a valid email address';
  }

  const numericFields = ['pricePerKg', 'minOrderQty', 'leadTimeDays'] as const;
  for (const field of numericFields) {
    const raw = values[field].trim();
    if (raw === '') {
      continue;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      errors[field] = 'Enter a valid number';
    } else if (parsed < 0) {
      errors[field] = 'Cannot be negative';
    }
  }

  return errors;
}

/** Yarn categories present in the current items (used to pre-fill supplier forms). */
export function categoriesInItems(items: YarnItem[]): string[] {
  const present = new Set(items.map((item) => item.category));
  return YARN_CATEGORIES.filter((category) => present.has(category));
}
