# Hub-owned Cesium Earth — Phase C qualification

Scope: owner-approved architecture pivot, single agent, local Docker qualification,
new branch `phase-c-cesium-earth-runtime-1`; not a public production deployment.
No merge or next-phase work is authorized. Final source/artifact/review results
are recorded below. The historical Phase B study remains historical.
The **Final P1 correction acceptance** section defines the current deployable
artifact and commands. Earlier qualification commands are historical run records,
not deployment instructions; their artifact paths are superseded.

## Authority/context and salvage

Loaded the union of frontend_change/backend_change packs: CORE_CONTEXT,
LIVE_SESSION_BRIEF, SYSTEM_VALIDATION_SPEC, ASTRONOMY_HUB_DIAGRAM,
UNIFIED_UNIVERSE_ARCHITECTURE, GODS_EYE_SWE_COMPATIBILITY_STUDY,
UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE, ARCHITECTURE_OVERVIEW, ENGINE_SPEC,
ENGINE_CATALOG, OBJECT_MODEL, DATA_CONTRACTS, TONIGHT_CONTRACT, STACK_OVERVIEW,
PROJECT_STATE, MASTER_PLAN, FEATURE_EXECUTION_MODEL, FEATURE_CATALOG,
FEATURE_ACCEPTANCE, FEATURE_TRACKER and INGESTION_STRATEGY. No broad docs scan.
The pivot explicitly supersedes complete-app Earth ownership in older documents.

Verified main and origin/main at `51a66347dd5997673a6b7c523d66e980f3a8701d`.
Original paused branch `phase-c-unified-sky-earth-runtime-1` at
`bb98d99f7834a8c9541e11e916b5c37ba79f4ed8` had no remote branch/tracking.
Local safety branch `phase-c-full-gods-eye-experiment-backup` preserves it at
`dd15ae1b` with ONE WIP docs/config snapshot. No editor/settings, credentials,
node_modules, caches, output, giant artifacts or external checkouts staged.
Neither old branch was pushed. `.vscode/settings.json` stayed byte-identical:
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

| Old work | Classification and disposition |
| --- | --- |
| `6fa4e3c2` source recovery | KEEP Sky inputs/recipe/native proof; SALVAGE rather than cherry-pick because renderer lock included full-app Earth metadata. Recovered the missing tracked yarn lock too. |
| `bb98d99f` protocol/host/Sky adapter | SALVAGE specific paths; recreate Earth and hosting boundaries because the commit also contained the full app, sidecar and aliases. |
| Full-app Earth entry/Vite/server/aliases/assets | REFERENCE ONLY on local backup; never imported into the new runtime. |
| Old docs snapshot `dd15ae1b` | REFERENCE ONLY; current authority records the pivot. |
| Discarded old work | NONE. The obsolete provider container was stopped, not deleted. |

No whole old commit was cherry-picked; no prolonged archaeology. New commits
separate source foundation, Earth core/adapters, bridge/hosting and evidence.

## C0 source/artifact/science

`integrations/sky-overlay` records 26 hash-checked inputs, including ignored build
inputs, npm/yarn locks and native ORAS star science. Secrets/bulk data excluded.
Comparison anchor `023e3b26babf7ffddf45f39293230b14cfe96993`; exact historical
import remains unknown. Emscripten 1.39.17 and pinned Node20 reconstruction are
recorded in `integrations/renderers.lock.json`; recipe never promotes blindly.
Original/rebuilt WASM are byte-identical:
`54651299e35a47c342ba3364be6b77f1ee8b40926d925e7736d05e566c0dfa09`.
Current bridge shell aggregate:
`7a0e41e9aba244309ac210710efdcf1ee823dfd889afbdb8fc25024839037400`.
All 97 current shell file hashes and all 26 overlay hashes were checked.
The reconstructed frontend is regression-equivalent, not a claim of historical
JavaScript byte equivalence. The historical import SHA stays unknown.

Preserved clean external reconstruction and original evidence in
`/var/tmp/oras-phase-c`: c0-build.log, c0-deep-links.log, c0-native-tests.log.
Fresh pivot qualification in `/var/tmp/oras-cesium`: native-conformance.log
**86 passed, zero skipped**; sky-deep-links.log **34 PASS/API_PASS/SEARCH_PASS**
including M31/M42/Vega/Hipparcos/Gaia, Moon/Jupiter/other planets, ISS and a visible
satellite. Identity and camera centering are both checked. No SWE upgrade or
vendor source modification was made by this pivot.

## Owned Earth and upstream dependency

`runtimes/earth-runtime` owns ViewerController, CameraController, LayerRegistry,
SelectionStore, AttributionManager, ProviderStatusRegistry, RuntimeLifecycle,
RuntimeBridge and EarthRuntime. Cesium 1.138.0, satellite.js 6.0.2, Vite 6.4.3
come from the externally pinned npm lock and a digest-pinned Node24 build.
The React shell never imports renderer objects. Runtime modules create ONE Viewer;
no God's Eye application startup or Viewer factory is imported.

External checkout `/var/tmp/oras-cesium/gods-eye` at
`e7707d9a0f34d9fbffc300023c319f95caa5be30` remained clean before/after builds.
Only public package surfaces:
`gods-eye-view/sources/adsb-lol`, `sources/live`, `layers/satellites/source`,
`sources/space`, `sources/regional`. Build module-policy lists nine upstream helper
modules and rejects src/main.js, standalone/application, app/, local_data and
models/events. No full-app HTML/CSS/chrome, application singleton or provider alias
is shipped. Upstream remains outside Hub source ownership, without submodule/fork.

Native ORAS marker: 41.321903, -79.585394, site elevation 432.816 m. Camera starts
at ORAS; deliberate zoom/inertia/double-click rules, packaged Natural Earth imagery
and explicit ellipsoid terrain. Selection/focus/tracking and responsive controls
are owned by ORAS. No measured horizon or guessed terrain is claimed.

Layers load only on enable, separate from Viewer/bridge readiness. Registry
cancels stale imports. Polling owns one bounded abortable request and timer.
Successful snapshots update stable entities so selection/tracking survive;
disable/destroy removes entities, pending requests, timers and subscriptions.
Cleanup continues to Viewer destruction even when a layer cleanup fails.

| Adapter | Reused export | Acquisition/time/data boundary |
| --- | --- | --- |
| Aircraft | adsb-lol normalization + sources/live normalizer | B: canonical FastAPI typed 100-NM transport, coarse-point cache/coalescing, 2 MB limit, bounded backoff; render only admitted fresh identity/position/geometric altitude, known position age. LIVE_ONLY. No sky projection. |
| Satellites | satellite source + CelesTrak URL helper | A: browser-safe stations source, four-hour acquisition cache/five-minute failure backoff; checksum/identity/epoch admission, satellite.js wall-clock SGP4. LIVE_ONLY; separate from ORAS science/data authority, no historical clock or handoff. |
| Weather | regional normalization/code label | A: Open-Meteo modeled current conditions, guarded temperature/UTC/code admission, five-minute polling. LIVE_ONLY; free non-commercial endpoint. Unknown code stays unavailable. |

Provider failure leaves Earth interactive; retry is explicit. Current external
live evidence is separate from fixture qualification: initial simultaneous probes
were unavailable; subsequent serial live probe loaded **20 satellites and one
modeled weather record** with source timestamps. Aircraft FastAPI acquisition
received **HTTP 403** and remained controlled unavailable. No blanket live-provider
or production readiness claim. Credentials/production/provider capacity remain
separate future deployment qualification.

Source-anchored ledger `integrations/gods-eye-capabilities.json`: 29 catalog layers,
38 capabilities and all 148 public exports/hashes. Current small adaptations do
not imply full flights/satellites/weather parity. Civil/military aircraft, vessels,
CCTV/media/traffic, fires/earthquakes/launches, weather/wind/cyclones, maps/terrain/3D,
infrastructure/datacenters/dams/cables/installations, transit/bikeshare/radio,
directions/drawing/annotations/scenes/director/search/tracking/cockpit/display
remain planned or explicitly blocked. Whole renderer/controllers and UI-bound
weather/cockpit paths require adapter work or an upstream hook; they were not
forced into the PR.

## License and hosting boundaries

God’s Eye code: MIT notice shipped. Dependency notices: 111 license/notice files.
No upstream third-party datasets/models/events are bundled. Restricted dynamic
imports are rejected, not merely hidden fetch URLs. Natural Earth imagery is
public domain; Cesium’s packaged credits/notices remain visible.
Aircraft API data: ODbL 1.0, source link/notice and response Content-License retained;
no persistent/repackaged dataset distribution. Weather data: CC BY 4.0, free API
non-commercial only. CelesTrak source/epoch credit retained; no bulk redistribution
permission inferred. Code license never substitutes for provider/data/asset terms.
Primary terms: [adsb.lol API](https://www.adsb.lol/docs/open-data/api/),
[Open-Meteo terms](https://open-meteo.com/en/terms),
[CelesTrak GP sets](https://celestrak.org/NORAD/elements/).

Independently built immutable Earth artifacts are mounted into a static Nginx
service, never copied into the Hub or baked with skydata. Hub hosting forwards
only `/earth-runtime/`; no complete-app API/static aliases or Node sidecar.
FastAPI is canonical; `/api/sky/object`, `/api/above-me` and Tonight are preserved.
Metadata binds exact pin, source inputs, dependencies and artifact files/hash.
Host rejects a mismatched artifact before mounting it. Source/file drift is
rejected by metadata recording. Nginx serves bridge .mjs as JavaScript.

## Hub bridge, state and cleanup

Protocol **1.0** in `packages/runtime-protocol`: validated expected origin/window
source, nonce, version/capabilities/generation handshake, then MessageChannel.
Session envelope and DTO guards reject stale generations/nonces, malformed
commands/results and incompatible majors. Same origin grants no message trust.
Close cancels timers/pending requests and listeners/ports. Hub state retains
bounded time/observer/canonical string identity; invalid/empty intent is rejected,
never converted into invented coordinates/time. No Cesium/SWE objects serialized.
Earth clock receives time; live layers explicitly retain their own time limits.
No Date monkeypatch. Sky realizes inputs through its contained adapter/URLs.

Routes `/earth`, `/earth-runtime/`, `/sky-engine`, `/oras-sky-engine/` qualified.
One settled runtime on desktop/mobile. Readiness is bound to mount identity,
preventing new-mode/old-frame status races. Teardown removes polling/entities,
selection/tracking/camera work/listeners/ports/Viewer and frame. Browser tests
observe disposed/destroyed Earth before frame removal, stale message rejection,
old frames disconnected and exactly one runtime after each switch.
Direct/reload/back/forward/retry/standalone routes and bad-artifact rejection passed.
No prewarm, second settled renderer, complete God’s Eye chrome or dashboard columns.

## Validation commands and observed results

All logs referenced here are private local evidence under `/var/tmp/oras-cesium`.
Initial failures were retained and corrected; only final passing artifacts qualify.
Commands (environment artifact path is always explicit):

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git log --oneline -5
git ls-remote --heads origin main phase-c-unified-sky-earth-runtime-1 phase-c-full-gods-eye-experiment-backup
git fetch origin main
sha256sum .vscode/settings.json frontend/public/oras-sky-engine/js/stellarium-web-engine.f0d016d1.wasm
node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs
.venv/bin/pytest -q backend/tests/test_earth_aircraft.py
docker exec astronomy-hub-backend-1 python3 -m pytest -q backend/tests/test_earth_aircraft.py
docker run --rm --user 0 -v /home/rocco/Astronomy-Hub/vendor/stellarium-web-engine:/app/vendor/stellarium-web-engine:ro astronomy-hub-backend bash -lc 'apt-get update -qq && apt-get install -y -qq gcc libz-dev && python3 -m pytest -q backend/tests/test_star_native_conformance.py'
npm run validate:oras-deep-links
cd frontend
npm run typecheck
npm test
npm test -- --run tests/runtimeProductState.test.ts tests/publicShell.test.tsx
npm run build
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test tests/e2e/ownedEarth.spec.ts tests/e2e/publicShell.spec.ts --workers=1 --output=/var/tmp/oras-cesium/playwright-qualified
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test tests/e2e/ownedEarth.spec.ts --grep 'serial five-switch|core and selective adapters fixture|all adapters unavailable' --workers=1 --output=/var/tmp/oras-cesium/playwright-retest
cd ..
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/var/tmp/oras-cesium/earth-release scripts/runtime/build_owned_earth.sh
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/var/tmp/oras-cesium/earth-release-reproduction scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-cesium/earth-release
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-b512266367ba4368a52a2f5385057357acbc05f8db23104c8f06ffc64f43d7cb COMPOSE_BAKE=false docker compose up -d --no-deps --build frontend earth-runtime
docker build -f frontend/Dockerfile.production -t oras-cesium-shell-qualification .
docker run -d --name oras-cesium-production-qualification --network astronomy-hub_default -p 127.0.0.1:4178:80 -v /home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/skydata:/usr/share/nginx/html/oras-sky-engine/skydata:ro oras-cesium-shell-qualification
python3 scripts/validation/validate_architecture_docs.py
git diff --check
```

Focused Node: **15 passed, zero skipped/failed**. Backend aircraft: **4 passed**
locally and in Docker. Full frontend: **158 passed/19 files**; subsequent focused
intent/shell regressions **10 passed/2 files**, including invalid UTC/empty values.
Typecheck and frontend build: PASS. Native science: **86 passed**, exact links:
**34 passed**. Broad Docker browser: **19 passed, one mobile mount-readiness race
failed**, then **six focused retests passed**, including both five-switch loops
and core/adapter/unavailable cases. Nginx production artifact: **four passed**
(core/adapters and loops on both desktop/mobile). Desktop 1440×900; mobile 390×844.
Final guards/attribution focused retests and final artifact identity follow below.

Final accepted owned-Earth suite: **10 passed (1.3m)**, including unavailable
providers, exact five-switch loops, direct/reload/history/retry, artifact mismatch,
standalone Sky/Earth and actual touch selection on mobile. Final production Nginx
build: **4 passed (42.7s)**, core/adapters and loops on both viewports. Attribution
geometry and screenshots were checked after the footer/diagnostic overlap repair.
Logs: `browser-accepted.log`, `production-browser-final.log`, `focused-node.log`.

Final accepted artifact SHA256:
`f91734134870362d0d1c342d426b3a3b124e5042f956f2a57fcaa89994c71245`.
Final-source independent outputs (`p1-final-build-1`, `p1-final-build-2`)
matched: 511 artifact files plus byte-identical release.json. Input/file/hash
verification passed for both builds and the immutable mount. See the final P1
correction acceptance below for commands and current production-class proof.
Immutable mount: `/var/tmp/oras-renderers/owned-earth-` followed by that SHA.

Machine-specific final-core fixture timings: desktop shell 231.8 ms, Viewer 232.8
ms, first enabled fixture layer 19.1 ms; mobile shell 239.2 ms, Viewer 240.2 ms,
first enabled fixture layer 17.6 ms. Production Nginx: desktop shell 242.4 ms,
Viewer 243.3 ms, activation 19.2 ms; mobile shell 212.8 ms, Viewer 213.8 ms,
activation 11 ms. Activation excludes user interaction delay. These local browser
measurements are not product performance guarantees or live-feed latency promises.
Screenshots `output/playwright/owned-earth-{desktop,mobile}.png` were inspected.

Historical initial acceptance commands (superseded by final P1 acceptance below):

```bash
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/var/tmp/oras-cesium/earth-accepted-release scripts/runtime/build_owned_earth.sh
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_EARTH_OUT=/var/tmp/oras-cesium/earth-accepted-reproduction scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-cesium/earth-accepted-release
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-a3d29f0d37648a268aaa342070e35e6265f2cd3d00babb9b52c4bb8797f1f7f1 COMPOSE_BAKE=false docker compose up -d --no-deps --build frontend earth-runtime
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-a3d29f0d37648a268aaa342070e35e6265f2cd3d00babb9b52c4bb8797f1f7f1 COMPOSE_BAKE=false docker compose up -d --no-deps --build backend
docker exec astronomy-hub-backend-1 python3 -m pytest -q backend/tests/test_earth_aircraft.py
bash -n scripts/runtime/build_current_sky.sh
node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs
cd frontend
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test tests/e2e/ownedEarth.spec.ts --workers=1 --output=/var/tmp/oras-cesium/playwright-accepted
cd ..
docker build -f frontend/Dockerfile.production -t oras-cesium-shell-final .
docker run -d --name oras-cesium-shell-final-qualification --network astronomy-hub_default -p 127.0.0.1:4179:80 -v /home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/skydata:/usr/share/nginx/html/oras-sky-engine/skydata:ro oras-cesium-shell-final
cd frontend
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4179 npx playwright test tests/e2e/ownedEarth.spec.ts --grep 'serial five-switch|core and selective adapters fixture' --workers=1 --output=/var/tmp/oras-cesium/playwright-production-final
cd ..
python3 scripts/validation/validate_architecture_docs.py
git diff --check
```

Docker backend/frontend/static Earth were running; frontend/static Earth healthy.
The obsolete provider container was preserved stopped, not removed. Qualification
Nginx containers are local-only. `COMPOSE_BAKE=false` was used for these builds.
The strengthened Sky builder identity guard passed syntax/actual-image identity
checks; the full native reconstruction was not repeated after adding that guard.
Existing GitHub CI is supporting evidence and does not run this Docker Earth suite.

Known inherited Sky dense-star tile 404s remain Category B; no global console-clean
claim. Runtime source/build warnings about a Cesium chunk >500 KB are Category B.
No secrets, pinned upstream edits, fake data, full-app startup, Sky corruption or
architecture/data-authority conflict was found in the one single-agent review.
Category A admission/readiness/attribution findings were fixed and focused retested.
No recursive full bot review requested.

Recommended next bounded task after owner approval: qualify live provider access
and broader core Earth feature parity/capabilities before ISS work. No next phase
started. No ISS handoff/injection/reconciliation, Mars/Moon/body runtime, astronomy
Earth extensions, measured horizon or final immersive UX was implemented.

## Commit and review stop gate

Implementation commits: `f6cc90ac` (Sky foundation), `b7a501b2` (owned Earth),
`6684df30` (bridge/hosting), `8348cff5` (focused Category A source admission and
attribution fixes). A final documentation commit records qualification.
The old branches remain local-only. Only `phase-c-cesium-earth-runtime-1` may be
pushed. One PR is authorized, without merging. GitHub checks/review state is a
separate post-push snapshot reported to the owner; no bot re-review loop.

Documentation validation: **160 path entries / 8 packs; 33 Markdown checkpoints /
65 links / 8 ADRs passed**. `git diff --check` passed. Owner editor hash matched.

## Historical normal PR review and initial focused corrections

[PR #55](https://github.com/Shadowgar/Astronomy-Hub/pull/55) opened at
`ad2e9ffded6988ce5bb19f4b927a5855a9023605`; initial CI passed Playwright, four
CodeQL analyses/aggregate and GitGuardian. CodeRabbit explicitly skipped review.
The automatic Codex and Copilot reviews completed in the same normal cycle.
No fresh full review was requested after corrections.

Verified Category A integration findings: production Compose retained the old
frontend-only build context; its Nginx upstream lacked an Earth service; required
artifact interpolation broke unrelated backend/Sky Compose targets. Corrected
production root-context build, Earth service/dependency, immutable read-only mount
and a safe parseable fallback whose missing source is never auto-created. Remote
deploy wiring now accepts/checks an explicitly provisioned absolute artifact path;
the script was syntax-checked, never executed against a remote host.

Also corrected the concrete per-location timeout risk: aircraft I/O no longer
holds the global cache lock. Same-point requests share one shielded bounded task;
unrelated points proceed independently, max 64 in flight, eight-second whole-call
deadline, bounded 30/60-second success/failure cache. A concurrency/coalescing test
failed with the old global lock, then passed with the correction. The existing
architecture roadmap table now agrees with the active pivot/merged PR #54.

Focused retest: **4 backend tests locally and in the new Docker image**;
production Compose independently built/started all five services under isolated
project `oras-cesium-prod-review`, local port 4180. Frontend/static Earth healthy;
`/earth`, `/earth-runtime/`, `/earth-runtime/release.json` returned HTTP 200.
**4 desktop/touch-mobile browser checks passed (43.3s)** against this exact stack,
including core/adapters and both exact five-switch teardown loops. Base Compose
without ORAS_EARTH_ARTIFACT_DIR parsed successfully. Build context, Earth dependency
and existing-only read-only artifact bind were checked in normalized configuration.
Earth source/artifact and Sky science bytes did not change during these corrections.
Logs: `production-compose-review.log`, `backend-review-docker.log`,
`browser-production-compose-review.log`. Final CI/thread state is reported separately
as the post-correction snapshot; no merge or new phase was performed.

```bash
env -u ORAS_EARTH_ARTIFACT_DIR docker compose config --quiet
bash -n scripts/deploy-remote-prod.sh
.venv/bin/pytest -q backend/tests/test_earth_aircraft.py
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-a3d29f0d37648a268aaa342070e35e6265f2cd3d00babb9b52c4bb8797f1f7f1 POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4180 COMPOSE_BAKE=false docker compose -p oras-cesium-prod-review -f docker-compose.prod.yml up -d --build
docker exec oras-cesium-prod-review-backend-1 python3 -m pytest -q backend/tests/test_earth_aircraft.py
cd frontend
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4180 npx playwright test tests/e2e/ownedEarth.spec.ts --grep 'serial five-switch|core and selective adapters fixture' --workers=1 --output=/var/tmp/oras-cesium/playwright-production-compose-review
cd ..
python3 scripts/validation/validate_architecture_docs.py
git diff --check
```

## Final P1 correction acceptance

This section supersedes the earlier artifact/deployment paths. Rebuilt from
final Earth/protocol inputs at PR HEAD `1438fae54dc200dc73a2ce7e177d196d30a99813`;
the frontend service extraction does not change those inputs. Two independent
clean output directories, each using a fresh `npm ci`, produced the same SHA:

`f91734134870362d0d1c342d426b3a3b124e5042f956f2a57fcaa89994c71245`.

Build #1 `p1-final-build-1` and build #2 `p1-final-build-2`: **511 files each**,
byte-identical `release.json`, 111 dependency licenses. The pinned external
checkout remained clean at `e7707d9a0f34d9fbffc300023c319f95caa5be30` before and
after both builds. The recorder verified every artifact byte/file, aggregate
hash and source input for both outputs and the immutable mounted copy. Metadata
was regenerated, not hand-edited: `runtime-versions.json` and
`renderers.lock.json` already recorded this reproducible SHA and remained
byte-identical. Their Earth upstream `sha` is the pin above; their
`artifact_sha256` is the accepted SHA above.

Current immutable deployment mount:
`/var/tmp/oras-renderers/owned-earth-f91734134870362d0d1c342d426b3a3b124e5042f956f2a57fcaa89994c71245`.
This path is outside the deployment rsync destination; no remote deployment was
performed. The earlier a3d29f artifact is historical and is not accepted for
current deployment.

Extracted `frontend/src/features/runtime/runtimeProbeService.ts`: a small typed
static-runtime service beside product state, separate from the backend-only
`/api/v1` client. It owns Sky reachability, Earth release/manifest requests,
identity validation and normalized errors. Both identity requests use `no-store`;
no in-memory result cache is introduced. A four-second whole-probe deadline bounds
release/body/manifest work; caller abort reasons propagate and the timer clears
on every exit. RuntimeHost calls the service with its mount AbortSignal and retains
its cancellation guards, retries, mount-key status isolation and serial disposal
queue. RuntimeHost has **zero direct fetch calls**. No renderer/provider/Sky
source changed.

Focused proof:

- Red: service test failed because the service module was absent, before extraction.
- Green: **16 service tests + 3 existing product-state tests passed**. Reachable Sky,
  HTTP/network failures, matching Earth identity, each owner/upstream/artifact
  mismatch, incomplete identity, failed manifest, pre/in-flight abort, bounded
  manifest timeout and fresh retry validation are covered.
- Typecheck: **passed**, `tsc --noEmit`, exit 0.
- Production Compose rebuilt only frontend/static Earth using `COMPOSE_BAKE=false`;
  existing local backend/database/Redis remained running. Both rebuilt services
  were healthy. This is local production-configuration proof, not public deployment.
- **3 focused browser tests passed (12.9s)** at `http://127.0.0.1:4180`:
  host/standalone identity + ready/non-destroyed Viewer; probe cancellation on
  unmount/fresh identity on return; direct reload/history/retry/mismatch rejection.
  `/runtime-versions.json` and `/earth-runtime/release.json` returned HTTP 200.
  The served owner was `Astronomy Hub`, upstream matched metadata's `earth.sha`,
  artifact matched metadata's `earth.artifact_sha256`; `/earth` reached `ready`
  with one iframe, `/earth-runtime/` rendered its live Viewer. Mismatched release
  was rejected before creating an iframe.
- Architecture-document validation and `git diff --check`: **passed**.
- Owner settings SHA remained
  `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

Exact commands for current final acceptance (repository root unless noted):

```bash
ORAS_EARTH_OUT=/var/tmp/oras-cesium/p1-final-build-1 scripts/runtime/build_owned_earth.sh
ORAS_EARTH_OUT=/var/tmp/oras-cesium/p1-final-build-2 scripts/runtime/build_owned_earth.sh
cmp /var/tmp/oras-cesium/p1-final-build-1/release.json /var/tmp/oras-cesium/p1-final-build-2/release.json
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-cesium/p1-final-build-1
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-cesium/p1-final-build-2
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-renderers/owned-earth-f91734134870362d0d1c342d426b3a3b124e5042f956f2a57fcaa89994c71245
cmp /var/tmp/oras-cesium/p1-final-build-1/release.json /var/tmp/oras-renderers/owned-earth-f91734134870362d0d1c342d426b3a3b124e5042f956f2a57fcaa89994c71245/release.json
git -C /var/tmp/oras-cesium/gods-eye rev-parse HEAD
git -C /var/tmp/oras-cesium/gods-eye status --porcelain
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-f91734134870362d0d1c342d426b3a3b124e5042f956f2a57fcaa89994c71245 POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4180 COMPOSE_BAKE=false docker compose -p oras-cesium-prod-review -f docker-compose.prod.yml up -d --no-deps --build earth-runtime frontend
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-renderers/owned-earth-f91734134870362d0d1c342d426b3a3b124e5042f956f2a57fcaa89994c71245 POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4180 docker compose -p oras-cesium-prod-review -f docker-compose.prod.yml ps
cd frontend
npx vitest run tests/runtimeProbeService.test.ts tests/runtimeProductState.test.ts
npm run typecheck
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4180 npx playwright test tests/e2e/runtimeProbeHost.spec.ts tests/e2e/ownedEarth.spec.ts --grep 'final Earth artifact identity|RuntimeHost cancels|direct reload history retry and artifact rejection desktop' --workers=1 --output=/var/tmp/oras-cesium/p1-production-browser
cd ..
python3 -S scripts/validation/validate_architecture_docs.py
git diff --check
sha256sum .vscode/settings.json
```

Build logs: `/var/tmp/oras-cesium/p1-final-build-{1,2}.log`; production build/browser
logs: `p1-production-compose.log`, `p1-production-browser.log` in the same directory.
CI/review-thread resolution is a post-push snapshot reported separately. No broad
review requested, no merge, UX/design, visual/provider/feature work, broad science
rerun or full visual campaign. Existing dense-star tile 404s and Cesium bundle-size
warning remain inherited Category B gaps. No remaining Category A blocker in the
two corrected findings; this proof does not establish public provider availability.

## Exact changed files relative to verified main (initial qualification snapshot)

Owner editor settings excluded and unchanged by this task.

```text
.dockerignore
.env.example
.gitattributes
backend/app/main.py
backend/app/routes/earth.py
backend/tests/test_earth_aircraft.py
docker-compose.prod.yml
docker-compose.yml
docs/architecture/STACK_OVERVIEW.md
docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md
docs/context/CONTEXT_MANIFEST.yaml
docs/context/CORE_CONTEXT.md
docs/context/LIVE_SESSION_BRIEF.md
docs/execution/MASTER_PLAN.md
docs/execution/PROJECT_STATE.md
docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md
frontend/Dockerfile
frontend/Dockerfile.production
frontend/nginx.conf
frontend/public/oras-sky-engine/index.html
frontend/public/oras-sky-engine/js/app.661f6dd4.js
frontend/public/runtime-versions.json
frontend/src/components/shell/OrasAppShell.tsx
frontend/src/components/shell/publicShell.css
frontend/src/features/runtime/productState.ts
frontend/src/features/sky-engine/RuntimeHost.tsx
frontend/src/routes/AppRouter.tsx
frontend/tests/e2e/ownedEarth.spec.ts
frontend/tests/e2e/publicShell.spec.ts
frontend/tests/publicShell.test.tsx
frontend/tests/runtimeProductState.test.ts
frontend/vite.config.mjs
integrations/gods-eye-capabilities.json
integrations/renderers.lock.json
integrations/sky-overlay/apps/web-frontend/.env.production
integrations/sky-overlay/apps/web-frontend/.gitignore
integrations/sky-overlay/apps/web-frontend/package-lock.json
integrations/sky-overlay/apps/web-frontend/package.json
integrations/sky-overlay/apps/web-frontend/public/index.html
integrations/sky-overlay/apps/web-frontend/src/App.vue
integrations/sky-overlay/apps/web-frontend/src/assets/oras_catalog_packs.js
integrations/sky-overlay/apps/web-frontend/src/assets/oras_data_config.js
integrations/sky-overlay/apps/web-frontend/src/assets/oras_dense_stars.js
integrations/sky-overlay/apps/web-frontend/src/assets/sw_helpers.js
integrations/sky-overlay/apps/web-frontend/src/components/gui-loader.vue
integrations/sky-overlay/apps/web-frontend/src/components/location-mgr.vue
integrations/sky-overlay/apps/web-frontend/src/components/oras-catalog-status-dialog.vue
integrations/sky-overlay/apps/web-frontend/src/components/oras-dense-stars-status-dialog.vue
integrations/sky-overlay/apps/web-frontend/src/components/selected-object-info.vue
integrations/sky-overlay/apps/web-frontend/src/components/skysource-search.vue
integrations/sky-overlay/apps/web-frontend/src/components/target-search.vue
integrations/sky-overlay/apps/web-frontend/src/components/toolbar.vue
integrations/sky-overlay/apps/web-frontend/src/locales/de.json
integrations/sky-overlay/apps/web-frontend/src/locales/en.json
integrations/sky-overlay/apps/web-frontend/src/locales/fr.json
integrations/sky-overlay/apps/web-frontend/src/main.js
integrations/sky-overlay/apps/web-frontend/src/store/index.js
integrations/sky-overlay/apps/web-frontend/vue.config.js
integrations/sky-overlay/apps/web-frontend/yarn.lock
integrations/sky-overlay/src/modules/stars.c
packages/runtime-protocol/client.d.mts
packages/runtime-protocol/client.mjs
packages/runtime-protocol/endpoint.mjs
packages/runtime-protocol/index.d.mts
packages/runtime-protocol/index.mjs
runtimes/README.md
runtimes/earth-runtime/Dockerfile
runtimes/earth-runtime/core/AttributionManager.mjs
runtimes/earth-runtime/core/CameraController.mjs
runtimes/earth-runtime/core/EarthRuntime.mjs
runtimes/earth-runtime/core/LayerRegistry.mjs
runtimes/earth-runtime/core/ProviderStatusRegistry.mjs
runtimes/earth-runtime/core/RuntimeBridge.mjs
runtimes/earth-runtime/core/RuntimeLifecycle.mjs
runtimes/earth-runtime/core/SelectionStore.mjs
runtimes/earth-runtime/core/ViewerController.mjs
runtimes/earth-runtime/entry.mjs
runtimes/earth-runtime/index.html
runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs
runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs
runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs
runtimes/earth-runtime/layers/PollingLayer.mjs
runtimes/earth-runtime/layers/data.mjs
runtimes/earth-runtime/layers/entities.mjs
runtimes/earth-runtime/nginx.conf
runtimes/earth-runtime/style.css
runtimes/earth-runtime/vite.config.mjs
runtimes/sky-adapter/entry.mjs
runtimes/sky-adapter/plugin.js
scripts/deploy-remote-prod.sh
scripts/runtime/apply_sky_overlay.py
scripts/runtime/build_current_sky.sh
scripts/runtime/build_owned_earth.sh
scripts/runtime/copy_dependency_licenses.py
scripts/runtime/generate_capability_ledger.py
scripts/runtime/integrate_sky_bridge.py
scripts/runtime/record_owned_earth.py
scripts/runtime/record_runtime_versions.py
tests/earth/admission.test.mjs
tests/earth/lifecycle.test.mjs
tests/runtime/channel.test.mjs
tests/runtime/protocol.test.mjs
```
