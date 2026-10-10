"""Dataset schema validation + ML feature/leakage checks (Phase A/B)."""

from pathlib import Path

import pytest

from app.ml.schema import CATEGORICAL_FEATURES, LEAKAGE_COLUMNS, NUMERIC_FEATURES, TARGET
from scripts.validate_scheduling_dataset import DATASET_DIR, validate

DATASET_PRESENT = DATASET_DIR.exists() and (DATASET_DIR / "manifest.json").exists()


@pytest.mark.skipif(not DATASET_PRESENT, reason="scheduling dataset not present in this checkout")
def test_dataset_validation_passes():
    report = validate(DATASET_DIR)
    assert report["ok"], report["errors"]
    assert report["files"]["production_history.csv"]["rows"] == 10000
    assert report["files"]["allocation_candidates.csv"]["rows"] == 57349
    assert report["warnings"] == []
    # every selected label must sit on an eligible candidate
    assert report["eligible_orders_with_one_selected"] == report["orders_with_one_selected"]


def test_no_leakage_in_feature_schema():
    features = set(CATEGORICAL_FEATURES) | set(NUMERIC_FEATURES)
    assert not (features & LEAKAGE_COLUMNS), sorted(features & LEAKAGE_COLUMNS)


def test_target_is_post_production_outcome():
    assert TARGET in LEAKAGE_COLUMNS  # target itself must never be a feature


def test_priority_is_categorical_not_numeric():
    assert "priority" in CATEGORICAL_FEATURES
    assert "priority" not in NUMERIC_FEATURES


@pytest.mark.skipif(not DATASET_PRESENT, reason="scheduling dataset not present in this checkout")
def test_timestamps_parse_and_ordering_valid():
    import pandas as pd

    df = pd.read_csv(DATASET_DIR / "production_history.csv")
    start = pd.to_datetime(df["actual_start_at"], errors="coerce")
    end = pd.to_datetime(df["actual_end_at"], errors="coerce")
    assert start.isna().sum() == 0 and end.isna().sum() == 0
    assert (start <= end).all()
    assert (df["actual_processing_minutes"] > 0).all()


@pytest.mark.skipif(not DATASET_PRESENT, reason="scheduling dataset not present in this checkout")
def test_synthetic_labels_flagged():
    import pandas as pd

    df = pd.read_csv(DATASET_DIR / "orders.csv")
    assert df["record_type"].astype(str).str.contains("SYNTHETIC", case=False).all()
