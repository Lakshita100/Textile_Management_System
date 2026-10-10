"""Feature schema for ML duration prediction and experimental allocation ranking.

Leakage rule: nothing produced during/after the operation may be a feature.
"""

from __future__ import annotations

MODEL_VERSION = "duration-v1"
ALLOCATION_MODEL_VERSION = "allocation-rank-v1"

TARGET = "actual_processing_minutes"

# Features available when a new order is scheduled (pre-production only).
CATEGORICAL_FEATURES = [
    "machine_id",
    "machine_type",
    "process_type",
    "fabric_type",
    "fiber_composition",
    "color_family",
]

NUMERIC_FEATURES = [
    "gsm",
    "fabric_width_cm",
    "batch_quantity_kg",
    "priority",
    "machine_capacity_kg_per_batch",
    "machine_nominal_rate_kg_per_hour",
    "machine_efficiency_pct",
    "machine_availability_pct",
    "setup_base_minutes",
    "estimated_queue_wait_minutes",
]

# priority arrives as strings (LOW/NORMAL/HIGH/URGENT) — treat as categorical
CATEGORICAL_FEATURES.append("priority")
NUMERIC_FEATURES.remove("priority")

# Post-production outcomes and heuristic internals — NEVER features.
LEAKAGE_COLUMNS = {
    "actual_processing_minutes",
    "actual_start_at",
    "actual_end_at",
    "actual_output_kg",
    "completion_pct",
    "defect_quantity_kg",
    "rework_required",
    "on_time",
    "lateness_minutes",
    "idle_after_job_minutes",
    "downtime_minutes",
    "setup_minutes",
    "planned_processing_minutes",
    "planned_start_at",
    "planned_end_at",
    "due_at",
    "shift",
    "synthetic_candidate_score",
    "historically_selected_machine",
}
