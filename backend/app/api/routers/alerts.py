"""Low-stock alert endpoints."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AlertListOut, StockAlertOut
from app.services import alerts
from app.services.common import transaction

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=AlertListOut, summary="List alerts enriched with yarn + supplier details")
def list_alerts(
    status: str = Query("", description="active | acknowledged | resolved"),
    db: Session = Depends(get_db),
) -> AlertListOut:
    return alerts.list_alerts(db, status=status)


@router.post("/{alert_id}/acknowledge", response_model=StockAlertOut, summary="Acknowledge an active alert")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)) -> StockAlertOut:
    with transaction(db):
        result = alerts.acknowledge_alert(db, alert_id, today=date.today())
    return StockAlertOut(**result)


@router.post("/{alert_id}/resolve", response_model=StockAlertOut, summary="Resolve an open alert")
def resolve_alert(alert_id: str, db: Session = Depends(get_db)) -> StockAlertOut:
    with transaction(db):
        result = alerts.resolve_alert(db, alert_id, today=date.today())
    return StockAlertOut(**result)
