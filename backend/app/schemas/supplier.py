"""Supplier request/response schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing_extensions import Annotated

RequiredStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class SupplierBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    companyName: RequiredStr = Field(max_length=200)
    contactPerson: str = Field(default="", max_length=120)
    phone: str = Field(default="", max_length=40)
    email: str = Field(default="", max_length=120)
    address: str = Field(default="", max_length=255)
    yarnTypes: list[str] = Field(default_factory=list)
    productCodes: list[str] = Field(default_factory=list)
    pricePerKg: float | None = Field(default=None, ge=0)
    minOrderQty: float | None = Field(default=None, ge=0)
    leadTimeDays: int | None = Field(default=None, ge=0)
    notes: str = ""


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    supplierId: str
    active: bool = True
    isDemo: bool = False
    # Number of yarn records whose Supplier / Source matches this company.
    suppliedYarnCount: int = 0
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class SupplierListOut(BaseModel):
    items: list[SupplierOut]
    total: int


class SupplierActiveIn(BaseModel):
    active: bool


class ChangeSupplierIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    newSupplierName: RequiredStr = Field(max_length=200)
    note: str = Field(default="", max_length=500)
