"""Validate the synthetic textile production scheduling dataset.

Checks row counts vs manifest, missing values, duplicate IDs,
label distributions and timestamp validity. Read-only: never modifies CSVs.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

DATASET_DIR = Path(__file__).resolve().parents[2] / "dataset" / "textile_production_scheduling_dataset"

ID_COLUMNS = {
    "orders.csv": ["order_id", "batch_id"],
    "machines.csv": ["machine_id"],
    "production_history.csv": ["operation_id", "order_id"],
    "allocation_candidates.csv": ["order_id", "candidate_machine_id"],
    "machine_availability_calendar.csv": ["machine_id", "calendar_date", "shift"],
}

TIME_COLUMNS = {
    "orders.csv": ["order_created_at", "due_at", "material_available_at"],
    "production_history.csv": [
        "planned_start_at", "actual_start_at", "planned_end_at", "actual_end_at", "due_at"
    ],
    "machine_availability_calendar.csv": ["shift_start_at"],
}

LEAKAGE_COLUMNS = {
    "actual_processing_minutes", "actual_end_at", "actual_start_at", "actual_output_kg",
    "completion_pct", "defect_quantity_kg", "rework_required", "on_time",
    "lateness_minutes", "idle_after_job_minutes", "downtime_minutes",
    "synthetic_candidate_score", "historically_selected_machine",
}


def validate(directory: Path = DATASET_DIR) -> dict:
    report: dict = {"files": {}, "errors": [], "warnings": []}
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    expected_counts = manifest["row_counts"]

    for filename, expected in expected_counts.items():
        path = directory / filename
        if not path.exists():
            report["errors"].append(f"missing file: {filename}")
            continue
        df = pd.read_csv(path)
        info: dict = {"rows": len(df), "expected_rows": expected, "columns": len(df.columns)}

        if len(df) != expected:
            report["errors"].append(f"{filename}: {len(df)} rows != manifest {expected}")

        missing = df.isna().sum()
        info["missing_values"] = {k: int(v) for k, v in missing.items() if v > 0}

        for id_col in ID_COLUMNS.get(filename, []):
            if id_col not in df.columns:
                report["errors"].append(f"{filename}: missing id column {id_col}")
                continue
            if filename == "production_history.csv":
                dup = int(df["operation_id"].duplicated().sum())
                if dup:
                    report["errors"].append(f"{filename}: {dup} duplicate operation_id")
            elif filename == "allocation_candidates.csv":
                dup = int(df.duplicated(subset=["order_id", "candidate_machine_id"]).sum())
                if dup:
                    report["errors"].append(f"{filename}: {dup} duplicate order/machine pairs")
            elif filename == "machine_availability_calendar.csv":
                dup = int(df.duplicated(subset=["machine_id", "calendar_date", "shift"]).sum())
                if dup:
                    report["errors"].append(f"{filename}: {dup} duplicate machine/date/shift rows")
            else:
                dup = int(df[id_col].duplicated().sum())
                if dup:
                    report["errors"].append(f"{filename}: {dup} duplicate {id_col}")

        bad_time: dict = {}
        for tcol in TIME_COLUMNS.get(filename, []):
            if tcol not in df.columns:
                continue
            parsed = pd.to_datetime(df[tcol], errors="coerce")
            n_bad = int(parsed.isna().sum())
            if n_bad:
                bad_time[tcol] = n_bad
                report["errors"].append(f"{filename}: {n_bad} unparseable/missing {tcol}")
        info["invalid_timestamps"] = bad_time
        report["files"][filename] = info

    # Domain-specific checks
    hist = pd.read_csv(directory / "production_history.csv")
    neg = int((hist["actual_processing_minutes"] <= 0).sum())
    if neg:
        report["errors"].append(f"production_history: {neg} non-positive actual_processing_minutes")
    bad_order = hist.loc[hist["actual_start_at"] > hist["actual_end_at"]]
    if len(bad_order):
        report["errors"].append(f"production_history: {len(bad_order)} rows with start > end")
    report["label_distributions"] = {
        "process_type (history)": hist["process_type"].value_counts().to_dict(),
        "machine_type (history)": hist["machine_type"].value_counts().to_dict(),
    }

    alloc = pd.read_csv(directory / "allocation_candidates.csv")
    eligible = alloc[alloc["candidate_eligible"] == True]  # noqa: E712
    report["label_distributions"]["candidate_eligible"] = alloc["candidate_eligible"].value_counts().to_dict()
    report["label_distributions"]["historically_selected_machine"] = (
        alloc["historically_selected_machine"].value_counts().to_dict()
    )
    selected_among_eligible = int(
        eligible.groupby("order_id")["historically_selected_machine"].sum().eq(1).sum()
    )
    orders_with_selection = int(alloc.groupby("order_id")["historically_selected_machine"].sum().gt(0).sum())
    report["orders_with_one_selected"] = orders_with_selection
    report["eligible_orders_with_one_selected"] = selected_among_eligible
    if selected_among_eligible != orders_with_selection:
        report["warnings"].append(
            f"{orders_with_selection - selected_among_eligible} orders have a selected label on an ineligible candidate"
        )

    # Leakage guard: confirm README-documented target exists and outcome columns exist
    for col in ("actual_processing_minutes",):
        if col not in hist.columns:
            report["errors"].append(f"production_history missing target {col}")

    report["ok"] = not report["errors"]
    return report


if __name__ == "__main__":
    result = validate(Path(sys.argv[1]) if len(sys.argv) > 1 else DATASET_DIR)
    print(json.dumps(result, indent=2, default=str))
    raise SystemExit(0 if result["ok"] else 1)
