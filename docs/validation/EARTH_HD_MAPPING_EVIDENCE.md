# HD Earth mapping — first bounded package

Base: `70daeb8087a5439dc27d1a5da3d64d8ec436f495`; branch `earth-hd-mapping-1`.
The separate policy correction is that base commit, pushed to main. C5 is complete;
external deployment is deferred until an owner-declared Release Candidate.
Single agent, laptop WSL and disposable Docker only. Implementation and local
qualification passed; ready for owner review. Not merged or publicly deployed.

## Context and architecture findings

Loaded the manifest union of docs_change, planning, frontend_change,
backend_change, review and validation. No broad docs scan or override mode.
Current live/project authority supersedes historical Phase B/FE8.5 text. Inspected
VisualFoundation, displayConfig, ViewerController, EarthRuntime, lifecycle,
attribution, bridge/DTO allowlists, pinned Cesium providers, runtime build and
existing C5 browser tests. Upstream God's Eye remains unchanged at
`e7707d9a0f34d9fbffc300023c319f95caa5be30`; Cesium remains 1.138.0.

The baseline's NASA GIBS `BlueMarble_ShadedRelief_Bathymetry` is a static global
composite, confirmed by live WMTS capabilities as the **500m** matrix set. Its
WMS wrapper requests 512px geographic tiles through level 8 (about 153m sampling
at the equator, already finer than the source). More levels only oversample.
The bundled Natural Earth II fallback has levels 0–2, 256px geographic tiles:
0.17578125 degrees/pixel at its maximum, about 19.6km at the equator. Source
resolution is the principal close-zoom limit, not the 100m camera minimum.
A failed GIBS request removes the layer; ordinary blur at close zoom is source
exhaustion, not evidence of failure. Baseline retry restores only Natural Earth.

Terrain is ellipsoid-only. Relief would improve oblique landform perception but
would not sharpen imagery; it requires independent elevation/coverage proof.
Labels/vector streets add cartographic context, not photographic resolution.
Buildings and photogrammetry are separate geometry/data/terms capabilities.
No project-approved account credentials are configured: checked the explicit
public artifact configuration, not private account files. Existing opt-in ion
asset admission requires qualification and publishable-token attestation.

## Provider investigation, 2026-10-04

Primary-source references were checked live; terms and prices must be rechecked
before Release Candidate. Resolution describes source/coverage, not a universal
camera zoom promise. No provider below was activated merely because its URL works.

| Option | Resolution / coverage / Cesium integration | Access, terms, attribution, cost and caching | Decision |
|---|---|---|---|
| NASA GIBS / local Natural Earth | Global static 500m Blue Marble; local fallback about 19.6km equatorial sampling. Existing WMS/TMS. | No key; NASA source credit, Natural Earth public domain. Normal browser caching; no bulk mirror. | Retain fallback, not HD. [GIBS](https://nasa-gibs.github.io/gibs-api-docs/access-basics/), [NASA resolution](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/). |
| USGS National Map Imagery Only | CONUS mostly NAIP 1m source, 2017–2021 acquisition per current metadata. Service useful scale 1:9,028; cap level 16, 2.389m equatorial / 1.794m ORAS ground sampling. 256px Web Mercator tile endpoint fits Cesium UrlTemplate. Other service regions differ; Alaska includes restricted SPOT data. | Public map-service terms say free/public domain, no commercial-use restriction; credit USGS National Geospatial Program plus USDA/NAIP. No key or published numeric quota found; no SLA assumed. Live tile CORS `*`, `Cache-Control: max-age=86400`. Browser cache only, no prefetch/mirror. | Select a CONUS-bounded displayed layer; no Alaska regional coverage. No global HD claim. [Service metadata](https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer?f=pjson), [map-service terms](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map). |
| Cesium ion imagery and World Terrain | Imagery asset/provider dependent, no blanket resolution. World Terrain global quantized mesh; US about 1–30m, finer regional coverage; coarse global gaps. Native IonImageryProvider / CesiumTerrainProvider. | Project token with asset/origin scope and account/asset terms; preserve Cesium and dynamic data credits. Community is personal/noncommercial; currently 15GB/month streaming and 1,000 global-imagery sessions. Commercial starts $149/month individual, with larger quotas. Asset-specific caching limits; no offline redistribution assumed. | Existing safe config boundary retained; account-dependent qualification absent. [Pricing](https://cesium.com/platform/cesium-ion/pricing/), [terrain](https://cesium.com/platform/cesium-ion/content/cesium-world-terrain/), [usage](https://cesium.com/learn/ion/content-usage-and-attribution-guide/). |
| Bing through supported Cesium APIs | Global aerial with region-dependent resolution/max zoom; no verified project entitlement or precise resolution claim. IonImageryProvider/BingMapsImageryProvider supported. | Ion Bing terms prohibit asset tracking and combining non-Bing maps/imagery. Existing aircraft/satellite tracking and fallback mix conflict. Microsoft's basic program retired; enterprise retirement is June 2028. Ion guide only guarantees access at least through September 2026, already past. Token/license, provider attribution and caching limits apply. | Reject for this package, not silently enable old sample assets. [Ion restrictions](https://cesium.com/learn/ion/content-usage-and-attribution-guide/), [Microsoft retirement](https://blogs.bing.com/maps/2024-05/Microsoft-Announces-Vision-for-Next-Generation-of-Enterprise-Maps). |
| Esri World Imagery / supported basemap service | Global mosaic, 1m or better in many areas; selected metros 0.3m, contributor areas finer, lower-resolution elsewhere; tile levels do not prove native resolution. ArcGisMapServerImageryProvider supported. | Use licensed ArcGIS account/API key or session, with Esri and changing contributor attribution. Location Platform currently 2M tiles free then $0.15/1,000, or 1K sessions free then $4/1,000. Commercial use depends on subscribed terms. No offline caching/redistribution permission established here; do not infer entitlement from public legacy endpoint. | Candidate for later global coverage after account/license review. [Cesium integration](https://developers.arcgis.com/cesiumjs/scenes/satellite-basemap-tiles/display-a-scene-basemap-session/), [pricing](https://developers.arcgis.com/pricing/), [imagery description](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=pjson). |
| OpenStreetMap / vector-derived context | Worldwide street/label data with uneven mapping completeness, not aerial imagery. Raster tiles fit Cesium; vector rendering needs a separately qualified adapter/provider. | ODbL data attribution/share-alike obligations separate from server terms. Standard donated tile service is best-effort, permits no bulk/offline prefetch, requires Referer and cache headers (at least seven days when unreadable), and may block load. Commercial hosted/self-hosted services have separate costs/terms. | Defer contextual labels/streets. No OSM tile traffic in this package. [Tile policy](https://operations.osmfoundation.org/policies/tiles/), [copyright](https://www.openstreetmap.org/copyright). |

Live metadata and a single ORAS level-16 tile were saved under
`/var/tmp/oras-hd-mapping-1/`: metadata HTTP 200, tile HTTP 200 JPEG 29,983 bytes.
The service lists levels through 23 but advertises maxScale at level 16; we
choose the conservative published useful bound, not artificial sub-centimeter HD.
The CONUS rectangle limits displayed imagery, not the byte extent of every
coarse parent tile. Parent tiles can span beyond the envelope; service metadata
identifies Blue Marble/Landsat at small scales. Alaska SPOT is viewable through
the service but restricted for direct data downloads; this package enables no
Alaska regional coverage or offline data export. Border/ocean pixels vary.
Acquisition time varies and is unrelated to workspace time.

## Design and execution plan

Goal: real regional/local aerial improvement using one existing owned Viewer,
without credentials, new dependencies, renderer controls or competing map state.
User explicitly authorized investigation followed by implementation; execute inline
and preserve the owner-review gate before merge. The existing feature workflow
is extended; no new subsystem or upstream interface is introduced.

1. Add a strict `publicImagery` enum (`blue-marble`, `usgs-conus`) to public display
   configuration; legacy configs remain accepted, unknown URLs/keys rejected.
   Ship `usgs-conus`; absent/invalid config keeps the safe global fallback.
2. Extract owned imagery lifetime from VisualFoundation. Base stack order is
   Natural Earth, GIBS, optional USGS or configured ion, below all event overlays.
   USGS uses a fixed HTTPS service, CONUS envelope (-125,24,-66,50), level 0–16,
   no feature picking and visible USDA/USGS credit. Hide it above 2,000km camera
   height and fade to full opacity by 1,000km, and require the camera view rectangle
   to intersect CONUS. This
   avoids a rectangular global patch, initial global USGS requests and misleading
   USGS source status outside coverage. Retain original terrain/3D
   config boundary; no terrain/3D provider is enabled.
3. Bound concurrent tile work, impose a cancellable timeout, remove a failed
   provider for the session, and require explicit coalesced retry. Retry reloads
   imagery only, never event layers. Stop requests/listeners at teardown. Status
   must not be overwritten by late global fallback work. Keep protocol 1.1 fields;
   expose truthful source/coverage through its existing <=120-character strings.
4. Test invalid config, source caps, timeout/error/cancel, pending retry and stale
   completions, overlay order, truthful fallback and cleanup. Update existing
   Sources UI retry for degraded imagery and add a coverage/resolution note.
5. Rebuild from pinned source; verify artifact/file/input/export metadata. Run
   Node/frontend/backend/manifest/typecheck, Docker and desktop/mobile browser
   proof with live imagery, bounded failure fixtures, local-detail screenshots,
   network/timing measurements and the full C5 regression bundle. Preserve owner
   settings. Record limits; push/open the feature PR; do not merge or deploy.

Review focus: provider late completion after navigation; timeout vs stalled tiles;
retry covering radar; unknown config/credential leakage; misleading global HD or
source-date claim. Each is covered by the owning configuration, imagery or browser
qualification. Physical mobile hardware, global HD and account assets remain
separate future proof.

## Implementation progress

The runtime unit cycle initially reproduced rejected `usgs-conus` configuration
and the missing bounded-request module. Focused tests then passed. Visual browser
review found a global CONUS rectangle; a failing transition regression led to the
regional fade above. Pinned Cesium RequestScheduler source proves cancellation
rejects with no value; two regressions failed before distinguishing cancelled work
from loaded tiles and reporting timeouts independently of Cesium cancellation.
The resulting Node suite, including the review regression below, passes 75 tests.
No protocol field or upstream module is added. Source statuses continue through the existing bounded quality strings;
only serializable request counters are added to local runtime diagnostics.

Superseded exploratory artifacts are not release candidates. Final desktop and
mobile proof shows actual ORAS aerial detail at 1.2km camera height. The final
artifact and fresh browser results are recorded below.

## Exact loaded document set

The following is the applicable task-pack union (including this newly authored,
registered report). CONTEXT_MANIFEST was read as the context index. No extra
project documents were loaded.

- `docs/ASTRONOMY_HUB_DIAGRAM.md`
- `docs/DOCUMENT_INDEX.md`
- `docs/DOC_INVENTORY.md`
- `docs/MASTER_PLAN.md`
- `docs/README.md`
- `docs/architecture/ARCHITECTURE_OVERVIEW.md`
- `docs/architecture/DATA_CONTRACTS.md`
- `docs/architecture/ENGINE_CATALOG.md`
- `docs/architecture/ENGINE_SPEC.md`
- `docs/architecture/INGESTION_STRATEGY.md`
- `docs/architecture/OBJECT_MODEL.md`
- `docs/architecture/STACK_OVERVIEW.md`
- `docs/architecture/TONIGHT_CONTRACT.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`
- `docs/architecture/decisions/0001-universal-application-state.md`
- `docs/architecture/decisions/0002-swe-sky-renderer.md`
- `docs/architecture/decisions/0003-gods-eye-earth-runtime.md`
- `docs/architecture/decisions/0004-additive-earth-extensions.md`
- `docs/architecture/decisions/0005-cesium-planetary-direction.md`
- `docs/architecture/decisions/0006-controlled-renderer-handoffs.md`
- `docs/architecture/decisions/0007-immutable-upstream-source.md`
- `docs/architecture/decisions/0008-provider-licensing-boundaries.md`
- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/features/FEATURE_ACCEPTANCE.md`
- `docs/features/FEATURE_CATALOG.md`
- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/product/PRODUCT_VISION.md`
- `docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md`
- `docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md`
- `docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md`
- `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md`
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md`
- `docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md`

## Qualification commands and artifact

The docs-only base correction passed `git diff --check`, six manifest negative
tests and architecture validation (175 entries, 8 packs, 35 documents, 89 links).
Owner settings hash stayed `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

Owned source changes require a rebuild: **yes**. Final candidate:
`ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.
Immutable local artifact:
`/var/tmp/oras-renderers/owned-earth-ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.
512 files, Cesium 1.138.0, 111 dependency license records, about 13MiB on disk.
No imagery tile cache or large astronomy data is baked into it. The existing
small Natural Earth shell asset remains packaged. The strict recorder verifies
all source-input and file hashes; both served metadata endpoints agree with the
lock and public versions. All seven direct qualified imports equal all four
public-export surfaces. Module policy retains owned Viewer, no complete upstream
application and no bundled third-party datasets. God's Eye checkout is clean.

Exact commands, repository root unless indicated; logs under
`/var/tmp/oras-hd-mapping-1/`:

```sh
node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs
npm --prefix frontend test -- --run
npm --prefix frontend run typecheck
PYTHONPATH=.:backend .venv/bin/pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py tests/backend/test_tonight_fallback.py -q
python3 -m unittest -v tests.validation.test_architecture_manifest
python3 -S scripts/validation/validate_architecture_docs.py
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/var/tmp/oras-hd-mapping-1/earth-review-qualified bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-renderers/owned-earth-ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend earth-runtime
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml exec -T backend env PYTHONPATH=.:backend python3 -m pytest backend/tests/test_earth_events.py backend/tests/test_earth_aircraft.py -q
python3 /var/tmp/oras-hd-mapping-1/verify-artifact.py
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml ps
git -C /var/tmp/oras-cesium/gods-eye status --short
git -C /var/tmp/oras-cesium/gods-eye rev-parse HEAD
sha256sum .vscode/settings.json
git diff --check
# frontend cwd, live sources explicitly enabled, one browser worker:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/earthHdMapping.spec.ts tests/e2e/workspaceLayerRestore.spec.ts tests/e2e/earthExpansion.spec.ts tests/e2e/earthExpansionLive.spec.ts tests/e2e/skyBfcache.spec.ts tests/e2e/workspaceAccessibility.spec.ts --workers=1 --output=/var/tmp/oras-hd-mapping-1/browser-qualified
```

The initial Docker build also included `backend` with the same disposable
project/configuration; final source changes affected Earth only. Database/Redis
containers and persistent volumes were preserved. Bake is explicitly disabled.
No remote host, production service, Cloudflare or `oras.org` was contacted.

## Final local qualification results

| Check | Result |
|---|---|
| Node Earth/runtime/protocol | **75 passed**, zero failures/skips |
| Frontend Vitest | **198 passed**, 27 files |
| TypeScript | **PASS** |
| Final Docker/browser suite | **25 passed** in 13.8 minutes, zero failures/skips on artifact `ca124164…` |
| Local backend including Tonight | **42 passed**, five existing httpx deprecation warnings |
| Disposable Docker Earth/aircraft backend | **37 passed**, six dependency deprecation warnings |
| Manifest negative tests | **6 passed** |
| Architecture | **PASS**, 181 entries, 8 packs, 36 documents, 94 links, 8 ADRs |
| Docker build / serving | **PASS**, final immutable artifact mounted in Earth container; all five services running, frontend/Earth health checks healthy |
| Artifact/source/export reconciliation | **PASS**, 512 file hashes and source inputs; seven qualified exports agree across four surfaces |
| Diff / owner settings | **PASS**, no whitespace errors; owner settings unchanged and excluded from staging |

The initial candidate `98f240e2…` full browser command completed **22 passed, 2 failed** in 13.3 minutes.
Both failures were isolated to qualification harness timing; no C5 runtime change
was made to close them:

1. Earth bfcache had already proved `pageshow.persisted === true`. Chromium
   restored the original child document before Playwright reattached its `Frame`.
   Reading the actual same-origin iframe `contentWindow`, as the existing Sky
   proof does, passed in **26.0s**: identical child document ID, undisposed runtime,
   working Return to ORAS bridge and ready USGS imagery.
2. The existing queued-layer departure test exhausted its deliberately stalled
   aircraft request's 12-second timeout during separate pointer actionability
   waits on software WebGL. Captured command timing showed the aircraft timeout
   and subsequent legitimate earthquake command before the cancellation assertion.
   Dispatching the two installed UI button handlers in one browser task preserves
   the intended pending window. Disabled-state assertions remain; a stronger
   assertion proves no earthquake command has been dispatched before departure.
   The corrected case passed **three consecutive runs** (26.2s, 25.6s, 26.2s).
   Desktop/mobile queued preference tests still exercise real pointer clicks.

At that checkpoint, **all 24 distinct browser cases had passing evidence across runs**;
do not describe this as a single clean 24/24 run. Logs are `browser-qualified.log`,
`browser-focused.log` (bfcache pass plus the earlier queue failure), and
`browser-queue.log`. The final queue command, from `frontend`:

```sh
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceLayerRestore.spec.ts --grep 'mode departure' --repeat-each=3 --workers=1 --output=/var/tmp/oras-hd-mapping-1/browser-queue
```

### PR review corrections

PR [#63](https://github.com/Shadowgar/Astronomy-Hub/pull/63) opened at `8f3b861c`.
CodeQL identified substring origin matching in the browser response-accounting
filter. Exact parsed HTTPS origin and tile-path matching replaced it; both live
HD cases passed again. The production provider URL was already fixed.

Codex P2 identified height-only activation outside CONUS. A focused unit regression
failed with `loading` instead of `standby`; real browser Focus on a declared Paris
event fixture also reproduced incorrect USGS status while Blue Marble was visible.
The correction uses Cesium's camera view rectangle and rectangle intersection.
Absent/outside views retain fallback status; returning to covered views restores
HD status. The geographic browser regression passed in 32.1s, with no USGS requests
outside coverage and real USGS tiles after Return to ORAS. The event is a declared
test fixture, not a production earthquake claim; imagery remains live.

These corrections were pushed as `864c1d49`. They add no upstream module or protocol
field. The rebuilt final artifact is `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`;
`98f240e2…` is superseded. All 75 Node, 198 frontend, 42 local backend and 37 Docker
backend tests, TypeScript, source hashes and served/export reconciliation passed
again. The complete browser rerun against this artifact passed **25/25** in
13.8 minutes (exit 0), including the new outside-CONUS case. This final run
supersedes the initial candidate's split-run qualification above. Its log is
`browser-review-qualified.log`. Exact focused and full commands from `frontend`:

```sh
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/earthHdMapping.spec.ts --grep 'HD live imagery' --workers=1 --output=/var/tmp/oras-hd-mapping-1/browser-origin-check
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/earthHdMapping.spec.ts --grep 'outside CONUS' --workers=1 --output=/var/tmp/oras-hd-mapping-1/browser-coverage-green
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/earthHdMapping.spec.ts tests/e2e/workspaceLayerRestore.spec.ts tests/e2e/earthExpansion.spec.ts tests/e2e/earthExpansionLive.spec.ts tests/e2e/skyBfcache.spec.ts tests/e2e/workspaceAccessibility.spec.ts --workers=1 --output=/var/tmp/oras-hd-mapping-1/browser-review-qualified
```

GitHub's seven check runs passed on `864c1d49`, including the aggregate CodeQL
gate; alert 73 reports fixed. Both review threads are resolved. CodeRabbit's
successful status explicitly says review skipped, and Copilot could not review
due to quota: neither is independent approval. The Codex P2 was verified and
corrected as above; owner review remains required before merge. Final handoff
rechecks the documentation commit's current PR head/check/thread state.

Passing coverage includes live desktop/mobile HD imagery and attribution; global
standby with zero USGS tile requests; close zoom; explicit recovery after outages;
stalled-tile timeout; same-scale global fallback; actual Earth and Sky bfcache;
Sky/Earth single-renderer lifetime; mobile sheets, focus, keyboard, contrast and
credit placement; earthquake/fire/radar selection and Focus; actual fire polygon
body picking; revised earthquakes; layer preference restoration/cancellation;
ORAS canonical coordinates/Return to ORAS; and the inherited satellite fixture
tracking cancellation test. This does not implement a new ISS tracking phase.

Fresh live C5 providers in the disposable stack were all ready, with zero page
errors: 47 earthquakes (source 19:42:53Z), 74 fires (source 00:31:58Z), one radar
snapshot (source 19:35:58Z), all on 2026-10-04. Activation times were respectively
7,443 / 6,342 / 9,538ms; provider acquisition 891 / 703 / 807ms; render 7.1 / 17.8 /
3,207.2ms. These remain source timestamps, separate from workspace time.

### Visible result and bounded performance

Final screenshots and JSON are in
`output/playwright/earth-hd-mapping/` (gitignored), copied with C5 live evidence
to `/var/tmp/oras-hd-mapping-1/browser-evidence/`. Initial candidate evidence is
retained separately in `browser-evidence-initial/`. Actual USGS aerial imagery
shows the ORAS clearing, access roads and individual tree detail; the same local
camera scale with the configured Blue Marble fallback shows the expected coarse
500m source. The global screenshot records initial loading, not completed global
HD. Desktop is 1440x900; mobile is a 390x844 Chromium viewport. Credits remain
visible and Sources content does not overflow horizontally.

| Observation | Desktop | Mobile viewport |
|---|---:|---:|
| Hub Earth ready after navigation | 2,348ms | 1,349ms |
| 24 keyboard zoom inputs through first level-16 tile | 43,421ms | 18,536ms |
| Final camera height | 1,236.66m | 1,236.66m |
| USGS tile responses | 108 | 99 |
| Sum of response Content-Length | 2,580,834 bytes | 2,240,016 bytes |
| Peak concurrent USGS requests | 4 | 4 |
| Failed / active requests at diagnostic capture | 0 / 4 | 0 / 0 |
| Page errors | 0 | 0 |

Traversal timings include 24 sequential Playwright key inputs and progressive
refinement under WSL software WebGL. They are **not isolated tile latency**,
frame-rate measurements, hardware-mobile benchmarks or a smoothness guarantee.
The byte sums exclude protocol overhead and other providers. The diagnostic
snapshot precedes the screenshots/Sources panel and final response totals: desktop
had four active requests at that capture, so it is not a zero-pending measurement.
Response counts later stopped growing over the settled two-second check and after
departure to Sky. The stalled-provider proof made
four attempts: one timeout, three cancellations, zero active requests, no renewed
requests after 2.5s and zero page errors. Both NASA and local fallback remained
ready. Outage recovery requires the user's explicit retry; retry coalescing and
overlay ordering passed unit coverage.

### Files and review boundary

The separate policy commit changed only LIVE_SESSION_BRIEF, PROJECT_STATE,
MASTER_PLAN, FEATURE_TRACKER and EARTH_CAPABILITY_EXPANSION_EVIDENCE. This feature
changes the following exact paths:

- `docs/DOCUMENT_INDEX.md`
- `docs/DOC_INVENTORY.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md`
- `frontend/public/runtime-versions.json`
- `frontend/src/features/workspace/DiagnosticsSurface.tsx`
- `frontend/tests/e2e/earthHdMapping.spec.ts`
- `frontend/tests/e2e/workspaceAccessibility.spec.ts`
- `frontend/tests/e2e/workspaceLayerRestore.spec.ts`
- `frontend/tests/earthImagerySources.test.tsx`
- `integrations/renderers.lock.json`
- `runtimes/earth-runtime/core/ImageryController.mjs`
- `runtimes/earth-runtime/core/VisualFoundation.mjs`
- `runtimes/earth-runtime/core/displayConfig.mjs`
- `runtimes/earth-runtime/core/imageryRequests.mjs`
- `runtimes/earth-runtime/display-config.json`
- `runtimes/earth-runtime/entry.mjs`
- `tests/earth/display-config.test.mjs`
- `tests/earth/imagery-controller.test.mjs`
- `tests/earth/imagery-requests.test.mjs`

Bounded single-agent diff review covered fixed provider origin/config admission,
terms and credit visibility, cancellation/timeout and late completion, one owned
Viewer, event overlay ordering, artifact/source/export agreement and scope.
No Category A implementation blocker remains from this local qualification.
Owner review and GitHub check/thread state remain the separate merge gate; this
report does not claim independent owner approval. Category B limits follow.

## Remaining qualification boundaries

- HD coverage is a CONUS display envelope, not global aerial coverage or a precise
  national boundary. Border/ocean pixels and imagery seams vary by source. The
  mutable service metadata currently describes 2017–2021 CONUS acquisition; it
  does not establish a per-pixel capture timestamp. This is not live imagery.
- Source NAIP is generally 1m, but the qualified service cap delivers about 1.8m
  ground sampling near ORAS. Closer camera zoom only enlarges those pixels.
- Ellipsoid terrain, no added street labels/vector renderer, photogrammetry or
  3D buildings. ORAS retains its canonical elevated point; this is not a surveyed
  terrain or horizon model. Ion/Esri credentials and their live qualification
  remain owner-supplied future work, not a blocker for this keyless package.
- Desktop/mobile tests run in Chromium on laptop WSL, including software WebGL;
  viewport emulation is not a physical-phone or hardware-GPU performance claim.
  Network/camera/source timings are measured observations, not a latency SLA.
- Only normal viewport streaming/browser caching is implemented. No offline map
  download, imagery mirror or production capacity/load qualification is claimed.
- C5's inherited limits remain: generalized recent fire subset, CONUS radar,
  provider clock separation, worker-local backend caches and blocked launch
  access. No unrelated layer/provider workaround is introduced.
- Release infrastructure is intentionally deferred. No SSH/openclaw/storage
  repair, remote production deployment, Cloudflare, `oras.org` integration,
  ISS handoff, Moon/Mars or Phase D implementation occurred in this task.

Next HD action after this package: owner review of this PR, then a separately
bounded decision on a project-approved global imagery account/provider. Do not
start that package or merge this branch without owner review.
