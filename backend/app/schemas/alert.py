"""Low-stock alert schemas (enriched with yarn + supplier details)."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.constants import AlertStatus


class AlertSupplierOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    companyName: str
    contactPerson: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    active: bool = True
    supplierId: str | None = None


class StockAlertOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    alertId: str
    yarnId: str
    status: AlertStatus
    createdAt: date
    updatedAt: date
    acknowledgedAt: date | None = None
    resolvedAt: date | None = None
    # Derived from live inventory for convenience:
    yarnName: str = ""
    kind: str = ""  # "Low Stock" | "Out of Stock"
    currentStock: float = 0.0
    minimumStockLevel: float = 0.0
    shortage: float = 0.0
    unit: str = ""
    supplier: AlertSupplierOut | None = None


class AlertListOut(BaseModel):
    items: list[StockAlertOut]
    total: int
    open: int
