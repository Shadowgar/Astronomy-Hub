# ORA-7 unified workspace implementation evidence

Qualification date: 2026-10-03. Single agent. Docker/Nginx on localhost:4181 is the
runtime authority; local unit/type/build results are supporting evidence.
Owner review is still required. This is implementation qualification, not a
production deployment or account-provider qualification.

## Authority and bounded scope

Implementation branch: `phase-c7-unified-workspace-implementation-1`. Unchanged
locked design ancestor: `2a4a665bc2db8399dd0728f918f5aae695ac0cd5`. Main baseline:
`b2f9dce9bb559a1d23dc806a1b8d1927c502f084` (merged PR #55).
The explicit owner request authorizes ORA-7, superseding the old ORA-6 wait clause.
No runtime override, design rewrite, dependency addition, backend science change,
large-data import, production deployment, merge or later phase is included.

Loaded context: CORE_CONTEXT, LIVE_SESSION_BRIEF and CONTEXT_MANIFEST; the
`frontend_change` pack's design specification, SYSTEM_VALIDATION_SPEC,
ASTRONOMY_HUB_DIAGRAM, UNIFIED_UNIVERSE_ARCHITECTURE,
GODS_EYE_SWE_COMPATIBILITY_STUDY, UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE,
CESIUM_EARTH_PHASE_C_EVIDENCE, ARCHITECTURE_OVERVIEW, ENGINE_SPEC, ENGINE_CATALOG,
OBJECT_MODEL, DATA_CONTRACTS, TONIGHT_CONTRACT, STACK_OVERVIEW, PROJECT_STATE,
MASTER_PLAN, FEATURE_EXECUTION_MODEL, FEATURE_CATALOG, FEATURE_ACCEPTANCE and
FEATURE_TRACKER. The prompt additionally authorizes the locked visual reference,
design validation and asset notices. No broad documentation scan occurred.
The frontend's inherited FE8.5/BabylonJS assumption conflicts with current root
rules; current contained SWE authority wins. Figma remains secondary/partial
under the prior owner waiver. Repository spec/HTML are the visual authority.

## Implemented contract

`/` and `/sky-engine` open the same Sky workspace; `/earth` opens its Earth mode.
The renderer fills the stage under one 56px header. The 184×44 mode switch,
52px Earth rail, 288px Layers, 320px context, 720px bottom region and 72/224px
drawer follow the locked dimensions. Tonight and Observe reuse their existing
queries/models rather than duplicating calculations. Focused `/observe` and
`/tonight`, and standalone `/oras-sky-engine/` and `/earth-runtime/`, are preserved.
The old homepage no longer drives any product route; reusable data components remain.

The feature is split into shell, header, modes, layers, context, Tonight, Observe,
target rows, selection, time, immersive controller, mobile sheet, diagnostics,
bridge adapter, state, tokens, licensed font assets and licensed Lucide SVGs.
No new npm dependency is introduced. Fonts are locally hosted IBM Plex Sans.

Selection wins after a native or context selection. Context selection does not
implicitly move the Sky camera; Focus requests SWE's native point-and-lock.
Canonical catalog/source/model and string IDs survive selection and links.
Type-aware facts are omitted when unknown. Time changes require an acknowledgment
before updating the URL and preserve the mounted iframe. Tonight peak actions
explicitly apply the supplied peak UTC. Earth provider clocks remain live and
independent of requested scene UTC. No historical layer behavior is asserted.

UI panels do not add history entries; modes navigate naturally. Bounded session
preferences contain only schema version, pin, preferred context and whitelisted
Earth layers. Runtime errors, loading, provider failures and transient selection
are not UI preferences. Four-second idle, 180ms transitions, edge reveal,
active-exploration behavior and global session pin are implemented. Focused UI,
open sheets and runtime loading/error states remain visible. Immersive expands
stage to the top; Escape/Tab return control through authenticated bridge events.

Mobile is a separate composition with one sheet, 96/360/640px snaps, a 440px
Layers limit, drag/click handling, scrollable content, safe-area padding and 44px
controls. The 640px sheet traps focus and makes the frame inert; closing restores
the logical launcher even when opening the sheet had unmounted that launcher.
Credits move to the top of the runtime when a sheet obscures the bottom.

## Runtime and architecture safeguards

Optional protocol 1.1 DTOs add presentation, bounded snapshots, layers, selection,
navigation, provider retry, native Sky tools and interaction events. Origin,
expected source, nonce, version, mount generation, whitelist validation and stale
message rejection are retained. Commands are capability-gated; unsupported Hub
Sky layers are omitted. No renderer object or raw provider state crosses the DTO
boundary. Duplicate late bootstrap hello no longer closes a live channel, proven
by a focused red/green regression.

RuntimeHost retains bounded save/intent, destroy, invalidation, removal, probe,
mount, handshake and supported restoration. Query changes do not remount a heavy
renderer. Desktop and mobile five-switch loops prove one settled frame, detached
old documents and destroyed Earth Viewers. Actual bfcache Back is tested separately.

SWE rendering/science remain engine-owned. Native WASM and vendor chunks are
byte-identical to the locked qualified baseline. The explicit narrow generic
presentation exception is an owned `gui.vue` overlay: `v-show` suppresses duplicate
observing/selection/bottom controls in embedded mode while keeping native watchers
and full standalone UI. This does not alter vendor source or scientific math.
Native View settings remains reachable through the workspace menu; the native
Milky Way/DSS/Meridian/Ecliptic controls remain renderer-owned. Survey credits
remain accessible. No unqualified Hub Sky layer rail is advertised.

The production TLE file was already gzip-wrapped gzip. Vite served its outer
compression with `Content-Encoding: gzip`; production Nginx did not. A bounded
exact-path Nginx header repair restores the qualified decoder path without changing
catalog bytes. Sky marker probing replaces favicon fetches, which Chromium fails
under Playwright request routing even when JSON requests work. Marker admission
checks the qualified application payload digest, runtime comparison anchor and
adapter digest. The payload digest excludes its self-identifying marker; the
lock additionally records that marker hash. A file-integrity regression binds all
96 files, marker and public manifest. Earth checksum
admission remains unchanged. Neither fix relaxes runtime identity admission.

## Earth visual foundation and providers

Viewer ownership remains Astronomy Hub. God's Eye remains immutable external
selective feature code at `e7707d9a0f34d9fbffc300023c319f95caa5be30`. Its entrypoint,
complete app, Viewer and unrelated layers are absent. Cesium is pinned at 1.138.0.

Default keyless imagery uses NASA GIBS WMS `BlueMarble_ShadedRelief_Bathymetry`,
service `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi`, WMS 1.1.1,
EPSG:4326, JPEG, 512px tiles, maximum level 8. It is a static global Blue Marble
composite, not current clouds. Live GET returned JPEG with wildcard CORS; browser
screens show its textured globe. [NASA GIBS API documentation](https://nasa-gibs.github.io/gibs-api-docs/)
provides provider provenance. Correct NASA/static-composite attribution is visible.
Local Natural Earth II is underneath. A public-source failure removes that layer
and retains usable textured local imagery, ellipsoid and truthful quality status.
Real intercepted provider failure is separately tested, not represented as live success.

Configuration admission is strict public deployment data: schema 1, explicit
`qualified` and `publicTokenAttested`, bounded public client token and positive
asset IDs. `ORAS_EARTH_DISPLAY_CONFIG` admits separately qualified Cesium ion
imagery, normal-enabled terrain, buildings and photorealistic tiles. Credentials
were absent, so no configured terrain/3D result is claimed. No token is committed,
logged or sent in diagnostics. These credentials/assets require provider licensing,
access and live browser qualification before enabling a deployment configuration.
Ellipsoid terrain is an explicit fallback, with no fake elevation or measured horizon.

Scene has restrained atmosphere, solar lighting, fog and horizon, with no star
skybox. Deliberate north-up global entry, lower mobile altitude/cropped large globe,
bounded zoom, restrained inertia, interruptible focus, Return to ORAS, global view,
source-backed satellite-only tracking and aircraft focus are implemented. Double
click selects a nearby real entity or performs one controlled globe zoom; empty
space is ignored. Picking uses a 44px target radius and backside occlusion.

ORAS uses canonical 41.321903, -79.585394, 432.816m, a restrained ring/label and
selected styling. Satellite markers are 6/14/18px by scale/selection; aircraft
markers/labels appear below the qualified altitude threshold. Weather uses one
current qualified model marker. Selection metadata/freshness remains available
when a provider fails but unavailable entities cannot focus or track. Disabling or
expiring a selected layer clears selection and tracking. No production fixtures
are registered. Automated adapter fixtures are explicitly separated from live
CelesTrak selections and real screenshots. CelesTrak returned HTTP 403 at final
qualification (saved headers); live availability is not claimed. Real provider
screens from the earlier pass contain propagated stations; final interaction
proof uses explicitly named checksum-valid qualification fixtures.

## Commands and results

Logs are `/var/tmp/oras-workspace/`. Screenshots/measurements are
`output/playwright/unified-workspace/` (local ignored evidence; not bundled in images).

| Exact command or recipe | Evidence / result |
|---|---|
| `npm --prefix frontend run test -- --run` | `frontend-release.log`: 22 files, 179/179 pass |
| `npm --prefix frontend run typecheck` | `typecheck-release.log`: exit 0 |
| `npm --prefix frontend run build` | `frontend-build-release.log`: exit 0; Hub JS 307.28kB / 93.36kB gzip before review; final Docker build 310.19kB / 94.45kB gzip |
| `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs` | `runtime-release.log`: 29/29 pass |
| `python3 scripts/runtime/integrate_sky_bridge.py /var/tmp/oras-workspace/sky-app` | exit 0; applies only owned adapter/overlay |
| Pinned Node 20 Sky frontend build, below | `sky-build-release.log`: exit 0 |
| `python3 scripts/runtime/record_sky_workspace.py /var/tmp/oras-workspace/sky-app/dist` | native/vendor identity verified; 96 files |
| `ORAS_EARTH_OUT=/var/tmp/oras-workspace/earth-build-release bash scripts/runtime/build_owned_earth.sh` | `earth-build-release.log`: exit 0; 512 runtime files, 111 dependency license declarations |
| `python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-workspace/earth-build-release` | strict source-input/file verification passed |
| Docker Compose qualification, below | `docker-release.log`: build/start passed; `docker-ps-release.log`: backend/Postgres/Redis running, Earth/frontend healthy |
| Browser acceptance, below | `browser-release.log`: 22/22 functional plus desktop accessibility pass; two additional tests corrected and retested below |
| `PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceAccessibility.spec.ts --workers=1 --output=/var/tmp/oras-workspace/accessibility-release` from frontend | `accessibility-release.log`: 3/3 pass |
| Actual bfcache, below | `bfcache-release.log`: 1/1 pass |
| `ORAS_SKY_ENGINE_BASE_URL=http://127.0.0.1:4181/oras-sky-engine/ ORAS_API_BASE_URL=http://127.0.0.1:4181 npm run validate:oras-deep-links` from frontend | `deep-links-codec.log`: 34 PASS/API_PASS/SEARCH_PASS, 14,281 catalog entries parsed |
| `VISUAL_PASS=pass-2-release PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/capture_unified_workspace.cjs` | 21 screenshots/measurements; no recorded page errors or overflow |
| `VISUAL_PASS=pass-2-release VISUAL_IDS=D01,D02,T11 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/capture_unified_workspace.cjs` | recaptures resolved Tonight content separately from its initial progressive loading |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/measure_unified_workspace.cjs` | `performance-release.log`, `performance.json`: measured values below |
| `git diff --check`, `git diff --cached --check`, `sha256sum .vscode/settings.json` | whitespace checks; owner settings unchanged and unstaged |

Sky frontend recipe (recovered qualified inputs remain external):

```sh
docker run --rm -v /var/tmp/oras-workspace/sky-app:/work -w /work \
  -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 \
  -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096' \
  node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 \
  bash -lc 'npm run build'
```

Production-like runtime recipe:

```sh
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-workspace/earth-build-release \
POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false \
docker compose -p oras-workspace-qualification -f docker-compose.prod.yml \
  up -d --no-deps --build frontend earth-runtime
# Backend/Postgres/Redis were built and started in the initial full qualification.
```

Browser commands (from `frontend`):

```sh
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 \
npx playwright test tests/e2e/workspaceAccessibility.spec.ts \
  tests/e2e/unifiedWorkspace.spec.ts tests/e2e/publicShell.spec.ts \
  tests/e2e/runtimeProbeHost.spec.ts tests/e2e/ownedEarth.spec.ts \
  --workers=1 --output=/var/tmp/oras-workspace/browser-release
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 \
npx playwright test tests/e2e/earthBfcache.spec.ts --workers=1 \
  --output=/var/tmp/oras-workspace/bfcache-release
```

Artifact identity: Earth
`5c219902efb8c3a42f600726c6a8c2f399ca4ecdcb6019161d8ee424ef6f2fe8`; Sky
`bbf8e9136fa510e86a64095f5e5ec51846456989b589de21937d2f929450e1a5`.
Native Sky WASM SHA256 remains
`54651299e35a47c342ba3364be6b77f1ee8b40926d925e7736d05e566c0dfa09`.
Application/artifact files exclude bulk skydata. Baseline external data remains mounted.

## Visual passes, accessibility and measurements

Pass 1: all 21 target states inspected against the editable reference. Findings:
mobile globe too small; oversized sheet-handle focus outline; source copy included
engineering prose; attribution overlapped bottom controls; time conversion could
show the preceding minute; selected action hover contrast needed correction.
Corrections: mobile entry altitude; 44px central handle; concise type/source copy;
credit relocation and mobile bottom clearance; UTC millisecond rounding; explicit
primary hover colors. Initial Sky captures also needed tile settling time.

Pass 2: all 21 states rerendered and inspected; final artifact refresh is
`pass-2-release/`, with contact sheet `pass-2-release-contact.png`. Full resolved
Tonight content is recaptured after progressive loading. Desktop/tablet/mobile
use one visual system, aligned floating geometry and renderer dominance. Earth
is textured, mobile uses its own composition, and selection/providers/loading/
error/pinned/auto-hidden states remain truthful. No material locked-design deviation
is known. Real renderer imagery/catalog density differs from schematic references.
Inherited dense-star tile 404/loader noise remains a Category B limitation; broad
Sky console cleanliness is not claimed. Provider availability may vary by capture.

Real browser accessibility covers keyboard, visible focus, renderer Escape/Tab,
focus restoration, reduced-motion transitions, 44px primary targets, modal frame
inertness/trapping, drag snaps, contrast and accessible landmarks/labels. Text token
contrast is verified mathematically above 4.5:1. No spoken screen-reader/physical
assistive-device or complete cross-browser certification is claimed.

The broad browser run recorded 23 passes and two failures: the unpinned mobile
test crossed the specified idle boundary, and CelesTrak returned 403. Mobile sheet
qualification now pins controls independently of the separately passing auto-hide
test. Satellite focus/tracking uses explicit test fixtures, not invented production
objects. Focused corrected runs pass; the accessibility bundle is rerun separately.

Representative local headless Chromium measurements on the final qualified build
(not guarantees): workspace shell interactive 89ms; Sky host ready 1722ms. Earth
switches 2215/1925ms; Sky switches 1473/1413ms. Earth Viewer ready 155/128ms;
first public Blue Marble imagery 5714/6104ms. Earlier standalone desktop/mobile
measurements were 182/393ms Viewer and 12,810/8,072ms first imagery.
Final public outcomes are saved in `performance.json`; both resolved Blue Marble.
Terrain has no ready measurement because configured terrain is absent (ellipsoid).
Local caching, device/headless differences and external latency affect these values.

## Review, remaining gaps and stopping boundary

One normal PR review is requested after functional/browser/visual qualification.
Category A findings require a focused repair/retest; Category B does not trigger a
recursive review loop. Current review/check details are recorded in the PR and
final ORA-7 handoff. Owner approval remains outstanding; ORA-7 is In Review, not Done.

Category B: separately licensed/configured terrain and 3D live qualification;
additional qualified Earth layers; optional transition/startup refinements;
inherited dense-star tile noise; partial Figma cleanup. Aircraft success is fixture
proof; unavailable live behavior is preserved. June Sky TLE lineage is unchanged;
Earth live provider source time is separate, with no unified ISS handoff claim.
No ISS handoff, Mars/planetary renderer, broad God's Eye feature parity or measured
horizon was implemented. Recommended next action: owner reviews this bounded PR.
No next implementation phase is started.

## Exact implementation file inventory

Runtime/UI/test implementation commit: `ea23f89f`. The following paths changed
relative to the locked design commit; generated Sky chunks are application assets,
not catalog bulk. The owner settings are excluded.

```text
frontend/nginx.conf
frontend/public/oras-sky-engine/index.html
frontend/public/oras-sky-engine/js/app.4523120d.js
frontend/public/oras-sky-engine/js/app.5253a4df.js
frontend/public/oras-sky-engine/oras-runtime-build.json
frontend/public/runtime-versions.json
frontend/src/components/shell/OrasAppShell.tsx
frontend/src/features/runtime/runtimeProbeService.ts
frontend/src/features/sky-engine/RuntimeHost.tsx
frontend/src/features/workspace/BottomSheet.tsx
frontend/src/features/workspace/ContextSurface.tsx
frontend/src/features/workspace/DiagnosticsSurface.tsx
frontend/src/features/workspace/ImmersiveController.ts
frontend/src/features/workspace/LayerPanel.tsx
frontend/src/features/workspace/ModeSwitcher.tsx
frontend/src/features/workspace/ObserveSurface.tsx
frontend/src/features/workspace/ProductHeader.tsx
frontend/src/features/workspace/SelectionDrawer.tsx
frontend/src/features/workspace/TargetRow.tsx
frontend/src/features/workspace/TimeSurface.tsx
frontend/src/features/workspace/TonightSurface.tsx
frontend/src/features/workspace/WorkspaceShell.tsx
frontend/src/features/workspace/assets/LICENSES.txt
frontend/src/features/workspace/assets/plex-0.ttf
frontend/src/features/workspace/assets/plex-1.ttf
frontend/src/features/workspace/assets/plex-2.ttf
frontend/src/features/workspace/fonts.css
frontend/src/features/workspace/icons.json
frontend/src/features/workspace/primitives.tsx
frontend/src/features/workspace/workspace.css
frontend/src/features/workspace/workspaceRuntimeAdapter.ts
frontend/src/features/workspace/workspaceUiState.ts
frontend/src/routes/AppRouter.tsx
frontend/tests/e2e/ownedEarth.spec.ts
frontend/tests/e2e/publicShell.spec.ts
frontend/tests/e2e/runtimeProbeHost.spec.ts
frontend/tests/e2e/unifiedWorkspace.spec.ts
frontend/tests/e2e/workspaceAccessibility.spec.ts
frontend/tests/publicShell.test.tsx
frontend/tests/runtimeProbeService.test.ts
frontend/tests/workspace.test.tsx
frontend/tests/workspaceUiState.test.ts
frontend/vite.config.mjs
integrations/renderers.lock.json
integrations/sky-overlay/apps/web-frontend/src/components/gui.vue
packages/runtime-protocol/client.d.mts
packages/runtime-protocol/client.mjs
packages/runtime-protocol/endpoint.mjs
packages/runtime-protocol/index.d.mts
packages/runtime-protocol/index.mjs
packages/runtime-protocol/workspace.mjs
runtimes/earth-runtime/core/CameraController.mjs
runtimes/earth-runtime/core/EarthRuntime.mjs
runtimes/earth-runtime/core/RuntimeBridge.mjs
runtimes/earth-runtime/core/SelectionStore.mjs
runtimes/earth-runtime/core/ViewerController.mjs
runtimes/earth-runtime/core/VisualFoundation.mjs
runtimes/earth-runtime/core/displayConfig.mjs
runtimes/earth-runtime/display-config.json
runtimes/earth-runtime/entry.mjs
runtimes/earth-runtime/index.html
runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs
runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs
runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs
runtimes/earth-runtime/layers/PollingLayer.mjs
runtimes/earth-runtime/layers/entities.mjs
runtimes/earth-runtime/style.css
runtimes/sky-adapter/entry.mjs
runtimes/sky-adapter/plugin.js
scripts/runtime/build_current_sky.sh
scripts/runtime/build_owned_earth.sh
scripts/runtime/record_sky_workspace.py
scripts/validation/capture_unified_workspace.cjs
scripts/validation/measure_unified_workspace.cjs
tests/earth/display-config.test.mjs
tests/runtime/channel.test.mjs
tests/runtime/workspace-protocol.test.mjs
docs/context/CONTEXT_MANIFEST.yaml
docs/context/CORE_CONTEXT.md
docs/context/LIVE_SESSION_BRIEF.md
docs/execution/MASTER_PLAN.md
docs/execution/PROJECT_STATE.md
docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md
```

## One normal review cycle and Category A repairs

PR #58: https://github.com/Shadowgar/Astronomy-Hub/pull/58. Normal Codex review was
requested once and completed on `e58163645ef014824d5778d3c7b3b47da276d417`.
Initial test/CodeQL/GitGuardian checks passed. Five findings were classified
Category A against task correctness/accessibility requirements (including two P2s):

1. Tonight peak Focus rebuilt its final URL from stale pre-navigation search.
   Final canonical identity and acknowledged peak UTC now share one navigation.
   API microsecond UTC is normalized to bridge millisecond precision; the
   adapter reads fresh Zustand intent after search ingestion rather than its stale
   previous snapshot. Native-engine UTC assertions also cover ±1h. Source
   timestamps are not invented. Both initial Live and fixed-time cases are tested.
2. The focused Observe link lost custom observer coordinates/elevation.
   Reuse the existing Observe path helper with complete observer/time context.
3. Sky marker admission did not compare qualified application artifact digest.
   Marker/public metadata now share the complete payload digest; mismatches fail
   before iframe creation. File-integrity checks prove all locked application bytes.
4. Custom-observer timestamps asserted ORAS EDT/EST. Reuse the existing validated
   Observe formatter: ORAS local time, otherwise explicitly UTC.
5. Diagnostics launched from a disappearing menu button lost close focus.
   Preserve the stable Workspace menu trigger; desktop/mobile closure is tested.

Focused evidence: `review-probe-red.log` proves two mismatched/missing digest
failures before repair; `review-probe-green.log` passes 18/18. Custom-observer
browser red proof is `review-browser-red.log`. The first focused browser pass
proved observer/timezone/menu-focus/digest repairs (6/8), and exposed the API
microsecond admission issue. Final nine-case review/accessibility acceptance is
`review-browser-final.log`: 9/9 pass. Combined with the earlier bounded
acceptance, 32 unique Docker browser cases are qualified. `review-focused-units.log`: 40/40; artifact integrity
`review-artifact-green.log`: 1/1. Typecheck and Docker production frontend rebuild
pass after repair. The Earth artifact, SWE app/native bytes and visual geometry
remain unchanged by review repair; the identity marker/metadata are refreshed.
No second normal review request or recursive Category B review is initiated.

Additional changed files: `frontend/tests/e2e/workspaceReview.spec.ts` and
`tests/runtime/sky-artifact.test.mjs`. Exact focused commands:

```sh
npm --prefix frontend run test -- --run tests/runtimeProbeService.test.ts
npm --prefix frontend run test -- --run tests/workspace.test.tsx tests/workspaceUiState.test.ts tests/runtimeProbeService.test.ts tests/observeView.test.tsx tests/observeModel.test.ts
node --test tests/runtime/sky-artifact.test.mjs
npm --prefix frontend run typecheck
# From frontend, against the same authoritative Docker port:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceReview.spec.ts tests/e2e/workspaceAccessibility.spec.ts --workers=1 --output=/var/tmp/oras-workspace/review-browser-final
```

Fresh CI/current head and thread resolution are recorded in the final PR/Linear
handoff. The unchanged locked design remains an ancestor. Owner review remains
required; ORA-7 remains In Review and this PR must not be merged by this task.


## Supplemental findings within the same review cycle

The automatic Copilot review of the same original head contributed seven threads;
it did not initiate a second normal review cycle. Two duplicate the repaired
custom-observer and stale-time-intent findings above. Five additional Category A
issues are repaired with focused qualification:

1. Disabled display configuration now admits only `schema` and `qualified`;
   build output serializes the validated JSON object instead of copying unvalidated
   text. Unknown fields and hidden duplicate-key credential text cannot be published.
2. The date input synchronizes with acknowledged ±1h/Now changes, preventing Apply
   from reverting the newly applied time.
3. Tonight uses the existing observing-night conversion for acknowledged controlled
   scene UTC; its focused link retains that night. Live mode keeps the provider's
   current-night contract. No new astronomy calculation is introduced.
4. Explicit Immersive suppresses normal close-focus restoration and releases active
   chrome focus. Desktop/mobile More-menu entry now stays hidden; ordinary dismissal
   still restores focus.
5. Custom wheel, keyboard and double-click zoom share cartographic limits, preserving
   orientation and enforcing the terrain-aware minimum and 30Mm maximum. A scalar
   camera-height diagnostic supports qualification without exporting renderer objects.

`frontend/tests/e2e/workspaceSupplementalReview.spec.ts` adds five real Docker
browser regressions. `supplemental-browser.log`: 12/13 passed, including all five
new regressions, artifact admission and four earlier review regressions. The one
failure was an obsolete test response predicate: it consumed the initial live-night
API response before the selected-night response arrived. The predicate now binds to
the existing observing-night contract. `selected-night-peak-final.log`: both Live
and fixed-time native UTC/identity assertions pass (2/2). Together with earlier
bounded runs, 37 unique Docker browser cases are qualified. This is not a claim
that a new full 37-case bundle ran. Supplemental unit checks pass 40/40, configuration
plus full Sky file integrity pass 3/3, and typecheck passes. All 12 threads in the
single review cycle are addressed; final resolution/check state is in PR/Linear.

Final Earth was rebuilt and strict identity recorded from
`/var/tmp/oras-workspace/earth-build-supplemental`: 512 runtime files and 111 license
declarations. The artifact hash above is current. Docker rebuilt frontend/Earth
and health passed. Final visual refresh of D01/D02/D05/D09/D10 preserves the full
21-state pass-2 evidence and contact sheet; refreshed captures have no page errors
or overflow. SWE application/native bytes and locked design remain unchanged by
these supplemental fixes. Exact supplemental commands:

```sh
npm --prefix frontend run test -- --run tests/workspace.test.tsx tests/workspaceUiState.test.ts tests/runtimeProbeService.test.ts tests/observeView.test.tsx tests/observeModel.test.ts
node --test tests/earth/display-config.test.mjs tests/runtime/sky-artifact.test.mjs
npm --prefix frontend run typecheck
ORAS_EARTH_OUT=/var/tmp/oras-workspace/earth-build-supplemental bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-workspace/earth-build-supplemental
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-workspace/earth-build-supplemental POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend earth-runtime
# From frontend:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceSupplementalReview.spec.ts tests/e2e/workspaceReview.spec.ts tests/e2e/runtimeProbeHost.spec.ts --workers=1 --output=/var/tmp/oras-workspace/supplemental-browser
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceReview.spec.ts --grep 'Tonight peak' --workers=1 --output=/var/tmp/oras-workspace/selected-night-peak-final
# From repository root:
VISUAL_PASS=pass-2-release VISUAL_IDS=D01,D02,D05,D09,D10 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/capture_unified_workspace.cjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/measure_unified_workspace.cjs
```

Logs: `supplemental-units.log`, `supplemental-artifact.log`,
`supplemental-typecheck.log`, `earth-build-supplemental.log`,
`supplemental-docker.log`, `supplemental-browser.log`,
`selected-night-peak-final.log`, `supplemental-visual.log`, `performance-final.log`.
No additional normal review was requested. No known Category A blocker remains;
provider credentials/live availability, inherited star tile noise, physical AT and
Figma remain explicitly bounded gaps. Owner approval is the next task.


## Automatic review-on-push: final Category A regressions

Exactly one explicit normal review request was sent. Repository automation also
reviewed pushed repair commits without another request; this is disclosed rather
than represented as a single automated review execution. Its three additional
threads on `6846b5b3` include the already repaired Immersive duplicate and two new
Category A findings:

- Earth contextual Focus now carries an in-memory canonical pending intent into
  Sky. It is consumed once after successful qualified selection, matching catalog,
  source ID and model, and is never persisted. Workspace client admission is bound
  to mode so the incoming Sky shell cannot consume that intent on the outgoing
  Earth client. Native `pointAndLock` remains renderer-owned.
- Product ingestion, host admission and workspace time use one strict existing
  date predicate. Malformed/rollover dates open Live at current UTC, rather than
  replaying saved controlled time; invalid date parameters do not enter the frame.

`final-review-red.log`: all three new browser cases fail before repair, including
zero native Focus calls and non-Live invalid dates. The intermediate repair exposed
an outgoing-client admission race (8/9 passed); mode-bound admission repairs it.
`final-review-green.log`: 9/9 pass, including all three new cases and the six earlier
review regressions. The cross-mode proof wraps and invokes the real native
`pointAndLock`: exactly one call; it does not simulate a renderer. Both arbitrary
invalid and February 30 date cases open current Live after a saved 2020 scene.
`final-review-units.log`: 30/30 pass; typecheck and final Docker production build
pass. Total bounded qualification is now 40 unique Docker browser cases. All 15
review threads are addressed; current remote checks/resolution are recorded in
PR/Linear. No recursive Category B work or new review request is performed.

Additional changed paths: `frontend/src/features/runtime/productState.ts`,
`frontend/tests/runtimeProductState.test.ts`,
`frontend/tests/e2e/workspaceFinalReview.spec.ts`; the host, workspace shell and
adapter paths were already in the inventory above. Sky/Earth artifacts and native
scientific bytes are unchanged by this final host-side repair. D01/D02 were refreshed
and visually inspected again on the final Docker build. Exact commands:

```sh
npm --prefix frontend run test -- --run tests/runtimeProductState.test.ts tests/workspace.test.tsx tests/workspaceUiState.test.ts tests/runtimeProbeService.test.ts
npm --prefix frontend run typecheck
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-workspace/earth-build-supplemental POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend
# From frontend (same command for red/green; output directory changes):
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceFinalReview.spec.ts tests/e2e/workspaceReview.spec.ts --workers=1 --output=/var/tmp/oras-workspace/final-review-green
# Initial red ran only tests/e2e/workspaceFinalReview.spec.ts.
# From repository root:
VISUAL_PASS=pass-2-release VISUAL_IDS=D01,D02 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/capture_unified_workspace.cjs
```

Logs: `final-review-red.log`, `final-review-green.log`, `final-review-units.log`,
`final-review-typecheck.log`, `final-review-docker.log`, `final-review-visual.log`.
The owner settings remain unchanged/unstaged. The PR remains open and unmerged;
ORA-7 remains In Review, NOT Done. Owner approval is required.


## Final observer/context repairs and verification bundle

Automatic review-on-push on `c9c1eac6` reported two additional Category A issues.
Coordinate-only supported Sky links now preserve explicit latitude/longitude and
normalize omitted/empty elevation to SWE's documented source default of zero,
matching upstream `App.vue:300`. This is the existing URL contract, not a fabricated
altitude measurement. Invalid coordinates/elevation remain rejected.

Auxiliary closure preserves desktop context and returns a mobile auxiliary sheet
to its prior context, restoring the stable Time trigger. Explicit context dismissal
and Escape still close the selected context. `observer-context-red.log`: 3/3 new
cases fail before repair. `observer-context-green.log`: 17/17 combined review
regressions pass. A focused Escape edge regression initially fails and then passes
in `context-final-green.log`: 10/10 final browser/accessibility cases. Overall
bounded Docker qualification now covers 44 unique cases across the recorded runs;
no new 44-case full bundle is claimed. All 17 reported threads are addressed; one
explicit normal review request only, with repository auto-review on pushes disclosed.

The final full verification bundle passes: frontend 22 files / 183 tests; runtime
and Earth 31/31; typecheck; final production Docker frontend build (308.67kB JS,
94.05kB gzip). A broad runtime rerun first passed 28/31: three lifecycle fixture
cases lacked the camera property now read by the scalar diagnostic. The fake Viewer
contract was updated; the complete rerun is 31/31. No Earth/SWE source/artifact or
scientific byte change was needed for that fixture correction. Additional changed
path: `tests/earth/page-lifecycle.test.mjs`.

Exact final commands:

```sh
npm --prefix frontend run test -- --run
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs
npm --prefix frontend run typecheck
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-workspace/earth-build-supplemental POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend
# From frontend:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceFinalReview.spec.ts --grep 'without elevation|auxiliary' --workers=1 --output=/var/tmp/oras-workspace/observer-context-red
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceFinalReview.spec.ts tests/e2e/workspaceReview.spec.ts tests/e2e/workspaceSupplementalReview.spec.ts --workers=1 --output=/var/tmp/oras-workspace/observer-context-green
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceFinalReview.spec.ts --grep 'Escape still' --workers=1 --output=/var/tmp/oras-workspace/context-escape-red
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceFinalReview.spec.ts tests/e2e/workspaceAccessibility.spec.ts --workers=1 --output=/var/tmp/oras-workspace/context-final-green
```

Logs: `frontend-final.log`, `runtime-final.log`, `typecheck-final.log`,
`observer-context-units.log` (31/31 focused), `observer-context-typecheck.log`,
`observer-context-docker.log`, `observer-context-red.log`,
`observer-context-green.log`, `context-escape-red.log`, `context-final-green.log`.
Final branch SHA, current CI results and review-thread resolution belong to the
PR/Linear handoff. The design is unchanged, `.vscode/settings.json` is unchanged
and unstaged, and owner approval remains the required next action.


## Final recovery, query intent and Earth selection qualification

Repository review-on-push added six Category A findings across `1e48a52a` and
`fd420398`; no additional explicit review request was sent. Recovery and normal
mode switching now share validated date/observer routing. Standalone Sky preserves
canonical scene intent through its qualified native selection link or bounded
product intent, including large string IDs. Escape from More restores its stable
trigger on desktop/mobile.

Search-only navigation now reapplies validated observer and changed canonical
selection/clear commands through the existing qualified adapter without remounting.
Acknowledged intent signatures prevent replay of already applied internal UI
commands; successful query selection/clear is tested in the actual native frame.
Empty Earth clicks preserve the existing selected object; user input still
interrupts camera tracking as specified, and explicit Deselect/layer clearing still
clear selection. Custom-observer Earth source timestamps reuse the existing
validated Observe formatter with UTC; ORAS uses its known New York zone.

`recovery-review-red.log`: four recovery/menu cases fail before repair.
`recovery-review-green.log`: 14/15 pass; the remaining assertion compared equivalent
UTC spellings. It now compares instants and numeric observer precision.
`intent-review-red.log` proves query synchronization and UTC-label failures;
the empty-click case was blocked by the edge-reveal hit area and is not represented
as a browser bug reproduction. `selection-policy-red.log` separately executes the
old committed selection handler and proves implicit deselection; current source
passes. The empty browser click was moved to unobstructed scene coordinates.

`intent-review-green.log`: 30/31 pass, including the real native standalone tab,
query synchronization, menu focus, artifact identity, prior time/observer/immersive
regressions, accessibility and actual bfcache. The one failure was the same blocked
edge-strip click. `intent-recovery-final.log`: all seven corrected intent/recovery
cases pass, including preserved Earth selection and deliberate Deselect.
Total bounded browser qualification is 51 unique cases across the documented runs;
no full 51-case bundle is claimed. `lifecycle-final.log`: 3/3 fresh cases pass on the
final artifact: desktop/mobile five-stage serial teardown loops and tablet
selection/mode/history/reload controls. Removed frames, destroyed Viewer, one active
iframe and stale-message rejection are asserted. All 23 reported threads are
addressed; current remote CI/thread state belongs to PR/Linear.

Final full frontend suite: 23 files / 185 tests pass; runtime/Earth 32/32 pass;
typecheck passes. Earth rebuild/strict record: 512 runtime files, 111 licenses,
artifact `5c219902efb8c3a42f600726c6a8c2f399ca4ecdcb6019161d8ee424ef6f2fe8`.
Final Docker production frontend is 310.19kB JS / 94.45kB gzip. Native Sky scientific
and application bytes remain unchanged by these final repairs. D05/D08/M15 were
refreshed and visually inspected; no captured page errors or overflow. Fresh
performance values above were measured after browser regression completion.

Additional paths: `frontend/src/features/workspace/workspaceNavigation.ts`,
`frontend/tests/workspaceNavigation.test.ts`,
`frontend/tests/e2e/workspaceRecoveryReview.spec.ts`,
`frontend/tests/e2e/workspaceIntentReview.spec.ts`, `tests/earth/selection.test.mjs`.
Exact final commands (supporting unit/type checks are also in the prior bundle):

```sh
npm --prefix frontend run test -- --run
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs
npm --prefix frontend run typecheck
ORAS_EARTH_OUT=/var/tmp/oras-workspace/earth-build-final bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-workspace/earth-build-final
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-workspace/earth-build-final POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend earth-runtime
ORAS_SELECTION_SOURCE=/var/tmp/oras-workspace/selection-before-review.mjs node --test tests/earth/selection.test.mjs
# From frontend:
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceRecoveryReview.spec.ts --workers=1 --output=/var/tmp/oras-workspace/recovery-review-red
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceRecoveryReview.spec.ts tests/e2e/workspaceReview.spec.ts tests/e2e/workspaceSupplementalReview.spec.ts --workers=1 --output=/var/tmp/oras-workspace/recovery-review-green
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceIntentReview.spec.ts --workers=1 --output=/var/tmp/oras-workspace/intent-review-red
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceRecoveryReview.spec.ts tests/e2e/workspaceIntentReview.spec.ts tests/e2e/workspaceReview.spec.ts tests/e2e/workspaceFinalReview.spec.ts tests/e2e/workspaceSupplementalReview.spec.ts tests/e2e/workspaceAccessibility.spec.ts tests/e2e/runtimeProbeHost.spec.ts tests/e2e/earthBfcache.spec.ts --workers=1 --output=/var/tmp/oras-workspace/intent-review-green
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceIntentReview.spec.ts tests/e2e/workspaceRecoveryReview.spec.ts --workers=1 --output=/var/tmp/oras-workspace/intent-recovery-final
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/ownedEarth.spec.ts tests/e2e/unifiedWorkspace.spec.ts --grep 'serial five-switch|serial history tablet' --workers=1 --output=/var/tmp/oras-workspace/lifecycle-final
# From repository root:
VISUAL_PASS=pass-2-release VISUAL_IDS=D05,D08,M15 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/capture_unified_workspace.cjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 node scripts/validation/measure_unified_workspace.cjs
```

Logs: `frontend-final.log`, `runtime-final.log`, `typecheck-final.log`,
`earth-build-final.log`, `intent-review-docker.log`, `recovery-review-red.log`,
`recovery-review-green.log`, `intent-review-red.log`, `selection-policy-red.log`,
`intent-review-green.log`, `intent-recovery-final.log`, `lifecycle-final.log`,
`intent-review-visual.log`, `performance-final.log`. Screenshots and measurements
remain local ignored evidence. Owner approval is the next action. No merge, later
phase, production deployment or Category B expansion occurs.

## Final exact implementation diff inventory

Relative to unchanged locked design `2a4a665b` (A added, M modified, D deleted,
R renamed); excludes owner settings. The PR separately includes the unchanged
design commit relative to main.

```text
M	docs/context/CONTEXT_MANIFEST.yaml
M	docs/context/CORE_CONTEXT.md
M	docs/context/LIVE_SESSION_BRIEF.md
M	docs/execution/MASTER_PLAN.md
M	docs/execution/PROJECT_STATE.md
A	docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md
M	frontend/nginx.conf
M	frontend/public/oras-sky-engine/index.html
D	frontend/public/oras-sky-engine/js/app.4523120d.js
R086	frontend/public/oras-sky-engine/js/app.661f6dd4.js	frontend/public/oras-sky-engine/js/app.5253a4df.js
M	frontend/public/oras-sky-engine/oras-runtime-build.json
M	frontend/public/runtime-versions.json
M	frontend/src/components/shell/OrasAppShell.tsx
M	frontend/src/features/runtime/productState.ts
M	frontend/src/features/runtime/runtimeProbeService.ts
M	frontend/src/features/sky-engine/RuntimeHost.tsx
A	frontend/src/features/workspace/BottomSheet.tsx
A	frontend/src/features/workspace/ContextSurface.tsx
A	frontend/src/features/workspace/DiagnosticsSurface.tsx
A	frontend/src/features/workspace/ImmersiveController.ts
A	frontend/src/features/workspace/LayerPanel.tsx
A	frontend/src/features/workspace/ModeSwitcher.tsx
A	frontend/src/features/workspace/ObserveSurface.tsx
A	frontend/src/features/workspace/ProductHeader.tsx
A	frontend/src/features/workspace/SelectionDrawer.tsx
A	frontend/src/features/workspace/TargetRow.tsx
A	frontend/src/features/workspace/TimeSurface.tsx
A	frontend/src/features/workspace/TonightSurface.tsx
A	frontend/src/features/workspace/WorkspaceShell.tsx
A	frontend/src/features/workspace/assets/LICENSES.txt
A	frontend/src/features/workspace/assets/plex-0.ttf
A	frontend/src/features/workspace/assets/plex-1.ttf
A	frontend/src/features/workspace/assets/plex-2.ttf
A	frontend/src/features/workspace/fonts.css
A	frontend/src/features/workspace/icons.json
A	frontend/src/features/workspace/primitives.tsx
A	frontend/src/features/workspace/workspace.css
A	frontend/src/features/workspace/workspaceNavigation.ts
A	frontend/src/features/workspace/workspaceRuntimeAdapter.ts
A	frontend/src/features/workspace/workspaceUiState.ts
M	frontend/src/routes/AppRouter.tsx
M	frontend/tests/e2e/ownedEarth.spec.ts
M	frontend/tests/e2e/publicShell.spec.ts
M	frontend/tests/e2e/runtimeProbeHost.spec.ts
A	frontend/tests/e2e/unifiedWorkspace.spec.ts
A	frontend/tests/e2e/workspaceAccessibility.spec.ts
A	frontend/tests/e2e/workspaceFinalReview.spec.ts
A	frontend/tests/e2e/workspaceIntentReview.spec.ts
A	frontend/tests/e2e/workspaceRecoveryReview.spec.ts
A	frontend/tests/e2e/workspaceReview.spec.ts
A	frontend/tests/e2e/workspaceSupplementalReview.spec.ts
M	frontend/tests/publicShell.test.tsx
M	frontend/tests/runtimeProbeService.test.ts
M	frontend/tests/runtimeProductState.test.ts
A	frontend/tests/workspace.test.tsx
A	frontend/tests/workspaceNavigation.test.ts
A	frontend/tests/workspaceUiState.test.ts
M	frontend/vite.config.mjs
M	integrations/renderers.lock.json
A	integrations/sky-overlay/apps/web-frontend/src/components/gui.vue
M	packages/runtime-protocol/client.d.mts
M	packages/runtime-protocol/client.mjs
M	packages/runtime-protocol/endpoint.mjs
M	packages/runtime-protocol/index.d.mts
M	packages/runtime-protocol/index.mjs
A	packages/runtime-protocol/workspace.mjs
M	runtimes/earth-runtime/core/CameraController.mjs
M	runtimes/earth-runtime/core/EarthRuntime.mjs
M	runtimes/earth-runtime/core/RuntimeBridge.mjs
M	runtimes/earth-runtime/core/SelectionStore.mjs
M	runtimes/earth-runtime/core/ViewerController.mjs
A	runtimes/earth-runtime/core/VisualFoundation.mjs
A	runtimes/earth-runtime/core/displayConfig.mjs
A	runtimes/earth-runtime/display-config.json
M	runtimes/earth-runtime/entry.mjs
M	runtimes/earth-runtime/index.html
M	runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs
M	runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs
M	runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs
M	runtimes/earth-runtime/layers/PollingLayer.mjs
M	runtimes/earth-runtime/layers/entities.mjs
M	runtimes/earth-runtime/style.css
M	runtimes/sky-adapter/entry.mjs
M	runtimes/sky-adapter/plugin.js
M	scripts/runtime/build_current_sky.sh
M	scripts/runtime/build_owned_earth.sh
A	scripts/runtime/record_sky_workspace.py
A	scripts/validation/capture_unified_workspace.cjs
A	scripts/validation/measure_unified_workspace.cjs
A	tests/earth/display-config.test.mjs
M	tests/earth/page-lifecycle.test.mjs
A	tests/earth/selection.test.mjs
M	tests/runtime/channel.test.mjs
A	tests/runtime/sky-artifact.test.mjs
A	tests/runtime/workspace-protocol.test.mjs
```
