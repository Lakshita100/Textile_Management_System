"""Shared payload builders for API tests."""

from __future__ import annotations


def yarn_payload(**overrides) -> dict:
    payload = {
        "yarnId": "YRN-00001",
        "imageFile": "/samples/yarn_01.jpg",
        "yarnName": "Recycled Polyester Yarn",
        "productCode": "RPY-100",
        "category": "Eco-Innovative & Recycled",
        "materialComposition": "Recycled Polyester (rPET)",
        "colourShade": "Green",
        "denierSpecification": "150D/48F",
        "currentStock": 1000,
        "unit": "kg",
        "unitCost": 347.53,
        "supplierSource": "Shakti Polymers",
        "minimumStockLevel": 100,
        "storageLocation": "Warehouse A",
        "batchNumber": "B12281",
        "inventoryStage": "Purchased Input",
    }
    payload.update(overrides)
    return payload


def supplier_payload(**overrides) -> dict:
    payload = {
        "companyName": "Shakti Polymers",
        "contactPerson": "",
        "phone": "",
        "email": "",
        "address": "",
        "yarnTypes": ["Eco-Innovative & Recycled"],
        "productCodes": ["RPY-100"],
        "pricePerKg": None,
        "minOrderQty": None,
        "leadTimeDays": None,
        "notes": "",
    }
    payload.update(overrides)
    return payload


def create_yarn(client, **overrides) -> dict:
    response = client.post("/api/v1/inventory", json=yarn_payload(**overrides))
    assert response.status_code == 201, response.text
    return response.json()


def create_supplier(client, **overrides) -> dict:
    response = client.post("/api/v1/suppliers", json=supplier_payload(**overrides))
    assert response.status_code == 201, response.text
    return response.json()
