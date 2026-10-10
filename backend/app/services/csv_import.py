"""Validated, repeatable CSV import for the 10,000-row yarn inventory dataset.

The same rules as the Phase 4 frontend import apply:
- required columns (header normalisation ignores punctuation/case),
- required text fields, non-negative numerics, enum checks,
- stock-status rule check (Out = 0, Low = 0 < qty < min, In = qty >= min),
- duplicate yarn IDs rejected,
- upsert by yarn ID so re-importing never creates duplicates.
"""

from __future__ import annotations

import csv
import io
import re
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Supplier, SupplierCategory, SupplierProductCode, YarnInventory
from app.schemas.constants import INVENTORY_STAGES, STOCK_STATUSES, YARN_CATEGORIES
from app.schemas.import_ import ImportIssue, ImportReportOut
from app.services.common import next_code, resolve_status, round_qty

MAX_ISSUES = 200

# logical field -> normalised header candidates (non-alphanumerics stripped)
FIELD_CANDIDATES: dict[str, tuple[str, ...]] = {
    "yarnId": ("yarnid",),
    "yarnName": ("yarnname",),
    "productCode": ("productcode",),
    "category": ("category",),
    "materialComposition": ("materialcomposition",),
    "colourShade": ("colourshade", "colorshade"),
    "denierSpecification": ("denierspecification",),
    "currentStock": ("currentstock",),
    "unit": ("unit",),
    "unitCost": ("unitcost", "unitcostkg", "unitcostperkg", "unitcostkg"),
    "supplierSource": ("suppliersource",),
    "minimumStockLevel": ("minimumstocklevel", "minimumstocklevelkg"),
    "storageLocation": ("storagelocation",),
    "batchNumber": ("batchnumber",),
    "inventoryStage": ("inventorystage",),
    "stockStatus": ("stockstatus",),
    "imageFile": ("imagefile", "image", "thumbnail"),
}
REQUIRED_COLUMNS = tuple(
    field
    for field in FIELD_CANDIDATES
    if field not in ("stockStatus", "imageFile")
)
REQUIRED_TEXT_FIELDS = (
    "yarnId",
    "yarnName",
    "productCode",
    "category",
    "materialComposition",
    "colourShade",
    "denierSpecification",
    "unit",
    "supplierSource",
    "storageLocation",
    "batchNumber",
    "inventoryStage",
)


def normalize_header(header: str) -> str:
    return re.sub(r"[^a-z0-9]", "", header.lower())


def map_headers(header_row: list[str]) -> tuple[dict[str, int], list[ImportIssue]]:
    normalized = [normalize_header(cell) for cell in header_row]
    mapping: dict[str, int] = {}
    issues: list[ImportIssue] = []
    for field, candidates in FIELD_CANDIDATES.items():
        for index, cell in enumerate(normalized):
            if cell in candidates:
                mapping[field] = index
                break
    for field in REQUIRED_COLUMNS:
        if field not in mapping:
            issues.append(ImportIssue(row=0, field=field, message=f"Missing required column for {field}"))
    return mapping, issues


def _parse_number(raw: str) -> float | None:
    cleaned = raw.strip().replace(",", "")
    if cleaned == "":
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _validate_row(
    row_number: int,
    cells: list[str],
    mapping: dict[str, int],
    seen_ids: dict[str, int],
) -> tuple[dict | None, list[ImportIssue]]:
    issues: list[ImportIssue] = []

    def value(field: str) -> str:
        index = mapping.get(field)
        if index is None or index >= len(cells):
            return ""
        return cells[index].strip()

    def error(field: str, message: str) -> None:
        issues.append(ImportIssue(row=row_number, field=field, message=message))

    for field in REQUIRED_TEXT_FIELDS:
        if value(field) == "":
            error(field, f"{field} is required")

    category = value("category")
    if category and category not in YARN_CATEGORIES:
        error("category", f"Unknown category '{category}'")
    stage = value("inventoryStage")
    if stage and stage not in INVENTORY_STAGES:
        error("inventoryStage", f"Unknown inventory stage '{stage}'")

    numbers: dict[str, float] = {}
    for field in ("currentStock", "unitCost", "minimumStockLevel"):
        raw = value(field)
        parsed = _parse_number(raw)
        if parsed is None:
            error(field, f"{field} must be a number (got '{raw}')")
        elif parsed < 0:
            error(field, f"{field} cannot be negative")
        else:
            numbers[field] = parsed

    stock = numbers.get("currentStock")
    minimum = numbers.get("minimumStockLevel")
    provided_status = value("stockStatus")
    if stock is not None and minimum is not None:
        derived = resolve_status(round_qty(stock), round_qty(minimum))
        if provided_status and provided_status not in STOCK_STATUSES:
            error("stockStatus", f"Unknown stock status '{provided_status}'")
        elif provided_status and provided_status != derived:
            error(
                "stockStatus",
                f"Status '{provided_status}' violates the stock rule (expected '{derived}')",
            )

    yarn_id = value("yarnId")
    if yarn_id:
        key = yarn_id.lower()
        if key in seen_ids:
            error("yarnId", f"Duplicate yarn ID '{yarn_id}' (first seen on row {seen_ids[key]})")
        else:
            seen_ids[key] = row_number

    if issues:
        return None, issues

    return (
        {
            "yarn_id": yarn_id,
            "image_file": value("imageFile"),
            "yarn_name": value("yarnName"),
            "product_code": value("productCode"),
            "category": category,
            "material_composition": value("materialComposition"),
            "colour_shade": value("colourShade"),
            "denier_specification": value("denierSpecification"),
            "current_stock": round_qty(stock if stock is not None else 0.0),
            "unit": value("unit"),
            "unit_cost": numbers.get("unitCost", 0.0),
            "supplier_source": value("supplierSource"),
            "minimum_stock_level": round_qty(minimum if minimum is not None else 0.0),
            "storage_location": value("storageLocation"),
            "batch_number": value("batchNumber"),
            "inventory_stage": stage,
        },
        [],
    )


def parse_yarn_csv(
    content: bytes | str, *, skip_invalid: bool = False
) -> tuple[list[dict], list[ImportIssue], int, bool]:
    """Parse + validate. Returns (valid records, issues, total rows, fatal)."""
    if isinstance(content, bytes):
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            return [], [ImportIssue(row=0, field="file", message=f"Not valid UTF-8: {exc}")], 0, True
    else:
        text = content.lstrip("\ufeff")

    reader = csv.reader(io.StringIO(text))
    rows = [row for row in reader if any(cell.strip() for cell in row)]
    if not rows:
        return [], [ImportIssue(row=0, field="file", message="The CSV file is empty")], 0, True

    mapping, issues = map_headers(rows[0])
    if issues:
        return [], issues, 0, True

    records: list[dict] = []
    row_issues: list[ImportIssue] = []
    seen_ids: dict[str, int] = {}
    expected_width = len(rows[0])

    for row_number, cells in enumerate(rows[1:], start=2):
        if len(cells) != expected_width:
            issue = ImportIssue(
                row=row_number,
                field="row",
                message=f"Expected {expected_width} columns, found {len(cells)}",
            )
            row_issues.append(issue)
            continue
        record, issues = _validate_row(row_number, cells, mapping, seen_ids)
        if record is not None:
            records.append(record)
        else:
            row_issues.extend(issues)

    total_rows = len(rows) - 1
    if row_issues and not skip_invalid:
        return [], row_issues, total_rows, False
    return records, row_issues, total_rows, False


def normalize_image_path(value: str, repo_root: Path) -> str:
    """Preserve the stored file path/URL; map dataset basenames to /samples/."""
    raw = value.strip()
    if raw == "":
        return ""
    if raw.startswith("/") or raw.startswith("http"):
        return raw
    name = Path(raw).name
    if (repo_root / "frontend" / "public" / "samples" / name).exists():
        return f"/samples/{name}"
    return raw


def ensure_suppliers(db: Session, records: list[dict]) -> int:
    """Create supplier rows for supplier names that are not stored yet (add-only)."""
    known = {name.lower() for name in db.scalars(select(Supplier.company_name)).all()}
    derived: dict[str, dict[str, set[str]]] = {}
    for record in records:
        name = record["supplier_source"].strip()
        if not name:
            continue
        entry = derived.setdefault(name.lower(), {"name": name, "categories": set(), "codes": set()})
        entry["categories"].add(record["category"])
        entry["codes"].add(record["product_code"])

    added = 0
    for key in sorted(derived):
        if key in known:
            continue
        entry = derived[key]
        supplier = Supplier(
            supplier_id=next_code(db, "SUP", "SUP", 4),
            company_name=entry["name"],
            active=True,
            is_demo=False,
            notes="",
        )
        for category in sorted(entry["categories"]):
            supplier.categories.append(SupplierCategory(category=category))
        for code in sorted(entry["codes"]):
            supplier.product_codes.append(SupplierProductCode(product_code=code))
        db.add(supplier)
        added += 1
    db.flush()
    return added


def import_csv(
    db: Session,
    content: bytes | str,
    filename: str,
    *,
    skip_invalid: bool = False,
    repo_root: Path | None = None,
) -> ImportReportOut:
    """Validate then upsert the whole file. Re-importing updates, never duplicates."""
    root = repo_root or Path.cwd().parent
    records, issues, total_rows, fatal = parse_yarn_csv(content, skip_invalid=skip_invalid)

    truncated = len(issues) > MAX_ISSUES
    visible_issues = issues[:MAX_ISSUES]

    if fatal or (issues and not skip_invalid):
        return ImportReportOut(
            fileName=filename,
            totalRows=total_rows,
            created=0,
            updated=0,
            suppliersAdded=0,
            skipped=total_rows - len(records),
            valid=False,
            issues=visible_issues,
            truncatedIssues=truncated,
        )

    for record in records:
        record["image_file"] = normalize_image_path(record["image_file"], root)

    existing_ids = {value.lower() for value in db.scalars(select(YarnInventory.yarn_id)).all()}

    created_rows = [r for r in records if r["yarn_id"].lower() not in existing_ids]
    updated_rows = [r for r in records if r["yarn_id"].lower() in existing_ids]

    if created_rows:
        db.bulk_insert_mappings(
            YarnInventory,
            [{**row, "is_demo": False} for row in created_rows],
        )
    if updated_rows:
        db.bulk_update_mappings(
            YarnInventory,
            [{**row, "is_demo": False} for row in updated_rows],
        )
    db.flush()

    suppliers_added = ensure_suppliers(db, records)

    # Open/close alerts for everything now in the table (same transaction).
    from datetime import date

    from app.services.alerts import reconcile_alerts

    reconcile_alerts(db, date.today())

    return ImportReportOut(
        fileName=filename,
        totalRows=total_rows,
        created=len(created_rows),
        updated=len(updated_rows),
        suppliersAdded=suppliers_added,
        skipped=total_rows - len(records),
        valid=True,
        issues=visible_issues,
        truncatedIssues=truncated,
    )


def dataset_stats(db: Session) -> dict:
    total = int(db.scalar(select(func.count()).select_from(YarnInventory)) or 0)
    return {"totalRows": total}
