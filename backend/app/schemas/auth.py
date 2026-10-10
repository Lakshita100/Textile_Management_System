"""Auth schemas — register / login / token payloads."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    if not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    return email


NormalizedEmail = Annotated[
    str,
    Field(min_length=3, max_length=255),
    AfterValidator(_normalize_email),
]


class RegisterIn(BaseModel):
    email: NormalizedEmail
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    # Admin accounts can never be self-registered — they are provisioned by the
    # operator (seeded) only. Open registration is limited to buyer/staff.
    role: Literal["buyer", "staff"] = "buyer"
    company: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=32)


class LoginIn(BaseModel):
    email: NormalizedEmail
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    company: str | None = None
    phone: str | None = None
    is_active: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserOut
