"""Persisted machine recommendations and supervisor decisions (Feature 02)."""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RecommendationDecision(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FAILED_REVALIDATION = "FAILED_REVALIDATION"


class MachineRecommendation(Base):
    """Audit record for a generated recommendation and its supervisor decision."""

    __tablename__ = "machine_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    required_process: Mapped[str] = mapped_column(String(64), nullable=False)
    required_material: Mapped[str] = mapped_column(String(128), nullable=False)
    required_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    quantity_unit: Mapped[str] = mapped_column(String(32), nullable=False, default="meters")
    # Full audit payload: candidates, scores, exclusions, warnings, explanation
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    algorithm_version: Mapped[str] = mapped_column(String(32), nullable=False)
    decision: Mapped[RecommendationDecision] = mapped_column(
        Enum(RecommendationDecision, name="recommendation_decision", native_enum=False, length=24),
        nullable=False,
        default=RecommendationDecision.PENDING,
        index=True,
    )
    decided_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_job_id: Mapped[int | None] = mapped_column(
        ForeignKey("production_jobs.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    assigned_job: Mapped["ProductionJob | None"] = relationship("ProductionJob")  # noqa: F821
