import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Boxes, ClipboardList, RefreshCw, TriangleAlert, Truck } from 'lucide-react';
import ChangeSupplierModal from './components/ChangeSupplierModal';
import InventoryToolbar from './components/InventoryToolbar';
import LowStockAlertsSection from './components/LowStockAlertsSection';
import MovementHistoryModal from './components/MovementHistoryModal';
import MovementsSection from './components/MovementsSection';
import PageHeader from './components/PageHeader';
import PaginationControls from './components/PaginationControls';
import PurchaseRequestsSection from './components/PurchaseRequestsSection';
import SectionTabs, { type SectionTab } from './components/SectionTabs';
import StockMovementModal from './components/StockMovementModal';
import SupplierFormModal from './components/SupplierFormModal';
import SuppliersSection from './components/SuppliersSection';
import SupplierDetailsModal from './components/SupplierDetailsModal';
import SummaryCards from './components/SummaryCards';
import YarnDetailsModal from './components/YarnDetailsModal';
import YarnFormModal from './components/YarnFormModal';
import YarnInventoryTable from './components/YarnInventoryTable';
import {
  EMPTY_FILTERS,
  hasActiveFilters as hasActiveFilterValues,
  type ActionResult,
} from './inventoryLogic';
import { type RecordMovementInput } from './movementLogic';
import type { SupplierFormValues } from './supplierLogic';
import type { PurchaseRequestStatus, Supplier, YarnItem, YarnRow } from './types';
import { useInventory, type CreatePurchasePayload } from './useInventory';

interface YarnFormState {
  open: boolean;
  mode: 'add' | 'edit';
  yarnId?: string;
}

interface SupplierFormState {
  open: boolean;
  mode: 'add' | 'edit';
  supplierId?: string;
}

const TABS: SectionTab[] = [
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'alerts', label: 'Low-Stock Alerts', icon: TriangleAlert },
  { id: 'movements', label: 'Movements', icon: ArrowLeftRight },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'purchases', label: 'Purchases', icon: ClipboardList },
];

interface RawMaterialsPageProps {
  defaultSection?: string;
  hideTabs?: boolean;
}

export default function RawMaterialsPage({ defaultSection = 'inventory', hideTabs = false }: RawMaterialsPageProps) {
  const inventory = useInventory();
  const {
    items,
    movements,
    suppliers,
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
    setPage,
    reload,
    addYarn,
    updateYarn,
    deleteYarn,
    adjustStock,
    recordMovement,
    reverseMovement,
    addSupplier,
    updateSupplier,
    setSupplierActive,
    deleteSupplier,
    changeSupplier,
    acknowledgeAlert,
    resolveAlertById,
    createPurchaseRequest,
    updatePurchaseRequestStatus,
  } = inventory;

  const [tab, setTab] = useState(defaultSection);
  const [yarnForm, setYarnForm] = useState<YarnFormState>({ open: false, mode: 'add' });
  const [detailsYarnId, setDetailsYarnId] = useState<string | null>(null);
  const [movement, setMovement] = useState<{ open: boolean; yarnId?: string }>({ open: false });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>({ open: false, mode: 'add' });
  const [changeSupplierItem, setChangeSupplierItem] = useState<YarnItem | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    setTab(defaultSection);
  }, [defaultSection]);

  const activeFilters = hasActiveFilterValues(filters);
  const openAlerts = alerts.filter((alert) => alert.status !== 'resolved').length;

  const editItem =
    yarnForm.open && yarnForm.mode === 'edit' && yarnForm.yarnId
      ? (items.find((item) => item.yarnId === yarnForm.yarnId) ?? undefined)
      : undefined;
  const detailsItem = detailsYarnId ? (items.find((item) => item.yarnId === detailsYarnId) ?? null) : null;
  const yarnFormOpen = yarnForm.open && (yarnForm.mode === 'add' || editItem !== undefined);
  const movementItem = movement.yarnId ? (items.find((item) => item.yarnId === movement.yarnId) ?? undefined) : undefined;

  const editSupplier =
    supplierForm.open && supplierForm.mode === 'edit' && supplierForm.supplierId
      ? (suppliers.find((supplier) => supplier.supplierId === supplierForm.supplierId) ?? undefined)
      : undefined;
  const supplierFormOpen = supplierForm.open && (supplierForm.mode === 'add' || editSupplier !== undefined);

  const tabs = useMemo<SectionTab[]>(
    () => TABS.map((entry) => (entry.id === 'alerts' ? { ...entry, badge: openAlerts } : entry)),
    [openAlerts],
  );

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const clearFilters = () => setFilters(EMPTY_FILTERS);
  const closeYarnForm = () => setYarnForm({ open: false, mode: 'add' });
  const closeSupplierForm = () => setSupplierForm({ open: false, mode: 'add' });

  const handleSubmitYarn = async (row: YarnRow): Promise<ActionResult> => {
    if (yarnForm.open && yarnForm.mode === 'edit' && yarnForm.yarnId) {
      return updateYarn(yarnForm.yarnId, row);
    }
    return addYarn(row);
  };

  const handleRecordMovement = async (input: RecordMovementInput): Promise<ActionResult> =>
    recordMovement(input);

  const handleSubmitSupplier = async (values: SupplierFormValues): Promise<ActionResult> => {
    if (supplierForm.open && supplierForm.mode === 'edit' && supplierForm.supplierId) {
      return updateSupplier(supplierForm.supplierId, values);
    }
    return addSupplier(values);
  };

  const handleToggleSupplier = async (supplier: Supplier): Promise<{ ok: boolean; error?: string }> => {
    const result = await setSupplierActive(supplier.supplierId, !supplier.active);
    return { ok: result.ok, error: result.ok ? undefined : result.error };
  };

  const handleCreatePurchase = (payload: CreatePurchasePayload) => createPurchaseRequest(payload);
  const handlePurchaseStatus = (requestId: string, status: PurchaseRequestStatus) =>
    updatePurchaseRequestStatus(requestId, status);

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = startIndex + items.length;

  if (loading && summary === null && !error) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[var(--color-text-muted)]">
        <span
          aria-hidden
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"
        />
        Loading inventory from the backend…
      </div>
    );
  }

  if (error && summary === null && items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader onAddYarn={() => setYarnForm({ open: true, mode: 'add' })} />
        <div className="card space-y-3 px-6 py-8 text-center" role="alert">
          <h2 className="text-base font-semibold text-[var(--color-heading)]">Could not load the inventory</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Start the backend with{' '}
            <span className="font-mono">python -m uvicorn app.main:app --reload</span> from the{' '}
            <span className="font-mono">backend/</span> folder, then retry.
          </p>
          <button type="button" className="btn-primary mx-auto" onClick={() => void reload()}>
            <RefreshCw size={16} aria-hidden />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader onAddYarn={() => setYarnForm({ open: true, mode: 'add' })} />
      {summary ? <SummaryCards summary={summary} /> : null}

      {!hideTabs ? <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} /> : null}

      {error ? (
        <p
          role="alert"
          className="flex items-center justify-between gap-3 rounded-[var(--radius-input)] border border-[var(--color-danger)] bg-[var(--color-danger-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-heading)]"
        >
          <span>{error}</span>
          <button type="button" className="btn-secondary shrink-0 py-1.5 text-xs" onClick={() => void reload()}>
            Retry
          </button>
        </p>
      ) : null}

      {tab === 'inventory' ? (
        <div className="space-y-6" role="tabpanel" id="panel-inventory" aria-labelledby="tab-inventory">
          {total === 0 && !activeFilters ? (
            <section className="card space-y-3 px-6 py-10 text-center">
              <h2 className="text-lg font-semibold text-[var(--color-heading)]">No Yarn Inventory Records</h2>
              <p className="mx-auto max-w-xl text-sm text-[var(--color-text-muted)]">
                There are currently no yarn stock items in the system. Add a new yarn record to start managing stock levels.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setYarnForm({ open: true, mode: 'add' })}
                >
                  Add a yarn record
                </button>
              </div>
            </section>
          ) : null}

          <section aria-label="Yarn Stock Inventory" className="card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
              <InventoryToolbar
                query={filters.query}
                category={filters.category}
                status={filters.status}
                supplier={filters.supplier}
                stage={filters.stage}
                colour={filters.colour}
                facets={facets}
                hasActiveFilters={activeFilters}
                onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
                onCategoryChange={(category) => setFilters((current) => ({ ...current, category }))}
                onStatusChange={(status) => setFilters((current) => ({ ...current, status }))}
                onSupplierChange={(supplier) => setFilters((current) => ({ ...current, supplier }))}
                onStageChange={(stage) => setFilters((current) => ({ ...current, stage }))}
                onColourChange={(colour) => setFilters((current) => ({ ...current, colour }))}
                onClearFilters={clearFilters}
              />
            </div>
            <YarnInventoryTable
              items={items}
              suppliers={suppliers}
              hasActiveFilters={activeFilters}
              onClearFilters={clearFilters}
              onViewItem={(item) => setDetailsYarnId(item.yarnId)}
              onEditItem={(item) => setYarnForm({ open: true, mode: 'edit', yarnId: item.yarnId })}
              onDeleteItem={(item) => void deleteYarn(item.yarnId)}
              onChangeSupplier={(item) => setChangeSupplierItem(item)}
            />
            <PaginationControls
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={total}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setPage}
            />
          </section>
        </div>
      ) : null}

      {tab === 'alerts' ? (
        <div role="tabpanel" id="panel-alerts" aria-labelledby="tab-alerts">
          <LowStockAlertsSection
            alerts={alerts}
            onAcknowledge={(alertId) => void acknowledgeAlert(alertId)}
            onResolve={(alertId) => void resolveAlertById(alertId)}
          />
        </div>
      ) : null}

      {tab === 'movements' ? (
        <div role="tabpanel" id="panel-movements" aria-labelledby="tab-movements">
          <MovementsSection
            movements={movements}
            items={items}
            onRecordMovement={() => setMovement({ open: true })}
            onReverse={reverseMovement}
          />
        </div>
      ) : null}

      {tab === 'suppliers' ? (
        <div role="tabpanel" id="panel-suppliers" aria-labelledby="tab-suppliers">
          <SuppliersSection
            suppliers={suppliers}
            onAdd={() => setSupplierForm({ open: true, mode: 'add' })}
            onEdit={(supplier) => setSupplierForm({ open: true, mode: 'edit', supplierId: supplier.supplierId })}
            onView={(supplier) => setViewSupplier(supplier)}
            onToggleActive={handleToggleSupplier}
            onDelete={async (supplier) => {
              const result = await deleteSupplier(supplier.supplierId);
              return { ok: result.ok, error: result.ok ? undefined : result.error };
            }}
          />
        </div>
      ) : null}

      {tab === 'purchases' ? (
        <div role="tabpanel" id="panel-purchases" aria-labelledby="tab-purchases">
          <PurchaseRequestsSection
            requests={purchaseRequests}
            items={items}
            suppliers={suppliers}
            onCreate={handleCreatePurchase}
            onUpdateStatus={handlePurchaseStatus}
          />
        </div>
      ) : null}

      <YarnFormModal
        open={yarnFormOpen}
        mode={yarnForm.mode}
        item={editItem}
        items={items}
        onClose={closeYarnForm}
        onSubmit={handleSubmitYarn}
        onAdjustStock={(yarnId, action, quantity, note) => adjustStock({ yarnId, action, quantity, note })}
      />

      <YarnDetailsModal
        item={detailsItem}
        onClose={() => setDetailsYarnId(null)}
        onEdit={(item) => {
          setDetailsYarnId(null);
          setYarnForm({ open: true, mode: 'edit', yarnId: item.yarnId });
        }}
      />

      <StockMovementModal
        open={movement.open}
        suppliers={suppliers}
        items={items}
        initialYarnId={movement.yarnId}
        initialItem={movementItem}
        onClose={() => setMovement({ open: false })}
        onSubmit={handleRecordMovement}
      />

      <MovementHistoryModal
        open={historyOpen}
        movements={movements}
        items={items}
        onClose={() => setHistoryOpen(false)}
      />


      <SupplierFormModal
        open={supplierFormOpen}
        mode={supplierForm.mode}
        supplier={editSupplier}
        suppliers={suppliers}
        onClose={closeSupplierForm}
        onSubmit={handleSubmitSupplier}
      />

      <ChangeSupplierModal
        open={changeSupplierItem !== null}
        suppliers={suppliers}
        item={changeSupplierItem ?? undefined}
        onClose={() => setChangeSupplierItem(null)}
        onSubmit={(yarnId, newSupplierName, note) => changeSupplier(yarnId, newSupplierName, note)}
      />

      <SupplierDetailsModal supplier={viewSupplier} onClose={() => setViewSupplier(null)} />
    </div>
  );
}
