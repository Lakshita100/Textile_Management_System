"""Analytics over persisted production data. Every metric has a documented definition.

- planned_quantity / actual_quantity: sums over jobs in the filtered window.
- completion_percent = 100 * sum(actual) / sum(planned) (0 when planned sum is 0).
- efficiency_percent: for COMPLETED jobs, 100 * avg(min(actual/planned, 1)); None if none completed.
- utilization_percent: productive minutes (job actual_start..actual_end or downtime-adjusted span)
  divided by scheduled minutes (planned_start..planned_end); None when planned window missing.
- downtime_minutes: sum of recorded downtime durations (closed events) for the machine/window.
- defect_rate_percent: only from real quality data when available; None otherwise (never fabricated).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.models.production import MachineDowntime, ProductionJob, ProductionJobStatus


def _job_window_filter(q, date_from: datetime | None, date_to: datetime | None):
    if date_from is not None:
        q = q.where(ProductionJob.created_at >= date_from)
    if date_to is not None:
        q = q.where(ProductionJob.created_at <= date_to)
    return q


def machine_analytics(
    db: Session,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    machine_id: int | None = None,
) -> list[dict]:
    machines = db.scalars(
        select(Machine).where(Machine.id == machine_id) if machine_id else select(Machine)
    ).all()

    results = []
    for machine in machines:
        q = _job_window_filter(
            select(ProductionJob).where(ProductionJob.machine_id == machine.id),
            date_from,
            date_to,
        )
        jobs = db.scalars(q).all()
        planned = sum(j.planned_quantity for j in jobs)
        actual = sum(j.actual_quantity for j in jobs)
        completed = [j for j in jobs if j.status == ProductionJobStatus.COMPLETED]
        completion = round(100.0 * actual / planned, 2) if planned > 0 else 0.0
        efficiency = (
            round(100.0 * sum(min(1.0, j.actual_quantity / j.planned_quantity) for j in completed) / len(completed), 2)
            if completed
            else None
        )

        # Utilization: productive span vs planned span (only for jobs with both windows)
        util_num = util_den = 0.0
        for j in jobs:
            if j.planned_start and j.planned_end and j.actual_start:
                planned_span = max(0.0, (j.planned_end - j.planned_start).total_seconds())
                end = j.actual_end or j.actual_start
                productive = max(0.0, (end - j.actual_start).total_seconds())
                util_den += planned_span
                util_num += min(productive, planned_span) if planned_span else productive
        utilization = round(100.0 * util_num / util_den, 2) if util_den > 0 else None

        dq = select(MachineDowntime).where(MachineDowntime.machine_id == machine.id)
        if date_from:
            dq = dq.where(MachineDowntime.started_at >= date_from)
        if date_to:
            dq = dq.where(MachineDowntime.started_at <= date_to)
        downtimes = db.scalars(dq).all()
        reasons: dict[str, float] = {}
        total_dt = 0.0
        for d in downtimes:
            dur = d.duration_minutes or 0.0
            total_dt += dur
            reasons[d.reason] = round(reasons.get(d.reason, 0.0) + dur, 2)

        results.append(
            {
                "machine_id": machine.id,
                "machine_code": machine.code,
                "machine_name": machine.name,
                "planned_quantity": planned,
                "actual_quantity": actual,
                "completion_percent": completion,
                "job_count": len(jobs),
                "completed_jobs": len(completed),
                "efficiency_percent": efficiency,
                "utilization_percent": utilization,
                "downtime_minutes": round(total_dt, 2),
                "downtime_reasons": reasons,
                "defect_rate_percent": None,
                "defect_note": "Quality history unavailable (Anand's contract pending) — not fabricated",
            }
        )
    return results
