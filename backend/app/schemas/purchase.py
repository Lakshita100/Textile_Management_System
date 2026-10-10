"""Purchase request and recommendation schemas."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing_extensions import Annotated

from app.schemas.constants import PurchaseRequestStatus

RequiredStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class SupplierOfferOut(BaseModel):
    """One eligible supplier's terms for a yarn. Nulls mean "not stored"."""

    model_config = ConfigDict(extra="forbid")

    supplierId: str
    companyName: str
    active: bool
    unitCost: float | None = None
    minOrderQty: float | None = None
    leadTimeDays: int | None = None
    expectedDeliveryDate: date | None = None
    priceSource: str = "supplier_price"  # supplier_price | current_supplier_dataset_price | unavailable


class RecommendationOut(BaseModel):
    """Shortage + recommended quantity + supplier comparison for one yarn."""

    model_config = ConfigDict(extra="forbid")

    yarnId: str
    yarnName: str
    productCode: str
    category: str
    unit: str
    currentStock: float
    minimumStockLevel: float
    shortage: float
    recommendedQuantity: float
    currentSupplier: str
    offers: list[SupplierOfferOut]


class RecommendationsOut(BaseModel):
    items: list[RecommendationOut]
    total: int


class PurchaseRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    yarnId: RequiredStr = Field(max_length=32)
    supplierId: RequiredStr = Field(max_length=16)
    quantity: float = Field(gt=0)
    bufferQuantity: float = Field(default=0, ge=0)
    expectedDeliveryDate: date | None = None
    notes: str = Field(default="", max_length=2000)


class PurchaseRequestStatusIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: PurchaseRequestStatus


class PurchaseRequestOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requestId: str
    documentType: str = "purchase_request"
    isPurchaseOrder: bool = False
    yarnId: str
    yarnName: str = ""
    supplierId: str | None = None
    supplierName: str
    quantity: float
    unit: str
    bufferQuantity: float
    shortageQuantity: float
    estimatedUnitCost: float | None = None
    estimatedTotalCost: float | None = None
    minOrderQty: float | None = None
    expectedDeliveryDate: date | None = None
    status: PurchaseRequestStatus
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
    notes: str = ""


class PurchaseRequestListOut(BaseModel):
    items: list[PurchaseRequestOut]
    total: int
