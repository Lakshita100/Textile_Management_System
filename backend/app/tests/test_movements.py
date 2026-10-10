"""Stock movement tests: transactions, negative-stock guard, reversal, alerts."""

from __future__ import annotations

from app.tests.helpers import create_supplier, create_yarn


def _record(client, **overrides):
    payload = {
        "yarnId": "YRN-00001",
        "movementType": "Stock In",
        "quantity": 100,
        "date": "2026-10-10",
        "reference": "GRN-1001",
        "supplierName": "Shakti Polymers",
        "notes": "First receipt",
    }
    payload.update(overrides)
    return client.post("/api/v1/movements", json=payload)


def test_stock_in_updates_inventory_and_records_movement(client):
    create_yarn(client, currentStock=1000)
    create_supplier(client)

    response = _record(client, quantity=250)
    assert response.status_code == 201, response.text
    movement = response.json()
    assert movement["previousQuantity"] == 1000
    assert movement["stockAfter"] == 1250
    assert movement["movementType"] == "Stock In"
    assert movement["supplierName"] == "Shakti Polymers"
    assert movement["reversalOf"] is None

    yarn = client.get("/api/v1/inventory/YRN-00001").json()
    assert yarn["currentStock"] == 1250

    listed = client.get("/api/v1/movements").json()
    assert listed["total"] == 1
    assert listed["items"][0]["movementId"].startswith("MOV-")


def test_stock_in_requires_known_supplier(client):
    create_yarn(client)
    response = _record(client, supplierName="Unknown Mills")
    assert response.status_code == 400
    assert "Unknown supplier" in response.json()["detail"]
    # nothing changed
    assert client.get("/api/v1/movements").json()["total"] == 0


def test_consumption_reduces_stock(client):
    create_yarn(client, currentStock=500)
    response = _record(
        client,
        movementType="Consumption",
        quantity=200,
        reference="WO-77",
        supplierName="",
        reason="Production consumption",
        notes="",
    )
    assert response.status_code == 201, response.text
    movement = response.json()
    assert movement["previousQuantity"] == 500
    assert movement["stockAfter"] == 300
    assert movement["reason"] == "Production consumption"

    yarn = client.get("/api/v1/inventory/YRN-00001").json()
    assert yarn["currentStock"] == 300


def test_consumption_requires_reason(client):
    create_yarn(client, currentStock=500)
    response = _record(client, movementType="Consumption", quantity=10, reason="", supplierName="")
    assert response.status_code == 400
    assert "Reason" in response.json()["detail"]


def test_insufficient_stock_is_rejected_atomically(client):
    create_yarn(client, currentStock=50)
    response = _record(client, movementType="Consumption", quantity=100, reason="Wastage / damage", supplierName="")
    assert response.status_code == 409
    assert "Insufficient stock" in response.json()["detail"]

    # stock and movement history untouched (transaction rolled back)
    yarn = client.get("/api/v1/inventory/YRN-00001").json()
    assert yarn["currentStock"] == 50
    assert client.get("/api/v1/movements").json()["total"] == 0


def test_zero_quantity_rejected(client):
    create_yarn(client)
    response = _record(client, quantity=0)
    assert response.status_code == 422


def test_movement_triggers_alert_and_recovery_resolves_it(client):
    create_supplier(client)
    create_yarn(client, currentStock=500, minimumStockLevel=100)

    # drop to exactly the threshold → alert ("at or below")
    _record(client, movementType="Consumption", quantity=400, reason="Order issue", supplierName="")
    alerts = client.get("/api/v1/alerts").json()
    assert alerts["open"] == 1
    assert alerts["items"][0]["status"] == "active"
    assert alerts["items"][0]["kind"] == "Low Stock"
    assert alerts["items"][0]["shortage"] == 0  # stock == threshold, nothing to replenish

    # duplicate prevention: another dip does not create a second open alert
    _record(client, movementType="Consumption", quantity=50, reason="Sampling / testing", supplierName="")
    alerts = client.get("/api/v1/alerts").json()
    assert alerts["open"] == 1
    assert alerts["items"][0]["shortage"] == 50

    # recovery above the threshold resolves the alert
    _record(client, quantity=500)
    alerts = client.get("/api/v1/alerts").json()
    assert alerts["open"] == 0
    assert alerts["items"][0]["status"] == "resolved"
    assert alerts["items"][0]["resolvedAt"] is not None


def test_reversal_is_auditable_and_blocks_double_reversal(client):
    create_supplier(client)
    create_yarn(client, currentStock=500)
    movement = _record(client, quantity=200).json()  # 500 → 700

    reverse = client.post(f"/api/v1/movements/{movement['movementId']}/reverse")
    assert reverse.status_code == 201, reverse.text
    reversal = reverse.json()
    assert reversal["movementType"] == "Consumption"
    assert reversal["reversalOf"] == movement["movementId"]
    assert reversal["previousQuantity"] == 700
    assert reversal["stockAfter"] == 500

    # original history entry is preserved unchanged
    listed = client.get("/api/v1/movements").json()
    original = next(m for m in listed["items"] if m["movementId"] == movement["movementId"])
    assert original["stockAfter"] == 700
    assert original["reversalOf"] is None

    again = client.post(f"/api/v1/movements/{movement['movementId']}/reverse")
    assert again.status_code == 409
    assert "already been reversed" in again.json()["detail"]


def test_reversal_blocked_when_stock_insufficient(client):
    create_supplier(client)
    create_yarn(client, currentStock=100)
    movement = _record(client, quantity=50).json()  # 100 → 150

    # consume most of the stock so the reversal (−50 would still fit; use another)
    _record(client, movementType="Consumption", quantity=140, reason="Stock correction", supplierName="")
    # stock now 10; reversing the stock-in (−50) would go negative
    response = client.post(f"/api/v1/movements/{movement['movementId']}/reverse")
    assert response.status_code == 409
    assert "Cannot reverse" in response.json()["detail"]


def test_movement_for_unknown_yarn_404(client):
    response = _record(client, yarnId="YRN-40444")
    assert response.status_code == 404
