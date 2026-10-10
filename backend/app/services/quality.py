"""Quality inspection storage, validation and dashboard aggregation.

FLAG thresholds below are initial business-rule values for the demo dashboard —
NOT validated factory parameters.
"""

from __future__ import annotations

from sqlalchemy import false, func, or_, select
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.models.quality import InspectionOutcome, QualityInspection
from app.schemas.common import Page
from app.schemas.quality import (
    DashboardStatsOut,
    DefectTypePointOut,
    InspectionCreate,
    InspectionOut,
    MachineSummaryOut,
    MatrixRowOut,
    QualityDashboardOut,
    TrendPointOut,
)

DEFECT_TYPES = [
    "Holes",
    "Colour mismatch",
    "Uneven weaving",
    "Oil stain",
    "Selvedge damage",
    "Weft bar",
]

FLAG_RULE = {"defect_rate_per_100m": 0.5, "pass_rate_pct": 80}


class QualityRuleError(Exception):
    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code


def _roll_id(db: Session, batch_no: str) -> str:
    prefix = f"{batch_no}-R"
    count = (
        db.scalar(
            select(func.count())
            .select_from(QualityInspection)
            .where(QualityInspection.roll_id.like(f"{prefix}%"))
        )
        or 0
    )
    return f"{prefix}{count + 1}"


def next_roll_id(db: Session, batch_no: str) -> str:
    return _roll_id(db, batch_no.strip())


def create_inspection(db: Session, payload: InspectionCreate) -> QualityInspection:
    machine = db.scalar(select(Machine).where(Machine.code == payload.machine_code))
    if machine is None:
        raise QualityRuleError(f"Machine '{payload.machine_code}' not found", "MACHINE_NOT_FOUND")

    inspected = float(payload.inspected_qty_meters)
    if inspected <= 0:
        raise QualityRuleError("Inspected quantity must be greater than zero", "INVALID_QUANTITY")

    defects = [d.model_dump() for d in payload.defects]
    if any((not d.get("type")) or int(d.get("count", 0)) < 1 for d in defects):
        raise QualityRuleError("Each defect needs a type and a count of 1 or more", "INVALID_DEFECT")

    total_defects = sum(int(d["count"]) for d in defects)
    # Metres with defects are held (not sent to the warehouse).
    accepted = max(0.0, inspected - total_defects)
    outcome = InspectionOutcome.APPROVED if total_defects == 0 else InspectionOutcome.REWORK

    batch_no = payload.batch_no.strip()
    insp = QualityInspection(
        code="",
        roll_id=_roll_id(db, batch_no),
        batch_no=batch_no,
        order_ref=payload.order_ref.strip(),
        machine_id=machine.id,
        employee_id=payload.employee_id,
        inspector_name=payload.inspector_name,
        inspected_at=payload.inspected_at,
        inspected_qty_meters=inspected,
        accepted_qty_meters=accepted,
        total_defect_count=total_defects,
        defects=defects,
        outcome=outcome,
        remarks=payload.remarks,
        source="session-entry",
    )
    db.add(insp)
    db.flush()
    insp.code = f"QI-{insp.id:03d}"
    db.commit()
    db.refresh(insp)
    return insp


def _machine_maps(db: Session) -> tuple[dict[int, Machine], dict[int, str]]:
    machines = {m.id: m for m in db.scalars(select(Machine).order_by(Machine.id)).all()}
    return machines, {mid: m.code for mid, m in machines.items()}


def list_inspections(
    db: Session,
    *,
    search: str | None = None,
    outcome: InspectionOutcome | None = None,
    machine_code: str | None = None,
    employee_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> Page[InspectionOut]:
    q = select(QualityInspection)
    if outcome is not None:
        q = q.where(QualityInspection.outcome == outcome)
    if employee_id:
        q = q.where(QualityInspection.employee_id == employee_id)
    if machine_code:
        machine = db.scalar(select(Machine).where(Machine.code == machine_code))
        if machine is None:
            return Page[InspectionOut](items=[], total=0, page=page, page_size=page_size, pages=1)
        q = q.where(QualityInspection.machine_id == machine.id)
    if search and search.strip():
        term = f"%{search.strip()}%"
        matching_machine_ids = list(
            db.scalars(
                select(Machine.id).where(or_(Machine.code.ilike(term), Machine.name.ilike(term)))
            ).all()
        )
        machine_clause = (
            QualityInspection.machine_id.in_(matching_machine_ids) if matching_machine_ids else false()
        )
        q = q.where(
            or_(
                QualityInspection.code.ilike(term),
                QualityInspection.roll_id.ilike(term),
                QualityInspection.batch_no.ilike(term),
                QualityInspection.order_ref.ilike(term),
                QualityInspection.inspector_name.ilike(term),
                QualityInspection.employee_id.ilike(term),
                machine_clause,
            )
        )

    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    pages = max(1, (total + page_size - 1) // page_size)
    rows = db.scalars(
        q.order_by(QualityInspection.inspected_at.desc(), QualityInspection.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    codes = {m.id: m.code for m in db.scalars(select(Machine)).all()}
    items = [
        InspectionOut(
            code=r.code,
            roll_id=r.roll_id,
            batch_no=r.batch_no,
            order_ref=r.order_ref,
            machine_id=r.machine_id,
            machine_code=codes.get(r.machine_id, ""),
            employee_id=r.employee_id,
            inspector_name=r.inspector_name,
            inspected_at=r.inspected_at,
            inspected_qty_meters=r.inspected_qty_meters,
            accepted_qty_meters=r.accepted_qty_meters,
            total_defect_count=r.total_defect_count,
            defects=r.defects,
            outcome=r.outcome,
            remarks=r.remarks,
            source=r.source,
        )
        for r in rows
    ]
    return Page[InspectionOut](items=items, total=total, page=page, page_size=page_size, pages=pages)


def compute_dashboard(db: Session) -> QualityDashboardOut:
    machines, _ = _machine_maps(db)
    rows = list(db.scalars(select(QualityInspection)).all())

    total = len(rows)
    inspected = sum(r.inspected_qty_meters for r in rows)
    accepted = sum(r.accepted_qty_meters for r in rows)
    defects_total = sum(r.total_defect_count for r in rows)
    approved = [r for r in rows if r.outcome == InspectionOutcome.APPROVED]
    rework = [r for r in rows if r.outcome == InspectionOutcome.REWORK]
    rejected = [r for r in rows if r.outcome == InspectionOutcome.REJECTED]

    efficiency_pct = round((accepted / inspected) * 100) if inspected else 0
    pass_rate_pct = round((len(approved) / total) * 100) if total else 0
    defect_rate = round((defects_total / inspected) * 100, 2) if inspected else 0.0

    # Trend — one point per inspected day (chronological).
    by_date: dict[str, dict[str, float]] = {}
    for r in rows:
        key = r.inspected_at.isoformat()
        bucket = by_date.setdefault(key, {"defects": 0, "meters": 0, "count": 0})
        bucket["defects"] += r.total_defect_count
        bucket["meters"] += r.inspected_qty_meters
        bucket["count"] += 1
    trend = [
        TrendPointOut(
            date=key,
            defect_rate_per_100m=round((b["defects"] / b["meters"]) * 100, 2) if b["meters"] else 0.0,
            inspections=int(b["count"]),
        )
        for key, b in sorted(by_date.items())
    ]

    # Defects by type.
    by_type_counts: dict[str, int] = {}
    for r in rows:
        for d in r.defects or []:
            t = str(d.get("type", ""))
            if t:
                by_type_counts[t] = by_type_counts.get(t, 0) + int(d.get("count", 0))
    by_type = [
        DefectTypePointOut(type=t, count=c)
        for t, c in sorted(by_type_counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]

    # Per-machine summaries (every machine is listed, even with zero inspections).
    summaries: list[MachineSummaryOut] = []
    matrix: list[MatrixRowOut] = []
    for machine in machines.values():
        own = [r for r in rows if r.machine_id == machine.id]
        m_inspected = sum(r.inspected_qty_meters for r in own)
        m_accepted = sum(r.accepted_qty_meters for r in own)
        m_defects = sum(r.total_defect_count for r in own)
        m_approved = sum(1 for r in own if r.outcome == InspectionOutcome.APPROVED)
        m_rework = sum(1 for r in own if r.outcome == InspectionOutcome.REWORK)
        m_rejected = sum(1 for r in own if r.outcome == InspectionOutcome.REJECTED)

        m_rate = round((m_defects / m_inspected) * 100, 2) if m_inspected else 0.0
        m_pass = round((m_approved / len(own)) * 100) if own else 0
        m_eff = round((m_accepted / m_inspected) * 100) if m_inspected else 0

        reasons: list[str] = []
        if m_rate > FLAG_RULE["defect_rate_per_100m"]:
            reasons.append(f"defect rate {m_rate}/100 m > {FLAG_RULE['defect_rate_per_100m']}")
        if own and m_pass < FLAG_RULE["pass_rate_pct"]:
            reasons.append(f"pass rate {m_pass}% < {FLAG_RULE['pass_rate_pct']}%")

        process = (machine.supported_processes.split(",")[0].strip() if machine.supported_processes else "") or machine.machine_type
        summaries.append(
            MachineSummaryOut(
                machine={"code": machine.code, "name": machine.name, "process": process},
                inspections=len(own),
                approved=m_approved,
                rework=m_rework,
                rejected=m_rejected,
                inspected_qty_meters=m_inspected,
                accepted_qty_meters=m_accepted,
                total_defects=m_defects,
                defect_rate_per_100m=m_rate,
                pass_rate_pct=m_pass,
                efficiency_pct=m_eff,
                needs_investigation=bool(reasons),
                flag_reason="; ".join(reasons) if reasons else "Within thresholds",
            )
        )

        counts: dict[str, int] = {t: 0 for t in DEFECT_TYPES}
        for r in own:
            for d in r.defects or []:
                t = str(d.get("type", ""))
                if t:
                    counts[t] = counts.get(t, 0) + int(d.get("count", 0))
        matrix.append(
            MatrixRowOut(
                machine_code=machine.code,
                machine_name=machine.name,
                counts=counts,
                total=sum(counts.values()),
            )
        )

    return QualityDashboardOut(
        stats=DashboardStatsOut(
            total_inspections=total,
            efficiency_pct=efficiency_pct,
            pass_rate_pct=pass_rate_pct,
            defect_rate_per_100m=defect_rate,
            rework_count=len(rework),
            rejected_count=len(rejected),
            machines_flagged=sum(1 for s in summaries if s.needs_investigation),
        ),
        trend=trend,
        by_type=by_type,
        summaries=summaries,
        matrix=matrix,
    )
