# Textile Manufacturing Intelligence System

A centralized web application for textile factories that connects raw material and supplier management, production and machine allocation, quality management, machine efficiency analytics, order management, warehouse and dispatch, and employee and accounts management.

## Features (target scope)

- Smart Raw Material and Supplier Management
- Production and Machine Allocation with a transparent, rule-based machine recommendation service
- Quality Management and Machine Efficiency Analytics
- Order Management
- Warehouse, Dispatch and Logistics
- Employee, Attendance and Accounts Management
- End-to-end workflow: raw material → order → machine recommendation → production → quality inspection → finished stock → dispatch → costing and reporting

## Technology Stack

**Frontend**
- React with Vite and TypeScript
- Tailwind CSS
- React Router
- Axios for API calls
- Recharts for dashboards and analytics
- Lucide React for icons

**Backend**
- Python with FastAPI
- Pydantic for request and response validation
- SQLAlchemy 2.x ORM
- Alembic for database migrations
- Uvicorn for the development server

**Database**
- PostgreSQL 14+ (relational schema with primary keys, foreign keys, constraints and transactions)

## Current Status

**Feature 02 (Production & Machine Tracking) is implemented and verified** — platform foundation, backend API, PostgreSQL migrations, React frontend, and tests:

| Area | Status |
|---|---|
| Repository structure (`backend/`, `frontend/`, `docs/`) | Created |
| Backend configuration (`app/config.py`, `app/database.py`, `.env.example`) | Created |
| FastAPI app (`/api/v1`, health, CORS, error handling) | Implemented and verified |
| Database models & Alembic migrations (6 Feature 02 tables) | Implemented and verified (`909cc08f3f36`) |
| Machine / production / recommendation / analytics services & routers | Implemented and verified |
| React application (Dashboard, Machines, Jobs, Recommendations, Analytics) | Implemented and verified |
| Seed data (labeled fixtures), tests | 29 backend tests + 3 frontend tests passing |
| Modules 01/03/04 (Maahi/Anand/Ram), Auth/RBAC | Not implemented — labeled FIXTURE adapters in use |

The approved global theme and design tokens are version-controlled at [`frontend/src/styles/theme.css`](frontend/src/styles/theme.css) and [`frontend/src/styles/global.css`](frontend/src/styles/global.css); never invent a new brand palette.

## Team module ownership

| Module | Owner |
|---|---|
| 01 — Raw Material and Supplier Management | Maahi |
| 02 — Production & Machine Tracking (machine recommendation, analytics) | Lakshita |
| 03 — Quality Management | Anand |
| 04 — Order Management | Ram |
| 05 — Warehouse, Dispatch and Logistics | TBD |
| 06 — Employee, Attendance and Accounts | TBD |

Lakshita also owns the **platform foundation** required for Feature 02 (FastAPI app shell, database session/migration tooling, health endpoints, and the frontend application shell where missing) — scoped to what Feature 02 needs, confirmed 2026-10-10.

## Repository Structure

```
textile-manufacturing/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers (health, machines, production, recommendations)
│   │   ├── models/         # SQLAlchemy models (machines, jobs, events, recommendations)
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── crud/           # CRUD operations
│   │   ├── services/       # Business logic incl. machine recommendation (rule-based)
│   │   ├── adapters/       # Labeled FIXTURE adapters for other team modules
│   │   ├── utils/          # QR and CSV/XLSX export utilities (planned)
│   │   ├── tests/          # Backend tests (29 passing)
│   │   ├── config.py       # Settings via pydantic-settings
│   │   ├── database.py     # Sync engine and session factory
│   │   └── main.py         # FastAPI app entry point
│   ├── alembic/            # Database migrations (initial Feature 02 migration)
│   ├── scripts/            # Seed and utility scripts (seed_demo.py)
│   ├── .env.example
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/                # Pages, components, services, types, styles
│   └── public/
├── dataset/                # Candidate public dataset for optional ML phase (unused)
├── ai/                     # Private AI working folder — local-only, git-ignored
└── docs/                   # Architecture, plan, status, tracker, contracts
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- npm

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows (Linux/macOS: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env       # Windows (Linux/macOS: cp .env.example .env)
# Edit .env with your database credentials
```

### 2. Database

Create a PostgreSQL database and configure `DATABASE_URL` in `backend/.env`:

```sql
CREATE DATABASE textile_manufacturing;
```

Apply migrations:

```bash
cd backend
alembic upgrade head
# optional demo data (labeled DEVELOPMENT FIXTURES):
python scripts/seed_demo.py
```

### 3. Run the Applications

**Backend** (API docs at `http://localhost:8000/docs`):

```bash
cd backend
uvicorn app.main:app --reload
```

**Frontend**:

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

## Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture, module boundaries, data ownership, Feature 02 scope, design system
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — Feature 02 stage roadmap with acceptance criteria
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — evidence-based implementation status (source of truth)
- [`docs/IMPLEMENTATION_TRACKER.md`](docs/IMPLEMENTATION_TRACKER.md) — phase checklist and verification evidence log
- [`docs/PREREQUISITES_AND_SETUP.md`](docs/PREREQUISITES_AND_SETUP.md) — toolchain, environment and test commands
- [`docs/DATA_SOURCES_AND_INTEGRATION.md`](docs/DATA_SOURCES_AND_INTEGRATION.md) — data owners, dependency contracts, dataset/ML policy
- [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) — API conventions and proposed Feature 02 endpoints
- Swagger/OpenAPI UI at `http://localhost:8000/docs` once the backend is running

## Environment Variables

Only `.env.example` files are committed. Copy them to `.env` (backend) or `.env.local` (frontend) and fill in real values. Real secrets are never committed.

- `backend/.env.example` — `DATABASE_URL`, CORS origins, debug flag, recommendation weights
- `frontend/.env.example` — API base URL only (e.g. `VITE_API_BASE_URL=http://localhost:8000/api/v1`). Database credentials are never exposed to the frontend.

## Security Notes

- Keep secrets in environment variables; `.env` files are gitignored.
- Inputs are validated on the backend (Pydantic).
- Authentication, role-based access control, audit logs and backups are required before real deployment; they are not implemented yet (supervisor approval currently records the approver's name only).

## License

Proprietary
