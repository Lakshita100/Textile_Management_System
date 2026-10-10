/**
 * Typed API surface for the raw-material feature.
 * Every call talks to the FastAPI backend (/api/v1/...) — no local business data.
 */
import { http } from '../../services/http';
import type { AdjustStockInput } from './movementLogic';
import { movementTypeForAction, todayIsoDate } from './movementLogic';
import type { InventoryFacets, InventoryFilters, InventorySummary } from './inventoryLogic';
import type { PurchaseRequest, PurchaseRequestStatus, StockAlert, StockMovement, Supplier, YarnItem, YarnRow } from './types';

export interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

/** Payload for creating/updating a supplier (server-assigned id on create). */
export interface SupplierPayload {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  yarnTypes: string[];
  productCodes: string[];
  pricePerKg: number | null;
  minOrderQty: number | null;
  leadTimeDays: number | null;
  notes: string;
}

function inventoryQuery(filters: InventoryFilters, page?: number, pageSize?: number): string {
  const params = new URLSearchParams();
  if (filters.query.trim() !== '') params.set('q', filters.query.trim());
  if (filters.category !== '') params.set('category', filters.category);
  if (filters.status !== '') params.set('status', filters.status);
  if (filters.supplier !== '') params.set('supplier', filters.supplier);
  if (filters.stage !== '') params.set('stage', filters.stage);
  if (filters.colour !== '') params.set('colour', filters.colour);
  if (page !== undefined) params.set('page', String(page));
  if (pageSize !== undefined) params.set('pageSize', String(pageSize));
  return params.toString();
}

export const rawMaterialApi = {
  /* --- inventory ---------------------------------------------------------- */
  listInventory(filters: InventoryFilters, page: number, pageSize: number): Promise<PageResponse<YarnItem>> {
    return http.get<PageResponse<YarnItem>>(`/inventory?${inventoryQuery(filters, page, pageSize)}`);
  },

  getSummary(): Promise<InventorySummary> {
    return http.get<InventorySummary>('/inventory/summary');
  },

  getFacets(): Promise<InventoryFacets> {
    return http.get<InventoryFacets>('/inventory/facets');
  },

  getRecentlyUpdated(limit = 6): Promise<{ items: YarnItem[] }> {
    return http.get<{ items: YarnItem[] }>(`/inventory/recently-updated?limit=${limit}`);
  },

  /** Server-side CSV export that respects the currently selected filters. */
  exportInventoryCsv(filters: InventoryFilters): Promise<Blob> {
    return http.getBlob(`/inventory/export?${inventoryQuery(filters)}`);
  },

  createYarn(row: YarnRow): Promise<YarnItem> {
    return http.post<YarnItem>('/inventory', row);
  },

  updateYarn(yarnId: string, row: YarnRow): Promise<YarnItem> {
    return http.put<YarnItem>(`/inventory/${encodeURIComponent(yarnId)}`, row);
  },

  deleteYarn(yarnId: string): Promise<void> {
    return http.delete<void>(`/inventory/${encodeURIComponent(yarnId)}`);
  },

  /**
   * Add/Subtract Stock — routed through the movements API so every change is
   * audited, concurrency-safe (guarded UPDATE) and alert-aware on the server.
   */
  recordMovement(input: {
    yarnId: string;
    movementType: string;
    quantity: number;
    date: string;
    reference: string;
    supplierName?: string;
    notes?: string;
    reason?: string;
  }): Promise<StockMovement> {
    return http.post<StockMovement>('/movements', input);
  },

  adjustStock(input: AdjustStockInput, supplierSource: string): Promise<StockMovement> {
    const movementType = movementTypeForAction(input.action);
    const note = input.note.trim();
    return rawMaterialApi.recordMovement({
      yarnId: input.yarnId,
      movementType,
      quantity: input.quantity,
      date: todayIsoDate(),
      reference: note || 'Manual stock adjustment',
      ...(movementType === 'Stock In'
        ? { supplierName: supplierSource, notes: note || 'Manual stock adjustment' }
        : { reason: note || 'Stock correction' }),
    });
  },

  /* --- movements ---------------------------------------------------------- */
  listMovements(options: { yarnId?: string; movementType?: string; limit?: number } = {}): Promise<{ items: StockMovement[]; total: number }> {
    const params = new URLSearchParams();
    if (options.yarnId) params.set('yarnId', options.yarnId);
    if (options.movementType) params.set('movementType', options.movementType);
    if (options.limit !== undefined) params.set('limit', String(options.limit));
    const query = params.toString();
    return http.get<{ items: StockMovement[]; total: number }>(`/movements${query ? `?${query}` : ''}`);
  },

  reverseMovement(movementId: string): Promise<StockMovement> {
    return http.post<StockMovement>(`/movements/${encodeURIComponent(movementId)}/reverse`);
  },

  /* --- alerts (dashboard low-stock summary) ------------------------------- */
  listAlerts(): Promise<{ items: StockAlert[]; total: number; open: number }> {
    return http.get<{ items: StockAlert[]; total: number; open: number }>('/alerts');
  },

  acknowledgeAlert(alertId: string): Promise<StockAlert> {
    return http.post<StockAlert>(`/alerts/${encodeURIComponent(alertId)}/acknowledge`);
  },

  resolveAlert(alertId: string): Promise<StockAlert> {
    return http.post<StockAlert>(`/alerts/${encodeURIComponent(alertId)}/resolve`);
  },

  /* --- purchase request drafts ------------------------------------------- */
  listPurchaseRequests(): Promise<{ items: PurchaseRequest[]; total: number }> {
    return http.get<{ items: PurchaseRequest[]; total: number }>('/purchase-requests');
  },

  createPurchaseRequest(payload: {
    yarnId: string;
    supplierId: string;
    quantity: number;
    bufferQuantity?: number;
    expectedDeliveryDate?: string | null;
    notes?: string;
  }): Promise<PurchaseRequest> {
    return http.post<PurchaseRequest>('/purchase-requests', payload);
  },

  updatePurchaseRequestStatus(requestId: string, status: PurchaseRequestStatus): Promise<PurchaseRequest> {
    return http.patch<PurchaseRequest>(
      `/purchase-requests/${encodeURIComponent(requestId)}/status`,
      { status },
    );
  },

  /* --- CSV import --------------------------------------------------------- */
  importCsv(file: File, skipInvalid = false): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);
    const query = skipInvalid ? '?skipInvalid=true' : '';
    return http.upload<unknown>(`/inventory/import${query}`, formData);
  },

  /* --- suppliers ---------------------------------------------------------- */
  listSuppliers(): Promise<ListResponse<Supplier>> {
    return http.get<ListResponse<Supplier>>('/suppliers');
  },

  createSupplier(payload: SupplierPayload): Promise<Supplier> {
    return http.post<Supplier>('/suppliers', payload);
  },

  updateSupplier(supplierId: string, payload: SupplierPayload): Promise<Supplier> {
    return http.put<Supplier>(`/suppliers/${encodeURIComponent(supplierId)}`, payload);
  },

  setSupplierActive(supplierId: string, active: boolean): Promise<Supplier> {
    return http.post<Supplier>(`/suppliers/${encodeURIComponent(supplierId)}/active`, { active });
  },

  deleteSupplier(supplierId: string): Promise<void> {
    return http.delete<void>(`/suppliers/${encodeURIComponent(supplierId)}`);
  },

  changeSupplier(yarnId: string, newSupplierName: string, note: string): Promise<unknown> {
    return http.put<unknown>(`/suppliers/yarn/${encodeURIComponent(yarnId)}/supplier`, {
      newSupplierName,
      note,
    });
  },
};

export type RawMaterialApi = typeof rawMaterialApi;
