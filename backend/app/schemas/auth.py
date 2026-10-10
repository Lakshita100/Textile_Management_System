"""Authentication and account-management API schemas."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    if not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    return email


NormalizedEmail = Annotated[str, Field(min_length=3, max_length=255), AfterValidator(_normalize_email)]


class RegisterIn(BaseModel):
    """Public self-registration is buyer-only; role is never accepted from clients."""

    email: NormalizedEmail
    password: str = Field(min_length=12, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    company: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=32)


class LoginIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class GoogleLoginIn(BaseModel):
    id_token: str = Field(min_length=20, max_length=8192)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class EmployeeCreateIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: NormalizedEmail | None = None
    phone: str | None = Field(default=None, max_length=32)
    permissions: list[str] = Field(default_factory=list)


class EmployeeUpdateIn(BaseModel):
    permissions: list[str] | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: int
    email: str | None = None
    login_id: str | None = None
    full_name: str
    role: str
    company: str | None = None
    phone: str | None = None
    is_active: bool = True
    permissions: list[str] = Field(default_factory=list)
    must_change_password: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserOut


class ProvisionedEmployeeOut(BaseModel):
    user: UserOut
    temporary_password: str


class AttendanceOut(BaseModel):
    id: int
    user_id: int
    employee_name: str
    login_id: str
    work_date: date
    check_in_at: datetime
    check_out_at: datetime | None = None
