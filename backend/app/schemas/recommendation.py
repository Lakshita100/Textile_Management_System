from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.recommendation import RecommendationDecision


class RecommendationRequest(BaseModel):
    order_ref: str = Field(min_length=1, max_length=64)
    required_process: str = Field(min_length=1, max_length=64)
    required_material: str = Field(min_length=1, max_length=128)
    required_quantity: float = Field(gt=0)
    quantity_unit: str = "meters"
    deadline: datetime | None = None


class ScoreBreakdown(BaseModel):
    efficiency: float | None
    efficiency_known: bool
    workload_suitability: float
    quality: float | None
    quality_known: bool
    final_score: float


class CandidateOut(BaseModel):
    machine_id: int
    machine_code: str
    machine_name: str
    eligible: bool
    exclusion_reasons: list[str] = []
    score: ScoreBreakdown | None = None
    estimated_days: float | None = None


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_ref: str
    required_process: str
    required_material: str
    required_quantity: float
    quantity_unit: str
    algorithm_version: str
    decision: RecommendationDecision
    recommended_machine_id: int | None
    recommended_machine_code: str | None
    explanation: str
    warnings: list[str] = []
    candidates: list[CandidateOut] = []
    material_available: bool | None
    material_note: str
    created_at: datetime
    decided_by: str | None = None
    decided_at: datetime | None = None
    assigned_job_id: int | None = None


class ApprovalRequest(BaseModel):
    decided_by: str = Field(min_length=1, max_length=120)
    note: str | None = Field(default=None, max_length=500)
    planned_start: datetime | None = None
    planned_end: datetime | None = None
    shift: str | None = Field(default=None, max_length=32)


class AnalyticsRow(BaseModel):
    machine_id: int
    machine_code: str
    machine_name: str
    planned_quantity: float
    actual_quantity: float
    completion_percent: float
    job_count: int
    completed_jobs: int
    efficiency_percent: float | None
    utilization_percent: float | None
    downtime_minutes: float
    downtime_reasons: dict[str, float] = {}
    defect_rate_percent: float | None
    defect_note: str | None = None
