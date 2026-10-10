"""Duration model behavior + scheduling engine calculations (Phase B/D)."""

from datetime import timedelta

import pytest

from app.services import duration as duration_service
from app.services import scheduling as scheduling_service


def _feature_row(**overrides) -> dict:
    row = {
        "machine_id": "M-1",
        "machine_type": "WEAVING",
        "process_type": "WEAVING",
        "fabric_type": "COTTON_PLAIN",
        "fiber_composition": "COTTON",
        "color_family": "WHITE",
        "gsm": 180.0,
        "fabric_width_cm": 150.0,
        "batch_quantity_kg": 400.0,
        "priority": "NORMAL",
        "machine_capacity_kg_per_batch": 500.0,
        "machine_nominal_rate_kg_per_hour": 55.0,
        "machine_efficiency_pct": 87.0,
        "machine_availability_pct": 92.0,
        "setup_base_minutes": 22.0,
        "estimated_queue_wait_minutes": 30.0,
    }
    row.update(overrides)
    return row


# --- schema validation -----------------------------------------------------


def test_missing_feature_rejected():
    row = _feature_row()
    del row["gsm"]
    with pytest.raises(duration_service.InvalidFeaturesError):
        duration_service.validate_feature_row(row)


def test_non_numeric_feature_rejected():
    row = _feature_row(batch_quantity_kg="lots")
    with pytest.raises(duration_service.InvalidFeaturesError):
        duration_service.validate_feature_row(row)


# --- missing artifact behavior ---------------------------------------------


def test_missing_artifact_raises_and_falls_back_to_rule(monkeypatch, machine_factory):
    monkeypatch.setattr(duration_service, "ARTIFACT_PATH", duration_service.Path("/nonexistent/x.joblib"))
    monkeypatch.setattr(duration_service, "META_PATH", duration_service.Path("/nonexistent/x.meta.json"))
    monkeypatch.setattr(duration_service, "_cache", {})
    with pytest.raises(duration_service.ModelUnavailableError):
        duration_service.load_model()
    est = scheduling_service.estimate_processing(machine_factory(), 500, "kg", "WEAVING")
    assert est.source == "rule_capacity"
    assert est.minutes > 0
    assert any("missing" in w.lower() or "artifact" in w.lower() for w in est.warnings)


# --- artifact present behavior ---------------------------------------------


@pytest.mark.skipif(not duration_service.model_available(), reason="duration artifact not trained")
def test_predict_returns_plausible_minutes():
    est = duration_service.predict_processing_minutes(_feature_row())
    assert est.source == "ml"
    assert est.model_version == "duration-v1"
    assert 0 <= est.minutes < 10000


@pytest.mark.skipif(not duration_service.model_available(), reason="duration artifact not trained")
def test_training_is_reproducible():
    """Same seed + same data → identical predictions (pipeline determinism)."""
    from pathlib import Path

    import pandas as pd
    from sklearn.compose import ColumnTransformer
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder

    from app.ml.schema import CATEGORICAL_FEATURES, NUMERIC_FEATURES, TARGET

    csv = Path(__file__).resolve().parents[3] / "dataset" / "textile_production_scheduling_dataset" / "production_history.csv"
    if not csv.exists():
        pytest.skip("dataset not present")
    df = pd.read_csv(csv).head(400)
    preds = []
    for _ in range(2):
        pre = ColumnTransformer([
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("num", "passthrough", NUMERIC_FEATURES),
        ])
        pipe = Pipeline([("pre", pre), ("rf", RandomForestRegressor(n_estimators=25, random_state=7))])
        pipe.fit(df[CATEGORICAL_FEATURES + NUMERIC_FEATURES], df[TARGET])
        preds.append(pipe.predict(df[CATEGORICAL_FEATURES + NUMERIC_FEATURES].head(50)))
    assert (preds[0] == preds[1]).all()


# --- scheduling engine ------------------------------------------------------


def test_completion_invariant_and_sources(db_session, machine_factory):
    m = machine_factory(capacity=500)
    s = scheduling_service.compute_schedule(db_session, m, 500, "meters", "WEAVING")
    expected = s.earliest_start_at + timedelta(minutes=s.setup_minutes + s.processing_minutes)
    assert s.completion_at == expected
    assert s.next_available_at == s.completion_at
    assert s.processing_source in ("ml", "rule_capacity")
    assert any("Planning horizon" in a for a in s.assumptions)
    assert any("Setup" in a or "setup" in a for a in s.assumptions)


def test_queue_wait_from_active_job(db_session, machine_factory):
    from app.models.production import ProductionJob, ProductionJobStatus

    m = machine_factory(capacity=500)
    job = ProductionJob(
        machine_id=m.id, order_ref="Q1", material_spec="COTTON", required_process="WEAVING",
        planned_quantity=1000, actual_quantity=0, status=ProductionJobStatus.IN_PROGRESS,
    )
    db_session.add(job)
    db_session.commit()
    s = scheduling_service.compute_schedule(db_session, m, 200, "meters", "WEAVING")
    assert s.queue_wait_minutes > 0
    assert s.earliest_start_at > scheduling_service.utcnow()


def test_deadline_lateness_and_feasibility(db_session, machine_factory):
    m = machine_factory(capacity=500)
    past = scheduling_service.utcnow() - timedelta(minutes=5)
    s = scheduling_service.compute_schedule(db_session, m, 500, "meters", "WEAVING", deadline=past)
    assert s.deadline_feasible is False
    assert s.lateness_minutes > 0
    future = scheduling_service.utcnow() + timedelta(days=13)
    s2 = scheduling_service.compute_schedule(db_session, m, 100, "meters", "WEAVING", deadline=future)
    assert s2.deadline_feasible is True
    assert s2.lateness_minutes == 0.0


def test_idle_interval_only_when_next_job_committed(db_session, machine_factory):
    from datetime import datetime, timezone

    from app.models.production import ProductionJob, ProductionJobStatus

    m = machine_factory(capacity=500)
    s = scheduling_service.compute_schedule(db_session, m, 100, "meters", "WEAVING")
    assert s.idle_after_minutes is None
    assert any("idle_after_job_minutes not predictable" in w for w in s.warnings)

    start = scheduling_service.utcnow() + timedelta(days=5)
    db_session.add(ProductionJob(
        machine_id=m.id, order_ref="NEXT", material_spec="COTTON", required_process="WEAVING",
        planned_quantity=10, status=ProductionJobStatus.PLANNED,
        planned_start=start, planned_end=start + timedelta(hours=1),
    ))
    db_session.commit()
    s2 = scheduling_service.compute_schedule(db_session, m, 100, "meters", "WEAVING")
    assert s2.idle_after_minutes is not None and s2.idle_after_minutes > 0
    assert s2.completion_at < start


def test_meters_without_gsm_uses_rule_source(db_session, machine_factory):
    m = machine_factory(capacity=500)
    s = scheduling_service.compute_schedule(db_session, m, 500, "meters", "WEAVING")
    assert s.processing_source == "rule_capacity"  # not convertible to kg without gsm/width
    assert any("not convertible" in w or "kg" in w for w in s.warnings)


def test_maintenance_machine_not_scheduled_by_recommendation(client, db_session, machine_factory):
    from app.adapters import fixtures  # noqa: F401

    m = machine_factory(status=__import__("app.models.machine", fromlist=["MachineStatus"]).MachineStatus.MAINTENANCE)
    r = client.post("/api/v1/recommendations/machines", json={
        "order_ref": "ORD-X", "required_process": "WEAVING",
        "required_material": "COTTON", "required_quantity": 100,
    })
    assert r.status_code == 201
    cand = next(c for c in r.json()["candidates"] if c["machine_id"] == m.id)
    assert cand["eligible"] is False
    assert cand["schedule"] is None
