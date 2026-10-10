"""Quality inspections — Anand's Feature 03 contract, persisted (integration)."""

from __future__ import annotations

import enum
from datetime import date, datetime, timezone

from sqlalchemy import CheckConstraint, Date, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class InspectionOutcome(str, enum.Enum):
    """Anand's exact outcome vocabulary (never extended without his contract change)."""

    APPROVED = "Approved"
    REWORK = "Rework"
    REJECTED = "Rejected"


class QualityInspection(Base):
    """A single inspection event against a production job (roll/batch level).

    Contract notes:
    - ``machine_id`` / ``order_ref`` are denormalized from the linked job at creation
      time (machine is authoritative from the job; order cross-checked if supplied).
    - ``batch_no`` is derived as ``BATCH-<job_id>`` and ``roll_id`` as
      ``<batch_no>-R<n>`` (n = inspections already recorded for the job + 1),
      matching Anand's ``${batchNo}-R${count+1}`` formula.
    - ``accepted_qty_meters`` and ``outcome`` are always server-computed from the
      submitted measurements (Anand's rule); clients cannot forge them.
    """

    __tablename__ = "quality_inspections"
    __table_args__ = (
        CheckConstraint(
            "outcome IN ('Approved', 'Rework', 'Rejected')",
            name="ck_quality_inspections_outcome",
        ),
        CheckConstraint(
            "inspected_qty_meters > 0",
            name="ck_quality_inspections_inspected_qty_positive",
        ),
        CheckConstraint(
            "total_defect_count >= 0",
            name="ck_quality_inspections_defect_count_nonneg",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("production_jobs.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    machine_id: Mapped[int] = mapped_column(
        ForeignKey("machines.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    order_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    batch_no: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    roll_id: Mapped[str] = mapped_column(String(64), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    inspector_name: Mapped[str] = mapped_column(String(128), nullable=False)
    inspected_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    inspected_qty_meters: Mapped[float] = mapped_column(Float, nullable=False)
    accepted_qty_meters: Mapped[float] = mapped_column(Float, nullable=False)
    defects: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    total_defect_count: Mapped[int] = mapped_column(nullable=False, default=0)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="session-entry")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    job: Mapped["ProductionJob"] = relationship("ProductionJob")  # noqa: F821
    machine: Mapped["Machine"] = relationship("Machine")  # noqa: F821
