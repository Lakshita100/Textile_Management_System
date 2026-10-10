from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.machine import Machine
from app.models.production import (
    MachineDowntime,
    ProductionJob,
    ProductionJobStatus,
)
from app.schemas.common import Page
from app.schemas.production import (
    DashboardOut,
    DowntimeCreate,
    DowntimeOut,
    JobCreate,
    JobDetailOut,
    JobOut,
    JobProgressUpdate,
    JobStatusUpdate,
)
from app.services import machines as machine_service
from app.services import production as production_service
from app.services.machines import MachineRuleError

router = APIRouter(prefix="/production", tags=["production"])


def _get_job(db: Session, job_id: int) -> ProductionJob:
    job = db.get(ProductionJob, job_id)
    if job is None:
        raise HTTPException(404, f"Job {job_id} not found")
    return job


def _get_machine(db: Session, machine_id: int) -> Machine:
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise HTTPException(404, f"Machine {machine_id} not found")
    return machine


@router.get("/jobs", response_model=Page[JobOut])
def list_jobs(
    machine_id: int | None = None,
    status: ProductionJobStatus | None = None,
    order_ref: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = select(ProductionJob)
    if machine_id:
        q = q.where(ProductionJob.machine_id == machine_id)
    if status:
        q = q.where(ProductionJob.status == status)
    if order_ref:
        q = q.where(ProductionJob.order_ref == order_ref)
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    pages = max(1, (total + page_size - 1) // page_size)
    items = db.scalars(q.order_by(ProductionJob.id.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return Page[JobOut](items=[JobOut.model_validate(j) for j in items], total=total, page=page, page_size=page_size, pages=pages)


@router.post("/jobs", response_model=JobOut, status_code=201)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    machine = _get_machine(db, payload.machine_id)
    try:
        job = production_service.create_job(
            db,
            machine=machine,
            order_ref=payload.order_ref,
            material_spec=payload.material_spec,
            required_process=payload.required_process,
            planned_quantity=payload.planned_quantity,
            quantity_unit=payload.quantity_unit,
            shift=payload.shift,
            planned_start=payload.planned_start,
            planned_end=payload.planned_end,
        )
        return JobOut.model_validate(job)
    except MachineRuleError as e:
        code = e.code
        status = 409 if code in ("DUPLICATE_ACTIVE_ASSIGNMENT", "SCHEDULE_CONFLICT", "MACHINE_MAINTENANCE", "INCOMPATIBLE_PROCESS") else 422
        raise HTTPException(status, {"detail": str(e), "code": code})


@router.get("/jobs/{job_id}", response_model=JobDetailOut)
def job_detail(job_id: int, db: Session = Depends(get_db)):
    job = _get_job(db, job_id)
    return JobDetailOut.model_validate(job)


@router.post("/jobs/{job_id}/start", response_model=JobOut)
def start_job(job_id: int, payload: JobStatusUpdate | None = None, db: Session = Depends(get_db)):
    job = _get_job(db, job_id)
    try:
        return JobOut.model_validate(
            production_service.transition_job(db, job, ProductionJobStatus.IN_PROGRESS, payload.note if payload else None)
        )
    except MachineRuleError as e:
        raise HTTPException(409, {"detail": str(e), "code": e.code})


@router.post("/jobs/{job_id}/pause", response_model=JobOut)
def pause_job(job_id: int, payload: JobStatusUpdate | None = None, db: Session = Depends(get_db)):
    job = _get_job(db, job_id)
    try:
        return JobOut.model_validate(
            production_service.transition_job(db, job, ProductionJobStatus.PAUSED, payload.note if payload else None)
        )
    except MachineRuleError as e:
        raise HTTPException(409, {"detail": str(e), "code": e.code})


@router.post("/jobs/{job_id}/resume", response_model=JobOut)
def resume_job(job_id: int, payload: JobStatusUpdate | None = None, db: Session = Depends(get_db)):
    job = _get_job(db, job_id)
    try:
        return JobOut.model_validate(
            production_service.transition_job(db, job, ProductionJobStatus.IN_PROGRESS, payload.note if payload else None)
        )
    except MachineRuleError as e:
        raise HTTPException(409, {"detail": str(e), "code": e.code})


@router.post("/jobs/{job_id}/complete", response_model=JobOut)
def complete_job(job_id: int, payload: JobStatusUpdate | None = None, db: Session = Depends(get_db)):
    job = _get_job(db, job_id)
    try:
        return JobOut.model_validate(
            production_service.transition_job(db, job, ProductionJobStatus.COMPLETED, payload.note if payload else None)
        )
    except MachineRuleError as e:
        raise HTTPException(409, {"detail": str(e), "code": e.code})


@router.post("/jobs/{job_id}/cancel", response_model=JobOut)
def cancel_job(job_id: int, payload: JobStatusUpdate | None = None, db: Session = Depends(get_db)):
    job = _get_job(db, job_id)
    try:
        return JobOut.model_validate(
            production_service.transition_job(db, job, ProductionJobStatus.CANCELLED, payload.note if payload else None)
        )
    except MachineRuleError as e:
        raise HTTPException(409, {"detail": str(e), "code": e.code})


@router.patch("/jobs/{job_id}/progress", response_model=JobOut)
def update_progress(job_id: int, payload: JobProgressUpdate, db: Session = Depends(get_db)):
    job = _get_job(db, job_id)
    try:
        return JobOut.model_validate(production_service.update_progress(db, job, payload.actual_quantity))
    except MachineRuleError as e:
        raise HTTPException(422, {"detail": str(e), "code": e.code})


@router.post("/downtime", response_model=DowntimeOut, status_code=201)
def create_downtime(payload: DowntimeCreate, db: Session = Depends(get_db)):
    _get_machine(db, payload.machine_id)
    if payload.job_id:
        _get_job(db, payload.job_id)
    return DowntimeOut.model_validate(
        production_service.record_downtime(
            db,
            machine_id=payload.machine_id,
            reason=payload.reason,
            started_at=payload.started_at,
            ended_at=payload.ended_at,
            job_id=payload.job_id,
        )
    )


@router.get("/downtime", response_model=list[DowntimeOut])
def list_downtime(machine_id: int | None = None, db: Session = Depends(get_db)):
    q = select(MachineDowntime)
    if machine_id:
        q = q.where(MachineDowntime.machine_id == machine_id)
    return [DowntimeOut.model_validate(d) for d in db.scalars(q.order_by(MachineDowntime.started_at.desc())).all()]


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    from app.models.machine import MachineStatus

    total = db.scalar(select(func.count()).select_from(Machine)) or 0
    running = db.scalar(select(func.count()).select_from(Machine).where(Machine.status == MachineStatus.RUNNING)) or 0
    idle = db.scalar(select(func.count()).select_from(Machine).where(Machine.status == MachineStatus.IDLE)) or 0
    maint = db.scalar(select(func.count()).select_from(Machine).where(Machine.status == MachineStatus.MAINTENANCE)) or 0
    active = db.scalar(
        select(func.count()).select_from(ProductionJob).where(
            ProductionJob.status.in_([ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED])
        )
    ) or 0
    completed = db.scalar(
        select(func.count()).select_from(ProductionJob).where(ProductionJob.status == ProductionJobStatus.COMPLETED)
    ) or 0
    now = datetime.now(timezone.utc)
    delayed = db.scalar(
        select(func.count()).select_from(ProductionJob).where(
            ProductionJob.status.in_([ProductionJobStatus.PLANNED, ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED]),
            ProductionJob.planned_end.isnot(None),
            ProductionJob.planned_end < now,
            ProductionJob.status != ProductionJobStatus.COMPLETED,
        )
    ) or 0
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    output_today = db.scalar(
        select(func.coalesce(func.sum(ProductionJob.actual_quantity), 0.0)).where(
            ProductionJob.updated_at >= today_start,
            ProductionJob.status.in_([ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.COMPLETED]),
        )
    ) or 0.0
    return DashboardOut(
        total_machines=total, running=running, idle=idle, maintenance=maint,
        active_jobs=active, completed_jobs=completed, delayed_jobs=delayed, output_today=float(output_today),
    )
