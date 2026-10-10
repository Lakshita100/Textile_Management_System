"""Yarn inventory records."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class YarnInventory(Base):
    """One yarn record. `current_stock` can never go below zero (DB CHECK)."""

    __tablename__ = "yarn_inventory"
    __table_args__ = (
        CheckConstraint("current_stock >= 0", name="ck_yarn_current_stock_non_negative"),
        CheckConstraint("minimum_stock_level >= 0", name="ck_yarn_minimum_stock_non_negative"),
        CheckConstraint("unit_cost >= 0", name="ck_yarn_unit_cost_non_negative"),
        Index("ix_yarn_inventory_category", "category"),
        Index("ix_yarn_inventory_supplier_source", "supplier_source"),
        Index("ix_yarn_inventory_product_code", "product_code"),
        Index("ix_yarn_inventory_colour_shade", "colour_shade"),
        Index("ix_yarn_inventory_inventory_stage", "inventory_stage"),
        Index("ix_yarn_inventory_updated_at", "updated_at"),
    )

    yarn_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    yarn_name: Mapped[str] = mapped_column(String(200), nullable=False)
    product_code: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    material_composition: Mapped[str] = mapped_column(String(200), nullable=False)
    colour_shade: Mapped[str] = mapped_column(String(100), nullable=False)
    denier_specification: Mapped[str] = mapped_column(String(100), nullable=False)
    current_stock: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False)
    unit: Mapped[str] = mapped_column(String(16), nullable=False, default="kg")
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 4, asdecimal=False), nullable=False)
    supplier_source: Mapped[str] = mapped_column(String(200), nullable=False)
    minimum_stock_level: Mapped[float] = mapped_column(Numeric(14, 3, asdecimal=False), nullable=False)
    storage_location: Mapped[str] = mapped_column(String(100), nullable=False)
    batch_number: Mapped[str] = mapped_column(String(64), nullable=False)
    inventory_stage: Mapped[str] = mapped_column(String(50), nullable=False)
    image_file: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
