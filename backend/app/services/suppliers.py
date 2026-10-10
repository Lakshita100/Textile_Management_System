"""Supplier CRUD, eligibility rules and yarn reassignment with audit trail."""

from __future__ import annotations

import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    StockMovement,
    PurchaseRequest,
    Supplier,
    SupplierCategory,
    SupplierChangeHistory,
    SupplierProductCode,
    YarnInventory,
)
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.services.common import next_code
from app.utils.errors import ConflictError, NotFoundError, PayloadError

# Phone/email checks apply only when a value is actually supplied — this
# project never invents contact details, so empty strings are valid.
PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9\s\-()]{5,19}$")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def is_valid_phone(phone: str) -> bool:
    trimmed = phone.strip()
    if trimmed == "":
        return True
    digits = re.sub(r"\D", "", trimmed)
    return 7 <= len(digits) <= 15 and bool(PHONE_PATTERN.match(trimmed))


def is_valid_email(email: str) -> bool:
    trimmed = email.strip()
    return trimmed == "" or bool(EMAIL_PATTERN.match(trimmed))


def supplier_to_out(supplier: Supplier, supplied_yarn_count: int = 0) -> dict:
    return {
        "supplierId": supplier.supplier_id,
        "companyName": supplier.company_name,
        "contactPerson": supplier.contact_person,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "yarnTypes": sorted(category.category for category in supplier.categories),
        "productCodes": sorted(code.product_code for code in supplier.product_codes),
        "pricePerKg": float(supplier.price_per_kg) if supplier.price_per_kg is not None else None,
        "minOrderQty": float(supplier.min_order_qty) if supplier.min_order_qty is not None else None,
        "leadTimeDays": supplier.lead_time_days,
        "notes": supplier.notes,
        "active": supplier.active,
        "isDemo": supplier.is_demo,
        "suppliedYarnCount": int(supplied_yarn_count),
        "createdAt": supplier.created_at,
        "updatedAt": supplier.updated_at,
    }


def supplied_yarn_counts(db: Session, suppliers: list[Supplier]) -> dict[str, int]:
    """Single GROUP BY over the indexed supplier_source column — one query for all suppliers."""
    names = {supplier.company_name.lower() for supplier in suppliers}
    if not names:
        return {}
    rows = db.execute(
        select(func.lower(YarnInventory.supplier_source), func.count())
        .where(func.lower(YarnInventory.supplier_source).in_(names))
        .group_by(func.lower(YarnInventory.supplier_source))
    ).all()
    return {name: int(count) for name, count in rows}


def _load_options():
    return (selectinload(Supplier.categories), selectinload(Supplier.product_codes))


def _validate(values: SupplierCreate | SupplierUpdate, db: Session, editing_id: str | None = None) -> None:
    if not is_valid_phone(values.phone):
        raise PayloadError("Enter a valid phone number (7–15 digits, optional +, -, spaces)")
    if not is_valid_email(values.email):
        raise PayloadError("Enter a valid email address")
    duplicate = db.scalar(
        select(Supplier).where(func.lower(Supplier.company_name) == values.companyName.lower())
    )
    if duplicate is not None and duplicate.supplier_id != editing_id:
        raise ConflictError("A supplier with this company name already exists")


def _apply_values(supplier: Supplier, values: SupplierCreate | SupplierUpdate) -> None:
    supplier.company_name = values.companyName
    supplier.contact_person = values.contactPerson.strip()
    supplier.phone = values.phone.strip()
    supplier.email = values.email.strip()
    supplier.address = values.address.strip()
    supplier.price_per_kg = values.pricePerKg
    supplier.min_order_qty = values.minOrderQty
    supplier.lead_time_days = values.leadTimeDays
    supplier.notes = values.notes.strip()

    supplier.categories.clear()
    for category in sorted({c.strip() for c in values.yarnTypes if c.strip()}):
        supplier.categories.append(SupplierCategory(category=category))

    seen: set[str] = set()
    supplier.product_codes.clear()
    for code in values.productCodes:
        clean = code.strip()
        if clean and clean.lower() not in seen:
            seen.add(clean.lower())
            supplier.product_codes.append(SupplierProductCode(product_code=clean))


def list_suppliers(db: Session, *, q: str = "", active: str = "", category: str = "") -> list[Supplier]:
    stmt = select(Supplier).options(*_load_options())
    query = q.strip().lower()
    if query:
        pattern = f"%{query}%"
        stmt = stmt.where(
            func.lower(Supplier.company_name).like(pattern, escape="\\")
            | func.lower(Supplier.contact_person).like(pattern, escape="\\")
            | func.lower(Supplier.address).like(pattern, escape="\\")
            | Supplier.supplier_id.in_(
                select(SupplierProductCode.supplier_id).where(
                    func.lower(SupplierProductCode.product_code).like(pattern, escape="\\")
                )
            )
        )
    if active in ("true", "false"):
        stmt = stmt.where(Supplier.active.is_(active == "true"))
    if category:
        stmt = stmt.where(
            Supplier.supplier_id.in_(
                select(SupplierCategory.supplier_id).where(SupplierCategory.category == category)
            )
        )
    return db.scalars(stmt.order_by(Supplier.company_name)).all()


def get_supplier(db: Session, supplier_id: str) -> Supplier:
    supplier = db.scalar(select(Supplier).options(*_load_options()).where(Supplier.supplier_id == supplier_id))
    if supplier is None:
        raise NotFoundError(f"Supplier {supplier_id} not found")
    return supplier


def create_supplier(db: Session, values: SupplierCreate) -> dict:
    _validate(values, db)
    supplier = Supplier(
        supplier_id=next_code(db, "SUP", "SUP", 4),
        company_name=values.companyName,
        active=True,
        is_demo=False,
    )
    _apply_values(supplier, values)
    db.add(supplier)
    db.flush()
    db.refresh(supplier)
    return supplier_to_out(get_supplier(db, supplier.supplier_id))


def update_supplier(db: Session, supplier_id: str, values: SupplierUpdate) -> dict:
    supplier = get_supplier(db, supplier_id)
    _validate(values, db, editing_id=supplier_id)
    _apply_values(supplier, values)
    db.flush()
    return supplier_to_out(get_supplier(db, supplier_id))


def set_supplier_active(db: Session, supplier_id: str, active: bool) -> dict:
    supplier = get_supplier(db, supplier_id)
    supplier.active = active
    db.flush()
    return supplier_to_out(supplier)


def count_references(db: Session, supplier: Supplier) -> dict[str, int]:
    name = supplier.company_name.lower()
    yarns = db.scalar(
        select(func.count()).select_from(YarnInventory).where(func.lower(YarnInventory.supplier_source) == name)
    ) or 0
    movements = db.scalar(
        select(func.count()).select_from(StockMovement).where(func.lower(StockMovement.supplier_name) == name)
    ) or 0
    requests = db.scalar(
        select(func.count())
        .select_from(PurchaseRequest)
        .where(
            (PurchaseRequest.supplier_id == supplier.supplier_id)
            | (func.lower(PurchaseRequest.supplier_name) == name)
        )
    ) or 0
    return {"yarns": int(yarns), "movements": int(movements), "purchases": int(requests)}


def delete_supplier(db: Session, supplier_id: str) -> None:
    """Deletes only when nothing references the supplier — history is preserved."""
    supplier = get_supplier(db, supplier_id)
    refs = count_references(db, supplier)
    if refs["yarns"] or refs["movements"] or refs["purchases"]:
        parts = []
        if refs["yarns"]:
            parts.append(f"{refs['yarns']} yarn record(s)")
        if refs["movements"]:
            parts.append(f"{refs['movements']} stock movement(s)")
        if refs["purchases"]:
            parts.append(f"{refs['purchases']} purchase request(s)")
        raise ConflictError(
            f"{supplier.company_name} cannot be deleted — referenced by {', '.join(parts)}. "
            "Deactivate it instead to preserve history."
        )
    supplier.categories.clear()
    supplier.product_codes.clear()
    db.delete(supplier)
    db.flush()


def change_yarn_supplier(db: Session, yarn_id: str, new_supplier_name: str, note: str = "") -> dict:
    """Reassign a yarn's supplier; writes an append-only audit entry."""
    from app.services.inventory import yarn_to_out

    item = db.get(YarnInventory, yarn_id)
    if item is None:
        raise NotFoundError(f"Yarn {yarn_id} not found")

    target = db.scalar(
        select(Supplier).where(func.lower(Supplier.company_name) == new_supplier_name.strip().lower())
    )
    if target is None:
        raise PayloadError(f'Supplier "{new_supplier_name}" not found')
    if not target.active:
        raise ConflictError(f"{target.company_name} is deactivated — reactivate it first")
    if item.supplier_source.lower() == target.company_name.lower():
        raise ConflictError(f"{target.company_name} is already the supplier for this yarn")

    old_supplier = item.supplier_source
    item.supplier_source = target.company_name
    db.add(
        SupplierChangeHistory(
            yarn_id=item.yarn_id,
            old_supplier=old_supplier,
            new_supplier=target.company_name,
            changed_by="inventory-operator",
            note=note.strip()[:500],
        )
    )
    db.flush()
    return yarn_to_out(item)


def list_supplier_history(db: Session, yarn_id: str) -> list[dict]:
    rows = db.scalars(
        select(SupplierChangeHistory)
        .where(SupplierChangeHistory.yarn_id == yarn_id)
        .order_by(SupplierChangeHistory.changed_at.desc())
    ).all()
    return [
        {
            "id": row.id,
            "yarnId": row.yarn_id,
            "oldSupplier": row.old_supplier,
            "newSupplier": row.new_supplier,
            "changedBy": row.changed_by,
            "note": row.note,
            "changedAt": row.changed_at,
        }
        for row in rows
    ]
