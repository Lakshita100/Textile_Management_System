"""Scheduling API endpoints: validation, explicit errors, timeline (Phase E)."""

from app.services import duration as duration_service


def test_estimate_unknown_machine_404(client):
    r = client.post("/api/v1/scheduling/estimate-duration", json={
        "machine_id": 9999, "quantity": 100, "unit": "kg", "process": "WEAVING",
    })
    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "MACHINE_NOT_FOUND"


def test_estimate_invalid_quantity_422(client, machine_factory):
    m = machine_factory()
    r = client.post("/api/v1/scheduling/estimate-duration", json={
        "machine_id": m.id, "quantity": -5, "unit": "kg", "process": "WEAVING",
    })
    assert r.status_code == 422


def test_estimate_missing_model_503(client, machine_factory, monkeypatch):
    m = machine_factory()
    monkeypatch.setattr(duration_service, "model_available", lambda: False)
    r = client.post("/api/v1/scheduling/estimate-duration", json={
        "machine_id": m.id, "quantity": 100, "unit": "kg", "process": "WEAVING",
    })
    assert r.status_code == 503
    assert r.json()["detail"]["code"] == "MODEL_UNAVAILABLE"


def test_estimate_happy_path_ok(client, machine_factory):
    if not duration_service.model_available():
        import pytest
        pytest.skip("duration artifact not trained")
    m = machine_factory()
    r = client.post("/api/v1/scheduling/estimate-duration", json={
        "machine_id": m.id, "quantity": 400, "unit": "kg", "process": "WEAVING",
        "gsm": 180, "width_cm": 150, "fabric_type": "COTTON_PLAIN",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["minutes"] > 0
    assert body["source"] in ("ml", "rule_capacity")
    assert isinstance(body["warnings"], list)


def test_timeline_ok(client, machine_factory):
    from datetime import datetime, timedelta, timezone

    m = machine_factory()
    start = datetime.now(timezone.utc)
    # create a planned job through the public API
    r = client.post("/api/v1/production/jobs", json={
        "machine_id": m.id, "order_ref": "TL1", "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": 100,
        "planned_start": start.isoformat(),
        "planned_end": (start + timedelta(hours=1)).isoformat(),
    })
    assert r.status_code == 201, r.text

    t = client.get(f"/api/v1/scheduling/machines/{m.id}/timeline")
    assert t.status_code == 200
    body = t.json()
    assert body["machine_id"] == m.id
    assert body["next_available_at"] >= body["now"]
    assert any(iv["kind"] == "planned_job" for iv in body["busy_intervals"])
    assert body["assumptions"]


def test_timeline_unknown_machine_404(client):
    r = client.get("/api/v1/scheduling/machines/424242/timeline")
    assert r.status_code == 404
