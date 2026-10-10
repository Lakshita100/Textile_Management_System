"""Schemas for quality inspections (Anand's Feature 03 contract, API layer)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.quality import InspectionOutcome

DefectTypeLiteral = Literal["Low", "Medium", "High"]


class DefectIn(BaseModel):
    type: str = Field(min_length=1, max_length=64)
    count: int = Field(ge=1)
    severity: DefectTypeLiteral = Field(default="Medium")
    remarks: str | None = Field(default=None, max_length=500)


class InspectionCreate(BaseModel):
    job_id: int
    employee_id: str = Field(min_length=1, max_length=32)
    inspector_name: str = Field(min_length=1, max_length=128)
    inspected_at: date
    inspected_qty_meters: float = Field(gt=0)
    defects: list[DefectIn] = Field(default_factory=list)
    remarks: str | None = Field(default=None, max_length=2000)
    # Optional cross-checks (derived server-side from the job; mismatch -> coded 409)
    machine_code: str | None = Field(default=None, max_length=32)
    order_ref: str | None = Field(default=None, max_length=64)
    batch_no: str | None = Field(default=None, max_length=64)


class InspectionUpdate(BaseModel):
    """Disposition-only update: measurement fields are immutable (sent -> coded 409)."""

    outcome: InspectionOutcome | None = None
    remarks: str | None = Field(default=None, max_length=2000)
    # Accepted so clients get a consistent coded error instead of silent dropping:
    inspected_qty_meters: float | None = None
    accepted_qty_meters: float | None = None
    defects: list[DefectIn] | None = None
    employee_id: str | None = None
    inspected_at: date | None = None


class InspectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    machine_id: int
    machine_code: str
    machine_name: str
    job_status: str
    order_ref: str
    batch_no: str
    roll_id: str
    employee_id: str
    inspector_name: str
    inspected_at: date
    inspected_qty_meters: float
    accepted_qty_meters: float
    defects: list[dict]
    total_defect_count: int
    outcome: InspectionOutcome
    remarks: str | None
    source: str
    created_at: datetime
    updated_at: datetime


class RollPreviewOut(BaseModel):
    job_id: int
    batch_no: str
    roll_id: str
    inspection_count: int


class InspectableJobOut(BaseModel):
    job_id: int
    machine_id: int
    machine_code: str
    status: str
    batch_no: str
    order_ref: str
    started_at: datetime | None
    planned_qty_meters: float
    produced_qty_meters: float


class InspectionCountOut(BaseModel):
    job_id: int
    count: int
    latest_inspection_id: int | None = None


class DashboardStatsOut(BaseModel):
    total_inspections: int
    efficiency_percent: int
    pass_rate_percent: int
    defect_rate_per_100m: float
    rework_count: int
    rejected_count: int
    machines_flagged: int


class TrendPointOut(BaseModel):
    date: str
    defect_rate_per_100m: float
    inspections: int


class DefectTypePointOut(BaseModel):
    type: str
    count: int


class MachineRefOut(BaseModel):
    machine_id: int
    id: str  # machine code (Anand's display key)
    name: str
    process: str
    output_meters: float
    downtime_hours: float


class MachineSummaryOut(BaseModel):
    machine: MachineRefOut
    inspections: int
    approved: int
    rework: int
    rejected: int
    inspected_qty_meters: float
    accepted_qty_meters: float
    total_defects: int
    defect_rate_per_100m: float
    pass_rate_percent: int
    efficiency_percent: int
    needs_investigation: bool
    flag_reason: str


class MatrixRowOut(BaseModel):
    machine_id: str  # machine code
    machine_name: str
    counts: dict[str, int]
    total: int


class DashboardBundleOut(BaseModel):
    stats: DashboardStatsOut
    trend: list[TrendPointOut]
    by_type: list[DefectTypePointOut]
    summaries: list[MachineSummaryOut]
    matrix: list[MatrixRowOut]
