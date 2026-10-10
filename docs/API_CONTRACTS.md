# API Contracts (shared)

**Convention:** base prefix `/api/v1`, plural resource names, standard HTTP methods, Pydantic-validated payloads, consistent error shape, pagination on list endpoints, CORS for the local frontend, OpenAPI served by FastAPI.

**Current state (2026-10-10):** no API is implemented in this repository (no FastAPI `main.py`, no routers). Everything below is a **proposed contract for Feature 02**, to be confirmed in Phase 1 together with the team's shared conventions. Paths are proposals, not guarantees.

## Status of cross-module contracts

| Module | Owner | Contract status |
|---|---|---|
| Module 01 — Raw materials / inventory | Maahi | Not published |
| Module 03 — Quality inspections | Anand | Not published |
| Module 04 — Orders | Ram | Not published |

Integration points Feature 02 will need (see `DATA_SOURCES_AND_INTEGRATION.md`): order specs + deadline; material availability; machine-linked quality history. Until owners publish contracts, these remain open items — any interim mock requires explicit approval and clear labelling.

## Proposed Feature 02 endpoints

All responses follow a consistent error shape, e.g.:

```json
{ "detail": "Human-readable message", "code": "MACHINE_BUSY" }
```

List endpoints accept `page`, `page_size` and return `{ "items": [...], "total": n, "page": p, "page_size": s }`.

### Machines

| Method & path | Purpose | Notes |
|---|---|---|
| `GET /api/v1/machines` | List machines | Filters: `status`, `type`, `process`, `search` (code/name), pagination |
| `POST /api/v1/machines` | Create machine | Code uniqueness enforced |
| `GET /api/v1/machines/{id}` | Machine detail | Includes current assignment summary, efficiency indicator if data exists |
| `PATCH /api/v1/machines/{id}` | Update master data / status | Status change validated; requires `reason` for Maintenance |
| `GET /api/v1/machines/{id}/status-events` | Status history | Timestamp + reason + actor |

Machine status enum (proposed): `running` | `idle` | `maintenance`. Operational status ≠ assignment availability (a running machine may be committed).

### Production jobs & assignments

| Method & path | Purpose | Notes |
|---|---|---|
| `GET /api/v1/production/jobs` | List jobs | Filters: `machine_id`, `order_id`, `status` |
| `POST /api/v1/production/jobs` | Assign job to machine | Server-side conflict check (overlapping schedule), material gate, capacity check; transactional |
| `GET /api/v1/production/jobs/{id}` | Job detail | Planned/actual qty, times, downtime, progress % |
| `POST /api/v1/production/jobs/{id}/start` | Start / resume | Validated state transition |
| `POST /api/v1/production/jobs/{id}/pause` | Pause with reason | Records downtime start |
| `POST /api/v1/production/jobs/{id}/complete` | Complete | Validates actual ≤ allowed quantity (overproduction only if explicitly permitted) |
| `PATCH /api/v1/production/jobs/{id}/progress` | Manual quantity update | Rejects negative output; no fake real-time streams |
| `GET /api/v1/production/jobs/{id}/history` | Job event history | Audit trail of transitions |

### Downtime

| Method & path | Purpose |
|---|---|
| `POST /api/v1/production/downtime` | Record downtime event (machine/job, reason, start/end) |
| `GET /api/v1/production/downtime` | List with filters (machine, date range) |

### Dashboard & analytics

| Method & path | Purpose |
|---|---|
| `GET /api/v1/production/dashboard` | KPIs: machine counts by status, active jobs, output today, delayed-job alerts |
| `GET /api/v1/production/analytics` | Filters: `date_from`, `date_to`, `machine_id`, `process`. Machine-wise output, completion, efficiency, utilization (definition documented), downtime totals/reasons, defect rate (from Anand's linked inspections; empty/unknown when history absent) |

### Recommendations

| Method & path | Purpose | Notes |
|---|---|---|
| `POST /api/v1/recommendations/machines` | Generate recommendation for an order | Body: `order_id`, optional time window. Returns candidates with scores + exclusions, recommended machine, explanation, estimated completion, missing-data warnings, or a clear failure (`MATERIAL_INSUFFICIENT` / `NO_ELIGIBLE_MACHINE`) |
| `GET /api/v1/recommendations/{id}` | Retrieve stored recommendation | Includes inputs, score components, `algorithm_version`, timestamp |
| `POST /api/v1/recommendations/{id}/approve` | Supervisor approval | Revalidates material, machine status and schedule transactionally; persists assignment + decision; role check required |

### Shared platform (prerequisite; owner: Lakshita)

| Method & path | Purpose |
|---|---|
| `GET /api/v1/health` | Liveness |
| `GET /api/v1/health/db` | Database connectivity |

## Validation and business rules enforced server-side

- No negative quantities; actual output cannot exceed allowed job quantity unless explicitly permitted.
- No overlapping assignments for the same machine (transactional check at assignment and at recommendation approval).
- Status transitions follow the agreed lifecycle; invalid transitions return `409`/`422` with a clear detail.
- Material availability is a hard gate for scheduling; insufficient material → explicit failure, never a forced assignment.
- All recommendation decisions persisted with algorithm version and actor.

## Authentication / permissions

Not implemented yet. The recommendation approval endpoint requires a supervisor role once auth exists; until then this contract is marked as requiring the role foundation before production use.

## Versioning

This document describes `v1`. Breaking changes require a new version segment and team agreement.
