"""Quality inspections — real records (machines + production jobs linked)."""

from __future__ import annotations

import enum
from datetime import date, datetime, timezone

from sqlalchemy import JSON, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class InspectionOutcome(str, enum.Enum):
    APPROVED = "Approved"
    REWORK = "Rework"
    REJECTED = "Rejected"


class QualityInspection(Base):
    __tablename__ = "quality_inspections"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    roll_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    batch_no: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    order_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    machine_id: Mapped[int] = mapped_column(
        ForeignKey("machines.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    inspector_name: Mapped[str] = mapped_column(String(120), nullable=False)
    inspected_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    inspected_qty_meters: Mapped[float] = mapped_column(Float, nullable=False)
    accepted_qty_meters: Mapped[float] = mapped_column(Float, nullable=False)
    total_defect_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # [{ "type": str, "count": int, "severity": "Low"|"Medium"|"High", "remarks": str|None }]
    defects: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    outcome: Mapped[InspectionOutcome] = mapped_column(
        Enum(InspectionOutcome, name="inspection_outcome", native_enum=False, length=20),
        nullable=False,
        default=InspectionOutcome.APPROVED,
        index=True,
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    # "demo-seed" = dev fixture, "session-entry" = recorded in the running app
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="session-entry")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    machine: Mapped["Machine"] = relationship("Machine")  # noqa: F821
