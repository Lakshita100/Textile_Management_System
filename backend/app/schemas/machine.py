from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.machine import MachineStatus


class MachineBase(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    machine_type: str = Field(min_length=1, max_length=60)
    supported_processes: str = ""
    compatible_materials: str = ""
    capacity_value: float = Field(gt=0)
    capacity_unit: str = "meters/day"
    notes: str | None = None


class MachineCreate(MachineBase):
    status: MachineStatus = MachineStatus.IDLE


class MachineUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    machine_type: str | None = Field(default=None, min_length=1, max_length=60)
    supported_processes: str | None = None
    compatible_materials: str | None = None
    capacity_value: float | None = Field(default=None, gt=0)
    capacity_unit: str | None = None
    notes: str | None = None


class MachineStatusChange(BaseModel):
    status: MachineStatus
    reason: str | None = Field(default=None, max_length=255)

    @field_validator("reason")
    @classmethod
    def reason_required_for_maintenance(cls, v, info):
        return v


class MachineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    machine_type: str
    supported_processes: str
    compatible_materials: str
    capacity_value: float
    capacity_unit: str
    status: MachineStatus
    status_reason: str | None
    status_changed_at: datetime
    notes: str | None
    created_at: datetime
    updated_at: datetime


class MachineStatusEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    machine_id: int
    from_status: MachineStatus | None
    to_status: MachineStatus
    reason: str | None
    created_at: datetime


class CurrentAssignmentOut(BaseModel):
    job_id: int
    order_ref: str
    material_spec: str
    required_process: str
    planned_quantity: float
    actual_quantity: float
    quantity_unit: str
    status: str
    completion_percent: float
    planned_start: datetime | None
    planned_end: datetime | None


class MachineDetailOut(MachineOut):
    current_assignment: CurrentAssignmentOut | None = None
    available_for_assignment: bool = True


class MachineListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    machine_type: str
    supported_processes: str
    capacity_value: float
    capacity_unit: str
    status: MachineStatus
    current_assignment: CurrentAssignmentOut | None = None
    available_for_assignment: bool = True
    efficiency_percent: float | None = None
