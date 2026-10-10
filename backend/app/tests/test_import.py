"""CSV import endpoint tests: validation, idempotent upsert, no duplicates."""

from __future__ import annotations

HEADER = (
    "Yarn ID,Yarn Name,Product Code,Category,Material / Composition,Colour / Shade,"
    "Denier / Specification,Current Stock,Unit,Unit Cost (?/kg),Supplier / Source,"
    "Minimum Stock Level (kg),Storage Location,Batch Number,Inventory Stage,Stock Status,Image File"
)

ROW1 = (
    "YRN-00001,Recycled Polyester Yarn,RPY-100,Eco-Innovative & Recycled,Recycled Polyester (rPET),Green,"
    "150D/48F,1126,kg,347.53,Shakti Polymers,80,Warehouse A,B12281,Purchased Input,In Stock,yarn_09.jpg"
)
ROW2 = (
    "YRN-00002,Mechanical Stretch Yarn,MSY-100,Mechanical Stretch,Polyester,White,"
    "75D/72F,50,kg,337.86,Delta Threads,100,Warehouse E,B00852,Finished Yarn,Low Stock,yarn_03.jpg"
)


def _upload(client, content: str, filename: str = "data.csv", **params):
    return client.post(
        "/api/v1/inventory/import",
        files={"file": (filename, content.encode("utf-8"), "text/csv")},
        params=params,
    )


def test_import_creates_rows_and_suppliers(client):
    response = _upload(client, f"{HEADER}\n{ROW1}\n{ROW2}\n")
    assert response.status_code == 200, response.text
    report = response.json()
    assert report["valid"] is True
    assert report["totalRows"] == 2
    assert report["created"] == 2
    assert report["updated"] == 0
    assert report["suppliersAdded"] == 2

    listed = client.get("/api/v1/inventory").json()
    assert listed["total"] == 2

    # image path preserved/mapped to the served file
    assert listed["items"][0]["imageFile"] == "/samples/yarn_09.jpg"

    suppliers = client.get("/api/v1/suppliers").json()
    names = {item["companyName"] for item in suppliers["items"]}
    assert names == {"Shakti Polymers", "Delta Threads"}


def test_reimport_never_duplicates(client):
    _upload(client, f"{HEADER}\n{ROW1}\n{ROW2}\n")
    response = _upload(client, f"{HEADER}\n{ROW1}\n{ROW2}\n")
    report = response.json()
    assert report["valid"] is True
    assert report["created"] == 0
    assert report["updated"] == 2

    assert client.get("/api/v1/inventory").json()["total"] == 2


def test_invalid_numeric_row_rejected_nothing_written(client):
    bad_row = ROW1.replace("1126", "not-a-number")
    response = _upload(client, f"{HEADER}\n{bad_row}\n")
    assert response.status_code == 200
    report = response.json()
    assert report["valid"] is False
    assert report["created"] == 0
    assert any(issue["field"] == "currentStock" for issue in report["issues"])
    assert client.get("/api/v1/inventory").json()["total"] == 0


def test_stock_status_rule_violation_rejected(client):
    # 50 with min 100 must be Low Stock, not In Stock
    bad_row = ROW2.replace("Low Stock", "In Stock")
    response = _upload(client, f"{HEADER}\n{bad_row}\n")
    report = response.json()
    assert report["valid"] is False
    assert any(issue["field"] == "stockStatus" for issue in report["issues"])


def test_duplicate_ids_in_file_rejected(client):
    response = _upload(client, f"{HEADER}\n{ROW1}\n{ROW1}\n")
    report = response.json()
    assert report["valid"] is False
    assert any("Duplicate" in issue["message"] for issue in report["issues"])


def test_missing_column_rejected(client):
    broken_header = HEADER.replace("Current Stock,", "")
    response = _upload(client, f"{broken_header}\n")
    report = response.json()
    assert report["valid"] is False
    assert any(issue["field"] == "currentStock" for issue in report["issues"])


def test_skip_invalid_imports_good_rows(client):
    bad_row = ROW1.replace("1126", "oops")
    response = _upload(client, f"{HEADER}\n{bad_row}\n{ROW2}\n", skipInvalid=True)
    report = response.json()
    assert report["valid"] is True
    assert report["created"] == 1
    assert report["issues"]
    assert client.get("/api/v1/inventory").json()["total"] == 1
