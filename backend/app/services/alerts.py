"""Low-stock alert lifecycle: reconcile, acknowledge, resolve."""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import StockAlert, Supplier, YarnInventory
from app.schemas.alert import AlertListOut, StockAlertOut
from app.services.common import needs_alert, next_code, resolve_status, shortage
from app.utils.errors import ConflictError, NotFoundError


def alert_to_out(alert: StockAlert, item: YarnInventory | None, supplier: Supplier | None) -> dict:
    stock = float(item.current_stock) if item else 0.0
    minimum = float(item.minimum_stock_level) if item else 0.0
    kind = "Out of Stock" if stock <= 0 else "Low Stock"
    return {
        "alertId": alert.alert_id,
        "yarnId": alert.yarn_id,
        "status": alert.status,
        "createdAt": alert.created_on,
        "updatedAt": alert.updated_on,
        "acknowledgedAt": alert.acknowledged_on,
        "resolvedAt": alert.resolved_on,
        "yarnName": item.yarn_name if item else "",
        "kind": kind,
        "currentStock": stock,
        "minimumStockLevel": minimum,
        "shortage": shortage(stock, minimum),
        "unit": item.unit if item else "",
        "supplier": (
            {
                "supplierId": supplier.supplier_id,
                "companyName": supplier.company_name,
                "contactPerson": supplier.contact_person,
                "phone": supplier.phone,
                "email": supplier.email,
                "address": supplier.address,
                "active": supplier.active,
            }
            if supplier
            else None
        ),
    }


def reconcile_alerts(db: Session, today: date, yarn_ids: list[str] | None = None) -> None:
    """Bring alerts in line with stock. Called inside every movement transaction.

    - resolves open alerts whose yarn recovered above the threshold,
    - opens an alert for every yarn at/below threshold without one,
    - never creates a duplicate open alert (also enforced by a partial index).
    """
    open_stmt = select(StockAlert).where(StockAlert.status != "resolved")
    if yarn_ids is not None:
        open_stmt = open_stmt.where(StockAlert.yarn_id.in_(yarn_ids))

    for alert in db.scalars(open_stmt).all():
        item = db.get(YarnInventory, alert.yarn_id)
        if item is None or float(item.current_stock) > float(item.minimum_stock_level):
            alert.status = "resolved"
            alert.resolved_on = today
            alert.updated_on = today

    need_stmt = select(YarnInventory)
    if yarn_ids is not None:
        need_stmt = need_stmt.where(YarnInventory.yarn_id.in_(yarn_ids))
    else:
        need_stmt = need_stmt.where(YarnInventory.current_stock <= YarnInventory.minimum_stock_level)

    open_yarn_ids = {
        row
        for row in db.scalars(
            select(StockAlert.yarn_id).where(StockAlert.status != "resolved")
        ).all()
    }

    for item in db.scalars(need_stmt).all():
        if not needs_alert(float(item.current_stock), float(item.minimum_stock_level)):
            continue
        if item.yarn_id in open_yarn_ids:
            continue
        db.add(
            StockAlert(
                alert_id=next_code(db, "ALT", "ALT", 5),
                yarn_id=item.yarn_id,
                status="active",
                created_on=today,
                updated_on=today,
            )
        )
        open_yarn_ids.add(item.yarn_id)
    db.flush()


def list_alerts(db: Session, *, status: str = "") -> AlertListOut:
    stmt = select(StockAlert)
    if status:
        stmt = stmt.where(StockAlert.status == status)

    alerts = db.scalars(stmt.order_by(StockAlert.status, StockAlert.alert_id)).all()

    items: list[StockAlertOut] = []
    open_count = 0
    for alert in alerts:
        if alert.status != "resolved":
            open_count += 1
        item = db.get(YarnInventory, alert.yarn_id)
        supplier = None
        if item is not None:
            supplier = db.scalar(
                select(Supplier).where(func.lower(Supplier.company_name) == item.supplier_source.lower())
            )
        items.append(StockAlertOut(**alert_to_out(alert, item, supplier)))

    return AlertListOut(items=items, total=len(items), open=open_count)


def _get_alert(db: Session, alert_id: str) -> StockAlert:
    alert = db.get(StockAlert, alert_id)
    if alert is None:
        raise NotFoundError(f"Alert {alert_id} not found")
    return alert


def acknowledge_alert(db: Session, alert_id: str, today: date) -> dict:
    alert = _get_alert(db, alert_id)
    if alert.status != "active":
        raise ConflictError("Only active alerts can be acknowledged")
    alert.status = "acknowledged"
    alert.acknowledged_on = today
    alert.updated_on = today
    db.flush()
    item = db.get(YarnInventory, alert.yarn_id)
    supplier = (
        db.scalar(select(Supplier).where(func.lower(Supplier.company_name) == item.supplier_source.lower()))
        if item
        else None
    )
    return alert_to_out(alert, item, supplier)


def resolve_alert(db: Session, alert_id: str, today: date) -> dict:
    alert = _get_alert(db, alert_id)
    if alert.status == "resolved":
        raise ConflictError("Alert is already resolved")
    alert.status = "resolved"
    alert.resolved_on = today
    alert.updated_on = today
    db.flush()
    item = db.get(YarnInventory, alert.yarn_id)
    supplier = (
        db.scalar(select(Supplier).where(func.lower(Supplier.company_name) == item.supplier_source.lower()))
        if item
        else None
    )
    return alert_to_out(alert, item, supplier)


def stock_status_of(item: YarnInventory) -> str:
    return resolve_status(float(item.current_stock), float(item.minimum_stock_level))
