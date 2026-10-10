"""Stock movements — transactional, concurrency-safe, append-only."""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models import StockAlert, StockMovement, Supplier, YarnInventory
from app.schemas.movement import MovementCreate, MovementOut
from app.services.alerts import reconcile_alerts
from app.services.common import next_code, round_qty
from app.utils.errors import ConflictError, NotFoundError, PayloadError


def movement_to_out(movement: StockMovement, yarn_name: str = "", unit: str = "") -> dict:
    return {
        "movementId": movement.movement_id,
        "yarnId": movement.yarn_id,
        "yarnName": yarn_name,
        "unit": unit,
        "movementType": movement.movement_type,
        "quantity": float(movement.quantity),
        "date": movement.movement_date,
        "reference": movement.reference,
        "stockAfter": float(movement.stock_after),
        "previousQuantity": float(movement.previous_quantity),
        "supplierName": movement.supplier_name,
        "notes": movement.notes,
        "reason": movement.reason,
        "reversalOf": movement.reversal_of,
        "createdAt": movement.created_at,
    }


def _guarded_stock_update(db: Session, yarn_id: str, movement_type: str, quantity: float) -> tuple[float, float]:
    """Atomically change stock and return (previous, new).

    The WHERE clause guarantees the new value can never go below zero even if
    another request is updating the same row concurrently (row-level atomic
    UPDATE; `SELECT ... FOR UPDATE` on PostgreSQL adds a second line of defence).
    """
    quantity = round_qty(quantity)
    if quantity <= 0:
        raise PayloadError("Quantity must be greater than zero")

    if movement_type == "Consumption":
        stmt = (
            update(YarnInventory)
            .where(YarnInventory.yarn_id == yarn_id, YarnInventory.current_stock >= quantity)
            .values(current_stock=YarnInventory.current_stock - quantity)
        )
        insufficient_message = "Insufficient stock for this consumption"
    else:
        stmt = (
            update(YarnInventory)
            .where(YarnInventory.yarn_id == yarn_id)
            .values(current_stock=YarnInventory.current_stock + quantity)
        )
        insufficient_message = "Yarn not found"

    result = db.execute(stmt)
    if result.rowcount == 0:
        if movement_type == "Consumption":
            raise ConflictError(insufficient_message)
        raise NotFoundError(insufficient_message)

    new_value = float(
        db.scalar(select(YarnInventory.current_stock).where(YarnInventory.yarn_id == yarn_id))
    )
    # Keep the ORM identity map in sync so later reads in this transaction
    # (e.g. alert reconciliation) see the updated stock, not a cached value.
    instance = db.get(YarnInventory, yarn_id)
    if instance is not None:
        db.refresh(instance)

    previous = round_qty(new_value + quantity) if movement_type == "Consumption" else round_qty(new_value - quantity)
    return previous, new_value


def record_movement(db: Session, payload: MovementCreate, today: date) -> MovementOut:
    item = db.get(YarnInventory, payload.yarnId)
    if item is None:
        raise NotFoundError(f"Yarn {payload.yarnId} not found")

    quantity = round_qty(payload.quantity)
    if quantity <= 0:
        raise PayloadError("Quantity must be greater than zero after rounding to 3 decimals")

    supplier_name: str | None = None
    reason: str | None = None
    notes: str | None = None

    if payload.movementType == "Stock In":
        supplier_name = payload.supplierName.strip()
        if supplier_name == "":
            raise PayloadError("Supplier is required for Stock In")
        supplier = db.scalar(
            select(Supplier).where(func.lower(Supplier.company_name) == supplier_name.lower())
        )
        if supplier is None:
            raise PayloadError(f'Unknown supplier "{supplier_name}" — add it in Supplier Management first')
        supplier_name = supplier.company_name  # canonical stored spelling
        notes = payload.notes.strip() or None
    else:
        reason = payload.reason.strip()
        if reason == "":
            raise PayloadError("Reason is required for Stock Out")

    previous, new_value = _guarded_stock_update(db, payload.yarnId, payload.movementType, quantity)

    movement = StockMovement(
        movement_id=next_code(db, "MOV", "MOV", 5),
        yarn_id=payload.yarnId,
        movement_type=payload.movementType,
        quantity=quantity,
        movement_date=payload.date,
        reference=payload.reference.strip(),
        reason=reason,
        supplier_name=supplier_name,
        notes=notes,
        previous_quantity=previous,
        stock_after=new_value,
    )
    db.add(movement)
    db.flush()

    # Alerts are updated in the same transaction as the stock change.
    reconcile_alerts(db, today, [payload.yarnId])
    db.flush()
    return MovementOut(**movement_to_out(movement, yarn_name=item.yarn_name, unit=item.unit))


def list_movements(
    db: Session, *, yarn_id: str = "", movement_type: str = "", limit: int = 1000
) -> tuple[list[MovementOut], int]:
    stmt = select(StockMovement)
    if yarn_id:
        stmt = stmt.where(StockMovement.yarn_id == yarn_id)
    if movement_type:
        stmt = stmt.where(StockMovement.movement_type == movement_type)

    total = int(db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    joined = (
        select(StockMovement, YarnInventory.yarn_name, YarnInventory.unit)
        .join(YarnInventory, YarnInventory.yarn_id == StockMovement.yarn_id, isouter=True)
    )
    if yarn_id:
        joined = joined.where(StockMovement.yarn_id == yarn_id)
    if movement_type:
        joined = joined.where(StockMovement.movement_type == movement_type)
    rows = db.execute(
        joined.order_by(StockMovement.created_at.desc(), StockMovement.movement_id.desc()).limit(min(limit, 5000))
    ).all()
    return [
        MovementOut(**movement_to_out(row, yarn_name=name or "", unit=row_unit or ""))
        for row, name, row_unit in rows
    ], total


def reverse_movement(db: Session, movement_id: str, today: date) -> MovementOut:
    """Auditable correction: appends a compensating entry, never rewrites history."""
    original = db.get(StockMovement, movement_id)
    if original is None:
        raise NotFoundError(f"Movement {movement_id} not found")

    already = db.scalar(select(StockMovement).where(StockMovement.reversal_of == movement_id))
    if already is not None:
        raise ConflictError(f"{movement_id} has already been reversed ({already.movement_id})")

    item = db.get(YarnInventory, original.yarn_id)
    if item is None:
        raise NotFoundError(f"Yarn {original.yarn_id} no longer exists in the inventory")

    opposite = "Consumption" if original.movement_type == "Stock In" else "Stock In"
    try:
        previous, new_value = _guarded_stock_update(db, original.yarn_id, opposite, float(original.quantity))
    except ConflictError:
        raise ConflictError(
            f"Cannot reverse: current stock ({float(item.current_stock)} {item.unit}) is below the "
            f"reversed quantity ({float(original.quantity)} {item.unit})"
        ) from None

    reversal = StockMovement(
        movement_id=next_code(db, "MOV", "MOV", 5),
        yarn_id=original.yarn_id,
        movement_type=opposite,
        quantity=round_qty(float(original.quantity)),
        movement_date=today,
        reference=f"Reversal of {movement_id}",
        reason=f"Correction of {movement_id}" if opposite == "Consumption" else None,
        notes=f"Auditable correction of {movement_id}" if opposite == "Stock In" else None,
        previous_quantity=previous,
        stock_after=new_value,
        reversal_of=movement_id,
    )
    db.add(reversal)
    db.flush()
    reconcile_alerts(db, today, [original.yarn_id])
    db.flush()
    return MovementOut(**movement_to_out(reversal, yarn_name=item.yarn_name, unit=item.unit))
