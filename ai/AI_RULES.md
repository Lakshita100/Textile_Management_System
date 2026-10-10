# Mandatory AI Implementation Rules

These rules apply to every AI agent, developer, branch, feature and implementation phase.

## 1. Read before editing
Before changing anything, read `README_FIRST.md`, `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_TRACKER.md`, and the global CSS files. Inspect the actual repository before making claims about existing functionality.

## 2. Verify status; never invent it
- Distinguish **implemented and verified**, **implemented but unverified**, **in progress**, **not implemented**, and **blocked**.
- Never mark a feature complete based only on a plan, mockup, placeholder, or generated code.
- Run relevant tests/builds and record the command and outcome.
- If repository contents or test access are unavailable, state that clearly and leave status unverified.
- Do not overwrite working code just to match a suggested structure. Inspect and adapt.

## 3. Strict visual theme — no exceptions without owner approval
Use only the approved theme tokens from `frontend/src/styles/theme.css`. Do not introduce alternate brand colors, arbitrary hex values, gradients, dark themes, or new accent colors.
Approved palette:
- Primary / Fabric Blue: `#3F85C4`
- Accent / Brand Green: `#76B82A`
- Background / White: `#FFFFFF`
- Surface / Light Gray: `#F0F0F0`
- Heading / Charcoal: `#2F2F2F`
- Body text / Dark Gray: `#333333`
- Border: `#E5E5E5`

Usage:
- White is the main page and navigation background.
- Fabric Blue is the primary action, selected navigation state, links and key highlights.
- Brand Green is for restrained secondary accents, success states, underlines and highlights.
- Light Gray is for secondary panels, table headers, muted cards and section backgrounds.
- Charcoal is for headings; Dark Gray is for body copy.
- Border is for dividers and control outlines.
- For semantic error/warning/info states, use accessible labels/icons and existing semantic styling. Do not invent extra palette tokens; if a new semantic color is truly required, document it and request owner approval before adding it.
- Use CSS variables, not repeated raw hex values. Components must reference `var(--color-...)`.
- Do not use gradients or glassmorphism. Do not copy accidental colors from reference screenshots.
- Maintain adequate contrast and visible focus states.

## 4. Frontend conventions
- Use the existing framework and package manager discovered in the repository; do not migrate stacks without approval.
- Prefer reusable, accessible components and consistent spacing/typography.
- Keep pages, shared components, API services, types, hooks and utilities separated.
- Avoid giant single-file pages and duplicated components.
- Use responsive layouts; test desktop and narrow widths.
- Never hardcode secrets or private credentials.
- Do not present mock data as live factory data. Label demo/seed data clearly.
- Include loading, empty, success and error states for data-driven screens.
- Do not fake working buttons, forms, search, filters, exports, QR scanning or tracking. If not implemented, mark as placeholder or disable it clearly.
- Use semantic HTML, keyboard support, accessible labels and visible focus indicators.
- Keep the UI aligned to the supplied reference images without sacrificing actual usability.

## 5. Backend and data rules
- Keep a single modular backend and one relational database for the MVP; no microservices/Kubernetes/physical IoT unless explicitly approved.
- Validate all input server-side.
- Use database constraints, foreign keys and transactions for stock deduction and dispatch confirmation.
- Use decimal-safe types for currency.
- Use migrations for schema changes; do not rely on implicit production table creation.
- Return clear errors when material is insufficient or no machine is eligible.
- Never force a machine assignment if compatibility, availability, capacity or material checks fail.
- Keep machine recommendation explainable and rule-based for the MVP. Do not claim ML training or accuracy without actual trained/evaluated evidence.
- Treat live shipment tracking, camera defect detection and hardware integration as future work unless credentials/devices are actually connected.

## 6. Change management
For each task:
1. Inspect relevant code and current git diff.
2. State the files to be changed and a short plan.
3. Implement the smallest coherent change.
4. Run relevant tests, lint and build where available.
5. Review the diff for accidental palette changes, unrelated formatting, secrets and broken flows.
6. Update `PROJECT_STATUS.md` and `IMPLEMENTATION_TRACKER.md`.
7. Summarize files changed, verification evidence, known gaps and next step.

Do not delete or replace user work without explaining why. Avoid unrelated refactors.

## 7. Completion criteria
A feature can be marked **Implemented and verified** only when:
- Its intended user flow works end-to-end.
- It uses real API/database integration where the feature requires it.
- Relevant tests pass or manual verification is recorded.
- Loading, empty and failure states are handled.
- Its status and evidence are recorded in the tracker.

## 8. Required AI session response
At the end of each implementation session, report:
- Files created/modified
- Features completed
- Tests/build commands and results
- Status tracker changes
- Remaining limitations / blockers
- Exact next recommended task
