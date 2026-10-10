"""Quality inspection API tests (Feature 03 contract, persisted)."""

from datetime import date


def _machine(client, code="Q1", processes="WEAVING"):
    r = client.post("/api/v1/machines", json={
        "code": code, "name": f"Machine {code}", "machine_type": "LOOM",
        "supported_processes": processes, "compatible_materials": "COTTON",
        "capacity_value": 500, "capacity_unit": "meters/day",
    })
    assert r.status_code == 201
    return r.json()


def _job(client, machine_id, qty=100, order_ref="ORD-Q1"):
    r = client.post("/api/v1/production/jobs", json={
        "machine_id": machine_id, "order_ref": order_ref, "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": qty,
    })
    assert r.status_code == 201, r.text
    return r.json()


def _job_with_output(client, machine_id, actual=100, order_ref="ORD-Q1"):
    job = _job(client, machine_id, order_ref=order_ref)
    assert client.post(f"/api/v1/production/jobs/{job['id']}/start", json={}).json()["status"] == "IN_PROGRESS"
    r = client.patch(f"/api/v1/production/jobs/{job['id']}/progress", json={"actual_quantity": actual})
    assert r.status_code == 200, r.text
    return r.json()


def _payload(job_id, **overrides):
    body = {
        "job_id": job_id,
        "employee_id": "EMP-001",
        "inspector_name": "Meera P.",
        "inspected_at": date.today().isoformat(),
        "inspected_qty_meters": 100,
        "defects": [],
        "remarks": None,
    }
    body.update(overrides)
    return body


def _create(client, job_id, **overrides):
    return client.post("/api/v1/quality/inspections", json=_payload(job_id, **overrides))


def test_create_derives_batch_roll_and_computes_outcome(client):
    m = _machine(client)
    job = _job_with_output(client, m["id"], actual=100)

    r = _create(client, job["id"], defects=[{"type": "Holes", "count": 3, "severity": "High"}])
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["outcome"] == "Rework"            # defects -> defective metres held
    assert created["accepted_qty_meters"] == 97      # max(0, 100 - 3)
    assert created["total_defect_count"] == 3
    assert created["batch_no"] == f"BATCH-{job['id']}"
    assert created["roll_id"] == f"BATCH-{job['id']}-R1"
    assert created["order_ref"] == "ORD-Q1"
    assert created["machine_code"] == "Q1"
    assert created["job_status"] == "IN_PROGRESS"    # completion != approval, status untouched
    assert created["source"] == "session-entry"

    # Second inspection on the same job increments the roll number.
    r2 = _create(client, job["id"], defects=[{"type": "Oil stain", "count": 1, "severity": "Low"}])
    assert r2.status_code == 201
    assert r2.json()["roll_id"] == f"BATCH-{job['id']}-R2"


def test_zero_defects_auto_approved(client):
    m = _machine(client)
    job = _job_with_output(client, m["id"], actual=50)
    r = _create(client, job["id"], inspected_qty_meters=50, defects=[])
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["outcome"] == "Approved"
    assert body["accepted_qty_meters"] == 50
    assert body["total_defect_count"] == 0


def test_rejected_not_available_via_create(client):
    m = _machine(client)
    job = _job_with_output(client, m["id"])
    # Client-supplied outcome is ignored: server derives from defects only.
    r = _create(client, job["id"], outcome="Rejected",
                defects=[{"type": "Holes", "count": 1, "severity": "Low"}])
    assert r.status_code == 201
    assert r.json()["outcome"] == "Rework"
    # Rejection is only reachable through the disposition update (covered below).

def test_eligibility_and_reference_errors(client):
    m = _machine(client)
    planned = _job(client, m["id"], order_ref="ORD-PLAN")

    # PLANNED jobs are not inspectable
    r = _create(client, planned["id"])
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "JOB_NOT_INSPECTABLE"
    # free the machine so the next job can be created
    assert client.post(f"/api/v1/production/jobs/{planned['id']}/cancel", json={}).status_code == 200

    # Started but zero output
    job0 = _job(client, m["id"], order_ref="ORD-ZERO")
    client.post(f"/api/v1/production/jobs/{job0['id']}/start", json={})
    r = _create(client, job0["id"])
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "NO_OUTPUT_RECORDED"

    # Unknown job
    r = _create(client, 99999)
    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "JOB_NOT_FOUND"


def test_quantity_and_crosscheck_validation(client):
    m = _machine(client)
    job = _job_with_output(client, m["id"], actual=80)

    # Exceeds recorded output
    r = _create(client, job["id"], inspected_qty_meters=90)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "EXCEEDS_OUTPUT"

    # Wrong machine cross-check (quantity kept valid so the cross-check is reached)
    m2 = _machine(client, code="Q2")
    assert m2["id"] != m["id"]
    r = _create(client, job["id"], inspected_qty_meters=80, machine_code="Q2")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "MACHINE_MISMATCH"

    # Wrong order cross-check
    r = _create(client, job["id"], inspected_qty_meters=80, order_ref="ORD-OTHER")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "ORDER_MISMATCH"

    # Schema-level rejections (422)
    assert _create(client, job["id"], inspected_qty_meters=0).status_code == 422
    assert _create(client, job["id"], inspected_qty_meters=-5).status_code == 422
    assert _create(client, job["id"], defects=[{"type": "Holes", "count": 0, "severity": "High"}]).status_code == 422
    assert _create(client, job["id"], defects=[{"type": "Holes", "count": 2, "severity": "Critical"}]).status_code == 422
    assert _create(client, job["id"], defects=[{"type": "", "count": 1, "severity": "Low"}]).status_code == 422


def test_list_filters_search_and_order(client):
    m1 = _machine(client, code="Q1")
    m2 = _machine(client, code="Q2")
    j1 = _job_with_output(client, m1["id"], actual=100, order_ref="ORD-A")
    j2 = _job_with_output(client, m2["id"], actual=60, order_ref="ORD-B")

    a = _create(client, j1["id"], defects=[]).json()
    b = _create(client, j2["id"], inspected_qty_meters=60,
                defects=[{"type": "Weft bar", "count": 2, "severity": "Medium"}]).json()

    r = client.get("/api/v1/quality/inspections")
    assert r.status_code == 200
    page = r.json()
    assert page["total"] == 2
    # sorted by inspected_at desc, id desc
    assert [i["id"] for i in page["items"]] == sorted([a["id"], b["id"]], reverse=True)

    assert client.get("/api/v1/quality/inspections", params={"outcome": "Rework"}).json()["total"] == 1
    assert client.get("/api/v1/quality/inspections", params={"machine_code": "Q1"}).json()["items"][0]["id"] == a["id"]
    assert client.get("/api/v1/quality/inspections", params={"job_id": j2["id"]}).json()["total"] == 1
    assert client.get("/api/v1/quality/inspections", params={"employee_id": "EMP-NOPE"}).json()["total"] == 0

    # search matches roll / batch / order / machine / inspector / numeric id
    assert client.get("/api/v1/quality/inspections", params={"search": b["roll_id"]}).json()["total"] == 1
    assert client.get("/api/v1/quality/inspections", params={"search": "ORD-A"}).json()["total"] == 1
    assert client.get("/api/v1/quality/inspections", params={"search": "Q2"}).json()["total"] == 1
    assert client.get("/api/v1/quality/inspections", params={"search": "Meera"}).json()["total"] == 2
    id_hits = client.get("/api/v1/quality/inspections", params={"search": str(a["id"])}).json()["items"]
    assert any(i["id"] == a["id"] for i in id_hits)  # numeric id participates (may co-match rolls)


def test_get_and_disposition_update(client):
    m = _machine(client)
    job = _job_with_output(client, m["id"])
    created = _create(client, job["id"], defects=[{"type": "Holes", "count": 1, "severity": "Low"}],
                      remarks="initial").json()

    r = client.get(f"/api/v1/quality/inspections/{created['id']}")
    assert r.status_code == 200
    assert r.json()["remarks"] == "initial"

    # Disposition update: Rework -> Rejected (supervisor decision), remarks editable
    r = client.patch(f"/api/v1/quality/inspections/{created['id']}",
                     json={"outcome": "Rejected", "remarks": "full roll condemned"})
    assert r.status_code == 200, r.text
    assert r.json()["outcome"] == "Rejected"
    assert r.json()["remarks"] == "full roll condemned"
    # Measurements untouched by the update
    assert r.json()["inspected_qty_meters"] == 100
    assert r.json()["accepted_qty_meters"] == 99

    # Measurement fields are immutable
    r = client.patch(f"/api/v1/quality/inspections/{created['id']}", json={"inspected_qty_meters": 50})
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "IMMUTABLE_FIELDS"
    r = client.patch(f"/api/v1/quality/inspections/{created['id']}",
                     json={"defects": [{"type": "Holes", "count": 9, "severity": "High"}]})
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "IMMUTABLE_FIELDS"

    # Empty update and invalid outcome
    assert client.patch(f"/api/v1/quality/inspections/{created['id']}", json={}).status_code == 409
    r = client.patch(f"/api/v1/quality/inspections/{created['id']}", json={"outcome": "Maybe"})
    assert r.status_code == 422

    # Unknown inspection
    assert client.patch("/api/v1/quality/inspections/99999", json={"outcome": "Approved"}).status_code == 404
    assert client.get("/api/v1/quality/inspections/99999").status_code == 404


def test_dashboard_empty_represents_unavailable_not_failure(client):
    _machine(client, code="Q1")
    r = client.get("/api/v1/quality/dashboard")
    assert r.status_code == 200
    b = r.json()
    assert b["stats"]["total_inspections"] == 0
    assert b["stats"]["machines_flagged"] == 0
    assert b["trend"] == [] and b["by_type"] == []
    assert len(b["summaries"]) == 1
    s = b["summaries"][0]
    assert s["machine"]["id"] == "Q1"
    assert s["needs_investigation"] is False           # no history is NOT a failure
    assert s["flag_reason"] == "No inspection history"
    assert s["inspections"] == 0
    assert b["matrix"][0]["counts"]["Holes"] == 0


def test_dashboard_from_persisted_inspections(client):
    m = _machine(client, code="Q1")
    job = _job_with_output(client, m["id"], actual=100)
    # 100 m, 5 defects -> rate 5/100m > 0.5 threshold -> flagged
    _create(client, job["id"], defects=[{"type": "Holes", "count": 5, "severity": "High"}])

    b = client.get("/api/v1/quality/dashboard").json()
    assert b["stats"]["total_inspections"] == 1
    assert b["stats"]["defect_rate_per_100m"] == 5.0
    assert b["stats"]["pass_rate_percent"] == 0        # Rework is not a pass
    assert b["stats"]["rework_count"] == 1
    assert b["stats"]["machines_flagged"] == 1
    assert len(b["trend"]) == 1 and b["trend"][0]["defect_rate_per_100m"] == 5.0
    assert b["by_type"] == [{"type": "Holes", "count": 5}]
    s = b["summaries"][0]
    assert s["needs_investigation"] is True
    assert "defect rate" in s["flag_reason"]
    assert b["matrix"][0]["counts"]["Holes"] == 5


def test_roll_preview_and_inspectable_job(client):
    m = _machine(client, code="Q1")
    job = _job_with_output(client, m["id"], actual=40)

    r = client.get(f"/api/v1/quality/jobs/{job['id']}/roll-preview")
    assert r.status_code == 200
    assert r.json() == {"job_id": job["id"], "batch_no": f"BATCH-{job['id']}",
                        "roll_id": f"BATCH-{job['id']}-R1", "inspection_count": 0}
    _create(client, job["id"], inspected_qty_meters=40, defects=[])
    r = client.get(f"/api/v1/quality/jobs/{job['id']}/roll-preview")
    assert r.json()["roll_id"].endswith("-R2")
    assert r.json()["inspection_count"] == 1
    assert client.get("/api/v1/quality/jobs/99999/roll-preview").status_code == 404

    # Active job visible for the modal
    r = client.get(f"/api/v1/quality/machines/{m['id']}/inspectable-job")
    assert r.status_code == 200
    active = r.json()
    assert active["job_id"] == job["id"]
    assert active["machine_code"] == "Q1"
    assert active["status"] == "IN_PROGRESS"
    assert active["produced_qty_meters"] == 40

    # Idle machine -> null (Anand's idle contract), unknown machine -> 404
    m2 = _machine(client, code="IDLE1")
    assert client.get(f"/api/v1/quality/machines/{m2['id']}/inspectable-job").json() is None
    assert client.get("/api/v1/quality/machines/99999/inspectable-job").status_code == 404


def test_inspection_counts_by_job(client):
    m = _machine(client)
    j1 = _job_with_output(client, m["id"], actual=100, order_ref="ORD-C1")
    _create(client, j1["id"], defects=[])
    _create(client, j1["id"], defects=[{"type": "Holes", "count": 1, "severity": "Low"}])
    counts = client.get("/api/v1/quality/inspection-counts").json()
    entry = next(c for c in counts if c["job_id"] == j1["id"])
    assert entry["count"] == 2
    assert entry["latest_inspection_id"] is not None
