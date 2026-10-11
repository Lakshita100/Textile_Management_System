"""Buyer orders and fabric recipes stored in the configured database."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BuyerOrder(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    buyer_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    buyer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    company_name: Mapped[str] = mapped_column(String(150), nullable=False)
    buyer_email: Mapped[str | None] = mapped_column(String(255))
    buyer_phone: Mapped[str | None] = mapped_column(String(50))
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    product_category: Mapped[str | None] = mapped_column(String(100))
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    product_code: Mapped[str | None] = mapped_column(String(64))
    yarn_type: Mapped[str | None] = mapped_column(String(100))
    yarn_subtype: Mapped[str | None] = mapped_column(String(100))
    material_composition: Mapped[str] = mapped_column(String(255), nullable=False)
    technical_specifications: Mapped[str | None] = mapped_column(Text)
    denier_count: Mapped[str | None] = mapped_column(String(100))
    shade: Mapped[str | None] = mapped_column(String(100))
    special_requirements: Mapped[str | None] = mapped_column(Text)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    priority: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_delivery_date: Mapped[str | None] = mapped_column(String(64))
    delivery_address: Mapped[str | None] = mapped_column(Text)
    delivery_instructions: Mapped[str | None] = mapped_column(Text)
    target_price: Mapped[str | None] = mapped_column(String(100))
    buyer_notes: Mapped[str | None] = mapped_column(Text)
    technical_notes: Mapped[str | None] = mapped_column(Text)
    commercial_notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    material_availability: Mapped[dict | None] = mapped_column(JSON)
    review_history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    buyer_visible_updates: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status_history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    production_job_id: Mapped[int | None] = mapped_column(ForeignKey("production_jobs.id", ondelete="SET NULL"))
    yarn_id: Mapped[str | None] = mapped_column(ForeignKey("yarn_inventory.yarn_id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class FabricRecipe(Base):
    __tablename__ = "fabric_recipes"

    recipe_code: Mapped[str] = mapped_column(String(40), primary_key=True)
    fabric_name: Mapped[str] = mapped_column(String(160), nullable=False)
    fabric_category: Mapped[str] = mapped_column(String(80), nullable=False)
    construction: Mapped[str] = mapped_column(String(120), nullable=False)
    finished_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    expected_waste_percent: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    ingredients: Mapped[list[FabricRecipeIngredient]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", order_by="FabricRecipeIngredient.line_no"
    )


class FabricRecipeIngredient(Base):
    __tablename__ = "fabric_recipe_ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recipe_code: Mapped[str] = mapped_column(
        ForeignKey("fabric_recipes.recipe_code", ondelete="CASCADE"), nullable=False, index=True
    )
    line_no: Mapped[int] = mapped_column(Integer, nullable=False)
    yarn_id: Mapped[str | None] = mapped_column(ForeignKey("yarn_inventory.yarn_id", ondelete="SET NULL"), index=True)
    yarn_role: Mapped[str] = mapped_column(String(80), nullable=False)
    yarn_type: Mapped[str] = mapped_column(String(100), nullable=False)
    specification: Mapped[str] = mapped_column(String(120), nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    waste_percent: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    recipe: Mapped[FabricRecipe] = relationship(back_populates="ingredients")
