from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.machine import Machine
from app.models.production import ProductionJob
from app.models.recommendation import MachineRecommendation, RecommendationDecision
from app.schemas.recommendation import (
    AnalyticsRow,
    ApprovalRequest,
    CandidateOut,
    RecommendationOut,
    RecommendationRequest,
    ScoreBreakdown,
)
from app.services import analytics as analytics_service
from app.services import machines as machine_service
from app.services import production as production_service
from app.services import recommendation as rec_service
from app.services.machines import MachineRuleError

router = APIRouter(tags=["recommendations"])


def _to_out(rec: MachineRecommendation) -> RecommendationOut:
    payload = rec.payload or {}
    return RecommendationOut(
        id=rec.id,
        order_ref=rec.order_ref,
        required_process=rec.required_process,
        required_material=rec.required_material,
        required_quantity=rec.required_quantity,
        quantity_unit=rec.quantity_unit,
        algorithm_version=rec.algorithm_version,
        decision=rec.decision,
        recommended_machine_id=payload.get("recommended_machine_id"),
        recommended_machine_code=payload.get("recommended_machine_code"),
        explanation=payload.get("explanation", ""),
        warnings=payload.get("warnings", []),
        candidates=[CandidateOut(**c) for c in payload.get("candidates", [])],
        material_available=payload.get("material_available"),
        material_note=payload.get("material_note", ""),
        created_at=rec.created_at,
        decided_by=rec.decided_by,
        decided_at=rec.decided_at,
        assigned_job_id=rec.assigned_job_id,
    )


@router.post("/recommendations/machines", response_model=RecommendationOut, status_code=201)
def generate_recommendation(payload: RecommendationRequest, db: Session = Depends(get_db)):
    candidates, warnings, material_ok, material_note = rec_service.rank_machines(
        db,
        required_process=payload.required_process,
        required_material=payload.required_material,
        required_quantity=payload.required_quantity,
        deadline=payload.deadline,
        quantity_unit=payload.quantity_unit,
    )
    eligible = [c for c in candidates if c.eligible]
    best = eligible[0] if eligible else None
    explanation = rec_service.build_explanation(best, material_note, warnings)

    cand_payload = []
    for c in candidates:
        cand_payload.append(
            {
                "machine_id": c.machine.id,
                "machine_code": c.machine.code,
                "machine_name": c.machine.name,
                "eligible": c.eligible,
                "exclusion_reasons": c.exclusion_reasons,
                "score": (
                    ScoreBreakdown(
                        efficiency=c.efficiency,
                        efficiency_known=c.efficiency_known,
                        workload_suitability=c.workload,
                        quality=c.quality,
                        quality_known=c.quality_known,
                        final_score=c.final_score or 0.0,
                    ).model_dump()
                    if c.eligible
                    else None
                ),
                "estimated_days": c.estimated_days,
                "schedule": c.schedule.as_dict() if c.schedule else None,
                "ml_selection_probability": c.ml_selection_probability,
                "warnings": c.warnings,
            }
        )

    from app.services import allocation_ml as _allocation_ml

    if _allocation_ml.model_available():
        warnings = warnings + [
            "Experimental ML selection probability attached to candidates (trained on synthetic heuristic "
            "labels); it never overrides eligibility gates or the documented rule-based score ordering."
        ]

    rec = MachineRecommendation(
        order_ref=payload.order_ref,
        required_process=payload.required_process.upper(),
        required_material=payload.required_material.upper(),
        required_quantity=payload.required_quantity,
        quantity_unit=payload.quantity_unit,
        algorithm_version=settings.REC_ALGORITHM_VERSION,
        decision=RecommendationDecision.PENDING,
        payload={
            "recommended_machine_id": best.machine.id if best else None,
            "recommended_machine_code": best.machine.code if best else None,
            "explanation": explanation,
            "warnings": warnings + (best.warnings if best else []),
            "candidates": cand_payload,
            "material_available": material_ok,
            "material_note": material_note,
            "weights": {
                "efficiency": settings.REC_WEIGHT_EFFICIENCY,
                "workload": settings.REC_WEIGHT_WORKLOAD,
                "quality": settings.REC_WEIGHT_QUALITY,
            },
        },
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _to_out(rec)


@router.get("/recommendations/machines/{recommendation_id}", response_model=RecommendationOut)
def get_recommendation(recommendation_id: int, db: Session = Depends(get_db)):
    rec = db.get(MachineRecommendation, recommendation_id)
    if rec is None:
        raise HTTPException(404, f"Recommendation {recommendation_id} not found")
    return _to_out(rec)


@router.post("/recommendations/machines/{recommendation_id}/approve", response_model=RecommendationOut)
def approve_recommendation(recommendation_id: int, payload: ApprovalRequest, db: Session = Depends(get_db)):
    """Supervisor approval: revalidates material, machine status and schedule, then assigns transactionally."""
    from app.adapters import inventory_adapter
    from app.models.machine import MachineStatus
    from app.services.production import detect_schedule_conflict

    # Lock the recommendation row for the whole decision (PostgreSQL row lock;
    # ignored on SQLite) so two workers cannot both pass the PENDING check.
    rec = db.get(MachineRecommendation, recommendation_id, with_for_update=True)
    if rec is None:
        raise HTTPException(404, f"Recommendation {recommendation_id} not found")
    if rec.decision != RecommendationDecision.PENDING:
        raise HTTPException(409, {"detail": f"Already {rec.decision.value}", "code": "ALREADY_DECIDED"})

    machine_id = (rec.payload or {}).get("recommended_machine_id")
    if machine_id is None:
        rec.decision = RecommendationDecision.REJECTED
        rec.decided_by = payload.decided_by
        rec.decided_at = rec.created_at
        rec.decision_note = "No eligible machine was recommended"
        db.commit()
        raise HTTPException(409, {"detail": "No eligible machine to approve", "code": "NO_ELIGIBLE_MACHINE"})

    machine = db.get(Machine, machine_id)
    if machine is None:
        raise HTTPException(409, {"detail": "Recommended machine no longer exists", "code": "MACHINE_GONE"})

    # Serialize with concurrent create/approve for this machine, then re-read
    # state so the revalidation below cannot race another worker's insert.
    production_service.lock_machine(db, machine.id)
    db.refresh(machine)

    # --- Revalidation (transactional, under machine lock) ---
    if machine.status == MachineStatus.MAINTENANCE:
        rec.decision = RecommendationDecision.FAILED_REVALIDATION
        rec.decided_by = payload.decided_by
        rec.decision_note = "Machine entered MAINTENANCE before approval"
        db.commit()
        raise HTTPException(409, {"detail": "Machine is under maintenance", "code": "MACHINE_MAINTENANCE"})

    avail = inventory_adapter.get_availability(rec.required_material)
    if avail is not None and avail.available < rec.required_quantity:
        rec.decision = RecommendationDecision.FAILED_REVALIDATION
        rec.decided_by = payload.decided_by
        rec.decision_note = "Material availability changed before approval"
        db.commit()
        raise HTTPException(409, {"detail": "Material no longer sufficient", "code": "MATERIAL_INSUFFICIENT"})

    active = machine_service.get_active_job(db, machine.id)
    if active is not None:
        rec.decision = RecommendationDecision.FAILED_REVALIDATION
        rec.decided_by = payload.decided_by
        rec.decision_note = "Machine became committed before approval"
        db.commit()
        raise HTTPException(409, {"detail": f"Machine already has active job #{active.id}", "code": "MACHINE_BUSY"})

    # --- Resolve planned window: explicit payload times, else the computed schedule ---
    from datetime import datetime as _dt

    planned_start = payload.planned_start
    planned_end = payload.planned_end
    approved_schedule: dict | None = None
    if planned_start is None or planned_end is None:
        for c in (rec.payload or {}).get("candidates", []):
            if c.get("machine_id") == machine_id and c.get("schedule"):
                sched = c["schedule"]
                if planned_start is None and sched.get("earliest_start_at"):
                    planned_start = _dt.fromisoformat(sched["earliest_start_at"])
                if planned_end is None and sched.get("completion_at"):
                    planned_end = _dt.fromisoformat(sched["completion_at"])
                approved_schedule = sched
                break

    conflict = detect_schedule_conflict(db, machine.id, planned_start, planned_end)
    if conflict is not None:
        rec.decision = RecommendationDecision.FAILED_REVALIDATION
        rec.decided_by = payload.decided_by
        db.commit()
        raise HTTPException(409, {"detail": f"Schedule conflict with job #{conflict.id}", "code": "SCHEDULE_CONFLICT"})

    try:
        job = production_service.create_job(
            db,
            machine=machine,
            order_ref=rec.order_ref,
            material_spec=rec.required_material,
            required_process=rec.required_process,
            planned_quantity=rec.required_quantity,
            quantity_unit=rec.quantity_unit,
            shift=payload.shift,
            planned_start=planned_start,
            planned_end=planned_end,
            # Stay in this transaction so the machine/recommendation locks are
            # held until the APPROVED decision is committed (single atomic unit).
            commit=False,
        )
    except MachineRuleError as e:
        rec.decision = RecommendationDecision.FAILED_REVALIDATION
        rec.decided_by = payload.decided_by
        db.commit()
        raise HTTPException(409, {"detail": str(e), "code": e.code})

    rec.decision = RecommendationDecision.APPROVED
    rec.decided_by = payload.decided_by
    from datetime import datetime, timezone

    rec.decided_at = datetime.now(timezone.utc)
    rec.decision_note = payload.note
    rec.assigned_job_id = job.id
    if approved_schedule is not None:
        rec.payload = {**(rec.payload or {}), "approved_schedule": approved_schedule}
    db.commit()
    db.refresh(rec)
    return _to_out(rec)


@router.get("/production/analytics", response_model=list[AnalyticsRow], tags=["analytics"])
def analytics(
    date_from: str | None = None,
    date_to: str | None = None,
    machine_id: int | None = None,
    db: Session = Depends(get_db),
):
    from datetime import datetime as dt

    df = dt.fromisoformat(date_from) if date_from else None
    dtt = dt.fromisoformat(date_to) if date_to else None
    rows = analytics_service.machine_analytics(db, date_from=df, date_to=dtt, machine_id=machine_id)
    return [AnalyticsRow(**r) for r in rows]
