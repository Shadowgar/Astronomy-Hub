# Tonight MVP qualification — 2026-10-01

Branch: `tonight-at-oras-mvp-1`. PR #50 prerequisite verified merged at
`4efe27c3e143c94582e7269973f7ff5a864a1b9c`. Single agent throughout.
No catalog release installs or rendering-source changes.

## Context and authority

Loaded core/session/manifest followed by the union of backend_change and
frontend_change packs: validation specification, system diagram, architecture
(overview, engine spec/catalog, object model, data contracts, ingestion, stack),
execution state/master plan, feature execution/catalog/acceptance/tracker.
No broad docs scan. Stale nested FE8.5/Babylon/API-only instructions yielded to
root authority and explicit user Tonight scope. Current task was recorded narrowly
in LIVE_SESSION_BRIEF and PROJECT_STATE. The Tonight contract is now in the
backend/frontend manifest packs.

## Supporting validation

Commands (all from repository root):

```
.venv/bin/python -m pytest backend/tests -q
npm --prefix frontend run test
npm --prefix frontend run typecheck
npm --prefix frontend run build
git diff --check
```

Frontend: 15 files / 122 tests passed; typecheck exit 0; build exit 0,
119 modules, JS 443.03 kB (gzip 131.71 kB), CSS 85.47 kB (gzip 18.35 kB).
Build took 9m59s copying existing public skydata; no bulk data was baked into
Docker. Backend pre-optimization: 549 passed / 25 existing deprecation warnings.
Final optimized full backend qualification: 553 passed / 25 existing
deprecation warnings in 227.55s.

Focused commands used `backend/tests/test_tonight_geometry.py`,
`test_tonight_service.py`, `test_tonight_forecast.py`, `test_tonight_api.py`,
and the existing Above Me/observability/planetary regressions. Latest focused
Tonight set: 30 passed, one existing httpx deprecation warning (17.80s).
The grazing boundary regression was observed failing then passing. The
monotonic-search performance regression was observed failing at 75 coordinate
calls then passing with fewer than 30. Missing local kernel tests do not claim
runtime science; tests that require it are explicitly conditional.

## Docker and endpoints

```
COMPOSE_BAKE=false docker compose up -d --build backend frontend
COMPOSE_BAKE=false docker compose up -d --build backend
docker compose ps
curl -sS -o /tmp/tonight-runtime.json -w 'HTTP %{http_code}; elapsed %{time_total}s; bytes %{size_download}\n' 'http://127.0.0.1:8000/api/tonight?date=2026-10-01'
curl -sS -o /tmp/tonight-dst-runtime.json -w 'HTTP %{http_code}; elapsed %{time_total}s\n' 'http://127.0.0.1:8000/api/tonight?date=2026-10-31'
```

Initial build attempt was interrupted when the numerical boundary regression
was found. Corrected full-stack build completed, then backend alone was rebuilt
for the measured performance correction. Bake was disabled explicitly; no Bake
crash was observed. PostgreSQL, Redis, backend and frontend run; frontend healthy.

October 1 HTTP 200, 54 targets, available Open-Meteo hourly coverage, 67,649 bytes;
warm endpoint 0.352s before final optimization. Astronomical darkness
2026-10-02T00:31:49Z through 09:44:16Z: 8:31 PM–5:44 AM EDT, 552.4 minutes.
Sources: 24 canonical bright stars, bounded 120 Hipparcos, 13 supported Messier,
existing 700-object OpenNGC subset before cross-catalog deduplication, local
DE442s Moon/planets. These are candidate inventories, not all returned targets.

DST October 31 endpoint HTTP 200 with a 25-hour noon interval, 54 opportunities,
forecast unavailable outside coverage, and astronomy intact. Warm repeat 0.542s.
Browser shows Oct 31 dusk in EDT and Nov 1 dawn in EST; zero console errors.
Cold concurrent evaluation measured 33.30s. cProfile isolated repeated extrema
searches/moving-body calculations; the optimization uses endpoint slopes to
bracket a boundary extremum and skips iterative monotonic searches. No cadence,
threshold or physical correctness was reduced. Astronomy cache key bumped to v2.
Final performance measurements are recorded below.

## Browser acceptance

```
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 PLAYWRIGHT_SKIP_WEBSERVER=1 npm --prefix frontend run test:e2e -- tests/e2e/tonight.spec.ts
```

Initial run: 3 passed (1.1m). Desktop 1440×900 and mobile 390×844:
real API populated page, no horizontal overflow, site/evening/date visible,
twilight sequence, populated categories, previous/next evening, direct refresh,
controlled weather-failure UI preserving real Docker astronomy, no page errors.
Dates October 1 and 2; additional DST browser date October 31.

Six links were actually clicked from real Tonight category cards: M31, M42,
Vega, supported Hipparcos star, Moon, Jupiter. Each independently asserted
catalog/source_id/model, engine observer UTC within 60 seconds of peak (runtime
clock advances), latitude/longitude within 0.00001°, elevation within 0.01 m,
and camera yaw/pitch within the existing 0.02 rad tolerance of the selected
object. Back returned to the original night. Panel text alone was not accepted.

Screenshots inspected: `output/playwright/tonight-desktop-viewport.png`,
`tonight-mobile-cards.png`; full desktop/mobile pages and six Sky handoffs are
also in that ignored evidence directory. The acceptance test is committed and
reproducible; generated screenshots are not committed.

## Limits and next task

ORAS only. Geometric horizon; real obstructions, refraction and equipment
suitability unmodeled. Fixed catalog geometry retains existing sidereal
conversion limitations (no new precession/proper-motion pipeline). Bounded
catalog subsets; no satellite pass recommendations, equipment suggestions,
Moon interference/quality score, sunset/sunrise convention, or new catalog data.
Forecast generation time remains unknown; missing/out-of-range forecasts stay
unavailable without current-weather substitution. Weather never changes rank.

Next task after this unmerged PR: Astronomy Hub homepage/shared navigation
integration pass. That work has not begun beyond the requested Tonight links.

## Final measurements after boundary-search optimization

Fresh October 5 night: HTTP 200, 10.970s astronomy cache miss, 54 targets and
available forecast; repeat HTTP 200, 0.365s cache hit. October 1 warm response
0.322s. Both use astronomy key v2; forecast TTL remains independent. The cold
measurement includes real local calculations and forecast retrieval; this is
not a network call per object/sample. Concurrent cold requests can duplicate
work before Redis fills; no distributed single-flight lock is claimed.

Final optimized browser revalidation: 3 passed in 58.6s, using
`--output=../output/playwright/test-results` to preserve tracked older artifacts.

## Exact files changed

- `.dockerignore`
- `backend/Dockerfile`
- `backend/app/main.py`
- `backend/app/routes/tonight.py`
- `backend/app/schemas/tonight.py`
- `backend/app/services/above_me_service.py`
- `backend/app/services/oras_site.py`
- `backend/app/services/planetary_ephemeris_service.py`
- `backend/app/services/sky_coordinates.py`
- `backend/app/services/tonight_catalog.py`
- `backend/app/services/tonight_forecast.py`
- `backend/app/services/tonight_geometry.py`
- `backend/app/services/tonight_service.py`
- `backend/tests/test_tonight_api.py`
- `backend/tests/test_tonight_forecast.py`
- `backend/tests/test_tonight_geometry.py`
- `backend/tests/test_tonight_service.py`
- `docs/architecture/TONIGHT_CONTRACT.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/superpowers/plans/2026-10-01-tonight-at-oras.md`
- `docs/validation/TONIGHT_MVP_EVIDENCE.md`
- `frontend/src/components/layout/foundation/TopControlBar.jsx`
- `frontend/src/config/orasSite.json`
- `frontend/src/config/orasSite.ts`
- `frontend/src/features/observe/ObservePage.tsx`
- `frontend/src/features/tonight/TonightPage.tsx`
- `frontend/src/features/tonight/model.ts`
- `frontend/src/features/tonight/queries.ts`
- `frontend/src/features/tonight/tonight.css`
- `frontend/src/routes/AppRouter.tsx`
- `frontend/tests/e2e/tonight.spec.ts`
- `frontend/tests/tonight.test.tsx`
- `frontend/tests/tonightRoute.test.tsx`
- `frontend/tsconfig.json`

## PR review correction

PR: https://github.com/Shadowgar/Astronomy-Hub/pull/51 (unmerged).
Initial head 99dba4f3: CI/CodeQL passed; Codex completed. Copilot identified two
valid issues, both inside Tonight scope: corrupt forecast caches suppressing
fresh retrieval, and partial-plan text incorrectly attributing all degradation
to catalog failures. Both were reproduced with failing regressions and fixed.
The cache now validates the public Forecast model, aware timestamps and finite
facts, treating invalid entries as misses. Valid fresh entries still avoid the
provider. Partial UI wording covers all astronomy evaluation failures.

Final frontend after review: 123 passed, typecheck exit 0. Vite compiled the
same shell (119 modules, JS 443.04 kB / gzip 131.72 kB) with unchanged bulk
public data copying disabled, in 9.27s. Initial standard `npm run build` above
included the full static copy and passed. Review build command:

```
node --input-type=module - <<'JS'
import { build } from './frontend/node_modules/vite/dist/node/index.js'
await build({root:'frontend',build:{copyPublicDir:false}})
JS
```

Forecast regressions: 9 passed, including four malformed-cache variants and
valid-cache/invalid-hour recovery. Full backend and Docker/browser checks were
rerun for this correction. Full backend: 558 passed, 25 existing deprecation
warnings in 209.46s. Frontend: 123 passed across 15 files; typecheck exit 0.
`git diff --check` and Ruff on the changed forecast service passed.

`COMPOSE_BAKE=false docker compose up -d --build backend frontend` completed
with exit 0 after the review correction. `docker compose ps` shows both running,
frontend healthy. This additional rebuild was required to qualify the actual
review fixes rather than reuse results from the previous code.

Scoped malformed-cache recovery in the running container:

```sh
docker compose exec -T backend python - <<'PY'
from datetime import datetime
from backend.app.cache.redis_cache import cache_set
from backend.app.services.oras_site import ORAS_SITE
from backend.app.services.tonight_forecast import fetch_forecast, iso
start=datetime.fromisoformat('2026-10-02T00:31:49+00:00')
end=datetime.fromisoformat('2026-10-02T09:44:16+00:00')
key=f"tonight-forecast:v1:{ORAS_SITE['latitude']}:{ORAS_SITE['longitude']}:{iso(start)}:{iso(end)}"
cache_set(key,'not-json',ttl_seconds=60)
result=fetch_forecast(start=start,end=end)
assert result['status'] in ('available','partial'),result
assert result['hours'],result
print({'status':result['status'],'hours':len(result['hours']),'coverage_start':result['coverage_start'],'coverage_end':result['coverage_end']})
PY
```

Exit 0: invalid-cache warning followed by fresh provider status `available`,
11 hourly rows, coverage `2026-10-02T00:00:00Z` to `2026-10-02T10:00:00Z`.
Only that disposable forecast key was replaced; no catalog or other cache data
was cleared.

Final Docker browser command:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 PLAYWRIGHT_SKIP_WEBSERVER=1 npm --prefix frontend run test:e2e -- tests/e2e/tonight.spec.ts --output=../output/playwright/test-results
```

Exit 0: 3 passed in 52.2s. Desktop, mobile and all six identity/time/site/camera
handoffs passed on the review-corrected Docker runtime.

Loaded documents, exact paths:

- docs/context/CORE_CONTEXT.md
- docs/context/LIVE_SESSION_BRIEF.md
- docs/context/CONTEXT_MANIFEST.yaml
- docs/validation/SYSTEM_VALIDATION_SPEC.md
- docs/ASTRONOMY_HUB_DIAGRAM.md
- docs/architecture/ARCHITECTURE_OVERVIEW.md
- docs/architecture/ENGINE_SPEC.md
- docs/architecture/ENGINE_CATALOG.md
- docs/architecture/OBJECT_MODEL.md
- docs/architecture/DATA_CONTRACTS.md
- docs/architecture/INGESTION_STRATEGY.md
- docs/architecture/STACK_OVERVIEW.md
- docs/execution/PROJECT_STATE.md
- docs/execution/MASTER_PLAN.md
- docs/features/FEATURE_EXECUTION_MODEL.md
- docs/features/FEATURE_CATALOG.md
- docs/features/FEATURE_ACCEPTANCE.md
- docs/features/FEATURE_TRACKER.md
