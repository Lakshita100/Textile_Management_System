"""Low-stock alerts — at most one open alert per yarn."""

from __future__ import annotations

from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StockAlert(Base):
    """Lifecycle: active → acknowledged → resolved. Append-only, never deleted."""

    __tablename__ = "stock_alerts"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'acknowledged', 'resolved')",
            name="ck_alert_status_valid",
        ),
        Index(
            "uq_stock_alerts_one_open_per_yarn",
            "yarn_id",
            unique=True,
            sqlite_where=text("status <> 'resolved'"),
            postgresql_where=text("status <> 'resolved'"),
        ),
        Index("ix_stock_alerts_status", "status"),
    )

    alert_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    yarn_id: Mapped[str] = mapped_column(String(32), ForeignKey("yarn_inventory.yarn_id"), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
    created_on: Mapped[date] = mapped_column(Date, nullable=False)
    updated_on: Mapped[date] = mapped_column(Date, nullable=False)
    acknowledged_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    resolved_on: Mapped[date | None] = mapped_column(Date, nullable=True)
