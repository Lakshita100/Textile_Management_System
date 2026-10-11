"""Persisted packing and dispatch workflow APIs."""

from __future__ import annotations

from datetime import datetime, timezone
from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import current_user, require_permission
from app.database import get_db
from app.models.auth import User
from app.models.fulfillment import PackingLot, Shipment
from app.models.order import BuyerOrder
from app.models.production import ProductionJob, ProductionJobStatus
from app.models.quality import QualityInspection

router = APIRouter(prefix="/fulfillment", tags=["fulfillment"])


class PackLotIn(BaseModel):
    status: str = Field(pattern="^(Packed|In warehouse)$")
    pack_type: str | None = Field(default=None, max_length=20)
    cartons: int | None = Field(default=None, ge=1)


class DispatchIn(BaseModel):
    lot_ids: list[str] = Field(min_length=1)
    courier: str = Field(min_length=1, max_length=120)
    tracking_number: str | None = Field(default=None, max_length=120)


class ShipmentStatusIn(BaseModel):
    status: str = Field(pattern="^(In transit|Delivered|Delayed)$")


def _timestamp() -> datetime:
    return datetime.now(timezone.utc)


def _append_order_event(db: Session, order_id: str, status: str, note: str) -> None:
    order = db.get(BuyerOrder, order_id)
    if order is None:
        return
    stamp = _timestamp().isoformat()
    order.status = status
    order.updated_at = _timestamp().replace(tzinfo=None)
    order.status_history = [*(order.status_history or []), {"status": status, "note": note, "timestamp": stamp}]
    order.buyer_visible_updates = [*(order.buyer_visible_updates or []), {"sender": "admin", "message": note, "timestamp": stamp}]


def _lot_out(row: PackingLot) -> dict:
    return {
        "id": row.id, "rollId": row.roll_id, "batchNo": row.batch_no,
        "orderId": row.order_id, "machineId": row.machine_code,
        "qualityOutcome": row.quality_outcome, "qtyMeters": row.quantity_meters,
        "status": row.status, "packType": row.pack_type, "cartons": row.cartons,
        "packedAt": row.packed_at.isoformat() if row.packed_at else None,
        "packedBy": row.packed_by,
    }


def _shipment_out(row: Shipment, order: BuyerOrder | None = None, buyer: User | None = None) -> dict:
    return {
        "id": row.id, "orderId": row.order_id,
        "customer": order.company_name if order else "",
        "country": buyer.country if buyer and buyer.country else "",
        "state": "", "city": buyer.city if buyer and buyer.city else "", "rolls": 0, "meters": 0,
        "dispatchDate": row.dispatched_at.date().isoformat(),
        "status": row.status, "courier": row.courier,
        "trackingNumber": row.tracking_number,
        "destination": row.destination or (buyer.address if buyer else None),
    }


@router.get("/packing", dependencies=[Depends(require_permission("quality"))])
def list_packing(db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(PackingLot).order_by(PackingLot.created_at.desc())).all()
    return {"lots": [_lot_out(row) for row in rows]}


@router.get("/ready-to-dispatch", dependencies=[Depends(require_permission("dispatch"))])
def ready_to_dispatch(db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(PackingLot).where(PackingLot.status == "In warehouse").order_by(PackingLot.created_at)).all()
    return {"lots": [_lot_out(row) for row in rows]}


@router.patch("/packing/{lot_id}", dependencies=[Depends(require_permission("quality"))])
def update_packing(lot_id: str, payload: PackLotIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    lot = db.get(PackingLot, lot_id)
    if lot is None:
        raise HTTPException(404, {"detail": "Packing lot not found", "code": "LOT_NOT_FOUND"})
    if lot.status not in {"Pending packing", "Packed", "In warehouse"}:
        raise HTTPException(409, {"detail": "This lot has already been dispatched", "code": "LOT_ALREADY_DISPATCHED"})
    if payload.status == "In warehouse" and lot.status == "Pending packing":
        raise HTTPException(409, {"detail": "Pack the lot before moving it to the warehouse", "code": "PACKING_REQUIRED"})
    lot.status = payload.status
    lot.pack_type = payload.pack_type or lot.pack_type or "Roll"
    lot.cartons = payload.cartons or lot.cartons or 1
    lot.packed_by = user.full_name
    lot.packed_at = _timestamp()
    if payload.status == "Packed":
        order = db.get(BuyerOrder, lot.order_id)
        if order is not None and order.status != "Packing":
            _append_order_event(db, lot.order_id, "Packing", "Inspected goods are being packed for dispatch.")
    if payload.status == "In warehouse":
        remaining = db.scalar(select(PackingLot.id).where(PackingLot.order_id == lot.order_id, PackingLot.status != "In warehouse", PackingLot.status != "Dispatched").limit(1))
        jobs = db.scalars(select(ProductionJob).where(ProductionJob.order_ref == lot.order_id)).all()
        inspected_job_ids = set(db.scalars(select(QualityInspection.job_id).join(ProductionJob, QualityInspection.job_id == ProductionJob.id).where(ProductionJob.order_ref == lot.order_id).distinct()).all())
        all_jobs_inspected = all(job.status == ProductionJobStatus.CANCELLED or job.id in inspected_job_ids for job in jobs)
        if remaining is None and jobs and all_jobs_inspected and all(job.status in {ProductionJobStatus.COMPLETED, ProductionJobStatus.CANCELLED} for job in jobs):
            _append_order_event(db, lot.order_id, "Ready to Dispatch", "Inspected goods are packed and ready for dispatch.")
    db.commit()
    db.refresh(lot)
    return _lot_out(lot)


@router.get("/shipments", dependencies=[Depends(require_permission("dispatch"))])
def list_shipments(db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(Shipment).order_by(Shipment.dispatched_at.desc())).all()
    result = []
    for row in rows:
        order = db.get(BuyerOrder, row.order_id)
        buyer_id = order.buyer_id.removeprefix("user-") if order else ""
        buyer = db.get(User, int(buyer_id)) if buyer_id.isdigit() else None
        item = _shipment_out(row, order, buyer)
        lots = db.scalars(select(PackingLot).where(PackingLot.shipment_id == row.id)).all()
        item["rolls"] = len(lots)
        item["meters"] = sum(lot.quantity_meters for lot in lots)
        result.append(item)
    return {"shipments": result}


@router.post("/shipments", dependencies=[Depends(require_permission("dispatch"))], status_code=201)
def create_shipment(payload: DispatchIn, db: Session = Depends(get_db)) -> dict:
    lots = db.scalars(select(PackingLot).where(PackingLot.id.in_(payload.lot_ids)).with_for_update()).all()
    if len(lots) != len(set(payload.lot_ids)):
        raise HTTPException(404, {"detail": "One or more packing lots were not found", "code": "LOT_NOT_FOUND"})
    order_ids = {lot.order_id for lot in lots}
    if len(order_ids) != 1 or any(lot.status != "In warehouse" for lot in lots):
        raise HTTPException(409, {"detail": "Select warehouse-ready lots from one order", "code": "LOTS_NOT_READY"})
    order_id = next(iter(order_ids))
    order = db.get(BuyerOrder, order_id)
    shipment = Shipment(
        id=f"SHP-{_timestamp().strftime('%y%m%d%H%M%S')}-{token_hex(2).upper()}",
        order_id=order_id, courier=payload.courier,
        tracking_number=payload.tracking_number,
        destination=order.delivery_address if order else None,
        status="Booked",
    )
    db.add(shipment)
    db.flush()
    for lot in lots:
        lot.status = "Dispatched"
        lot.shipment_id = shipment.id
    db.flush()
    remaining_lots = db.scalar(select(PackingLot.id).where(PackingLot.order_id == order_id, PackingLot.status != "Dispatched").limit(1))
    dispatch_status = "Dispatched" if remaining_lots is None else "Partially Dispatched"
    _append_order_event(db, order_id, dispatch_status, f"Shipment {shipment.id} dispatched with {payload.courier}." + (f" Tracking number: {payload.tracking_number}." if payload.tracking_number else ""))
    db.commit()
    db.refresh(shipment)
    buyer_id = order.buyer_id.removeprefix("user-") if order else ""
    buyer = db.get(User, int(buyer_id)) if buyer_id.isdigit() else None
    output = _shipment_out(shipment, order, buyer)
    output["rolls"] = len(lots)
    output["meters"] = sum(lot.quantity_meters for lot in lots)
    return output


@router.patch("/shipments/{shipment_id}/status", dependencies=[Depends(require_permission("dispatch"))])
def update_shipment(shipment_id: str, payload: ShipmentStatusIn, db: Session = Depends(get_db)) -> dict:
    shipment = db.get(Shipment, shipment_id)
    if shipment is None:
        raise HTTPException(404, {"detail": "Shipment not found", "code": "SHIPMENT_NOT_FOUND"})
    allowed = {"Booked": {"In transit", "Delayed"}, "In transit": {"Delivered", "Delayed"}, "Delayed": {"In transit", "Delivered"}, "Delivered": set()}
    if payload.status not in allowed[shipment.status]:
        raise HTTPException(409, {"detail": f"Cannot move shipment from {shipment.status} to {payload.status}", "code": "INVALID_SHIPMENT_TRANSITION"})
    shipment.status = payload.status
    order = db.get(BuyerOrder, shipment.order_id)
    stamp = _timestamp()
    if payload.status == "Delivered":
        shipment.delivered_at = stamp
        remaining = db.scalar(select(Shipment.id).where(Shipment.order_id == shipment.order_id, Shipment.id != shipment.id, Shipment.status != "Delivered").limit(1))
        if remaining is None:
            _append_order_event(db, shipment.order_id, "Delivered", f"Shipment {shipment.id} was marked delivered.")
        else:
            note = f"Shipment {shipment.id} was delivered; other shipments for this order are still in progress."
            _append_order_event(db, shipment.order_id, "Partially Delivered", note)
    elif payload.status == "In transit":
        _append_order_event(db, shipment.order_id, "In Transit", f"Shipment {shipment.id} is in transit with {shipment.courier}.")
    else:
        note = f"Shipment {shipment.id} is delayed. Contact the administrator for details."
        if order:
            order.buyer_visible_updates = [*(order.buyer_visible_updates or []), {"sender": "admin", "message": note, "timestamp": stamp.isoformat()}]
    db.commit()
    buyer_id = order.buyer_id.removeprefix("user-") if order else ""
    buyer = db.get(User, int(buyer_id)) if buyer_id.isdigit() else None
    return _shipment_out(shipment, order, buyer)
