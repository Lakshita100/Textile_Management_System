"""Stock movement endpoints — every mutation runs inside a DB transaction."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import MovementCreate, MovementListOut, MovementOut
from app.services import movements
from app.services.common import transaction

router = APIRouter(prefix="/movements", tags=["movements"])


@router.get("", response_model=MovementListOut, summary="List stock movements (newest first)")
def list_movements(
    yarnId: str = Query("", max_length=32),
    movementType: str = Query("", description="Stock In | Consumption"),
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db),
) -> MovementListOut:
    items, total = movements.list_movements(
        db, yarn_id=yarnId, movement_type=movementType, limit=limit
    )
    return MovementListOut(items=items, total=total)


@router.post("", response_model=MovementOut, status_code=201, summary="Record stock in / consumption")
def record_movement(payload: MovementCreate, db: Session = Depends(get_db)) -> MovementOut:
    with transaction(db):
        result = movements.record_movement(db, payload, today=date.today())
    return result


@router.post(
    "/{movement_id}/reverse",
    response_model=MovementOut,
    status_code=201,
    summary="Append an auditable correction for a movement",
)
def reverse_movement(movement_id: str, db: Session = Depends(get_db)) -> MovementOut:
    with transaction(db):
        result = movements.reverse_movement(db, movement_id, today=date.today())
    return result
