# Implementation Tracker

Update this file in the same change set as code. Use dates and evidence, not impressions.

## Status key
- [ ] Not started / not yet verified
- [x] Verified complete
- [~] In progress
- [!] Blocked

## Phase 0 — Repository audit and baseline
- [ ] Inspect current repository tree and Git status
- [ ] Identify frontend/backend frameworks and package managers
- [ ] Run existing tests/build before changes and record baseline
- [ ] Map existing files to `ARCHITECTURE.md`
- [ ] Update `PROJECT_STATUS.md` using actual evidence

## Phase 1 — Design system and frontend shell
- [ ] Add approved theme variables from `frontend/src/styles/theme.css`
- [ ] Add global styles from `frontend/src/styles/global.css`
- [ ] Verify no unapproved palette values in CSS/TSX
- [ ] Set up app shell, navigation and responsive layout
- [ ] Add loading, empty, error and focus states
- [ ] Compare implementation with supplied reference images

## Phase 2 — Database and API foundation
- [ ] Configure environment variables and PostgreSQL connection
- [ ] Create SQLAlchemy models and relationships
- [ ] Generate and apply Alembic migration
- [ ] Implement health and DB-health endpoints
- [ ] Add API schemas, routers and validation
- [ ] Add backend tests

## Phase 3 — Inventory and suppliers
- [ ] Supplier CRUD and performance fields
- [ ] Material CRUD and stock quantity/unit/cost
- [ ] Purchases and material receipts
- [ ] Minimum stock alerts
- [ ] Transaction-safe material consumption
- [ ] CSV/XLSX export verification

## Phase 4 — Orders and machine recommendations
- [ ] Order CRUD and status workflow
- [ ] Material requirement/shortage calculation
- [ ] Machine compatibility and capacity filtering
- [ ] Rule-based scoring and explanation
- [ ] No-eligible-machine and insufficient-material cases tested
- [ ] Supervisor confirmation and production-job creation

## Phase 5 — Production and quality
- [ ] Production progress and downtime records
- [ ] Roll/batch inspection form
- [ ] Defect type, count, severity and remarks
- [ ] Approved/rework/rejected outcomes
- [ ] Machine-wise defect and efficiency analytics

## Phase 6 — Warehouse and dispatch
- [ ] Unique finished-roll IDs and locations
- [ ] Finished stock and quality-state validation
- [ ] Dispatch creation with transaction-safe stock updates
- [ ] Shipment status timeline
- [ ] Clearly label simulated tracking

## Phase 7 — Employees, attendance and accounts
- [ ] Employee and wage records
- [ ] QR generation and actual scan flow
- [ ] Duplicate check-in/check-out protection
- [ ] Working hours and basic wages
- [ ] Cost, revenue, payment and outstanding summaries
- [ ] CSV/XLSX export verification

## Phase 8 — Integration, demo and hardening
- [ ] End-to-end workflow verified
- [ ] Frontend production build succeeds
- [ ] Backend tests pass
- [ ] Environment secrets excluded from Git
- [ ] Authentication and role enforcement verified or clearly documented as incomplete
- [ ] Known limitations documented
- [ ] Demo dataset and walkthrough prepared

## Session log
Append one entry per implementation session:

### YYYY-MM-DD — Session title
- **Files changed:**
- **Features/status changed:**
- **Commands run:**
- **Test/build result:**
- **Manual verification:**
- **Known gaps/blockers:**
- **Next task:**

## Current baseline
2026-10-10: Handoff documentation and CSS rules drafted. Existing application repository was not supplied, so actual app integration and all implementation phases remain unverified.

### 2026-10-10 — Landing page (public entry point)
- **Files created:** `frontend/` scaffolded as Vite + React + TypeScript + Tailwind CSS v4. Added `src/main.tsx`, `src/App.tsx`, `src/index.css` (theme tokens), `src/pages/{Landing,SignIn,Legal,NotFound}Page.tsx`, `src/components/` (Header, HeroSection, StatisticsStrip, FeaturesSection, DashboardPreview + `dashboard/DashboardMock`, WorkflowSection, RolesSection, BenefitsSection, FinalCTA, Footer, Logo, `ui/{Button,SectionHeading}`), `src/hooks/{useReveal,useScrollSpy}.ts`, `src/constants/{demoData,nav}.ts`, `public/images/` + `IMAGE_CREDITS.md`, `scripts/visual-check.mjs`, eslint/typecheck configs.
- **Features completed:** Public landing page (all 10 required sections), sticky responsive nav with scroll-spy active state + mobile hamburger, hero with real Unsplash textile photography, sample-data statistics strip (clearly labelled), 6 feature cards, genuine rendered React dashboard preview inside a browser frame, 6-step workflow (horizontal → vertical timeline), 4 role cards (with "intended capabilities" note), benefits split layout, deep-blue final CTA with woven pattern, corporate footer with honest placeholders, `/signin` demo page (validates input, explicitly states auth is NOT connected), `/privacy` + `/terms` placeholder pages, 404 page. Palette = the product-owner spec (#0866C6 / #073B63 / #76B82A), tokenised in `frontend/src/index.css` (NOTE: `ai/…/theme.css` still lists the older #3F85C4 palette — needs owner reconciliation).
- **Commands run:** `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, `node scripts/visual-check.mjs`.
- **Test/build result:** typecheck PASS, eslint PASS (0 errors), `vite build` PASS. Playwright overflow check = 0px at 1440/1280/1024/768/390/360 (initially 13px at 1024 from header spacing — fixed).
- **Manual verification:** Reviewed hero/mobile-menu/full-page screenshots; hero legibility, mobile menu, and 6 breakpoints confirmed clean.
- **Known gaps/blockers:** No backend/auth (sign-in is a labelled demo); all statistics are sample data; role portals, contact details, privacy/terms text are placeholders; palette conflict with `ai/` docs unresolved pending owner confirmation.
- **Next task:** Phase 2 — backend API foundation (FastAPI + PostgreSQL + Alembic), then wire the landing-page CTAs to a real authenticated dashboard.
