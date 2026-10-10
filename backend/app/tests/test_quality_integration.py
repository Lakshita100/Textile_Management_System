"""Production <-> Quality integration tests (Feature 02 + Feature 03).

Covers: persisted quality feeding analytics and scheduling scores, the full
job -> inspection workflow, and the business-rule guarantees (completion is
not quality approval; quality failure never cancels or mutates jobs).
"""

from datetime import date, datetime, timedelta, timezone


def _machine(client, code="QW1", processes="WEAVING"):
    r = client.post("/api/v1/machines", json={
        "code": code, "name": f"Machine {code}", "machine_type": "LOOM",
        "supported_processes": processes, "compatible_materials": "COTTON",
        "capacity_value": 500, "capacity_unit": "meters/day",
    })
    assert r.status_code == 201
    return r.json()


def _job(client, machine_id, qty=200, order_ref="ORD-INT"):
    r = client.post("/api/v1/production/jobs", json={
        "machine_id": machine_id, "order_ref": order_ref, "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": qty,
    })
    assert r.status_code == 201, r.text
    return r.json()


def _inspect(client, job_id, **overrides):
    body = {
        "job_id": job_id,
        "employee_id": "EMP-001",
        "inspector_name": "Meera P.",
        "inspected_at": date.today().isoformat(),
        "inspected_qty_meters": 100,
        "defects": [],
    }
    body.update(overrides)
    r = client.post("/api/v1/quality/inspections", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_analytics_defect_rate_never_fabricated_then_populated(client):
    m = _machine(client)
    job = _job(client, m["id"])
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 100})

    # No quality history -> explicitly unavailable (null + note), never a number
    rows = client.get("/api/v1/production/analytics", params={"machine_id": m["id"]}).json()
    assert rows[0]["defect_rate_percent"] is None
    assert "not fabricated" in rows[0]["defect_note"]

    # Persisted inspection -> real computed metric
    _inspect(client, job["id"], defects=[{"type": "Holes", "count": 4, "severity": "High"}])
    rows = client.get("/api/v1/production/analytics", params={"machine_id": m["id"]}).json()
    assert rows[0]["defect_rate_percent"] == 4.0  # 4 defects / 100 m * 100
    assert "1 persisted inspection" in rows[0]["defect_note"]

    # Production metrics unaffected by quality data
    assert rows[0]["actual_quantity"] == 100


def test_recommendation_quality_neutral_then_real(client):
    m = _machine(client, code="QR1")
    rec = client.post("/api/v1/recommendations/machines", json={
        "order_ref": "ORD-QR", "required_process": "WEAVING", "required_material": "COTTON",
        "required_quantity": 300,
        "deadline": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
    }).json()
    cand = next(c for c in rec["candidates"] if c["machine_code"] == "QR1")
    # No history -> neutral 50 with explicit warning (never silent, never perfect)
    assert cand["score"]["quality"] == 50.0
    assert cand["score"]["quality_known"] is False
    assert any("Insufficient linked inspection history" in w for w in rec["warnings"])
    assert any("Insufficient linked inspection history" in w for w in cand["warnings"])

    # Build a real history: 3 inspections on jobs of this machine (2 pass, 1 rework)
    job = _job(client, m["id"], qty=300, order_ref="ORD-QR")
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 300})
    _inspect(client, job["id"], inspected_qty_meters=100, defects=[])  # Approved
    _inspect(client, job["id"], inspected_qty_meters=100, defects=[])  # Approved
    _inspect(client, job["id"], inspected_qty_meters=100,
             defects=[{"type": "Holes", "count": 2, "severity": "Medium"}])  # Rework

    rec2 = client.post("/api/v1/recommendations/machines", json={
        "order_ref": "ORD-QR2", "required_process": "WEAVING", "required_material": "COTTON",
        "required_quantity": 300,
        "deadline": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
    }).json()
    cand2 = next(c for c in rec2["candidates"] if c["machine_code"] == "QR1")
    # Real pass rate from persisted rows: 2 Approved / 3 = 66.67
    assert cand2["score"]["quality_known"] is True
    assert cand2["score"]["quality"] == round(100.0 * 2 / 3, 2)
    assert cand2["score"]["final_score"] is not None


def test_insufficient_history_stays_neutral(client):
    m = _machine(client, code="QS1")
    job = _job(client, m["id"], qty=300)
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 300})
    _inspect(client, job["id"], defects=[])  # only 1 sample (minimum is REC_MIN_QUALITY_SAMPLES=3)

    rec = client.post("/api/v1/recommendations/machines", json={
        "order_ref": "ORD-QS", "required_process": "WEAVING", "required_material": "COTTON",
        "required_quantity": 300,
        "deadline": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
    }).json()
    cand = next(c for c in rec["candidates"] if c["machine_code"] == "QS1")
    assert cand["score"]["quality"] == 50.0
    assert cand["score"]["quality_known"] is False
    assert any("Insufficient linked inspection history" in w for w in rec["warnings"])
    assert any("Insufficient linked inspection history" in w for w in cand["warnings"])


def test_full_workflow_job_to_inspection_to_dashboard(client):
    # 1) Machine + job lifecycle (Feature 02)
    m = _machine(client, code="QF1")
    job = _job(client, m["id"], qty=150, order_ref="ORD-FULL")
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 150})
    done = client.post(f"/api/v1/production/jobs/{job['id']}/complete", json={}).json()
    assert done["status"] == "COMPLETED"

    # 2) Quality inspection against the completed job (Feature 03)
    created = _inspect(client, job["id"], inspected_qty_meters=150,
                       defects=[{"type": "Colour mismatch", "count": 6, "severity": "Medium"}])
    assert created["outcome"] == "Rework"
    assert created["accepted_qty_meters"] == 144

    # 3) The inspection is visible in the persisted list after a fresh fetch
    page = client.get("/api/v1/quality/inspections", params={"job_id": job["id"]}).json()
    assert page["total"] == 1
    assert page["items"][0]["id"] == created["id"]

    # 4) Dashboard reflects it
    b = client.get("/api/v1/quality/dashboard").json()
    assert b["stats"]["total_inspections"] == 1
    assert b["stats"]["rework_count"] == 1
    summary = next(s for s in b["summaries"] if s["machine"]["id"] == "QF1")
    assert summary["needs_investigation"] is True

    # 5) Analytics reflects it
    rows = client.get("/api/v1/production/analytics", params={"machine_id": m["id"]}).json()
    assert rows[0]["defect_rate_percent"] == 4.0  # 6/150*100

    # 6) Quality failure does NOT cancel or mutate the production job
    fresh_job = client.get(f"/api/v1/production/jobs/{job['id']}").json()
    assert fresh_job["status"] == "COMPLETED"
    assert fresh_job["actual_quantity"] == 150
    # and creating the inspection added no jobs of its own
    all_jobs = client.get("/api/v1/production/jobs").json()
    assert all_jobs["total"] == 1


def test_completion_is_not_quality_approval(client):
    """A completed job with zero inspections has no quality standing."""
    m = _machine(client, code="QC1")
    job = _job(client, m["id"], qty=100)
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 100})
    client.post(f"/api/v1/production/jobs/{job['id']}/complete", json={})

    assert client.get("/api/v1/quality/inspections", params={"job_id": job["id"]}).json()["total"] == 0
    b = client.get("/api/v1/quality/dashboard").json()
    assert b["stats"]["total_inspections"] == 0
    rows = client.get("/api/v1/production/analytics", params={"machine_id": m["id"]}).json()
    assert rows[0]["defect_rate_percent"] is None


def test_completed_job_still_inspectable_after_completion(client):
    m = _machine(client, code="QD1")
    job = _job(client, m["id"], qty=80)
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 80})
    client.post(f"/api/v1/production/jobs/{job['id']}/complete", json={})

    active = client.get(f"/api/v1/quality/machines/{m['id']}/inspectable-job").json()
    assert active is not None and active["job_id"] == job["id"]
    assert active["status"] == "COMPLETED"
    created = _inspect(client, job["id"], inspected_qty_meters=80, defects=[])
    assert created["outcome"] == "Approved"
