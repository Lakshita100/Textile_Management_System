"""Yarn inventory request/response schemas (camelCase field names = API contract)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing_extensions import Annotated

from app.schemas.constants import InventoryStage, StockStatus, YarnCategory

RequiredStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
ShortStr = Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)]


class YarnBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    yarnId: RequiredStr = Field(max_length=32)
    imageFile: ShortStr = ""
    yarnName: RequiredStr = Field(max_length=200)
    productCode: RequiredStr = Field(max_length=64)
    category: YarnCategory
    materialComposition: RequiredStr = Field(max_length=200)
    colourShade: RequiredStr = Field(max_length=100)
    denierSpecification: RequiredStr = Field(max_length=100)
    currentStock: float = Field(ge=0)
    unit: RequiredStr = Field(max_length=16)
    unitCost: float = Field(ge=0)
    supplierSource: RequiredStr = Field(max_length=200)
    minimumStockLevel: float = Field(ge=0)
    storageLocation: RequiredStr = Field(max_length=100)
    batchNumber: RequiredStr = Field(max_length=64)
    inventoryStage: InventoryStage


class YarnCreate(YarnBase):
    pass


class YarnUpdate(YarnBase):
    pass


class YarnOut(YarnBase):
    stockStatus: StockStatus
    isDemo: bool = False
    updatedAt: datetime | None = None

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class InventoryListOut(BaseModel):
    items: list[YarnOut]
    page: int
    pageSize: int
    total: int
    totalPages: int


class InventorySummaryOut(BaseModel):
    totalYarnTypes: int
    totalAvailableStock: float
    lowStockItems: int
    outOfStockItems: int
    inventoryValue: float
    stockUnit: str
    totalSuppliers: int = 0
    demoCount: int
    openAlerts: int
