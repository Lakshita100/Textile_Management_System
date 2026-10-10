"""Supplier endpoints: CRUD, activation and yarn reassignment with audit trail."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ChangeSupplierIn, SupplierActiveIn, SupplierCreate, SupplierListOut, SupplierOut, SupplierUpdate
from app.services import suppliers as supplier_service
from app.services.common import transaction

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=SupplierListOut, summary="List suppliers (search, filter)")
def list_suppliers(
    q: str = Query("", max_length=200, description="Matches company, contact or product code"),
    active: str = Query("", description="true | false | empty for all"),
    category: str = Query("", max_length=100),
    db: Session = Depends(get_db),
) -> SupplierListOut:
    rows = supplier_service.list_suppliers(db, q=q, active=active, category=category)
    counts = supplier_service.supplied_yarn_counts(db, rows)
    items = [
        SupplierOut(
            **supplier_service.supplier_to_out(
                row, supplied_yarn_count=counts.get(row.company_name.lower(), 0)
            )
        )
        for row in rows
    ]
    return SupplierListOut(items=items, total=len(items))


@router.post("", response_model=SupplierOut, status_code=201, summary="Add a supplier")
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)) -> SupplierOut:
    with transaction(db):
        result = supplier_service.create_supplier(db, payload)
    return SupplierOut(**result)


@router.get("/{supplier_id}", response_model=SupplierOut, summary="Get one supplier")
def get_supplier(supplier_id: str, db: Session = Depends(get_db)) -> SupplierOut:
    row = supplier_service.get_supplier(db, supplier_id)
    counts = supplier_service.supplied_yarn_counts(db, [row])
    return SupplierOut(
        **supplier_service.supplier_to_out(row, supplied_yarn_count=counts.get(row.company_name.lower(), 0))
    )


@router.put("/{supplier_id}", response_model=SupplierOut, summary="Update a supplier")
def update_supplier(supplier_id: str, payload: SupplierUpdate, db: Session = Depends(get_db)) -> SupplierOut:
    with transaction(db):
        result = supplier_service.update_supplier(db, supplier_id, payload)
    return SupplierOut(**result)


@router.post("/{supplier_id}/active", response_model=SupplierOut, summary="Activate / deactivate a supplier")
def set_active(supplier_id: str, payload: SupplierActiveIn, db: Session = Depends(get_db)) -> SupplierOut:
    with transaction(db):
        result = supplier_service.set_supplier_active(db, supplier_id, payload.active)
    return SupplierOut(**result)


@router.delete("/{supplier_id}", status_code=204, summary="Delete an unreferenced supplier")
def delete_supplier(supplier_id: str, db: Session = Depends(get_db)) -> None:
    with transaction(db):
        supplier_service.delete_supplier(db, supplier_id)


@router.put("/yarn/{yarn_id}/supplier", summary="Reassign a yarn to another supplier (audited)")
def change_yarn_supplier(yarn_id: str, payload: ChangeSupplierIn, db: Session = Depends(get_db)) -> dict:
    with transaction(db):
        result = supplier_service.change_yarn_supplier(
            db, yarn_id, payload.newSupplierName, payload.note
        )
    return result


@router.get("/yarn/{yarn_id}/supplier-history", summary="Supplier change audit trail for a yarn")
def supplier_history(yarn_id: str, db: Session = Depends(get_db)) -> dict:
    return {"items": supplier_service.list_supplier_history(db, yarn_id)}
