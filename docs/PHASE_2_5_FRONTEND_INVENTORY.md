# Phase 2.5 — Frontend Inventory

Source: repository inspection of `frontend/` files.

Frontend entry files
- `frontend/package.json` — npm scripts: `dev` (vite), `build`, `preview` (vite preview --port 4173).
- `frontend/vite.config.mjs` — Vite config; proxies `/api` to `http://127.0.0.1:8000` for local dev.
- `frontend/src/main.jsx` — app bootstrap; imports design CSS and `App`.
- `frontend/src/App.jsx` — top-level application composition (entry point for React rendering).

API / adapters / utilities touching backend payloads
- `frontend/src/lib/logFetch.js` — fetch wrapper used by components (logs requests, passes through to `fetch`).
- `frontend/src/lib/adapters/conditionsAdapter.js` — adapter stub to map provider payloads to UI-friendly Conditions shape (currently returns payload unchanged; logs validation warnings).
- `frontend/src/lib/logger.js` — in-memory dev logger used by `logFetch` and adapters for development-time diagnostics.
- `frontend/src/lib/designTokens.js` — token definitions (present but not transformed here).

Major components that consume backend data
- `frontend/src/components/Conditions.jsx` — fetches `/api/conditions` via `logFetch`, consumes backend payload (expects fields such as `location_label`, `summary`, `darkness_window`, `meta`), and renders loading/error/success states.
- `frontend/src/components/RecommendedTargets.jsx` — (component name indicates it consumes target data; implementation reads from API or higher-level state) — observed as domain module.
- `frontend/src/components/SatellitePasses.jsx` — likely consumes `/api/passes` data.
- `frontend/src/components/AlertsEvents.jsx` — likely consumes `/api/alerts` data.
- `frontend/src/components/MoonSummary.jsx` — consumes parts of conditions payload (observed in component list).
- `frontend/src/components/LocationSelector/LocationSelector.jsx` — UI for selecting location; CSS at `frontend/src/components/LocationSelector/locationSelector.css`.

CSS / theme / layout files of structural importance
- `frontend/src/styles.css` — global styles for the app.
- `frontend/src/design/tokens.css` — design tokens imported by `main.jsx`.
- `frontend/src/design/themes.css` — theme CSS.
- `frontend/src/design/semantic.css` — semantic CSS.
- `frontend/src/components/LocationSelector/locationSelector.css` — component-specific styling.

Brief role notes
- Adapters in `frontend/src/lib/adapters/` are present and intended to be the authoritative mapping layer between raw API responses and UI-friendly shapes (currently minimal stubs).
- `logFetch` centralizes fetch usage to enable logging and consistent error handling across components.
- Components currently consume backend payloads directly in many places (several components assume backend-provided fields); adapters exist but are not yet transforming payloads fully.

Unknowns (explicit)
- Exact wiring (which component reads which endpoint) for some components (e.g., `RecommendedTargets.jsx`) is inferred by filename but not exhaustively confirmed by reading every component file in this step — mark as inferred where appropriate.
- Any build/CI scripts invoking frontend builds or environment variables beyond `package.json` are unknown from this inspection.
