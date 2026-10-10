"""Train and evaluate the processing-duration regression model (Phase B).

Target: actual_processing_minutes from production_history.csv (synthetic dataset).

Split: time-aware — rows sorted by planned_start_at, last 20% held out as test.
Limitation: the dataset's timestamps are simulated, so the temporal structure is
artificial; the split prevents same-period leakage but does not prove forward
generalization on real factory data.

Baselines: quantity / (nominal throughput adjusted by efficiency).

Artifacts: backend/mlartifacts/duration_v1.joblib (+ .meta.json). Git-ignored.
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split  # noqa: F401  (group split helper unused; time split used)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.ml.schema import (  # noqa: E402
    CATEGORICAL_FEATURES,
    LEAKAGE_COLUMNS,
    MODEL_VERSION,
    NUMERIC_FEATURES,
    TARGET,
)

DATASET = BACKEND.parent / "dataset" / "textile_production_scheduling_dataset" / "production_history.csv"
ARTIFACT_DIR = BACKEND / "mlartifacts"
TEST_FRACTION = 0.2
RANDOM_STATE = 42


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def baseline_predict(df: pd.DataFrame, adjust_efficiency: bool = True) -> np.ndarray:
    """Quantity / nominal throughput (optionally adjusted by machine efficiency)."""
    rate = df["machine_nominal_rate_kg_per_hour"].clip(lower=1e-6)
    if adjust_efficiency:
        rate = rate * df["machine_efficiency_pct"].clip(lower=1.0) / 100.0
    return (df["batch_quantity_kg"] * 60.0 / rate).to_numpy()


def metrics_block(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        "r2": round(float(r2_score(y_true, y_pred)), 4),
    }


def train() -> dict:
    df = pd.read_csv(DATASET)
    features = CATEGORICAL_FEATURES + NUMERIC_FEATURES
    leakage_present = sorted(set(features) & LEAKAGE_COLUMNS)
    if leakage_present:
        raise SystemExit(f"LEAKAGE: features intersect leakage columns: {leakage_present}")
    if TARGET not in df.columns:
        raise SystemExit(f"missing target {TARGET}")

    df = df.sort_values("planned_start_at").reset_index(drop=True)
    split_idx = int(len(df) * (1 - TEST_FRACTION))
    train_df = df.iloc[:split_idx].reset_index(drop=True)
    test_df = df.iloc[split_idx:].reset_index(drop=True)

    X_train, y_train = train_df[features], train_df[TARGET]
    X_test, y_test = test_df[features], test_df[TARGET]

    pre = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("num", "passthrough", NUMERIC_FEATURES),
        ]
    )
    model = Pipeline(
        steps=[
            ("pre", pre),
            (
                "rf",
                RandomForestRegressor(
                    n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1, min_samples_leaf=2
                ),
            ),
        ]
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    results = {
        "model_version": MODEL_VERSION,
        "target": TARGET,
        "n_train": len(train_df),
        "n_test": len(test_df),
        "split": (
            f"time-aware: sorted by planned_start_at; first {int((1 - TEST_FRACTION) * 100)}% train, "
            f"last {int(TEST_FRACTION * 100)}% test (synthetic timestamps — see limitations)"
        ),
        "features": {"categorical": CATEGORICAL_FEATURES, "numeric": NUMERIC_FEATURES},
        "leakage_excluded": sorted(LEAKAGE_COLUMNS),
        "baseline_throughput_only": metrics_block(y_test.to_numpy(), baseline_predict(test_df, False)),
        "baseline_efficiency_adjusted": metrics_block(y_test.to_numpy(), baseline_predict(test_df, True)),
        "random_forest": metrics_block(y_test.to_numpy(), preds),
        "error_percentiles_abs": {
            p: round(float(np.percentile(np.abs(y_test.to_numpy() - preds), p)), 2)
            for p in (50, 90, 99)
        },
        "by_process_mae": {},
        "by_machine_type_mae": {},
    }
    for col, bucket in (("process_type", "by_process_mae"), ("machine_type", "by_machine_type_mae")):
        for key, grp in test_df.groupby(col):
            pos = grp.index.to_numpy()
            yt, yp = y_test.to_numpy()[pos], preds[pos]
            results[bucket][str(key)] = round(float(mean_absolute_error(yt, yp)), 3)

    ARTIFACT_DIR.mkdir(exist_ok=True)
    artifact_path = ARTIFACT_DIR / "duration_v1.joblib"
    meta_path = ARTIFACT_DIR / "duration_v1.meta.json"
    joblib.dump(model, artifact_path)

    meta = {
        "model_version": MODEL_VERSION,
        "kind": "duration_regression",
        "target": TARGET,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "file": "dataset/textile_production_scheduling_dataset/production_history.csv",
            "sha256": sha256(DATASET),
            "rows": len(df),
            "synthetic": True,
        },
        "sklearn_version": sklearn.__version__,
        "features": {"categorical": CATEGORICAL_FEATURES, "numeric": NUMERIC_FEATURES},
        "leakage_excluded": sorted(LEAKAGE_COLUMNS),
        "feature_defaults": {
            col: (
                float(train_df[col].median()) if train_df[col].dtype.kind in "if"
                else str(train_df[col].mode().iloc[0])
            )
            for col in features
        },
        "split": results["split"],
        "metrics_heldout": results["random_forest"],
        "baseline_metrics_heldout": results["baseline_efficiency_adjusted"],
        "caveat": "Trained on synthetic simulated data; scores do not establish real-factory accuracy.",
    }
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    results["artifact"] = str(artifact_path)
    results["meta"] = str(meta_path)
    return results


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
