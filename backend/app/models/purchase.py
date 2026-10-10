"""Purchase request drafts — never purchase orders, never sent anywhere."""

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


class PurchaseRequest(Base):
    """A replenishment request draft. Only statuses allowed: draft, submitted, cancelled.

    `document_type` is constrained to 'purchase_request': this system never
    creates or claims to create confirmed purchase orders.
    """

    __tablename__ = "purchase_requests"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_request_quantity_positive"),
        CheckConstraint("buffer_quantity >= 0", name="ck_request_buffer_non_negative"),
        CheckConstraint("shortage_quantity >= 0", name="ck_request_shortage_non_negative"),
        CheckConstraint(
            "estimated_unit_cost IS NULL OR estimated_unit_cost >= 0",
            name="ck_request_unit_cost_non_negative",
        ),
        CheckConstraint(
            "estimated_total_cost IS NULL OR estimated_total_cost >= 0",
            name="ck_request_total_cost_non_negative",
        ),
        CheckConstraint(
            "min_order_qty IS NULL OR min_order_qty >= 0",
            name="ck_request_moq_non_negative",
        ),
        CheckConstraint(
            "status IN ('draft', 'submitted', 'cancelled')",
            name="ck_request_status_valid",
        ),
        CheckConstraint(
            "document_type = 'purchase_request'",
            name="ck_request_document_type",
        ),
        Index("ix_purchase_requests_yarn_id", "yarn_id"),
        Index("ix_purchase_requests_status", "status"),
    )

    request_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    document_type: Mapped[str] = mapped_column(String(32), nullable=False, default="purchase_request")
    yarn_id: Mapped[str] = mapped_column(String(32), ForeignKey("yarn_inventory.yarn_id"), nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(
        String(16), ForeignKey("suppliers.supplier_id"), nullable=True
    )
    supplier_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False)
    unit: Mapped[str] = mapped_column(String(16), nullable=False, default="kg")
    buffer_quantity: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False, default=0)
    shortage_quantity: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False)
    estimated_unit_cost: Mapped[float | None] = mapped_column(
        Numeric(12, 4, asdecimal=False), nullable=True
    )
    estimated_total_cost: Mapped[float | None] = mapped_column(
        Numeric(14, 4, asdecimal=False), nullable=True
    )
    min_order_qty: Mapped[float | None] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=True)
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
