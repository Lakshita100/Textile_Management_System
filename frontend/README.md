# Textile MS — Frontend

React + Vite + TypeScript + Tailwind CSS. The **Quality Management** module lives at `/quality` and has four screens — **Quality Dashboard** (`/quality`), **All Inspections** (`/quality/inspections`), **Packing** (`/quality/packing`) and **Dispatch** (`/quality/dispatch`, country/state/city analytics) — plus a **New Inspection modal** (`InspectionFormModal.tsx` via `InspectionFormProvider`); its "Proceed" button queues accepted metres into Packing. The main production app (Dashboard, Machines, Jobs, Recommendations, Analytics) lives at `/` under `Layout`.

## Run

```bash
npm install
npm run dev     # dev server
npm run build   # type-check + production build
npm run lint    # oxlint
npm test        # vitest
```

## Conventions

- Colors come only from `src/styles/theme.css` via CSS variables (`var(--color-…)`); Tailwind utilities are mapped in `src/index.css` (`bg-action`, `text-title`, `bg-panel`, `border-line`, …). Never hardcode hex values.
- Structure: `pages/`, `components/`, `services/`, `types/`, `hooks/`, `styles/`.
- Quality/packing/dispatch data is currently in-memory (`qualityService.ts`, `packingService.ts`, `dispatchService.ts`); it resets on reload and will be replaced by backend API calls.
