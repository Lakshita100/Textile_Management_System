"""Purchase recommendations and purchase request drafts."""

from __future__ import annotations

from app.tests.helpers import create_supplier, create_yarn


def _low_yarn(client):
    return create_yarn(client, currentStock=40, minimumStockLevel=100, unitCost=300)


def test_recommendations_shortage_and_offers(client):
    _low_yarn(client)
    create_supplier(client)  # eligible current supplier (dataset price)
    create_supplier(
        client,
        companyName="Rival Mills",
        yarnTypes=["Eco-Innovative & Recycled"],
        productCodes=[],
        pricePerKg=250,
        minOrderQty=1000,
        leadTimeDays=14,
    )
    create_supplier(
        client,
        companyName="Ineligible Mills",
        yarnTypes=["Worsted & Wool-Like"],
        productCodes=[],
        pricePerKg=100,
    )

    body = client.get("/api/v1/purchase-recommendations").json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["shortage"] == 60
    assert item["recommendedQuantity"] == 60

    company_names = [offer["companyName"] for offer in item["offers"]]
    assert "Ineligible Mills" not in company_names
    assert "Rival Mills" in company_names
    assert "Shakti Polymers" in company_names

    # priced offers first: Rival (250) before current supplier (300)
    assert company_names[0] == "Rival Mills"
    rival = item["offers"][0]
    assert rival["unitCost"] == 250
    assert rival["minOrderQty"] == 1000
    assert rival["leadTimeDays"] == 14
    assert rival["expectedDeliveryDate"] is not None
    assert rival["priceSource"] == "supplier_price"

    current = next(o for o in item["offers"] if o["companyName"] == "Shakti Polymers")
    assert current["unitCost"] == 300
    assert current["priceSource"] == "current_supplier_dataset_price"


def test_recommendations_buffer_and_search(client):
    _low_yarn(client)
    create_supplier(client)

    body = client.get("/api/v1/purchase-recommendations", params={"bufferQuantity": 40}).json()
    assert body["items"][0]["recommendedQuantity"] == 100

    hit = client.get("/api/v1/purchase-recommendations", params={"q": "recycled"}).json()
    assert hit["total"] == 1
    miss = client.get("/api/v1/purchase-recommendations", params={"q": "zzz"}).json()
    assert miss["total"] == 0


def test_create_purchase_request_is_a_draft_not_an_order(client):
    _low_yarn(client)
    supplier = create_supplier(client)

    response = client.post(
        "/api/v1/purchase-requests",
        json={
            "yarnId": "YRN-00001",
            "supplierId": supplier["supplierId"],
            "quantity": 60,
            "bufferQuantity": 0,
            "notes": "Replenish for order OR-55",
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["requestId"].startswith("PR-")
    assert body["status"] == "draft"
    assert body["documentType"] == "purchase_request"
    assert body["isPurchaseOrder"] is False
    assert body["shortageQuantity"] == 60
    assert body["estimatedUnitCost"] == 300  # current supplier dataset price
    assert body["estimatedTotalCost"] == 18000
    assert body["yarnName"] == "Recycled Polyester Yarn"


def test_create_request_validation(client):
    _low_yarn(client)
    supplier = create_supplier(client)
    inactive = create_supplier(client, companyName="Idle Mills", yarnTypes=[], productCodes=[])
    client.post(f"/api/v1/suppliers/{inactive['supplierId']}/active", json={"active": False})

    ineligible = create_supplier(
        client,
        companyName="Wrong Category Mills",
        yarnTypes=["Worsted & Wool-Like"],
        productCodes=[],
    )

    base = {"yarnId": "YRN-00001", "quantity": 60, "bufferQuantity": 0}

    # inactive supplier → 409
    response = client.post(
        "/api/v1/purchase-requests", json={**base, "supplierId": inactive["supplierId"]}
    )
    assert response.status_code == 409

    # not mapped to this yarn → 400
    response = client.post(
        "/api/v1/purchase-requests", json={**base, "supplierId": ineligible["supplierId"]}
    )
    assert response.status_code == 400
    assert "not mapped" in response.json()["detail"]

    # unknown yarn → 404
    response = client.post(
        "/api/v1/purchase-requests", json={**base, "yarnId": "YRN-40444", "supplierId": supplier["supplierId"]}
    )
    assert response.status_code == 404

    # zero quantity → 422
    response = client.post(
        "/api/v1/purchase-requests", json={**base, "quantity": 0, "supplierId": supplier["supplierId"]}
    )
    assert response.status_code == 422


def test_status_transitions(client):
    _low_yarn(client)
    supplier = create_supplier(client)
    request = client.post(
        "/api/v1/purchase-requests",
        json={"yarnId": "YRN-00001", "supplierId": supplier["supplierId"], "quantity": 60},
    ).json()
    request_id = request["requestId"]

    submitted = client.patch(
        f"/api/v1/purchase-requests/{request_id}/status", json={"status": "submitted"}
    )
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "submitted"

    # no double-submit, no submit → draft
    assert client.patch(
        f"/api/v1/purchase-requests/{request_id}/status", json={"status": "submitted"}
    ).status_code == 409
    assert client.patch(
        f"/api/v1/purchase-requests/{request_id}/status", json={"status": "draft"}
    ).status_code == 409

    cancelled = client.patch(
        f"/api/v1/purchase-requests/{request_id}/status", json={"status": "cancelled"}
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    listed = client.get("/api/v1/purchase-requests", params={"status": "cancelled"}).json()
    assert listed["total"] == 1
    assert listed["items"][0]["isPurchaseOrder"] is False
