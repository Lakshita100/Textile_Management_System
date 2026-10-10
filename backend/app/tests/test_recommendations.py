from datetime import datetime, timedelta, timezone

from app.adapters import fixtures


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
        "order_ref": "ORD-R1", "required_process": "WEAVING",
        "required_material": "COTTON", "required_quantity": 500,
        "deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }
    body.update(overrides)
    r = client.post("/api/v1/recommendations/machines", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_compatible_machine_ranked(client):
    _machine(client, "W1", capacity=500)
    _machine(client, "W2", capacity=300)
    rec = _rec(client)
    assert rec["recommended_machine_code"] == "W1"  # more capacity → fewer days → higher workload slack
    assert rec["material_available"] is True
    eligible = [c for c in rec["candidates"] if c["eligible"]]
    assert eligible[0]["score"]["final_score"] >= eligible[1]["score"]["final_score"]


def test_incompatible_machine_excluded(client):
    _machine(client, "D1", processes="DYEING", materials="POLYESTER")
    rec = _rec(client)
    assert rec["recommended_machine_code"] is None
    c = rec["candidates"][0]
    assert c["eligible"] is False
    assert any("process" in r.lower() for r in c["exclusion_reasons"])


def test_insufficient_material_blocks(client):
    _machine(client, "W1")
    rec = _rec(client, required_material="POLYESTER", required_quantity=900)
    assert rec["material_available"] is False
    assert rec["recommended_machine_code"] is None
    assert "Insufficient" in rec["material_note"]


def test_maintenance_machine_excluded(client):
    m = _machine(client, "W1")
    client.patch(f"/api/v1/machines/{m['id']}/status", json={"status": "MAINTENANCE", "reason": "svc"})
    rec = _rec(client)
    assert rec["recommended_machine_code"] is None
    c = rec["candidates"][0]
    assert c["eligible"] is False
    assert any("MAINTENANCE" in r for r in c["exclusion_reasons"])


def test_missing_history_never_perfect(client):
    _machine(client, "W1")
    rec = _rec(client)
    c = next(x for x in rec["candidates"] if x["eligible"])
    assert c["score"]["efficiency_known"] is False
    assert c["score"]["quality_known"] is False
    assert c["score"]["efficiency"] == 50.0
    assert c["score"]["quality"] == 50.0
    assert any("efficiency unknown" in w for w in rec["warnings"])


def test_deadline_too_soon_excludes(client):
    _machine(client, "W1", capacity=10)  # 10 m/day → 500m needs 50 days
    rec = _rec(client, required_quantity=500, deadline=(datetime.now(timezone.utc) + timedelta(days=2)).isoformat())
    assert rec["recommended_machine_code"] is None
    c = rec["candidates"][0]
    assert c["eligible"] is False
    assert any("time" in r.lower() or "finish" in r.lower() for r in c["exclusion_reasons"])


def test_active_job_machine_ranked_lower_or_equal(client):
    m1 = _machine(client, "W1", capacity=500)
    _machine(client, "W2", capacity=500)
    # W1 gets an active job
    client.post("/api/v1/production/jobs", json={
        "machine_id": m1["id"], "order_ref": "X", "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": 2000,
    })
    job = client.get("/api/v1/production/jobs").json()["items"][0]
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    rec = _rec(client, required_quantity=400)
    by_code = {c["machine_code"]: c for c in rec["candidates"] if c["eligible"]}
    assert by_code["W2"]["score"]["final_score"] >= by_code["W1"]["score"]["final_score"]


def test_approval_creates_job_and_is_onetime(client):
    _machine(client, "W1")
    rec = _rec(client)
    ok = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve", json={"decided_by": "Sup1"})
    assert ok.status_code == 200
    data = ok.json()
    assert data["decision"] == "APPROVED"
    assert data["assigned_job_id"] is not None
    # repeated approval rejected
    again = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve", json={"decided_by": "Sup2"})
    assert again.status_code == 409


def test_approval_revalidates_busy_machine(client):
    m1 = _machine(client, "W1")
    rec = _rec(client)
    # commit W1 to another job before approval
    client.post("/api/v1/production/jobs", json={
        "machine_id": m1["id"], "order_ref": "OTHER", "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": 100,
    })
    job = client.get("/api/v1/production/jobs").json()["items"][0]
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    r = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve", json={"decided_by": "Sup1"})
    assert r.status_code == 409
    stored = client.get(f"/api/v1/recommendations/machines/{rec['id']}").json()
    assert stored["decision"] == "FAILED_REVALIDATION"


def test_deterministic_scoring(client):
    _machine(client, "W1")
    rec1 = _rec(client)
    rec2 = _rec(client)
    s1 = next(c for c in rec1["candidates"] if c["eligible"])["score"]
    s2 = next(c for c in rec2["candidates"] if c["eligible"])["score"]
    assert s1 == s2
