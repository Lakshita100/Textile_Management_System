"""Shared enumerations mirrored from the dataset and the frontend types."""

from __future__ import annotations

from typing import Literal, get_args

YarnCategory = Literal[
    "False-Twisted & Textured",
    "Mechanical Stretch",
    "Air-Textured Yarn (ATY)",
    "Melange & Multi-Tone",
    "Worsted & Wool-Like",
    "Eco-Innovative & Recycled",
]
YARN_CATEGORIES: tuple[str, ...] = get_args(YarnCategory)

InventoryStage = Literal["Purchased Input", "Work in Progress", "Finished Yarn"]
INVENTORY_STAGES: tuple[str, ...] = get_args(InventoryStage)

StockStatus = Literal["In Stock", "Low Stock", "Out of Stock"]
STOCK_STATUSES: tuple[str, ...] = get_args(StockStatus)

MovementType = Literal["Stock In", "Consumption"]
MOVEMENT_TYPES: tuple[str, ...] = get_args(MovementType)

StockOutReason = Literal[
    "Production consumption",
    "Order issue",
    "Wastage / damage",
    "Sampling / testing",
    "Stock correction",
    "Other",
]
STOCK_OUT_REASONS: tuple[str, ...] = get_args(StockOutReason)

AlertStatus = Literal["active", "acknowledged", "resolved"]
ALERT_STATUSES: tuple[str, ...] = get_args(AlertStatus)

PurchaseRequestStatus = Literal["draft", "submitted", "cancelled"]
PURCHASE_REQUEST_STATUSES: tuple[str, ...] = get_args(PurchaseRequestStatus)
