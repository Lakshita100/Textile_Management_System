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
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import delete  # noqa: E402

import app.models  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    Machine,
    MachineDowntime,
    MachineRecommendation,
    MachineStatusEvent,
    ProductionJob,
    ProductionJobStatusEvent,
    PurchaseRequest,
    QualityInspection,
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
    Base.metadata.create_all(bind=engine)


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
        QualityInspection,
        MachineRecommendation,
        MachineDowntime,
        ProductionJobStatusEvent,
        ProductionJob,
        MachineStatusEvent,
        Machine,
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


@pytest.fixture()
def db_session(db):
    return db


@pytest.fixture()
def machine_factory(db):
    _counter = [0]

    def _create(**kwargs):
        _counter[0] += 1
        num = _counter[0]
        capacity = kwargs.pop("capacity", 500.0)
        status = kwargs.pop("status", Machine.status.type.enums[0] if hasattr(Machine.status, "type") else "IDLE")
        m = Machine(
            code=kwargs.pop("code", f"MCH-{num:04d}"),
            name=kwargs.pop("name", f"Machine {num}"),
            machine_type=kwargs.pop("machine_type", "Weaving Machine"),
            supported_processes=kwargs.pop("supported_processes", "WEAVING,DYEING"),
            capacity_value=capacity,
            capacity_unit=kwargs.pop("capacity_unit", "meters/hr"),
            status=status,
            **kwargs,
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return m

    return _create

