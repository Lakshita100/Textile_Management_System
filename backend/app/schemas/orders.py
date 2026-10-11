"""Buyer order and inquiry request schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict


class BuyerOrderCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    productName: str = Field(min_length=1, max_length=200)
    productCode: str | None = Field(default=None, max_length=64)
    yarnId: str | None = Field(default=None, max_length=32)
    productCategory: str | None = Field(default=None, max_length=100)
    yarnType: str | None = Field(default=None, max_length=100)
    yarnSubtype: str | None = Field(default=None, max_length=100)
    materialComposition: str = Field(min_length=1, max_length=255)
    technicalSpecifications: str | None = None
    denierCount: str | None = Field(default=None, max_length=100)
    shade: str | None = Field(default=None, max_length=100)
    specialRequirements: str | None = None
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=32)
    priority: str = Field(default="Standard", max_length=32)
    requestedDeliveryDate: str | None = Field(default=None, max_length=64)
    deliveryAddress: str | None = None
    deliveryInstructions: str | None = None
    targetPrice: str | None = Field(default=None, max_length=100)
    buyerNotes: str | None = None
    technicalNotes: str | None = None
    commercialNotes: str | None = None


class OrderReviewIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    action: str = Field(min_length=1, max_length=64)
    reviewer: str = Field(min_length=1, max_length=120)
    note: str = Field(default="", max_length=2000)
    nextStatus: str | None = Field(default=None, max_length=50)
    buyerMessage: str | None = Field(default=None, max_length=2000)


class MaterialCheckIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    availableQuantity: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, max_length=32)
    notes: str = Field(default="", max_length=2000)


class OrderStatusIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    status: str = Field(min_length=1, max_length=50)
    note: str = Field(default="", max_length=2000)


class BuyerOrderResponseIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=2000)


class ManualOrderCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    companyName: str = Field(min_length=1, max_length=150)
    buyerName: str = Field(default="Manual order contact", max_length=120)
    buyerEmail: str | None = Field(default=None, max_length=255)
    buyerPhone: str | None = Field(default=None, max_length=50)
    productName: str = Field(min_length=1, max_length=200)
    productCode: str | None = Field(default=None, max_length=64)
    productCategory: str = Field(default="Yarn", max_length=100)
    materialComposition: str = Field(default="General textile blend", max_length=255)
    shade: str = Field(default="Custom", max_length=100)
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=32)
    requestedDeliveryDate: str | None = Field(default=None, max_length=64)
    deliveryAddress: str | None = None
    notes: str = Field(default="", max_length=2000)


class InquiryCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    orderId: str = Field(min_length=1, max_length=32)
    subject: str = Field(min_length=1, max_length=200)
    type: str = Field(min_length=1, max_length=32)
    message: str = Field(min_length=1, max_length=2000)


class InquiryMessageIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=2000)


class InquiryStatusIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(min_length=1, max_length=32)
