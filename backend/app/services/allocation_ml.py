"""Experimental allocation ranking (Phase C) — probability a candidate is chosen.

Artifact: backend/mlartifacts/allocation_rank_v1.joblib (git-ignored).
IMPORTANT: trained on the dataset's SYNTHETIC heuristic labels — it reproduces
the generator's decision pattern, not verified optimal assignments.

Never used to override hard eligibility constraints; the operational ranking
remains the documented rule-based score. Missing artifact or unmappable
features → returns None (caller keeps rule-based behavior).
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd

from app.models.machine import Machine
from app.services.scheduling import ScheduleEstimate

ARTIFACT_PATH = Path(__file__).resolve().parents[2] / "mlartifacts" / "allocation_rank_v1.joblib"
META_PATH = ARTIFACT_PATH.with_name("allocation_rank_v1.meta.json")

_cache: dict = {}


def model_available() -> bool:
    return ARTIFACT_PATH.exists() and META_PATH.exists()


def _load() -> tuple[object, dict]:
    if "model" not in _cache:
        if not model_available():
            raise FileNotFoundError("allocation ranker artifact missing")
        _cache["model"] = joblib.load(ARTIFACT_PATH)
        _cache["meta"] = json.loads(META_PATH.read_text(encoding="utf-8"))
    return _cache["model"], _cache["meta"]


def selection_probability(
    machine: Machine,
    *,
    process: str,
    quantity_kg: float | None,
    schedule: ScheduleEstimate,
    gsm: float | None = None,
    width_cm: float | None = None,
    fabric_type: str | None = None,
    color: str | None = None,
    priority: str = "NORMAL",
) -> float | None:
    """Experimental: P(candidate is 'selected') per the learned heuristic. None if unavailable."""
    try:
        model, meta = _load()
    except FileNotFoundError:
        return None

    defaults = meta.get("feature_defaults", {})
    features = {
        "process_type": (process or "").strip().upper(),
        "fabric_type": fabric_type or defaults.get("fabric_type", "UNKNOWN"),
        "color_family": color or defaults.get("color_family", "UNKNOWN"),
        "priority": priority,
        "machine_type": str(machine.machine_type).upper(),
        "gsm": float(gsm) if gsm else float(defaults.get("gsm", 200.0)),
        "batch_quantity_kg": float(quantity_kg) if quantity_kg else float(defaults.get("batch_quantity_kg", 500.0)),
        "machine_capacity_kg_per_batch": float(defaults.get("machine_capacity_kg_per_batch", 500.0)),
        "machine_nominal_rate_kg_per_hour": float(defaults.get("machine_nominal_rate_kg_per_hour", 60.0)),
        "machine_efficiency_pct": float(defaults.get("machine_efficiency_pct", 85.0)),
        "machine_availability_pct": float(defaults.get("machine_availability_pct", 90.0)),
        "setup_estimate_minutes": schedule.setup_minutes,
        "queue_wait_estimate_minutes": schedule.queue_wait_minutes,
        "processing_time_estimate_minutes": schedule.processing_minutes,
    }
    try:
        order = meta["features"]["categorical"] + meta["features"]["numeric"]
        row = pd.DataFrame([{k: features[k] for k in order}])
        proba = model.predict_proba(row)
        classes = list(model.named_steps["clf"].classes_)
        if 1 not in classes:
            return 0.0
        return round(float(proba[0][classes.index(1)]), 4)
    except Exception:  # experimental feature must never break the API
        return None
