# Implementation Plan — Feature 02: Production & Machine Tracking (ML)

**Owner:** Lakshita. **Status source of truth:** `PROJECT_STATUS.md` + `IMPLEMENTATION_TRACKER.md`.
**Rule:** every stage ends with a report and stops for explicit owner approval. No stage starts before the previous one is approved.

## Feature 02 functional scope

1. **Machine Overview Dashboard** — machine counts by status (Running / Idle / Maintenance), overview cards, searchable/filterable machine list (code, name, type, supported processes, capacity + unit, operational status, current assignment, efficiency where data exists), machine detail view, validated status updates, status history (timestamp + reason). Running does not automatically mean available for a new assignment; operational status and assignment availability are modelled separately.
2. **Current Machine Assignments** — each machine's current production job with linked order, fabric/process requirements, planned vs. produced quantity, planned/actual start/end, shift where supported, job status and downtime; assignment history; conflict detection for overlapping schedules; validated assign/pause/resume/complete transitions with backend transactional checks preventing duplicate or conflicting assignments.
3. **Production Quantity & Progress Tracking** — planned vs. actual output, completion %, start/pause/resume/complete actions, planned vs. actual completion, downtime duration + reasons, production history, persisted validated updates (no negative output; output may not exceed allowed job quantity unless manufacturing requirements explicitly permit overproduction), alerts for delayed jobs where deadline data exists. Manual updates only for the MVP — no fake real-time updates.
4. **Machine Recommendation Engine (core intelligence)** — for a selected Ram-owned order: real specs + deadline; Maahi's material availability; filter by process/fabric; filter out unavailable/maintenance/incompatible/over-capacity/already-committed machines; estimate production time; compute normalized 0–100 Efficiency (0.40), Workload Suitability (0.35), Quality Score (0.25) — initial demonstration weights, not validated factory parameters; rank; display recommendation + alternatives with data-grounded explanations; authorized supervisor approval; transactional revalidation of material, status and schedule before persisting assignment + recommendation decision. Missing quality/efficiency history is flagged with a documented fallback — never silently perfect. Failure cases return clear reasons and never force an assignment. Explainable rule-based algorithm; not claimed as trained ML.
5. **Machine Performance & Quality-History Analytics** — machine-wise output, completion/efficiency indicators, utilization (with explicitly defined treatment of breaks/maintenance/unscheduled time), downtime duration + reasons, historical trends, defect-rate indicators from Anand's actual linked inspections, date-range/machine/process filters, honest empty states. Efficiency, utilization and defect rate are distinct metrics.

## Dependencies on other team modules

| Dependency | Owner | Needed for | Current contract status |
|---|---|---|---|
| Order specs, deadlines (`orders`) | Ram (Module 04) | Recommendation input, delay alerts | **Not available** — no API/schema in this repository |
| Material availability (`raw_materials`/stock) | Maahi (Module 01) | Hard eligibility gate | **Not available** — no API/schema in this repository |
| Quality inspection history (`quality_inspections`) | Anand (Module 03) | Machine quality score | **Not available** — no API/schema in this repository |
| Shared platform foundation (FastAPI app shell, DB session, migration tooling) | **Lakshita** (confirmed 2026-10-10) | All backend work | **Missing** — ownership confirmed; build authorized in Phase 2 |

If a dependency contract is missing at integration time, it must be documented, and any temporary mock interface requires owner approval with clear labelling — never presented as live integration.

## Stage/phase roadmap

| Stage | Objective | Exit criteria (must be evidenced) | Gate |
|---|---|---|---|
| **0** | Repository audit and documentation only | Audit complete; private `ai/` tracking + shared `docs/` prepared; `/ai/` git exclusion configured and verified; Stage 0 report delivered | Stop — wait for approval |
| **1** | Confirm contracts and design | Actual machine/order/inventory/quality entities confirmed; API contracts, units, statuses, ownership agreed; schema changes and recommendation behavior agreed; test cases + acceptance criteria finalized | Stop — wait for approval |
| **2** | Machine data and backend foundation | Machine models/schemas implemented; migrations added **only after approval**; machine listing, details, status + status history endpoints; validation + passing backend tests | Stop — wait for approval |
| **3** | Machine Overview frontend | KPI cards, table, filters, details connected to the real backend; approved theme; responsive + loading/empty/error states verified | Stop — wait for approval |
| **4** | Production tracking | Jobs/assignments with planned/actual output, progress, times, downtime; status transitions + conflict validation; tests; real persisted changes | Stop — wait for approval |
| **5** | Machine recommendation engine | Material + eligibility gates; normalized scoring, ranking, explanations; missing-data handling; supervisor approval + transactional revalidation; all critical cases tested | Stop — wait for approval |
| **6** | Analytics and team integration | Production/utilization/efficiency/downtime analytics; verified integration with Maahi Inventory, Ram Orders, Anand Quality; dependency failure handling; end-to-end order-to-production workflow verified | Stop — wait for approval |
| **7** | Optional ML experiment (only if approved) | One prediction target; verified dataset provenance/license; baseline; train/evaluate; limitations + reproducibility recorded; experimental status maintained | Stop — wait for approval |
| **8** | Final testing and handoff | Backend tests, frontend build, integration checks; theme compliance, permissions, critical rules verified; reproducible demo scenario; remaining limitations documented | Final report |

## Acceptance criteria (Feature 02 overall)

- Both frontend and backend start; PostgreSQL connectivity verified; migrations apply via Alembic; health endpoints and OpenAPI docs work.
- Every Feature 02 module works end-to-end against the real API/database (no mocked data presented as live).
- Machine status updates, assignment conflict prevention and production quantity validations enforced server-side with transactions.
- Recommendation returns ranked, explained, data-grounded results; failure cases (insufficient material, no eligible machine, missing history) handled explicitly; supervisor decision persisted.
- Analytics definitions documented and computed from actual linked records; empty states where history is absent.
- Frontend uses only the approved theme tokens; loading/empty/error/success states everywhere; no non-functional buttons.
- Backend tests pass; frontend typecheck/build pass; evidence recorded in `IMPLEMENTATION_TRACKER.md`.
- Secrets remain environment-only; `ai/` remains local-only.

## Working rules (summary — full rules live in the private AI workflow)

Inspect before editing; never invent status; smallest coherent change per task; run relevant tests and record real results; no automatic commits/pushes; update trackers in the same change set as code; label all demo/seed data; never claim trained-ML accuracy for the rule-based recommender.
