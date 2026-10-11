"""Persisted packing lots and outbound shipments."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PackingLot(Base):
    __tablename__ = "packing_lots"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey("quality_inspections.id", ondelete="RESTRICT"), unique=True, nullable=False)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, index=True)
    roll_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    batch_no: Mapped[str] = mapped_column(String(64), nullable=False)
    machine_code: Mapped[str] = mapped_column(String(40), nullable=False)
    quality_outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity_meters: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="Pending packing", index=True)
    pack_type: Mapped[str | None] = mapped_column(String(20))
    cartons: Mapped[int | None] = mapped_column(Integer)
    packed_by: Mapped[str | None] = mapped_column(String(120))
    packed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    shipment_id: Mapped[str | None] = mapped_column(String(40), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, index=True)
    courier: Mapped[str] = mapped_column(String(120), nullable=False)
    tracking_number: Mapped[str | None] = mapped_column(String(120))
    destination: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="Booked", index=True)
    dispatched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
