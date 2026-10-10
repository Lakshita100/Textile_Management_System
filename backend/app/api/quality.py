"""Quality inspections API (Anand's Feature 03 contract, persisted backend)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quality import QualityInspection
from app.schemas.common import Page
from app.schemas.quality import (
    DashboardBundleOut,
    DefectTypePointOut,
    InspectionCountOut,
    InspectionCreate,
    InspectionOut,
    InspectionUpdate,
    InspectableJobOut,
    MachineSummaryOut,
    MatrixRowOut,
    RollPreviewOut,
    TrendPointOut,
)
from app.services import quality as quality_service
from app.services.quality import QualityRuleError

router = APIRouter(prefix="/quality", tags=["quality"])

_ERR_STATUS = {
    "JOB_NOT_FOUND": 404,
    "INSPECTION_NOT_FOUND": 404,
    "MACHINE_NOT_FOUND": 404,
}


def _raise(e: QualityRuleError) -> None:
    raise HTTPException(_ERR_STATUS.get(e.code, 409), {"detail": str(e), "code": e.code})


def _to_out(inspection: QualityInspection, machine=None) -> InspectionOut:
    m = machine if machine is not None else inspection.machine
    return InspectionOut(
        id=inspection.id,
        job_id=inspection.job_id,
        machine_id=inspection.machine_id,
        machine_code=m.code if m else "",
        machine_name=m.name if m else "",
        job_status=inspection.job.status.value if inspection.job else "",
        order_ref=inspection.order_ref,
        batch_no=inspection.batch_no,
        roll_id=inspection.roll_id,
        employee_id=inspection.employee_id,
        inspector_name=inspection.inspector_name,
        inspected_at=inspection.inspected_at,
        inspected_qty_meters=inspection.inspected_qty_meters,
        accepted_qty_meters=inspection.accepted_qty_meters,
        defects=inspection.defects or [],
        total_defect_count=inspection.total_defect_count,
        outcome=inspection.outcome,
        remarks=inspection.remarks,
        source=inspection.source,
        created_at=inspection.created_at,
        updated_at=inspection.updated_at,
    )


@router.get("/inspections", response_model=Page[InspectionOut])
def list_inspections(
    search: str | None = None,
    outcome: str | None = Query(None, pattern="^(Approved|Rework|Rejected)$"),
    machine_code: str | None = None,
    employee_id: str | None = None,
    job_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    rows, total = quality_service.list_inspections(
        db,
        search=search,
        outcome=outcome,
        machine_code=machine_code,
        employee_id=employee_id,
        job_id=job_id,
        page=page,
        page_size=page_size,
    )
    return Page[InspectionOut](
        items=[_to_out(insp, machine) for insp, machine in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size if page_size else 0,
    )


@router.get("/inspections/{inspection_id}", response_model=InspectionOut)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = quality_service.get_inspection(db, inspection_id)
    if inspection is None:
        raise HTTPException(404, {"detail": f"Inspection {inspection_id} not found", "code": "INSPECTION_NOT_FOUND"})
    return _to_out(inspection)


@router.post("/inspections", response_model=InspectionOut, status_code=201)
def create_inspection(payload: InspectionCreate, db: Session = Depends(get_db)):
    try:
        inspection = quality_service.create_inspection(db, payload)
    except QualityRuleError as e:
        _raise(e)
    return _to_out(inspection)


@router.patch("/inspections/{inspection_id}", response_model=InspectionOut)
def update_inspection(inspection_id: int, payload: InspectionUpdate, db: Session = Depends(get_db)):
    inspection = quality_service.get_inspection(db, inspection_id)
    if inspection is None:
        raise HTTPException(404, {"detail": f"Inspection {inspection_id} not found", "code": "INSPECTION_NOT_FOUND"})
    try:
        inspection = quality_service.update_disposition(db, inspection, payload)
    except QualityRuleError as e:
        _raise(e)
    return _to_out(inspection)


@router.get("/dashboard", response_model=DashboardBundleOut)
def dashboard(db: Session = Depends(get_db)):
    bundle = quality_service.dashboard_bundle(db)
    return DashboardBundleOut(
        stats=bundle["stats"],
        trend=[TrendPointOut(**t) for t in bundle["trend"]],
        by_type=[DefectTypePointOut(**b) for b in bundle["by_type"]],
        summaries=[MachineSummaryOut(**s) for s in bundle["summaries"]],
        matrix=[MatrixRowOut(**m) for m in bundle["matrix"]],
    )


@router.get("/jobs/{job_id}/roll-preview", response_model=RollPreviewOut)
def roll_preview(job_id: int, db: Session = Depends(get_db)):
    try:
        batch, roll_id, count = quality_service.roll_preview(db, job_id)
    except QualityRuleError as e:
        _raise(e)
    return RollPreviewOut(job_id=job_id, batch_no=batch, roll_id=roll_id, inspection_count=count)


@router.get("/machines/{machine_id}/inspectable-job", response_model=InspectableJobOut | None)
def inspectable_job(machine_id: int, db: Session = Depends(get_db)):
    try:
        job = quality_service.inspectable_job(db, machine_id)
    except QualityRuleError as e:
        _raise(e)
    if job is None:
        return None
    machine = job.machine
    return InspectableJobOut(
        job_id=job.id,
        machine_id=job.machine_id,
        machine_code=machine.code,
        status=job.status.value,
        batch_no=quality_service.batch_no_for_job(job.id),
        order_ref=job.order_ref,
        started_at=job.actual_start or job.created_at,
        planned_qty_meters=job.planned_quantity,
        produced_qty_meters=job.actual_quantity,
    )


@router.get("/inspection-counts", response_model=list[InspectionCountOut])
def inspection_counts(db: Session = Depends(get_db)):
    return [InspectionCountOut(**row) for row in quality_service.inspection_counts(db)]
