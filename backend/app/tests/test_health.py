def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_db_health(client):
    r = client.get("/api/v1/health/db")
    assert r.status_code == 200
    assert r.json()["connected"] is True
