"""Quality inspection endpoints — real data from PostgreSQL."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quality import InspectionOutcome
from app.schemas.common import Page
from app.schemas.quality import (
    InspectionCreate,
    InspectionOut,
    QualityDashboardOut,
    RollIdOut,
)
from app.services import quality as quality_service
from app.services.quality import QualityRuleError

router = APIRouter(prefix="/quality", tags=["quality"])


@router.get("/inspections", response_model=Page[InspectionOut])
def list_inspections(
    search: str | None = None,
    outcome: InspectionOutcome | None = None,
    machine_code: str | None = None,
    employee_id: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return quality_service.list_inspections(
        db,
        search=search,
        outcome=outcome,
        machine_code=machine_code,
        employee_id=employee_id,
        page=page,
        page_size=page_size,
    )


@router.post("/inspections", response_model=InspectionOut, status_code=201)
def create_inspection(payload: InspectionCreate, db: Session = Depends(get_db)):
    try:
        insp = quality_service.create_inspection(db, payload)
    except QualityRuleError as e:
        raise HTTPException(422, {"detail": str(e), "code": e.code})
    result = quality_service.list_inspections(db, search=insp.code, page_size=1)
    if not result.items:
        raise HTTPException(500, {"detail": "Inspection created but could not be re-read"})
    return result.items[0]


@router.get("/roll-id", response_model=RollIdOut)
def roll_id(batch_no: str = Query(min_length=1, max_length=64), db: Session = Depends(get_db)):
    return RollIdOut(roll_id=quality_service.next_roll_id(db, batch_no))


@router.get("/dashboard", response_model=QualityDashboardOut)
def dashboard(db: Session = Depends(get_db)):
    return quality_service.compute_dashboard(db)
