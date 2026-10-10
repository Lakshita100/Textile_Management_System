"""Quality inspection schemas (Feature 03)."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.quality import InspectionOutcome


class DefectRecord(BaseModel):
    type: str = Field(min_length=1, max_length=60)
    count: int = Field(ge=1)
    severity: str = Field(default="Medium", max_length=16)
    remarks: str | None = Field(default=None, max_length=255)


class InspectionCreate(BaseModel):
    batch_no: str = Field(min_length=1, max_length=64)
    order_ref: str = Field(min_length=1, max_length=64)
    machine_code: str = Field(min_length=1, max_length=32)
    employee_id: str = Field(min_length=1, max_length=32)
    inspector_name: str = Field(min_length=1, max_length=120)
    inspected_at: date
    inspected_qty_meters: float = Field(gt=0)
    defects: list[DefectRecord] = Field(default_factory=list)
    remarks: str | None = Field(default=None, max_length=1000)


class InspectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    roll_id: str
    batch_no: str
    order_ref: str
    machine_id: int
    machine_code: str
    employee_id: str
    inspector_name: str
    inspected_at: date
    inspected_qty_meters: float
    accepted_qty_meters: float
    total_defect_count: int
    defects: list[DefectRecord]
    outcome: InspectionOutcome
    remarks: str | None
    source: str


class RollIdOut(BaseModel):
    roll_id: str


class MachineRefOut(BaseModel):
    code: str
    name: str
    process: str


class DashboardStatsOut(BaseModel):
    total_inspections: int
    efficiency_pct: int
    pass_rate_pct: int
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
    pass_rate_pct: int
    efficiency_pct: int
    needs_investigation: bool
    flag_reason: str


class MatrixRowOut(BaseModel):
    machine_code: str
    machine_name: str
    counts: dict[str, int]
    total: int


class QualityDashboardOut(BaseModel):
    stats: DashboardStatsOut
    trend: list[TrendPointOut]
    by_type: list[DefectTypePointOut]
    summaries: list[MachineSummaryOut]
    matrix: list[MatrixRowOut]
