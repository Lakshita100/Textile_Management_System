"""Employee attendance check-in/out and admin attendance register."""

from __future__ import annotations

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.auth import current_user, require_admin, require_permission
from app.config import settings
from app.database import get_db
from app.models.auth import AttendanceRecord, User
from app.schemas.auth import AttendanceOut

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"],
    dependencies=[Depends(require_permission("attendance"))],
)


def _record_out(record: AttendanceRecord, user: User) -> AttendanceOut:
    return AttendanceOut(
        id=record.id,
        user_id=user.id,
        employee_name=user.full_name,
        login_id=user.login_id or f"EMP-{user.id:06d}",
        work_date=record.work_date,
        check_in_at=record.check_in_at,
        check_out_at=record.check_out_at,
    )


def _employee_today(db: Session, user: User) -> AttendanceRecord | None:
    local_today = datetime.now(ZoneInfo(settings.WORK_TIMEZONE)).date()
    return (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == user.id, AttendanceRecord.work_date == local_today)
        .first()
    )


@router.get("/me", response_model=AttendanceOut | None)
def my_attendance(user: User = Depends(current_user), db: Session = Depends(get_db)) -> AttendanceOut | None:
    record = _employee_today(db, user)
    return _record_out(record, user) if record else None


@router.post("/check-in", response_model=AttendanceOut, status_code=201)
def check_in(user: User = Depends(current_user), db: Session = Depends(get_db)) -> AttendanceOut:
    local_today = datetime.now(ZoneInfo(settings.WORK_TIMEZONE)).date()
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == user.id,
        AttendanceRecord.work_date == local_today,
    ).first()
    if record:
        raise HTTPException(409, {"message": "You have already checked in today.", "code": "ALREADY_CHECKED_IN"})
    record = AttendanceRecord(user_id=user.id, work_date=local_today, check_in_at=datetime.now(timezone.utc))
    db.add(record)
    db.commit()
    db.refresh(record)
    return _record_out(record, user)


@router.post("/check-out", response_model=AttendanceOut)
def check_out(user: User = Depends(current_user), db: Session = Depends(get_db)) -> AttendanceOut:
    record = _employee_today(db, user)
    if record is None:
        raise HTTPException(409, {"message": "Check in before checking out.", "code": "NOT_CHECKED_IN"})
    if record.check_out_at is not None:
        raise HTTPException(409, {"message": "You have already checked out today.", "code": "ALREADY_CHECKED_OUT"})
    record.check_out_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return _record_out(record, user)


@router.get("/records", response_model=list[AttendanceOut], dependencies=[Depends(require_admin)])
def attendance_register(
    work_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[AttendanceOut]:
    query = db.query(AttendanceRecord, User).join(User, User.id == AttendanceRecord.user_id)
    if work_date:
        query = query.filter(AttendanceRecord.work_date == work_date)
    records = query.order_by(AttendanceRecord.work_date.desc(), AttendanceRecord.check_in_at.desc()).limit(500).all()
    return [_record_out(record, user) for record, user in records]
