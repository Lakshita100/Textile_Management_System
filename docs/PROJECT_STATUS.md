# Project Status — Source of Truth (shared)

**Last repository audit:** 2026-10-10 (branch `main`, commit `8e70d98` at start of Feature 02 implementation sprint; this changeset contains the Feature 02 phases below).
**Overall implementation status:** **Feature 02 (Production & Machine Tracking) implemented and verified — platform foundation, backend, frontend, tests. Team modules 01/03/04 not yet in this repository.**

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

## Status matrix

| Area | Status | Evidence / next action |
|---|---|---|
| Repository / monorepo structure | Implemented | Backend, frontend, docs, tests in place |
| Shared documentation (`docs/`) | Created (Stage 0) | Architecture, plan, status, tracker, prerequisites, data sources, API contracts |
| Approved theme / global CSS | Implemented and verified | `frontend/src/styles/theme.css` + `global.css`, imported by the running frontend; only approved tokens used |
| Backend app shell (FastAPI `main.py`, CORS, `/api/v1`) | Implemented and verified | Health endpoints verified live; 500-handling verified |
| Database models (Feature 02 schema) | Implemented and verified | 6 tables created via migration `909cc08f3f36` on PostgreSQL; SQLite for tests |
| Alembic migrations | Implemented and verified | `alembic upgrade head` applied; sync-only engine (async path removed — `asyncpg` unavailable) |
| Feature 02 — Machine Overview Dashboard | Implemented and verified | KPI cards, searchable/filterable table, detail + status history screens wired to live API |
| Feature 02 — Current Machine Assignments | Implemented and verified (FIXTURE order refs) | Assignment model, conflict prevention, transitions validated by 29-test suite; Ram's `orders` not yet real |
| Feature 02 — Production Quantity & Progress Tracking | Implemented and verified | Lifecycle transitions, overproduction/negative-quantity rejection, downtime records, dashboard KPIs |
| Feature 02 — Machine Recommendation Engine | Implemented and verified | Rule-based scoring (0.40/0.35/0.25), eligibility gates before scoring, explanations, warnings, approval revalidation; live e2e verified |
| Feature 02 — Performance & Quality-History Analytics | Implemented and verified (defect metric pending Anand) | `/production/analytics` returns per-machine output/efficiency/utilization/downtime; defect rate shown only from real quality data (none yet) |
| Module 01 Raw Materials (Maahi) | Not implemented | Material gate served by labeled FIXTURE adapter |
| Module 03 Quality (Anand) | Frontend implemented (merged from `anand`) | Quality dashboard, All Inspections, modal inspection form, employee session switcher at `/quality`; build/lint verified by Anand and re-verified post-merge — **in-memory demo data only; backend wiring pending** |
| Module 04 Orders (Ram) | Not implemented | Order refs served by labeled FIXTURE adapter |
| Modules 05/06 (Warehouse, Employees/Accounts) | Not implemented | Owners TBD |
| Authentication / RBAC | Not implemented | Config placeholders removed pending design; supervisor approval currently records approver name only |
| Backend tests | Implemented and verified | `python -m pytest -q` → 29 passed |
| Frontend tests / build | Implemented and verified | `npm test` → 3 passed; `npm run build` → success (incl. merged quality module); `npm run lint` → oxlint active |
| CI / deployment | Not implemented | Out of scope until MVP verified |

## Known risks

1. **Feature 02 still depends on three modules (01/03/04) that do not exist in this repository.** FIXTURE adapters are labeled and swappable; contracts must be confirmed with Maahi, Anand and Ram before real integration (Phase 1 items remain open).
2. **Auth/RBAC is not implemented.** Supervisor approval persists the approver name but there is no identity/role enforcement yet — required before real deployment.
3. Analytics defect-rate and recommendation quality-score depend on Anand's `quality_inspections`; until then they are neutral fallbacks with visible warnings. Anand's quality frontend now exists but stores data **in memory (resets on reload)** — inspection CRUD + machine-job endpoints must be built to replace the demo services.
4. Demo/seed rows (DEVELOPMENT FIXTURES) and earlier manual test rows live in the local PostgreSQL database; a fresh clone must run `alembic upgrade head` (and optionally the seed script).
5. Optional ML (Stage 7 / `dataset/ai4i2020.csv`) remains unapproved and unused by any running code.
6. Frontend carries two module shells (Feature 02 `Layout` and quality `AppShell`) with separate navigation; cross-links added both ways (`/quality` ↔ `/`).

## Rules for updating this document

- Never turn "not audited" into "not implemented" without inspection; never mark planned or AI-generated code as implemented/verified.
- For each status change, record the date, verification command and result in `IMPLEMENTATION_TRACKER.md`.
- Keep private notes, credentials and debugging details out of this file (they belong in the local-only `ai/` folder).
