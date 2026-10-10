# Textile MS — Frontend

React + Vite + TypeScript + Tailwind CSS (per `ai/idea.docx`). The **Quality Management** module has two screens — **Quality Dashboard** (`/quality` — efficiency, defects, machine focus) and **All Inspections** (`/quality/inspections` — full list with filters and inspector names) — plus a **New Inspection modal** opened from the sidebar button or the "New inspection" buttons on either screen (`InspectionFormModal.tsx` via `InspectionFormProvider`). Other modules appear as disabled items in the sidebar.

## Run

```bash
npm install
npm run dev     # dev server
npm run build   # type-check + production build
npm run lint    # oxlint
```

## Conventions

- Colors come only from `src/styles/theme.css` via CSS variables (`var(--color-…)`); Tailwind utilities are mapped in `src/index.css` (`bg-action`, `text-title`, `bg-panel`, `border-line`, …). Never hardcode hex values.
- Structure: `pages/`, `components/`, `services/`, `types/`, `hooks/`, `styles/`.
- Quality data is currently in-memory (`src/services/qualityService.ts`); it resets on reload and will be replaced by backend API calls.
