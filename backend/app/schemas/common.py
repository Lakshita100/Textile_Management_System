from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class Message(BaseModel):
    detail: str


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str


class DBHealthResponse(BaseModel):
    database: str
    connected: bool
