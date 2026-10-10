"""CSV import report schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ImportIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    row: int
    field: str
    message: str


class ImportReportOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fileName: str
    totalRows: int
    created: int
    updated: int
    suppliersAdded: int
    skipped: int
    valid: bool
    issues: list[ImportIssue]
    truncatedIssues: bool = False
