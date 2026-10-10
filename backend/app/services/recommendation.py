"""Explainable rule-based machine recommendation engine (NOT trained ML).

Hard eligibility gates run BEFORE scoring. A high score can never override
compatibility, maintenance, capacity, material or scheduling failures.

Scoring (all components normalized 0-100):
    Score = 0.40*Efficiency + 0.35*WorkloadSuitability + 0.25*Quality   (weights configurable)

Missing efficiency/quality data is treated as UNKNOWN → neutral fallback (50) WITH warning.
Never silently perfect.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters import OrderInfo, inventory_adapter, orders_adapter
from app.config import settings
from app.models.machine import Machine, MachineStatus
from app.models.production import ProductionJob, ProductionJobStatus
from app.services.machines import completed_jobs_efficiency_percent, get_active_job
from app.services.production import detect_schedule_conflict
from app.services import allocation_ml, scheduling, quality as quality_service

ACTIVE_STATUSES = (ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED)


@dataclass
class Candidate:
    machine: Machine
    eligible: bool
    exclusion_reasons: list[str] = field(default_factory=list)
    efficiency: float | None = None
    efficiency_known: bool = False
    workload: float = 0.0
    quality: float | None = None
    quality_known: bool = False
    final_score: float | None = None
    estimated_days: float | None = None
    warnings: list[str] = field(default_factory=list)
    schedule: scheduling.ScheduleEstimate | None = None
    ml_selection_probability: float | None = None


def _estimate_days(machine: Machine, quantity: float) -> float:
    if machine.capacity_value <= 0:
        return float("inf")
    return quantity / machine.capacity_value


def _workload_suitability(available_days: float, required_days: float, committed_days: float) -> tuple[float, bool, str | None]:
    """0-100. 50 = exactly enough time; 100 = at least 2x slack.

    Returns (score, ok, exclusion_reason). Inadequate time is a HARD exclusion.
    """
    free = available_days - committed_days
    if free < required_days:
        return 0.0, False, (
            f"Cannot finish on time: needs ~{required_days:.1f} days, only ~{free:.1f} free before deadline"
        )
    ratio = free / required_days if required_days > 0 else 2.0
    score = min(100.0, 50.0 * min(ratio, 2.0))
    return round(score, 2), True, None


def rank_machines(
    db: Session,
    *,
    required_process: str,
    required_material: str,
    required_quantity: float,
    deadline: datetime | None,
    quantity_unit: str = "meters",
) -> tuple[list[Candidate], list[str], bool | None, str]:
    """Core ranking. Returns (candidates sorted by score desc, global_warnings, material_ok, material_note)."""
    warnings: list[str] = []
    process = required_process.strip().upper()
    material = required_material.strip().upper()

    # --- Material availability (hard gate) — Maahi adapter ---
    avail = inventory_adapter.get_availability(material)
    if avail is None:
        material_ok = None
        material_note = f"Material availability for '{material}' UNKNOWN (inventory contract pending) — cannot verify sufficiency"
        warnings.append(material_note)
    elif avail.available < required_quantity:
        material_ok = False
        material_note = (
            f"Insufficient material '{material}': available {avail.available:.0f} {avail.unit} "
            f"< required {required_quantity:.0f} {quantity_unit} (on-hand {avail.on_hand:.0f}, reserved {avail.reserved:.0f}; FIXTURE source)"
        )
    else:
        material_ok = True
        material_note = (
            f"Material '{material}' available: {avail.available:.0f} {avail.unit} >= required {required_quantity:.0f} "
            f"{quantity_unit} (FIXTURE source)"
        )

    if material_ok is False:
        return [], warnings, material_ok, material_note

    now = datetime.now(timezone.utc)
    candidates: list[Candidate] = []
    machines = db.scalars(select(Machine)).all()

    for machine in machines:
        c = Candidate(machine=machine, eligible=True)

        # Hard gate: process compatibility
        if process not in machine.process_list:
            c.eligible = False
            c.exclusion_reasons.append(
                f"Does not support process {process} (supports: {', '.join(machine.process_list) or 'none'})"
            )

        # Hard gate: material compatibility
        if c.eligible and machine.material_list and material not in machine.material_list:
            c.eligible = False
            c.exclusion_reasons.append(
                f"Not compatible with material {material} (handles: {', '.join(machine.material_list)})"
            )

        # Hard gate: maintenance
        if c.eligible and machine.status == MachineStatus.MAINTENANCE:
            c.eligible = False
            c.exclusion_reasons.append("Machine is under MAINTENANCE")

        # Hard gate: capacity sanity
        if c.eligible and machine.capacity_value <= 0:
            c.eligible = False
            c.exclusion_reasons.append("Invalid capacity")

        # Schedule/assignment gates + workload
        committed_days = 0.0
        active = get_active_job(db, machine.id)
        if c.eligible and active is not None and deadline is None:
            c.eligible = False
            c.exclusion_reasons.append(f"Committed to active job #{active.id} and no deadline given to plan around it")
        if c.eligible and active is not None and deadline is not None:
            remaining_q = max(0.0, active.planned_quantity - active.actual_quantity)
            committed_days += _estimate_days(machine, remaining_q)

        if c.eligible and deadline is not None:
            conflict = detect_schedule_conflict(db, machine.id, now, deadline)
            # conflict with PLANNED jobs counts as committed time already via planned windows;
            # an IN_PROGRESS conflict without deadline space is excluded
            if conflict is not None and conflict.status == ProductionJobStatus.IN_PROGRESS and active is not None:
                # committed_days already accounts for the active job remainder
                pass
            available_days = max(0.0, (deadline - now).total_seconds() / 86400.0)
            required_days = _estimate_days(machine, required_quantity)
            c.estimated_days = round(required_days, 2)
            score, ok, reason = _workload_suitability(available_days, required_days, committed_days)
            if not ok:
                c.eligible = False
                c.exclusion_reasons.append(reason or "Insufficient time before deadline")
            else:
                c.workload = score
        elif c.eligible:
            # No deadline: workload based only on whether machine is free
            c.workload = 100.0 if active is None else 40.0
            c.estimated_days = round(_estimate_days(machine, required_quantity), 2)

        if not c.eligible:
            candidates.append(c)
            continue

        # --- Efficiency (documented measure; unknown → neutral + warning) ---
        eff = completed_jobs_efficiency_percent(db, machine.id)
        c.efficiency = eff
        c.efficiency_known = eff is not None
        if eff is None:
            c.efficiency = settings.REC_NEUTRAL_SCORE
            c.warnings.append("No completed-job history — efficiency unknown; neutral fallback applied")

        # --- Quality (persisted inspections; unknown/insufficient -> neutral + warning) ---
        rate, sample_count, q_note = quality_service.machine_quality_summary(db, machine.id)
        c.quality = rate
        c.quality_known = rate is not None
        if rate is None:
            c.quality = settings.REC_NEUTRAL_SCORE
            c.warnings.append(
                f"Insufficient linked inspection history ({q_note}) - quality unknown; "
                "neutral fallback applied"
            )

        c.final_score = round(
            settings.REC_WEIGHT_EFFICIENCY * float(c.efficiency)
            + settings.REC_WEIGHT_WORKLOAD * float(c.workload)
            + settings.REC_WEIGHT_QUALITY * float(c.quality),
            2,
        )

        # --- Scheduling estimate (Phase D): feasible start/completion, idle, deadline ---
        c.schedule = scheduling.compute_schedule(
            db, machine, required_quantity, quantity_unit, process, deadline
        )

        # --- Experimental ML allocation probability (Phase C) — never overrides score/constraints ---
        c.ml_selection_probability = allocation_ml.selection_probability(
            machine,
            process=process,
            quantity_kg=None if quantity_unit.strip().lower() != "kg" else required_quantity,
            schedule=c.schedule,
        )

        candidates.append(c)

    eligible = sorted([c for c in candidates if c.eligible], key=lambda x: x.final_score or 0, reverse=True)
    ineligible = [c for c in candidates if not c.eligible]
    return eligible + ineligible, warnings, material_ok, material_note


def build_explanation(cand: Candidate | None, material_note: str, warnings: list[str]) -> str:
    if cand is None or cand.final_score is None:
        return f"No eligible machine found. {material_note}"
    m = cand.machine
    parts = [
        f"{m.code} ({m.name}) scored {cand.final_score:.1f}/100 "
        f"[efficiency {cand.efficiency:.1f}{'*' if not cand.efficiency_known else ''} × "
        f"{settings.REC_WEIGHT_EFFICIENCY}, workload {cand.workload:.1f} × {settings.REC_WEIGHT_WORKLOAD}, "
        f"quality {cand.quality:.1f}{'*' if not cand.quality_known else ''} × {settings.REC_WEIGHT_QUALITY}].",
        f"It supports process {cand.machine.process_list} with capacity {m.capacity_value} {m.capacity_unit}.",
    ]
    if cand.estimated_days is not None:
        parts.append(f"Estimated processing time ~{cand.estimated_days:.1f} days.")
    if cand.schedule is not None:
        s = cand.schedule
        parts.append(
            f"Schedule: earliest start {s.earliest_start_at.strftime('%Y-%m-%d %H:%M')} UTC, "
            f"processing ~{s.processing_minutes:.0f} min ({s.processing_source}) + setup {s.setup_minutes:.0f} min, "
            f"completion {s.completion_at.strftime('%Y-%m-%d %H:%M')} UTC, "
            f"queue wait ~{s.queue_wait_minutes:.0f} min."
        )
        if s.deadline_feasible is False:
            parts.append(f"Deadline NOT met — estimated lateness ~{s.lateness_minutes:.0f} min.")
        elif s.deadline_feasible:
            parts.append("Deadline feasible.")
    parts.append(material_note)
    if cand.warnings or warnings:
        parts.append("Note: '*' marks metrics with unknown history (neutral fallback, not measured performance).")
    return " ".join(parts)
