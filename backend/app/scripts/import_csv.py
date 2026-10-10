"""Repeatable, validated import of the 10,000-row yarn inventory dataset.

Run from the backend/ directory:

    python -m app.scripts.import_csv                       # default dataset
    python -m app.scripts.import_csv --csv path/to/file.csv
    python -m app.scripts.import_csv --reset                # wipe inventory first
    python -m app.scripts.import_csv --skip-invalid         # import valid rows only

Behaviour:
- applies pending Alembic migrations first (unless --no-migrate),
- validates every row (headers, required fields, numerics, enums, stock rule,
  duplicate IDs) and refuses the whole file when anything fails,
- upserts by yarn ID: running it twice never creates duplicate records,
- adds supplier rows for supplier names that do not exist yet (add-only),
- is idempotent and safe to re-run.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import delete

from app.database import SessionLocal
from app.models import PurchaseRequest, StockAlert, StockMovement, SupplierChangeHistory, YarnInventory
from app.services.common import transaction
from app.services.csv_import import import_csv

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CSV = REPO_ROOT / "datasets" / "raw-material.csv"


def migrate() -> None:
    config = Config(str(REPO_ROOT / "backend" / "alembic.ini"))
    config.set_main_option("script_location", str(REPO_ROOT / "backend" / "alembic"))
    command.upgrade(config, "head")


def reset_inventory(db) -> int:  # noqa: ANN001
    """Remove every inventory row and its dependents (suppliers are kept)."""
    db.execute(delete(PurchaseRequest))
    db.execute(delete(StockAlert))
    db.execute(delete(StockMovement))
    db.execute(delete(SupplierChangeHistory))
    result = db.execute(delete(YarnInventory))
    return int(result.rowcount or 0)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="CSV file to import")
    parser.add_argument("--reset", action="store_true", help="Delete all inventory rows before importing")
    parser.add_argument("--skip-invalid", action="store_true", help="Import valid rows even if some fail")
    parser.add_argument("--no-migrate", action="store_true", help="Skip running alembic upgrade first")
    args = parser.parse_args(argv)

    csv_path: Path = args.csv
    if not csv_path.is_file():
        print(f"ERROR: CSV file not found: {csv_path}", file=sys.stderr)
        return 2

    if not args.no_migrate:
        migrate()

    content = csv_path.read_bytes()
    db = SessionLocal()
    try:
        with transaction(db):
            if args.reset:
                removed = reset_inventory(db)
                print(f"Reset: removed {removed} existing inventory row(s)")
            report = import_csv(
                db,
                content,
                csv_path.name,
                skip_invalid=args.skip_invalid,
                repo_root=REPO_ROOT,
            )
        if not report.valid:
            print(f"IMPORT FAILED validation — nothing was written ({len(report.issues)} issue(s)):")
            for issue in report.issues[:40]:
                print(f"  row {issue.row}: {issue.field} — {issue.message}")
            if len(report.issues) > 40:
                print(f"  ... {len(report.issues) - 40} more")
            return 1

        print(f"Imported {report.fileName}")
        print(f"  rows parsed : {report.totalRows}")
        print(f"  created     : {report.created}")
        print(f"  updated     : {report.updated}")
        print(f"  suppliers + : {report.suppliersAdded}")
        if report.issues:
            print(f"  warnings    : {len(report.issues)} (row-level, imported anyway)")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
