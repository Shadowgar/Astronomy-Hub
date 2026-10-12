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


## C6-1A local imagery qualification — 2026-10-11

This is the owner-authorized imagery-only implementation on branch
`c6-1a-global-imagery-adoption-1`, based on verified merged main
`3e8276b705143b03af2c71658e8bc513d39b8e94`. PR #70 passed eight checks and
zero unresolved threads at exact head `5f7748cbccc8473c371d710b466b0c1395f6ae01`
before the explicitly authorized merge. Its duplicate-local-layer P2 and prior
retry/ledger corrections are preserved. Earlier sections of this file describe
historical C5 artifacts; they do not describe this candidate or activate terrain.

Local implementation/technical qualification is separate from owner visual
acceptance, merge approval, physical-device qualification and public release.
Single author review; no independent reviewer is claimed. Mandatory new provider
spending is $0. No subscriptions, account/token creation, deployment, SWE rebuild,
terrain/3D activation, dataset/volume migration or new dependency occurred.

### Actually executed source and ownership

Pin `e7707d9a0f34d9fbffc300023c319f95caa5be30` is clean and unchanged;
Earth Cesium remains 1.138.0. Actual public imports execute `maps/controller`
(MapSourceController), `maps/defaults` (filtered createDefaultMapSources),
`maps/catalog` and `maps/imagery` (fixture-qualified createIonImagery). The public
controller executes registry/credits transitively. Default OSM imagery factory
is reused with empty credential inputs and without its terrain/setup entries.
NASA/EOX/NAIP/PEMA use native Cesium factories. No full upstream app/Viewer import.
Terrain modules included transitively in defaults are not activated.

Registry: `nasa`, `eox-2016`, `usgs-naip`, `pema`, `osm`; optionally admitted `ion`.
`defaultId=unknownId=nasa`, `recoveryId=null`. `local` is a Hub wrapper state,
never a managed factory. Exactly one permanent bundled Natural Earth layer sits
at index0, at most one managed remote at index1, optional owned labels at index2,
and independent event overlays above imagery with their relative order retained.
Public setStack/subscribe/destroy own switching and lifecycle. No removeAll,
private upstream-controller mutation or replacement switching engine.

Fallback is PEMA → eligible NAIP → EOX2016 → NASA → existing local base;
OSM/ion → NASA. Geography can skip ineligible sources. Terminal local/total failure
exceptionally disposes the map controller, guards/listeners/labels and its layer,
while preserving Viewer/base/camera/events/bridge. Healthy caches survive ordinary
switches and eligible rejected-factory or tile-error retries. Only an explicit
retry of a successfully cached construction fallback requires remote-controller
recreation; remote caches are lost and bounded refetch follows. No second local
provider. Failed sources stay latched across camera movement until explicit
eligible Retry. 401/403 are not retried; 429 waits max(5min,Retry-After).

Auto uses altitude hysteresis and whole-view coverage; manual choice survives
Earth/Sky recreation for the browser-tab session until Auto. Metadata identifies
selected versus actual source, status, acquisition/product, native GSD, limits and
credits. Camera/scene UTC is separate from imagery acquisition time.

| Source | Actual admission/product |
| --- | --- |
| Natural Earth | One bundled global safety base; cartography, public domain |
| NASA | Existing GIBS static Blue Marble, nominal500m, maxL8; no current-photo claim |
| EOX | Exact 2016 cloudless mosaic, nominal10m, maxL14, ±85.051°; EOX/CC BY4.0 |
| NAIP | Native WMS1.3/3857, minL3/maxL18; verified whole-view CONUS footprint required; prior ORAS 2022-06-23/0.6m, unknown dates/GSD elsewhere |
| PEMA/PASDA | MapServer tiles, minL13/maxL20, verified ORAS interior only; prior ORAS tile2022/0.1524003m, exact flight day unknown; PEMA/PASDA/NV5 credits |
| OSM | Actual upstream raster factory with facade maxL18; manual streets, not aerial imagery; OSM contributors |
| Optional ion | Actual upstream factory, maxL18; explicit selected/configured asset; SDK asset/provider credits retained; fixtures only here |

PEMA bounds `[-79.6009,41.3051,-79.5654,41.3319]` are verified inside official
raster43001460PAN/OBJECTID6697. The one ordinary geometry integration request and
small normalized fixture are documented in the active C6 specification; no
statewide eligibility or new provider research is inferred. NAIP alpha no-data at
close levels triggers fallback; partially empty close tiles are marked partial.
Transparent low-level overview tiles may legitimately expose the safety base.
Other CONUS close views may request ≤1 bounded footprint query/minute, ≤32/runtime,
20s/1MiB; unverified/failed footprint requests retain global imagery.

Shared tile bounds: six active/runtime, four/host (EOX+labels share it), two NAIP,
PEMA or ion; two starts/sec, burst6; 12s tile and20s factory timeout. When ion is
active the global limit tightens to4 because tile hosts are opaque. Cached guards
pause reversibly, cancel pending tiles, suppress late callbacks and release slots.
The Cesium layer reload callback is retained only on capped OSM/ion facades, with
SDK attachment/removal compatibility proved after a reproduced failing case.
No bulk prefetch/download/mirror/offline pack/service-worker/proxy cache.

Ion is not active: no qualifying live token/account/protection was supplied or
created. Admission requires explicit opt-in, an existing attested publishable
browser token, imageryAsset, independently attested account-side zero-charge
protection, and cap1–120 accepted tile requests. Usage persists across renderer
recreation in tab storage; storage failure disables dispatch. Factory/SDK behavior
and cap accounting are deterministic fixture evidence only. Token presence,
client limits and the owner local-development eligibility assumption do not prove
account billing protection, aggregate quota compliance or public-use permission.

### Local preview and actual visual proof

Working preview: `http://127.0.0.1:4198/earth?date=2026-10-11T17%3A00%3A00Z`.
Standalone: `http://127.0.0.1:4198/earth-runtime/?orasProof=1`.
Gallery: `http://127.0.0.1:4198/gallery/`.
Only task-owned container `oras-c61a-owner-preview` publishes loopback4198;
configuration `/tmp/c6-1a-global-imagery-20261011/nginx-preview.conf` mounts own
frontend/artifact/gallery read-only and uses existing read-only service surfaces.
The `.mjs` MIME setting is confined to this preview container. To resume this
existing preview, `docker start oras-c61a-owner-preview`; to stop it, stop only
that named container. No owner volumes or production configuration changes.

Screenshots/JSON: `output/playwright/c6-1a` in the isolated worktree. Scene UTC
2026-10-11T17:00:00Z, matched1440×900/DPR1, numeric camera vectors/pose, renderer,
source/product/date/GSD/attribution, actual fallback, request ledger and page errors
are captured. Each `candidate-<scene>.json` and `baseline-<scene>.json` records its
artifact/input manifest. `captures.json` and `index.html` provide the comparison.
Candidate uses an explicit loopback-only camera/state proof seam, absent unless
`orasProof=1`; no Viewer object is exposed through the product bridge.

Baseline is preserved C5.7-D artifact822b1bae, served at4191. Its original compiled
bundle is hashed and only camera/time commands are appended in the disposable
capture browser; imagery/Viewer/render behavior and disk artifact are unchanged.
This instrumentation is disclosed in each baseline metadata file. Intermediate
captures and failures are retained in `initial`, `pre-session`, `pre-sdk-reload`
and the scratch logs; they are not promoted to final-artifact proof.

Required views: full Earth/NASA, North America/EOX2016, ORASwide1500m andclose350m/
PEMA Auto, NYC1500m/EOX fallback, Paris1500m/EOX, ocean1500m/EOX without regional HD.
Separate same-camera ORAS NAIP and PEMA comparisons record actual source/fallback;
NAIP timed out and the final comparison displays EOX; PEMA settled successfully.
Earlier NAIP attempts remained loading. None is relabeled as a successful aerial
capture. EOX provides global mapping but enlarges dated10m pixels at urban close
zoom; this is not universal sub-meter imagery. PEMA shows clear local roads,
building, pads and trees at ORAS. Owner acceptance of the actual images is OPEN.

### Reproducible artifact and preservation

Final Earth artifact: `a7be44c773d245f69ce38cd291275d43a7e8b5b06f065fe857e2e9cf4edc9eef`.
Source-input manifest: `63bb97c9d08e4acf888d38dd107ac75fbc089d802e0d457cb3856078b2461978`.
Two independent pinned Node24.14.0 Docker builds produce identical release/file
manifests:512 served files,11,820,351 bytes,111 dependency licenses. Installed
artifact is verified against source inputs and lock/runtime metadata; every
served byte is checked over local HTTP. Vite's existing >500kB Cesium chunk
warning remains; no build failure or dependency upgrade is hidden.

Merged-main C5.7-D822b1bae and rollbackca124164 remain preserved, along with all
intermediate task artifacts. Sky artifact remains
`b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d` without rebuild.
No changes to ViewerController, CameraController, EarthRuntime, RuntimeBridge,
VisualFoundation, protocol, SWE source/artifact, backend/science/catalog data,
provider probe ledger, context routing, dependency manifests or default config.
Preservation comparison proves68 original container IDs/configuration/state and81
volume identities/mountpoints unchanged; only the named task preview container
was added. Docker's presentation-order differences are normalized, not described
as mutations. Owner checkout remains dirty only at `.vscode/settings.json`, hash
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
PR #67 stays CLOSED/unmerged at `ebdad3124fe470e3a09e369d3a56e998f29740fb`.

### Commands and results

Commands run from the isolated repository unless a frontend cwd is shown. Raw
logs, red/green attempts, manifests and preservation proof are in
`/tmp/c6-1a-global-imagery-20261011`; copied handoff evidence is in gallery
`qualification/`. Document/manifest/link checks PASS:55 checkpoint Markdown files,1441 relative
references,8 packs,67 capability records,51 source entrypoints,413 audit links and
60 heading fragments; whitespace PASS. File hashes and committed source binding make capture lineage
reviewable without repeating provider probes.

```bash
# Existing pinned upstream must be available; never substitute another pin.
docker run --rm --network none --read-only --tmpfs /tmp \
  -v "$PWD:/hub:ro" -v /var/tmp/oras-cesium/gods-eye:/var/tmp/oras-cesium/gods-eye:ro \
  -w /hub node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 \
  sh -c 'node --test --test-isolation=none $(find tests/earth -maxdepth 1 -name "*.test.mjs" ! -name export-boundary.test.mjs | sort)'
node tests/earth/export-boundary.test.mjs
# Existing backend image, readonly source, network none, PYTHONDONTWRITEBYTECODE=1:
python -m pytest tests/validation/test_architecture_manifest.py tests/validation/test_reconciliation_docs.py tests/test_local_earth_artifact.py -q -p no:cacheprovider
npm --prefix frontend run type-check
npm --prefix frontend run test -- tests/workspace.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/skyEngineImportBoundary.test.js
# frontend cwd, installed preview; separate targeted runs retained:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4198 npx playwright test tests/e2e/earthGlobalImagery.spec.ts --workers=1 --output=/tmp/c6-1a-global-imagery-20261011/browser-sdk-results
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4198 npx playwright test tests/e2e/earthGlobalImagery.spec.ts --grep 'actual upstream OSM' --workers=1 --output=/tmp/c6-1a-global-imagery-20261011/browser-osm-qualified-results
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4198 npx playwright test tests/e2e/earthAppearance.spec.ts --workers=1 --output=/tmp/c6-1a-global-imagery-20261011/browser-appearance-qualified-results
# Independent builds (n=1,2):
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/tmp/c6-1a-global-imagery-20261011/earth-qualified-1 bash scripts/runtime/build_owned_earth.sh
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/tmp/c6-1a-global-imagery-20261011/earth-qualified-2 bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /tmp/c6-1a-global-imagery-20261011/earth-qualified-1
python3 scripts/runtime/earth_artifact.py install --source /tmp/c6-1a-global-imagery-20261011/earth-qualified-1
python3 scripts/runtime/earth_artifact.py verify
npm --prefix frontend run build
C6_CAPTURE_VARIANTS=candidate node scripts/validation/earth-mapping/capture.mjs
python3 /tmp/c6-1a-global-imagery-20261011/served-proof.py
python3 /tmp/c6-1a-global-imagery-20261011/preservation.py
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
```

Results: DockerEarth61PASS/0FAIL/0SKIP; host export1PASS; backend/doc/artifact26PASS
plus36subtests; focused frontend9PASS/3files; typecheck/buildPASS. Final-artifact
source/browser regression3PASS plus corrected SDK/labels1PASS (4total). The first
OSM browser failure reproduced the SDK facade reload incompatibility; a subsequent
layer-order assertion at a full-Earth view correctly encountered EOX geographic
fallback. Corrected test uses an admitted regional view; both failed attempts are
retained. Final appearance/navigation gate: 4PASS/0FAIL (desktop/mobile stars/missing-face fallback and five serial Sky/Earth cycles each); eight final-artifact browser cases total.

Focused red/green additionally covers cancellation of an old paused SDK provider,
latched Auto failure after cooldown, rejected factory retry versus cached
successful construction fallback, listener/resource cleanup, shared budgets,
401/403/429, one local layer, footprints, durable session usage and ion factory
fixtures. Historical `earthHdMapping.spec.ts` is retained behind explicit
`ORAS_LEGACY_HD_ARTIFACT=1` for its preserved artifact contract; it was not run or
counted as current qualification. Current mapping tests replace its old provider
assumptions. No full browser campaign, physical phone/GPU, live ion, public
capacity/load, production or provider-permission qualification is claimed.
Initial host Python lacked pytest; read-only existing backend-image execution
passed. An omitted upstream Docker mount, host child-process sandbox restriction
and host Node22 unsupported isolation flag were corrected in the authoritative
commands; failed attempts remain in scratch and are not counted as passes.

### Changed files and context declaration

Only these bounded source/UI/tests/artifact metadata/authority/evidence files
changed; no fixture masquerades as live visual proof:

- `AGENTS.md`
- `docs/DOCUMENT_INDEX.md`
- `docs/MASTER_PLAN.md`
- `docs/README.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md`
- `docs/execution/C6_GLOBAL_MAPPING_SPEC.md`
- `docs/execution/EARTH_CAPABILITY_PLAN.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md`
- `frontend/public/runtime-versions.json`
- `frontend/src/features/workspace/DiagnosticsSurface.tsx`
- `frontend/tests/e2e/earthGlobalImagery.spec.ts`
- `frontend/tests/e2e/earthHdMapping.spec.ts`
- `integrations/renderers.lock.json`
- `runtimes/earth-runtime/core/AdmittedMapSources.mjs`
- `runtimes/earth-runtime/core/ImageryController.mjs`
- `runtimes/earth-runtime/core/ImagerySelectionPolicy.mjs`
- `runtimes/earth-runtime/core/LocalVisualProof.mjs`
- `runtimes/earth-runtime/core/displayConfig.mjs`
- `runtimes/earth-runtime/core/imageryRequests.mjs`
- `runtimes/earth-runtime/core/imagerySession.mjs`
- `runtimes/earth-runtime/entry.mjs`
- `runtimes/earth-runtime/index.html`
- `runtimes/earth-runtime/style.css`
- `scripts/runtime/record_owned_earth.py`
- `scripts/validation/earth-mapping/capture.mjs`
- `tests/earth/admitted-map-sources.test.mjs`
- `tests/earth/display-config.test.mjs`
- `tests/earth/imagery-controller.test.mjs`
- `tests/earth/imagery-policy.test.mjs`
- `tests/earth/imagery-requests.test.mjs`
- `tests/earth/imagery-session.test.mjs`
- `tests/earth/page-lifecycle.test.mjs`
- `tests/fixtures/earth/pema-oras-footprint.json`

Context loaded in Default Mode: always CORE/LIVE, then manifest union
`docs_change` + `frontend_change` + `validation` (58 documents). Governing
`AGENTS.md`, `docs/context/CONTEXT_MANIFEST.yaml` and the explicitly required JSON
probe ledger were also read. No full docs scan or extra document outside this
context set was used. Exact initially loaded hashes are retained in
`qualification/context.json`. The loaded document list follows:

- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
- `docs/DOCUMENT_INDEX.md`
- `docs/DOC_INVENTORY.md`
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`
- `docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md`
- `docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md`
- `docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md`
- `docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md`
- `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md`
- `docs/architecture/ARCHITECTURE_OVERVIEW.md`
- `docs/architecture/ENGINE_SPEC.md`
- `docs/architecture/ENGINE_CATALOG.md`
- `docs/architecture/OBJECT_MODEL.md`
- `docs/architecture/DATA_CONTRACTS.md`
- `docs/architecture/INGESTION_STRATEGY.md`
- `docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/README.md`
- `docs/MASTER_PLAN.md`
- `docs/product/PRODUCT_VISION.md`
- `docs/architecture/STACK_OVERVIEW.md`
- `docs/ASTRONOMY_HUB_DIAGRAM.md`
- `docs/features/FEATURE_CATALOG.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/architecture/decisions/0001-universal-application-state.md`
- `docs/architecture/decisions/0002-swe-sky-renderer.md`
- `docs/architecture/decisions/0003-gods-eye-earth-runtime.md`
- `docs/architecture/decisions/0004-additive-earth-extensions.md`
- `docs/architecture/decisions/0005-cesium-planetary-direction.md`
- `docs/architecture/decisions/0006-controlled-renderer-handoffs.md`
- `docs/architecture/decisions/0007-immutable-upstream-source.md`
- `docs/architecture/decisions/0008-provider-licensing-boundaries.md`
- `docs/execution/EARTH_CAPABILITY_PLAN.md`
- `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md`
- `docs/execution/C6_GLOBAL_MAPPING_SPEC.md`
- `docs/architecture/decisions/0009-owned-earth-feature-reuse.md`
- `docs/audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md`
- `docs/audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md`
- `docs/audits/EARTH_CAPABILITY_RECONCILIATION_INPUT_2026-10-05.md`
- `docs/audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md`
- `docs/audits/GODS_EYE_PUBLIC_EXPORT_AUDIT_2026-10-05.md`
- `docs/audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md`
- `docs/audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md`
- `docs/validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md`
- `docs/audits/GODS_EYE_MASTER_ADOPTION_BLUEPRINT_2026-10-10.md`
- `docs/audits/EXTERNAL_COMPONENTS_AND_DATA_GAPS_2026-10-10.md`
- `docs/audits/EARTH_VISUAL_FOUNDATION_DECISION_PACKET_2026-10-10.md`
- `docs/audits/GODS_EYE_ROADMAP_REPRIORITIZATION_PROPOSAL_2026-10-10.md`
- `docs/audits/MASTER_ADOPTION_AUDIT_VALIDATION_2026-10-10.md`
- `docs/validation/C5_7_D_EARTH_APPEARANCE_EVIDENCE.md`
- `docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md`
- `docs/architecture/TONIGHT_CONTRACT.md`
- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_ACCEPTANCE.md`

### Owner handoff and stop gate

Review the working Hub preview and comparison gallery; decide whether global
NASA/datedEOX views, PEMA ORAS detail, manual/Auto transitions and conservative
unverified-region fallback are acceptable. Review NAIP's actual timeout/partial
behavior and the deliberate source/request caps. PEMA release rights and live ion
account/protection remain unverified; owner local-development assumption is not
public-release proof. Software Chromium/ANGLE SwiftShader desktop/mobile viewport
proof is not physical-device or hardware-GPU qualification. Weather/fire/radar
ordering and Earth/Sky state contracts remain preserved; inherited provider
unavailability is recorded without claiming those services were repaired.

Open one C6-1A implementation PR after final checks. DO NOT MERGE. Stop for owner
actual-mapping visual review and separate merge approval. C6-2 terrain and C6-3
3D require separate packages/authorization; do not begin them or further provider
research from this handoff.


## C6-1A automatic imagery correction — 2026-10-11

Owner explicitly replaced PR #71 manual UX at reviewed head
`72a687ef926c226e3cd546521c1ae4b38e288d39`. Same branch
`c6-1a-global-imagery-adoption-1`, verified merged base
`3e8276b705143b03af2c71658e8bc513d39b8e94`. Single agent; Default Mode.
The prior manual-UX qualification above is preserved history, superseded for
current UX/recovery by this section and the [active C6 specification](../execution/C6_GLOBAL_MAPPING_SPEC.md#active-c6-1a-imagery-package--2026-10-11).
DO NOT MERGE; stop for owner visual review. Terrain, 3D, deployments, new
provider/account/token/billing work remain excluded; mandatory spending $0.

### Loaded context and ownership

CORE/LIVE first, manifest next; union `docs_change`, `frontend_change`,
`validation`, `review`: 58 unique listed documents, no extra governing documents
or broad docs scan. Exact paths and pre-edit hashes are in ignored local
`output/playwright/c6-1a/auto/qualification/context.json`. Architecture, validation
and ADR0009 boundaries retain one Hub Viewer and actual pinned public God's Eye
`MapSourceController`, filtered defaults/catalog/imagery factories and transitive
registry/credits. Source remains clean at
`e7707d9a0f34d9fbffc300023c319f95caa5be30`; Cesium1.138.0. No second engine,
Viewer, custom switching algorithm, upstream edits or dependency change.

Ordinary standalone/embedded Earth and Hub diagnostics have no source/Auto/
resolution selector, source Retry, labels checkbox or persistent source preference.
The read-only footer disclosure retains actual source/product/date/GSD/status and
mandatory credits. Legacy session mode is discarded while ion counting remains
durable. Loopback `orasProof=1` commands are deterministic developer interfaces;
known-entity selection uses existing admitted entities, never production fixtures.

Automatic ID selection preserves verified whole-view coverage and altitude
hysteresis: NASA overview, EOX2016 regional/global detail, covered U.S. NAIP, and
finer PEMA within the exact verified ORAS extent. The source/date/detail limits
in the specification remain truthful. One permanent Natural Earth base and at
most one managed remote layer; independent event overlays keep ordering.

### Regression evidence and recovery

Saved RED: initial stationary camera made zero metadata requests; stale camera
metadata was cached; expired source cooldown never recovered. Saved GREEN proves
stationary initialization, valid/missing/timeout footprints, partial-view refusal,
source failure, late camera/selection/teardown results, and shared concurrency.
JSON-point geometry fixes a current service behavior; genuine partial footprints
can qualify later narrower views without another request, but never activate NAIP
for an unverified whole view. One query/minute,20s,1MiB,32-record runtime cap remain.

Automatic recovery observes source60s cooldown/backoff to15min, host429
max(5min,Retry-After), drained active requests and budget guards.401/403 remain
closed. Successful cached-provider tile retries retain the controller/listeners;
rejected factories retain healthy caches. Only a successfully cached construction
fallback needs public destroy/recreation to evict the original successful fallback
entry; that costs remote caches/refetch, never the safety base. Loaded imagery
remains attached while a factory resolves. No private field mutation/removeAll.
Extra RED/GREEN tests prove no idle/unauthorized render wake and that the latest
native activation loads even while an obsolete factory remains pending.

### Final artifact and preserved identities

Earth `bdfa4089e0ab3d77fa3f987e1a02c3f2b7fd7896f8f4804e439a762f1600c042`;
inputs `6c50f84ca59360e7ada685ad0ebf5255469eb98ea6fad5550ae33ca10a06bfa6`.
Two independent Docker builds are byte-identical including release.json:
512 payload files + release;111 license records;11,820,090 payload bytes.
Installed input/hash verification and all512 HTTP-served hashes pass. Build logs
retain the established Vite>500kB chunk warning; no physical performance inference.
Previous manual/smoke candidates were retained in named ignored artifact directories.
C5.7-D baseline `822b1baeb933636cc5570077e905b57a029ea003902173b48142e0bbaf8fa552`
and rollback `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`
remain served at4191/4194. Sky
`b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`
is unchanged and not rebuilt. Preservation verifies original68 container identities,
mounts/state/ports and81 volumes/datastores; only the existing task-owned preview
was restarted. Owner checkout remains dirty only at unchanged settings SHA
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
PR #67 remains closed/unmerged at
`ebdad3124fe470e3a09e369d3a56e998f29740fb`; no branch/evidence mutation.

### Commands and local evidence

Scratch `/tmp/c6-1a-auto-20261011`; reviewed local evidence copied under ignored
`output/playwright/c6-1a/auto/qualification`. Exact logs include failed setup/test
attempts; no failed result is counted as a pass. Node tests execute the real
pinned controller in a declared VM/native-provider fixture. Mobile satellite/TLE
proof uses explicitly declared test fixtures. Live photography captures are separate.

```bash
# Worktree root; two independent pinned Docker builds
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/tmp/c6-1a-auto-20261011/earth-qualified-1 bash scripts/runtime/build_owned_earth.sh
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/tmp/c6-1a-auto-20261011/earth-qualified-2 bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /tmp/c6-1a-auto-20261011/earth-qualified-1
python3 scripts/runtime/earth_artifact.py install --source /tmp/c6-1a-auto-20261011/earth-qualified-1
python3 scripts/runtime/earth_artifact.py verify
npm --prefix frontend run build
docker restart oras-c61a-owner-preview
python3 /tmp/c6-1a-auto-20261011/served-proof.py
python3 /tmp/c6-1a-global-imagery-20261011/preservation.py
docker run --rm --network none --read-only --tmpfs /tmp -v /home/rocco/Astronomy-Hub/.worktrees/c6-1a-global-imagery-adoption-1:/hub:ro -v /var/tmp/oras-cesium/gods-eye:/var/tmp/oras-cesium/gods-eye:ro -w /hub node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 sh -c 'node --test --test-isolation=none $(find tests/earth -maxdepth 1 -name "*.test.mjs" ! -name export-boundary.test.mjs | sort)'
node --test tests/earth/export-boundary.test.mjs
npm --prefix frontend run type-check
npm --prefix frontend run test -- tests/workspace.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/skyEngineImportBoundary.test.js
docker run --rm --network none --read-only --tmpfs /tmp -e PYTHONDONTWRITEBYTECODE=1 -v /home/rocco/Astronomy-Hub/.worktrees/c6-1a-global-imagery-adoption-1:/app:ro -w /app astronomy-hub-backend:latest python -m pytest tests/validation/test_architecture_manifest.py tests/validation/test_reconciliation_docs.py tests/test_local_earth_artifact.py -q -p no:cacheprovider
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
# frontend working directory, installed Docker preview
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4198 npx playwright test tests/e2e/earthGlobalImagery.spec.ts tests/e2e/earthAppearance.spec.ts --workers=1 --output=/tmp/c6-1a-auto-20261011/browser-qualified
# Worktree root; matching unchanged baseline and automatic candidate cameras
C6_CAPTURE_SCENES=new-york-close C6_CAPTURE_VARIANTS=baseline node scripts/validation/earth-mapping/capture.mjs
C6_CAPTURE_VARIANTS=candidate node scripts/validation/earth-mapping/capture.mjs
```

The four bounded anonymous NAIP diagnostic requests (no retries;20s/1MiB each)
are retained in `qualification/diagnosis.json`: comma-point query returned unrelated
Florida geometry (not admitted); explicit JSON point returned the correct NYC
footprint (8.65s); existing matched ORAS WMS tile returned64730 bytes in10.29s;
a whole-view-envelope query returned504 (not adopted). Source service timing can
approach/exceed the unchanged12s tile guard. No fake NAIP capture or widened limit.
Public release eligibility remains unverified for PEMA; ion was never activated.
Client counting/attestation is not verified account-side zero-charge protection.

Local owner preview: `http://127.0.0.1:4198/earth?date=2026-10-11T17%3A00%3A00Z`;
standalone `http://127.0.0.1:4198/earth-runtime/`;
matched gallery `http://127.0.0.1:4198/gallery/auto/`.
Scene UTC2026-10-11T17:00:00Z,1440×900/DPR1; exact numeric camera/renderer/source/
input/request/credit/state JSON accompany PNGs. Baseline camera instrumentation
is read-only and retains the original served bundle hash. Preserved earlier
baseline captures are explicitly historical, matched to the same camera/time;
new close-NYC baseline is fresh. Chromium ANGLE SwiftShader is software proof,
not physical-device acceptance. Owner visual/merge acceptance remains pending;
C6-2/C6-3 never start from this handoff.


Final bounded software qualification: **PASS** —71 Docker Earth tests plus1 host
export-boundary test;9 focused frontend tests; TypeScript;26 Docker document/
artifact tests plus36 subtests;11 installed-preview browser cases including five
serial Sky/Earth cycles each at desktop/mobile, missing starbox face/recovery,
native source ownership/caching/labels diagnostics, stationary NAIP fixture and
standalone/embedded narrow details/Focus/Track/Stop/credits. These counts describe
fixtures/software proof, not physical-device or live-provider acceptance. Final
manifest/reference/whitespace results and live capture outcomes are appended below.


Final live proof verifies **eight matched pairs** (16 PNG/JSON captures), all
candidate inputs bound to the final artifact; exact camera/UTC/viewport matches,
zero page errors, one safety allocation, at most one managed remote, no labels,
no ion requests, global peak≤6 and NAIP/PEMA peak≤2. Actual sources: NASA from
space; EOX over North America; PEMA at ORAS1500m/350m; EOX at NYC1500m (partial
NAIP footprint), Paris and remote ocean; NAIP at NYC350m after automatic JSON-point
qualification. No source control was used. Current close-NYC footprint is
`m_4007424_ne_18_060_20190917`; its filename is coverage evidence, not verified
acquisition date/GSD for every WMS pixel.

PEMA shows property roofs/paths/trees automatically and settles at both scales.
NAIP shows buildings/streets automatically, with26 loaded/0 failed tiles and2
active requests at the final screenshot. **NAIP remained loading after the bounded
120s wait (137.4s capture including qualification/software screenshot work); it is
not a fully settled or≤5s performance pass.** The first-round NAIP loading view
and EOX failure/NASA fallback remain in `output/playwright/c6-1a/auto-first-qualified`;
one bounded same-camera recapture confirmed settled EOX over North America.
No tile/factory timeout or request/concurrency limit was increased. Only the
screenshot wait ceiling for close NYC was120s. Paris/ocean retain coarse10m
EOX detail; no claim of global aerial HD, terrain or 3D improvement. Owner visual
and performance acceptance remain open despite green deterministic tests.

Final document checks PASS:296 manifest entries/8 packs;55 Markdown checkpoint
documents;1442 relative references with16 registered historical exemptions;9 ADRs;
67 capability records/51 source entrypoints/413 reconciliation links/60 fragments;
whitespace clean. `qualification/capture-proof.json` records exact live status,
request statistics, products/date uncertainty, credits and remaining gates.

Changed files for this correction (earlier PR implementation remains separate
history): AGENTS.md; docs/DOCUMENT_INDEX.md; docs/README.md;
docs/context/LIVE_SESSION_BRIEF.md; docs/execution/C6_GLOBAL_MAPPING_SPEC.md;
docs/execution/PROJECT_STATE.md; this existing evidence file;
frontend/public/runtime-versions.json; integrations/renderers.lock.json;
frontend/src/features/workspace/{DiagnosticsSurface,WorkspaceShell}.tsx;
frontend/tests/e2e/earthGlobalImagery.spec.ts;
runtimes/earth-runtime/core/{ImageryController,LocalVisualProof,imagerySession}.mjs;
runtimes/earth-runtime/{index.html,style.css};
scripts/validation/earth-mapping/capture.mjs;
tests/earth/{imagery-controller,imagery-session}.test.mjs.

Next action is owner review of the automatic mapping experience/limitations and
explicit merge approval for the delivered exact head. No later C6 package is
activated. Both Codex P2 responses address the stationary-camera path and removed
mobile panel; final GitHub head/check/thread state is delivered with the PR handoff.


### Follow-up P2: footprint metadata429 recovery

A third Codex P2 arrived after the first automatic correction was pushed at
`27b0d2af9e8bba8372656f376435fb8e0e78d95b`. That delivery and its artifact/capture
results above remain historical evidence, preserved in ignored
`output/playwright/c6-1a/auto-pre-429`. The current candidate below supersedes its
artifact identity without changing source policy, budgets or manual-control removal.

RED reproduced a stationary NAIP footprint response429 with Retry-After600:
after600s the request count remained1 and EOX stayed active. The narrow correction
registers metadata429 with existing failed-source recovery. GREEN proves no query
at300s, one automatic new query after600s, valid-footprint NAIP activation without
a camera move, and one safety allocation. Healthy controller/provider caches and
existing host/metadata guards remain intact;401/403 still fail closed.

Current Earth `387434055696d93867f80a49b6ea380284493cc9ebe38ee9edb31896cffd3e0c`;
inputs `66070ac1ef3483c3f35bf0edfd67be2e688f71cd4b9a7acb63e4f7eb13c3cc22`.
Two independent pinned Docker builds (`earth-429-1`, `earth-429-2`) are identical:
512 payload files,11,820,135 payload bytes;111 license records. Build warning
remains the established Vite>500kB chunk notice. Preceding artifact is retained as
`data/runtime-artifacts/earth-c61a-pre-429-bdfa4089e0ab3d77`. Source pin, safety
base, Sky, merged C5.7-D and rollback identities are unchanged.

Follow-up changed files only: ImageryController.mjs, imagery-controller.test.mjs,
runtime-versions.json, renderers.lock.json, LIVE_SESSION_BRIEF.md, PROJECT_STATE.md
and this evidence file. Existing script/commands above are reused with429-named
output paths, plus saved `red-metadata-429.log`/`green-metadata-429.log`.

Refreshed deterministic qualification PASS:72 Docker Earth tests plus1 host
export test (18 controller regressions);9 frontend tests;TypeScript;26 Docker
document/artifact tests plus36 subtests. Both manifest/reference validators and
whitespace pass with the unchanged counts above. Installed verification and all512
served file hashes match the new artifact. Original68 containers/81 volumes, owner
settings hash, immutable upstream source, scientific data and rollback artifacts
pass the existing preservation check. No new provider research or diagnosis.

Refreshed installed-browser qualification PASS:11 cases,5.1min, including five
serial Sky/Earth cycles each at desktop/mobile, native provider ownership/cache/
teardown/stationary coverage and narrow standalone/embedded details/Focus/Track/
Stop/credits. Software Chromium/SwiftShader only; no physical-device claim.

Fresh current-artifact live captures verify eight matched camera/UTC/viewport
pairs, zero page errors, one safety allocation, at most one managed remote, no
ion requests and unchanged concurrency caps. NASA overview, EOX North America/
wider NYC/Paris/ocean and PEMA both ORAS scales settled. Close NYC qualified the
correct footprint and loaded23 NAIP tiles, but one tile failure plus one cancellation
triggered automatic EOX fallback; NAIP peak2,global peak5. Capture was still not
fully settled at the bounded120s window (131.3s including software screenshot work).
Exact upstream failure cause is not established by these counters. This is genuine
fallback evidence, NOT a fresh fully successful NAIP visual/performance pass.
Earlier same-camera NAIP buildings/streets proof at head27b0d2 remains explicitly
preserved in `auto-pre-429`; it is not relabeled as the new artifact. No provider
limit was widened or extra provider research/capture retries performed.

Current screenshot/JSON/gallery paths remain `output/playwright/c6-1a/auto`;
`qualification/capture-proof.json` distinguishes source readiness from settled
globe tiles and records actual fallback, date/detail uncertainty and request
counters. The recorded source binding verifies all39 captured runtime inputs
against the delivered commit, retaining the original parent-at-capture record.
All three P2 corrections are subject to fresh GitHub reply/thread/check verification
at handoff. Owner visual/performance acceptance remains open; do not merge or
start terrain/3D.


## C6-1A performance and automatic coverage correction — 2026-10-12

Owner request continues existing PR #71/branch `c6-1a-global-imagery-adoption-1`,
verified starting head `f978491df2baf6dcad6c54b9006086e87c2c9af4`, merged base
`3e8276b705143b03af2c71658e8bc513d39b8e94`. Single agent, Default Mode; no new
PR/phase/provider audit. Performance/usability precede further Earth work. No
merge, terrain/buildings, SWE rebuild, billing/accounts/tokens or deployment.
Mandatory spend $0; ion inactive; PEMA public-release permission still outstanding.

CORE/LIVE first, then manifest union `docs_change`, `frontend_change`, `validation`,
`review`:58 named documents and hashes in ignored performance qualification
`context.json`; no extra governing documents or broad docs scan. Existing evidence
was inspected first. The preserved diagnostic ledger already showed8.65–10.29s
USGS responses near12s timeout; the new comparison measures the same admitted
sources, not a new provider selection/research effort.

### Proven bottlenecks and bounded corrections

- PEMA decoded tiles took approximately0.05–0.4s, while token waiting exceeded4s.
  The close view requested67 tiles;2 starts/sec alone imposes approximately30s
  beyond the initial burst. Native construction was below1ms in this sample.
  Shared rate becomes4 starts/sec, burst6 unchanged; active caps remain6/runtime,
  4/host,2 NAIP/PEMA. No concurrency increase or extra offscreen downloading.
- NYC coverage took10.57s in a matched baseline; one detail tile took8.84s while
  another timed out at12.25s. A single failure discarded aerial detail and cancelled
  another useful request. NAIP tile deadline becomes20s; other tiles stay12s.
  Native aerial fallback uses3 qualifying error notifications; isolated transient
  faults retain partial detail.401/403/429 still close immediately and preserve
  Retry-After/backoff. Guard/SDK duplicate reports of the same error object are
  suppressed, so one physical failure cannot count twice.
- Replacing global imagery before slow aerial pixels arrived exposed only the
  cartographic base. The existing imagery factory now retains the current global
  layer while at most2 visible-center native WMS samples prepare: L14 ancestor and
  L18 detail. Same budget,≤2 active,20s combined deadline including admission wait.
  Native Cesium owns ancestor/refinement/texture mapping; no custom renderer or
  second switching engine/layer. Two256px decoded images are reused once for exact
  native requests, or released at disposal (≤0.5MiB RGBA before decoder overhead).
  This is bounded visible readiness, not background discovery, bulk prefetch,
  persisted imagery, arbitrary providers or a new service. Failed readiness uses
  the pin's existing construction fallback and retains an identical cached global
  layer. Successful cached construction-fallback recovery still exceptionally
  recreates the public controller and loses remote caches after bounded cooldown;
  the safety base and source backoff remain. This pin limitation is not hidden.
- One completed tile previously toggled ready/loading while the viewport refined.
  Status now distinguishes partial/slow/ready, with an explicit slow-detail note
  after15s. Interface readiness remains independent of remote tile settlement.
- Wrapped rectangles split at±180 before coverage checks; Fiji/Aleutians keep EOX.
  Center-pixel globe intersection, with public ellipsoid startup fallback, supplies
  coverage location instead of eye subpoint. No-ground/polar views keep global
  safety. Camera pose/extent identifies stale results; mesh refinement alone does
  not invalidate stationary metadata. Observer/camera ownership is unchanged.
- Real hard host errors during a pending replacement remain registered for
  cooldown recovery. Owned late decoded bitmaps close after cancellation.

The500ms health/status wake and native priority/refinement settings are retained:
measured CPU submission cost and responsive input do not justify a replacement
render loop or scheduler. Identical-source selection preserves the pin's loaded
layer/provider caches. Source dates/GSD/credits, request ceilings, one permanent
Natural Earth base,≤1 managed remote and independent event order remain.

### Evidence, methodology and acceptance budgets

Root `output/playwright/c6-1a/performance`; scratch `/tmp/c6-1a-performance-20261012`.
Before is the preserved installed/served starting artifact
`387434055696d93867f80a49b6ea380284493cc9ebe38ee9edb31896cffd3e0c`; after is
`599dd5c6da6fbcdd22d3b2794639f1db31d9ca54a04c47cbfab31b9d9a66aaa3`, inputs
`e95ee664c56a8915413d4c388bd9a63e95cdcf1d592b34c245995ba8526476bb`.
Failed/intermediate sources, logs and captures are retained separately, including
center-only readiness whose green surround failed useful-presentation expectations.

Seven scenes,1440×900/DPR1, matching numeric camera and UTC2026-10-11T17:00:00Z.
Cold=fresh browser context/native caches; warm=same-runtime5% zoom-out and return,
retaining native provider/tile caches. Identical bundle instrumentation disables
HTTP cache in both; this is NOT an undisclosed prewarmed-cache benchmark. Host
network is unshaped and external server latency varies. Serial live measurements
avoid parallel software-renderer contention.30s sampling windows are unchanged
before/after; raw pending counts, later command/screenshot wall time and missed
settlement stay visible. Warm settlement has a disclosed1.5s observation floor;
0ms warm first-use means cached imagery, not an HTTP response. Screenshot work is
separately represented in wall time; tile milestones derive from monotonic telemetry.

The committed `scripts/validation/earth-mapping/performance.mjs` instruments only
loopback proof captures: bounded events/tiles/frames/input/long-task arrays; Chrome
request timing/bytes; metadata and construction phases; native tile queue and
completion; source transitions; first remote and effective-detail tile milestones;
settlement; keyboard response. No Viewer is exposed to the product. Query wrapper
duration includes subsequent activation/readiness; pure query network duration
comes from request timing and is distinguished in the comparison. First-detail
tile is a technical proxy; actual recognizable detail is verified from PNGs,
never inferred solely from advertised GSD. CPU pre/post-render span is submission
cost, not physical-device GPU FPS. Existing shell/Viewer/first-image timings are
reported as their named milestones, not renamed as complete-photo settlement.

Initial review budgets under the existing C6 framework: usable local scene≤2s;
first useful remote improvement≤5s when provider responds; responsive controls
throughout; fast-source viewport settle≤30s; bounded20s visible readiness with
truthful global fallback; no indefinite whole-interface spinner. Existing median
CPU frame targets33ms desktop/50ms mobile emulation are software screening only;
physical acceptance is separate. USGS5s aerial objective is not claimed when
metadata/WMS exceed it. Public-release rights and owner speed/visual acceptance
remain OPEN regardless of green software checks.

Final measured table, exact commands/results, artifact/served proof and GitHub
receipt are recorded below and in the ignored qualification handoff.

Qualification retained the first installed-browser failure (10 passed/4 failed):
active403 promise rejection paused the guard before checking active state, skipping
local fallback; and the restarted temporary preview lacked its bulk Sky-data
route. RED/ GREEN now preserves pre-pause activity and tests the real guarded
promise path, separate from SDK-event fixtures. Host Node22 rejected the Node24
isolation flag; Docker Node24 supplies the authoritative50-focused-case result.
No failed attempt is counted as a pass. The task-owned preview now reads original
Sky data through one new task-owned static container with read-only binds, no
SWE build or owner service restart. Other69 original container identities/mounts/
ports and81 volumes remain verified; mount-array order is normalized for comparison.

### Final matched results and remaining limits

| View | Cold settlement before | Cold settlement after | First remote after | Actual after |
| --- | ---: | ---: | ---: | --- |
| full-earth | 2.10s | 2.01s | 0.75s | nasa |
| north-america | 28.66s | 15.76s | 1.05s | eox-2016 |
| oras-wide | 16.96s | 9.24s | 0.37s | pema |
| oras-close | not settled | 22.49s | 0.36s | pema |
| new-york-close | not settled | 20.17s | 0.73s | eox-2016 |
| paris | 16.66s | 9.27s | 0.82s | eox-2016 |
| remote-ocean | 16.88s | 9.35s | 0.40s | eox-2016 |

Before and after windows are30s, not120s. Unsettled before values are retained
unknown/censored bounds, not invented timings. Final NYC coverage did not qualify
within20s; EOX remained usable and final source/viewport settled at20.17s. This is
a real controlled global fallback, not successful final NAIP aerial qualification.
Earlier9b54 candidate live proof is preserved separately: metadata and visible
readiness took approximately18s+11.25s; bothL14/L18 samples were consumed, providing
a genuine coarse aerial surround and sharp central detail while pending tiles
refined. It remained partial at30s. No imagery/date/fully settled result is
fabricated or relabeled as the final599d artifact. USGS5s aerial, complete-city
settlement and physical-device acceptance remain OPEN. PEMA property imagery
remains visibly sharp and settles; EOX2016 remains coarse close-view imagery.

All14 final cold/warm pairs have matching numeric camera/UTC/viewport, no page
errors, responsive keyboard change, one local allocation,≤1 managed remote/no
labels/no ion, and unchanged active caps. Cold shell interactive and CPU/input
telemetry are in `comparison.json`; render submission spans are software evidence.
Warm healthy-source first-use is cached and settlement is at the disclosed1.5s
observation floor. NYC service variability changes the admitted source, so its
before/after timing is not a causal claim of faster aerial delivery.

Current artifact599dd5c6da6fbcdd22d3b2794639f1db31d9ca54a04c47cbfab31b9d9a66aaa3,
inputs e95ee664c56a8915413d4c388bd9a63e95cdcf1d592b34c245995ba8526476bb.
Two independent pinned builds are identical;512 payload files+release;40 source
inputs;111 license records;11,824,943 payload bytes. Installed and all512 served
hashes verify. Standard Vite>500kB warning is retained. Prior starting/failed/
intermediate artifacts remain named and preserved. No SWE rebuild.

Fresh Docker Earth suite:91 passed,0 failed,0 skipped; pinned Node24.14.0.
Host export test:1 passed; frontend9 passed and TypeScript clean; Docker
document/artifact suite26 passed+36 subtests. Final browser/check/thread receipts
are appended at delivery; the failed14-case attempt remains separately retained.

Exact qualification commands (worktree root unless noted):

```bash
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/tmp/c6-1a-performance-20261012/earth-hardened-1 bash scripts/runtime/build_owned_earth.sh
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/tmp/c6-1a-performance-20261012/earth-hardened-2 bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /tmp/c6-1a-performance-20261012/earth-hardened-1
python3 scripts/runtime/earth_artifact.py install --source /tmp/c6-1a-performance-20261012/earth-hardened-1
python3 scripts/runtime/earth_artifact.py verify
npm --prefix frontend run build
docker restart oras-c61a-owner-preview
PERF_VARIANT=after-hardened PERF_WAIT_MS=30000 node scripts/validation/earth-mapping/performance.mjs
python3 /tmp/c6-1a-performance-20261012/compare.py
python3 /tmp/c6-1a-performance-20261012/served-proof.py
python3 /tmp/c6-1a-performance-20261012/preservation.py
docker run --rm --network none --read-only --tmpfs /tmp -v /home/rocco/Astronomy-Hub/.worktrees/c6-1a-global-imagery-adoption-1:/hub:ro -v /var/tmp/oras-cesium/gods-eye:/var/tmp/oras-cesium/gods-eye:ro -w /hub node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 sh -c 'node --test --test-isolation=none $(find tests/earth -maxdepth 1 -name "*.test.mjs" ! -name export-boundary.test.mjs | sort)'
node --test tests/earth/export-boundary.test.mjs
npm --prefix frontend run type-check
npm --prefix frontend run test -- tests/workspace.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/skyEngineImportBoundary.test.js
docker run --rm --network none --read-only --tmpfs /tmp -e PYTHONDONTWRITEBYTECODE=1 -v /home/rocco/Astronomy-Hub/.worktrees/c6-1a-global-imagery-adoption-1:/app:ro -w /app astronomy-hub-backend:latest python -m pytest tests/validation/test_architecture_manifest.py tests/validation/test_reconciliation_docs.py tests/test_local_earth_artifact.py -q -p no:cacheprovider
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
# frontend working directory, corrected installed Docker preview:
EARTH_PROOF_OUTPUT=../output/playwright/c6-1a/performance/qualification/browser-screenshots PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4198 npx playwright test tests/e2e/earthGlobalImagery.spec.ts tests/e2e/earthAppearance.spec.ts --workers=1 --output=/tmp/c6-1a-performance-20261012/browser-hardened
```

Provider spending$0;no account/token/billing or production/SSH/Cloudflare action.
Original69 container IDs/mounts/ports and81 volumes verify, with only task-owned
preview restarted and one new read-only Sky-data static helper. Owner settings
SHA6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0 unchanged.
Immutable pin, backend/science/protocol/dependencies/Viewer/camera/bridge/config/
probe ledger/context manifest, C5.7-D/rollback and closed aircraft work are preserved.
All user-facing source selection remains automatic. No subsequent C6 authorization.

Final cold shell-interactive range248–365ms; median CPU render-submission
span2.5–3.2ms. All keyboard probes change camera height, but software input-to-rAF
latency includes an observed492ms maximum; this outlier is retained, not called
physical responsiveness/FPS acceptance. Network response, budget wait, native
completion/processing and CPU spans are separately exposed; GPU completion is not
precisely isolated. Request/render telemetry and long-task records remain raw.

Read-only Sky data alone restored native rendering but the temporary preview also
needed `application/javascript` for existing `/runtime-bridge` and `/packages`
`.mjs` assets. The restored Sky handshake now reports ready. Earlier navigation
failures (12 other cases passed) remain in logs; the final14-case set is rerun on
the corrected preview, not silently counted as green. Missing optional dense-star
assets/API503 availability are recorded environment limits, not Earth regressions
or authorization to alter Sky/data. These preview fixes are temporary local config
and read-only serving; all source/input identities and SWE remain unchanged.

Final installed-browser qualification PASS:14 cases in2.9min, including desktop/
mobile five serial Sky/Earth cycles, missing-face starbox/recovery, native source
ownership/cache/terminal fallback, five genuine destruction/recreation cycles,
stationary NAIP, narrow object details/Focus/Track/Stop/credits, real wrapped Fiji/
Aleutian rectangles, tilted/no-ground targeting, and controls while aerial readiness
is held. Fixtures and software proof remain distinct from live photos/physical
acceptance. Final document validators pass296 paths/8 packs;55 Markdown/1442 refs/
9 ADRs;67 capability records/51 source references/413 links/60 fragments; whitespace
clean. No new audits or provider promotion.

Changed files for this correction:

- `AGENTS.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/C6_GLOBAL_MAPPING_SPEC.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md`
- `frontend/public/runtime-versions.json`
- `frontend/tests/e2e/earthAppearance.spec.ts`
- `frontend/tests/e2e/earthGlobalImagery.spec.ts`
- `integrations/renderers.lock.json`
- `runtimes/earth-runtime/core/AdmittedMapSources.mjs`
- `runtimes/earth-runtime/core/ImageryController.mjs`
- `runtimes/earth-runtime/core/ImagerySelectionPolicy.mjs`
- `runtimes/earth-runtime/core/imageryRequests.mjs`
- `tests/earth/imagery-controller.test.mjs`
- `tests/earth/imagery-policy.test.mjs`
- `tests/earth/imagery-requests.test.mjs`
- `runtimes/earth-runtime/core/visibleImagery.mjs`
- `scripts/validation/earth-mapping/performance.mjs`
- `tests/earth/visible-imagery.test.mjs`

Local owner preview: `http://127.0.0.1:4198/earth?date=2026-10-11T17%3A00%3A00Z`.
Matched before/after gallery: `http://127.0.0.1:4198/gallery/performance/`; raw PNG/
JSON/table/telemetry and qualification logs under ignored
`output/playwright/c6-1a/performance`. Exact delivered head, source-input binding,
GitHub checks/review-thread receipt and preservation state appear in its handoff.
**STOP for owner visual/loading-speed and exact-head merge review. DO NOT MERGE.**
No C6-2/C6-3 or later package follows.
