"""Recommendation ↔ scheduling ↔ approval integration + experimental ML ranking (Phase D/E/G)."""

from datetime import datetime, timedelta, timezone

from app.adapters import fixtures  # noqa: F401 — registers fixture inventory/orders/quality
from app.services import allocation_ml


def _machine(client, code, processes="WEAVING", materials="COTTON", capacity=500):
    r = client.post("/api/v1/machines", json={
        "code": code, "name": code, "machine_type": "LOOM",
        "supported_processes": processes, "compatible_materials": materials,
        "capacity_value": capacity, "capacity_unit": "meters/day",
    })
    assert r.status_code == 201
    return r.json()


def _rec(client, **overrides):
    body = {
        "order_ref": "ORD-S1", "required_process": "WEAVING",
        "required_material": "COTTON", "required_quantity": 500,
        "deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }
    body.update(overrides)
    r = client.post("/api/v1/recommendations/machines", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_eligible_candidates_carry_schedule(client):
    _machine(client, "W1")
    rec = _rec(client)
    eligible = [c for c in rec["candidates"] if c["eligible"]]
    assert eligible
    for c in eligible:
        s = c["schedule"]
        assert s is not None
        for key in ("setup_minutes", "processing_minutes", "processing_source", "queue_wait_minutes",
                    "earliest_start_at", "completion_at", "next_available_at",
                    "deadline_feasible", "lateness_minutes", "assumptions", "warnings"):
            assert key in s
        assert s["processing_source"] in ("ml", "rule_capacity")
        assert s["deadline_feasible"] in (True, False, None)
        assert any("horizon" in a.lower() for a in s["assumptions"])
    # ineligible candidates get no schedule
    inelig = [c for c in rec["candidates"] if not c["eligible"]]
    assert all(c["schedule"] is None for c in inelig)


def test_ml_probability_is_optional_and_bounded(client):
    _machine(client, "W1")
    rec = _rec(client)
    for c in rec["candidates"]:
        p = c["ml_selection_probability"]
        assert p is None or (0.0 <= p <= 1.0)


def test_explanation_contains_schedule(client):
    _machine(client, "W1")
    rec = _rec(client)
    assert "Schedule:" in rec["explanation"]
    assert "processing" in rec["explanation"]


def test_ml_note_attached_when_artifact_available(client):
    if not allocation_ml.model_available():
        import pytest
        pytest.skip("allocation artifact not trained")
    _machine(client, "W1")
    rec = _rec(client)
    assert any("synthetic heuristic" in w for w in rec["warnings"])


def test_approval_uses_schedule_times_by_default(client):
    _machine(client, "W1")
    rec = _rec(client)
    ok = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve", json={"decided_by": "Sup1"})
    assert ok.status_code == 200, ok.text
    job_id = ok.json()["assigned_job_id"]
    job = client.get(f"/api/v1/production/jobs/{job_id}").json()
    assert job["planned_start"] is not None
    assert job["planned_end"] is not None
    # schedule details persisted in the recommendation payload (JSON audit column)
    from app.models.recommendation import MachineRecommendation
    # payload is not part of RecommendationOut schema; verify indirectly through job window
    start = datetime.fromisoformat(job["planned_start"])
    end = datetime.fromisoformat(job["planned_end"])
    assert end > start


def test_approval_respects_explicit_times(client):
    _machine(client, "W1")
    rec = _rec(client)
    start = datetime.now(timezone.utc) + timedelta(days=2)
    end = start + timedelta(hours=6)
    ok = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve", json={
        "decided_by": "Sup1", "planned_start": start.isoformat(), "planned_end": end.isoformat(),
    })
    assert ok.status_code == 200
    job = client.get(f"/api/v1/production/jobs/{ok.json()['assigned_job_id']}").json()
    assert job["planned_start"] is not None
    assert job["planned_start"].startswith(start.strftime("%Y-%m-%d"))


def test_approval_after_schedule_change_conflict(client, machine_factory):
    m = _machine(client, "W1")
    rec = _rec(client)
    # committed overlapping job exists with planned window covering next week
    s = datetime.now(timezone.utc) + timedelta(hours=1)
    r = client.post("/api/v1/production/jobs", json={
        "machine_id": m["id"], "order_ref": "BLOCK", "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": 100,
        "planned_start": s.isoformat(), "planned_end": (s + timedelta(days=6)).isoformat(),
    })
    assert r.status_code == 201
    ok = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve", json={"decided_by": "Sup1"})
    # schedule computed earlier now overlaps a committed planned window → conflict or busy revalidation
    assert ok.status_code == 409
    stored = client.get(f"/api/v1/recommendations/machines/{rec['id']}").json()
    assert stored["decision"] == "FAILED_REVALIDATION"


def test_quality_history_unavailable_policy(client):
    """Quality comes from FIXTURE adapter → unknown must stay neutral, never perfect."""
    _machine(client, "W1")
    rec = _rec(client)
    c = next(x for x in rec["candidates"] if x["eligible"])
    assert c["score"]["quality"] == 50.0
    assert c["score"]["quality_known"] is False
    assert any("quality unknown" in w for w in rec["warnings"])


def test_selection_probability_none_without_artifact(monkeypatch):
    monkeypatch.setattr(allocation_ml, "_cache", {})
    monkeypatch.setattr(allocation_ml, "ARTIFACT_PATH", allocation_ml.Path("/nope/x.joblib"))
    monkeypatch.setattr(allocation_ml, "META_PATH", allocation_ml.Path("/nope/x.meta.json"))
    assert allocation_ml.model_available() is False
    from app.models.machine import Machine
    from app.services.scheduling import ScheduleEstimate
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    sched = ScheduleEstimate(
        setup_minutes=15, processing_minutes=60, processing_source="rule_capacity",
        queue_wait_minutes=0, earliest_start_at=now, completion_at=now, next_available_at=now,
        idle_after_minutes=None, deadline_feasible=None, lateness_minutes=None,
    )
    m = Machine(code="X", name="X", machine_type="LOOM", supported_processes="WEAVING",
                compatible_materials="", capacity_value=100, capacity_unit="meters/day")
    assert allocation_ml.selection_probability(m, process="WEAVING", quantity_kg=None, schedule=sched) is None
