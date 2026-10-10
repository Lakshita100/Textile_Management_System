from datetime import datetime, timedelta, timezone


def _machine(client, code="P1", processes="WEAVING"):
    r = client.post("/api/v1/machines", json={
        "code": code, "name": code, "machine_type": "LOOM",
        "supported_processes": processes, "compatible_materials": "COTTON",
        "capacity_value": 500, "capacity_unit": "meters/day",
    })
    assert r.status_code == 201
    return r.json()


def _job(client, machine_id, qty=100, **extra):
    body = {
        "machine_id": machine_id, "order_ref": "ORD-1", "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": qty,
    }
    body.update(extra)
    return client.post("/api/v1/production/jobs", json=body)


def test_create_job_and_lifecycle(client):
    m = _machine(client)
    r = _job(client, m["id"])
    assert r.status_code == 201
    job = r.json()
    assert job["status"] == "PLANNED"
    assert client.post(f"/api/v1/production/jobs/{job['id']}/start", json={}).json()["status"] == "IN_PROGRESS"
    r = client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 40})
    assert r.json()["completion_percent"] == 40.0
    r = client.post(f"/api/v1/production/jobs/{job['id']}/pause", json={})
    assert r.json()["status"] == "PAUSED"
    r = client.post(f"/api/v1/production/jobs/{job['id']}/resume", json={})
    assert r.json()["status"] == "IN_PROGRESS"
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 100})
    r = client.post(f"/api/v1/production/jobs/{job['id']}/complete", json={})
    assert r.json()["status"] == "COMPLETED"
    assert r.json()["actual_end"] is not None


def test_invalid_transitions_rejected(client):
    m = _machine(client)
    job = _job(client, m["id"]).json()
    # PLANNED cannot pause/complete
    assert client.post(f"/api/v1/production/jobs/{job['id']}/pause", json={}).status_code == 409
    assert client.post(f"/api/v1/production/jobs/{job['id']}/complete", json={}).status_code == 409
    # COMPLETED is terminal
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 10})
    client.post(f"/api/v1/production/jobs/{job['id']}/complete", json={})
    assert client.post(f"/api/v1/production/jobs/{job['id']}/start", json={}).status_code == 409


def test_negative_and_overproduction_rejected(client):
    m = _machine(client)
    job = _job(client, m["id"], qty=50).json()
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    assert client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": -5}).status_code == 422
    assert client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": 80}).status_code == 422


def test_duplicate_active_assignment_rejected(client):
    m = _machine(client)
    job = _job(client, m["id"]).json()
    # Second job while first is only PLANNED → schedule conflict (unbounded windows overlap)
    r = _job(client, m["id"], order_ref="ORD-2")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "SCHEDULE_CONFLICT"
    # Once first job is started, second attempt is a duplicate active assignment
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    r = _job(client, m["id"], order_ref="ORD-3")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "DUPLICATE_ACTIVE_ASSIGNMENT"


def test_incompatible_process_rejected(client):
    m = _machine(client, processes="WEAVING")
    r = _job(client, m["id"], **{"required_process": "DYEING"})
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "INCOMPATIBLE_PROCESS"


def test_maintenance_blocks_assignment(client):
    m = _machine(client)
    client.patch(f"/api/v1/machines/{m['id']}/status", json={"status": "MAINTENANCE", "reason": "service"})
    r = _job(client, m["id"])
    assert r.status_code == 409


def test_complete_zero_output_rejected(client):
    m = _machine(client)
    job = _job(client, m["id"]).json()
    client.post(f"/api/v1/production/jobs/{job['id']}/start", json={})
    r = client.post(f"/api/v1/production/jobs/{job['id']}/complete", json={})
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "NO_OUTPUT"


def test_downtime_record(client):
    m = _machine(client)
    start = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    end = datetime.now(timezone.utc).isoformat()
    r = client.post("/api/v1/production/downtime", json={
        "machine_id": m["id"], "reason": "belt snap", "started_at": start, "ended_at": end,
    })
    assert r.status_code == 201
    assert r.json()["duration_minutes"] == 60.0


def test_dashboard_counts(client):
    m1 = _machine(client, code="A1")
    _machine(client, code="A2")
    client.patch(f"/api/v1/machines/{m1['id']}/status", json={"status": "RUNNING"})
    d = client.get("/api/v1/production/dashboard").json()
    assert d["total_machines"] == 2
    assert d["running"] == 1
    assert d["idle"] == 1
