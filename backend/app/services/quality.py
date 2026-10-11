"""Quality inspection persistence and derived metrics (Feature 03 integration).

Business rules (Anand's contract, enforced here):
- One inspection links to exactly one production job; machine/order/batch are
  derived from the job (cross-checked if the client also supplies them).
- Completion of production does NOT imply quality approval, and quality failure
  never cancels or mutates production jobs (no writes to production tables here).
- Eligible jobs: IN_PROGRESS / PAUSED / COMPLETED with actual output > 0.
- accepted = max(0, inspected - total_defect_count) (defect metres held);
  auto outcome = 'Approved' when total_defect_count == 0, else 'Rework';
  'Rejected' only via explicit disposition update.
- Measurement fields are immutable after creation (prevents double counting).
- Machine quality for scheduling/analytics comes only from persisted rows:
  missing/insufficient history -> None + explanatory note (never fabricated,
  never a perfect score; callers use the neutral fallback with a warning).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.machine import Machine
from app.models.fulfillment import PackingLot
from app.models.order import BuyerOrder
from app.models.production import MachineDowntime, ProductionJob, ProductionJobStatus
from app.models.quality import InspectionOutcome, QualityInspection
from app.schemas.quality import InspectionCreate, InspectionUpdate

INSPECTABLE_STATUSES = {
    ProductionJobStatus.IN_PROGRESS,
    ProductionJobStatus.PAUSED,
    ProductionJobStatus.COMPLETED,
}

# Anand's demo flag rule (documented, not a validated factory parameter).
FLAG_RULE = {"defect_rate_per_100m": 0.5, "pass_rate_pct": 80}

DEFECT_TYPES = [
    "Holes",
    "Colour mismatch",
    "Uneven weaving",
    "Oil stain",
    "Selvedge damage",
    "Weft bar",
]


class QualityRuleError(Exception):
    def __init__(self, message: str, code: str = "QUALITY_RULE_VIOLATION"):
        super().__init__(message)
        self.code = code


def batch_no_for_job(job_id: int) -> str:
    return f"BATCH-{job_id}"


def _total_defects(defects: list[dict]) -> int:
    return sum(int(d["count"]) for d in defects)


def create_inspection(db: Session, payload: InspectionCreate) -> QualityInspection:
    job = db.get(ProductionJob, payload.job_id)
    if job is None:
        raise QualityRuleError(f"Production job {payload.job_id} not found", "JOB_NOT_FOUND")
    if job.status not in INSPECTABLE_STATUSES:
        raise QualityRuleError(
            f"Job #{job.id} is {job.status.value} - inspections require IN_PROGRESS, PAUSED or COMPLETED",
            "JOB_NOT_INSPECTABLE",
        )
    if job.actual_quantity <= 0:
        raise QualityRuleError(
            f"Job #{job.id} has no recorded output yet - nothing to inspect", "NO_OUTPUT_RECORDED"
        )
    if payload.inspected_qty_meters > job.actual_quantity + 1e-9:
        raise QualityRuleError(
            f"Inspected quantity {payload.inspected_qty_meters} m exceeds job output "
            f"{job.actual_quantity} m",
            "EXCEEDS_OUTPUT",
        )

    machine = job.machine
    if payload.machine_code and payload.machine_code != machine.code:
        raise QualityRuleError(
            f"Machine mismatch: job #{job.id} runs on {machine.code}, not {payload.machine_code}",
            "MACHINE_MISMATCH",
        )
    if payload.order_ref and payload.order_ref != job.order_ref:
        raise QualityRuleError(
            f"Order mismatch: job #{job.id} belongs to {job.order_ref}", "ORDER_MISMATCH"
        )
    derived_batch = batch_no_for_job(job.id)
    if payload.batch_no and payload.batch_no != derived_batch:
        raise QualityRuleError(
            f"Batch mismatch: job #{job.id} uses {derived_batch}", "BATCH_MISMATCH"
        )

    defects = [d.model_dump(exclude_none=True) for d in payload.defects]
    total = _total_defects(defects)
    # Anand's rule: defective metres are held, never sent to the warehouse.
    accepted = max(0.0, payload.inspected_qty_meters - total)
    outcome = InspectionOutcome.APPROVED if total == 0 else InspectionOutcome.REWORK

    prior = db.scalar(
        select(func.count()).select_from(QualityInspection).where(QualityInspection.job_id == job.id)
    ) or 0
    roll_id = f"{derived_batch}-R{prior + 1}"

    inspection = QualityInspection(
        job_id=job.id,
        machine_id=machine.id,
        order_ref=job.order_ref,
        batch_no=derived_batch,
        roll_id=roll_id,
        employee_id=payload.employee_id,
        inspector_name=payload.inspector_name,
        inspected_at=payload.inspected_at,
        inspected_qty_meters=payload.inspected_qty_meters,
        accepted_qty_meters=accepted,
        defects=defects,
        total_defect_count=total,
        outcome=outcome.value,
        remarks=payload.remarks,
        source="session-entry",
    )
    db.add(inspection)
    db.flush()
    order = db.get(BuyerOrder, job.order_ref)
    if accepted > 0 and order is not None:
        db.add(PackingLot(
            id=f"PK-{inspection.id:08d}", inspection_id=inspection.id,
            order_id=job.order_ref, roll_id=roll_id, batch_no=derived_batch,
            machine_code=machine.code, quality_outcome=outcome.value,
            quantity_meters=accepted, status="Pending packing",
        ))
    if order is not None:
        timestamp = datetime.now().astimezone().isoformat()
        note = f"Production output was inspected on {machine.code}; accepted quantity: {accepted:g} m."
        order_jobs = db.scalars(select(ProductionJob).where(ProductionJob.order_ref == order.id)).all()
        production_complete = bool(order_jobs) and all(
            item.status in {ProductionJobStatus.COMPLETED, ProductionJobStatus.CANCELLED}
            for item in order_jobs
        )
        next_status = "Quality Check" if production_complete else "In Production"
        if order.status != next_status:
            order.status = next_status
            order.status_history = [*(order.status_history or []), {"status": next_status, "note": note, "timestamp": timestamp}]
        order.updated_at = datetime.now().replace(tzinfo=None)
        order.buyer_visible_updates = [*(order.buyer_visible_updates or []), {"sender": "admin", "message": note, "timestamp": timestamp}]
    db.commit()
    db.refresh(inspection)
    return inspection


# Fields clients may never change after creation (audit integrity / no double counting).
UPDATABLE_FIELDS = {"outcome", "remarks"}
IMMUTABLE_FIELDS = {
    "job_id",
    "machine_id",
    "order_ref",
    "batch_no",
    "roll_id",
    "employee_id",
    "inspected_at",
    "inspected_qty_meters",
    "accepted_qty_meters",
    "defects",
}


def update_disposition(db: Session, inspection: QualityInspection, payload: InspectionUpdate) -> QualityInspection:
    sent = payload.model_fields_set
    touched_immutable = sorted(sent & IMMUTABLE_FIELDS)
    if touched_immutable:
        raise QualityRuleError(
            f"Measurement/identity fields are immutable after creation: {', '.join(touched_immutable)}",
            "IMMUTABLE_FIELDS",
        )
    if not (sent & UPDATABLE_FIELDS):
        raise QualityRuleError(
            "Nothing to update - only outcome and remarks are updatable", "NO_UPDATABLE_FIELDS"
        )
    if payload.outcome is not None:
        inspection.outcome = payload.outcome.value
    if "remarks" in sent:
        inspection.remarks = payload.remarks
    db.commit()
    db.refresh(inspection)
    return inspection


def list_inspections(
    db: Session,
    *,
    search: str | None = None,
    outcome: str | None = None,
    machine_code: str | None = None,
    employee_id: str | None = None,
    job_id: int | None = None,
    page: int = 1,
    page_size: int = 100,
) -> tuple[list[tuple[QualityInspection, Machine | None]], int]:
    q = select(QualityInspection, Machine).outerjoin(Machine, QualityInspection.machine_id == Machine.id)
    if outcome:
        q = q.where(QualityInspection.outcome == outcome)
    if machine_code:
        q = q.where(Machine.code == machine_code)
    if employee_id:
        q = q.where(QualityInspection.employee_id == employee_id)
    if job_id:
        q = q.where(QualityInspection.job_id == job_id)
    if search and search.strip():
        like = f"%{search.strip()}%"
        q = q.where(
            or_(
                QualityInspection.roll_id.ilike(like),
                QualityInspection.batch_no.ilike(like),
                QualityInspection.order_ref.ilike(like),
                QualityInspection.employee_id.ilike(like),
                QualityInspection.inspector_name.ilike(like),
                cast(QualityInspection.id, String).like(like),
                Machine.code.ilike(like),
                Machine.name.ilike(like),
            )
        )

    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    rows = db.execute(
        q.order_by(QualityInspection.inspected_at.desc(), QualityInspection.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return [(r[0], r[1]) for r in rows], total


def get_inspection(db: Session, inspection_id: int) -> QualityInspection | None:
    return db.get(QualityInspection, inspection_id)


def roll_preview(db: Session, job_id: int) -> tuple[str, str, int]:
    job = db.get(ProductionJob, job_id)
    if job is None:
        raise QualityRuleError(f"Production job {job_id} not found", "JOB_NOT_FOUND")
    prior = db.scalar(
        select(func.count()).select_from(QualityInspection).where(QualityInspection.job_id == job_id)
    ) or 0
    batch = batch_no_for_job(job_id)
    return batch, f"{batch}-R{prior + 1}", prior


def inspectable_job(db: Session, machine_id: int) -> ProductionJob | None:
    """Latest active (IN_PROGRESS/PAUSED) job, else latest completed job with output."""
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise QualityRuleError(f"Machine {machine_id} not found", "MACHINE_NOT_FOUND")
    active = db.scalar(
        select(ProductionJob)
        .where(
            ProductionJob.machine_id == machine_id,
            ProductionJob.status.in_([ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED]),
        )
        .order_by(ProductionJob.created_at.desc())
    )
    if active is not None:
        return active
    return db.scalar(
        select(ProductionJob)
        .where(
            ProductionJob.machine_id == machine_id,
            ProductionJob.status == ProductionJobStatus.COMPLETED,
            ProductionJob.actual_quantity > 0,
        )
        .order_by(ProductionJob.created_at.desc())
    )


def inspection_counts(db: Session) -> list[dict]:
    rows = db.execute(
        select(
            QualityInspection.job_id,
            func.count(QualityInspection.id),
            func.max(QualityInspection.id),
        ).group_by(QualityInspection.job_id)
    ).all()
    return [
        {"job_id": job_id, "count": count, "latest_inspection_id": latest}
        for job_id, count, latest in rows
    ]


def machine_quality_summary(db: Session, machine_id: int) -> tuple[float | None, int, str]:
    """Pass rate % for scheduling: None when history is missing/insufficient."""
    rows = db.scalars(
        select(QualityInspection).where(QualityInspection.machine_id == machine_id)
    ).all()
    n = len(rows)
    if n == 0:
        return None, 0, "no persisted inspection history"
    if n < settings.REC_MIN_QUALITY_SAMPLES:
        return None, n, f"only {n} inspection(s), minimum {settings.REC_MIN_QUALITY_SAMPLES} required"
    approved = sum(1 for r in rows if r.outcome == InspectionOutcome.APPROVED.value)
    rate = round(100.0 * approved / n, 2)
    return rate, n, f"pass rate {rate}% over {n} persisted inspection(s)"


def machine_defect_rate(
    db: Session,
    machine_id: int,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> tuple[float | None, str]:
    """Defect rate for analytics: None (with note) when no persisted history exists."""
    q = select(QualityInspection).where(QualityInspection.machine_id == machine_id)
    if date_from is not None:
        q = q.where(QualityInspection.inspected_at >= date_from.date())
    if date_to is not None:
        q = q.where(QualityInspection.inspected_at <= date_to.date())
    rows = db.scalars(q).all()
    inspected = sum(r.inspected_qty_meters for r in rows)
    if not rows or inspected <= 0:
        return None, "No persisted quality inspections - metric unavailable (not fabricated)"
    defects = sum(r.total_defect_count for r in rows)
    rate = round(100.0 * defects / inspected, 2)
    return rate, f"From {len(rows)} persisted inspection(s)"


def _machine_ref(machine: Machine, jobs: list[ProductionJob], downtime_hours: float) -> dict:
    return {
        "machine_id": machine.id,
        "id": machine.code,
        "name": machine.name,
        "process": machine.supported_processes,
        "output_meters": round(sum(j.actual_quantity for j in jobs), 2),
        "downtime_hours": round(downtime_hours, 2),
    }


def dashboard_bundle(db: Session) -> dict:
    """Everything the quality dashboard needs, computed from persisted inspections.

    Empty history yields zeros/empty series (the dashboard's documented
    representation) and every machine summary reports "No inspection history"
    instead of being flagged - unavailable is distinguished from genuine zero.
    """
    machines = list(db.scalars(select(Machine).order_by(Machine.code)).all())
    inspections = list(
        db.scalars(
            select(QualityInspection).order_by(QualityInspection.inspected_at.asc(), QualityInspection.id.asc())
        ).all()
    )

    total = len(inspections)
    approved = sum(1 for i in inspections if i.outcome == InspectionOutcome.APPROVED.value)
    rework = sum(1 for i in inspections if i.outcome == InspectionOutcome.REWORK.value)
    rejected = sum(1 for i in inspections if i.outcome == InspectionOutcome.REJECTED.value)
    inspected_sum = sum(i.inspected_qty_meters for i in inspections)
    accepted_sum = sum(i.accepted_qty_meters for i in inspections)
    defects_sum = sum(i.total_defect_count for i in inspections)

    jobs_by_machine: dict[int, list[ProductionJob]] = {}
    for j in db.scalars(select(ProductionJob)).all():
        jobs_by_machine.setdefault(j.machine_id, []).append(j)
    downtime_hours_by_machine: dict[int, float] = {}
    for d in db.scalars(select(MachineDowntime).where(MachineDowntime.ended_at.is_not(None))).all():
        downtime_hours_by_machine[d.machine_id] = (
            downtime_hours_by_machine.get(d.machine_id, 0.0) + (d.duration_minutes or 0.0) / 60.0
        )

    summaries = []
    matrix = []
    for machine in machines:
        own = [i for i in inspections if i.machine_id == machine.id]
        m_inspected = sum(i.inspected_qty_meters for i in own)
        m_accepted = sum(i.accepted_qty_meters for i in own)
        m_defects = sum(i.total_defect_count for i in own)
        m_approved = sum(1 for i in own if i.outcome == InspectionOutcome.APPROVED.value)
        m_rework = sum(1 for i in own if i.outcome == InspectionOutcome.REWORK.value)
        m_rejected = sum(1 for i in own if i.outcome == InspectionOutcome.REJECTED.value)

        defect_rate = round(100.0 * m_defects / m_inspected, 2) if m_inspected > 0 else 0.0
        pass_rate = round(100.0 * m_approved / len(own)) if own else 0
        efficiency = round(100.0 * m_accepted / m_inspected) if m_inspected > 0 else 0

        reasons: list[str] = []
        if own:  # flag only with actual history (no history is not a failure)
            if defect_rate > FLAG_RULE["defect_rate_per_100m"]:
                reasons.append(f"defect rate {defect_rate}/100 m > {FLAG_RULE['defect_rate_per_100m']}")
            if pass_rate < FLAG_RULE["pass_rate_pct"]:
                reasons.append(f"pass rate {pass_rate}% < {FLAG_RULE['pass_rate_pct']}%")
        flag_reason = (
            "; ".join(reasons) if reasons else ("Within thresholds" if own else "No inspection history")
        )

        summaries.append(
            {
                "machine": _machine_ref(
                    machine,
                    jobs_by_machine.get(machine.id, []),
                    downtime_hours_by_machine.get(machine.id, 0.0),
                ),
                "inspections": len(own),
                "approved": m_approved,
                "rework": m_rework,
                "rejected": m_rejected,
                "inspected_qty_meters": round(m_inspected, 2),
                "accepted_qty_meters": round(m_accepted, 2),
                "total_defects": m_defects,
                "defect_rate_per_100m": defect_rate,
                "pass_rate_percent": pass_rate,
                "efficiency_percent": efficiency,
                "needs_investigation": len(reasons) > 0,
                "flag_reason": flag_reason,
            }
        )

        counts: dict[str, int] = {t: 0 for t in DEFECT_TYPES}
        for i in own:
            for defect in i.defects or []:
                counts[defect["type"]] = counts.get(defect["type"], 0) + int(defect["count"])
        matrix.append(
            {
                "machine_id": machine.code,
                "machine_name": machine.name,
                "counts": counts,
                "total": sum(counts.values()),
            }
        )

    # --- Trend: one point per inspection date ---
    by_date: dict[str, dict] = {}
    for i in inspections:
        key = i.inspected_at.isoformat()
        bucket = by_date.setdefault(key, {"defects": 0, "meters": 0.0, "count": 0})
        bucket["defects"] += i.total_defect_count
        bucket["meters"] += i.inspected_qty_meters
        bucket["count"] += 1
    trend = [
        {
            "date": key,
            "defect_rate_per_100m": (
                round(100.0 * b["defects"] / b["meters"], 2) if b["meters"] > 0 else 0.0
            ),
            "inspections": b["count"],
        }
        for key, b in sorted(by_date.items())
    ]

    # --- Defect type breakdown (all recorded types, sorted by count) ---
    type_counts: dict[str, int] = {}
    for i in inspections:
        for defect in i.defects or []:
            type_counts[defect["type"]] = type_counts.get(defect["type"], 0) + int(defect["count"])
    by_type = sorted(({"type": t, "count": c} for t, c in type_counts.items()), key=lambda x: -x["count"])

    stats = {
        "total_inspections": total,
        "efficiency_percent": round(100.0 * accepted_sum / inspected_sum) if inspected_sum > 0 else 0,
        "pass_rate_percent": round(100.0 * approved / total) if total else 0,
        "defect_rate_per_100m": round(100.0 * defects_sum / inspected_sum, 2) if inspected_sum > 0 else 0.0,
        "rework_count": rework,
        "rejected_count": rejected,
        "machines_flagged": sum(1 for s in summaries if s["needs_investigation"]),
    }
    return {"stats": stats, "trend": trend, "by_type": by_type, "summaries": summaries, "matrix": matrix}
