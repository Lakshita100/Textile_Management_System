"""Production job lifecycle, validation and conflict prevention."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.models.machine import Machine, MachineStatus
from app.models.production import (
    MachineDowntime,
    ProductionJob,
    ProductionJobStatus,
    ProductionJobStatusEvent,
)
from app.services.machines import MachineRuleError

# Allowed job lifecycle transitions
JOB_TRANSITIONS: dict[ProductionJobStatus, set[ProductionJobStatus]] = {
    ProductionJobStatus.PLANNED: {ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.CANCELLED},
    ProductionJobStatus.IN_PROGRESS: {ProductionJobStatus.PAUSED, ProductionJobStatus.COMPLETED, ProductionJobStatus.CANCELLED},
    ProductionJobStatus.PAUSED: {ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.COMPLETED, ProductionJobStatus.CANCELLED},
    ProductionJobStatus.COMPLETED: set(),
    ProductionJobStatus.CANCELLED: set(),
}


def _overlaps(a_start: datetime | None, a_end: datetime | None, b_start: datetime | None, b_end: datetime | None) -> bool:
    """Half-open interval overlap; unbounded sides count as overlapping."""
    if a_start is None or b_start is None:
        return True  # cannot prove disjoint → treat as conflict (conservative)
    if a_end is not None and b_start is not None and a_end <= b_start:
        return False
    if b_end is not None and a_start is not None and b_end <= a_start:
        return False
    return True


def detect_schedule_conflict(
    db: Session,
    machine_id: int,
    planned_start: datetime | None,
    planned_end: datetime | None,
    exclude_job_id: int | None = None,
) -> ProductionJob | None:
    """Return a conflicting job if the proposed window overlaps an active/planned job."""
    q = select(ProductionJob).where(
        ProductionJob.machine_id == machine_id,
        ProductionJob.status.in_([ProductionJobStatus.PLANNED, ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED]),
    )
    if exclude_job_id is not None:
        q = q.where(ProductionJob.id != exclude_job_id)
    for job in db.scalars(q).all():
        if _overlaps(planned_start, planned_end, job.planned_start, job.planned_end):
            return job
    return None


def create_job(
    db: Session,
    *,
    machine: Machine,
    order_ref: str,
    material_spec: str,
    required_process: str,
    planned_quantity: float,
    quantity_unit: str = "meters",
    shift: str | None = None,
    planned_start: datetime | None = None,
    planned_end: datetime | None = None,
) -> ProductionJob:
    if planned_quantity <= 0:
        raise MachineRuleError("planned_quantity must be positive", "INVALID_QUANTITY")
    if machine.status == MachineStatus.MAINTENANCE:
        raise MachineRuleError("Cannot assign job to machine under MAINTENANCE", "MACHINE_MAINTENANCE")

    # Process compatibility is a hard gate.
    processes = [p.strip().upper() for p in machine.supported_processes.split(",") if p.strip()]
    if processes and required_process.strip().upper() not in processes:
        raise MachineRuleError(
            f"Machine {machine.code} does not support process {required_process}",
            "INCOMPATIBLE_PROCESS",
        )

    # One active (IN_PROGRESS/PAUSED) job per machine.
    active = db.scalar(
        select(ProductionJob).where(
            ProductionJob.machine_id == machine.id,
            ProductionJob.status.in_([ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED]),
        )
    )
    if active is not None:
        raise MachineRuleError(
            f"Machine {machine.code} already has active job #{active.id}", "DUPLICATE_ACTIVE_ASSIGNMENT"
        )

    conflict = detect_schedule_conflict(db, machine.id, planned_start, planned_end)
    if conflict is not None:
        raise MachineRuleError(
            f"Proposed schedule overlaps job #{conflict.id} on machine {machine.code}", "SCHEDULE_CONFLICT"
        )

    job = ProductionJob(
        machine_id=machine.id,
        order_ref=order_ref,
        material_spec=material_spec,
        required_process=required_process,
        planned_quantity=planned_quantity,
        actual_quantity=0.0,
        quantity_unit=quantity_unit,
        shift=shift,
        status=ProductionJobStatus.PLANNED,
        planned_start=planned_start,
        planned_end=planned_end,
    )
    db.add(job)
    db.flush()
    db.add(ProductionJobStatusEvent(job_id=job.id, from_status=None, to_status=ProductionJobStatus.PLANNED, note="Job created"))
    db.commit()
    db.refresh(job)
    return job


def transition_job(
    db: Session,
    job: ProductionJob,
    target: ProductionJobStatus,
    note: str | None = None,
) -> ProductionJob:
    allowed = JOB_TRANSITIONS[job.status]
    if target not in allowed:
        raise MachineRuleError(
            f"Illegal job transition {job.status.value} -> {target.value}", "ILLEGAL_TRANSITION"
        )
    now = datetime.now(timezone.utc)

    if target == ProductionJobStatus.IN_PROGRESS:
        machine = db.get(Machine, job.machine_id)
        if machine is not None and machine.status == MachineStatus.MAINTENANCE:
            raise MachineRuleError("Machine is under maintenance; cannot start job", "MACHINE_MAINTENANCE")
        if job.status == ProductionJobStatus.PLANNED:
            job.actual_start = now
        conflict = detect_schedule_conflict(db, job.machine_id, job.planned_start, job.planned_end, exclude_job_id=job.id)
        if conflict is not None and conflict.status == ProductionJobStatus.IN_PROGRESS:
            raise MachineRuleError(
                f"Machine has another in-progress job #{conflict.id}", "SCHEDULE_CONFLICT"
            )
    elif target == ProductionJobStatus.COMPLETED:
        if job.actual_quantity <= 0:
            raise MachineRuleError("Cannot complete a job with zero actual output", "NO_OUTPUT")
        job.actual_end = now

    old = job.status
    job.status = target
    db.add(ProductionJobStatusEvent(job_id=job.id, from_status=old, to_status=target, note=note))
    db.commit()
    db.refresh(job)
    return job


def update_progress(
    db: Session,
    job: ProductionJob,
    actual_quantity: float,
) -> ProductionJob:
    if actual_quantity < 0:
        raise MachineRuleError("actual_quantity cannot be negative", "NEGATIVE_QUANTITY")
    if job.status in (ProductionJobStatus.COMPLETED, ProductionJobStatus.CANCELLED):
        raise MachineRuleError(f"Cannot update progress on {job.status.value} job", "JOB_CLOSED")
    if actual_quantity > job.planned_quantity:
        raise MachineRuleError(
            f"actual_quantity {actual_quantity} exceeds planned {job.planned_quantity}; overproduction not permitted",
            "OVERPRODUCTION",
        )
    job.actual_quantity = actual_quantity
    db.commit()
    db.refresh(job)
    return job


def record_downtime(
    db: Session,
    *,
    machine_id: int,
    reason: str,
    started_at: datetime,
    ended_at: datetime | None = None,
    job_id: int | None = None,
) -> MachineDowntime:
    event = MachineDowntime(
        machine_id=machine_id, job_id=job_id, reason=reason, started_at=started_at, ended_at=ended_at
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
