# Architecture and Module Boundaries

## Architecture principle
Use one frontend, one modular backend API and one PostgreSQL database for the MVP. Keep modules separated in code but share API conventions and relational data. This is a target architecture; adapt it to the actual repository after inspection.

## Logical flow
Browser UI → API client → FastAPI REST API → service/business rules → SQLAlchemy → PostgreSQL

## Frontend responsibilities
- `pages/`: route-level screens.
- `components/`: reusable visual and module-specific UI.
- `services/`: API client and endpoint functions; no business-critical calculations here.
- `types/`: shared TypeScript request/response types.
- `hooks/`: reusable stateful UI behavior.
- `styles/`: approved theme tokens and global styles.

## Backend responsibilities
- `api/endpoints/`: HTTP routing and request/response mapping.
- `schemas/`: request/response validation.
- `models/`: database entities and relationships.
- `crud/` or repositories: database access patterns.
- `services/`: business rules and orchestration.
- `db/`: engine, session, base metadata and migration support.
- `core/`: configuration, security and shared application concerns.
- `tests/`: unit and API/integration tests.

## Main entities
`users`, `suppliers`, `raw_materials`, `purchases`, `machines`, `orders`, `production_jobs`, `quality_inspections`, `finished_rolls`, `shipments`, `employees`, `attendance`, `expenses`, `payments`.

## Critical business rules
1. Check material availability before confirming production scheduling.
2. Filter machine candidates by process compatibility, capacity and availability before scoring.
3. Example score: `0.40 × Efficiency + 0.35 × Workload Suitability + 0.25 × Quality Score`. These weights are illustrative, not validated factory parameters.
4. Explain why a machine was recommended. If no candidate qualifies, return a reason rather than forcing assignment.
5. Track inspection outcomes as approved, rework or rejected and associate inspection with the relevant roll/order/machine.
6. Use a unique finished-roll identifier and traceable warehouse location.
7. Use shipment statuses such as Packed, Dispatched, In Transit, Out for Delivery and Delivered. Do not claim live tracking without a real provider integration.
8. Prevent negative stock and duplicate dispatch/attendance events using constraints and transactions.
9. Clearly label synthetic demo data and never claim it demonstrates real-world ML performance.
10. Costing is an MVP estimate unless full accounting rules have been implemented and reviewed.

## API conventions
- Prefer a consistent prefix such as `/api/v1`.
- Use plural resource names and standard HTTP methods.
- Validate payloads and return useful error messages.
- Keep CORS origins configurable.
- Document endpoints and schemas.
- Do not expose credentials or internal stack traces in user-facing errors.

## Suggested status lifecycle
Orders: Pending → Scheduled → In Production → Quality Check → Ready to Dispatch → Dispatched.

Shipments: Packed → Dispatched → In Transit → Out for Delivery → Delivered.

## Scope boundaries for the MVP
Defer live logistics provider APIs, AI camera defect detection, physical IoT, and a trained ML recommender unless data, credentials, time and verification are available.
