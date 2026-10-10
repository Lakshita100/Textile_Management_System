"""Machine master data and status history (Feature 02)."""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MachineStatus(str, enum.Enum):
    """Operational status of a machine. Distinct from assignment availability."""

    RUNNING = "RUNNING"
    IDLE = "IDLE"
    MAINTENANCE = "MAINTENANCE"


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    machine_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    # Comma-separated supported processes, e.g. "WEAVING,DYEING" (kept simple for MVP)
    supported_processes: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    # Material/fabric types this machine can handle, comma-separated, e.g. "COTTON,POLYESTER"
    compatible_materials: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    capacity_value: Mapped[float] = mapped_column(Float, nullable=False)
    capacity_unit: Mapped[str] = mapped_column(String(32), nullable=False, default="meters/day")
    status: Mapped[MachineStatus] = mapped_column(
        Enum(MachineStatus, name="machine_status", native_enum=False, length=20),
        nullable=False,
        default=MachineStatus.IDLE,
        index=True,
    )
    status_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status_changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    status_events: Mapped[list[MachineStatusEvent]] = relationship(
        back_populates="machine", cascade="all, delete-orphan", order_by="MachineStatusEvent.created_at.desc()"
    )

    @property
    def process_list(self) -> list[str]:
        return [p.strip().upper() for p in self.supported_processes.split(",") if p.strip()]

    @property
    def material_list(self) -> list[str]:
        return [m.strip().upper() for m in self.compatible_materials.split(",") if m.strip()]


class MachineStatusEvent(Base):
    __tablename__ = "machine_status_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(
        ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status: Mapped[MachineStatus | None] = mapped_column(
        Enum(MachineStatus, name="machine_status", native_enum=False, length=20), nullable=True
    )
    to_status: Mapped[MachineStatus] = mapped_column(
        Enum(MachineStatus, name="machine_status", native_enum=False, length=20), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    machine: Mapped[Machine] = relationship(back_populates="status_events")
