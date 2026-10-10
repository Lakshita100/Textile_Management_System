"""Supplier CRUD, validation, deactivation, delete guards, yarn reassignment."""

from __future__ import annotations

from app.tests.helpers import create_supplier, create_yarn, supplier_payload


def test_create_list_search_supplier(client):
    created = create_supplier(client, contactPerson="Ravi Kumar", phone="+91 98765 43210")
    assert created["supplierId"].startswith("SUP-")
    assert created["active"] is True
    assert created["yarnTypes"] == ["Eco-Innovative & Recycled"]

    create_supplier(client, companyName="Delta Threads", yarnTypes=["Mechanical Stretch"], productCodes=["PTY-9"])

    listed = client.get("/api/v1/suppliers").json()
    assert listed["total"] == 2

    search = client.get("/api/v1/suppliers", params={"q": "delta"}).json()
    assert search["total"] == 1
    assert search["items"][0]["companyName"] == "Delta Threads"

    by_code = client.get("/api/v1/suppliers", params={"q": "pty-9"}).json()
    assert by_code["total"] == 1


def test_duplicate_company_name_case_insensitive(client):
    create_supplier(client)
    response = client.post("/api/v1/suppliers", json=supplier_payload(companyName="shakti polymers"))
    assert response.status_code == 409


def test_supplied_yarn_count(client):
    supplier = create_supplier(client)
    assert supplier["suppliedYarnCount"] == 0

    create_yarn(client, yarnId="YRN-00001", supplierSource="Shakti Polymers")
    create_yarn(client, yarnId="YRN-00002", supplierSource="SHAKTI POLYMERS")
    create_yarn(client, yarnId="YRN-00003", supplierSource="Someone Else")

    listed = client.get("/api/v1/suppliers").json()
    match = next(row for row in listed["items"] if row["supplierId"] == supplier["supplierId"])
    assert match["suppliedYarnCount"] == 2

    single = client.get(f"/api/v1/suppliers/{supplier['supplierId']}").json()
    assert single["suppliedYarnCount"] == 2


def test_contact_validation(client):
    bad_phone = client.post("/api/v1/suppliers", json=supplier_payload(phone="not-a-phone"))
    assert bad_phone.status_code == 400

    bad_email = client.post("/api/v1/suppliers", json=supplier_payload(email="nope@"))
    assert bad_email.status_code == 400

    # empty contact fields are valid — this project never invents them
    ok = client.post("/api/v1/suppliers", json=supplier_payload())
    assert ok.status_code == 201
    assert ok.json()["phone"] == ""


def test_update_supplier(client):
    created = create_supplier(client)
    response = client.put(
        f"/api/v1/suppliers/{created['supplierId']}",
        json=supplier_payload(email="sales@shakti.example", pricePerKg=340.5, minOrderQty=500, leadTimeDays=7),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "sales@shakti.example"
    assert body["pricePerKg"] == 340.5
    assert body["leadTimeDays"] == 7


def test_deactivate_keeps_record(client):
    created = create_supplier(client)
    response = client.post(
        f"/api/v1/suppliers/{created['supplierId']}/active", json={"active": False}
    )
    assert response.status_code == 200
    assert response.json()["active"] is False

    still_listed = client.get("/api/v1/suppliers", params={"active": "false"}).json()
    assert still_listed["total"] == 1


def test_delete_referenced_supplier_blocked_with_hint(client):
    create_supplier(client)
    create_yarn(client)  # supplierSource = Shakti Polymers

    supplier_id = client.get("/api/v1/suppliers").json()["items"][0]["supplierId"]
    response = client.delete(f"/api/v1/suppliers/{supplier_id}")
    assert response.status_code == 409
    detail = response.json()["detail"]
    assert "yarn record(s)" in detail
    assert "Deactivate" in detail


def test_delete_unreferenced_supplier(client):
    created = create_supplier(client, companyName="Unused Mills", yarnTypes=[], productCodes=[])
    response = client.delete(f"/api/v1/suppliers/{created['supplierId']}")
    assert response.status_code == 204
    assert client.get(f"/api/v1/suppliers/{created['supplierId']}").status_code == 404


def test_change_yarn_supplier_writes_audit_trail(client):
    create_supplier(client)
    create_supplier(client, companyName="Delta Threads", yarnTypes=["Eco-Innovative & Recycled"], productCodes=["RPY-100"])
    create_yarn(client)

    response = client.put(
        "/api/v1/suppliers/yarn/YRN-00001/supplier",
        json={"newSupplierName": "Delta Threads", "note": "Better lead time"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["supplierSource"] == "Delta Threads"

    yarn = client.get("/api/v1/inventory/YRN-00001").json()
    assert yarn["supplierSource"] == "Delta Threads"

    history = client.get("/api/v1/suppliers/yarn/YRN-00001/supplier-history").json()["items"]
    assert len(history) == 1
    assert history[0]["oldSupplier"] == "Shakti Polymers"
    assert history[0]["newSupplier"] == "Delta Threads"
    assert history[0]["note"] == "Better lead time"


def test_change_supplier_validation(client):
    create_supplier(client)
    create_yarn(client)

    unknown = client.put(
        "/api/v1/suppliers/yarn/YRN-00001/supplier", json={"newSupplierName": "No Such Mills"}
    )
    assert unknown.status_code == 400

    same = client.put(
        "/api/v1/suppliers/yarn/YRN-00001/supplier", json={"newSupplierName": "shakti polymers"}
    )
    assert same.status_code == 409
    assert "already the supplier" in same.json()["detail"]

    inactive = create_supplier(client, companyName="Idle Mills", yarnTypes=[], productCodes=[])
    client.post(f"/api/v1/suppliers/{inactive['supplierId']}/active", json={"active": False})
    blocked = client.put(
        "/api/v1/suppliers/yarn/YRN-00001/supplier", json={"newSupplierName": "Idle Mills"}
    )
    assert blocked.status_code == 409
    assert "deactivated" in blocked.json()["detail"]
