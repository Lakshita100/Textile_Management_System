from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, exists, func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.auth import require_permission
from app.models.machine import Machine, MachineStatus, MachineStatusEvent
from app.models.production import ProductionJob, ProductionJobStatus
from app.schemas.common import Page
from app.schemas.machine import (
    CurrentAssignmentOut,
    MachineCreate,
    MachineDetailOut,
    MachineListOut,
    MachineOut,
    MachineStatusChange,
    MachineStatusEventOut,
    MachineUpdate,
)
from app.services import machines as machine_service
from app.services.machines import MachineRuleError

router = APIRouter(prefix="/machines", tags=["machines"], dependencies=[Depends(require_permission("machines"))])


def _assignment_out(job: ProductionJob) -> CurrentAssignmentOut:
    return CurrentAssignmentOut(
        job_id=job.id,
        order_ref=job.order_ref,
        material_spec=job.material_spec,
        required_process=job.required_process,
        planned_quantity=job.planned_quantity,
        actual_quantity=job.actual_quantity,
        quantity_unit=job.quantity_unit,
        status=job.status.value,
        completion_percent=job.completion_percent,
        planned_start=job.planned_start,
        planned_end=job.planned_end,
    )


@router.get("", response_model=Page[MachineListOut])
def list_machines(
    search: str | None = None,
    status: MachineStatus | None = None,
    process: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = select(Machine)
    running_job_exists = exists(
        select(ProductionJob.id).where(
            ProductionJob.machine_id == Machine.id,
            ProductionJob.status == ProductionJobStatus.IN_PROGRESS,
        )
    )
    effective_status = case(
        (Machine.status == MachineStatus.MAINTENANCE, MachineStatus.MAINTENANCE.value),
        (running_job_exists, MachineStatus.RUNNING.value),
        else_=MachineStatus.IDLE.value,
    )
    if search:
        like = f"%{search.strip()}%"
        q = q.where((Machine.code.ilike(like)) | (Machine.name.ilike(like)))
    if status:
        q = q.where(effective_status == status.value)
    if process:
        q = q.where(Machine.supported_processes.ilike(f"%{process.strip().upper()}%"))

    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    pages = max(1, (total + page_size - 1) // page_size)
    rows = db.scalars(q.order_by(Machine.id).offset((page - 1) * page_size).limit(page_size)).all()

    # Fetch page-wide assignment and efficiency data in batches. The previous
    # per-machine service calls caused 3 queries per machine (300+ round trips
    # for a 100-machine page), which is especially slow with remote Supabase DBs.
    machine_ids = [m.id for m in rows]
    active_jobs: dict[int, ProductionJob] = {}
    efficiencies: dict[int, list[float]] = {}
    if machine_ids:
        for job in db.scalars(
            select(ProductionJob)
            .where(
                ProductionJob.machine_id.in_(machine_ids),
                ProductionJob.status.in_([ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED]),
            )
            .order_by(ProductionJob.created_at.desc())
        ).all():
            active_jobs.setdefault(job.machine_id, job)

        since = datetime.now(timezone.utc) - timedelta(days=90)
        completed_jobs = db.scalars(
            select(ProductionJob).where(
                ProductionJob.machine_id.in_(machine_ids),
                ProductionJob.status == ProductionJobStatus.COMPLETED,
                ProductionJob.updated_at >= since,
            )
        ).all()
        for job in completed_jobs:
            ratio = min(1.0, job.actual_quantity / job.planned_quantity) if job.planned_quantity > 0 else 0.0
            efficiencies.setdefault(job.machine_id, []).append(ratio)

    items = []
    for m in rows:
        active = active_jobs.get(m.id)
        ratios = efficiencies.get(m.id, [])
        efficiency = round(100.0 * sum(ratios) / len(ratios), 2) if ratios else None
        items.append(
            MachineListOut(
                id=m.id,
                code=m.code,
                name=m.name,
                machine_type=m.machine_type,
                supported_processes=m.supported_processes,
                capacity_value=m.capacity_value,
                capacity_unit=m.capacity_unit,
                status=MachineStatus.MAINTENANCE if m.status == MachineStatus.MAINTENANCE else (
                    MachineStatus.RUNNING if active is not None and active.status == ProductionJobStatus.IN_PROGRESS
                    else MachineStatus.IDLE
                ),
                current_assignment=_assignment_out(active) if active else None,
                available_for_assignment=m.status != MachineStatus.MAINTENANCE and active is None,
                efficiency_percent=efficiency,
            )
        )
    return Page[MachineListOut](items=items, total=total, page=page, page_size=page_size, pages=pages)


@router.post("", response_model=MachineOut, status_code=201)
def create_machine(payload: MachineCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(Machine).where(Machine.code == payload.code))
    if exists:
        raise HTTPException(409, f"Machine code '{payload.code}' already exists")
    machine = Machine(**payload.model_dump())
    db.add(machine)
    db.flush()
    db.add(
        MachineStatusEvent(
            machine_id=machine.id, from_status=None, to_status=machine.status, reason="Machine created"
        )
    )
    db.commit()
    db.refresh(machine)
    return machine


@router.get("/{machine_id}", response_model=MachineDetailOut)
def machine_detail(machine_id: int, db: Session = Depends(get_db)):
    m = machine_service.get_machine(db, machine_id)
    if m is None:
        raise HTTPException(404, f"Machine {machine_id} not found")
    active = machine_service.get_active_job(db, m.id)
    eff = machine_service.completed_jobs_efficiency_percent(db, m.id)
    base = MachineOut.model_validate(m)
    if m.status != MachineStatus.MAINTENANCE:
        base.status = MachineStatus.RUNNING if active and active.status == ProductionJobStatus.IN_PROGRESS else MachineStatus.IDLE
    return MachineDetailOut(
        **base.model_dump(),
        current_assignment=_assignment_out(active) if active else None,
        available_for_assignment=machine_service.is_available_for_assignment(db, m),
    )


@router.patch("/{machine_id}", response_model=MachineOut)
def update_machine(machine_id: int, payload: MachineUpdate, db: Session = Depends(get_db)):
    m = machine_service.get_machine(db, machine_id)
    if m is None:
        raise HTTPException(404, f"Machine {machine_id} not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m


@router.patch("/{machine_id}/status", response_model=MachineOut)
def change_status(machine_id: int, payload: MachineStatusChange, db: Session = Depends(get_db)):
    m = machine_service.get_machine(db, machine_id)
    if m is None:
        raise HTTPException(404, f"Machine {machine_id} not found")
    # Serialize with job creation / recommendation approval for this machine:
    # a status change (e.g. into MAINTENANCE) must not land between an
    # approval's locked revalidation and its commit. Transaction-scoped
    # advisory lock, held until change_machine_status commits; no-op on SQLite.
    from app.services.production import lock_machine

    lock_machine(db, m.id)
    db.refresh(m)
    try:
        return machine_service.change_machine_status(db, m, payload.status, payload.reason)
    except MachineRuleError as e:
        status = 409 if e.code in ("ILLEGAL_TRANSITION", "ACTIVE_JOB_EXISTS", "SAME_STATUS") else 422
        raise HTTPException(status, {"detail": str(e), "code": e.code})


@router.get("/{machine_id}/status-events", response_model=list[MachineStatusEventOut])
def status_history(machine_id: int, db: Session = Depends(get_db)):
    if machine_service.get_machine(db, machine_id) is None:
        raise HTTPException(404, f"Machine {machine_id} not found")
    return db.scalars(
        select(MachineStatusEvent)
        .where(MachineStatusEvent.machine_id == machine_id)
        .order_by(MachineStatusEvent.created_at.desc())
    ).all()
