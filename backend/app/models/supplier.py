"""Supplier records, supplier↔yarn mappings and supplier change audit trail."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Supplier(Base):
    """Supplier master data. Contact fields stay empty when unknown — never invented."""

    __tablename__ = "suppliers"
    __table_args__ = (
        CheckConstraint("price_per_kg IS NULL OR price_per_kg >= 0", name="ck_supplier_price_non_negative"),
        CheckConstraint("min_order_qty IS NULL OR min_order_qty >= 0", name="ck_supplier_moq_non_negative"),
        CheckConstraint("lead_time_days IS NULL OR lead_time_days >= 0", name="ck_supplier_lead_time_non_negative"),
        Index(
            "uq_suppliers_company_name_lower",
            text("lower(company_name)"),
            unique=True,
        ),
    )

    supplier_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False, unique=False)
    contact_person: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    address: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    price_per_kg: Mapped[float | None] = mapped_column(Numeric(12, 4, asdecimal=False), nullable=True)
    min_order_qty: Mapped[float | None] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=True)
    lead_time_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    categories: Mapped[list[SupplierCategory]] = relationship(
        back_populates="supplier",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    product_codes: Mapped[list[SupplierProductCode]] = relationship(
        back_populates="supplier",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class SupplierCategory(Base):
    """Supplier → yarn category mapping."""

    __tablename__ = "supplier_categories"
    __table_args__ = (
        CheckConstraint("length(category) > 0", name="ck_supplier_category_not_empty"),
    )

    supplier_id: Mapped[str] = mapped_column(
        String(16), ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), primary_key=True
    )
    category: Mapped[str] = mapped_column(String(100), primary_key=True)

    supplier: Mapped[Supplier] = relationship(back_populates="categories")


class SupplierProductCode(Base):
    """Supplier → yarn product code mapping."""

    __tablename__ = "supplier_product_codes"
    __table_args__ = (
        CheckConstraint("length(product_code) > 0", name="ck_supplier_product_code_not_empty"),
    )

    supplier_id: Mapped[str] = mapped_column(
        String(16), ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), primary_key=True
    )
    product_code: Mapped[str] = mapped_column(String(64), primary_key=True)

    supplier: Mapped[Supplier] = relationship(back_populates="product_codes")


class SupplierChangeHistory(Base):
    """Audit trail for reassigning a yarn to a different supplier (append-only)."""

    __tablename__ = "yarn_supplier_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    yarn_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("yarn_inventory.yarn_id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_supplier: Mapped[str] = mapped_column(String(200), nullable=False)
    new_supplier: Mapped[str] = mapped_column(String(200), nullable=False)
    changed_by: Mapped[str] = mapped_column(String(80), nullable=False, default="inventory-operator")
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    changed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
