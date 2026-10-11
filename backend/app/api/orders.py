"""Persistent buyer order and inquiry endpoints backed by the configured DB."""

from __future__ import annotations

from datetime import datetime, timezone
from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import current_user, require_admin
from app.database import get_db
from app.models.auth import User, UserRole
from app.models.inquiry import BuyerInquiry
from app.models.order import BuyerOrder
from app.models.yarn import YarnInventory
from app.services.order_production import (
    OrderWorkflowError,
    consume_order_materials,
    material_snapshot,
    schedule_order_jobs,
)
from app.services.machines import MachineRuleError
from app.schemas.orders import (
    BuyerOrderCreateIn,
    BuyerOrderResponseIn,
    InquiryCreateIn,
    InquiryMessageIn,
    InquiryStatusIn,
    ManualOrderCreateIn,
    MaterialCheckIn,
    OrderReviewIn,
    OrderStatusIn,
)
from app.services.common import transaction

router = APIRouter(prefix="", tags=["buyer workspace"])


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _buyer_key(user: User) -> str:
    return f"user-{user.id}"


def _order_out(order: BuyerOrder) -> dict:
    return {
        "id": order.id, "buyerId": order.buyer_id, "buyerName": order.buyer_name,
        "companyName": order.company_name, "buyerEmail": order.buyer_email, "buyerPhone": order.buyer_phone,
        "source": order.source, "productCategory": order.product_category, "productName": order.product_name,
        "productCode": order.product_code, "yarnId": order.yarn_id, "yarnType": order.yarn_type,
        "yarnSubtype": order.yarn_subtype, "materialComposition": order.material_composition,
        "technicalSpecifications": order.technical_specifications, "denierCount": order.denier_count,
        "shade": order.shade, "specialRequirements": order.special_requirements,
        "quantity": order.quantity, "unit": order.unit, "priority": order.priority,
        "requestedDeliveryDate": order.requested_delivery_date, "deliveryAddress": order.delivery_address,
        "deliveryInstructions": order.delivery_instructions, "targetPrice": order.target_price,
        "buyerNotes": order.buyer_notes, "technicalNotes": order.technical_notes,
        "commercialNotes": order.commercial_notes, "status": order.status,
        "materialAvailability": order.material_availability, "reviewHistory": order.review_history or [],
        "buyerVisibleUpdates": order.buyer_visible_updates or [], "statusHistory": order.status_history or [],
        "productionJobId": order.production_job_id,
        "createdAt": order.created_at.isoformat(), "updatedAt": order.updated_at.isoformat(),
        "submittedAt": order.submitted_at.isoformat(),
    }


def _inquiry_out(inquiry: BuyerInquiry) -> dict:
    return {
        "id": inquiry.id, "buyerId": inquiry.buyer_id, "orderId": inquiry.order_id,
        "subject": inquiry.subject, "type": inquiry.type, "status": inquiry.status,
        "createdAt": inquiry.created_at.isoformat(), "updatedAt": inquiry.updated_at.isoformat(),
        "messages": inquiry.messages or [],
    }


def _can_read_order(order: BuyerOrder, user: User) -> bool:
    return user.role == UserRole.ADMIN.value or (
        user.role == UserRole.BUYER.value and order.buyer_id == _buyer_key(user)
    )


@router.get("/orders")
def list_orders(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[dict]:
    if user.role == UserRole.ADMIN.value:
        items = db.scalars(select(BuyerOrder).order_by(BuyerOrder.submitted_at.desc())).all()
    elif user.role == UserRole.BUYER.value:
        items = db.scalars(select(BuyerOrder).where(BuyerOrder.buyer_id == _buyer_key(user)).order_by(BuyerOrder.submitted_at.desc())).all()
    else:
        raise HTTPException(403, {"message": "Buyer or administrator access required.", "code": "WORKSPACE_FORBIDDEN"})
    return [_order_out(item) for item in items]


@router.post("/orders", status_code=201)
def create_order(payload: BuyerOrderCreateIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    if user.role != UserRole.BUYER.value:
        raise HTTPException(403, {"message": "Only buyer accounts can submit buyer portal orders.", "code": "BUYER_ONLY"})
    if not user.company or not user.phone or not user.address or not user.city or not user.country or not user.postal_code:
        raise HTTPException(400, {"message": "Complete your buyer profile before submitting an order.", "code": "BUYER_PROFILE_INCOMPLETE"})
    if payload.yarnId:
        yarn = db.get(YarnInventory, payload.yarnId)
        if yarn is None:
            raise HTTPException(404, {"message": "The selected yarn is no longer in inventory.", "code": "YARN_NOT_FOUND"})
        if payload.productCategory != "Yarn":
            raise HTTPException(400, {"message": "A yarn inventory row can only be selected for a yarn order.", "code": "INVALID_YARN_SELECTION"})
    timestamp = _now()
    order = BuyerOrder(
        id=f"ORD-{timestamp.strftime('%y%m%d%H%M%S')}-{token_hex(2).upper()}",
        buyer_id=_buyer_key(user), buyer_name=user.full_name, company_name=user.company,
        buyer_email=user.email, buyer_phone=user.phone, source="Buyer Portal",
        product_category=payload.productCategory, product_name=payload.productName,
        product_code=payload.productCode, yarn_id=payload.yarnId, yarn_type=payload.yarnType,
        yarn_subtype=payload.yarnSubtype, material_composition=payload.materialComposition,
        technical_specifications=payload.technicalSpecifications, denier_count=payload.denierCount,
        shade=payload.shade, special_requirements=payload.specialRequirements,
        quantity=payload.quantity, unit=payload.unit, priority=payload.priority,
        requested_delivery_date=payload.requestedDeliveryDate, delivery_address=payload.deliveryAddress,
        delivery_instructions=payload.deliveryInstructions, target_price=payload.targetPrice,
        buyer_notes=payload.buyerNotes, technical_notes=payload.technicalNotes,
        commercial_notes=payload.commercialNotes, status="Submitted", material_availability=None,
        review_history=[], buyer_visible_updates=[],
        status_history=[{"status": "Submitted", "note": "Order submitted and awaiting administrator review.", "timestamp": timestamp.isoformat()}],
        created_at=timestamp, updated_at=timestamp, submitted_at=timestamp,
    )
    with transaction(db):
        db.add(order)
        db.flush()
    db.refresh(order)
    return _order_out(order)


@router.post("/orders/manual", status_code=201)
def create_manual_order(payload: ManualOrderCreateIn, user: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    if payload.yarnId:
        yarn = db.get(YarnInventory, payload.yarnId)
        if yarn is None:
            raise HTTPException(404, {"message": "The selected yarn is no longer in inventory.", "code": "YARN_NOT_FOUND"})
        if payload.productCategory != "Yarn":
            raise HTTPException(400, {"message": "A yarn inventory row can only be selected for a yarn order.", "code": "INVALID_YARN_SELECTION"})
    timestamp = _now()
    order = BuyerOrder(
        id=f"ORD-{timestamp.strftime('%y%m%d%H%M%S')}-{token_hex(2).upper()}",
        buyer_id=f"manual-{user.id}", buyer_name=payload.buyerName, company_name=payload.companyName,
        buyer_email=payload.buyerEmail, buyer_phone=payload.buyerPhone, source="Manual",
        product_category=payload.productCategory, product_name=payload.productName,
        product_code=payload.productCode, yarn_id=payload.yarnId, yarn_type=payload.yarnType,
        yarn_subtype=payload.yarnSubtype, material_composition=payload.materialComposition,
        technical_specifications=payload.technicalSpecifications, denier_count=payload.denierCount,
        shade=payload.shade, special_requirements=payload.specialRequirements,
        quantity=payload.quantity, unit=payload.unit, priority=payload.priority,
        requested_delivery_date=payload.requestedDeliveryDate, delivery_address=payload.deliveryAddress,
        delivery_instructions=payload.deliveryInstructions, target_price=payload.targetPrice,
        buyer_notes=payload.buyerNotes, technical_notes=payload.technicalNotes,
        commercial_notes=payload.commercialNotes,
        status="Submitted", review_history=[], buyer_visible_updates=[], status_history=[{
            "status": "Submitted", "note": "Manual order received by sales desk.", "timestamp": timestamp.isoformat(),
        }], created_at=timestamp, updated_at=timestamp, submitted_at=timestamp,
    )
    with transaction(db):
        db.add(order)
        db.flush()
    db.refresh(order)
    return _order_out(order)


@router.get("/orders/{order_id}")
def get_order(order_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    order = db.get(BuyerOrder, order_id)
    if order is None or not _can_read_order(order, user):
        raise HTTPException(404, {"message": "Order not found.", "code": "ORDER_NOT_FOUND"})
    return _order_out(order)


@router.post("/orders/{order_id}/material-check")
def check_order_material(order_id: str, payload: MaterialCheckIn, user: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    order = db.get(BuyerOrder, order_id)
    if order is None:
        raise HTTPException(404, {"message": "Order not found.", "code": "ORDER_NOT_FOUND"})
    recipe_check = False
    if order.yarn_id:
        yarn = db.get(YarnInventory, order.yarn_id)
        if yarn is None:
            raise HTTPException(409, {"message": "The order's linked yarn is no longer in inventory.", "code": "YARN_NOT_FOUND"})
        def normalized_unit(value: str) -> str:
            value = value.strip().lower()
            return "kg" if value in {"kg", "kgs", "kilogram", "kilograms"} else "m" if value in {"m", "meter", "meters", "metre", "metres"} else value
        if normalized_unit(order.unit) != normalized_unit(yarn.unit):
            raise HTTPException(409, {"message": "Order and inventory units do not match.", "code": "UNIT_MISMATCH"})
        available, unit, source = float(yarn.current_stock), yarn.unit, "Raw material inventory"
        note = payload.notes or f"Live stock read from inventory row {yarn.yarn_id}."
    elif (order.product_category or "").strip().lower() == "fabric":
        try:
            order.material_availability = material_snapshot(db, order)
        except OrderWorkflowError as exc:
            raise HTTPException(409, {"message": str(exc), "code": exc.code}) from exc
        order.material_availability["checkedBy"] = user.full_name
        recipe_check = True
    else:
        if payload.availableQuantity is None or not payload.unit:
            raise HTTPException(400, {"message": "This order has no linked stock row; provide an explicit review quantity and unit.", "code": "MATERIAL_ROW_REQUIRED"})
        available, unit, source, note = payload.availableQuantity, payload.unit, "Ram demo check", payload.notes
    timestamp = _now()
    if recipe_check:
        order.material_availability["checkedAt"] = timestamp.isoformat()
    else:
        order.material_availability = {
            "orderId": order.id,
            "status": "Available" if available >= order.quantity else "Partially Available" if available > 0 else "Insufficient Stock",
            "availableQuantity": available, "requiredQuantity": order.quantity,
            "shortageQuantity": max(0, order.quantity - available), "unit": unit,
            "notes": note, "checkedBy": user.full_name, "checkedAt": timestamp.isoformat(), "source": source,
        }
    order.updated_at = timestamp
    with transaction(db):
        db.flush()
    db.refresh(order)
    return _order_out(order)


@router.patch("/orders/{order_id}/status")
def set_order_status(order_id: str, payload: OrderStatusIn, user: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    order = db.get(BuyerOrder, order_id)
    if order is None:
        raise HTTPException(404, {"message": "Order not found.", "code": "ORDER_NOT_FOUND"})
    timestamp = _now()
    if payload.status != order.status:
        order.status = payload.status
        order.status_history = [*(order.status_history or []), {
            "status": payload.status, "note": payload.note or f"Order status updated to {payload.status}.",
            "timestamp": timestamp.isoformat(),
        }]
    order.updated_at = timestamp
    with transaction(db):
        db.flush()
    db.refresh(order)
    return _order_out(order)


@router.post("/orders/{order_id}/review")
def review_order(order_id: str, payload: OrderReviewIn, user: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    order = db.scalar(select(BuyerOrder).where(BuyerOrder.id == order_id).with_for_update())
    if order is None:
        raise HTTPException(404, {"message": "Order not found.", "code": "ORDER_NOT_FOUND"})
    already_consumed = bool(order.material_availability and order.material_availability.get("consumedAt"))
    if payload.action == "approved" and already_consumed and order.production_job_id is not None:
        return _order_out(order)
    if payload.action == "approved" and (not order.material_availability or order.material_availability.get("status") != "Available"):
        raise HTTPException(409, {"message": "An order requires an available material check before approval.", "code": "MATERIAL_CHECK_REQUIRED"})
    if payload.action == "approved" and order.material_availability.get("source") not in {"Raw material inventory", "Fabric recipe inventory"}:
        raise HTTPException(409, {"message": "Approval requires stock checked against live inventory or a fabric recipe. Manual/demo quantities cannot be consumed.", "code": "LIVE_MATERIAL_CHECK_REQUIRED"})
    if payload.action == "rejected" and not payload.note:
        raise HTTPException(400, {"message": "A rejection reason is required.", "code": "REJECTION_NOTE_REQUIRED"})
    if payload.action in {"clarification-requested", "delivery-revision-requested"} and not payload.buyerMessage:
        raise HTTPException(400, {"message": "A buyer-visible message is required.", "code": "BUYER_MESSAGE_REQUIRED"})
    timestamp = _now()
    try:
        with transaction(db):
            jobs = schedule_order_jobs(db, order) if payload.action == "approved" else []
            consumed = consume_order_materials(db, order) if payload.action == "approved" and not already_consumed else []
            status = ("Scheduled" if jobs else "Accepted") if payload.action == "approved" else payload.nextStatus or order.status
            buyer_message = payload.buyerMessage
            if payload.action == "approved":
                buyer_message = (
                    f"Your order has been approved and {len(jobs)} production step(s) have been scheduled."
                    if jobs else "Your order has been approved and stock has been allocated for fulfillment."
                )
                order.production_job_id = jobs[0].id if jobs else None
                if order.material_availability is not None:
                    order.material_availability = {
                        **order.material_availability,
                        "consumedMaterials": order.material_availability.get("consumedMaterials", []) if already_consumed else consumed,
                        "consumedAt": order.material_availability.get("consumedAt") if already_consumed else timestamp.isoformat(),
                    }
            order.review_history = [*(order.review_history or []), {
                "action": payload.action, "reviewer": payload.reviewer or user.full_name,
                "note": payload.note, "timestamp": timestamp.isoformat(),
            }]
            if buyer_message:
                order.buyer_visible_updates = [*(order.buyer_visible_updates or []), {
                    "message": buyer_message, "sender": "admin", "timestamp": timestamp.isoformat(),
                }]
            if status != order.status:
                if payload.action == "approved":
                    order.status_history = [*(order.status_history or []), {
                        "status": "Accepted", "note": "Order approved by the administrator.",
                        "timestamp": timestamp.isoformat(),
                    }]
                order.status = status
                order.status_history = [*(order.status_history or []), {
                    "status": status, "note": buyer_message or f"Order status updated to {status}.",
                    "timestamp": timestamp.isoformat(),
                }]
            order.updated_at = timestamp
            db.flush()
    except OrderWorkflowError as exc:
        raise HTTPException(409, {"message": str(exc), "code": exc.code}) from exc
    except MachineRuleError as exc:
        raise HTTPException(409, {"message": str(exc), "code": exc.code}) from exc
    db.refresh(order)
    return _order_out(order)


@router.post("/orders/{order_id}/buyer-response")
def respond_to_order(order_id: str, payload: BuyerOrderResponseIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    if user.role != UserRole.BUYER.value:
        raise HTTPException(403, {"message": "Buyer access required.", "code": "BUYER_ONLY"})
    order = db.get(BuyerOrder, order_id)
    if order is None or order.buyer_id != _buyer_key(user):
        raise HTTPException(404, {"message": "Order not found.", "code": "ORDER_NOT_FOUND"})
    timestamp = _now()
    order.status = "Under Review"
    order.status_history = [*(order.status_history or []), {
        "status": "Under Review", "note": "Buyer response received; order returned to review.",
        "timestamp": timestamp.isoformat(),
    }]
    order.buyer_visible_updates = [*(order.buyer_visible_updates or []), {
        "message": payload.message, "sender": "buyer", "timestamp": timestamp.isoformat(),
    }]
    order.review_history = [*(order.review_history or []), {
        "action": "buyer-response", "reviewer": user.full_name,
        "note": "Buyer responded to an order clarification.", "timestamp": timestamp.isoformat(),
    }]
    order.updated_at = timestamp
    with transaction(db):
        db.flush()
    db.refresh(order)
    return _order_out(order)


@router.get("/inquiries")
def list_inquiries(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[dict]:
    if user.role == UserRole.ADMIN.value:
        items = db.scalars(select(BuyerInquiry).order_by(BuyerInquiry.created_at.desc())).all()
    elif user.role == UserRole.BUYER.value:
        items = db.scalars(select(BuyerInquiry).where(BuyerInquiry.buyer_id == _buyer_key(user)).order_by(BuyerInquiry.created_at.desc())).all()
    else:
        raise HTTPException(403, {"message": "Buyer or administrator access required.", "code": "WORKSPACE_FORBIDDEN"})
    return [_inquiry_out(item) for item in items]


@router.post("/inquiries", status_code=201)
def create_inquiry(payload: InquiryCreateIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    if user.role != UserRole.BUYER.value:
        raise HTTPException(403, {"message": "Buyer access required.", "code": "BUYER_ONLY"})
    order = db.get(BuyerOrder, payload.orderId)
    if order is None or order.buyer_id != _buyer_key(user):
        raise HTTPException(404, {"message": "Order not found.", "code": "ORDER_NOT_FOUND"})
    timestamp = _now()
    inquiry = BuyerInquiry(
        id=f"INQ-{timestamp.strftime('%y%m%d%H%M%S')}-{token_hex(2).upper()}",
        buyer_id=_buyer_key(user), order_id=order.id, subject=payload.subject, type=payload.type,
        status="Open", messages=[{"sender": "buyer", "text": payload.message, "timestamp": timestamp.isoformat()}],
        created_at=timestamp, updated_at=timestamp,
    )
    with transaction(db):
        db.add(inquiry)
        db.flush()
    db.refresh(inquiry)
    return _inquiry_out(inquiry)


@router.post("/inquiries/{inquiry_id}/messages")
def add_inquiry_message(inquiry_id: str, payload: InquiryMessageIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    inquiry = db.get(BuyerInquiry, inquiry_id)
    if inquiry is None or (user.role != UserRole.ADMIN.value and inquiry.buyer_id != _buyer_key(user)):
        raise HTTPException(404, {"message": "Inquiry not found.", "code": "INQUIRY_NOT_FOUND"})
    timestamp = _now()
    sender = "admin" if user.role == UserRole.ADMIN.value else "buyer"
    inquiry.messages = [*(inquiry.messages or []), {"sender": sender, "text": payload.message, "timestamp": timestamp.isoformat()}]
    inquiry.status = "Awaiting Response" if sender == "admin" else "Open"
    inquiry.updated_at = timestamp
    with transaction(db):
        db.flush()
    db.refresh(inquiry)
    return _inquiry_out(inquiry)


@router.patch("/inquiries/{inquiry_id}/status")
def set_inquiry_status(inquiry_id: str, payload: InquiryStatusIn, user: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    inquiry = db.get(BuyerInquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(404, {"message": "Inquiry not found.", "code": "INQUIRY_NOT_FOUND"})
    if payload.status not in {"Open", "Awaiting Response", "Resolved"}:
        raise HTTPException(400, {"message": "Unknown inquiry status.", "code": "INVALID_STATUS"})
    inquiry.status = payload.status
    inquiry.updated_at = _now()
    with transaction(db):
        db.flush()
    db.refresh(inquiry)
    return _inquiry_out(inquiry)
