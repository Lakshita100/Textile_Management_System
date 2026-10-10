from datetime import datetime

from pydantic import BaseModel, Field


class ScheduleOut(BaseModel):
    setup_minutes: float
    processing_minutes: float
    processing_source: str  # "ml" | "rule_capacity"
    queue_wait_minutes: float
    earliest_start_at: datetime
    completion_at: datetime
    next_available_at: datetime
    idle_after_minutes: float | None
    deadline_feasible: bool | None
    lateness_minutes: float | None
    assumptions: list[str] = []
    warnings: list[str] = []


class DurationEstimateRequest(BaseModel):
    machine_id: int
    quantity: float = Field(gt=0)
    unit: str = "kg"
    process: str = Field(min_length=1, max_length=64)
    gsm: float | None = Field(default=None, gt=0)
    width_cm: float | None = Field(default=None, gt=0)
    fabric_type: str | None = None
    fiber: str | None = None
    color: str | None = None
    priority: str = "NORMAL"


class DurationEstimateOut(BaseModel):
    minutes: float
    source: str
    model_version: str | None
    warnings: list[str] = []


class TimelineInterval(BaseModel):
    kind: str  # active_job | planned_job
    job_id: int
    order_ref: str
    start: datetime
    end: datetime
    minutes: float


class MachineTimelineOut(BaseModel):
    machine_id: int
    machine_code: str
    now: datetime
    horizon_end: datetime
    busy_intervals: list[TimelineInterval] = []
    next_available_at: datetime
    open_downtime_count: int
    warnings: list[str] = []
    assumptions: list[str] = []
