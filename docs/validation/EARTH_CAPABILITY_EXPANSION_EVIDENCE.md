# ORA-8 / C5 Earth capability expansion

Current disposition: **C5 COMPLETE**. The owner development/release policy
checkpoint at the end supersedes the historical production-release gate. Earlier
sections retain their original evidence and execution context.

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


## Current-main integration and revised-event correction, 2026-10-03

Branch `phase-c5-earth-live-layers-1` already contained and remotely published
merge `69c4f1f57553788b183dc9dd7afa314274f410be` when this qualification began.
Its parents are accepted PR head `ff488339792870cb036d1417e1923e22e46d1e10` and
main `fc41ac19d7e2021c9d4b56b5a13322981f3c6992`. No duplicate merge was made.
A disposable `git merge-tree --write-tree` replay confirms content conflicts only
in `docs/context/LIVE_SESSION_BRIEF.md` and `docs/execution/PROJECT_STATE.md`;
the manifest auto-merges. The merge also reconciles MASTER_PLAN and FEATURE_TRACKER
without rewriting historical evidence. It preserves merged #60/#61 behavior,
#62 enforcement, current #59 Earth layers and the separately gated next mapping phase.
The loaded context is the union of current `backend_change`, `frontend_change`,
`review` and `validation` packs, with mandatory core/live documents first.
No extra project documents or broad docs scan. Root instructions supersede stale
nested FE8.5/Babylon assumptions. Single agent; no delegation.

The integration itself changes no owned Earth artifact inputs: comparing
`ff488339` to `69c4f1f5` across `runtimes/earth-runtime`, `packages/runtime-protocol`,
Earth build/record scripts and both identity metadata surfaces yields no diff.
Fresh remote review inspection, however, found one additional Category A P2:
[revised event markers](https://github.com/Shadowgar/Astronomy-Hub/pull/59#discussion_r4175759594).
The reused entity path updated position/name/detail facts but retained its original
magnitude visibility range, depth color and label text. Selected and unselected
same-ID regressions both fail before repair (5 pass, 2 fail), retaining a 15,000km
limit after magnitude increases above M4.5. The focused correction refreshes those
record-derived properties; selection identity, highlight and updated base size
remain intact. The same tests also cover downward threshold revisions and unknown
depth. Focused green result: 7/7.

This correction changes an owned runtime input, so the pinned build process was
rerun. Generated release: 512 files, 111 dependency licenses, Cesium 1.138.0,
artifact `f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b`.
`record_runtime_versions.py` verifies actual file and source-input hashes and
regenerates renderers.lock/public runtime versions; hashes were not hand-edited.
Docker HTTP release/public metadata agree with the generated artifact. God's Eye
remains clean at `e7707d9a0f34d9fbffc300023c319f95caa5be30`. The capability ledger
is byte-identical to accepted `ff488339`: earthquakes/fire-perimeters/weather-radar
remain ADAPTED NOW; launches remain LICENSE/DATA BLOCKED after HTTP 403.

Fresh focused checks: runtime/Earth 62/62, local Earth backend 31/31, focused
frontend 2/2, Sky lifecycle 6/6, Tonight fallback 5/5, manifest negative tests 6/6.
Typecheck passes. Architecture validator passes: 175 document-path entries
(173 task + 2 global), 8 packs, 35 checkpoint documents, 88 relative links,
8 ADRs. Docker backend Earth/aircraft bundle: 35/35. All successful commands exit 0.
Existing MockTimers, dependency-deprecation and Vite chunk-size warnings remain.
The prior qualification stack lacked a running Earth service and its frontend
was restarting; rebuilding the disposable backend/frontend/Earth services restores
a healthy stack on port 4181. No production host or deployment is involved.

Exact qualification commands (repository root unless the frontend cwd is stated):

```sh
git fetch origin
git checkout phase-c5-earth-live-layers-1
git status
git log --oneline --decorate -12
git merge-base --is-ancestor origin/main HEAD
git merge-tree --write-tree ff488339792870cb036d1417e1923e22e46d1e10 fc41ac19d7e2021c9d4b56b5a13322981f3c6992
# Replay exit 1 means the two original content conflicts; checkout is unchanged.
git diff ff488339 69c4f1f5 -- runtimes/earth-runtime packages/runtime-protocol integrations/renderers.lock.json frontend/public/runtime-versions.json scripts/runtime/build_owned_earth.sh scripts/runtime/record_owned_earth.py
node --test tests/earth/event-layers.test.mjs
node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs
node --test tests/runtime/sky-page-lifecycle.test.mjs
PYTHONPATH=.:backend .venv/bin/pytest backend/tests/test_earth_events.py -q
PYTHONPATH=.:backend .venv/bin/pytest tests/backend/test_tonight_fallback.py -q
npm --prefix frontend test -- --run earthLayerPanel.test.tsx
npm --prefix frontend run typecheck
python3 -S scripts/validation/validate_architecture_docs.py
python3 -m unittest -v tests.validation.test_architecture_manifest
git diff --check
ORAS_EARTH_OUT=/var/tmp/oras-pr59-integration/earth-build bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-pr59-integration/earth-build
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-pr59-integration/earth-build POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --build backend frontend earth-runtime
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml ps
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml exec -T backend env PYTHONPATH=.:backend python3 -m pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py -q
curl --fail -s http://127.0.0.1:4181/earth-runtime/release.json -o /var/tmp/pr59-served-release.json
curl --fail -s http://127.0.0.1:4181/runtime-versions.json -o /var/tmp/pr59-served-versions.json
# frontend cwd:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/earthExpansion.spec.ts tests/e2e/earthExpansionLive.spec.ts tests/e2e/skyBfcache.spec.ts --workers=1 --output=/var/tmp/oras-pr59-integration/browser
```

The broader Earth fixture/live acceptance is rerun because the new P2 correction
changes rendering. The new browser case uses declared source revisions and the actual 60-second
earthquake polling cadence. Its initial attempted timer acceleration did not cause
a refresh within the 15-second assertion window; that test shortcut was removed.
It checks updated selected facts and preserved iframe/selection identity.
Existing polygon-body cases remain unchanged. Fresh browser outcomes and remote
handoff state are recorded below after qualification.


Fresh Docker/browser result: all **11 unique cases pass across two runs**.
The broader first run passes 10/11 (including all seven original Earth fixture
cases, live providers and both actual Sky bfcache cases); only the new accelerated
revision fixture fails. The corrected real-cadence revision rerun passes 1/1.
There is no claim of a final single 11-case rerun. Actual revised-event polling
updates the selected name, magnitude and depth without replacing its iframe.
Desktop/mobile polygon-body selection, enabled event/radar surfaces, controlled
provider failures/retry, mobile Layers/44px controls and serial Sky/Earth lifetime
all pass. The mobile polygon and revised-event screenshots were visually inspected.

Live browser proof: 38 USGS earthquakes, 74 WFIGS records, one NOAA CONUS radar
surface; all providers ready, no page errors. Native Sky bfcache restores the same
document, resets exploration/recovers controls, then applies +1h through the bridge
(native UTC `2026-10-03T03:00:00.000Z`). This is local production-like Docker proof,
not production deployment or a blanket qualification of untouched Sky science/data.
Logs: `/var/tmp/pr59-node-final.log`, `/var/tmp/pr59-earth-build.log`,
`/var/tmp/pr59-docker-build.log`, `/var/tmp/pr59-browser.log`,
`/var/tmp/pr59-browser-revision.log`; browser artifacts under
`/var/tmp/oras-pr59-integration/`; screenshots under `output/playwright/earth-expansion/`.

Additional exact browser command, frontend cwd:

```sh
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/earthExpansion.spec.ts --grep 'same-ID earthquake' --workers=1 --output=/var/tmp/oras-pr59-integration/browser-revision
```

Exact integrated change inventory relative to supplied accepted PR head
`ff488339` (includes merged main maintenance/validation changes, reconciliation
and this focused correction; excludes unchanged owner settings):

```text
backend/app/services/tonight_catalog.py
docs/architecture/TONIGHT_CONTRACT.md
docs/context/CONTEXT_MANIFEST.yaml
docs/context/CORE_CONTEXT.md
docs/context/LIVE_SESSION_BRIEF.md
docs/execution/MASTER_PLAN.md
docs/execution/PROJECT_STATE.md
docs/features/FEATURE_TRACKER.md
docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md
frontend/public/runtime-versions.json
frontend/tests/e2e/earthExpansion.spec.ts
frontend/tests/e2e/skyBfcache.spec.ts
frontend/tests/orasRuntimeDataSources.test.js
integrations/renderers.lock.json
runtimes/earth-runtime/layers/EventLayers.mjs
runtimes/sky-adapter/entry.mjs
scripts/validation/validate_architecture_docs.py
tests/backend/test_tonight_fallback.py
tests/earth/event-layers.test.mjs
tests/runtime/sky-page-lifecycle.test.mjs
tests/validation/test_architecture_manifest.py
```

No new provider or capability is admitted. The three current layers and launch
access limitation retain their existing ledger disposition. Known Category B
limits remain: generalized incomplete fire subset, CONUS radar, worker-local
provider cache scaling, separately gated high-definition mapping and inherited
Sky data/provider noise. No HD mapping, ISS, Mars/Moon or other next-phase work.
No new PR, requested repeat broad review, PR merge or production deployment.
The owner settings SHA remains
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`, unstaged.
The existing PR owns the final correction commit SHA, CI and review-thread status;
these are verified remotely after the push and reported in the handoff.


## Owner-review radar/restoration corrections, 2026-10-04

Scope: the two unresolved Category A P2 threads on reviewed head
`2bb9ba87165c0c16557c1165afea3fb7bf595a37`, branch
`phase-c5-earth-live-layers-1`, target main `fc41ac19d7e2021c9d4b56b5a13322981f3c6992`.
Both threads were read directly from GitHub before editing:
[radar snapshot boundary](https://github.com/Shadowgar/Astronomy-Hub/pull/59#discussion_r4175853594)
and [layer restoration](https://github.com/Shadowgar/Astronomy-Hub/pull/59#discussion_r4175853597).
Default mode, single agent. Mandatory core/live context and the current
backend_change/frontend_change/review/validation pack union listed earlier remain
applicable; no extra project documents loaded. The explicit owner request activates
this correction pass; nested legacy FE/Babylon/API-prefix assumptions remain
superseded by current root architecture and the established Earth transport.

### Radar snapshot contract

Previously the image route reread the current provider cache. An A manifest
advertised immediately before the 240-second cache expiration could be followed
by a B acquisition, making the just-advertised A image fail with 503.
The service now retains exact acquired PNG bytes under each advertised timestamp
for 120 seconds after the latest successful advertisement. Image reads neither
refresh the provider nor extend retention. Expired and unknown timestamps fail
closed with the existing controlled 503; the route's 40-character limit remains.
There are at most two retained snapshots (each acquired under the existing 4MB
body cap), separate from the existing bounded current-provider cache. Unexpired
bytes are immutable even if a provider reacquisition returns the same timestamp.
If both slots are occupied, an additional advertisement fails rather than evicting
an existing promise. Normal 240-second acquisition cadence plus 120-second grace
requires no more than two slots. Images use `Cache-Control: no-store` so a browser
cache cannot bypass server expiry. Retention remains worker-local under the
qualified single-worker deployment; multi-worker routing is not qualified.

Provider acquisition, coalescing, failure caches, fixed URLs, redirects disabled,
source freshness/PNG validation, request deadlines and response/body caps remain
unchanged. Current manifests still require successful provider acquisition and
freshness admission; retained older snapshots are only addressable by their exact
previously advertised timestamps during their bounded grace period.

The new backend regression exercises actual FastAPI routes and the current cache:
A acquired at monotonic 0, advertised again at 239; B becomes current at 241;
both exact A/B bodies remain fetchable; unknown and expired timestamps return 503;
repeated cache advances remain bounded. It fails on the reviewed source with A
returning 503 (1 failed), then passes after correction. A second contract test
proves capacity never evicts an active lease, identical timestamps cannot mutate
retained bytes, and repeated image reads do not slide expiry. The existing
mismatch/oversize test is retained and strengthened: an otherwise valid timestamp
must be advertised first. Its success setup now requests a manifest, as required
by the corrected contract. No malformed/failure/timeout tests were removed.

### Layer intent and command ordering

The old WorkspaceShell loop captured initial preferences and awaited each restore.
Interactive toggles could finish during an earlier delayed restore, then be undone
when the stale loop reached that layer. The correction creates a per-client layer
session with one promise chain for restore/toggle/retry commands. A user action
synchronously marks its layer as touched before enqueueing; subsequent restore
iterations skip it. A command already sent finishes before the queued user action.
Pending IDs prevent duplicate clicks while leaving other controls responsive.
Preferences still update only on successful runtime acknowledgement. The effect
is keyed to client/mode, not preference state, so persistence does not replay it.
Cleanup cancels remaining work; each queued request carries the expected client,
and the adapter refuses dispatch to a replacement client or an old-client result.
Sky selection restoration and the persisted whitelist/schema are unchanged.

New browser regressions run the actual mounted WorkspaceShell on desktop/mobile:
hold the aircraft restore, toggle later earthquakes, release aircraft, then await
the final restore acknowledgement. Both fail on the reviewed Docker frontend
because earthquakes ends disabled. The initial disconnected-stack attempts were
environment failures and are excluded from red proof. Starting the existing Earth
service restored the old frontend; no frontend source had yet been changed.
The assertions require final runtime/persisted agreement, exactly seven layer
commands, only one quake command (`true`), and at most one in-flight layer command.
A third browser case queues both a later-layer enable and an in-flight-layer
disable, leaves Earth, and verifies neither unacknowledged choice leaks into the
new client. Adapter unit cases cover replacement before dispatch and during ack.

### Qualification and identity

Fresh local backend bundle: 42/42 (33 Earth event, 4 aircraft, 5 Tonight fallback).
Docker Earth/aircraft: 37/37. Runtime/Earth/protocol: 62/62, including six #60
lifecycle cases, fire-polygon picking, release export inventory and same-ID quake
revision checks (also explicitly asserting revised longitude/latitude).
Full frontend: 26 files / 196 tests pass, including the focused layer panel and
adapter tests. Typecheck and six manifest negative tests pass. Architecture
validation passes: 175 entries, 8 packs, 35 documents, 88 relative links, 8 ADRs.
Frontend/backend production containers rebuilt successfully with Bake disabled
for the established local workflow. No production deployment occurred.

No owned Earth runtime/protocol/build input changes; no Earth rebuild is needed.
Strict artifact verification checks all 512 files and source inputs against the
existing release; regenerated metadata is byte-identical to reviewed head.
Actual artifact, recorded lock/public versions, and no-cache served metadata agree:
`f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b`.
All seven declared public exports match. God's Eye is clean at unchanged pin
`e7707d9a0f34d9fbffc300023c319f95caa5be30`; capability ledger is unchanged.
The previous earthquake/polygon corrections and #60/#61/#62 implementation remain
preserved. Historical results above are retained as historical evidence.

Exact commands, root cwd unless noted:

```sh
git fetch origin
git rev-parse HEAD origin/main origin/phase-c5-earth-live-layers-1
sha256sum .vscode/settings.json
PYTHONPATH=.:backend .venv/bin/pytest backend/tests/test_earth_events.py -q -k advertised_radar
PYTHONPATH=.:backend .venv/bin/pytest backend/tests/test_earth_events.py -q
PYTHONPATH=.:backend .venv/bin/pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py tests/backend/test_tonight_fallback.py -q
node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs
npm --prefix frontend test -- --run
npm --prefix frontend run typecheck
python3 -m unittest -v tests.validation.test_architecture_manifest
python3 -S scripts/validation/validate_architecture_docs.py
git diff --check
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-pr59-integration/earth-build POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-build
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-pr59-integration/earth-build POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend backend
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml exec -T backend env PYTHONPATH=.:backend python3 -m pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py -q
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-pr59-integration/earth-build
git diff --exit-code 2bb9ba8 -- runtimes/earth-runtime packages/runtime-protocol integrations/renderers.lock.json frontend/public/runtime-versions.json
git -C /var/tmp/oras-cesium/gods-eye rev-parse HEAD
git -C /var/tmp/oras-cesium/gods-eye status --short
curl --fail -s -H 'Cache-Control: no-cache' http://127.0.0.1:4181/earth-runtime/release.json -o /var/tmp/oras-pr59-owner-review/served-release.json
curl --fail -s -H 'Cache-Control: no-cache' http://127.0.0.1:4181/runtime-versions.json -o /var/tmp/oras-pr59-owner-review/served-versions.json
# frontend cwd, before correction:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceLayerRestore.spec.ts --workers=1 --output=/var/tmp/oras-pr59-owner-review/restore-red
# frontend cwd, after correction:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/workspaceLayerRestore.spec.ts tests/e2e/earthExpansion.spec.ts tests/e2e/earthExpansionLive.spec.ts tests/e2e/skyBfcache.spec.ts --workers=1 --output=/var/tmp/oras-pr59-owner-review/browser
```

Logs/artifacts: `/var/tmp/oras-pr59-owner-review/` (`radar-red.log`,
`radar-green.log`, `restore-red.log`, `backend.log`, `docker-backend.log`,
`runtime.log`, `frontend.log`, `docker-build.log`, `browser.log`).

Docker browser qualification: **14/14 pass in 6.2 minutes**, including both new
desktop/mobile restoration races, queued-choice cancellation on mode departure,
desktop/mobile layer and provider-failure controls, polygon-body selection away
from the anchor, same-ID earthquake revision, Sky/Earth/Sky exact-link lifetime,
live providers, and two native Sky bfcache cases. Both restoration screenshots
were inspected under `output/playwright/earth-expansion/restore-intent-*.png`.
They show earthquakes enabled after delayed restoration on desktop and mobile.
Bfcache confirms `sameDocument: true`, `pageshowPersisted: true`, departure
`persisted: true`, recovered controls and native UTC `2026-10-03T03:00:00.000Z`.

Fresh actual-provider measurements (disposable Docker, software-rendered browser):

| Provider | Accepted records | Source timestamp | Activation |
|---|---:|---|---:|
| USGS earthquakes | 48 | 2026-10-04T13:30:52Z | 2549ms |
| NIFC/WFIGS fire subset | 74 | 2026-10-04T00:31:58Z | 2315ms |
| NOAA CONUS radar | 1 | 2026-10-04T13:24:01Z | 3707ms |

All three report ready; the live browser recorded no page errors. Source times
are provider truth, not retrieval-time substitutions. Full measurements remain
in `output/playwright/earth-expansion/live-measurements.json`.

Exact correction files:

```text
backend/app/routes/earth.py
backend/app/services/earth_events.py
backend/tests/test_earth_events.py
frontend/src/features/workspace/LayerPanel.tsx
frontend/src/features/workspace/WorkspaceShell.tsx
frontend/src/features/workspace/workspaceRuntimeAdapter.ts
frontend/tests/e2e/workspaceLayerRestore.spec.ts
frontend/tests/workspaceRuntimeAdapter.test.ts
tests/earth/event-layers.test.mjs
docs/context/LIVE_SESSION_BRIEF.md
docs/execution/PROJECT_STATE.md
docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md
```

Both named Category A blockers are corrected and qualified; no remaining Category
A blocker is known within this owner-review scope. Category B limitations above
remain, including launch access, incomplete generalized fire coverage, CONUS/low
detail radar, single-worker caches and unqualified multi-worker snapshot routing,
local-browser measurement limits, inherited Sky provider noise and separately
gated mapping. No new capability, dependency pin change, next-phase work, merge
or production deployment is included. Owner settings remain unchanged/unstaged
at SHA-256 `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

Pre-push review state: PR #59 OPEN, non-draft, exactly the two named unresolved
threads. The focused commit containing this section is the final correction head;
its full SHA, post-push CI/mergeability and final unresolved-thread count are
recorded in the two linked review-thread replies and owner handoff after remote
verification. This avoids embedding a commit's own not-yet-created hash in it.
Required handoff is owner re-review, with the PR kept open and unmerged.

## Owner-approved merge and release checkpoint, 2026-10-04

The owner completed review of `e0e69e4747e9123b75072f9636e566865948d584`
against main `fc41ac19d7e2021c9d4b56b5a13322981f3c6992`, explicitly authorized
merge and the bounded C5 production release, and retained all next-phase exclusions.
That authorization supersedes the historical no-merge/no-deploy gates above.

Default mode, single agent. Mandatory core/live context was refreshed, and the
unchanged union of current review/validation/backend_change/frontend_change packs
listed above was retained and checked against the approved head. The manifest
defines no deployment/release pack. The explicitly requested production procedure
`docs/restart/ORAS_PROD_RELEASE_WORKFLOW_2026-06-02.md` and current
`runtimes/README.md` were additionally consulted, along with the actual deployment
script and production Compose source. No broad document-content scan occurred.

### Merge proof

Immediately before merge, a fresh fetch and GitHub API gate confirmed:

- OPEN, non-draft, MERGEABLE/CLEAN, exact approved PR head and reviewed main.
- All six review threads resolved, zero unresolved, no pagination or new finding.
- Seven successful check runs plus successful CodeRabbit status (review skipped;
  no new automatic review was requested).
- PR description updated and read back byte-for-byte to the final approved
  qualification, artifact identity, corrected races, owner approval and Category B
  limits. The old qualification counts and no-merge instruction were replaced.
- Fresh pre-merge checks: 42 backend, 62 runtime/Earth and 196 frontend tests pass.

Normal GitHub merge commit, without administrative/protection bypass:

```sh
gh pr merge 59 --merge --match-head-commit e0e69e4747e9123b75072f9636e566865948d584
git fetch origin
gh pr view 59 --json state,mergedAt,mergeCommit,headRefOid,url
git show -s --format='%H%n%P%n%s' origin/main
git diff --stat e0e69e4747e9123b75072f9636e566865948d584 origin/main
git switch main
git merge --ff-only origin/main
```

PR #59 reports MERGED at `2026-10-04T15:30:52Z`.
Merge/resulting main: `d8ca945a0b1a1c44622dae573d9787dde71f8a76`.
First parent/previous main: `fc41ac19d7e2021c9d4b56b5a13322981f3c6992`.
Second parent/PR head: `e0e69e4747e9123b75072f9636e566865948d584`.
Remote main was verified at the merge result; its file tree is byte-identical to
the approved head. Main's post-merge Playwright and Push-on-main workflows passed.
Pre-merge API proof and exact PR description are saved under
`/var/tmp/oras-pr59-release/{premerge-gate.json,pr-description.md}`.

### Fresh post-merge qualification

On merged main: 42 local backend tests (33 Earth, 4 aircraft, 5 Tonight),
37 Docker Earth/aircraft tests, 62 runtime/Earth/protocol tests, 196 frontend
tests across 26 files, TypeScript and six manifest negative tests pass.
Architecture validator passes: 175 entries, 8 packs, 35 Markdown documents,
88 relative links, 8 ADRs. No Earth runtime/protocol/build input changed across
the merge; **Earth rebuild not required**.

The existing artifact was copied without rebuilding to the immutable path
`/var/tmp/oras-renderers/owned-earth-f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b`.
Strict source-input/file verification passes for all 512 files. Actual artifact,
recorded lock, public versions, and both served disposable metadata endpoints agree
on SHA `f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b`,
all seven public exports, and unchanged clean God's Eye pin
`e7707d9a0f34d9fbffc300023c319f95caa5be30`.

Production Compose rebuilt/recreated frontend, backend and Earth static service
in disposable project `oras-workspace-qualification` on port 4181. Postgres and
Redis were deliberately left running; no data reset or migration occurred.
Frontend and Earth health checks pass; backend is running and its test suite passes.
Fresh Docker browser qualification: **14/14 pass in 6.2 minutes** (exit 0), covering
desktop/mobile controls, source-unavailable/retry, exact-link Sky/Earth transitions,
desktop/mobile polygon-body selection, same-ID event revision, live providers,
both restoration races, queued-choice cancellation and two actual bfcache cases.
Live-provider selection and Focus pass; page errors are empty. This is disposable
qualification, not public deployment.

| Fresh live provider | Accepted records | Provider timestamp | Activation |
|---|---:|---|---:|
| USGS earthquakes | 45 | 2026-10-04T15:36:53Z | 2182ms |
| NIFC/WFIGS fire subset | 74 | 2026-10-04T00:31:58Z | 1779ms |
| NOAA CONUS radar | 1 | 2026-10-04T15:32:13Z | 3583ms |

All three are ready. These refreshed counts supersede earlier observations for
this post-merge check without erasing the owner-reviewed historical results.
The public-contract check on disposable port 4181 returned the advertised radar
timestamp image as a 96,885-byte PNG, HTTP 200, `Cache-Control: no-store`; an
unknown timestamp returned 503. Expiry/boundary behavior remains covered by the
fresh deterministic route/cache regressions. No 240-second production wait occurred.
The documented Sky release routes also pass: runtime root 200, obsolete
`skydata/dso/properties` 404, base DSO properties 200/order 1, extended properties
200/order 3. Results are `postmerge-route-smoke.json` in the proof directory.

Exact post-merge qualification commands (repository root unless noted):

```sh
PYTHONPATH=.:backend .venv/bin/pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py tests/backend/test_tonight_fallback.py -q
node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs
npm --prefix frontend test -- --run
npm --prefix frontend run typecheck
python3 -m unittest -v tests.validation.test_architecture_manifest
python3 -S scripts/validation/validate_architecture_docs.py
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-renderers/owned-earth-f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend backend earth-runtime
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml exec -T backend env PYTHONPATH=.:backend python3 -m pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py -q
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml ps
# frontend cwd:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/workspaceLayerRestore.spec.ts tests/e2e/earthExpansion.spec.ts tests/e2e/earthExpansionLive.spec.ts tests/e2e/skyBfcache.spec.ts --workers=1 --output=/var/tmp/oras-pr59-release/browser
```

Logs are `/var/tmp/oras-pr59-release/postmerge-*.log`; served metadata copies are
`served-release.json` and `served-versions.json` in that directory.
Browser screenshots and live measurements are preserved in its `browser-evidence/`
directory. Final documentation validation passes with 175 entries, 8 packs,
35 documents, **89 relative links**, and 8 ADRs; manifest negative tests pass 6/6
and `git diff --check` passes. Exact final checks:

```sh
python3 -m unittest -v tests.validation.test_architecture_manifest
python3 -S scripts/validation/validate_architecture_docs.py
git diff --check
sha256sum .vscode/settings.json
```

### Production gate and remaining work

Production deployment has **not** occurred in this release attempt. Read-only SSH
to the deployment script's default target with a ten-second connection timeout
returned `ssh: connect to host 100.88.0.20 port 22: Connection timed out` (exit 255).
The owner was asked for the current SSH target, deployment directory and public URL.
None is inferred from localhost or disposable stacks. No production environment
file, artifact, container, persistent data or unrelated service was changed.

The deployment script's rsync/configuration/progress-page defaults must be checked
against the actual target before execution: preserve remote configuration, data,
external mounts and unrelated services. Production baseline/rollback preparation,
deployment, public browser checks, served-production identity, actual production
providers, advertised radar-image contract and production polygon/toggle smoke
remain required. No rollback was required or performed because production was
untouched. C5 production release remains PARTIAL pending these gates; the merge
and disposable qualification must not be represented as production success.

No new Category A regression has been identified in completed checks. Existing
Category B limits remain: blocked launch access, incomplete/generalized fires,
CONUS radar/detail limits, worker-local cache/retention and unqualified multi-worker
routing, local-browser measurement limits and inherited Sky provider noise.
HD mapping, ISS, Mars/Moon and Phase D have not started and remain separately gated.

Post-merge state changes are limited to `docs/context/LIVE_SESSION_BRIEF.md`,
`docs/execution/PROJECT_STATE.md`, `docs/execution/MASTER_PLAN.md`,
`docs/features/FEATURE_TRACKER.md`, and this evidence file. Owner settings retain
SHA-256 `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`,
unchanged and unstaged.

## Owner development and release policy checkpoint, 2026-10-04

Owner decision on base main `9da1633fc6c63d5799b617b2e7cf9aa1de1f8341`:
**PR #59 / Phase C5 is COMPLETE** after review, merge and the post-merge proof
recorded above: 42 local backend, 37 Docker backend, 62 runtime/Earth, 196 frontend
across 26 files, 14 Docker browser cases, typecheck, six manifest negative tests
and architecture validation (175 entries, 8 packs, 35 documents). All three live
disposable providers were ready, with zero page errors. These are recorded
post-merge results, not new executions by this documentation-only correction.
The qualified artifact remains `f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b`
and God's Eye remains pinned at `e7707d9a0f34d9fbffc300023c319f95caa5be30`.

Development remains in the owner's laptop WSL; feature qualification uses local
and disposable Docker environments. External deployment is intentionally deferred
until the owner declares **Release Candidate** and is not a feature-completion
gate or Category A blocker. At that gate, reassess deployment architecture, host,
persistent storage, public hostname, Cloudflare and `oras.org` integration as a
separate task. Local proof does not claim a public deployment.

Historical infrastructure diagnostics are preserved: `100.88.0.20` was stale;
normal read-only SSH reached `openclaw` at `100.66.50.41`. Its stopped historical
Astronomy Hub containers referenced `/home/rocco/external-drive/Astronomy-Hub`;
the NTFS volume UUID `724E8A2E4E89EAE5` was unavailable and the path returned
`No such device`. PostgreSQL and Redis volumes remained untouched. No production
deployment, disk repair or service restart occurred. The local diagnostic record
is `/var/tmp/oras-pr59-release/connectivity-recovery.md`. This host/storage is
historical information only, not a current target, blocker or next action.

The next authorized active development phase is high-definition / close-zoom
Earth mapping: source/architecture/license investigation followed by one bounded,
honestly qualified package and an owner-reviewed feature PR. Preserve C5 and
renderer/provenance boundaries. No remote SSH/deployment/storage repair,
Cloudflare, `oras.org`, ISS, Moon/Mars or Phase D work is authorized. Historical
release and no-HD instructions above are superseded by this owner decision.

This correction changes only the live brief, project state, execution master
plan, feature tracker and this evidence file. Owner `.vscode/settings.json`
remains unchanged and unstaged. No runtime source or artifact is changed.
