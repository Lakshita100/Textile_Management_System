"""Purchase recommendations and purchase-request drafts (never sent anywhere)."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    PurchaseRequestCreate,
    PurchaseRequestListOut,
    PurchaseRequestOut,
    PurchaseRequestStatusIn,
    RecommendationsOut,
)
from app.services import purchases
from app.services.common import transaction

router = APIRouter(tags=["purchases"])


@router.get("/purchase-recommendations", response_model=RecommendationsOut, summary="Shortage + supplier comparison")
def get_recommendations(
    q: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    bufferQuantity: float = Query(0, ge=0, description="Extra quantity added on top of the shortage"),
    db: Session = Depends(get_db),
) -> RecommendationsOut:
    items, total = purchases.recommendations(
        db, q=q, page=page, page_size=pageSize, buffer_quantity=bufferQuantity, today=date.today()
    )
    return RecommendationsOut(items=items, total=total)


@router.get("/purchase-requests", response_model=PurchaseRequestListOut, summary="List purchase request drafts")
def list_requests(
    status: str = Query("", description="draft | submitted | cancelled"),
    yarnId: str = Query("", max_length=32),
    db: Session = Depends(get_db),
) -> PurchaseRequestListOut:
    items = purchases.list_requests(db, status=status, yarn_id=yarnId)
    return PurchaseRequestListOut(items=items, total=len(items))


@router.post(
    "/purchase-requests",
    response_model=PurchaseRequestOut,
    status_code=201,
    summary="Create a purchase request draft (a request, NOT a purchase order)",
)
def create_request(payload: PurchaseRequestCreate, db: Session = Depends(get_db)) -> PurchaseRequestOut:
    with transaction(db):
        result = purchases.create_request(db, payload, today=date.today())
    return result


@router.patch(
    "/purchase-requests/{request_id}/status",
    response_model=PurchaseRequestOut,
    summary="Update a purchase request's status",
)
def update_status(request_id: str, payload: PurchaseRequestStatusIn, db: Session = Depends(get_db)) -> PurchaseRequestOut:
    with transaction(db):
        result = purchases.update_status(db, request_id, payload.status)
    return result
