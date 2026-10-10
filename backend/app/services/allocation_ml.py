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
import logging
from pathlib import Path

try:
    import joblib
    import pandas as pd
except ImportError as e:
    joblib = None
    pd = None
    logging.getLogger(__name__).warning(f"Optional ML dependencies (pandas/joblib) not found: {e}")

from app.models.machine import Machine
from app.services.scheduling import ScheduleEstimate

ARTIFACT_PATH = Path(__file__).resolve().parents[2] / "mlartifacts" / "allocation_rank_v1.joblib"
META_PATH = ARTIFACT_PATH.with_name("allocation_rank_v1.meta.json")

_cache: dict = {}


def model_available() -> bool:
    return pd is not None and joblib is not None and ARTIFACT_PATH.exists() and META_PATH.exists()


def _load() -> tuple[object, dict]:
    if "model" not in _cache:
        if not model_available():
            raise FileNotFoundError("allocation ranker artifact missing or ML packages unavailable")
        _cache["model"] = joblib.load(ARTIFACT_PATH)
        _cache["meta"] = json.loads(META_PATH.read_text(encoding="utf-8"))
    return _cache["model"], _cache["meta"]


def predict_probability(
    *,
    job_type: str,
    target_date: str | None,
    estimated_hours: float,
    efficiency_score: float,
    candidate: Machine,
    est: ScheduleEstimate,
    candidate_rank_index: int,
) -> float | None:
    if not model_available():
        return None

    try:
        model, meta = _load()
        feature_cols = meta.get("features", [])

        # Build raw feature row
        row = {
            "job_type": job_type,
            "estimated_hours": estimated_hours,
            "efficiency_score": efficiency_score,
            "machine_id": candidate.id,
            "machine_status": candidate.status,
            "available_date": est.available_date.isoformat(),
            "start_time": est.start_time.isoformat(),
            "completion_time": est.completion_time.isoformat(),
            "setup_hours": est.setup_hours,
            "process_hours": est.process_hours,
            "candidate_rank_index": candidate_rank_index,
        }

        df = pd.DataFrame([row])
        df_encoded = pd.get_dummies(df)

        # Align with training features
        for col in feature_cols:
            if col not in df_encoded.columns:
                df_encoded[col] = 0
        df_encoded = df_encoded[feature_cols]

        probs = model.predict_proba(df_encoded)
        return float(probs[0][1])
    except Exception:
        return None
