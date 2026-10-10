"""Test fixtures: SQLite in-memory database with dependency override.

Migrations still target PostgreSQL; API tests use SQLite for speed/isolation.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import *  # noqa: F401,F403 — register tables


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session):
    def override():
        yield db_session

    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def machine_factory(db_session):
    from app.models.machine import Machine, MachineStatus

    def _make(code="M1", processes="WEAVING", materials="COTTON", capacity=500.0, status=MachineStatus.IDLE):
        m = Machine(
            code=code,
            name=f"Machine {code}",
            machine_type="LOOM",
            supported_processes=processes,
            compatible_materials=materials,
            capacity_value=capacity,
            capacity_unit="meters/day",
            status=status,
        )
        db_session.add(m)
        db_session.commit()
        db_session.refresh(m)
        return m

    return _make
