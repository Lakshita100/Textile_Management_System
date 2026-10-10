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
- [x] **Pending owner approval:** Stage 0 cleanup report acceptance → Phase 1 — granted 2026-10-10; implementation sprint covering Phases 2–5 (and analytics) authorized

## Phase 1 — Confirm contracts and design

- [ ] Confirm actual machine / order / inventory / quality entities with Maahi, Anand, Ram
- [ ] Agree API contract paths, units, status enums and ownership boundaries
- [ ] Agree Feature 02 schema additions (`machine_status_events`, `machine_downtime_events`, `machine_recommendations`)
- [ ] Agree recommendation behavior (weights, fallbacks for missing history, approval roles)
- [ ] Finalize test cases and acceptance criteria

Note: the sprint proceeded using clearly-labeled FIXTURE adapters (`app/adapters/fixtures.py`) for Maahi/Anand/Ram data. Real contract confirmation remains open for Phase 1 / Phase 6 integration.

## Phase 2 — Machine data and backend foundation (2026-10-10)

- [x] Platform foundation (owner: Lakshita): FastAPI `main.py`, CORS (`localhost:5173`), `/api/v1`, health endpoints, global 500 handler, sync DB session refactor (async engine removed after `NoSuchModuleError: sqlalchemy.dialects:postgresql.asyncio`)
- [x] Machine model + schemas (code, name, type, processes, capacity+unit, operational status)
- [x] Alembic initial migration — authorized in sprint; `alembic upgrade head` → `909cc08f3f36` applied on PostgreSQL
- [x] Machine listing / details / status update / status history endpoints with validation (`ALLOWED_STATUS_TRANSITIONS`, maintenance reason)
- [x] Backend tests passing: `python -m pytest -q` → **29 passed**

## Phase 3 — Machine Overview frontend (2026-10-10)

- [x] Frontend scaffold (Vite + React + TS) importing approved `global.css`
- [x] Machine KPI cards, table with search/filter, detail view (Dashboard, Machines, MachineDetail pages)
- [x] Real backend integration (axios client `services/api.ts`; no mocked responses presented as live)
- [x] Loading / empty / error states; theme-compliant components (`components/ui.tsx`)

## Phase 4 — Production tracking (2026-10-10)

- [x] `production_jobs` model, assignment endpoints, status transitions (`PLANNED/IN_PROGRESS/PAUSED/COMPLETED/CANCELLED`, `JOB_TRANSITIONS` validation)
- [x] Planned vs. actual quantity, progress %, downtime recording (`POST/GET /production/downtime`)
- [x] Conflict detection and transactional duplicate-assignment prevention (single active job per machine)
- [x] Delayed-job alerts where deadline data exists (dashboard `delayed_jobs`; deadline optional)
- [x] Validation tests (negative output, over-production `OVERPRODUCTION`, insufficient material, lifecycle conflicts) — included in the 29-test suite

## Phase 5 — Machine recommendation engine (2026-10-10)

- [x] Material availability gate (labeled FIXTURE source pending Maahi contract)
- [x] Eligibility filters (process, capacity, status, schedule overlap, compatibility)
- [x] Normalized scoring (0.40 Efficiency / 0.35 Workload Suitability / 0.25 Quality), ranking, explanations, per-candidate score breakdown
- [x] Missing-data warnings + documented fallbacks (`REC_NEUTRAL_SCORE=50`, never silent perfect; unknown metrics flagged `*`)
- [x] Supervisor approval + transactional revalidation (material/status/schedule) + persisted `machine_recommendations` record
- [x] Critical-case tests: insufficient material (POLYESTER 200 < 900 → rejection), no eligible machine (Dye-01 excluded for incompatible process), missing history (neutral 50), conflict at commit time (`FAILED_REVALIDATION`)

## Phase 6 — Analytics and team integration

- [x] Production / utilization / efficiency / downtime analytics with documented definitions (`/production/analytics`; efficiency = avg completion of completed jobs; utilization = productive vs planned time; defect rate from real quality data only)
- [x] Quality-history integration from Anand's inspections; dependency failure handling (neutral fallback + warnings in place; contract implemented in this repository — see "Feature 02 × Module 03 integration" below)
- [~] Verified end-to-end flow: order → recommendation → production → quality — quality link verified end-to-end against the persisted backend (2026-10-10); order/inventory refs still FIXTURE adapters (Ram/Maahi pending)
- [x] Filters (date range) and empty states (Analytics page; `null` metrics rendered honestly)

## Phase 7 — Optional ML experiment (requires explicit approval)

- [ ] Prediction target, dataset provenance + license, baseline, held-out evaluation, limitations recorded

Note: `dataset/ai4i2020.csv` (UCI AI4I 2020, candidate listed in `DATA_SOURCES_AND_INTEGRATION.md`) is present but **unused and unapproved**.

## Module 03 — Quality frontend (Anand, branch `anand`, merged 2026-10-10)

Source: Anand's single commit `c1d0cca` branched from `d9cd758`; merged into `main` with conflicts resolved (his `ai/` tracker edits kept local-only and ported here; his frontend merged under `/quality` alongside Feature 02's app).

- [x] Quality app shell + module navigation (his `AppShell`, merged into router; other modules labeled placeholders)
- [x] Quality dashboard (KPIs, defect-rate trend, defects-by-type chart, machine × defect matrix)
- [x] All Inspections screen (search/machine/inspector filters, inspector column)
- [x] Inspection form as modal (backdrop/Esc close, auto focus, success banner; machine → active batch/order/roll auto-fill; auto inspected quantity = machine output; outcome derived: 0 defects → Approved)
- [x] Demo employee session (EMP-001..003 switcher) — demo only, no auth
- [x] In-memory services (`qualityService.ts`, `employeeService.ts`) — **superseded: qualityService is now API-backed** (employee session switcher remains demo-only)
- [x] Backend wiring for inspection create + machine job lookup — **completed 2026-10-10** (persistent model + service + `/api/v1/quality` router; see integration section below)
- [x] Theme compliance verified by Anand: hex colors only in `theme.css`; no default Tailwind palette classes

## Feature 02 × Module 03 integration (Lakshita, 2026-10-10)

Persistent quality backend replacing Anand's in-memory demo, frontend API wiring, cross-links, quality-aware analytics/recommendations, and scheduling concurrency fix. No new scaffold; existing files edited in place.

- [x] `quality_inspections` table (additive migration `b7f3d2c1a9e4`, FK RESTRICT, checks on outcome/qty/defects) applied on PostgreSQL; `alembic check` → no drift
- [x] Quality service + API (`/api/v1/quality/*`): eligibility, quantity caps, cross-checks, server-derived batch/roll/outcome, disposition-only updates, dashboard bundle, roll preview, inspectable job, per-job inspection counts — coded errors (`409 *_` / `404`)
- [x] Frontend wired to the API: `qualityService` rewrite (API-backed), `qualityApi` client, InspectionFormModal (async machines + roll preview), AllInspectionsPage (server filters + `?job=` linkage), Jobs page Quality column + focus banner
- [x] Production ↔ quality cross-links: inspection → job detail (`/jobs?job=`), Jobs → `/quality/inspections?job=`, batch cell → job
- [x] Quality-aware analytics: `/production/analytics` defect rate computed from persisted inspections (window by `inspected_at`); `null` + "not fabricated" note when absent
- [x] Quality-aware recommendations: score quality term from DB pass rate (min `REC_MIN_QUALITY_SAMPLES=3` samples); neutral 50 + explicit per-candidate warning otherwise; weights unchanged (0.40/0.35/0.25)
- [x] Scheduling concurrency: per-machine `pg_advisory_xact_lock` (namespace 741202) in `create_job`; approve revalidates under `SELECT FOR UPDATE` + machine lock with `commit=False` (single transaction); documented no-op on SQLite
- [x] Status-change race closed (audit F1): `PATCH /machines/{id}/status` now takes the same per-machine lock before validating/committing, so a status change (e.g. into MAINTENANCE) cannot land between an approval's locked revalidation and its commit; generic `PATCH /machines/{id}` has no status field and stays unlocked (scope unchanged)
- [x] Tests: 20 new backend tests (quality API, quality integration, concurrency guards) → **81 passed**; 7 new frontend tests → **10 passed**; build + lint green (2 pre-existing warnings)
- [x] Live verification against PostgreSQL (uvicorn `:8000`): **37/37 checks** — full job→rec→approval→production→inspection→analytics flow, coded error probes, dashboard stats, per-candidate warnings, 5× parallel double-approve `[200,409]` + 5× parallel double-create `[201,409]` at exactly one success each, direct two-connection `pg_advisory_xact_lock` blocking proof (~1.5 s), script-row-only cleanup

Anand's recorded session evidence (from his tracker, condensed): `npm run build` (`tsc -b && vite build`) passed across 7 sessions; `oxlint` 0 findings; preview server HTTP 200 on `/quality`, `/quality/inspections`, `/quality/inspection`; no reference images in repo for visual comparison; no unit tests written at his side.

## Module 04 — Buyer order and Ram review prototype (2026-10-10)

- [x] Buyer requirements form with profile details, validation, review step, duplicate-submit guard, unique Order ID, and submission confirmation
- [x] Shared browser-local order store feeds buyer order/tracking pages and Ram's incoming/review pages
- [x] Maahi boundary clearly reports integration pending; Ram-entered availability is labelled demo data and linked by Order ID
- [x] Review history/internal notes are separate from buyer-visible updates; approval requires an available demo check and explicit requirements confirmation
- [x] Clarification responses return an order to review; accepted orders are exposed to Lakshita's production-planning boundary with the same Order ID
- [x] Focused workflow tests: `npx vitest run src/services/orderService.test.ts` → **4 passed**
- [x] Browser acceptance pass: buyer submitted, Ram recorded a labelled check/internal note and approved, production boundary showed the same ID, and buyer saw approval without the internal note
- [!] Live order/material APIs, persistence and production authentication remain pending; this is a browser-local prototype, not a deployed Module 04 service

## Phase 8 — Final testing and handoff

- [x] Backend test suite passes (**81 passed**); frontend build + typecheck pass (success); frontend tests **10 passed**; oxlint 0 errors (2 pre-existing warnings)
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
| 2026-10-10 | Phase 2 | `alembic upgrade head` | `909cc08f3f36 (head)` applied; 6 Feature 02 tables created |
| 2026-10-10 | Phase 2 | `Invoke-RestMethod /api/v1/health` + `/health/db` | `ok`; `{"database":"postgresql","connected":true}` |
| 2026-10-10 | Phase 2 | `python -m pytest -q` (backend) | **29 passed** in 1.4s |
| 2026-10-10 | Phase 3–5 | `python scripts/seed_demo.py` | 6 machines, 2 active jobs, 1 downtime event (DEVELOPMENT FIXTURES) |
| 2026-10-10 | Phase 4 | live job lifecycle e2e (create/start/progress) | 40/100 → 40% persisted; overproduction + insufficient-material rejections returned coded errors |
| 2026-10-10 | Phase 5 | live recommendation e2e | Dye-01 excluded (incompatible process); top score 67.5 with `*` unknown flags; approval → `FAILED_REVALIDATION` on busy machine, `APPROVED` + job on free machine |
| 2026-10-10 | Phase 5 | live recommendation e2e (fresh) | `recommended=Loom-01 score=67.5` |
| 2026-10-10 | Phase 6 | `GET /production/analytics` | 9 rows; `efficiency/utilization/defect` null where no data |
| 2026-10-10 | Phase 3 | `npm test` (frontend) | **3 passed** (vitest/jsdom) |
| 2026-10-10 | Phase 3 | `npm run build` | tsc + vite build **success** (642 kB js / 11.8 kB css) |
| 2026-10-10 | Phase 3 | dev server HTTP check | `http://localhost:5173` → HTTP 200 with `#root` |
| 2026-10-10 | Phase 3 | live dashboard e2e | `{"total_machines":9,"running":3,"idle":5,"maintenance":1,"active_jobs":2,...}` |
| 2026-10-10 | Merge `origin/anand` | `git merge origin/anand` (from `d9cd758` base) | 11 conflicts: 2× `ai/` (delete/modify), 8× `frontend/` add/add, 1× `idea.docx` file-location |
| 2026-10-10 | Merge `origin/anand` | conflict resolution | `ai/` paths removed from index (stay local-only; local copies restored from backup; his `idea.docx` moved to `ai/`); frontend infrastructure kept from `main`; his quality module kept under `/quality` routes; `docs/` trackers updated with his session evidence |
| 2026-10-10 | Merge `origin/anand` | `npm install && npm run build` (frontend) | success — 2277 modules (his quality pages typecheck under React 18 / TS 5.7 stack) |
| 2026-10-10 | Merge `origin/anand` | `npm test` / `npm run lint` | 3 tests passed; oxlint runs, 2 pre-existing warnings in Feature 02 pages (non-blocking) |
| 2026-10-10 | ML Phase A | `python scripts/validate_scheduling_dataset.py` | `ok: true` — 10 000 history / 10 000 orders / 57 349 candidates / 28 machines / 15 120 calendar rows; 0 missing, 0 duplicate ids, timestamps ordered, all selections on eligible candidates; dataset left **uncommitted** (untracked) |
| 2026-10-10 | ML Phase B | `python scripts/train_duration_model.py` | `duration-v1` trained (seed 42, time-aware 80/20 split): held-out **MAE 18.42 min, RMSE 29.72, R² 0.976** vs throughput baseline MAE 38.08 (R² 0.885) and efficiency-adjusted baseline MAE 17.65 (R² 0.977) — **baseline marginally wins on this synthetic corpus; recorded honestly**; artifacts in git-ignored `backend/mlartifacts/` |
| 2026-10-10 | ML Phase C | `python scripts/train_allocation_ranker.py` | `allocation_rank-v1` held-out (2 000 test orders): **top-1 agreement 0.84** vs fastest-estimate 0.60, feature-02-rule 0.56, highest-efficiency 0.42 |
| 2026-10-10 | ML Phase D/E | live `POST /scheduling/estimate-duration` | `200 {"minutes":94.06,"source":"ml","model_version":"duration-v1"}` with honest defaulting warnings; missing model → `503 MODEL_UNAVAILABLE`; unknown machine → `404 MACHINE_NOT_FOUND`; qty≤0 → `422` |
| 2026-10-10 | ML Phase D/E | live `GET /scheduling/machines/{id}/timeline` | `200`; unscheduled fixture job #2 shown as committed now→horizon + warning (timeline now consistent with conflict detection) |
| 2026-10-10 | ML Phase D/E | live rec + approval e2e | rec carries per-candidate `schedule` + `ml_selection_probability=0.4354` + synthetic-data note + `Schedule:` explanation; approval of blocked machine → `409 SCHEDULE_CONFLICT` → `FAILED_REVALIDATION`; after clearing blocker → `200`, job #5 planned window **defaulted from schedule** (14:22→09:49 next day), visible on timeline |
| 2026-10-10 | ML Phase F/G | `npm test` / `npm run build` (frontend) | 3 passed; build success — Recommend shows schedule columns/detail + experimental ML P(select); MachineDetail shows 14-day timeline; Jobs shows planned window |
| 2026-10-10 | ML Phase H | `python -m pytest -q` (backend) | **61 passed** (29 baseline + 32 new: schema/leakage, duration, scheduling, API, recommendation integration, allocation ML) |
| 2026-10-10 | ML sprint | `git log --oneline -3` | HEAD unchanged at `0b1851f` = `origin/main` — **no commit, no push** (per instruction) |
| 2026-10-10 | 02×03 integration | `alembic upgrade head` + `alembic check` | `b7f3d2c1a9e4 (head)` applied (quality_inspections); `alembic check` → no drift |
| 2026-10-10 | 02×03 integration | `python -m pytest -q` (backend) | **81 passed** (61 prior + 20 quality/concurrency) |
| 2026-10-10 | 02×03 integration | `npm test` / `npm run build` / `npm run lint` (frontend) | 10 passed; tsc+vite build success; oxlint 0 errors (2 pre-existing warnings) |
| 2026-10-10 | 02×03 integration | live e2e `verify_integration.py` (uvicorn `:8000`, PostgreSQL) | **37/37 checks** — job→rec→approval→production→inspection→analytics; neutral-50 + per-candidate warning; coded 409/404 probes; dashboard stats from DB; script-row cleanup only |
| 2026-10-10 | 02×03 concurrency | parallel double-approve / double-create (ThreadPoolExecutor vs live server) | 5× `[200,409]` + 5× `[201,409]`, exactly one success and one job each round |
| 2026-10-10 | 02×03 concurrency | direct psycopg2 two-connection `pg_advisory_xact_lock(741202, 4242)` | worker 2 blocked ~1.5 s (`LockNotAvailable` under `lock_timeout`), acquired after worker 1 rollback — DB-level serialization proven |
| 2026-10-10 | 02×03 integration | dataset integrity | `dataset/textile_production_scheduling_dataset/` untouched, still untracked; `git status` shows nothing staged |
| 2026-10-10 | 02×03 concurrency | status-change lock fix (audit F1) + `test_status_change_takes_machine_lock` | status PATCH acquires machine advisory lock before transition validation/commit; non-status PATCH does not lock; suite green after fix |

| 2026-10-10 | Quality: Proceed button + Packing/Dispatch (frontend) | feature note | Inspection modal submit button renamed Save inspection -> Proceed; on success accepted metres queued to packing via `queueFromInspection` (new `services/packingService.ts`); success banner links to /quality/packing |
| 2026-10-10 | Quality: Packing page | new files | `pages/packing/PackingPage.tsx` + `types/packing.ts` + `services/packingService.ts` (in-memory demo lots PK-001..014): 4 KPIs (lots, metres, pending, dispatched), status filter chips, packed-lots table; metres-by-pack-type chart added then REMOVED on user request |
| 2026-10-10 | Quality: Dispatch page | new files | `pages/dispatch/DispatchPage.tsx` + `types/dispatch.ts` + `services/dispatchService.ts` (18 demo shipments, India + export): 4 KPIs; analytics tabs Country-wise / State-wise / City-wise (bar chart + summary table: shipments/rolls/metres/delivered/in-transit); shipments table with status filter (Booked/In transit/Delivered/Delayed) |
| 2026-10-10 | Quality: conflict-safe wiring | App.tsx + AppShell.tsx | all new logic in new files; shared files touched additively only: 2 route lines (`packing`, `dispatch` under /quality) + 2 qualityNav entries; "Warehouse & Dispatch" placeholder removed from sidebar |
| 2026-10-10 | Quality: packing/dispatch | `npm run build` | success -- 2282 modules, 713 kB js / 16.8 kB css (chunk-size warning only) |
| 2026-10-10 | Quality: packing/dispatch | `npm run lint` | oxlint clean on all new files; 2 pre-existing warnings remain in Feature 02 pages (Jobs.tsx, Analytics.tsx) - untouched to avoid merge conflicts |
| 2026-10-10 | Quality: packing/dispatch | preview HTTP check | `/quality/packing` and `/quality/dispatch` -> HTTP 200 (vite preview :4180) |

| 2026-10-10 | Module 04 demo | `npx vitest run src/services/orderService.test.ts` | **4 passed** — ID, material state, approval gate, private notes and clarification response |
| 2026-10-10 | Module 04 demo | `npm run build` (frontend) | TypeScript + Vite **success** |
| 2026-10-10 | Module 04 demo | Browser end-to-end workflow | Buyer submit → Ram review/demo material check/note/approve → production boundary; buyer status visible and internal note not exposed |
