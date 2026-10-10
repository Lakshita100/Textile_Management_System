"""Production jobs, lifecycle events and downtime (Feature 02)."""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ProductionJobStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ProductionJob(Base):
    """An assignment of production work to a machine for an external customer order.

    ``order_ref`` is an external reference to Ram's Order module (contract pending).
    ``material_spec`` is a free-text fabric/material description (Maahi contract pending).
    """

    __tablename__ = "production_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="RESTRICT"), nullable=False, index=True)
    order_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    material_spec: Mapped[str] = mapped_column(String(255), nullable=False)
    required_process: Mapped[str] = mapped_column(String(64), nullable=False)
    planned_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    actual_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_unit: Mapped[str] = mapped_column(String(32), nullable=False, default="meters")
    shift: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[ProductionJobStatus] = mapped_column(
        Enum(ProductionJobStatus, name="production_job_status", native_enum=False, length=20),
        nullable=False,
        default=ProductionJobStatus.PLANNED,
        index=True,
    )
    planned_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    planned_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    machine: Mapped["Machine"] = relationship("Machine")  # noqa: F821
    status_events: Mapped[list[ProductionJobStatusEvent]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="ProductionJobStatusEvent.created_at.desc()"
    )
    downtimes: Mapped[list[MachineDowntime]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )

    @property
    def completion_percent(self) -> float:
        if self.planned_quantity <= 0:
            return 0.0
        return round(min(100.0, (self.actual_quantity / self.planned_quantity) * 100.0), 2)


class ProductionJobStatusEvent(Base):
    __tablename__ = "production_job_status_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("production_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status: Mapped[ProductionJobStatus | None] = mapped_column(
        Enum(ProductionJobStatus, name="production_job_status", native_enum=False, length=20), nullable=True
    )
    to_status: Mapped[ProductionJobStatus] = mapped_column(
        Enum(ProductionJobStatus, name="production_job_status", native_enum=False, length=20), nullable=False
    )
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    job: Mapped[ProductionJob] = relationship(back_populates="status_events")


class MachineDowntime(Base):
    __tablename__ = "machine_downtime_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(
        ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[int | None] = mapped_column(
        ForeignKey("production_jobs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    machine: Mapped["Machine"] = relationship("Machine")  # noqa: F821
    job: Mapped[ProductionJob | None] = relationship(back_populates="downtimes")

    @property
    def duration_minutes(self) -> float | None:
        if self.ended_at is None:
            return None
        start = self.started_at
        end = self.ended_at
        if start.tzinfo is None and end.tzinfo is not None:
            start = start.replace(tzinfo=end.tzinfo)
        elif end.tzinfo is None and start.tzinfo is not None:
            end = end.replace(tzinfo=start.tzinfo)
        return round((end - start).total_seconds() / 60.0, 2)
