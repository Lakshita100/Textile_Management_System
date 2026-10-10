"""CSV import endpoint (multipart upload, validated + upserted server-side)."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.auth import require_permission
from app.schemas import ImportReportOut
from app.services import csv_import
from app.services.common import transaction

router = APIRouter(prefix="/inventory", tags=["import"], dependencies=[Depends(require_permission("materials"))])

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB — the 10k dataset is ~1.7 MB


@router.post("/import", response_model=ImportReportOut, summary="Import a yarn inventory CSV (upsert, no duplicates)")
async def import_csv(
    file: UploadFile = File(...),
    skipInvalid: bool = Query(False, description="Import valid rows even when some rows fail validation"),
    db: Session = Depends(get_db),
) -> ImportReportOut:
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        from app.utils.errors import PayloadError

        raise PayloadError("File is larger than 20 MB")
    filename = file.filename or "upload.csv"
    # backend/app/api/routers/imports.py → parents[4] is the repo root,
    # independent of the process working directory.
    repo_root = Path(__file__).resolve().parents[4]

    with transaction(db):
        # Valid file → rows are upserted; invalid file → report.valid is False
        # and nothing has been written (the transaction stays empty).
        report = csv_import.import_csv(
            db, content, filename, skip_invalid=skipInvalid, repo_root=repo_root
        )
    return report
