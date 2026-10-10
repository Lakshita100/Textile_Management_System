"""Inventory queries and CRUD — all aggregates come from the database."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import StockAlert, Supplier, SupplierChangeHistory, StockMovement, YarnInventory
from app.schemas.yarn import InventorySummaryOut, YarnCreate, YarnOut, YarnUpdate
from app.services.common import (
    STATUS_IN_STOCK,
    STATUS_LOW_STOCK,
    STATUS_OUT_OF_STOCK,
    like_pattern,
    lower_like,
    resolve_status,
)
from app.utils.errors import ConflictError, NotFoundError

MAX_PAGE_SIZE = 200
MAX_EXPORT_ROWS = 50_000


def yarn_to_out(item: YarnInventory) -> dict:
    return {
        "yarnId": item.yarn_id,
        "imageFile": item.image_file,
        "yarnName": item.yarn_name,
        "productCode": item.product_code,
        "category": item.category,
        "materialComposition": item.material_composition,
        "colourShade": item.colour_shade,
        "denierSpecification": item.denier_specification,
        "currentStock": float(item.current_stock),
        "unit": item.unit,
        "unitCost": float(item.unit_cost),
        "supplierSource": item.supplier_source,
        "minimumStockLevel": float(item.minimum_stock_level),
        "storageLocation": item.storage_location,
        "batchNumber": item.batch_number,
        "inventoryStage": item.inventory_stage,
        "stockStatus": resolve_status(float(item.current_stock), float(item.minimum_stock_level)),
        "isDemo": bool(item.is_demo),
        "updatedAt": item.updated_at,
    }


def _status_condition(status: str):
    stock = YarnInventory.current_stock
    minimum = YarnInventory.minimum_stock_level
    if status == STATUS_IN_STOCK:
        return stock >= minimum
    if status == STATUS_OUT_OF_STOCK:
        return stock <= 0
    if status == STATUS_LOW_STOCK:
        return (stock > 0) & (stock < minimum)
    return None


def _filtered_stmt(
    *,
    q: str = "",
    category: str = "",
    status: str = "",
    supplier: str = "",
    stage: str = "",
    colour: str = "",
):
    """Builds the WHERE clause shared by list, export and count queries."""
    stmt = select(YarnInventory)
    query = q.strip()
    if query:
        pattern = like_pattern(query)
        stmt = stmt.where(
            lower_like(YarnInventory.yarn_id, pattern)
            | lower_like(YarnInventory.yarn_name, pattern)
            | lower_like(YarnInventory.product_code, pattern)
        )
    if category:
        stmt = stmt.where(YarnInventory.category == category)
    if status:
        condition = _status_condition(status)
        if condition is not None:
            stmt = stmt.where(condition)
    if supplier:
        stmt = stmt.where(func.lower(YarnInventory.supplier_source) == supplier.strip().lower())
    if stage:
        stmt = stmt.where(YarnInventory.inventory_stage == stage)
    if colour:
        stmt = stmt.where(lower_like(YarnInventory.colour_shade, like_pattern(colour)))
    return stmt


def list_inventory(
    db: Session,
    *,
    q: str = "",
    category: str = "",
    status: str = "",
    supplier: str = "",
    stage: str = "",
    colour: str = "",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[dict], int, int, int]:
    """Server-side search + filter + pagination. Returns (items, total, page, totalPages)."""
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))

    stmt = _filtered_stmt(q=q, category=category, status=status, supplier=supplier, stage=stage, colour=colour)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    total = int(total)
    total_pages = (total + page_size - 1) // page_size
    current_page = 1 if total_pages == 0 else min(max(1, page), total_pages)

    rows = (
        db.scalars(
            stmt.order_by(YarnInventory.yarn_id).offset((current_page - 1) * page_size).limit(page_size)
        ).all()
    )
    return [yarn_to_out(row) for row in rows], total, current_page, total_pages


def export_rows(db: Session, **filters: str) -> list[dict]:
    """All rows matching the filters (same clause as the list endpoint), capped."""
    stmt = _filtered_stmt(**filters).order_by(YarnInventory.yarn_id).limit(MAX_EXPORT_ROWS)
    return [yarn_to_out(row) for row in db.scalars(stmt).all()]


def recently_updated(db: Session, limit: int = 6) -> list[dict]:
    """Newest-first snapshot for the dashboard, ordered by the `updated_at` index."""
    limit = max(1, min(limit, 50))
    rows = db.scalars(
        select(YarnInventory).order_by(YarnInventory.updated_at.desc(), YarnInventory.yarn_id).limit(limit)
    ).all()
    return [yarn_to_out(row) for row in rows]


def facets(db: Session) -> dict[str, list[str]]:
    """Distinct filter values (category, stage, colour, supplier) for the toolbar dropdowns."""

    def distinct(column) -> list[str]:  # noqa: ANN001
        return [
            str(value)
            for value in db.scalars(
                select(column).where(column != "").distinct().order_by(column).limit(500)
            ).all()
        ]

    return {
        "categories": distinct(YarnInventory.category),
        "stages": distinct(YarnInventory.inventory_stage),
        "colours": distinct(YarnInventory.colour_shade),
        "suppliers": distinct(YarnInventory.supplier_source),
    }


def get_summary(db: Session) -> InventorySummaryOut:
    """Every card number is a SQL aggregate — nothing is hardcoded."""
    from sqlalchemy import case

    low_condition = (YarnInventory.current_stock > 0) & (
        YarnInventory.current_stock < YarnInventory.minimum_stock_level
    )
    counts = db.execute(
        select(
            func.count(YarnInventory.yarn_id),
            func.coalesce(func.sum(YarnInventory.current_stock), 0.0),
            func.coalesce(func.sum(case((low_condition, 1), else_=0)), 0),
            func.coalesce(func.sum(case((YarnInventory.current_stock <= 0, 1), else_=0)), 0),
            func.coalesce(func.sum(YarnInventory.current_stock * YarnInventory.unit_cost), 0.0),
            func.coalesce(func.sum(case((YarnInventory.is_demo.is_(True), 1), else_=0)), 0),
        )
    ).one()

    unit_row = db.execute(
        select(YarnInventory.unit, func.count().label("n"))
        .group_by(YarnInventory.unit)
        .order_by(func.count().desc())
        .limit(1)
    ).first()
    open_alerts = db.scalar(
        select(func.count()).select_from(StockAlert).where(StockAlert.status != "resolved")
    ) or 0
    total_suppliers = db.scalar(select(func.count()).select_from(Supplier)) or 0

    return InventorySummaryOut(
        totalYarnTypes=int(counts[0] or 0),
        totalAvailableStock=float(counts[1] or 0),
        lowStockItems=int(counts[2] or 0),
        outOfStockItems=int(counts[3] or 0),
        inventoryValue=float(counts[4] or 0),
        stockUnit=unit_row[0] if unit_row else "",
        totalSuppliers=int(total_suppliers),
        demoCount=int(counts[5] or 0),
        openAlerts=int(open_alerts),
    )


def get_yarn(db: Session, yarn_id: str) -> YarnInventory:
    item = db.get(YarnInventory, yarn_id)
    if item is None:
        raise NotFoundError(f"Yarn {yarn_id} not found")
    return item


def _ensure_unique_yarn_id(db: Session, yarn_id: str, editing: str | None = None) -> None:
    existing = db.scalar(select(YarnInventory).where(func.lower(YarnInventory.yarn_id) == yarn_id.lower()))
    if existing is not None and existing.yarn_id != editing:
        raise ConflictError(f"Yarn ID {yarn_id} already exists")


def create_yarn(db: Session, payload: YarnCreate) -> dict:
    _ensure_unique_yarn_id(db, payload.yarnId)
    item = YarnInventory(
        yarn_id=payload.yarnId,
        yarn_name=payload.yarnName,
        product_code=payload.productCode,
        category=payload.category,
        material_composition=payload.materialComposition,
        colour_shade=payload.colourShade,
        denier_specification=payload.denierSpecification,
        current_stock=payload.currentStock,
        unit=payload.unit,
        unit_cost=payload.unitCost,
        supplier_source=payload.supplierSource,
        minimum_stock_level=payload.minimumStockLevel,
        storage_location=payload.storageLocation,
        batch_number=payload.batchNumber,
        inventory_stage=payload.inventoryStage,
        image_file=payload.imageFile,
        is_demo=False,
    )
    db.add(item)
    db.flush()
    return yarn_to_out(item)


def update_yarn(db: Session, yarn_id: str, payload: YarnUpdate) -> dict:
    item = get_yarn(db, yarn_id)
    _ensure_unique_yarn_id(db, payload.yarnId, editing=item.yarn_id)

    old_supplier = item.supplier_source
    item.yarn_id = payload.yarnId
    item.yarn_name = payload.yarnName
    item.product_code = payload.productCode
    item.category = payload.category
    item.material_composition = payload.materialComposition
    item.colour_shade = payload.colourShade
    item.denier_specification = payload.denierSpecification
    item.current_stock = payload.currentStock
    item.unit = payload.unit
    item.unit_cost = payload.unitCost
    item.supplier_source = payload.supplierSource
    item.minimum_stock_level = payload.minimumStockLevel
    item.storage_location = payload.storageLocation
    item.batch_number = payload.batchNumber
    item.inventory_stage = payload.inventoryStage
    item.image_file = payload.imageFile

    if payload.supplierSource != old_supplier:
        db.add(
            SupplierChangeHistory(
                yarn_id=item.yarn_id,
                old_supplier=old_supplier,
                new_supplier=payload.supplierSource,
                changed_by="inventory-operator",
                note="Changed while editing the yarn record",
            )
        )
    db.flush()
    return yarn_to_out(item)


def delete_yarn(db: Session, yarn_id: str) -> None:
    """Deletes a yarn record together with its dependent rows, in one transaction."""
    item = get_yarn(db, yarn_id)
    # Order matters: children first (movement reversals reference movements of
    # the same yarn), then the parent row.
    db.query(StockAlert).filter(StockAlert.yarn_id == item.yarn_id).delete(synchronize_session=False)
    db.query(StockMovement).filter(StockMovement.yarn_id == item.yarn_id).delete(synchronize_session=False)
    db.query(SupplierChangeHistory).filter(SupplierChangeHistory.yarn_id == item.yarn_id).delete(
        synchronize_session=False
    )
    db.delete(item)
    db.flush()
