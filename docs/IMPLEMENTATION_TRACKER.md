# Implementation Tracker — Feature 02 (shared)

Update this file in the same change set as code. Use dates and recorded command results, not impressions.

**Status key:** `[ ]` Not started / not verified · `[~]` In progress · `[x]` Verified complete (with evidence) · `[!]` Blocked

## Stage 0 — Repository audit and documentation (2026-10-10)

- [x] Inspected repository tree, Git branch and status (`main`, `d9cd758`, clean before changes)
- [x] Identified stack: FastAPI/SQLAlchemy/Alembic planned (only `config.py` + `database.py` exist); frontend not scaffolded; PostgreSQL 17.9 running with empty `textile_manufacturing` DB
- [x] Ran baselines: `pytest --collect-only` → 0 tests; `import app.main` → ModuleNotFoundError
- [x] Documented architecture, plan, prerequisites, data sources, API contracts in `docs/`
- [x] Placed approved theme CSS under `frontend/src/styles/` (version-controlled)
- [x] Configured `/ai/` git exclusion in root `.gitignore`; verified with `git check-ignore`
- [x] Untracked the 9 previously committed `ai/` paths via `git rm --cached -r ai/` (authorized 2026-10-10; local copies preserved; `git ls-files ai/` empty). Removal committed together with this documentation set
- [x] Platform foundation ownership confirmed: **Lakshita** (build authorized in Phase 2)
- [ ] **Pending owner approval:** Stage 0 cleanup report acceptance → Phase 1

## Phase 1 — Confirm contracts and design

- [ ] Confirm actual machine / order / inventory / quality entities with Maahi, Anand, Ram
- [ ] Agree API contract paths, units, status enums and ownership boundaries
- [ ] Agree Feature 02 schema additions (`machine_status_events`, `machine_downtime_events`, `machine_recommendations`)
- [ ] Agree recommendation behavior (weights, fallbacks for missing history, approval roles)
- [ ] Finalize test cases and acceptance criteria

## Phase 2 — Machine data and backend foundation

- [ ] Platform foundation (owner: Lakshita): FastAPI `main.py`, CORS, `/api/v1`, health endpoints, sync DB session refactor (diagnose async failure first)
- [ ] Machine model + schemas (code, name, type, processes, capacity+unit, operational status)
- [ ] Alembic initial migration — only after explicit approval
- [ ] Machine listing / details / status update / status history endpoints with validation
- [ ] Backend tests passing (record commands)

## Phase 3 — Machine Overview frontend

- [ ] Frontend scaffold (Vite + React + TS) importing approved `global.css`
- [ ] Machine KPI cards, table with search/filter, detail view
- [ ] Real backend integration (no mocked responses presented as live)
- [ ] Loading / empty / error states; responsive check

## Phase 4 — Production tracking

- [ ] `production_jobs` model, assignment endpoints, status transitions
- [ ] Planned vs. actual quantity, progress %, downtime recording
- [ ] Conflict detection and transactional duplicate-assignment prevention
- [ ] Delayed-job alerts where deadline data exists
- [ ] Validation tests (negative output, over-production, overlapping schedules)

## Phase 5 — Machine recommendation engine

- [ ] Material availability gate (Maahi contract or approved interim source)
- [ ] Eligibility filters (process, capacity, status, schedule overlap)
- [ ] Normalized scoring (0.40 Efficiency / 0.35 Workload Suitability / 0.25 Quality), ranking, explanations
- [ ] Missing-data warnings + documented fallbacks (never silent perfect scores)
- [ ] Supervisor approval + transactional revalidation + persisted recommendation record
- [ ] Critical-case tests: insufficient material, no eligible machine, missing history, conflict at commit time

## Phase 6 — Analytics and team integration

- [ ] Production / utilization / efficiency / downtime analytics with documented definitions
- [ ] Quality-history integration from Anand's inspections; dependency failure handling
- [ ] Verified end-to-end flow: order → recommendation → production → (quality link)
- [ ] Filters (date range, machine, process) and empty states

## Phase 7 — Optional ML experiment (requires explicit approval)

- [ ] Prediction target, dataset provenance + license, baseline, held-out evaluation, limitations recorded

## Phase 8 — Final testing and handoff

- [ ] Backend test suite passes; frontend build + typecheck pass
- [ ] Theme compliance scan (no unapproved hex/colors); permissions verified
- [ ] Reproducible demo scenario; limitations documented; final status matrix updated

## Evidence log

| Date | Stage/Phase | Command / check | Result |
|---|---|---|---|
| 2026-10-10 | Stage 0 | `git log --oneline` | `d9cd758` single commit, branch `main` |
| 2026-10-10 | Stage 0 | `python -m pytest --collect-only -q` (in `backend/`) | no tests collected in 0.01s |
| 2026-10-10 | Stage 0 | `python -c "import app.main"` | `ModuleNotFoundError: No module named 'app.main'` |
| 2026-10-10 | Stage 0 | psql `\dt` in `textile_manufacturing` | 0 tables |
| 2026-10-10 | Stage 0 | `git check-ignore -v ai/NEW_PRIVATE_FILE.md` | matched `.gitignore:83:/ai/` |
| 2026-10-10 | Stage 0 | `git ls-files ai/` | 9 files still tracked → untracking pending owner approval |
| 2026-10-10 | Stage 0 cleanup | `git rm --cached -r ai/` (authorized) | 9 paths removed from index; local files preserved; `git ls-files ai/` empty |
| 2026-10-10 | Stage 0 cleanup | `git check-ignore -v ai/MASTER_PROMPT.md` | matched `.gitignore:83:/ai/` |
| 2026-10-10 | Stage 0 cleanup | `git diff --cached --stat` | 9 files, 496 deletions (index only; no unrelated changes) |
