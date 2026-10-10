import { Check, CircleX, Mail, Phone } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatQuantity } from '../movementLogic';
import { displayValue, mailtoHref, telHref } from '../supplierLogic';
import type { StockAlert, StockStatus } from '../types';

interface LowStockAlertsSectionProps {
  alerts: StockAlert[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

const HEAD_CELL =
  'whitespace-nowrap border-b border-[var(--color-border)] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-heading)]';
const BODY_CELL = 'px-3 py-2.5 text-sm text-[var(--color-text)]';

const ALERT_STATUS_BADGE: Record<string, string> = {
  active: 'bg-[var(--color-warning-bg)] text-[var(--color-heading)]',
  acknowledged: 'bg-[var(--color-surface-hover)] text-[var(--color-heading)]',
};

/**
 * Open + resolved low-stock alerts. All yarn/supplier details are enriched by
 * the backend (no dependency on the current inventory page).
 */
export default function LowStockAlertsSection({ alerts, onAcknowledge, onResolve }: LowStockAlertsSectionProps) {
  const open = alerts
    .filter((alert) => alert.status !== 'resolved')
    .sort((a, b) => {
      const aOut = a.currentStock <= 0 ? 0 : 1;
      const bOut = b.currentStock <= 0 ? 0 : 1;
      if (aOut !== bOut) {
        return aOut - bOut;
      }
      return a.yarnId.localeCompare(b.yarnId);
    });

  const resolved = alerts.filter((alert) => alert.status === 'resolved').slice(0, 10);

  return (
    <div className="space-y-6">
      <section aria-labelledby="open-alerts-heading" className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div>
            <h2 id="open-alerts-heading" className="text-lg font-semibold text-[var(--color-heading)]">
              Open Low-Stock Alerts
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Triggered when stock is at or below the minimum stock level.
            </p>
          </div>
          <span
            aria-live="polite"
            className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]"
          >
            {open.length} open alert{open.length === 1 ? '' : 's'}
          </span>
        </div>

        {open.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse">
              <caption className="sr-only">Open low-stock alerts with shortage and supplier contact details</caption>
              <thead className="table-header">
                <tr>
                  <th scope="col" className={HEAD_CELL}>
                    Yarn
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Kind
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Current / Minimum
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Shortage
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Supplier & Contact
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Alert Status
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {open.map((alert) => {
                  const supplier = alert.supplier;
                  const phone = supplier ? telHref(supplier.phone) : null;
                  const email = supplier ? mailtoHref(supplier.email) : null;

                  return (
                    <tr key={alert.alertId} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                      <td className={BODY_CELL}>
                        <span className="block font-medium text-[var(--color-heading)]">{alert.yarnName}</span>
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">{alert.yarnId}</span>
                      </td>
                      <td className={BODY_CELL}>
                        <StatusBadge status={(alert.kind || 'Low Stock') as StockStatus} />
                      </td>
                      <td className={BODY_CELL}>
                        <span className="font-semibold text-[var(--color-heading)]">
                          {formatQuantity(alert.currentStock)}
                        </span>{' '}
                        <span className="text-xs text-[var(--color-text-muted)]">
                          / {formatQuantity(alert.minimumStockLevel)} {alert.unit}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <span className="font-semibold text-[var(--color-heading)]">
                          {formatQuantity(alert.shortage)} {alert.unit}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <span className="block font-medium text-[var(--color-heading)]">
                          {displayValue(supplier?.companyName ?? '')}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
                          {phone ? (
                            <a href={phone} className="inline-flex items-center gap-1 hover:text-[var(--color-link)]">
                              <Phone size={12} aria-hidden />
                              {supplier?.phone}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} aria-hidden />
                              Not provided
                            </span>
                          )}
                          {email ? (
                            <a href={email} className="inline-flex items-center gap-1 hover:text-[var(--color-link)]">
                              <Mail size={12} aria-hidden />
                              {supplier?.email}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Mail size={12} aria-hidden />
                              Not provided
                            </span>
                          )}
                        </span>
                        {supplier && (supplier.contactPerson || supplier.address) ? (
                          <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                            {[supplier.contactPerson, supplier.address].filter(Boolean).join(' · ')}
                          </span>
                        ) : null}
                      </td>
                      <td className={BODY_CELL}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ALERT_STATUS_BADGE[alert.status] ?? ALERT_STATUS_BADGE.active}`}
                        >
                          {alert.status === 'active' ? 'Active' : 'Acknowledged'}
                        </span>
                      </td>
                      <td className={BODY_CELL}>
                        <div className="flex flex-wrap gap-2">
                          {alert.status === 'active' ? (
                            <button
                              type="button"
                              className="btn-secondary px-2.5 py-1.5 text-xs"
                              onClick={() => onAcknowledge(alert.alertId)}
                            >
                              <Check size={13} aria-hidden />
                              Acknowledge
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-1.5 text-xs"
                            onClick={() => onResolve(alert.alertId)}
                          >
                            <CircleX size={13} aria-hidden />
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <span
              aria-hidden
              className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-success-bg)]"
            >
              <Check size={22} className="text-[var(--color-success)]" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-[var(--color-heading)]">No open alerts</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Every yarn is above its minimum stock level, or all alerts have been resolved.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="resolved-alerts-heading" className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div>
            <h2 id="resolved-alerts-heading" className="text-lg font-semibold text-[var(--color-heading)]">
              Resolved Alerts
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Kept on record for audit — most recent 10 shown.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
            {alerts.filter((alert) => alert.status === 'resolved').length} resolved
          </span>
        </div>

        {resolved.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <caption className="sr-only">Resolved low-stock alerts</caption>
              <thead className="table-header">
                <tr>
                  <th scope="col" className={HEAD_CELL}>
                    Yarn
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Raised
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Acknowledged
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Resolved
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {resolved.map((alert) => (
                  <tr key={alert.alertId}>
                    <td className={BODY_CELL}>
                      <span className="font-medium text-[var(--color-heading)]">{alert.yarnName}</span>{' '}
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">{alert.yarnId}</span>
                    </td>
                    <td className={BODY_CELL}>{alert.createdAt || '—'}</td>
                    <td className={BODY_CELL}>{alert.acknowledgedAt ?? '—'}</td>
                    <td className={BODY_CELL}>{alert.resolvedAt ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">No resolved alerts yet.</p>
        )}
      </section>
    </div>
  );
}
