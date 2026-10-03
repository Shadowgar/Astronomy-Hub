# ORA-8 / C5 Earth capability expansion

Baseline main: `f55b9b2721cb692b4cda106e415c8fef59454c80` (merged PR #58).
Branch: `phase-c5-earth-live-layers-1`. Single agent. Default mode.
God's Eye immutable external pin: `e7707d9a0f34d9fbffc300023c319f95caa5be30`.

## Context and implementation plan

Loaded context: CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST and the existing
frontend_change/backend_change packs: locked workspace design; system validation;
architecture/engine/object/data/tonight/stack/ingestion contracts; Phase B study;
Phase C/runtime/workspace evidence; project/master execution and feature controls.
Their common documents were already loaded in this session and are unchanged
between the prior PR head and merged main. Only this explicitly requested new
report is added outside those packs. No docs-directory scan.
The old ORA-7 execution gate is superseded by the explicit ORA-8 request and merged
main. Legacy nested FE/Babylon/backend-only-v1 assumptions do not override current
root/runtime architecture or the established `/api/earth` renderer transport.

1. Qualify each pinned provider, then define bounded normalized Pydantic feeds.
2. Implement fixed-origin FastAPI transport, independent cache/coalescing and failure.
3. Adapt pinned presentation/source helpers behind owned Earth layers and typed DTOs.
4. Extend the strict bridge allowlists and existing Layers/selection/session surfaces.
5. Run unit, Docker/browser, live-provider and one visual qualification; document
   measurements, create PR and request one normal review; fix Category A only.
6. Update execution controls and ORA-8 to In Review; stop without merging.

## Provider admission, 2026-10-03

- Earthquakes: USGS `all_day.geojson`, M2.5+ accepted, last 24 hours, maximum 500;
  GeoJSON feed updates every minute, backend/browser cadence 60 seconds, no auth,
  observed CORS `*`. USGS-produced information is public domain; source credit
  retained. Official [format](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)
  and [rights/credits](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits).
  Live bounded check: HTTP 200, 138812 bytes, 194 raw features; generated timestamp
  `2026-10-03T19:12:15Z`. Event time and source generation are distinct.
- Fires: pinned WFIGS current-interagency-perimeter service, public GeoJSON polygon
  boundaries; no incident points or smoke. NIFC's public dataset metadata specifies
  appropriate use, dynamic/incomplete data and no warranty, without a cache or
  redistribution prohibition. Retain NIFC/WFIGS attribution and disclaimer; no
  threat inference. Official [dataset](https://data-nifc.opendata.arcgis.com/datasets/nifc::wfigs-current-interagency-fire-perimeters/about)
  and [item terms](https://www.arcgis.com/sharing/rest/content/items/d1c32af3212341869b3c810f1a215824?f=json).
  Keyless, CORS `*`; live service/query HTTP 200; first 100 records 661562 bytes.
  Bounded most-recent subset, maximum 100 features, geometry generalization 0.001°,
  explicitly incomplete, five-minute cache/poll; per-record update times retained.
  Approximate boundaries are context, not legal or safety guidance.
- Launches: pinned production Launch Library 2.3.0 provider returned HTTP 403.
  [Official terms](https://github.com/TheSpaceDevs/Tutorials/blob/main/faqs/faq_TSD.md)
  permit value-added use; encourage attribution, server-side caching and no direct
  user-client querying. [Docs](https://ll.thespacedevs.com/docs/) state 15 anonymous
  requests/hour and stale development data. No launch implementation admitted in
  this environment; no guessed locations/trajectories or stale development fallback.
- Rich weather: pinned NOAA nowCOAST CONUS base-reflectivity WMS, approximately
  four-minute updates, no auth; metadata HTTP 200, 34545 bytes, CORS `*`.
  [Official service direction](https://www.weather.gov/media/notification/pdf_2023_24/scn23-12_nowcoast.pdf)
  and [NWS public-domain terms](https://www.weather.gov/disclaimer).
  This product is radar reflectivity, not rainfall prediction or global coverage.
  Explicit latest timestamp, fixed CONUS bbox, bounded PNG; source-time freshness
  admission and backend cache avoid unbounded tile or upstream request load.

Local raw qualification artifacts are `/var/tmp/oras-c5/`; these are not committed
or used as production data. Implementation/qualification sections follow below.

## Exact loaded context

Task packs: `frontend_change` and `backend_change`; `CORE_CONTEXT` and
`LIVE_SESSION_BRIEF` loaded first, then `CONTEXT_MANIFEST.yaml`. The explicitly
requested evidence report is added to existing packs, without duplicates. No
extra context documents outside those packs were loaded for C5. Source files,
provider documentation and repository operating instructions are separate from
context-pack documents.

- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/ASTRONOMY_HUB_DIAGRAM.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`
- `docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md`
- `docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md`
- `docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md`
- `docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md`
- `docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md`
- `docs/architecture/ARCHITECTURE_OVERVIEW.md`
- `docs/architecture/ENGINE_SPEC.md`
- `docs/architecture/ENGINE_CATALOG.md`
- `docs/architecture/OBJECT_MODEL.md`
- `docs/architecture/DATA_CONTRACTS.md`
- `docs/architecture/TONIGHT_CONTRACT.md`
- `docs/architecture/STACK_OVERVIEW.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_CATALOG.md`
- `docs/features/FEATURE_ACCEPTANCE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/architecture/INGESTION_STRATEGY.md`

## Source and architecture

Inspected immutable God's Eye provider/helper families at the recorded pin:
`src/layers/earthquakes/{index,model,records,source}.js`,
`src/layers/perimeters/{index,records,source,cards}.js`,
`src/layers/launches/source.js` and `server/providers/weather.js`. The runtime
borrows only `depthColor` and `perimeterAnchorDegrees`; it never constructs
upstream controllers. The WMS request logic is adapted into owned FastAPI
transport, with an explicit timestamp instead of an unbounded time/tile proxy.

FastAPI owns meaning and fixed-origin acquisition. Three typed JSON routes under
`/api/earth` expose earthquakes, fire-perimeters and weather-radar; `radar-image`
serves only the cached manifest's exact timestamp. No credentials or arbitrary
URL proxy exist. Requests have an eight-second total acquisition deadline,
four-megabyte body cap (radar metadata 512 KiB), no redirects and independent
per-provider in-flight coalescing. Success caches are 60/300/240 seconds; failures
are cached for 60 seconds. Retry resets the renderer request, respecting that
backend cache to prevent repeated upstream bursts. No stale-success fallback.

USGS admission requires valid stable string ID, finite real coordinates, current
source generation, magnitude 2.5–10 and event within the past day. WFIGS accepts
closed Polygon/MultiPolygon rings, preserves holes and drops malformed or
oversized whole features. At most 100 recent records / 25,000 vertices are
admitted, rather than claiming complete coverage. Explicit `poly_GISAcres` is
labeled mapped polygon area; containment is only displayed when supplied.
Radar uses a fixed 2048×1024 transparent PNG over -130/20/-60/55, with explicit
WMS time and maximum source age 30 minutes. It is a bounded CONUS context
surface; pixel refinement and a scale/legend are follow-ups, not global coverage.

The browser understands strict normalized DTOs only and calls same-origin
FastAPI for every new source. Existing CelesTrak/Open-Meteo/NASA requests remain
unchanged. Provider fetches occur only when enabled. Completion-scheduled polls
avoid overlap, and disposal aborts acquisition, removes entities/imagery/timers,
and revokes radar Blob URLs. A late image decode cannot re-add disabled imagery.

Common selection uses stable source IDs and bounded serializable facts. Fire
polygon picks resolve internally to their incident marker, including multipart
boundaries. Quakes scale by magnitude, use pinned depth color where known and a
neutral unknown-depth color, hide small events at global distance and label only
selection. Fire fills use 8% alpha, 18% selected, with holes retained. Focus uses
50 km for events and 5,000 km for regional radar; no automatic flight on refresh
or event tracking. The radar marker explicitly denotes coverage centre.

The existing panel gains grouped Events/Environment categories and source/time
status rows; no workspace redesign. Strict protocol allowlists gain three layer
IDs, two selection kinds, and optional typed categories/temporal modes. Legacy
snapshots and protocol authentication/generation checks remain accepted and
unchanged. Earthquakes are `EVENT_FEED`; fire/radar are `CURRENT_SNAPSHOT`.
Changing scene time never rewinds those provider feeds.

## Focused tests and build commands

All commands run from the repository root unless the frontend directory is shown.

```sh
# Startup (owner settings preserved)
git checkout main
git pull --ff-only
git status
git checkout -b phase-c5-earth-live-layers-1

# Runtime / strict contracts / lifetime / owned event factories
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs

# Supporting local backend fixtures
PYTHONPATH=.:backend .venv/bin/pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py -q

# Frontend supporting checks, cwd frontend
npm test -- tests/earthLayerPanel.test.tsx tests/workspace*.test.* tests/runtimeProductState.test.ts tests/runtimeProbeService.test.ts
npm run typecheck
npm run build

# Owned artifact, immutable external source, containerized pinned toolchain
ORAS_EARTH_OUT=/var/tmp/oras-c5/earth-build bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-c5/earth-build

# Established production-like stack, avoiding local Compose Bake failure
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-c5/earth-build POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build backend frontend earth-runtime
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml ps
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml exec -T backend python -m pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py -q

# Docker browser fixtures, cwd frontend
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/earthExpansion.spec.ts --workers=1 --output=/var/tmp/oras-c5/browser-final

# Docker browser, actual providers, explicit opt-in, cwd frontend
ORAS_LIVE_EARTH=1 PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/earthExpansionLive.spec.ts --workers=1 --output=/var/tmp/oras-c5/browser-live-final

python3 scripts/validation/validate_architecture_docs.py
git diff --check
sha256sum .vscode/settings.json
```

Unit results: **54/54 runtime/protocol**, **42/42 frontend (8 files)**,
**35/35 backend** both local and Docker. Backend Docker emitted six existing
Starlette/httpx deprecation warnings. Typecheck and production frontend build
passed; artifact build and byte/source-input verification passed. Artifact:
`7e80e89341fbf7cf0b94ecd9d1685ea8db5bdd08d8e33723153b5bd0e57355a5`,
Cesium 1.138, 512 files, 111 dependency-license records. Artifact hash is recorded
in both the renderer lock and Hub runtime versions. Seven public upstream export
surfaces are declared, including the two new helper surfaces. `completeApplication:false`,
`viewerOwner:Astronomy Hub`, `bundledThirdPartyDatasets:[]` in module-policy.

Docker backend, frontend, Earth, PostgreSQL and Redis are up; frontend and Earth
health checks pass. Public qualification origin is `http://127.0.0.1:4181`.
Owner development stack/ports are untouched; this is disposable local
production-like qualification, not production deployment.
Architecture documentation validator passed: 172 manifest entries, eight packs,
35 checkpoint documents / 68 links. Diff whitespace check passed.
Owner `.vscode/settings.json` stays unchanged and unstaged, SHA-256
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

## Live versus fixture proof and correction pass

Declared fixtures test deterministic desktop 1440×900 and mobile 390×844 toggles,
status/source time, selection, Focus, disable, 44-pixel switches, provider outages
and retry. Fixtures are visibly named and implemented only in tests. Radar's test
PNG is transparent, so it proves interaction/decode/lifetime, not weather pixels.
The separate opt-in live browser test never intercepts providers or substitutes
fixtures; it selects real USGS/WFIGS records and displays real NOAA radar.

Early browser qualification caught a real Cesium polygon material failure. The
focused material regression failed until the callback color was wrapped in
`ColorMaterialProperty`. Subsequent correction preserves polygon-to-incident
selection and magnitude sizing after deselection. Focused negative tests also
caught all-invalid-coordinate quake feeds appearing empty and missing browser
recency validation; both were corrected. A malformed fixture PNG checksum and
incorrect test camera reset were test-only issues, corrected without changing
product navigation behavior. Page-lifecycle harness mocks were extended to
supply the new serializable diagnostics.

The one visual correction groups Environment rows together. Inspected desktop
new categories, enabled/selected earthquakes and perimeters, timestamped live
radar, unavailable state, and mobile sheets/selected event. Markers remain small,
labels appear only for selection, facts are readable, source credits remain
visible (move to top on mobile sheet), scroll is contained and horizontal
workspace overflow is absent. Focused local views show the existing low-detail
imagery/ellipsoid limitations; no new terrain claims are made.

The final results below are tied to the verified artifact.

## Final Docker browser results and measurements

- Declared fixtures: **5/5 passed** against pre-review artifact `f200619b13884fadc3fc5dc0e9732f267924b30e2ddfdc52a248d3f264d493fa`. Both desktop and
  mobile exercise all three admitted layers and outage/retry; the fifth check
  validates an exact Tonight object link and Sky → Earth → Sky with one iframe
  and disconnected old renderer frames.
- Actual providers: **1/1 passed** against that pre-review artifact, no
  interceptions/fixtures, **zero page errors**. The provider DTO/rendering code
  is unchanged by the review correction.
  HTTP 200 for all three DTOs; selection and Focus succeed for real quake/fire
  identities and the radar coverage marker. USGS source generation
  `2026-10-03T19:50:42.000Z`; WFIGS maximum boundary update
  `2026-10-03T16:15:19.505Z`; NOAA radar frame `2026-10-03T19:44:08.000Z`.
- Direct HTTP no-cache inspection: `/earth-runtime/release.json` and
  `/runtime-versions.json` both HTTP 200 and agree with the final artifact hash.

| Layer | Records | Entities (including site) | Toggle → ready ms | Browser acquisition ms | Render setup ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| earthquakes | 38 | 39 | 4108 | 28.0 | 7.5 |
| fire-perimeters | 74 | 443 | 3286 | 152.3 | 36.1 |
| weather-radar | 1 | 2 | 3811 | 5.6 | 19.0 |

These measurements and broad screenshots use the pre-review artifact above;
provider adapter/rendering code is unchanged. The final artifact adds the focused
picker correction and accurate export declaration described below. These are
local measurements under concurrent software-rendered qualification.
Toggle-to-ready includes bridge/UI update and test scheduling. Browser acquisition
uses warm backend caches after the live endpoint check; these are not cold-provider
latency numbers. Render setup ends after entities/imagery are admitted, rather than
claiming a GPU presentation deadline. Screenshots prove subsequent visible output.
Earlier cold endpoint observations were 540 ms USGS, 3483 ms WFIGS and 1365 ms
radar; different request times/data, not an SLA. Fire count includes multipart
polygon entities; radar adds one coverage anchor and one imagery layer.

### Screenshots

Artifacts are local under `output/playwright/earth-expansion/` (ignored by Git):

- [Desktop layer categories](../../output/playwright/earth-expansion/desktop-layers.png)
- [Desktop earthquake enabled](../../output/playwright/earth-expansion/desktop-earthquakes-enabled.png)
- [Desktop earthquake selected](../../output/playwright/earth-expansion/desktop-earthquakes-selected.png)
- [Live earthquake selected](../../output/playwright/earth-expansion/live-earthquakes-selected.png)
- [Live fire enabled](../../output/playwright/earth-expansion/live-fire-perimeters-enabled.png)
- [Live fire selected](../../output/playwright/earth-expansion/live-fire-perimeters-selected.png)
- [Live radar](../../output/playwright/earth-expansion/live-weather-radar-enabled.png)
- [Live radar selected](../../output/playwright/earth-expansion/live-weather-radar-selected.png)
- [Desktop providers unavailable](../../output/playwright/earth-expansion/desktop-unavailable.png)
- [Mobile layer sheet](../../output/playwright/earth-expansion/mobile-layers.png)
- [Mobile new categories after sheet scroll](../../output/playwright/earth-expansion/mobile-new-layer-categories.png)
- [Mobile selected event](../../output/playwright/earth-expansion/mobile-earthquakes-selected.png)
- [Mobile unavailable](../../output/playwright/earth-expansion/mobile-unavailable.png)
- [Live measurements](../../output/playwright/earth-expansion/live-measurements.json)

No launch screenshot exists because the provider was rejected before implementation.
Raw command logs live under `/var/tmp/oras-c5/`; screenshots are not production data
or committed catalog fixtures. The remote evidence report retains the numeric
results; local screenshot links require this qualification workspace.

### Fixed provider endpoints

- USGS: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`.
- WFIGS: `https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query`,
  bounded recent GeoJSON query described above, output SR 4326.
- NOAA WMS: `https://nowcoast.noaa.gov/geoserver/observations/weather_radar/ows`,
  GetCapabilities 1.3.0 and fixed GetMap 1.1.1 with EPSG:4326 and explicit time.
- Rejected launches: `https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=30&mode=detailed`
  returned **403**; no development-data fallback.

## Exact files changed

- `backend/app/routes/earth.py`
- `backend/app/services/earth_events.py`
- `backend/tests/test_earth_events.py`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md`
- `frontend/public/runtime-versions.json`
- `frontend/src/features/workspace/LayerPanel.tsx`
- `frontend/src/features/workspace/WorkspaceShell.tsx`
- `frontend/src/features/workspace/workspaceUiState.ts`
- `frontend/tests/e2e/earthExpansion.spec.ts`
- `frontend/tests/e2e/earthExpansionLive.spec.ts`
- `frontend/tests/earthLayerPanel.test.tsx`
- `integrations/gods-eye-capabilities.json`
- `integrations/renderers.lock.json`
- `packages/runtime-protocol/index.d.mts`
- `packages/runtime-protocol/workspace.mjs`
- `runtimes/earth-runtime/core/CameraController.mjs`
- `runtimes/earth-runtime/core/EarthRuntime.mjs`
- `runtimes/earth-runtime/core/SelectionStore.mjs`
- `runtimes/earth-runtime/entry.mjs`
- `runtimes/earth-runtime/layers/EventLayers.mjs`
- `runtimes/earth-runtime/layers/PollingLayer.mjs`
- `runtimes/earth-runtime/layers/eventData.d.mts`
- `runtimes/earth-runtime/layers/eventData.mjs`
- `tests/earth/event-camera.test.mjs`
- `tests/earth/event-contract.test.mjs`
- `tests/earth/event-layers.test.mjs`
- `tests/earth/event-selection.test.mjs`
- `tests/earth/export-boundary.test.mjs`
- `tests/earth/selection.test.mjs`
- `scripts/runtime/record_owned_earth.py`
- `tests/earth/page-lifecycle.test.mjs`
- `tests/runtime/workspace-protocol.test.mjs`

## Limitations / Category B

- Launch Library 2.3.0 production access returned 403; launches remain blocked in
  this environment. No anonymous-access workaround or guessed schedule/site data.
- Fire context is a generalized recent subset, not complete national coverage,
  smoke, threat boundaries or evidence of currently active burning. Perimeter
  update times can be older than transport retrieval and are shown separately.
- Radar covers CONUS only; absent pixels do not prove absence of precipitation.
  One bounded image is intentionally lower detail at close zoom; optional legend,
  tiles/coverage refinement and additional weather providers are future work.
- API caches are worker-local in the qualified single-worker deployment; multiple
  workers would multiply polling. No new database/Redis migration is included.
- Measurements are local software-rendered-browser observations, not service or
  device guarantees. Live provider availability may differ in deployment.
- Inherited Sky loader/provider noise and imagery/terrain limitations are not
  requalified beyond the requested representative regression.
- No ISS handoff, Mars/Moon, measured horizon, excluded layer or Phase D work.

## Review / execution handoff

PR [#59](https://github.com/Shadowgar/Astronomy-Hub/pull/59), base main, is open on
`phase-c5-earth-live-layers-1`. One normal review is requested after this final
implementation/evidence push; its outcome is reported in the handoff/Linear.
Category A findings must receive focused fixes/retests. Category B follow-ups
must not cause recursive review requests. ORA-8 moves to **In Review**, not Done;
owner approval is the remaining closure gate. No merge is authorized.


### Completed review and Category A correction

The repository automatically ran Copilot on implementation head `318edac5`; the
single explicit normal `@codex review` request reviewed `5181b290`. Copilot found
picker reachability and missing artifact export metadata; Codex independently
reported the same picker issue. These are **two unique Category A findings** in
three threads, not Category B styling. No further review was requested.

The original proxy unit test called `set(polygon)` and missed the installed click
handler. A new regression invokes the real LEFT_CLICK handler and fails before
adding `scene.pick(...).id.orasSelectableEntity` ahead of proximity selection.
A generator regression runs the real release script against a declared disposable
artifact fixture and compares all direct God’s Eye imports to `public_exports`.
It fails before adding `layers/earthquakes` and `layers/perimeters` to the generator.
The inherited empty-pick fixture gained an empty `scene.pick` mock; its behavior
and preservation assertion remain unchanged.

Focused final correction commands:

```sh
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs
ORAS_EARTH_OUT=/var/tmp/oras-c5/earth-build bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-c5/earth-build
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-c5/earth-build POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend earth-runtime
# cwd frontend: real Cesium polygon-body interaction, declared source fixture
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/earthExpansion.spec.ts --grep 'fire polygon body' --workers=1 --output=/var/tmp/oras-c5/browser-polygon-reviewed
```

Final regression **54/54** pass; artifact/container rebuild pass; **2/2** focused
Docker desktop/mobile browser tests pass. They click a polygon body away from the
anchor marker, then verify the stable incident selection and Focus control.
[Desktop proof](../../output/playwright/earth-expansion/desktop-polygon-body-selected.png)
and [mobile proof](../../output/playwright/earth-expansion/mobile-polygon-body-selected.png).
Both no-cache HTTP metadata surfaces return 200, identical final artifact SHA,
and all seven public exports. Existing backend/frontend/provider/Sky results
remain applicable because those implementation paths did not change. Final SHA
is recorded in the PR and ORA-8 comment after this correction commit. Threads
receive the correction proof and are resolved; final CI is checked on that SHA.
Owner approval remains required. No merge or next phase.
