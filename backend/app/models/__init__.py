"""SQLAlchemy models for the Textile Management System."""

from app.models.alert import StockAlert
from app.models.auth import AttendanceRecord, User, UserRole
from app.models.machine import Machine, MachineStatus, MachineStatusEvent
from app.models.movement import StockMovement
from app.models.production import (
    MachineDowntime,
    ProductionJob,
    ProductionJobStatus,
    ProductionJobStatusEvent,
)
from app.models.purchase import PurchaseRequest
from app.models.quality import InspectionOutcome, QualityInspection
from app.models.recommendation import MachineRecommendation, RecommendationDecision
from app.models.sequence import Sequence
from app.models.supplier import (
    Supplier,
    SupplierCategory,
    SupplierProductCode,
    SupplierChangeHistory,
)
from app.models.yarn import YarnInventory

__all__ = [
    "User",
    "UserRole",
    "AttendanceRecord",
    "Sequence",
    "YarnInventory",
    "Supplier",
    "SupplierCategory",
    "SupplierProductCode",
    "SupplierChangeHistory",
    "StockMovement",
    "StockAlert",
    "PurchaseRequest",
    "Machine",
    "MachineStatus",
    "MachineStatusEvent",
    "MachineDowntime",
    "ProductionJob",
    "ProductionJobStatus",
    "ProductionJobStatusEvent",
    "QualityInspection",
    "InspectionOutcome",
    "MachineRecommendation",
    "RecommendationDecision",
]
