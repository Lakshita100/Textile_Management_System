# Project Status — Source of Truth (shared)

**Last repository audit:** 2026-10-10 (main branch at start of Feature 02 × Module 03 integration; see evidence below).
**Overall implementation status:** **Feature 02 and Module 03 quality backend/frontend integration implemented and verified end-to-end. Ram's buyer/admin order workflow is implemented and browser-verified as a local-storage prototype; Module 01/04 APIs and production persistence remain unavailable.**

This file records only what has been inspected in the repository with evidence. Plans, mockups and generated-but-untested code are never counted as implemented.

## Status definitions

- **Implemented and verified** — code exists and behavior was tested with a recorded command/result.
- **Implemented, unverified** — code appears to exist but has not been tested.
- **In progress** — partial implementation exists.
- **Not implemented** — confirmed absent after repository inspection.
- **Blocked** — cannot proceed due to a named dependency or missing decision.
- **Not audited** — no reliable repository evidence yet.

## Audit evidence (2026-10-10, post Feature 02 sprint)

- Git: `main` at `8e70d98` before this changeset; Feature 02 code committed in this change set; private `ai/` remains git-ignored and local-only.
- Backend: FastAPI app (`app/main.py`) with `/api/v1` prefix, CORS for the local frontend, global error handling; health endpoints `/api/v1/health` and `/api/v1/health/db` return `ok` / `{"database": "postgresql", "connected": true}`.
- Database: PostgreSQL 17.9 `textile_manufacturing` migrated to head (`alembic upgrade head` → `909cc08f3f36`); tables `machines`, `machine_status_events`, `production_jobs`, `production_job_status_events`, `machine_downtime_events`, `machine_recommendations`. Tests run against SQLite in-memory.
- Backend tests: `python -m pytest -q` → **29 passed** (health, machines, production, recommendations).
- Frontend: Vite + React + TS + Tailwind application with pages Dashboard, Machines, Machine detail, Production board, Recommendations, Analytics; imports the approved theme. `npm test` (vitest) → **3 passed**; `npm run build` (tsc + vite) → **success**; dev server serves HTTP 200 on `http://localhost:5173`.
- Live end-to-end (uvicorn on `:8000`): machine create/status/history, job lifecycle, quantity progress, recommendation with eligibility exclusions + score breakdown + supervisor approval → job creation, insufficient-material rejection, analytics rows with honest `null` metrics where no data exists.
- Dependency modules (Maahi/Anand/Ram) are still absent; Feature 02 consumes clearly-labeled **FIXTURE adapters** (`app/adapters/fixtures.py`) — never presented as live integrations.
- Demo seed data (`backend/scripts/seed_demo.py`) is labeled DEVELOPMENT FIXTURES.
- **Merge of `origin/anand` (Module 03 quality frontend, 2026-10-10):** branch based on `d9cd758` merged into `main` with 11 conflicts resolved — his `ai/` tracker edits kept local-only and ported into `docs/`; his frontend merged under `/quality` routes beside Feature 02's app; shared theme CSS identical on both branches. Post-merge: `npm run build` success (2277 modules), `npm test` 3 passed, `npm run lint` runs (2 pre-existing warnings).
- **Feature 02 × Module 03 integration (2026-10-10):** persistent `quality_inspections` table (migration `b7f3d2c1a9e4`) + `/api/v1/quality/*` service/router replacing Anand's in-memory demo data; frontend qualityService rewritten API-backed; Jobs ↔ Quality cross-links; analytics defect rate and recommendation quality term now computed from persisted inspections (neutral-50 + explicit per-candidate warnings below 3 samples); per-machine advisory locking for scheduling under concurrency. Evidence: `python -m pytest -q` → **81 passed**; `npm test` → **10 passed**; build ✓; lint ✓ (2 pre-existing warnings); live server e2e → **37/37 checks** incl. 5× parallel double-approve/double-create at exactly one success each and a direct two-connection `pg_advisory_xact_lock` blocking proof; `alembic check` → no drift; dataset untouched/untracked; nothing staged or committed.
- **Ram order workflow prototype (2026-10-10):** buyer form, local-storage order register, order-specific admin review, buyer-visible clarifications/status messages, and a manually entered, explicitly labelled demo material check are implemented. No Maahi or order API is wired; see the module-specific status below.

## Status matrix

| Area | Status | Evidence / next action |
|---|---|---|
| Repository / monorepo structure | Implemented | Backend, frontend, docs, tests in place |
| Shared documentation (`docs/`) | Created (Stage 0) | Architecture, plan, status, tracker, prerequisites, data sources, API contracts |
| Approved theme / global CSS | Implemented and verified | `frontend/src/styles/theme.css` + `global.css`, imported by the running frontend; only approved tokens used |
| Backend app shell (FastAPI `main.py`, CORS, `/api/v1`) | Implemented and verified | Health endpoints verified live; 500-handling verified |
| Authentication and staff authorization | Implemented, unverified in this changeset | Buyer signup/login, Google token verification, provisioned employee/admin IDs, per-feature API and page guards, required password reset, attendance; apply migration `e5f6g7h8i9j0` |
| Database models (Feature 02 + quality schema) | Implemented and verified | 7 tables via migrations `909cc08f3f36` + `b7f3d2c1a9e4` on PostgreSQL; SQLite for tests |
| Alembic migrations | Implemented and verified | `alembic upgrade head` → `b7f3d2c1a9e4`; `alembic check` → no drift; sync-only engine (async path removed — `asyncpg` unavailable) |
| Feature 02 — Machine Overview Dashboard | Implemented and verified | KPI cards, searchable/filterable table, detail + status history screens wired to live API |
| Feature 02 — Current Machine Assignments | Implemented and verified (FIXTURE order refs) | Assignment model, conflict prevention, transitions validated by 29-test suite; Ram's `orders` not yet real |
| Feature 02 — Production Quantity & Progress Tracking | Implemented and verified | Lifecycle transitions, overproduction/negative-quantity rejection, downtime records, dashboard KPIs |
| Feature 02 — Machine Recommendation Engine | Implemented and verified | Rule-based scoring (0.40/0.35/0.25), eligibility gates before scoring, explanations, warnings, approval revalidation; live e2e verified |
| Feature 02 — Performance & Quality-History Analytics | Implemented and verified | `/production/analytics` returns per-machine output/efficiency/utilization/downtime; defect rate computed from persisted `quality_inspections` within the date window, `null` + "not fabricated" note when history absent |
| ML scheduling — duration model (`duration-v1`) | Implemented and verified (SYNTHETIC data) | Trained on `dataset/textile_production_scheduling_dataset/`; held-out MAE 18.42 min / R² 0.976; efficiency-adjusted throughput baseline is marginally better (17.65) on this corpus — rule fallback kept; serving degrades gracefully to capacity rule when artifact missing (`503 MODEL_UNAVAILABLE` on explicit estimate endpoint, rule fallback in recommendations) |
| ML scheduling — allocation ranker (`allocation_rank-v1`) | Implemented and verified (experimental) | Held-out top-1 0.84 vs 0.60/0.56/0.42 heuristics; exposed only as `ml_selection_probability` — never overrides eligibility gates or rule scores; tagged experimental + synthetic-data warnings in API and UI |
| Scheduling engine (setup/queue/idle/deadline) | Implemented and verified | 14-day horizon, 15-min setup default, busy-interval conflict logic aligned with approval revalidation; assumptions/warnings surfaced in API and UI; approval defaults job planned window from computed schedule and persists `approved_schedule` in payload |
| Scheduling API | Implemented and verified | `POST /api/v1/scheduling/estimate-duration`, `GET /api/v1/scheduling/machines/{id}/timeline` with coded 404/422/503 errors — live-smoked |
| Scheduling concurrency (multi-worker) | Implemented and verified | Per-machine `pg_advisory_xact_lock` (ns 741202) in `create_job`; approval revalidates under row lock + machine lock in one transaction; machine status changes take the same lock (approval-vs-status TOCTOU closed); live proof: 5× parallel double-approve/double-create → one success each; direct two-connection lock blocking test; SQLite path documented as no-op |
| ML scheduling frontend | Implemented and verified | Recommend: schedule detail card, Processing/Start→Completion/ML P(select) columns (experimental label); MachineDetail: 14-day timeline + assumptions/warnings; Jobs: planned window column |
| Module 01 Raw Materials (Maahi) | Not implemented | No inventory API/schema; Ram's review page stays integration-pending unless a clearly labelled manual demo check is recorded |
| Module 03 Quality — backend | Implemented and verified | `quality_inspections` (migration `b7f3d2c1a9e4`) + `/api/v1/quality/*`: eligibility, qty caps, cross-checks, server-derived batch/roll/outcome, disposition updates, dashboard, roll preview, inspectable job, per-job counts; coded 409/404 errors |
| Module 03 Quality — frontend (Anand) | Implemented and verified (API-backed) | Dashboard, All Inspections, modal form at `/quality` now read/write the persistent API (no in-memory demo data); Jobs ↔ Quality cross-links; employee session switcher remains demo-only |
| Module 03 Packing / Dispatch (Anand) | Frontend implemented (merged from `anand`) | Inspection modal submit renamed "Proceed"; on success accepted metres queued to Packing (`queueFromInspection`); Packing page (`/quality/packing`, in-memory demo lots) + Dispatch page (`/quality/dispatch`, country/state/city analytics, demo shipments) with sidebar nav; build/lint verified 2026-10-10 — **in-memory demo data only; no warehouse/logistics backend** |
| Module 04 Orders (Ram) | Frontend demo implemented; browser-local data | Buyer request, order review, and status messages remain local-storage only; authentication is backend-backed |
| Modules 05/06 (Warehouse, Employees/Accounts) | Not implemented (owners TBD) | Partial demo UI only: Packing + Dispatch screens live under Module 03 (`/quality/packing`, `/quality/dispatch`, in-memory demo data); no warehouse stock or logistics backend |

| Backend tests | Implemented and verified | `python -m pytest -q` → **81 passed** (29 Feature 02 baseline + 32 ML/scheduling + 20 quality/concurrency) |
| Frontend tests / build | Implemented and verified | `npm test` → **10 passed**; `npm run build` → success; `npm run lint` → oxlint 0 errors (2 pre-existing warnings) |
| Live integration verification | Implemented and verified | uvicorn `:8000` + PostgreSQL: **37/37 checks** (e2e flow, coded error probes, dashboard from DB, parallel at-most-one-success, advisory-lock blocking proof, script-row-only cleanup) |
| CI / deployment | Not implemented | Out of scope until MVP verified |

## Known risks

1. **Live integrations remain incomplete.** Module 01 inventory and Module 04 order APIs do not exist here; the buyer/admin order prototype is local-storage-only, and the manually entered Maahi demo check is not live stock. Contracts must be confirmed with Maahi and Ram before integration.
2. Buyer order persistence remains browser-local. Account authentication and staff feature authorization are backend-enforced. Google login requires OAuth Client ID configuration.
3. Analytics defect-rate and recommendation quality-score now read persisted `quality_inspections`; below 3 linked samples they show neutral-50 / `null` with explicit warnings (never fabricated). Anand's employee session switcher on the quality form remains demo-only.
4. Demo/seed rows (DEVELOPMENT FIXTURES) and earlier manual test rows live in the local PostgreSQL database; a fresh clone must run `alembic upgrade head` (and optionally the seed script).
5. Optional ML (Stage 7 / `dataset/ai4i2020.csv`) remains unapproved and unused by any running code.
7. **ML scheduling models are trained on SYNTHETIC data** (`dataset/textile_production_scheduling_dataset/`, seed 20261010); the ranking label is a heuristic, not ground truth. Do not claim real-factory accuracy. Model artifacts live in git-ignored `backend/mlartifacts/` — a fresh clone runs on rule fallback until `python scripts/train_duration_model.py` and `python scripts/train_allocation_ranker.py` are re-run. The scheduling dataset directory is currently **untracked**; commit it only on explicit approval.
6. Frontend carries two module shells (Feature 02 `Layout` and quality `AppShell`) with separate navigation; cross-links added both ways (`/quality` ↔ `/`), plus Jobs ↔ Quality inspection links (`/jobs?job=` ↔ `/quality/inspections?job=`).

## Rules for updating this document

- Never turn "not audited" into "not implemented" without inspection; never mark planned or AI-generated code as implemented/verified.
- For each status change, record the date, verification command and result in `IMPLEMENTATION_TRACKER.md`.
- Keep private notes, credentials and debugging details out of this file (they belong in the local-only `ai/` folder).
