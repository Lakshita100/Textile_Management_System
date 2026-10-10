from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.machine import Machine
from app.models.production import MachineDowntime
from app.schemas.scheduling import (
    DurationEstimateOut,
    DurationEstimateRequest,
    MachineTimelineOut,
    TimelineInterval,
)
from app.services import duration as duration_service
from app.services import scheduling as scheduling_service

router = APIRouter(prefix="/scheduling", tags=["scheduling"])


@router.post("/estimate-duration", response_model=DurationEstimateOut)
def estimate_duration(payload: DurationEstimateRequest, db: Session = Depends(get_db)):
    """Predict processing duration for a machine candidate.

    Explicit errors: 404 machine not found; 503 model artifact missing;
    422 invalid input (FastAPI/pydantic validation).
    """
    machine = db.get(Machine, payload.machine_id)
    if machine is None:
        raise HTTPException(404, {"detail": f"Machine {payload.machine_id} not found", "code": "MACHINE_NOT_FOUND"})
    if not duration_service.model_available():
        raise HTTPException(
            503,
            {
                "detail": "Duration model artifact not available — train it with scripts/train_duration_model.py",
                "code": "MODEL_UNAVAILABLE",
            },
        )
    est = scheduling_service.estimate_processing(
        machine,
        payload.quantity,
        payload.unit,
        payload.process,
        gsm=payload.gsm,
        width_cm=payload.width_cm,
        fabric_type=payload.fabric_type,
        fiber=payload.fiber,
        color=payload.color,
        priority=payload.priority,
    )
    return DurationEstimateOut(
        minutes=est.minutes,
        source=est.source,
        model_version=est.model_version,
        warnings=est.warnings,
    )


@router.get("/machines/{machine_id}/timeline", response_model=MachineTimelineOut)
def machine_timeline(machine_id: int, db: Session = Depends(get_db)):
    """Committed busy intervals + expected next-available time within the planning horizon."""
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise HTTPException(404, {"detail": f"Machine {machine_id} not found", "code": "MACHINE_NOT_FOUND"})

    now = scheduling_service.utcnow()
    horizon_end = now + timedelta(days=settings.REC_PLANNING_HORIZON_DAYS)
    intervals, warnings = scheduling_service.machine_busy_intervals(db, machine, now, horizon_end)

    next_available = now
    for iv in sorted(intervals, key=lambda x: x["end"]):
        end = datetime.fromisoformat(iv["end"])
        if end > next_available:
            next_available = end

    open_downtime = db.scalar(
        select(func.count()).select_from(MachineDowntime).where(
            MachineDowntime.machine_id == machine.id,
            MachineDowntime.ended_at.is_(None),
        )
    ) or 0

    return MachineTimelineOut(
        machine_id=machine.id,
        machine_code=machine.code,
        now=now,
        horizon_end=horizon_end,
        busy_intervals=[TimelineInterval(**iv) for iv in intervals],
        next_available_at=next_available,
        open_downtime_count=open_downtime,
        warnings=warnings,
        assumptions=[
            f"Planning horizon: {settings.REC_PLANNING_HORIZON_DAYS} days.",
            "Future arrivals and future maintenance unknown — gaps are not guaranteed idle time.",
        ],
    )
