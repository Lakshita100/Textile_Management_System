"""Stock movement request/response schemas."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing_extensions import Annotated

from app.schemas.constants import MovementType

RequiredStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class MovementCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    yarnId: RequiredStr = Field(max_length=32)
    movementType: MovementType
    quantity: float = Field(gt=0)
    date: date
    reference: RequiredStr = Field(max_length=100)
    # Stock In only — must match a stored supplier (never invented).
    supplierName: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=2000)
    # Stock Out only.
    reason: str = Field(default="", max_length=200)


class MovementOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    movementId: str
    yarnId: str
    yarnName: str = ""
    unit: str = ""
    movementType: MovementType
    quantity: float
    date: date
    reference: str
    stockAfter: float
    previousQuantity: float
    supplierName: str | None = None
    notes: str | None = None
    reason: str | None = None
    reversalOf: str | None = None
    createdAt: datetime | None = None


class MovementListOut(BaseModel):
    items: list[MovementOut]
    total: int
