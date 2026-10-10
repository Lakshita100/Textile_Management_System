# Data Sources and Integration (shared)

Feature 02 (Production & Machine Tracking) consumes operational data owned by other modules and may, in a future approved phase, experiment with public datasets. This document records owners, contract status, and dataset limitations.

## 1. Internal operational data (source of truth: PostgreSQL + module APIs)

All operational data lives in the single project PostgreSQL database. Each domain has one owning module; consumers integrate through that owner's API or an explicitly approved shared contract — never by duplicating ownership of tables.

### Dependency register for Feature 02

| # | Dependency | Owner | Purpose in Feature 02 | Expected identifiers / units | Contract status (2026-10-10) |
|---|---|---|---|---|---|
| D1 | `orders` — order specs, quantities, deadlines | **Ram (Module 04)** | Recommendation input; delay alerts; assignment linkage | `order_id`, line items, quantity + unit (m/kg), `deadline` datetime | **Backend contract NOT AVAILABLE** — frontend buyer/admin demo flow uses browser local storage; no shared API/schema |
| D2 | `raw_materials` — stock availability | **Maahi (Module 01)** | Hard eligibility gate (material must be available before scheduling) | `material_id`, quantity on hand + unit, reserved qty | **NOT AVAILABLE** — no Maahi API or schema exists |
| D3 | `quality_inspections` — historical inspection outcomes | **Anand (Module 03)** | Machine quality score (numerator/denominator defined at Phase 1) | `inspection_id`, linked roll/order/machine, defect counts, outcome (approved/rework/rejected) | **NOT AVAILABLE** — no module code, API or schema exists |

For each dependency, before integration the following must be confirmed with the owner and recorded here: actual endpoint or shared entity; request/response schema; identifiers and units; authentication and permissions; error and unavailable-service behavior; data refresh expectations.

Ram's current UI prototype stores buyer requests, review decisions, and explicitly shared buyer messages in browser local storage. Ram may also enter a manual material quantity for a workflow demonstration; it is labelled `Ram demo check`, is not a Maahi inventory result, and must not be treated as live availability. No order or inventory database/API integration is implied.

### Unavailable-dependency policy

- Document the missing contract (as done above); do not invent one.
- A temporary mock interface requires **explicit owner approval**, must be clearly labelled as mock in code and UI, and must never be presented as live integration.
- When a dependency service is unavailable at runtime, Feature 02 must fail gracefully with a clear message (e.g., recommendation blocked: "material availability service unavailable") rather than silently proceeding.

## 2. Data Feature 02 owns and produces

| Data | Direction | Notes |
|---|---|---|
| `machines` master data + operational status | Owned | Status history in `machine_status_events` |
| `production_jobs` (assignments, quantities, times, downtime) | Owned | Transactional conflict prevention |
| `machine_downtime_events` | Owned | Reason + interval |
| `machine_recommendations` | Owned | Inputs, score components, algorithm version, timestamp, supervisor decision — full audit trail |
| Analytics derived from the above (+ D3 for defect rate) | Owned/derived | Definitions fixed in `ARCHITECTURE.md` §6 |

## 3. Public datasets — candidate only for the optional ML phase (Stage 7)

These are **not** substitutes for actual textile production records and are **not interchangeable** with one another. None may be used without owner approval, provenance verification and license review. Nothing in Feature 02's rule-based MVP depends on them.

| Dataset | Possible experimental use | Key limitations |
|---|---|---|
| **UCI AI4I 2020 Predictive Maintenance Dataset** | Experimental industrial failure-risk / predictive-maintenance prototyping | **Synthetic** data; not textile-specific; no real machine workload, scheduling or fabric-quality structure; results cannot be claimed as factory-valid |
| **AITEX fabric-defect dataset** | Possible future fabric-defect research (image-based) | Image defect library, not operational machine data; licensing/attribution must be verified at source; does not provide workload, status or scheduling data |
| **MVTec AD** | General industrial image-anomaly experiments | Not textile-production data; not a source of machine efficiency, utilization or quality-inspection history for scoring |

Rules: verify the original source, license and permitted use before any experiment; keep experimental models clearly separated from production features; never display dataset-derived metrics as actual factory history.

## 4. ML policy

1. The machine recommender is an **explainable rule-based algorithm** for the MVP. It must never be described as a trained ML model.
2. No ML training during initial setup. An ML experiment (Stage 7) starts only after the rule-based recommender is implemented, verified, and the owner explicitly approves.
3. An approved ML experiment must define: one prediction target; a suitable dataset with verified provenance and license; a baseline; a held-out evaluation strategy; recorded limitations and reproducibility steps.
4. Production-readiness claims require appropriate textile-factory validation — not public-dataset scores.

## 5. Integration with sensors / external services

Physical IoT, machine sensors (`machine_sensor_readings`) and live logistics APIs are **out of MVP scope** and require explicit approval plus real devices/credentials before any modelling work.
