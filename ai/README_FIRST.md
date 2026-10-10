# Textile Manufacturing Intelligence System — AI Handoff Pack

**Purpose:** This folder is the shared source of truth for AI-assisted implementation. Read it before changing code. Update the tracker after every meaningful implementation session.

## Start every AI session with these files
1. `AI_RULES.md` — mandatory working and design rules.
2. `PROJECT_STATUS.md` — current verified status and remaining work.
3. `ARCHITECTURE.md` — intended architecture and module boundaries.
4. `IMPLEMENTATION_TRACKER.md` — phase checklist and evidence.
5. `frontend/src/styles/theme.css` — mandatory global theme tokens.
6. `frontend/src/styles/global.css` — global defaults and component conventions.

## Important status disclaimer
This is a **project handoff / governance pack**, not a copy of your existing source-code repository. No existing repository contents were included in the request, so implementation status is recorded as **not yet audited / unverified**, not assumed to be complete. The reference images are design targets, not proof that their screens or behaviors already exist in code.

## How to use
Copy these files into the root of the actual repository. Keep the filenames and update them in the same pull request as implementation changes. Every AI coding tool or team member must follow `AI_RULES.md`.

## Current product direction
Build a connected textile-factory web app: inventory and suppliers → customer orders → machine recommendation → production → quality inspection → finished stock → dispatch → cost and reporting.

## Design references
- Use the provided textile-factory dashboard and login-screen images as visual references for layout, information hierarchy and module coverage.
- The exact palette is defined in `frontend/src/styles/theme.css`. Never substitute colors from the screenshots or invent a new brand palette.
