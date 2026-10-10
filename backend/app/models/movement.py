"""Stock movements — append-only audit trail of every stock change."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StockMovement(Base):
    """One stock in or consumption entry. Never rewritten; corrections append reversals."""

    __tablename__ = "stock_movements"
    __table_args__ = (
        CheckConstraint(
            "movement_type IN ('Stock In', 'Consumption')",
            name="ck_movement_type_valid",
        ),
        CheckConstraint("quantity > 0", name="ck_movement_quantity_positive"),
        CheckConstraint("previous_quantity >= 0", name="ck_movement_previous_non_negative"),
        CheckConstraint("stock_after >= 0", name="ck_movement_stock_after_non_negative"),
        Index("ix_stock_movements_yarn_id", "yarn_id"),
        Index("ix_stock_movements_movement_date", "movement_date"),
    )

    movement_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    yarn_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("yarn_inventory.yarn_id"), nullable=False
    )
    movement_type: Mapped[str] = mapped_column(String(16), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False)
    movement_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    supplier_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    previous_quantity: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False)
    stock_after: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False)
    reversal_of: Mapped[str | None] = mapped_column(
        String(16), ForeignKey("stock_movements.movement_id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
