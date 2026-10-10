"""Purchase recommendations (shortage + supplier comparison) and request drafts."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import PurchaseRequest, Supplier, YarnInventory
from app.schemas.purchase import (
    PurchaseRequestCreate,
    PurchaseRequestOut,
    RecommendationOut,
    SupplierOfferOut,
)
from app.services.common import next_code, round_qty, shortage
from app.utils.errors import ConflictError, NotFoundError, PayloadError

ALLOWED_TRANSITIONS = {
    ("draft", "submitted"),
    ("draft", "cancelled"),
    ("submitted", "cancelled"),
    ("cancelled", "draft"),
}


def _supplier_options():
    return (selectinload(Supplier.categories), selectinload(Supplier.product_codes))


def is_eligible(supplier: Supplier, yarn: YarnInventory) -> bool:
    if not supplier.active:
        return False
    categories = {c.category for c in supplier.categories}
    codes = {c.product_code for c in supplier.product_codes}
    return yarn.category in categories or yarn.product_code in codes


def price_for(supplier: Supplier, yarn: YarnInventory) -> tuple[float | None, str]:
    """(price, source) — nulls mean unavailable; never invented."""
    if supplier.price_per_kg is not None:
        return float(supplier.price_per_kg), "supplier_price"
    if supplier.company_name.lower() == yarn.supplier_source.strip().lower():
        return float(yarn.unit_cost), "current_supplier_dataset_price"
    return None, "unavailable"


def expected_delivery(lead_time_days: int | None, from_day: date) -> date | None:
    if lead_time_days is None or lead_time_days < 0:
        return None
    return from_day + timedelta(days=int(lead_time_days))


def recommendations(
    db: Session,
    *,
    q: str = "",
    page: int = 1,
    page_size: int = 20,
    buffer_quantity: float = 0.0,
    today: date | None = None,
) -> tuple[list[RecommendationOut], int]:
    """Shortage list with eligible-supplier comparison, from live DB numbers."""
    today = today or date.today()
    page_size = max(1, min(page_size, 100))

    stmt = select(YarnInventory).where(YarnInventory.current_stock < YarnInventory.minimum_stock_level)
    query = q.strip().lower()
    if query:
        pattern = f"%{query}%"
        stmt = stmt.where(
            func.lower(YarnInventory.yarn_id).like(pattern, escape="\\")
            | func.lower(YarnInventory.yarn_name).like(pattern, escape="\\")
            | func.lower(YarnInventory.product_code).like(pattern, escape="\\")
        )

    total = int(db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    total_pages = (total + page_size - 1) // page_size
    current_page = 1 if total_pages == 0 else min(max(1, page), total_pages)
    yarns = db.scalars(
        stmt.order_by(YarnInventory.yarn_id).offset((current_page - 1) * page_size).limit(page_size)
    ).all()

    suppliers = db.scalars(select(Supplier).options(*_supplier_options())).all()

    items: list[RecommendationOut] = []
    for yarn in yarns:
        current = float(yarn.current_stock)
        minimum = float(yarn.minimum_stock_level)
        gap = shortage(current, minimum)

        offers: list[SupplierOfferOut] = []
        for supplier in suppliers:
            if not is_eligible(supplier, yarn):
                continue
            unit_cost, source = price_for(supplier, yarn)
            offers.append(
                SupplierOfferOut(
                    supplierId=supplier.supplier_id,
                    companyName=supplier.company_name,
                    active=supplier.active,
                    unitCost=unit_cost,
                    minOrderQty=float(supplier.min_order_qty) if supplier.min_order_qty is not None else None,
                    leadTimeDays=supplier.lead_time_days,
                    expectedDeliveryDate=expected_delivery(supplier.lead_time_days, today),
                    priceSource=source,
                )
            )
        offers.sort(
            key=lambda offer: (
                offer.unitCost is None,
                offer.unitCost if offer.unitCost is not None else 0.0,
                offer.companyName.lower(),
            )
        )

        items.append(
            RecommendationOut(
                yarnId=yarn.yarn_id,
                yarnName=yarn.yarn_name,
                productCode=yarn.product_code,
                category=yarn.category,
                unit=yarn.unit,
                currentStock=current,
                minimumStockLevel=minimum,
                shortage=gap,
                recommendedQuantity=round_qty(gap + max(0.0, buffer_quantity)),
                currentSupplier=yarn.supplier_source,
                offers=offers,
            )
        )
    return items, total


def request_to_out(request: PurchaseRequest, yarn_name: str = "", unit: str = "") -> dict:
    return {
        "requestId": request.request_id,
        "documentType": request.document_type,
        "isPurchaseOrder": False,
        "yarnId": request.yarn_id,
        "yarnName": yarn_name,
        "supplierId": request.supplier_id,
        "supplierName": request.supplier_name,
        "quantity": float(request.quantity),
        "unit": unit or request.unit,
        "bufferQuantity": float(request.buffer_quantity),
        "shortageQuantity": float(request.shortage_quantity),
        "estimatedUnitCost": float(request.estimated_unit_cost) if request.estimated_unit_cost is not None else None,
        "estimatedTotalCost": float(request.estimated_total_cost) if request.estimated_total_cost is not None else None,
        "minOrderQty": float(request.min_order_qty) if request.min_order_qty is not None else None,
        "expectedDeliveryDate": request.expected_delivery_date,
        "status": request.status,
        "createdAt": request.created_at,
        "updatedAt": request.updated_at,
        "notes": request.notes,
    }


def list_requests(db: Session, *, status: str = "", yarn_id: str = "") -> list[PurchaseRequestOut]:
    stmt = select(PurchaseRequest)
    if status:
        stmt = stmt.where(PurchaseRequest.status == status)
    if yarn_id:
        stmt = stmt.where(PurchaseRequest.yarn_id == yarn_id)
    rows = db.scalars(stmt.order_by(PurchaseRequest.created_at.desc())).all()

    yarn_ids = {row.yarn_id for row in rows}
    yarns = {
        item.yarn_id: item
        for item in db.scalars(select(YarnInventory).where(YarnInventory.yarn_id.in_(yarn_ids))).all()
    } if yarn_ids else {}

    return [
        PurchaseRequestOut(
            **request_to_out(
                row,
                yarn_name=yarns[row.yarn_id].yarn_name if row.yarn_id in yarns else "",
                unit=yarns[row.yarn_id].unit if row.yarn_id in yarns else row.unit,
            )
        )
        for row in rows
    ]


def create_request(db: Session, values: PurchaseRequestCreate, today: date) -> PurchaseRequestOut:
    yarn = db.get(YarnInventory, values.yarnId)
    if yarn is None:
        raise NotFoundError(f"Yarn {values.yarnId} not found")

    supplier = db.scalar(select(Supplier).options(*_supplier_options()).where(Supplier.supplier_id == values.supplierId))
    if supplier is None:
        raise NotFoundError(f"Supplier {values.supplierId} not found")
    if not supplier.active:
        raise ConflictError(f"{supplier.company_name} is deactivated — reactivate it or pick another supplier")
    if not is_eligible(supplier, yarn):
        raise PayloadError(
            f"{supplier.company_name} is not mapped to {yarn.category} / {yarn.product_code}"
        )

    quantity = round_qty(values.quantity)
    if quantity <= 0:
        raise PayloadError("Quantity must be greater than zero")
    buffer_quantity = round_qty(max(0.0, values.bufferQuantity))

    unit_cost, _source = price_for(supplier, yarn)
    gap = shortage(float(yarn.current_stock), float(yarn.minimum_stock_level))
    delivery = values.expectedDeliveryDate or expected_delivery(supplier.lead_time_days, today)

    request = PurchaseRequest(
        request_id=next_code(db, "PR", "PR", 5),
        document_type="purchase_request",
        yarn_id=yarn.yarn_id,
        supplier_id=supplier.supplier_id,
        supplier_name=supplier.company_name,
        quantity=quantity,
        unit=yarn.unit,
        buffer_quantity=buffer_quantity,
        shortage_quantity=gap,
        estimated_unit_cost=unit_cost,
        estimated_total_cost=round_qty(unit_cost * quantity) if unit_cost is not None else None,
        min_order_qty=float(supplier.min_order_qty) if supplier.min_order_qty is not None else None,
        expected_delivery_date=delivery,
        status="draft",
        notes=values.notes.strip(),
    )
    db.add(request)
    db.flush()
    return PurchaseRequestOut(**request_to_out(request, yarn_name=yarn.yarn_name, unit=yarn.unit))


def update_status(db: Session, request_id: str, status: str) -> PurchaseRequestOut:
    request = db.get(PurchaseRequest, request_id)
    if request is None:
        raise NotFoundError(f"Purchase request {request_id} not found")
    if request.status == status:
        raise ConflictError(f"{request_id} is already {status}")
    if (request.status, status) not in ALLOWED_TRANSITIONS:
        raise ConflictError(f"Cannot change {request_id} from {request.status} to {status}")

    request.status = status
    db.flush()

    yarn = db.get(YarnInventory, request.yarn_id)
    return PurchaseRequestOut(
        **request_to_out(
            request,
            yarn_name=yarn.yarn_name if yarn else "",
            unit=yarn.unit if yarn else request.unit,
        )
    )
