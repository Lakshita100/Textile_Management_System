def _create(client, code="M1", **extra):
    body = {
        "code": code,
        "name": f"Machine {code}",
        "machine_type": "LOOM",
        "supported_processes": "WEAVING",
        "compatible_materials": "COTTON",
        "capacity_value": 500,
        "capacity_unit": "meters/day",
    }
    body.update(extra)
    r = client.post("/api/v1/machines", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_list_empty(client):
    r = client.get("/api/v1/machines")
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_create_and_get(client):
    m = _create(client)
    assert m["status"] == "IDLE"
    r = client.get(f"/api/v1/machines/{m['id']}")
    assert r.status_code == 200
    assert r.json()["code"] == "M1"
    assert r.json()["available_for_assignment"] is True


def test_duplicate_code_rejected(client):
    _create(client)
    r = _create_via_post = client.post("/api/v1/machines", json={"code": "M1", "name": "x", "machine_type": "t", "capacity_value": 1})
    assert r.status_code == 409


def test_unknown_machine_404(client):
    assert client.get("/api/v1/machines/999").status_code == 404


def test_status_transition_and_history(client):
    m = _create(client)
    r = client.patch(f"/api/v1/machines/{m['id']}/status", json={"status": "RUNNING", "reason": "start"})
    assert r.status_code == 200
    assert r.json()["status"] == "RUNNING"
    h = client.get(f"/api/v1/machines/{m['id']}/status-events").json()
    assert len(h) >= 2  # created + change
    assert h[0]["to_status"] == "RUNNING"


def test_illegal_transition_rejected(client):
    m = _create(client)
    # IDLE -> MAINTENANCE requires reason
    r = client.patch(f"/api/v1/machines/{m['id']}/status", json={"status": "MAINTENANCE"})
    assert r.status_code == 422
    r = client.patch(f"/api/v1/machines/{m['id']}/status", json={"status": "MAINTENANCE", "reason": "belt change"})
    assert r.status_code == 200
    # MAINTENANCE -> RUNNING illegal
    r = client.patch(f"/api/v1/machines/{m['id']}/status", json={"status": "RUNNING"})
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "ILLEGAL_TRANSITION"


def test_same_status_rejected(client):
    m = _create(client)
    r = client.patch(f"/api/v1/machines/{m['id']}/status", json={"status": "IDLE"})
    assert r.status_code == 409


def test_search_and_filter(client):
    _create(client, code="L1", supported_processes="WEAVING")
    _create(client, code="D1", machine_type="DYER", supported_processes="DYEING", compatible_materials="POLYESTER")
    r = client.get("/api/v1/machines", params={"search": "L1"})
    assert r.json()["total"] == 1
    r = client.get("/api/v1/machines", params={"process": "DYEING"})
    assert r.json()["total"] == 1
    r = client.get("/api/v1/machines", params={"status": "IDLE"})
    assert r.json()["total"] == 2
