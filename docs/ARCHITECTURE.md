# Architecture — Textile Manufacturing Intelligence System

**Status:** Target architecture for an MVP that is currently at scaffold stage. Nothing in this document is implemented unless `PROJECT_STATUS.md` says so with evidence.
**Last audited:** 2026-10-10 (repository inspection, see `PROJECT_STATUS.md`).

## 1. System overview

One web application for textile factories connecting six business modules end-to-end:

raw material → customer order → machine recommendation → production → quality inspection → finished stock → dispatch → costing and reporting.

| # | Module | Owner |
|---|---|---|
| 01 | Smart Raw Material and Supplier Management | Maahi |
| 02 | Production & Machine Tracking (incl. machine recommendation) | **Lakshita** |
| 03 | Quality Management and Machine Efficiency Analytics | Anand |
| 04 | Order Management | Ram |
| 05 | Warehouse, Dispatch and Logistics | TBD |
| 06 | Employee, Attendance and Accounts Management | TBD |

## 2. Technology stack (fixed for the MVP)

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, React Router, Axios, Recharts, Lucide React.
- **Backend:** Python FastAPI, Pydantic, SQLAlchemy 2.x, Alembic, Uvicorn.
- **Database:** PostgreSQL (single relational database; no microservices, no Kubernetes, no physical IoT for the MVP).
- **Monorepo layout:** `backend/`, `frontend/`, `docs/` (shared documentation), `ai/` (private, local-only, git-ignored).

Logical flow: Browser UI → Axios API client → FastAPI REST API (`/api/v1`) → service/business rules → SQLAlchemy → PostgreSQL.

## 3. Backend layering

Each domain follows: `models/` (SQLAlchemy entities) → `schemas/` (Pydantic request/response) → `crud/` (data access) → `services/` (business rules) → `api/routers/` (HTTP layer). Shared concerns live in `app/config.py` and `app/database.py`. Migrations are managed by Alembic; production tables are never created implicitly at startup.

## 4. Frontend layering

`pages/` (route screens), `components/` (reusable UI), `services/` (Axios calls), `types/` (TypeScript contracts), `hooks/` (stateful behavior), `styles/` (approved theme). Global theme and CSS are version-controlled at `frontend/src/styles/theme.css` and `frontend/src/styles/global.css`. Only the approved palette tokens may be used (see §7).

## 5. Shared data ownership (single owner per domain)

One relational database; each entity has exactly one owning module. Other modules read through that owner's API or approved shared contracts — never by silently duplicating tables.

| Domain | Key entities | Owner | Consumers |
|---|---|---|---|
| Suppliers / materials / purchases | `suppliers`, `raw_materials`, `purchases` | Maahi (Module 01) | Feature 02 (material availability checks) |
| Orders | `orders` | Ram (Module 04) | Feature 02 (order specs, deadlines) |
| Quality inspections | `quality_inspections` | Anand (Module 03) | Feature 02 (machine quality history) |
| Machines / production | `machines`, `production_jobs`, `machine_status_events`, `machine_downtime_events`, `machine_recommendations` | **Lakshita (Feature 02)** | Dashboards, costing, warehouse |
| Warehouse / dispatch | `finished_rolls`, `shipments` | Module 05 | Reporting |
| Employees / accounts | `employees`, `attendance`, `expenses`, `payments` | Module 06 | Costing, wages |

## 6. Feature 02 (Production & Machine Tracking) — architecture scope

**Modules:** Machine Overview Dashboard · Current Machine Assignments · Production Quantity/Progress Tracking · Machine Recommendation Engine · Machine Performance & Quality-History Analytics.

**Entities owned by Feature 02:**

- `machines` — master data: code, name, type, supported processes, capacity + unit, operational status (Running / Idle / Maintenance — subject to shared status conventions once the team agrees them in Phase 1), efficiency basis.
- `production_jobs` — assignment of an order line to a machine: planned/actual quantities, planned/actual start/end, shift, status, downtime linkage.
- `machine_status_events` — status history with timestamp and reason. Operational status and assignment availability are modelled separately: a Running machine may still be committed.
- `machine_downtime_events` — downtime intervals with reason and duration.
- `machine_recommendations` — persisted recommendation inputs, score components, algorithm version, timestamp, supervisor decision.

**Recommended entities owned elsewhere but required by Feature 02:** `orders` (Ram), `raw_materials`/stock (Maahi), `quality_inspections` (Anand).

**Recommendation engine (explainable, rule-based — not trained ML):**

1. Hard gates (no scoring): material availability; process/fabric compatibility; capacity fit; machine operational availability; no schedule overlap in the required window.
2. For eligible machines, estimate production time from capacity and available historical performance data.
3. Score on a normalized 0–100 scale: `Score = 0.40 × Efficiency + 0.35 × Workload Suitability + 0.25 × Quality Score` (initial demonstration weights, not scientifically validated factory parameters).
4. Efficiency from comparable historical/measured production data. Workload suitability from existing assignments, remaining time, required processing time and order deadline (low workload alone is not sufficient — the machine must be able to finish on time). Quality score from Anand's actual inspection history with an explicit numerator/denominator; missing history is marked unknown with a documented fallback — never silently scored perfect.
5. Return ranked candidates, exclusion reasons, score breakdown, data-grounded explanation, estimated completion, missing-data warnings, or a clear failure reason. Never force an assignment.
6. Authorized supervisor approves; material, status and schedule are revalidated transactionally before the assignment is persisted together with the recommendation decision.

**Analytics definitions (must not be used interchangeably):**

- *Efficiency* — actual output vs. standard/expected output for comparable work.
- *Utilization* — productive time ÷ scheduled available time (treatment of breaks, maintenance and unscheduled time must be defined and displayed).
- *Defect rate* — defect quantities from Anand's linked inspection records ÷ inspected quantity.
Empty states are shown when history is unavailable; fabricated defect rates or invented history are never displayed.

## 7. Design system (strict)

Shared, version-controlled files: `frontend/src/styles/theme.css`, `frontend/src/styles/global.css`. Approved palette only:

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#3F85C4` | Primary actions, selected nav, links, highlights |
| `--color-accent` | `#76B82A` | Restrained secondary accents, success states |
| `--color-background` | `#FFFFFF` | Page and navigation background |
| `--color-surface` | `#F0F0F0` | Secondary panels, table headers, muted cards |
| `--color-heading` | `#2F2F2F` | Headings |
| `--color-text` | `#333333` | Body copy |
| `--color-border` | `#E5E5E5` | Dividers and control outlines |

No arbitrary component-level hex colors, new brand colors, gradients, glassmorphism or dark theme without explicit owner approval. Components reference `var(--color-...)`. Semantic error/warning states use accessible labels/icons; any new semantic color token requires owner approval.

## 8. API conventions

- Prefix `/api/v1`, plural resource names, standard HTTP methods.
- Validated request/response schemas (Pydantic / TypeScript types), consistent error shape, pagination on list endpoints, CORS configurable for the local frontend.
- Swagger/OpenAPI from FastAPI. No credentials or stack traces in user-facing errors.
- Proposed Feature 02 endpoint paths are documented in `API_CONTRACTS.md` (proposals until Phase 1 confirms conventions with the team).

## 9. Status lifecycles (proposed, subject to Phase 1 team confirmation)

- Orders: Pending → Scheduled → In Production → Quality Check → Ready to Dispatch → Dispatched.
- Production jobs (Feature 02): Assigned → Planned → In Progress ⇄ Paused → Completed (+ Cancelled).
- Machines (operational): Running / Idle / Maintenance (plus availability derived from assignments — not the same as status).
- Shipments: Packed → Dispatched → In Transit → Out for Delivery → Delivered (no live-tracking claims without a real provider).

## 10. Scope boundaries (MVP)

Deferred unless explicitly approved with real credentials/devices/data: live logistics provider APIs, camera defect detection, physical IoT/sensor integration, trained ML recommender, microservices, Kubernetes. An optional experimental ML phase exists only after the rule-based recommender is verified and the owner approves it (see `DATA_SOURCES_AND_INTEGRATION.md`).
