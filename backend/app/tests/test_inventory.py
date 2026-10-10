"""Inventory API tests: server-side pagination, search, filters, CRUD, summary."""

from __future__ import annotations

from app.tests.helpers import create_supplier, create_yarn, yarn_payload


def test_create_and_get_yarn(client):
    created = create_yarn(client)
    assert created["yarnId"] == "YRN-00001"
    assert created["stockStatus"] == "In Stock"
    assert created["isDemo"] is False

    fetched = client.get("/api/v1/inventory/YRN-00001")
    assert fetched.status_code == 200
    assert fetched.json()["yarnName"] == "Recycled Polyester Yarn"


def test_duplicate_yarn_id_conflict(client):
    create_yarn(client)
    response = client.post("/api/v1/inventory", json=yarn_payload())
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_negative_stock_rejected_by_schema(client):
    response = client.post("/api/v1/inventory", json=yarn_payload(currentStock=-1))
    assert response.status_code == 422


def test_unknown_category_rejected(client):
    response = client.post("/api/v1/inventory", json=yarn_payload(category="Magic Yarn"))
    assert response.status_code == 422


def test_missing_yarn_returns_404(client):
    response = client.get("/api/v1/inventory/YRN-99999")
    assert response.status_code == 404


def test_update_yarn(client):
    create_yarn(client)
    update = yarn_payload(currentStock=250, yarnName="Renamed Yarn")
    response = client.put("/api/v1/inventory/YRN-00001", json=update)
    assert response.status_code == 200
    body = response.json()
    assert body["currentStock"] == 250
    assert body["yarnName"] == "Renamed Yarn"
    assert body["stockStatus"] == "In Stock"


def test_server_side_pagination(client):
    for index in range(15):
        create_yarn(client, yarnId=f"YRN-{index:05d}", productCode=f"PC-{index}")

    page1 = client.get("/api/v1/inventory", params={"page": 1, "pageSize": 10}).json()
    assert page1["total"] == 15
    assert page1["totalPages"] == 2
    assert len(page1["items"]) == 10

    page2 = client.get("/api/v1/inventory", params={"page": 2, "pageSize": 10}).json()
    assert len(page2["items"]) == 5
    assert page2["page"] == 2

    # page beyond the end is clamped to the last page
    page9 = client.get("/api/v1/inventory", params={"page": 9, "pageSize": 10}).json()
    assert page9["page"] == 2


def test_search_and_filters(client):
    create_yarn(client, yarnId="YRN-00001", yarnName="Organic Cotton Yarn", productCode="OCY-10")
    create_yarn(client, yarnId="YRN-00002", yarnName="Polyester Yarn", productCode="PTY-20",
                category="Mechanical Stretch", currentStock=5, minimumStockLevel=100)

    by_name = client.get("/api/v1/inventory", params={"q": "organic"}).json()
    assert by_name["total"] == 1
    assert by_name["items"][0]["yarnId"] == "YRN-00001"

    by_code = client.get("/api/v1/inventory", params={"q": "pty-20"}).json()
    assert by_code["total"] == 1

    by_category = client.get("/api/v1/inventory", params={"category": "Mechanical Stretch"}).json()
    assert by_category["total"] == 1

    low = client.get("/api/v1/inventory", params={"status": "Low Stock"}).json()
    assert low["total"] == 1
    assert low["items"][0]["yarnId"] == "YRN-00002"

    none = client.get("/api/v1/inventory", params={"q": "does-not-exist"}).json()
    assert none["total"] == 0
    assert none["items"] == []


def test_summary_comes_from_database(client):
    create_yarn(client, yarnId="YRN-00001", currentStock=1000, minimumStockLevel=100, unitCost=10)
    create_yarn(client, yarnId="YRN-00002", currentStock=50, minimumStockLevel=100, unitCost=20)
    create_yarn(client, yarnId="YRN-00003", currentStock=0, minimumStockLevel=100, unitCost=30)

    summary = client.get("/api/v1/inventory/summary").json()
    assert summary["totalYarnTypes"] == 3
    assert summary["totalAvailableStock"] == 1050
    assert summary["lowStockItems"] == 1
    assert summary["outOfStockItems"] == 1
    assert summary["inventoryValue"] == 1000 * 10 + 50 * 20 + 0
    assert summary["stockUnit"] == "kg"
    assert summary["demoCount"] == 0
    assert summary["totalSuppliers"] == 0


def test_supplier_stage_colour_filters(client):
    create_supplier(client)  # Shakti Polymers
    create_yarn(
        client,
        yarnId="YRN-00001",
        colourShade="Royal Blue",
        inventoryStage="Purchased Input",
        supplierSource="Shakti Polymers",
    )
    create_yarn(
        client,
        yarnId="YRN-00002",
        colourShade="Off White",
        inventoryStage="Finished Yarn",
        supplierSource="Someone Else",
        category="Mechanical Stretch",
    )

    by_supplier = client.get("/api/v1/inventory", params={"supplier": "shakti polymers"}).json()
    assert by_supplier["total"] == 1
    assert by_supplier["items"][0]["yarnId"] == "YRN-00001"

    by_stage = client.get("/api/v1/inventory", params={"stage": "Finished Yarn"}).json()
    assert by_stage["total"] == 1
    assert by_stage["items"][0]["yarnId"] == "YRN-00002"

    by_colour = client.get("/api/v1/inventory", params={"colour": "royal"}).json()
    assert by_colour["total"] == 1
    assert by_colour["items"][0]["colourShade"] == "Royal Blue"

    combined = client.get(
        "/api/v1/inventory", params={"supplier": "Shakti Polymers", "stage": "Purchased Input", "colour": "blue"}
    ).json()
    assert combined["total"] == 1


def test_facets_endpoint(client):
    create_yarn(client, yarnId="YRN-00001")
    create_yarn(
        client,
        yarnId="YRN-00002",
        category="Mechanical Stretch",
        colourShade="Off White",
        inventoryStage="Finished Yarn",
        supplierSource="Delta Threads",
    )

    facets = client.get("/api/v1/inventory/facets").json()
    assert facets["categories"] == sorted(facets["categories"])
    assert "Mechanical Stretch" in facets["categories"]
    assert "Off White" in facets["colours"]
    assert "Finished Yarn" in facets["stages"]
    assert "Delta Threads" in facets["suppliers"]


def test_recently_updated_ordering(client):
    create_yarn(client, yarnId="YRN-00001", yarnName="First")
    create_yarn(client, yarnId="YRN-00002", yarnName="Second")
    # update the first record so it becomes the most recently touched
    client.put("/api/v1/inventory/YRN-00001", json=yarn_payload(yarnId="YRN-00001", yarnName="First v2"))

    recent = client.get("/api/v1/inventory/recently-updated", params={"limit": 5}).json()
    assert len(recent["items"]) == 2
    assert recent["items"][0]["yarnId"] == "YRN-00001"
    assert recent["items"][0]["yarnName"] == "First v2"


def test_export_csv_respects_filters(client):
    create_yarn(client, yarnId="YRN-00001", yarnName="Keep Me")
    create_yarn(client, yarnId="YRN-00002", yarnName="Skip Me", category="Mechanical Stretch")

    response = client.get("/api/v1/inventory/export", params={"category": "Mechanical Stretch"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]

    lines = [line for line in response.text.splitlines() if line.strip()]
    assert lines[0].startswith("Yarn ID,Yarn Name,Product Code")
    assert len(lines) == 2  # header + 1 matching row
    assert "Skip Me" in lines[1]
    assert "Keep Me" not in response.text


def test_delete_yarn_removes_dependent_rows(client):
    create_supplier(client)
    create_yarn(client)
    movement = client.post(
        "/api/v1/movements",
        json={
            "yarnId": "YRN-00001",
            "movementType": "Stock In",
            "quantity": 50,
            "date": "2026-10-10",
            "reference": "PO-1",
            "supplierName": "Shakti Polymers",
        },
    )
    assert movement.status_code == 201, movement.text

    # drop below the minimum so an alert exists too
    out = client.post(
        "/api/v1/movements",
        json={
            "yarnId": "YRN-00001",
            "movementType": "Consumption",
            "quantity": 900,
            "date": "2026-10-10",
            "reference": "USE-1",
            "reason": "Production consumption",
        },
    )
    assert out.status_code == 201, out.text

    deleted = client.delete("/api/v1/inventory/YRN-00001")
    assert deleted.status_code == 204

    assert client.get("/api/v1/inventory/YRN-00001").status_code == 404
    movements = client.get("/api/v1/movements", params={"yarnId": "YRN-00001"}).json()
    assert movements["total"] == 0


def test_delete_missing_yarn_404(client):
    assert client.delete("/api/v1/inventory/YRN-99999").status_code == 404
