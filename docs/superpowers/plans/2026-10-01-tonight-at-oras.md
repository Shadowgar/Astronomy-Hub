# Tonight at ORAS implementation plan

Execution: single agent, native implementation. User specification: pasted Tonight MVP request.

Goal: a full-night planning page backed by tonight.v1 and exact peak-time Sky links.
Architecture: dedicated service, reusable numerical window helpers, bounded local catalog evaluation,
local DE442s trajectory access, independent short-lived factual forecast, React Query page.
Stack: existing FastAPI/Pydantic, Skyfield, Redis, React/TypeScript/Vite/Vitest/Playwright.

Constraints: no satellites, equipment claims, catalog installation, rendering changes, or homepage redesign.
Preserve string catalog identities, geometric horizon limitations, and existing Above Me behavior.

- [x] Backend astronomy: tests for local noon semantics and DST; bracket/refine solar thresholds,
  horizon/planning windows and peaks; full local target universe; geometry ranking and category balance.
  Files: tonight_service.py, tonight_geometry.py, tonight_catalog.py, planetary_ephemeris_service.py,
  sky_coordinates.py; regression tests in backend/tests/test_tonight*.py and existing Above Me tests.
- [x] Forecast/contract: one bounded hourly request; UTC facts, available/partial/unavailable/stale,
  unknown generation time preserved; astronomy survives forecast failure; separate cache freshness.
  Files: tonight_forecast.py, schemas/tonight.py, routes/tonight.py, app/main.py.
- [x] Product: typed query/model, timeline, Moon, forecast, balanced cards, date navigation,
  minimal Hub/Observe links. Files: features/tonight/*, AppRouter.tsx, ObservePage.tsx, TopControlBar.jsx.
  Tests: frontend/tests/tonight*.test.tsx.
- [x] Validation: full backend/frontend suites, typecheck/build/diff, one Docker rebuild,
  curl timing, desktop/mobile browser and representative exact identity/time/site/camera proofs.
- [ ] Documentation and delivery: contract/policy/limitations/evidence; commit only task files,
  push bounded branch, open PR, inspect CI/CodeQL/review threads, repair valid Tonight findings.

Review focus: DST evenings; polar darkness/no darkness; later-rising targets; missing/malformed hourly
facts; local ephemeris absent/out of coverage; stable large IDs; date context on Back/refresh.

Execution ledger:
- Ruling: the supplied detailed user brief authorizes design and single-agent implementation;
  no redundant approval gates or reviewer subagents.
- Ruling: nested legacy FE8.5/Babylon/API-only rules yield to root authority and explicit Tonight scope.
- Backend/frontend components implemented; red/green tests witnessed for new modules and boundary peak regression.
- Ruling: public results bounded to 24/category, with compact Messier and named-star retention;
  no changes to source catalog releases or data installers.
- Ruling: first Docker build interrupted after numerical boundary regression; final image build uses corrected code.
- Supporting full tests/build and authoritative Docker/browser qualification are in progress.

Final local/backend/frontend/browser gates passed: 553 backend, 122 frontend,
3 browser tests, typecheck/build/diff. PR delivery/checks remain pending.
Performance ruling: runtime profiling justified backend-only revalidation after
reducing unnecessary boundary searches; fresh cold 10.97s, warm 0.37s.
