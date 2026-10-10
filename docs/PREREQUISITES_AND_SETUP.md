# Prerequisites and Setup (shared)

Verified on the development machine during the 2026-10-10 audit. Commands are reproducible; results recorded in `IMPLEMENTATION_TRACKER.md`.

## Verified toolchain (development machine)

| Tool | Version | Notes |
|---|---|---|
| Python | 3.13.5 | Project requires ≥3.10 |
| pip | available | Packages installed **globally** (decision recorded privately; a venv remains optional) |
| Node.js | v22.17.0 | Project requires ≥18 |
| npm | 11.16.0 | Registry reachable (verified via `npm ping`) |
| Git | 2.50.1.windows.1 | Repository initialized on `main` |
| PostgreSQL | 17.9 server | Running on `localhost:5432`; service `postgresql-17` |
| psql | `C:\Program Files\PostgreSQL\17\bin\psql.exe` | Not on PATH by default |
| uvicorn / alembic | installed (global Scripts) | Not yet used — no app/migrations exist |

Python packages pinned in `backend/requirements.txt` are installed globally, except:

- `qrcode` — **missing** (required later for QR utilities; install with `pip install qrcode==7.4.2`)
- `factory_boy` — missing and **not required** (tests use plain pytest fixtures; listed in requirements but droppable — decision pending in private log)

## Database

- Database `textile_manufacturing` exists (UTF8, owner `postgres`), **0 tables**.
- Connection used for verification: `postgresql+psycopg2://postgres:postgres@localhost:5432/textile_manufacturing` (placeholder credentials in `backend/.env.example` — real deployments must rotate these).
- To recreate: `psql -U postgres -c "CREATE DATABASE textile_manufacturing;"`

## Environment variables

- Commit **only** `.env.example` files. Real `.env` files are git-ignored (root `.gitignore`: `.env`, `.env.*`, with `!.env.example`).
- `backend/.env.example` defines: `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALGORITHM`, `APP_NAME`, `API_PREFIX`, `DEBUG`, `BACKEND_CORS_ORIGINS`, `ENVIRONMENT`.
- Frontend will use only an API base URL (e.g. `VITE_API_BASE_URL=http://localhost:8000/api/v1`). Database credentials are never exposed to the frontend.
- JWT/`SECRET_KEY` values are **placeholders** — authentication is not implemented; real deployment requires tested auth, RBAC, audit logs and backups.

## Planned setup commands (not yet executable — app shell missing)

```bash
# Backend (once app/main.py and Alembic exist)
cd backend
pip install -r requirements.txt
cp .env.example .env         # then edit credentials
alembic upgrade head
uvicorn app.main:app --reload   # API docs: http://localhost:8000/docs

# Frontend (once scaffolded)
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

## Test commands (current reality)

| Command | Working directory | Current result |
|---|---|---|
| `python -m pytest -q` | `backend/` | 0 tests collected (no test files exist) |
| `npm test` | `frontend/` | Not runnable — no `package.json` |

## Private AI folder

The root `ai/` folder is **local-only** (ignored via `/ai/` in the root `.gitignore`). It contains private prompts, session logs, decisions and debugging notes and must never be committed, pushed or published. Shared documentation lives exclusively in `docs/` and `frontend/src/styles/`.
