"""Duration prediction service — loads the trained artifact, validates inputs.

Model artifact: backend/mlartifacts/duration_v1.joblib (git-ignored).
If the artifact is missing, ModelUnavailableError is raised; callers decide
whether to fail explicitly (API) or fall back to the documented rule (scheduler).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import joblib
import pandas as pd

from app.ml.schema import CATEGORICAL_FEATURES, NUMERIC_FEATURES

ARTIFACT_PATH = Path(__file__).resolve().parents[2] / "mlartifacts" / "duration_v1.joblib"
META_PATH = ARTIFACT_PATH.with_name("duration_v1.meta.json")

_cache: dict = {}


class ModelUnavailableError(Exception):
    """The trained artifact is missing or unreadable."""


class InvalidFeaturesError(Exception):
    """Input feature row failed schema validation."""


@dataclass
class DurationEstimate:
    minutes: float
    source: str  # "ml" | "rule_capacity"
    model_version: str | None
    warnings: list[str] = field(default_factory=list)


def model_available() -> bool:
    return ARTIFACT_PATH.exists() and META_PATH.exists()


def load_model() -> tuple[object, dict]:
    if "model" not in _cache:
        if not model_available():
            raise ModelUnavailableError(
                "duration model artifact missing — run scripts/train_duration_model.py"
            )
        _cache["model"] = joblib.load(ARTIFACT_PATH)
        _cache["meta"] = json.loads(META_PATH.read_text(encoding="utf-8"))
    return _cache["model"], _cache["meta"]


def validate_feature_row(features: dict) -> None:
    required = set(CATEGORICAL_FEATURES) | set(NUMERIC_FEATURES)
    missing = sorted(required - set(features))
    if missing:
        raise InvalidFeaturesError(f"missing features: {', '.join(missing)}")
    for col in NUMERIC_FEATURES:
        try:
            float(features[col])
        except (TypeError, ValueError) as e:
            raise InvalidFeaturesError(f"feature {col} is not numeric: {features[col]!r}") from e


def predict_processing_minutes(features: dict) -> DurationEstimate:
    """ML path: validated feature row → RF duration estimate (minutes)."""
    validate_feature_row(features)
    model, meta = load_model()
    order = meta["features"]["categorical"] + meta["features"]["numeric"]
    row = pd.DataFrame([{k: features[k] for k in order}])
    minutes = float(model.predict(row)[0])
    return DurationEstimate(
        minutes=max(0.0, round(minutes, 2)),
        source="ml",
        model_version=meta["model_version"],
        warnings=[],
    )


def rule_capacity_minutes(quantity: float, capacity_per_day: float, unit_note: str) -> DurationEstimate:
    """Documented fallback: quantity / daily capacity (existing Feature 02 rule)."""
    if capacity_per_day <= 0:
        raise InvalidFeaturesError("machine capacity must be > 0 for rule estimate")
    minutes = quantity / capacity_per_day * 1440.0
    return DurationEstimate(
        minutes=round(minutes, 2),
        source="rule_capacity",
        model_version=None,
        warnings=[unit_note],
    )
