"""Development/demo seed — clearly labelled sample records, explicit opt-in only.

Run from the backend/ directory:

    python -m app.scripts.seed_demo            # create labelled demo records
    python -m app.scripts.seed_demo --clean    # remove them again

This script is NEVER called by the application. Every record it creates is
clearly marked:
- yarn IDs use the `DEMO-` prefix and `isDemo = true`,
- supplier company names start with `[DEMO] ` and `isDemo = true`,
- no phone numbers, emails, prices, MOQs or lead times are invented — they stay
  empty/null and the UI shows "Not provided" / "Unavailable".
"""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import delete, select

from app.database import SessionLocal
from app.models import (
    PurchaseRequest,
    StockAlert,
    StockMovement,
    Supplier,
    SupplierCategory,
    SupplierProductCode,
    SupplierChangeHistory,
    YarnInventory,
)
from app.services.alerts import reconcile_alerts
from app.services.common import transaction

REPO_ROOT = Path(__file__).resolve().parents[3]

DEMO_SUPPLIERS = [
    {
        "company_name": "[DEMO] Alpine Spinning Co",
        "categories": ["Mechanical Stretch", "False-Twisted & Textured"],
        "codes": ["DEMO-MSY-100", "DEMO-FTY-100"],
    },
    {
        "company_name": "[DEMO] Summit Yarn Works",
        "categories": ["Eco-Innovative & Recycled"],
        "codes": ["DEMO-RPY-100"],
    },
]

DEMO_YARNS = [
    {
        "yarn_id": "DEMO-0001",
        "yarn_name": "[DEMO] Recycled Blend Yarn 150D",
        "product_code": "DEMO-RPY-100",
        "category": "Eco-Innovative & Recycled",
        "material_composition": "Recycled Polyester (rPET)",
        "colour_shade": "Sea Green",
        "denier_specification": "150D/48F",
        "current_stock": 480.0,
        "unit": "kg",
        "unit_cost": 0.0,
        "supplier_source": "[DEMO] Summit Yarn Works",
        "minimum_stock_level": 100.0,
        "storage_location": "Warehouse A",
        "batch_number": "DEMO-B001",
        "inventory_stage": "Purchased Input",
        "image_file": "/samples/yarn_05.jpg",
    },
    {
        "yarn_id": "DEMO-0002",
        "yarn_name": "[DEMO] Stretch Comfort Yarn 75D",
        "product_code": "DEMO-MSY-100",
        "category": "Mechanical Stretch",
        "material_composition": "Polyester",
        "colour_shade": "White",
        "denier_specification": "75D/72F",
        "current_stock": 150.0,
        "unit": "kg",
        "unit_cost": 0.0,
        "supplier_source": "[DEMO] Alpine Spinning Co",
        "minimum_stock_level": 100.0,
        "storage_location": "Warehouse B",
        "batch_number": "DEMO-B002",
        "inventory_stage": "Finished Yarn",
        "image_file": "/samples/yarn_12.jpg",
    },
    {
        "yarn_id": "DEMO-0003",
        "yarn_name": "[DEMO] Low Stock Sample Yarn 100D",
        "product_code": "DEMO-FTY-100",
        "category": "False-Twisted & Textured",
        "material_composition": "Polyester Textured",
        "colour_shade": "Black",
        "denier_specification": "100D/36F",
        "current_stock": 60.0,
        "unit": "kg",
        "unit_cost": 0.0,
        "supplier_source": "[DEMO] Alpine Spinning Co",
        "minimum_stock_level": 100.0,
        "storage_location": "Warehouse C",
        "batch_number": "DEMO-B003",
        "inventory_stage": "Work in Progress",
        "image_file": "/samples/yarn_15.jpg",
    },
]


def migrate() -> None:
    config = Config(str(REPO_ROOT / "backend" / "alembic.ini"))
    config.set_main_option("script_location", str(REPO_ROOT / "backend" / "alembic"))
    command.upgrade(config, "head")


def clean(db) -> None:  # noqa: ANN001
    demo_ids = [row.yarn_id for row in db.scalars(select(YarnInventory).where(YarnInventory.is_demo.is_(True)))]
    if demo_ids:
        db.execute(delete(PurchaseRequest).where(PurchaseRequest.yarn_id.in_(demo_ids)))
        db.execute(delete(StockAlert).where(StockAlert.yarn_id.in_(demo_ids)))
        db.execute(delete(StockMovement).where(StockMovement.yarn_id.in_(demo_ids)))
        db.execute(delete(SupplierChangeHistory).where(SupplierChangeHistory.yarn_id.in_(demo_ids)))
        db.execute(delete(YarnInventory).where(YarnInventory.yarn_id.in_(demo_ids)))

    demo_suppliers = db.scalars(select(Supplier).where(Supplier.is_demo.is_(True))).all()
    for supplier in demo_suppliers:
        referenced = db.scalar(
            select(YarnInventory.yarn_id).where(YarnInventory.supplier_source == supplier.company_name).limit(1)
        )
        if referenced is None:
            db.execute(delete(SupplierCategory).where(SupplierCategory.supplier_id == supplier.supplier_id))
            db.execute(delete(SupplierProductCode).where(SupplierProductCode.supplier_id == supplier.supplier_id))
            db.delete(supplier)
    db.flush()
    print(f"Cleaned {len(demo_ids)} demo yarn record(s) and {len(demo_suppliers)} demo supplier(s)")


def seed(db) -> None:  # noqa: ANN001
    existing_yarns = set(db.scalars(select(YarnInventory.yarn_id).where(YarnInventory.is_demo.is_(True))).all())
    existing_suppliers = {
        name.lower(): supplier
        for name, supplier in zip(
            db.scalars(select(Supplier.company_name).where(Supplier.is_demo.is_(True))).all(),
            db.scalars(select(Supplier).where(Supplier.is_demo.is_(True))).all(),
        )
    }

    created_suppliers = 0
    for spec in DEMO_SUPPLIERS:
        key = spec["company_name"].lower()
        if key in existing_suppliers:
            continue
        supplier = Supplier(
            supplier_id=_next_supplier_id(db),
            company_name=spec["company_name"],
            contact_person="",  # never invented
            phone="",
            email="",
            address="",
            price_per_kg=None,
            min_order_qty=None,
            lead_time_days=None,
            notes="Demo record — sample data created by seed_demo.py; no real contact details.",
            active=True,
            is_demo=True,
        )
        for category in spec["categories"]:
            supplier.categories.append(SupplierCategory(category=category))
        for code in spec["codes"]:
            supplier.product_codes.append(SupplierProductCode(product_code=code))
        db.add(supplier)
        created_suppliers += 1

    created_yarns = 0
    for spec in DEMO_YARNS:
        if spec["yarn_id"] in existing_yarns:
            continue
        db.add(YarnInventory(**spec, is_demo=True))
        created_yarns += 1
    db.flush()

    reconcile_alerts(db, date.today())
    print(
        f"Seeded {created_yarns} demo yarn record(s) and {created_suppliers} demo supplier(s) "
        f"(labelled DEMO-/[DEMO] and isDemo=true)"
    )


def _next_supplier_id(db) -> str:  # noqa: ANN001
    from app.services.common import next_code

    return next_code(db, "SUP", "SUP", 4)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--clean", action="store_true", help="Remove previously seeded demo records")
    parser.add_argument("--no-migrate", action="store_true", help="Skip running alembic upgrade first")
    args = parser.parse_args(argv)

    if not args.no_migrate:
        migrate()

    db = SessionLocal()
    try:
        with transaction(db):
            if args.clean:
                clean(db)
            else:
                seed(db)
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
