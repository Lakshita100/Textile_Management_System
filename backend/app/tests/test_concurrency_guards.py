"""Concurrency guards for the reservation/approval path (sequential coverage).

IMPORTANT: these tests run on SQLite (in-memory) where advisory locks and
row locks are no-ops — they prove the *decision outcomes* under sequential
contention (at most one success, coded errors for the rest), NOT that two
parallel workers are serialized. Real two-connection serialization on
PostgreSQL (pg_advisory_xact_lock + SELECT ... FOR UPDATE) is verified
separately against the live database; see docs/PROJECT_STATUS.md.
"""

from datetime import datetime, timedelta, timezone


def _machine(client, code="CC1"):
    r = client.post("/api/v1/machines", json={
        "code": code, "name": code, "machine_type": "LOOM",
        "supported_processes": "WEAVING", "compatible_materials": "COTTON",
        "capacity_value": 500, "capacity_unit": "meters/day",
    })
    assert r.status_code == 201
    return r.json()


def _rec(client, order_ref="ORD-CC1"):
    r = client.post("/api/v1/recommendations/machines", json={
        "order_ref": order_ref, "required_process": "WEAVING",
        "required_material": "COTTON", "required_quantity": 400,
        "deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    })
    assert r.status_code == 201, r.text
    return r.json()


def test_double_approval_second_gets_conflict(client):
    m = _machine(client)
    rec = _rec(client)
    assert rec["recommended_machine_code"] == m["code"]

    first = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve",
                        json={"decided_by": "supervisor-1"})
    assert first.status_code == 200, first.text
    assert first.json()["decision"] == "APPROVED"

    # Same recommendation approved again (the concurrent worker's second try)
    second = client.post(f"/api/v1/recommendations/machines/{rec['id']}/approve",
                         json={"decided_by": "supervisor-2"})
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "ALREADY_DECIDED"
    # Exactly one job exists for the approved decision
    jobs = client.get("/api/v1/production/jobs", params={"order_ref": "ORD-CC1"}).json()
    assert jobs["total"] == 1


def test_two_recommendations_same_machine_at_most_one_wins(client):
    m = _machine(client, code="CC2")
    r1 = _rec(client, order_ref="ORD-CC-A")
    r2 = _rec(client, order_ref="ORD-CC-B")

    first = client.post(f"/api/v1/recommendations/machines/{r1['id']}/approve",
                        json={"decided_by": "supervisor-1"})
    assert first.status_code == 200, first.text

    # The competing reservation for the same machine must not also succeed
    second = client.post(f"/api/v1/recommendations/machines/{r2['id']}/approve",
                         json={"decided_by": "supervisor-2"})
    assert second.status_code == 409
    code = second.json()["detail"]["code"]
    assert code in {"MACHINE_BUSY", "SCHEDULE_CONFLICT", "DUPLICATE_ACTIVE_ASSIGNMENT"}
    assert client.get(f"/api/v1/recommendations/machines/{r2['id']}").json()["decision"] != "APPROVED"

    # Direct job creation for the same machine also loses (sequential contender)
    direct = client.post("/api/v1/production/jobs", json={
        "machine_id": m["id"], "order_ref": "ORD-CC-C", "material_spec": "COTTON",
        "required_process": "WEAVING", "planned_quantity": 100,
    })
    assert direct.status_code == 409


def test_lock_path_is_safe_on_test_dialect(client, db_session):
    """The FOR UPDATE / advisory-lock code must not crash where unsupported."""
    from app.models.recommendation import MachineRecommendation
    from app.services.production import lock_machine

    m = _machine(client, code="CC3")
    rec = _rec(client, order_ref="ORD-CC-D")

    # SELECT ... FOR UPDATE on SQLite: dialect drops the clause, no error
    loaded = db_session.get(MachineRecommendation, rec["id"], with_for_update=True)
    assert loaded is not None and loaded.decision.value == "PENDING"

    # Advisory lock helper: no-op on SQLite (dialect check), no error
    lock_machine(db_session, m["id"])
    lock_machine(db_session, m["id"])  # re-entrant / repeated calls are safe


def test_status_change_takes_machine_lock(client, monkeypatch):
    """Status transitions must acquire the per-machine lock so they serialize
    with create_job/approve (closes the approval-vs-status TOCTOU window).
    The generic PATCH /machines/{id} has no status field and must NOT lock."""
    from app.services import production as production_service

    m = _machine(client, code="CC4")
    calls: list[int] = []
    original = production_service.lock_machine

    def spy(db, machine_id):
        calls.append(machine_id)
        return original(db, machine_id)

    monkeypatch.setattr(production_service, "lock_machine", spy)

    r = client.patch(f"/api/v1/machines/{m['id']}/status",
                     json={"status": "MAINTENANCE", "reason": "concurrency audit"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "MAINTENANCE"
    assert calls == [m["id"]]

    # Non-status field update stays unlocked (scope of the fix is status only)
    r2 = client.patch(f"/api/v1/machines/{m['id']}", json={"name": "CC4 renamed"})
    assert r2.status_code == 200, r2.text
    assert calls == [m["id"]]
