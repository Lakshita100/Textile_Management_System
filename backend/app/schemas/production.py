from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.production import ProductionJobStatus


class JobCreate(BaseModel):
    machine_id: int
    order_ref: str = Field(min_length=1, max_length=64)
    material_spec: str = Field(min_length=1, max_length=255)
    required_process: str = Field(min_length=1, max_length=64)
    planned_quantity: float = Field(gt=0)
    quantity_unit: str = "meters"
    shift: str | None = Field(default=None, max_length=32)
    planned_start: datetime | None = None
    planned_end: datetime | None = None


class JobProgressUpdate(BaseModel):
    actual_quantity: float = Field(ge=0)


class JobStatusUpdate(BaseModel):
    note: str | None = Field(default=None, max_length=255)


class JobStatusEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    from_status: ProductionJobStatus | None
    to_status: ProductionJobStatus
    note: str | None
    created_at: datetime


class DowntimeCreate(BaseModel):
    machine_id: int
    job_id: int | None = None
    reason: str = Field(min_length=1, max_length=255)
    started_at: datetime
    ended_at: datetime | None = None

    @model_validator(mode="after")
    def end_after_start(self):
        if self.ended_at and self.started_at and self.ended_at < self.started_at:
            raise ValueError("ended_at must be >= started_at")
        return self


class DowntimeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    machine_id: int
    job_id: int | None
    reason: str
    started_at: datetime
    ended_at: datetime | None
    duration_minutes: float | None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    machine_id: int
    order_ref: str
    material_spec: str
    required_process: str
    planned_quantity: float
    actual_quantity: float
    quantity_unit: str
    shift: str | None
    status: ProductionJobStatus
    completion_percent: float
    planned_start: datetime | None
    planned_end: datetime | None
    actual_start: datetime | None
    actual_end: datetime | None
    created_at: datetime
    updated_at: datetime


class JobDetailOut(JobOut):
    status_events: list[JobStatusEventOut] = []
    downtimes: list[DowntimeOut] = []


class DashboardOut(BaseModel):
    total_machines: int
    running: int
    idle: int
    maintenance: int
    active_jobs: int
    completed_jobs: int
    delayed_jobs: int
    output_today: float
