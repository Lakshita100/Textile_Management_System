"""Test fixtures: isolated SQLite database created via Alembic migrations.

The test database URL is injected BEFORE any application import so that
`app.config.Settings` and the engine pick it up.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

_TEST_DIR = Path(tempfile.mkdtemp(prefix="textile_test_"))
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DIR / 'test.db'}"
os.environ["ECHO_SQL"] = "False"

import pytest  # noqa: E402
from alembic import command as alembic_command  # noqa: E402
from alembic.config import Config as AlembicConfig  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import delete  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    PurchaseRequest,
    Sequence,
    StockAlert,
    StockMovement,
    Supplier,
    SupplierCategory,
    SupplierChangeHistory,
    SupplierProductCode,
    YarnInventory,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = REPO_ROOT / "backend"


def _upgrade_schema() -> None:
    config = AlembicConfig(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
    alembic_command.upgrade(config, "head")


_upgrade_schema()


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def clean_tables(db):
    """Every test starts from an empty database."""
    for model in (
        PurchaseRequest,
        StockAlert,
        StockMovement,
        SupplierChangeHistory,
        SupplierCategory,
        SupplierProductCode,
        Supplier,
        YarnInventory,
        Sequence,
    ):
        db.execute(delete(model))
    db.commit()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
