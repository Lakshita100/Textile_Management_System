"""Yarn inventory endpoints: server-side search/filter/pagination + CRUD + CSV export."""

from __future__ import annotations

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.auth import require_permission
from app.schemas import InventoryListOut, InventorySummaryOut, YarnCreate, YarnOut, YarnUpdate
from app.services import inventory
from app.services.common import transaction

router = APIRouter(prefix="/inventory", tags=["inventory"], dependencies=[Depends(require_permission("materials"))])

EXPORT_COLUMNS = [
    ("yarnId", "Yarn ID"),
    ("yarnName", "Yarn Name"),
    ("productCode", "Product Code"),
    ("category", "Category"),
    ("materialComposition", "Material / Composition"),
    ("colourShade", "Colour / Shade"),
    ("denierSpecification", "Denier / Specification"),
    ("currentStock", "Current Stock"),
    ("unit", "Unit"),
    ("unitCost", "Unit Cost"),
    ("supplierSource", "Supplier / Source"),
    ("minimumStockLevel", "Minimum Stock Level"),
    ("storageLocation", "Storage Location"),
    ("batchNumber", "Batch Number"),
    ("inventoryStage", "Inventory Stage"),
    ("stockStatus", "Stock Status"),
]


@router.get("/summary", response_model=InventorySummaryOut, summary="Aggregated inventory summary cards")
def get_summary(db: Session = Depends(get_db)) -> InventorySummaryOut:
    return inventory.get_summary(db)


@router.get("/facets", summary="Distinct filter values for the inventory toolbar")
def get_facets(db: Session = Depends(get_db)) -> dict[str, list[str]]:
    return inventory.facets(db)


@router.get("/recently-updated", summary="Most recently updated yarn records (dashboard)")
def get_recently_updated(
    limit: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db),
) -> dict:
    items = inventory.recently_updated(db, limit=limit)
    return {"items": [YarnOut(**item) for item in items]}


@router.get("/export", summary="Export filtered inventory as CSV (respects the list filters)")
def export_inventory(
    q: str = Query("", max_length=100),
    category: str = Query("", max_length=100),
    status: str = Query(""),
    supplier: str = Query("", max_length=200),
    stage: str = Query("", max_length=50),
    colour: str = Query("", max_length=100),
    db: Session = Depends(get_db),
) -> Response:
    rows = inventory.export_rows(db, q=q, category=category, status=status, supplier=supplier, stage=stage, colour=colour)
    buffer = io.StringIO()
    writer = csv.writer(buffer, quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
    writer.writerow([header for _, header in EXPORT_COLUMNS])
    for row in rows:
        writer.writerow([row[key] for key, _ in EXPORT_COLUMNS])
    filename = f"yarn-inventory-{date.today().isoformat()}.csv"
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("", response_model=InventoryListOut, summary="List yarn records (search, filter, paginate)")
def list_inventory(
    q: str = Query("", max_length=100, description="Search yarn ID, name or product code"),
    category: str = Query("", max_length=100),
    status: str = Query("", description="In Stock | Low Stock | Out of Stock"),
    supplier: str = Query("", max_length=200, description="Exact supplier / source name"),
    stage: str = Query("", max_length=50, description="Inventory stage"),
    colour: str = Query("", max_length=100, description="Colour / shade (contains match)"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=200),
    db: Session = Depends(get_db),
) -> InventoryListOut:
    items, total, current_page, total_pages = inventory.list_inventory(
        db,
        q=q,
        category=category,
        status=status,
        supplier=supplier,
        stage=stage,
        colour=colour,
        page=page,
        page_size=pageSize,
    )
    return InventoryListOut(
        items=[YarnOut(**item) for item in items],
        page=current_page,
        pageSize=pageSize,
        total=total,
        totalPages=total_pages,
    )


@router.post("", response_model=YarnOut, status_code=201, summary="Create a yarn record")
def create_yarn(payload: YarnCreate, db: Session = Depends(get_db)) -> YarnOut:
    with transaction(db):
        result = inventory.create_yarn(db, payload)
    return YarnOut(**result)


@router.get("/{yarn_id}", response_model=YarnOut, summary="Get one yarn record")
def get_yarn(yarn_id: str, db: Session = Depends(get_db)) -> YarnOut:
    return YarnOut(**inventory.yarn_to_out(inventory.get_yarn(db, yarn_id)))


@router.put("/{yarn_id}", response_model=YarnOut, summary="Update a yarn record (full replace)")
def update_yarn(yarn_id: str, payload: YarnUpdate, db: Session = Depends(get_db)) -> YarnOut:
    with transaction(db):
        result = inventory.update_yarn(db, yarn_id, payload)
    return YarnOut(**result)


@router.delete("/{yarn_id}", status_code=204, response_model=None, summary="Delete a yarn record (with its movements and alerts)")
def delete_yarn(yarn_id: str, db: Session = Depends(get_db)) -> None:
    with transaction(db):
        inventory.delete_yarn(db, yarn_id)
