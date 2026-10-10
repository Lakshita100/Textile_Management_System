"""Low-stock alert tests: enrichment, lifecycle, dedupe."""

from __future__ import annotations

from app.tests.helpers import create_supplier, create_yarn


def _dip_to_low(client):
    return client.post(
        "/api/v1/movements",
        json={
            "yarnId": "YRN-00001",
            "movementType": "Consumption",
            "quantity": 950,
            "date": "2026-10-10",
            "reference": "WO-1",
            "reason": "Production consumption",
            "supplierName": "",
        },
    )


def test_alert_enriched_with_yarn_and_supplier_details(client):
    create_yarn(client, currentStock=1000, minimumStockLevel=100)
    create_supplier(client, phone="", email="", contactPerson="")

    _dip_to_low(client)

    body = client.get("/api/v1/alerts").json()
    assert body["total"] == 1
    alert = body["items"][0]
    assert alert["status"] == "active"
    assert alert["yarnName"] == "Recycled Polyester Yarn"
    assert alert["currentStock"] == 50
    assert alert["minimumStockLevel"] == 100
    assert alert["shortage"] == 50
    assert alert["unit"] == "kg"
    assert alert["kind"] == "Low Stock"
    assert alert["supplier"]["companyName"] == "Shakti Polymers"
    # contacts are stored values only — never invented
    assert alert["supplier"]["phone"] == ""
    assert alert["supplier"]["email"] == ""


def test_acknowledge_then_resolve_lifecycle(client):
    create_yarn(client, currentStock=1000, minimumStockLevel=100)
    _dip_to_low(client)
    alert_id = client.get("/api/v1/alerts").json()["items"][0]["alertId"]

    ack = client.post(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert ack.status_code == 200
    assert ack.json()["status"] == "acknowledged"
    assert ack.json()["acknowledgedAt"] is not None

    # acknowledging again is refused
    assert client.post(f"/api/v1/alerts/{alert_id}/acknowledge").status_code == 409

    resolve = client.post(f"/api/v1/alerts/{alert_id}/resolve")
    assert resolve.status_code == 200
    assert resolve.json()["status"] == "resolved"
    assert resolve.json()["resolvedAt"] is not None

    assert client.post(f"/api/v1/alerts/{alert_id}/resolve").status_code == 409

    # resolved alerts no longer count as open
    assert client.get("/api/v1/alerts").json()["open"] == 0
    filtered = client.get("/api/v1/alerts", params={"status": "resolved"}).json()
    assert filtered["total"] == 1


def test_out_of_stock_alert_kind(client):
    create_yarn(client, currentStock=1000, minimumStockLevel=100)
    _dip_to_low(client)
    client.post(
        "/api/v1/movements",
        json={
            "yarnId": "YRN-00001",
            "movementType": "Consumption",
            "quantity": 50,
            "date": "2026-10-10",
            "reference": "WO-2",
            "reason": "Wastage / damage",
            "supplierName": "",
        },
    )
    alert = client.get("/api/v1/alerts").json()["items"][0]
    assert alert["kind"] == "Out of Stock"
    assert alert["currentStock"] == 0
    assert alert["shortage"] == 100


def test_alert_ids_are_unique_sequential(client):
    create_yarn(client, yarnId="YRN-00001", currentStock=1000, minimumStockLevel=100)
    create_yarn(client, yarnId="YRN-00002", productCode="PC-2", currentStock=1000, minimumStockLevel=100)
    for yarn_id in ("YRN-00001", "YRN-00002"):
        client.post(
            "/api/v1/movements",
            json={
                "yarnId": yarn_id,
                "movementType": "Consumption",
                "quantity": 950,
                "date": "2026-10-10",
                "reference": "WO-9",
                "reason": "Order issue",
                "supplierName": "",
            },
        )
    alerts = client.get("/api/v1/alerts").json()["items"]
    assert len(alerts) == 2
    assert alerts[0]["alertId"] != alerts[1]["alertId"]
