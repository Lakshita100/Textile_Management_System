"""Machine business rules: status transitions, availability, efficiency."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.machine import Machine, MachineStatus, MachineStatusEvent
from app.models.production import ProductionJob, ProductionJobStatus

ACTIVE_JOB_STATUSES = (ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED)

# Allowed operational status transitions. Same-status update is rejected.
ALLOWED_STATUS_TRANSITIONS: dict[MachineStatus, set[MachineStatus]] = {
    MachineStatus.RUNNING: {MachineStatus.IDLE, MachineStatus.MAINTENANCE},
    MachineStatus.IDLE: {MachineStatus.RUNNING, MachineStatus.MAINTENANCE},
    MachineStatus.MAINTENANCE: {MachineStatus.IDLE},
}


class MachineRuleError(Exception):
    def __init__(self, message: str, code: str = "MACHINE_RULE_VIOLATION"):
        super().__init__(message)
        self.code = code


def get_machine(db: Session, machine_id: int) -> Machine | None:
    return db.get(Machine, machine_id)


def get_active_job(db: Session, machine_id: int) -> ProductionJob | None:
    return db.scalar(
        select(ProductionJob)
        .where(
            ProductionJob.machine_id == machine_id,
            ProductionJob.status.in_(ACTIVE_JOB_STATUSES),
        )
        .limit(1)
    )


def is_available_for_assignment(db: Session, machine: Machine) -> bool:
    """A machine is assignable iff not under maintenance and has no active job.

    RUNNING does not imply available: a running machine may already be committed.
    """
    if machine.status == MachineStatus.MAINTENANCE:
        return False
    return get_active_job(db, machine.id) is None


def change_machine_status(
    db: Session,
    machine: Machine,
    new_status: MachineStatus,
    reason: str | None = None,
) -> Machine:
    """Validate and apply a status change; record history. Requires maintenance reason."""
    if new_status == machine.status:
        raise MachineRuleError(f"Machine already in status {new_status.value}", "SAME_STATUS")
    if new_status not in ALLOWED_STATUS_TRANSITIONS[machine.status]:
        raise MachineRuleError(
            f"Illegal status transition {machine.status.value} -> {new_status.value}",
            "ILLEGAL_TRANSITION",
        )
    if new_status == MachineStatus.MAINTENANCE and not reason:
        raise MachineRuleError("A reason is required to enter MAINTENANCE", "REASON_REQUIRED")

    # Entering maintenance while a job is active is blocked (job must be paused first).
    active = get_active_job(db, machine.id)
    if new_status == MachineStatus.MAINTENANCE and active is not None:
        raise MachineRuleError(
            f"Machine has active job #{active.id}; pause or complete it before maintenance",
            "ACTIVE_JOB_EXISTS",
        )

    old = machine.status
    machine.status = new_status
    machine.status_reason = reason
    machine.status_changed_at = datetime.now(timezone.utc)
    db.add(
        MachineStatusEvent(
            machine_id=machine.id, from_status=old, to_status=new_status, reason=reason
        )
    )
    db.commit()
    db.refresh(machine)
    return machine


def completed_jobs_efficiency_percent(db: Session, machine_id: int, lookback_days: int = 90) -> float | None:
    """Efficiency = 100 * avg(min(actual/planned, 1.0)) over completed jobs in window.

    Returns None when no completed jobs exist (caller must treat as unknown, never 100).
    """
    since = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    jobs = db.scalars(
        select(ProductionJob).where(
            ProductionJob.machine_id == machine_id,
            ProductionJob.status == ProductionJobStatus.COMPLETED,
            ProductionJob.updated_at >= since,
        )
    ).all()
    if not jobs:
        return None
    ratios = [min(1.0, j.actual_quantity / j.planned_quantity) if j.planned_quantity > 0 else 0.0 for j in jobs]
    return round(100.0 * sum(ratios) / len(ratios), 2)
