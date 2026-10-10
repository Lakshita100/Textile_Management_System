"""Scheduling engine: feasible start/completion estimates for machine candidates.

Documented definitions (kept distinct on purpose):
- processing duration: ML/rule estimate for the work itself.
- setup/changeover: prep time before processing (documented default; machine
  model has no setup column yet — assumption surfaced in output).
- queue waiting time: delay from "now" until earliest feasible start because
  the machine is busy (active job remainder, committed planned windows).
- downtime: recorded past downtime; FUTURE downtime is unknown and excluded.
- machine busy interval: now → busy_until (existing committed work).
- idle interval: gap between this job's completion and the machine's NEXT
  committed planned start, only observable within the planning horizon.
- expected next available time: completion of this job (setup + processing).

Assumptions (surfaced in every response):
- planning horizon = settings.REC_PLANNING_HORIZON_DAYS (default 14 days).
- future order arrivals and future maintenance are unknown; idle time beyond
  committed schedule is not predictable and reported as null with a warning.
- durations from the ML model are trained on SYNTHETIC data — prototypes only.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.machine import Machine
from app.models.production import MachineDowntime, ProductionJob, ProductionJobStatus
from app.services import duration as duration_service
from app.services.machines import get_active_job

ACTIVE_STATUSES = (ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime | None) -> datetime | None:
    """SQLite returns naive datetimes; normalize to UTC for safe comparison."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@dataclass
class ScheduleEstimate:
    setup_minutes: float
    processing_minutes: float
    processing_source: str
    queue_wait_minutes: float
    earliest_start_at: datetime
    completion_at: datetime
    next_available_at: datetime
    idle_after_minutes: float | None
    deadline_feasible: bool | None
    lateness_minutes: float | None
    assumptions: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "setup_minutes": self.setup_minutes,
            "processing_minutes": self.processing_minutes,
            "processing_source": self.processing_source,
            "queue_wait_minutes": round(self.queue_wait_minutes, 1),
            "earliest_start_at": self.earliest_start_at.isoformat(),
            "completion_at": self.completion_at.isoformat(),
            "next_available_at": self.next_available_at.isoformat(),
            "idle_after_minutes": self.idle_after_minutes,
            "deadline_feasible": self.deadline_feasible,
            "lateness_minutes": self.lateness_minutes,
            "assumptions": self.assumptions,
            "warnings": self.warnings,
        }


def kg_equivalent(quantity: float, unit: str, gsm: float | None, width_cm: float | None,
                  warnings: list[str]) -> float | None:
    """Convert quantity to kg for the ML feature row. None if not convertible."""
    u = (unit or "").strip().lower()
    if u == "kg":
        return quantity
    if u in ("meters", "metres", "m") and gsm and width_cm:
        kg = gsm * (width_cm / 100.0) * quantity / 1000.0
        warnings.append(
            f"Quantity converted to kg for duration model via gsm×width×length ({kg:.1f} kg) — synthetic-model input"
        )
        return round(kg, 2)
    return None


def estimate_processing(
    machine: Machine,
    quantity: float,
    unit: str,
    process: str,
    *,
    queue_wait_minutes: float = 0.0,
    gsm: float | None = None,
    width_cm: float | None = None,
    fabric_type: str | None = None,
    fiber: str | None = None,
    color: str | None = None,
    priority: str = "NORMAL",
) -> duration_service.DurationEstimate:
    """Build a feature row (unknowns → training defaults) and predict, or fall back."""
    warnings: list[str] = []
    kg = kg_equivalent(quantity, unit, gsm, width_cm, warnings)
    if kg is None:
        note = (
            f"Duration model is trained on kg-based synthetic data; quantity unit '{unit}' without gsm/width "
            "is not convertible — using capacity-rate rule instead"
        )
        return duration_service.rule_capacity_minutes(quantity, machine.capacity_value, note)

    try:
        _, meta = duration_service.load_model()
    except duration_service.ModelUnavailableError:
        note = "Duration model artifact missing — using capacity-rate rule"
        return duration_service.rule_capacity_minutes(quantity, machine.capacity_value, note)

    defaults = meta.get("feature_defaults", {})
    features: dict = {
        "machine_id": f"DB-{machine.id}",
        "machine_type": str(machine.machine_type).upper(),
        "process_type": (process or "").strip().upper(),
        "fabric_type": (fabric_type or defaults.get("fabric_type", "UNKNOWN")),
        "fiber_composition": (fiber or defaults.get("fiber_composition", "UNKNOWN")),
        "color_family": (color or defaults.get("color_family", "UNKNOWN")),
        "gsm": float(gsm) if gsm else float(defaults.get("gsm", 200.0)),
        "fabric_width_cm": float(width_cm) if width_cm else float(defaults.get("fabric_width_cm", 150.0)),
        "batch_quantity_kg": kg,
        "priority": priority,
        "machine_capacity_kg_per_batch": float(defaults.get("machine_capacity_kg_per_batch", 500.0)),
        "machine_nominal_rate_kg_per_hour": float(defaults.get("machine_nominal_rate_kg_per_hour", 60.0)),
        "machine_efficiency_pct": float(defaults.get("machine_efficiency_pct", 85.0)),
        "machine_availability_pct": float(defaults.get("machine_availability_pct", 90.0)),
        "setup_base_minutes": float(defaults.get("setup_base_minutes", 20.0)),
        "estimated_queue_wait_minutes": float(queue_wait_minutes),
    }
    try:
        est = duration_service.predict_processing_minutes(features)
    except (duration_service.ModelUnavailableError, duration_service.InvalidFeaturesError) as e:
        return duration_service.rule_capacity_minutes(
            quantity, machine.capacity_value, f"Duration prediction failed ({e}) — using capacity-rate rule"
        )
    est.warnings = list(est.warnings)
    if not fabric_type or not gsm:
        est.warnings.append(
            "Fabric spec (gsm/fabric) unavailable — training defaults used for duration features"
        )
    if "DB-" in str(features["machine_id"]):
        est.warnings.append(
            "Machine not in training data — model relies on process/type defaults (dataset machines only)"
        )
    est.warnings.extend(warnings)
    return est


def machine_busy_intervals(db: Session, machine: Machine, now: datetime,
                           horizon_end: datetime) -> tuple[list[dict], list[str]]:
    """Committed busy intervals within [now, horizon_end] + warnings."""
    intervals: list[dict] = []
    warnings: list[str] = []

    active = get_active_job(db, machine.id)
    if active is not None:
        remaining = max(0.0, active.planned_quantity - active.actual_quantity)
        est = estimate_processing(machine, remaining, active.quantity_unit, active.required_process)
        end = now + timedelta(minutes=est.minutes + settings.REC_SETUP_DEFAULT_MINUTES)
        intervals.append({
            "kind": "active_job",
            "job_id": active.id,
            "order_ref": active.order_ref,
            "start": now.isoformat(),
            "end": end.isoformat(),
            "minutes": round((end - now).total_seconds() / 60.0, 1),
        })

    planned = db.scalars(
        select(ProductionJob).where(
            ProductionJob.machine_id == machine.id,
            ProductionJob.status == ProductionJobStatus.PLANNED,
        )
    ).all()
    for job in planned:
        start = _aware(job.planned_start) or now
        end = _aware(job.planned_end)
        if end is None:
            # No end window → cannot prove disjoint (matches conflict-detection
            # policy) → assume committed through the horizon and say so loudly.
            end = horizon_end
            warnings.append(
                f"Planned job #{job.id} ('{job.order_ref}') has no time window — "
                "assumed committed from now through the horizon; give it a planned "
                "window (or cancel it) to unblock scheduling"
            )
        if end < now:
            continue
        if start > horizon_end:
            warnings.append(
                f"Planned job #{job.id} starts beyond planning horizon — excluded from schedule"
            )
            continue
        intervals.append({
            "kind": "planned_job",
            "job_id": job.id,
            "order_ref": job.order_ref,
            "start": max(start, now).isoformat(),
            "end": end.isoformat(),
            "minutes": round((end - max(start, now)).total_seconds() / 60.0, 1),
        })

    open_down = db.scalars(
        select(MachineDowntime).where(
            MachineDowntime.machine_id == machine.id,
            MachineDowntime.ended_at.is_(None),
        )
    ).all()
    if open_down:
        warnings.append(
            f"{len(open_down)} open downtime event(s) — end time unknown; excluded from busy intervals "
            "(assumed resolved; verify before committing)"
        )
    return intervals, warnings


def compute_schedule(
    db: Session,
    machine: Machine,
    quantity: float,
    unit: str,
    process: str,
    deadline: datetime | None = None,
    **estimate_kwargs,
) -> ScheduleEstimate:
    now = utcnow()
    horizon_end = now + timedelta(days=settings.REC_PLANNING_HORIZON_DAYS)
    assumptions = [
        f"Planning horizon: {settings.REC_PLANNING_HORIZON_DAYS} days.",
        f"Setup/changeover assumed {settings.REC_SETUP_DEFAULT_MINUTES} min (machine model has no setup column).",
        "Future order arrivals and future maintenance are unknown — idle time is only computed "
        "against currently committed schedules within the horizon.",
        "Durations may come from an ML model trained on SYNTHETIC data — prototyping only.",
    ]
    warnings: list[str] = []

    intervals, iv_warnings = machine_busy_intervals(db, machine, now, horizon_end)
    warnings.extend(iv_warnings)

    # Only intervals covering `now` delay the earliest start; future committed
    # windows do not block a job that can start today (they are checked below).
    busy_until = now
    for iv in intervals:
        iv_start = datetime.fromisoformat(iv["start"])
        iv_end = datetime.fromisoformat(iv["end"])
        if iv_start <= now < iv_end and iv_end > busy_until:
            busy_until = iv_end
    if busy_until > horizon_end:
        warnings.append("Machine committed beyond planning horizon — start time outside horizon")

    queue_wait = max(0.0, (busy_until - now).total_seconds() / 60.0)
    est = estimate_processing(
        machine, quantity, unit, process, queue_wait_minutes=queue_wait, **estimate_kwargs
    )
    warnings.extend(est.warnings)

    setup = settings.REC_SETUP_DEFAULT_MINUTES
    earliest_start = busy_until
    completion = earliest_start + timedelta(minutes=setup + est.minutes)

    # Idle gap to the next committed planned start after completion (within horizon)
    idle_after: float | None = None
    next_starts = [
        datetime.fromisoformat(iv["start"])
        for iv in intervals
        if iv["kind"] == "planned_job"
        and datetime.fromisoformat(iv["start"]) >= completion
    ]
    if next_starts:
        nxt = min(next_starts)
        idle_after = round((nxt - completion).total_seconds() / 60.0, 1)
        assumptions.append(
            "Idle interval = gap to the next COMMITTED planned job start (queue beyond that job is unknown)."
        )
    else:
        warnings.append(
            "No committed job after this one within the horizon — idle_after_job_minutes not predictable"
        )

    deadline_feasible: bool | None = None
    lateness: float | None = None
    if deadline is not None:
        if completion <= deadline:
            deadline_feasible = True
            lateness = 0.0
        else:
            deadline_feasible = False
            lateness = round((completion - deadline).total_seconds() / 60.0, 1)
        if completion > horizon_end:
            warnings.append("Expected completion lies beyond the planning horizon")

    if completion > horizon_end:
        warnings.append("Expected completion lies beyond the planning horizon")

    # Honest warning when the estimate collides with an already-committed window.
    for iv in intervals:
        iv_start = datetime.fromisoformat(iv["start"])
        iv_end = datetime.fromisoformat(iv["end"])
        if earliest_start < iv_end and iv_start < completion:
            warnings.append(
                f"Estimated window overlaps committed {iv['kind']} '{iv.get('order_ref')}' — "
                "revalidate before approval"
            )

    return ScheduleEstimate(
        setup_minutes=float(setup),
        processing_minutes=est.minutes,
        processing_source=est.source,
        queue_wait_minutes=queue_wait,
        earliest_start_at=earliest_start,
        completion_at=completion,
        next_available_at=completion,
        idle_after_minutes=idle_after,
        deadline_feasible=deadline_feasible,
        lateness_minutes=lateness,
        assumptions=assumptions,
        warnings=warnings,
    )
