import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../services/http';
import type { ActionResult, AdjustResult, InventoryFacets, InventoryFilters, InventorySummary } from './inventoryLogic';
import { EMPTY_FACETS, EMPTY_FILTERS, PAGE_SIZE } from './inventoryLogic';
import { rawMaterialApi } from './rawMaterialApi';
import type { AdjustStockInput, RecordMovementInput } from './movementLogic';
import type { SupplierFormValues } from './supplierLogic';
import { parseProductCodes } from './supplierLogic';
import type { PurchaseRequest, PurchaseRequestStatus, StockAlert, StockMovement, Supplier, YarnItem, YarnRow } from './types';
import { YARN_CATEGORIES } from './types';

/** Payload for creating a purchase-request draft. */
export interface CreatePurchasePayload {
  yarnId: string;
  supplierId: string;
  quantity: number;
  bufferQuantity?: number;
  expectedDeliveryDate?: string | null;
  notes?: string;
}

export interface UseInventoryApi {
  /* Data (server-owned) */
  items: YarnItem[];
  suppliers: Supplier[];
  movements: StockMovement[];
  alerts: StockAlert[];
  purchaseRequests: PurchaseRequest[];
  summary: InventorySummary | null;
  facets: InventoryFacets;

  /* Pagination + filters (server-side) */
  filters: InventoryFilters;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;

  /* UI state */
  loading: boolean;
  error: string;

  setFilters: (
    next: InventoryFilters | ((current: InventoryFilters) => InventoryFilters),
  ) => void;
  setPage: (page: number) => void;
  reload: () => Promise<void>;

  /* Mutations (async — every success refreshes from the server) */
  addYarn: (row: YarnRow) => Promise<ActionResult>;
  updateYarn: (originalYarnId: string, row: YarnRow) => Promise<ActionResult>;
  deleteYarn: (yarnId: string) => Promise<ActionResult>;
  adjustStock: (input: AdjustStockInput) => Promise<AdjustResult>;

  addSupplier: (values: SupplierFormValues) => Promise<ActionResult>;
  updateSupplier: (supplierId: string, values: SupplierFormValues) => Promise<ActionResult>;
  setSupplierActive: (supplierId: string, active: boolean) => Promise<ActionResult>;
  deleteSupplier: (supplierId: string) => Promise<ActionResult>;
  changeSupplier: (yarnId: string, newSupplierName: string, note: string) => Promise<ActionResult>;

  /* Movements / alerts / purchases / import */
  recordMovement: (input: RecordMovementInput) => Promise<ActionResult>;
  reverseMovement: (movementId: string) => Promise<ActionResult>;
  acknowledgeAlert: (alertId: string) => Promise<ActionResult>;
  resolveAlertById: (alertId: string) => Promise<ActionResult>;
  createPurchaseRequest: (payload: CreatePurchasePayload) => Promise<ActionResult>;
  updatePurchaseRequestStatus: (requestId: string, status: PurchaseRequestStatus) => Promise<ActionResult>;
  importCsv: (file: File, skipInvalid?: boolean) => Promise<ActionResult>;
}

/** Maps form values to the API payload (shared by add/edit). */
function supplierPayloadFrom(values: SupplierFormValues) {
  const parseOptional = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };
  return {
    companyName: values.companyName.trim(),
    contactPerson: values.contactPerson.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    yarnTypes: YARN_CATEGORIES.filter((category) => values.yarnTypes.includes(category)),
    productCodes: parseProductCodes(values.productCodes),
    pricePerKg: parseOptional(values.pricePerKg),
    minOrderQty: parseOptional(values.minOrderQty),
    leadTimeDays:
      values.leadTimeDays.trim() === ''
        ? null
        : Math.round(Number(values.leadTimeDays)) || (Number(values.leadTimeDays) === 0 ? 0 : null),
    notes: values.notes.trim(),
  };
}

const DEBOUNCE_MS = 300;

/**
 * Single source of truth for the raw-material feature — all data lives in the
 * FastAPI backend (PostgreSQL/SQLite). The hook owns fetching, pagination,
 * loading/error state and mutations; components stay presentational.
 *
 * Loads only what the page needs: one page of inventory + the summary +
 * supplier list + filter facets. Nothing fetches the full 10k dataset.
 */
export function useInventory(): UseInventoryApi {
  const [items, setItems] = useState<YarnItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [facets, setFacets] = useState<InventoryFacets>(EMPTY_FACETS);

  const [filters, setFiltersState] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pageRequest = useRef(0);

  /* Debounce filter changes (search input fires per keystroke). */
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilters(filters), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters]);

  /* Any filter change resets to page 1. */
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  const loadPage = useCallback(async (): Promise<void> => {
    const requestId = ++pageRequest.current;
    try {
      const result = await rawMaterialApi.listInventory(debouncedFilters, page, pageSize);
      if (requestId !== pageRequest.current) return; // stale response
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
      setError('');
    } catch (caught) {
      if (requestId !== pageRequest.current) return;
      setError(errorMessage(caught));
    } finally {
      if (requestId === pageRequest.current) setLoading(false);
    }
  }, [debouncedFilters, page, pageSize]);

  const loadCollections = useCallback(async (): Promise<void> => {
    try {
      const [summaryData, supplierData, facetData] = await Promise.all([
        rawMaterialApi.getSummary(),
        rawMaterialApi.listSuppliers(),
        rawMaterialApi.getFacets(),
      ]);
      setSummary(summaryData);
      setSuppliers(supplierData.items);
      setFacets(facetData);
      setError('');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
    /* Secondary collections never block the inventory view. */
    try {
      const [movementData, alertData, purchaseData] = await Promise.all([
        rawMaterialApi.listMovements({ limit: 200 }),
        rawMaterialApi.listAlerts(),
        rawMaterialApi.listPurchaseRequests(),
      ]);
      setMovements(movementData.items);
      setAlerts(alertData.items);
      setPurchaseRequests(purchaseData.items);
    } catch {
      /* keep whatever was loaded before */
    }
  }, []);

  /* Initial load: page effect below fetches the first page, this fetches the rest. */
  useEffect(() => {
    void loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    await Promise.all([loadPage(), loadCollections()]);
  }, [loadPage, loadCollections]);

  /** Runs a mutation, refreshes everything on success, maps errors to ActionResult. */
  const mutate = useCallback(
    async (operation: () => Promise<unknown>): Promise<ActionResult> => {
      try {
        await operation();
      } catch (caught) {
        return { ok: false, error: errorMessage(caught) };
      }
      await Promise.all([loadPage(), loadCollections()]);
      return { ok: true };
    },
    [loadPage, loadCollections],
  );

  const setFilters = useCallback(
    (next: InventoryFilters | ((current: InventoryFilters) => InventoryFilters)) => setFiltersState(next),
    [],
  );
  const setPageCallback = useCallback((next: number) => setPage(next), []);

  /* --- mutations ---------------------------------------------------------- */

  const addYarn = useCallback((row: YarnRow) => mutate(() => rawMaterialApi.createYarn(row)), [mutate]);

  const updateYarn = useCallback(
    (originalYarnId: string, row: YarnRow) => mutate(() => rawMaterialApi.updateYarn(originalYarnId, row)),
    [mutate],
  );

  const deleteYarn = useCallback((yarnId: string) => mutate(() => rawMaterialApi.deleteYarn(yarnId)), [mutate]);

  const adjustStock = useCallback(
    async (input: AdjustStockInput): Promise<AdjustResult> => {
      const item = items.find((candidate) => candidate.yarnId === input.yarnId);
      if (!item) {
        return { ok: false, error: `Yarn ${input.yarnId} is not on the current page — refresh and try again.` };
      }
      let movement: StockMovementLike;
      try {
        movement = await rawMaterialApi.adjustStock(input, item.supplierSource);
      } catch (caught) {
        return { ok: false, error: errorMessage(caught) };
      }
      await Promise.all([loadPage(), loadCollections()]);
      return { ok: true, stockAfter: movement.stockAfter };
    },
    [items, loadPage, loadCollections],
  );

  const addSupplier = useCallback(
    (values: SupplierFormValues) => mutate(() => rawMaterialApi.createSupplier(supplierPayloadFrom(values))),
    [mutate],
  );

  const updateSupplier = useCallback(
    (supplierId: string, values: SupplierFormValues) =>
      mutate(() => rawMaterialApi.updateSupplier(supplierId, supplierPayloadFrom(values))),
    [mutate],
  );

  const setSupplierActive = useCallback(
    (supplierId: string, active: boolean) => mutate(() => rawMaterialApi.setSupplierActive(supplierId, active)),
    [mutate],
  );

  const deleteSupplier = useCallback(
    (supplierId: string) => mutate(() => rawMaterialApi.deleteSupplier(supplierId)),
    [mutate],
  );

  const changeSupplier = useCallback(
    (yarnId: string, newSupplierName: string, note: string) =>
      mutate(() => rawMaterialApi.changeSupplier(yarnId, newSupplierName, note)),
    [mutate],
  );

  const recordMovement = useCallback(
    (input: RecordMovementInput) => mutate(() => rawMaterialApi.recordMovement(input)),
    [mutate],
  );

  const reverseMovement = useCallback(
    (movementId: string) => mutate(() => rawMaterialApi.reverseMovement(movementId)),
    [mutate],
  );

  const acknowledgeAlert = useCallback(
    (alertId: string) => mutate(() => rawMaterialApi.acknowledgeAlert(alertId)),
    [mutate],
  );

  const resolveAlertById = useCallback(
    (alertId: string) => mutate(() => rawMaterialApi.resolveAlert(alertId)),
    [mutate],
  );

  const createPurchaseRequest = useCallback(
    (payload: CreatePurchasePayload) => mutate(() => rawMaterialApi.createPurchaseRequest(payload)),
    [mutate],
  );

  const updatePurchaseRequestStatus = useCallback(
    (requestId: string, status: PurchaseRequestStatus) =>
      mutate(() => rawMaterialApi.updatePurchaseRequestStatus(requestId, status)),
    [mutate],
  );

  const importCsv = useCallback(
    (file: File, skipInvalid = false) => mutate(() => rawMaterialApi.importCsv(file, skipInvalid)),
    [mutate],
  );

  return {
    items,
    suppliers,
    movements,
    alerts,
    purchaseRequests,
    summary,
    facets,
    filters,
    page,
    pageSize,
    total,
    totalPages,
    loading,
    error,
    setFilters,
    setPage: setPageCallback,
    reload,
    addYarn,
    updateYarn,
    deleteYarn,
    adjustStock,
    addSupplier,
    updateSupplier,
    setSupplierActive,
    deleteSupplier,
    changeSupplier,
    recordMovement,
    reverseMovement,
    acknowledgeAlert,
    resolveAlertById,
    createPurchaseRequest,
    updatePurchaseRequestStatus,
    importCsv,
  };
}

/** Minimal movement response shape used by adjustStock. */
interface StockMovementLike {
  stockAfter: number;
}
