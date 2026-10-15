## PR #75 — near-surface zoom correction, 2026-10-15

N1 remains unaccepted. The owner rejected the previous fast near-surface profile.
[New calibration evidence](n1-zoom-curve/README.md) supersedes prior Earth zoom
measurements: 17 ordinary notches from 40 km to the 1.5 km entry band, versus
seven before. Application source `fa29b01ce589afa689bf02ce1b196e3ab3cb33f7` changes
only the Earth gain curve in production source. Ordinary, small-delta, rapid,
reverse and deliberate Central Park Sky-entry browser checks pass. Other N1
behavior is unchanged; earlier broad desktop/mobile proof remains historical.
Stop for owner testing, with no merge, deployment or N2.

## PR #75 repair — N1 NOT ACCEPTED, 2026-10-14

The owner rejected N1 at `8fe05ca1a8505dc20449635fa47b615e4bd23a0c` after
actual ChatGPT-browser scrolling failed to leave Sky and Earth approach required
excessive input. The historical 40 automated checks below do not establish product
acceptance. The active task repairs continued wheel intent, altitude-aware Earth
zoom and standalone native landscape selection on the same PR/branch. Preserve
#75 → #74 → #73, $0 providers, existing science/data/settings and renderer ownership.
No merge, deploy or N2. Fresh representative Chromium desktop/touch qualification
and owner testing are required; the exact owner browser cannot be automated here.

[PR #75 scroll repair evidence](n1-scroll-repair/README.md) supersedes the old
wheel qualification below. It retains rejected-head reproductions, corrected
real Chromium input and zoom measurements, source/artifact identities, failed
attempts, standalone landscape proof and final qualification status. N1 is still
pending owner acceptance; old automated checks are not owner acceptance.


## N1 — bidirectional Sky ↔ Earth navigation, 2026-10-14

**REAL within the bounded local Docker/browser scope; owner acceptance is pending.**
Branch `n1-sky-earth-navigation-1`, exact base PR #74
`a57532796502a1db9ae1a7e4e4dc83e113db558f`; unmerged dependency chain is
N1 → PR #74 → PR #73. No merge or deployment. Application source is committed at
`fd078b7df28683d596ea6fb925470060959ee8f6`; the mobile-only runner timing correction
is `d6eae34bbed6fad52e45a85195376f14fa5790ac`. Delivery commits after these heads add qualification evidence/control-document
reconciliation and the explicitly documented fallback-caption CSS correction. Runtime file hashes in both ledgers bind the
actual tested code and built application to the delivered source.

Owner preview: <http://127.0.0.1:4202/sky-engine>. Use Explore in either view;
Earth Explore accepts coordinates and provides **Enter Sky here**. Central Park
qualification target is `40.7829, -73.9654`. The earlier owner preview remains
<http://127.0.0.1:4201/sky-engine>. These are local loopback previews, not deployment.

Default Mode. The [46-document load ledger](n1-navigation/loaded-documents.txt)
is the manifest `frontend_change`/`validation` union; CORE/LIVE were read first.
No extra governing project documents were loaded. The old no-scroll/FOV activation
limit and legacy frontend BabylonJS port instructions were surfaced and superseded
by the explicit N1 instruction/current contained-SWE architecture. One agent.
The [implementation file ledger](n1-navigation/implementation-files.txt) lists the
45 changed implementation/control/test/artifact files; subsequent evidence files
are under this directory and this existing evidence document.

### Implemented and tested conditions

- Normal wheel input still executes native SWE zoom. Native source/browser agree
  on the default stereographic outward clamp **185°**; its inward constant is
  **one arcsecond**, despite the stale nearby native comment mentioning 0.5°.
  Other projection UI maxima are source-bound constants, but the journey browser
  qualification here is for the default stereographic projection.
- Hysteresis latches at 185° and releases below 180°. Earth latches within
  **1500 m of the actual view-center surface intersection**, releasing beyond
  **2500 m**. The admitted default surface is explicitly the ellipsoid.
- A sustained burst reaching the clamp cannot switch modes. Pause at least
  **280 ms**, then continue in the same direction: at least **360 normalized
  pixels**, **three processed wheel events** and **200 ms** of continued input.
  Use event timestamps, not delayed handler execution times. Browser coalescing
  can require more physical input; qualified runs used eight 120-pixel inputs
  or thirty 24-pixel inputs for the continued gesture. Reversal/pan/cancellation
  discards accumulated intent; restore/cancel blocks input for one second.
- Sky → Earth uses Cesium's native look-at target and releases its temporary
  transform. Earth appears from space centered on the current observer; it does
  not claim an identical Sky/Earth projection. Nadir wheel zoom preserves native
  world direction/up. Back restores the bounded native camera snapshot.
- Earth → Sky picks the actual surface target. ORAS alone has qualified site
  height `432.816 m`; native picking's approximately one-metre coordinate
  precision envelope retains that height **without snapping coordinates**.
  Elsewhere `0 m` is explicitly marked **elevation unavailable / fallback**.
  Camera height is a separate value. No new terrain/provider/datum qualification.
- Bridge **1.2**, optional `viewNavigation` capability: bounded per-renderer
  camera DTOs, observer/UTC/live intent, geographic navigation and continuation
  events. Existing session/origin/source/nonce/generation validation and serial
  renderer lifetime remain. A connected destination client is required before
  completion; the prior mode's transient `ready` status cannot close Cancel.
- Native neutral **zero horizon** at all unqualified locations, per owner answer.
  Installed panorama identifies Guéreins, not verified ORAS. Existing panorama
  assets remain intact. Landscape is still a native toggle; no panorama system.
- Native Night Mode remains Sky-only and survives mode cycles/reload. Saved ORAS
  home definition is unchanged; exploration context is per session/history.

### Actual browser proof and timing

**20 desktop + 20 touch/mobile journey checks PASS; zero JavaScript page errors.**
Chromium 145 on Linux, ANGLE/Vulkan **SwiftShader**. Desktop 1440×900; mobile
390×844 with actual browser touch emulation and reduced motion. Native mouse drag,
CDP real WheelEvents at source cadence, native touch drag, tap and keyboard paths
are exercised. This is real application/Docker rendering, not a fixture scene or
mocked scientific response; it is not physical trackpad/phone/GPU qualification.
Only cancellation negative checks hold delivery of actual destination/snapshot
bytes; neither engine state nor successful responses are fabricated.

[Desktop subset ledger](n1-navigation/desktop-proof.json) ·
[mobile ledger](n1-navigation/mobile-proof.json) ·
[complete combined attempt](n1-navigation/combined-attempt.json).
The complete combined attempt remains **FAIL** because its mobile Explore runner
hit the pre-existing auto-hide timer; its desktop subset is explicitly **PASS**.
The later mobile-only run settles native touch input before using Show controls
and Explore and passes all 20 checks. Application/artifact hashes match across
both journey proofs; only the driver settling delay changed. A subsequent single
CSS height rule prevents the new third-line elevation caption from clipping.
[Focused caption proof](n1-navigation/caption-proof.json) binds that changed CSS
and proves all caption text fits on both viewports, with
[desktop](n1-navigation/sky-caption-1440.png) and
[mobile](n1-navigation/sky-caption-390.png) captures. Navigation code and renderer
artifacts are unchanged by this final display correction. No failed run was relabeled.

| Required journey | Desktop | Mobile |
| --- | --- | --- |
| ORAS Sky → Earth → ORAS Sky, time/height/timezone retained | PASS | PASS |
| Earth drag → Central Park → native inward Sky entry → outward Earth at New York | PASS | PASS |
| Three further full outward/inward cycles, ordinary input and reversal safeguards | PASS | PASS |
| Cancel during loading; Back during pending snapshot; Escape; Back/Forward | PASS | PASS |
| Fixed UTC and live time; Night ON/OFF and reload; neutral horizon and toggle | PASS | PASS |
| Wheel/trackpad-sized input, native drag, Explore keyboard/tap and 44px targets | PASS | PASS |

Measured successful cross-mode overlay lifetime: **desktop 1.16–3.73 s**,
**mobile 0.68–1.44 s**. These include real source save/disposal and destination
bootstrap/acknowledgement. Initial Sky ready: desktop **1.927 s**, mobile
**1.499 s**. Whole journey steps include zooming, deliberate pause, input, dialog
interaction and screenshot overhead; see the ledgers rather than treating those
longer step times as pure handoff latency. Normal motion uses a 200 ms serial fade
through loading; reduced motion removes the fade/flight animation. There is no
projection morph or overlapping renderers. Desktop observed **20** frame removals,
mobile **21**, with peak **one**; initialized Earth removals show disposed Viewer,
and departed Sky frames show native disposal before removal.

| Visible state | Desktop | Mobile |
| --- | --- | --- |
| ORAS Sky | [Sky](n1-navigation/oras-sky-1440.png) | [Sky](n1-navigation/oras-sky-390.png) |
| Earth from ORAS | [Earth](n1-navigation/oras-earth-1440.png) | [Earth](n1-navigation/oras-earth-390.png) |
| Central Park Earth approach | [Earth](n1-navigation/new-york-earth-1440.png) | [Earth](n1-navigation/new-york-earth-390.png) |
| New York Sky / neutral horizon | [Sky](n1-navigation/new-york-sky-1440.png) | [Sky](n1-navigation/new-york-sky-390.png) |
| Return Earth at New York | [Earth](n1-navigation/new-york-return-earth-1440.png) | [Earth](n1-navigation/new-york-return-earth-390.png) |
| Cancel while destination loading | [Cancel](n1-navigation/cancel-loading-1440.png) | [Cancel](n1-navigation/cancel-loading-390.png) |
| Touch Explore | — | [Explore](n1-navigation/mobile-explore-390.png) |

An additional real **M31 exact-link Sky → Earth → Sky selection round trip passes**:
[exact output](n1-navigation/selection-smoke.log),
[visible selection](n1-navigation/selection-roundtrip.png). Canonical catalog/source
identity and fixed UTC survive; native camera restoration remains in SWE.

### Commands and results

Exact final qualifying commands from the isolated worktree:

```bash
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run build
python3 scripts/runtime/record_sky_workspace.py output/n1/sky-app/dist
python3 scripts/runtime/record_owned_earth.py /var/tmp/oras-cesium/gods-eye output/n1/earth
python3 scripts/runtime/record_runtime_versions.py output/n1/earth
python3 scripts/runtime/earth_artifact.py verify --source output/n1/earth
python3 scripts/validation/validate_architecture_docs.py
git diff --check
N1_EVIDENCE_DIR=output/n1/browser-final PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs node scripts/validation/verify_n1_navigation.mjs
N1_WIDTHS=390 N1_EVIDENCE_DIR=output/n1/browser-mobile-final PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs node scripts/validation/verify_n1_navigation.mjs
```

[Runtime output](n1-navigation/runtime.tap): **110 passed / 0 failed**.
[Frontend output](n1-navigation/frontend.log): **237 passed in 31 files**.
[Typecheck](n1-navigation/typecheck.log): exit 0. Hub build exit 0.
Architecture validation: **309 manifest path entries / 8 packs**, **57 checkpoint
Markdown files**, **1516 references** including 16 registered private historical
artifacts; PASS. Whitespace PASS. No backend/provider/data source changed; no broad
backend or full standalone deep-link suite is claimed. Actual M31 and the new
navigation paths provide bounded browser regression coverage. Genuine full-document
bfcache remains the prior PR #74 **NOT_SUPPORTED** preview limit; tested Back/Forward
here are actual application history transitions, not a cached-document claim.

Sky build used the existing qualified frontend inputs and read-only dependencies:

```bash
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/n1-sky-earth-navigation-1/output/n1/sky-app:/work -v /var/tmp/oras-phase-c/sky-reconstruction/upstream/apps/web-frontend/node_modules:/work/node_modules:ro -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096' node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 npm run build
```

Earth build uses the same immutable feature-code/toolchain pin and no network:

```bash
docker run --rm --network none --user 1001:1001 -v /var/tmp/oras-cesium/gods-eye:/source:ro -v /home/rocco/Astronomy-Hub/.worktrees/n1-sky-earth-navigation-1:/hub:ro -v /home/rocco/Astronomy-Hub/.worktrees/n1-sky-earth-navigation-1/output/n1/earth:/output -e GODS_EYE_SOURCE=/source -e ORAS_EARTH_OUT=/output node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node /source/node_modules/vite/bin/vite.js build --configLoader native --config /hub/runtimes/earth-runtime/vite.config.mjs
```

Application runs in `oras-n1-owner-preview`, existing Nginx image, loopback 4202,
existing read-only Skydata/catalog/dense-star mounts and the existing local preview
backend/network. No Docker volume changes, new account/provider/graphics library,
Google API use, subscription, astronomy-data replacement, merge or deployment.

### Preserved failures, limits and rollback

Ignored `output/n1/` retains all failed builds, red/green TAP, screenshots and browser
attempts. Failures included wrong build UID (1000 versus actual 1001), unwanted Babel
vendor helper/polyfill drift (repaired; native/vendor identity gate retained),
geodetic-position versus actual view-center discrepancy, input-handler delay used
as gesture time, the async coordinate seed race, native clamp rounding, the
unnecessary 2.5-second pause expiry, event coalescing and the stale source-ready
status that hid Cancel. The last defect has an actual [state audit](n1-navigation/cancel-state-audit.log)
and [focused green restoration](n1-navigation/cancel-green.log). Temporary diagnostic
code and the unnecessary state-carry experiment were removed before qualification.

Known limits remain explicit: SwiftShader/emulated input is not owner hardware
acceptance; photographic landscapes and terrain-derived horizons are not built;
only ORAS has qualified observer height. Existing data/provider gaps remain:
desktop observed **582** resource failures (149 unique status/URL pairs) and
**1307** native HiPS iterator warnings; mobile **718** failures (130 unique pairs)
and **5721** warnings. The majority are missing pre-existing dense-star tiles;
other unavailable source/aborted cancellation requests are retained verbatim in
the ledgers. They are not zero-console-error claims, and no dataset or provider
was replaced to hide them. No JavaScript page error or persistent navigation loader
was observed in the completed journeys. Owner must judge the visible transitions
on their actual device. Physical Safari/iOS/Android/GPU speed is unqualified.

[Preservation ledger](n1-navigation/preservation.json) confirms exact native WASM
and vendor hashes, source pins, unchanged owner settings/home, read-only astronomy
mounts and the original preview/artifacts. Only justified UI/camera/bridge artifacts
were rebuilt: Sky `3077fe46d2b5df4d45482ebd1eb3073a3f9e8548b6ce1aba3060d2df1bd028c1`,
Earth `7b90e515892f507bb3ff1388ade53469193652f22f9f197bb94392f950345319`.

Rollback: stop only `oras-n1-owner-preview` and use the unchanged port 4201 preview
or PR #74 base. Preserve this branch/evidence and all read-only data/artifacts.
To resume the existing N1 preview, `docker start oras-n1-owner-preview`.
Do not remove volumes, reset the owner checkout or merge dependent PRs.

**STOP for owner acceptance of functioning N1.** Recommended next task is owner
review of this preview/PR. N2 Three.js Solar System View, using existing JPL/Skyfield
scientific data, remains separately authorized future work; it has not started.

---

# ORA-7 unified workspace implementation evidence


## PR #74 final lifecycle corrections — 2026-10-14

Owner authorizes only the two P2 corrections from reviewed head
`a01dfcf7993b6c0aac6cd7d1fa60b05cba30c0d3`. Corrected source is
`2811a511faa7daca42f1fce7a59a39bbeefed0eb`, on the same implementation branch.
The three prior owner-approved corrections, native science, styling and Night
persistence remain unchanged. No new milestone, merge or deployment.

The fullscreen component retains its single document listener during persisted
`pagehide`, and `pageshow` replays the actual document state through the original
native store callback. Genuine departure, adapter disposal and Vue destruction
remove the fullscreen, resume, departure and disposal listeners. Repeated cached
cycles do not register additional listeners. The lifecycle VM now injects the
**real** `installSkyNightReports`, while retaining all six existing lifecycle
cases. Two additional integration cases prove native Night reports survive cached
cycles and release every reporter-owned listener on genuine departure or explicit
adapter destruction; late ready/change/hello events cannot emit stale reports.

Fresh red/green evidence: the complete baseline suite had **37 PASS / 6 FAIL**,
all six failures being the missing Night reporter binding. The added fullscreen
regressions reproduced stale resume state and a missing listener (**10 PASS /
2 FAIL**). After correction, focused tests are **20 PASS / 0 FAIL**. The mandatory
complete suite is **48 PASS / 0 FAIL / 0 SKIP**, all 11 runtime test files:
[exact TAP output](r1b-sky-corrections/runtime-suite-2026-10-14.tap).
This supersedes the prior *selected* 23 runtime checks as suite coverage; the old
counts below remain historical evidence for their recorded revision.

Browser result: **NOT_SUPPORTED** for actual cached return in this preview.
[Full Chromium proof](r1b-sky-corrections/cached-fullscreen-proof.json) binds source
hashes, served Hub JS, served Sky bundle and artifact marker to the committed
source above. Chromium launched and the initial real Fullscreen action/state/label
assertions ran, but Back loaded a fresh document (`pageshow.persisted` remained
false). CDP reported `MainResourceHasCacheControlNoStore`,
`JsNetworkRequestReceivedCacheControlNoStoreResource`, and
`BrowsingInstanceNotSwapped`. The first headless-shell attempt also reported
`BackForwardCacheDisabledForDelegate`; both attempts and errors are preserved in
local `output/r1b-cached-fullscreen/`. There is **no successful cached-browser
qualification or new qualifying screenshot**. Mobile cached-return qualification
was not reached. No synthetic browser events are presented as actual cache proof;
repeated persisted lifecycle behavior and exact labels are proven by focused tests.
Resume actual desktop/mobile cache qualification on a cache-eligible local server;
preview cache headers and application runtime policies were not changed here.

Commands actually run from the existing worktree:

```bash
node --test tests/runtime/*.test.mjs
node --test tests/runtime/adaptive-sky-controls.test.mjs tests/runtime/sky-page-lifecycle.test.mjs
node --check runtimes/sky-adapter/plugin.js
node --check tests/runtime/sky-page-lifecycle.test.mjs
node --check tests/runtime/adaptive-sky-controls.test.mjs
node --check scripts/validation/verify_sky_cached_fullscreen.mjs
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
python3 scripts/runtime/integrate_sky_bridge.py output/r1b/sky-build/upstream/apps/web-frontend
python3 scripts/runtime/record_sky_workspace.py output/r1b/sky-build/upstream/apps/web-frontend/dist
npm --prefix frontend run build
PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs R1B_EVIDENCE_DIR=output/r1b-cached-fullscreen/full-chromium node scripts/validation/verify_sky_cached_fullscreen.mjs
```

Syntax, manifest/document/reference and whitespace checks PASS. Frontend build
PASS. The established offline pinned Node 20 container built the Sky UI twice;
all **95 payload files** match across builds, with **96 attested files** including
its marker. Both logs contain no `Syntax Error`, `Module Error`, `ERROR`, or
`Module build failed` markers. Inherited bundle-size/Browserslist notices remain.
Reattested Sky artifact:
`3b630bc63f8d8cf89b607886f7964f76522b0bdced450abf2663300c0e27c813`.
Native WASM/vendor chunks, SWE comparison anchor and Earth lock identity match the
reviewed base. The `c95664c19df717c2f7087b0e22ffab28210fb1cee42a91969005697f79b2f7d5`
Sky artifact remains a preserved Git rollback at `a01dfcf7993b6c0aac6cd7d1fa60b05cba30c0d3`.
Root owner settings retain SHA-256
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
No data, dependency, source pin, native science, Earth payload, Docker volume,
container configuration or production state changed.

Owner application preview remains <http://127.0.0.1:4201/sky-engine>. PR #74 stays
unmerged, dependent on unmerged PR #73. STOP for owner review; actual cached-page
browser qualification remains outstanding. No cold-search or scroll/FOV work.

## PR #74 Sky corrections — 2026-10-14

Exactly three owner-authorized corrections continue branch
`r1-b-adaptive-sky-implementation-1` from `4c1d58bb5cad2b6df56ee1586be55ed6db904bc7`.
PR #73 remains the unmerged design dependency; no merge/deployment/later milestone.
**Qualified source: `625376a0e24d26175e402077c27614bda67369d5`.**
The older R1-B evidence below qualifies only its recorded source. New desktop and
mobile ledgers bind these corrections to their exact source hashes and served
application bytes: [desktop proof](r1b-sky-corrections/desktop-proof.json),
[mobile proof](r1b-sky-corrections/mobile-proof.json). Access the exact JSON ledgers
through this manifest-loaded document; no manifest routing change is needed.

Native SWE remains the only Night Mode toggle owner. The original BottomBar method
sets the native state and canvas overlay. A minimal `oras-sky-night.v1` report in
the existing Sky presentation module reflects a boolean through the qualified
parent hello, with origin/frame/nonce/generation, exact-field and monotonic-ID
validation. Hub chrome uses Sky-only red tokens; native panels/search/credits use
red UI rules. Neither the iframe nor the canvas receives another CSS filter.
The native canvas overlay remains unchanged. Menus, dialogs, selected-object
information, inputs, tooltips, focus and text selection use the red appearance.
Disabling the native setting restores the approved normal styling.

The reported native preference is stored under `oras.sky.night-mode.v1` in local
storage, with an in-memory fallback if storage is blocked. The host reads it for
its initial Sky style and the Sky-only `orasNightMode` bootstrap parameter; the
new SWE instance restores it through the original native method before reporting
ready. Native state is replayed at the qualified hello/engine-ready boundary.
Earth receives neither the bootstrap setting nor the Sky red class. There is no
second Hub toggle, iframe DOM scraping or shared Earth-protocol change.

Coordinate drafts remain strings, including intermediate minus/decimal text.
Submission alone parses decimal/scientific numeric syntax, checks finite values
and the existing observer bounds, then sends numeric intent. Missing/invalid/
out-of-range values display an error and send no intent. ORAS reset is preserved.
Fullscreen mounts register the existing listener and immediately invoke the native
callback with current browser state; remounted Sky shows Exit fullscreen whenever
the whole Hub remains fullscreen. Disposal retains the existing listener cleanup.

| Actual application state | Desktop 1440×900 | Mobile viewport 390×844 |
| --- | --- | --- |
| Night OFF | [Desktop OFF](r1b-sky-corrections/night-off-1440.png) | [Mobile OFF](r1b-sky-corrections/night-off-390.png) |
| Night ON, same initial view | [Desktop ON](r1b-sky-corrections/night-on-1440.png) | [Mobile ON](r1b-sky-corrections/night-on-390.png) |
| Native observing panel | [Desktop tools](r1b-sky-corrections/night-observing-1440.png) | [Mobile tools](r1b-sky-corrections/night-observing-390.png) |
| Explore dialog | [Desktop dialog](r1b-sky-corrections/night-explore-1440.png) | [Mobile dialog](r1b-sky-corrections/night-explore-390.png) |
| Native selection / Hub information | [Desktop selection](r1b-sky-corrections/night-selection-1440.png) | [Mobile selection](r1b-sky-corrections/night-selection-390.png) |
| Signed input / red text selection | [Desktop location](r1b-sky-corrections/night-location-1440.png) | [Mobile location](r1b-sky-corrections/night-location-390.png) |

Browser PASS on both viewports: native Night ON/OFF; external header/Explore,
native search/tools, credits, menus, dialogs, selection, location and time styling;
red text selection; no additional canvas filter; Night ON through two Earth/Sky
round trips per viewport and reload; explicit OFF survives reload; Earth retains
normal colors. Fullscreen persists through those four round trips, agrees with
native state and labels on each remount, and exits correctly. One fullscreen
listener exists in Sky and zero remain on Earth. Exactly one renderer iframe;
canonical Vega identity is restored; keyboard/Escape focus and advanced 44px
observing target are preserved. Zero JavaScript page errors.

Sequential typing of `-33.875`, `-80.125` and `12.5` preserves the exact draft and
sets those actual native observer values. Partial `-`, empty longitude, malformed
`NaN`, and out-of-range latitude/longitude/elevation produce zero observer writes.
The original ORAS reset, search, observing time and selection contracts survive.
The existing bounded all-ten-controls desktop/mobile regression passed **2/2**,
with zero JavaScript page errors: [control regression proof](r1b-sky-corrections/observing-regression-proof.json).
Its screenshot filenames refer to the preserved local
`output/r1b-corrections/observing-regression/` directory; the new Night Mode
screenshots above are committed separately. No old screenshot is used as proof for these source changes.

Commands actually used (from the existing worktree):

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run test
node tests/runtime/adaptive-sky-controls.test.mjs
node tests/runtime/sky-night-mode.test.mjs
node tests/runtime/sky-native-controls.test.mjs
node tests/runtime/sky-native-panels.test.mjs
node tests/runtime/sky-wheel.test.mjs
node tests/runtime/workspace-protocol.test.mjs
node tests/runtime/sky-artifact.test.mjs
node --check runtimes/sky-adapter/plugin.js
node --check runtimes/sky-adapter/entry.mjs
node --check runtimes/sky-adapter/native-panels.mjs
node --check scripts/validation/verify_sky_corrections.mjs
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs R1B_WIDTHS=1440 R1B_EVIDENCE_DIR=output/r1b-corrections/final-desktop node scripts/validation/verify_sky_corrections.mjs
PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs R1B_WIDTHS=390 R1B_EVIDENCE_DIR=output/r1b-corrections/final-mobile node scripts/validation/verify_sky_corrections.mjs
PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs R1B_EVIDENCE_DIR=output/r1b-corrections/observing-regression node scripts/validation/verify_adaptive_sky.mjs
```

Static/type/whitespace checks PASS; frontend **234/234** (30 files); native/runtime
**23/23** (9 control/lifetime, 3 Night reports, 3 keyboard, 2 panels, 2 wheel,
3 shared protocol, 1 artifact). Document/manifest/reference checks PASS, including
all new evidence paths. Night/typing/fullscreen browser correction runs **2/2 PASS**.
Screenshots are software-rendered Chromium viewport evidence, not physical-device
or owner acceptance. No new performance claim is made.

Sky UI build/reattest used the same isolated staged app, pinned Node20 Docker
image and read-only cached dependencies as the initial R1-B process below, with
`--network none`, `ORAS_RUNTIME_COPY_SKYDATA=0`; the pinned legacy ESLint formatter
was run on the isolated plugin copy before building. The final module build was
checked for warning-only compilation failures, then `record_sky_workspace.py`,
Sky-only public version synchronization and `npm --prefix frontend run build` ran.
A second build reproduced all 95 application files byte-for-byte.
New Sky artifact: `c95664c19df717c2f7087b0e22ffab28210fb1cee42a91969005697f79b2f7d5`.
Rollback source/artifact: `4c1d58bb5cad2b6df56ee1586be55ed6db904bc7` /
`06f92b7e2851ec975c055980068fdcea2cf158c2d4bc9e58115452529baeb456`.
Native WASM/vendor chunks, comparison anchor, shared protocol, complete Earth lock,
Earth assets, God's Eye pin, astronomy data, dependencies and owner settings remain
unchanged. Existing preview containers were resumed; original mounts/volumes were
not changed. Owner settings SHA256 remains
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

All three failures were reproduced against the old actual application first:
minus sign lost, Hub identity `rgb(244,245,247)` in Night Mode, and remount action
mislabeled Fullscreen. Red logs and the interrupted combined run (exit 143) remain
under local `output/r1b-corrections/`. The interruption was not claimed as PASS;
completed final independent runs supersede it. Chromium used normal permitted
host execution; no approval or sandbox workaround was used.

Working owner preview remains `http://127.0.0.1:4201/sky-engine`. Open Display to
use the native Night Mode toggle. The 30.4-second cold catalog search and sparse
existing tiles/media remain tracked; no optimization, provider, imagery, renderer,
scroll/FOV handoff, later milestone, deployment or merge is included. PR #73/#74/
#71 remain unmerged. STOP for owner review.


## R1-B real Sky application — 2026-10-13

Owner-approved visual source: PR #73 `b151d45787cf0e450aa0b187acd3eee142fa1fef`.
Implementation branch: `r1-b-adaptive-sky-implementation-1`, based on that exact
unmerged head. Implementation PR depends on PR #73; neither may be silently merged.
The owner separately authorized actual Sky implementation. No design revision or
later milestone is activated. Working-application owner acceptance remains OPEN.

**Browser-qualified source: `03baaeb8d762d8ba1def3e7e35cf3019152df0cc`.**
The [exact proof ledger](r1b-sky/proof.json) records source SHA256s, committed head,
served-entry byte comparison, viewport, native control results, renderer identity,
startup timing, missing data requests and zero JavaScript page errors. Access this
JSON through this manifest-loaded evidence document; do not substitute old R1-A
screenshots. Later evidence-only commits preserve these tested source bytes.

Actual application screenshots (not the R1-A prototype):

| State | Desktop 1440×900 | Mobile viewport 390×844 |
| --- | --- | --- |
| Sky scene / minimal shell | [Desktop](r1b-sky/sky-1440.png) | [Mobile](r1b-sky/sky-390.png) |
| Observing tools / advanced grid | [Desktop tools](r1b-sky/observing-1440.png) | [Mobile tools](r1b-sky/observing-390.png) |
| Native Vega selection | [Desktop selection](r1b-sky/selection-1440.png) | [Mobile selection](r1b-sky/selection-390.png) |

Live owner preview: `http://127.0.0.1:4201/sky-engine`.
For matching night screenshots use
`http://127.0.0.1:4201/sky-engine?date=2026-10-13T02%3A10%3A00Z`.
This is built React plus contained real Stellarium in isolated local Docker,
not the design preview at port 4200. New containers `oras-r1b-owner-preview` and
`oras-r1b-backend` use network `oras-r1b-preview`, existing images, read-only source
and astronomy mounts, and no owner datastore. The owner backend/datastore is not
started or modified. An absent Gaia database is not replaced by fake data.
If stopped, `docker start oras-r1b-backend oras-r1b-owner-preview` resumes this
already-created preview. Existing containers, volumes and ports remain intact.

Implemented: approved glass placement and compact Sky-specific rail; native
TargetSearch and selection; acknowledged observing latitude/longitude/elevation
and time; constellation lines + names, art, atmosphere, landscape, azimuthal grid,
equatorial grid of date, DSOs, native Night Mode, Fullscreen, and advanced J2000.
The native Vue plugin retains SWE property paths and BottomBar night-mode behavior;
embedded fullscreen targets the whole Hub so Explore stays available, synchronizes
the native state callback and removes its parent-document listener on disposal.
Standalone native controls and additional native view settings remain available.
Tonight, Observe, diagnostics and standalone links remain reachable in More Sky
options. No permanent Earth navigation button was added to the Sky view.

Reference differences: actual native celestial results/credits and science replace
sample content; the existing date/time editor and canonical selection details are
reused; location currently uses explicit coordinates plus ORAS reset rather than
new place search; existing licensed Hub icons/native glyphs are used. Solar System
and Moon are explicitly unavailable in Explore. Earth retains its existing UI.
These differences and screenshots require owner acceptance, not a new design cycle.

The browser suite toggled all eight scientific visibility properties and checked
native results, verified native night-mode visibility and actual fullscreen
entry/exit with Explore visible, selected Vega through real search, set observer
42° / −80° / 400 m and +1h, exercised native wheel zoom, keyboard tool open/Escape/
focus return and the 44px advanced disclosure, checked horizontal overflow and
Explore cancellation, and completed two Earth/Sky return cycles per viewport.
Each return retained canonical selection, exactly one iframe and one parent
fullscreen listener; Earth disposal had zero retained Sky fullscreen listeners.
The verified Earth route switch is **not** a continuous scale handoff.

Missing transition dependency: protocol 1.1 provides time/observer/canonical
selection intent, but no Sky FOV-boundary intent or Earth camera destination/pose
contract. Native wheel input is owned by SWE; existing `globalView`/`returnToOras`
actions do not define an observer-view-to-orbital camera conversion. This package
preserves normal wheel zoom and does not infer a camera transform or introduce
another renderer. Sky → Earth outward travel remains unimplemented.

Validation commands from this worktree:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run test
node --check runtimes/sky-adapter/plugin.js
node --check runtimes/sky-adapter/entry.mjs
node --check scripts/validation/verify_adaptive_sky.mjs
node tests/runtime/adaptive-sky-controls.test.mjs
node tests/runtime/sky-native-controls.test.mjs
node tests/runtime/sky-native-panels.test.mjs
node tests/runtime/sky-wheel.test.mjs
node tests/runtime/workspace-protocol.test.mjs
node tests/runtime/sky-artifact.test.mjs
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs R1B_EVIDENCE_DIR=output/r1b/final-browser node scripts/validation/verify_adaptive_sky.mjs
```

Results: typecheck/syntax/whitespace PASS; frontend **229/229**, adaptive native
controls **8/8**, native keyboard **3/3**, panel messages **2/2**, wheel **2/2**,
workspace protocol **3/3**, artifact identity **1/1**. Browser **2/2 viewport runs**,
all ten controls, four serial round trips, zero JavaScript page errors. Document/
manifest/reference checks PASS; final link counts are recorded in the handoff.
No physical-device or production qualification is claimed.

Sky artifact: `06f92b7e2851ec975c055980068fdcea2cf158c2d4bc9e58115452529baeb456`.
A second build reproduced all **95 application files** byte-for-byte; marker is
file 96. Native WASM, vendor chunks, comparison anchor, shared bridge files,
Earth lock/artifact, God's Eye pin, data/dependencies and original settings are
unchanged. The 97%-similar generated app-chunk rename is the rebuilt UI overlay.
Rollback remains the approved parent head, not an overwritten owner artifact.

Build used `git archive 023e3b26babf7ffddf45f39293230b14cfe96993` from the existing
qualified upstream checkout into `output/r1b/sky-build/upstream`, then:

```bash
python3 scripts/runtime/apply_sky_overlay.py output/r1b/sky-build/upstream
python3 scripts/runtime/integrate_sky_bridge.py output/r1b/sky-build/upstream/apps/web-frontend
# Existing qualified native JS/WASM copied into staged src/assets/js, never rebuilt or edited.
docker run --rm --network none   -v "$PWD/output/r1b/sky-build/upstream/apps/web-frontend:/work"   -v /var/tmp/oras-phase-c/sky-reconstruction/upstream/apps/web-frontend/node_modules:/work/node_modules:ro   -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0   -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096'   node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 npm run build
python3 scripts/runtime/record_sky_workspace.py output/r1b/sky-build/upstream/apps/web-frontend/dist
npm --prefix frontend run build
```

The public runtime-versions Sky entry is copied from the resulting lock (excluding
artifact_files/overlay/baseline_artifacts); Earth is not reattested or altered.
The old build system reports module failures as warnings: final builds were
explicitly checked for Syntax Error, Module Error, ERROR and Module build failed.
Remaining warnings are inherited bundle-size/old Browserslist notices. Initial
failed compilation, ARIA regression and cold-search attempts remain under local
`output/r1b/`; they are not passing qualification. Chromium used normal approved
host execution; no sandbox or approval-service workaround was used.

Performance and limits: 1440px: 1.46s bridge-ready, 20 native FPS sample; 390px: 1.29s bridge-ready, 47 native FPS sample. These are bridge-ready times and native FPS
samples on SwiftShader software rendering, not settled-data times, physical GPU
measurements or an accepted device budget. The first existing catalog search took
30.4 seconds in backend logs before warming its catalog cache. Existing sparse
dense-star tile 404s and a missing object-media summary index are retained in the
ledger; no data was invented, downloaded or changed to hide them. No claim of
complete astronomy data coverage or full visible-scene settlement is made.

Changed-file scope: `WorkspaceShell.tsx`, new `AdaptiveSkyChrome.tsx` and
`adaptiveSky.css`; owned `runtimes/sky-adapter/plugin.js` and `entry.mjs`; generated
Sky app/index/marker and Sky portions of both lock/version files; shell/native/
browser verification; these evidence files; and narrow R1-B activation in AGENTS,
CORE, LIVE, PROJECT_STATE, MASTER_PLAN, DOCUMENT_INDEX, docs README, design contract
and SYSTEM_VALIDATION_SPEC. R1-A reference files, Earth code/artifacts, backend,
packages, SWE native sources, owner settings and data remain unchanged.

PR #71 stays open/unmerged at `35dcc94c1ecc1bdd87118d6dddb8b76fb81bbe9e`;
PR #67 stays closed/unmerged at `ebdad3124fe470e3a09e369d3a56e998f29740fb`.
All historical science/provider/device gates remain. STOP for owner acceptance;
no merge, deployment or subsequent package.

## Historical ORA-7 qualification (unchanged scope)

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

## Focused final P2 correction — Live time and Earth observer synchronization

Scope: the three unresolved review findings at `de7344dd62cebe3b0c2772da85a385bb9b6806b3`.
Single agent; one correction commit on `phase-c7-unified-workspace-implementation-1`.
No design, provider, Earth-feature, upstream-source or native Sky science changes.

Live scene labels use a current-clock UI interval of one second, cleaned up when
Live ends or the surface unmounts. Live offsets evaluate `Date.now()` at click;
fixed labels retain effective time and fixed offsets retain requested time. Now
continues to use the current clock. Label updates do not change renderer lifetime.
Time presentation reuses Observe's ORAS-local/custom-UTC formatter. Workspace
observer detection uses canonical ORAS configuration, including elevation. Both
input display and submission explicitly convert through the selected timezone;
neither browser-local parsing nor longitude inference is used.

Only aircraft/weather opt into generic `PollingLayer.update(context)`. Refresh
invalidates the old generation, aborts its request, cancels its next poll, removes
old observer entities, then awaits the new ready/unavailable result. Refreshes run
concurrently across enabled layers with a ten-second source abort deadline and
resume the usual completion-scheduled cadence. Registry update includes loading
instances and awaits lazy initialization when needed. Disabled layers stay off;
satellite acquisition is not restarted; the ORAS site remains canonical.
`EarthRuntime.setObserver` already awaits registry update, so bridge success now
means that the required refresh completed. The unchanged Hub adapter records
observer acknowledgement only after that result.

Fresh commands and results:

```text
TZ=Asia/Tokyo npx vitest run tests/workspaceTime.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/workspace.test.tsx tests/workspaceNavigation.test.ts tests/workspaceUiState.test.ts tests/runtimeProductState.test.ts
# frontend cwd: 6 files, 22 tests PASS; 6 Time tests and 1 runtime-adapter test.
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs
# 39 tests PASS, including 7 observer-refresh tests and 6 existing lifecycle tests.
npm run typecheck
# frontend cwd: tsc --noEmit, exit 0.
git diff --check
# exit 0, no output.
ORAS_EARTH_OUT=/var/tmp/oras-workspace/earth-build-time-observer bash scripts/runtime/build_owned_earth.sh
# exit 0; 512 artifact files, 111 dependency licenses, Cesium 1.138.0.
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-workspace/earth-build-time-observer
# VERIFIED ARTIFACT b151195225727109ae78283063e362175e3ff81165564a8bd1e7f0d4c49fc309
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-workspace/earth-build-time-observer POSTGRES_PASSWORD=local-qualification PUBLIC_HTTP_PORT=4181 COMPOSE_BAKE=false docker compose -p oras-workspace-qualification -f docker-compose.prod.yml up -d --no-deps --build frontend earth-runtime
# exit 0; frontend and Earth healthy; existing backend/Postgres/Redis remain up.
POSTGRES_PASSWORD=local-qualification docker compose -p oras-workspace-qualification -f docker-compose.prod.yml ps
# frontend/Earth healthy, qualification HTTP port 4181.
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4181 npx playwright test tests/e2e/workspaceTimeObserver.spec.ts --workers=1 --output=/var/tmp/oras-workspace/time-observer-browser
# frontend cwd: 1 browser test PASS, 8.4 seconds overall.
sha256sum .vscode/settings.json
# 6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0; preserved unstaged.
```

The browser uses declared aircraft/weather fixtures, not live provider admission:
A `(42,-80,0)` → in-place query B `(35,-120,0)` retains the same iframe. Both B
requests are held; provider rows report loading, old observer targets are absent,
and no observer result has been sent. After release, aircraft is ready, weather
returns HTTP 503 and reports unavailable, then the bridge acknowledges B. The
canonical ORAS site is unchanged. Browser timezone is `Asia/Tokyo`; requested and
effective scene time both display `Oct 3, 2:00 AM UTC`. Screenshot:
`output/playwright/unified-workspace/time-observer.png`. Logs/artifacts are under
`/var/tmp/oras-workspace/time-observer-*`.

Regressions were observed red before corrections: frozen Live label and offsets,
custom time formatting, missing refresh method, and premature acknowledgement
during lazy loading. Final focused runs are green. Node emits its existing
experimental MockTimers warning; Vite emits its large-chunk advisory; neither
is a test failure. No broad visual campaign, full God's Eye suite, or native Sky
science suite was rerun. Those untouched capabilities retain their prior limits.
CI and thread resolution for the resulting single commit are recorded on PR #58.
Owner approval remains required; this pass does not merge or start another phase.


## Owner-directed Sky UX correction, 2026-10-04

The owner explicitly superseded the earlier blanket embedded-control suppression.
This local correction belongs to `sky-engine-ux-regressions-1`, based on preserved
WSL tooling commit `1cb71b84`; PR #63 remains separate, open and unchanged. No new
feature, provider/science change, production work, SSH, Cloudflare or oras.org
integration occurred. The earlier evidence above remains historical.

Standard browser wheel events reached the actual canvas in both ORAS surfaces,
but qualified canvas wiring handled legacy `mousewheel` / `DOMMouseScroll` only.
The bridge's passive standard `wheel` interaction listener changed Chromium's
chosen event family, so SWE never received native zoom input. Overlays were not
intercepting it. The reference without that standard listener received legacy
input and zoomed. Before correction, identical real inward input left ORAS FOV
at `2.094395102393` radians; reference changed to `1.899678097409`.

The contained adapter's `native-wheel.mjs` now forwards standard nonpassive wheel
input and canvas-relative cursor coordinates to SWE `_core_on_zoom`. It retains
native notch scaling where exposed, normalizes pixel/line/page deltas otherwise,
bounds the input factor, and prevents scrolling/legacy duplicate handling.
Native projection, cursor anchoring, scene math and FOV bounds remain SWE-owned;
no native WASM or vendor chunk changed. Persisted pagehide retains input.

Embedded `TargetSearch` and `BottomBar` are exposed through the existing plugin
extension hook. Search still calls qualified ORAS `querySkySources`; no obsolete
NoctuaSky request was observed. Canonical native search selection is admitted to
Hub product state so mode recreation preserves it. Restored renderer controls:
constellation lines/labels, constellation art, atmosphere, landscape, azimuthal
grid, equatorial grid, deep-sky visibility and night mode. Existing optional
J2000-grid configuration remains unchanged. Native buttons are semantic,
keyboard-operable, labelled, and 44 × 44 px. Embedded fullscreen remains hidden
because Hub owns immersive presentation. Native navigation/header/drawer,
location/time editors and selected-object panel remain hidden because Hub owns
those product surfaces. Source/survey credits remain accessible.

Desktop gives the toolbar its own bottom row below Hub time and selection.
Mobile scrolls that row internally without document overflow; credits occupy a
separate row. Open mobile sheets move native controls/credits above the sheet.
Tab/Escape from native controls are retained; native focus keeps Hub chrome active.

`SkyWorkspaceLink` translates source-backed exact link queries into `/sky-engine`
with `focus=1`, retaining catalog/source_id/model, RA/Dec, observer and time.
Names remain cosmetic, large IDs remain strings, and native focus runs after
observer/time/selection acknowledgement. Backend microsecond timestamps are
normalized to supported millisecond precision instead of silently entering Live.
Normal Observe cards/details, Tonight cards and retained Home opportunity/Observe
components use it. Explicit standalone links and native exact links are retained.

### Fresh qualification

Logs: `/var/tmp/oras-sky-ux-regressions/`. All commands below exited zero.
Local tests support the Docker/browser qualification; no production claim is made.

| Command (repository cwd unless stated) | Result |
| --- | --- |
| `node --test tests/runtime/*.test.mjs` | 28 passed; protocol, Sky artifacts, native input and control keyboard handling |
| Focused frontend command below | 100 passed across 15 files |
| `npm run typecheck` (frontend cwd) | TypeScript passed |
| `npm run build` (frontend cwd) | Vite build passed; existing chunk advisory |
| Browser command below (frontend cwd, built preview in the same Docker frontend) | 19 passed in 1.3m |
| `PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyUxRegressions.spec.ts --workers=1` (frontend cwd, restored normal Docker dev server) | 9 passed; cold search and a final warm run recorded separately |
| `python3 -S scripts/validation/validate_architecture_docs.py` | 185 manifest entries, 8 packs, 37 Markdown checkpoints and 99 relative links passed |
| `npm run dev:local:build`, then `npm run dev:local` (correction worktree cwd) | Existing five-service local launcher restored; no temporary override required |
| `git diff --check` | Passed |

```bash
# frontend cwd
npm test -- tests/workspaceNavigation.test.ts tests/workspaceRuntimeAdapter.test.ts tests/workspaceUiState.test.ts tests/workspace.test.tsx tests/workspaceTime.test.tsx tests/runtimeHost* tests/runtimeProbe* tests/observe*.test.* tests/tonight*.test.* tests/homePage.test.tsx tests/skyEngineImportBoundary.test.js
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyUxRegressions.spec.ts tests/e2e/skyBfcache.spec.ts tests/e2e/earthBfcache.spec.ts tests/e2e/workspaceFinalReview.spec.ts --workers=1
```

Real canvas inward/outward FOV in both surfaces:
`2.094395102393 → 1.899678097409 → 2.094395102393` radians. Large outward
input clamps at native stereographic maximum `3.22885911619` (185°), then ordinary
inward/outward input continues working. Both document scroll positions stayed
zero; tested flows recorded no JS page errors. Wheel also works after qualified
search, native Focus, Observe context interaction and Sky → Earth → Sky.
Focus independently compares native converted target angles with observer yaw/pitch
(tolerance 0.02 radians); all tested residuals were below 1e-12 radians.
Observe selected canonical Deneb at custom `(42,-80,365.76 m)` and controlled
`2026-10-03T02:00:00.000Z`. Tonight/Home selected canonical Uranus at the source
peak `2026-10-03T08:44:25.961Z` and canonical ORAS observer. Only one runtime iframe
exists after each transition. The retained Home component is exercised with real
Docker Tonight data via a test-only server-rendered page; `/` itself is the workspace.

Actual Sky Back restored the same document with `pageshow.persisted=true`, retained
a working time bridge and recovered unpinned controls. Actual Earth bfcache retained
one Viewer/bridge; its stale four-layer test count was updated to the current seven
registered C5 layer controls. No Earth runtime source changed. Vite's HMR WebSocket
prevents Chromium bfcache admission; genuine cached-page evidence therefore uses
built preview, while the nine Sky UX cases are rerun on the normal dev server.

Sky frontend-only rebuild uses recovered qualified frontend inputs, current
controlled overlays and the pinned builder below. No bulk skydata is copied.
Promotion asserts unchanged native/vendor bytes before replacing application assets.

```bash
python3 /var/tmp/oras-sky-ux-regressions/build-app.py
python3 scripts/runtime/integrate_sky_bridge.py /var/tmp/oras-sky-ux-regressions/sky-app
docker run --rm -v /var/tmp/oras-sky-ux-regressions/sky-app:/work -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 -e NODE_OPTIONS=--openssl-legacy-provider node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 sh -c 'npm ci --loglevel=error && npm run build'
python3 scripts/runtime/record_sky_workspace.py /var/tmp/oras-sky-ux-regressions/sky-app/dist
python3 scripts/runtime/record_runtime_versions.py /home/rocco/Astronomy-Hub/data/runtime-artifacts/earth
```

Sky artifact before:
`bbf8e9136fa510e86a64095f5e5ec51846456989b589de21937d2f929450e1a5`.
Sky artifact after (96 manifested application files):
`0db3fab9cac11f98eed3a9543b597a0d2763e0b6ce00e71afa97672ff3fd0d04`.
Lock, served runtime metadata and marker match; overlay and wheel-input hashes
bind controlled source. Earth remains exactly
`ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.

Fresh screenshots are under `output/playwright/sky-ux/`: `toolbar-1440.png`,
`toolbar-390.png`, `mobile-time-sheet.png`, `search-selected.png`,
`observe-open-in-sky.png`, `tonight-open-in-sky.png`, `home-open-in-sky.png`,
and `standalone-exact-link.png`. Older linked Earth screenshots were copied from
the original checkout only to satisfy isolated-worktree document containment;
they are historical evidence, not a fresh Earth feature campaign.

Category A: all five owner behaviors resolved by the local implementation and
focused runtime/browser evidence. Owner manual review and integration remain.
Category B: existing catalog-pack API search loaded its cached index in 21.4–23.1s
on cold start, raising backend memory from about 67 MiB to 2.02 GiB; this source
and indexing behavior is unchanged. A first local test used a 20s assertion and
failed before the successful API response; the final test allows 65s and proves
the cold result. Idle five-container memory was about 261 MiB before search;
post-test restart returns the normal stack to idle. No extra renderer/service or
watcher was added. Backend indexing optimization remains a separate owner-scoped
follow-up. Inherited missing catalog/tile/loader noise remains; blanket console
cleanliness, all-object coverage and a broad Earth/C5/provider rerun are not claimed.
Night mode remains renderer-local, matching native behavior. Exact-link timestamp
precision is milliseconds. The original tooling checkout remains at `1cb71b84`,
with the same unstaged settings hash; the repair worktree shares ignored local
configuration/data and dependency links. Run its normal launcher from that worktree
until separately reviewed integration. PR #63/tooling ancestors must be integrated
separately before targeting main; no push/PR/merge occurs in this correction.

## Owner-directed Sky star loading and ORAS controls, 2026-10-04

This new bounded owner package follows the locally repaired Sky UX commit
`5328afbaa0b26c19a9581c4ec4051109b7119518`. Branch:
`sky-engine-star-loading-oras-controls-1`, in the existing worktree
`/home/rocco/Astronomy-Hub/.worktrees/sky-engine-ux-regressions-1`.
Default Mode applies; no runtime override mode or new renderer phase is active.
The owner approved the compact SVG design preview before implementation.
Single agent; no push, PR, merge, production deployment, SSH, Cloudflare or
oras.org work. Earth/ISS/Moon/Mars feature work was not started. Existing
cross-mode, lifecycle and exact-link regression checks remain in scope.

### Context and inspected source

Loaded the exact union of `frontend_change`, `validation`, and `debug` packs,
with CORE_CONTEXT and LIVE_SESSION_BRIEF first. No additional project documents
or full docs scan. The loaded documents were:

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
- `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md`
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
- `docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md`
- `docs/runtime/FAILURE_PATTERNS.md`

Source inspection covered the qualified native `bottom-bar.vue`, controlled
`bottom-button.vue`, `App.vue`, `oras_dense_stars.js`, `oras_data_config.js`,
`src/modules/stars.c`, the contained Sky plugin/input bridge, Vite static/history
middleware, Compose mounts, the local launcher, the star tile builder/validator,
and artifact promotion/identity scripts. No native star math or vendor source
was changed. The earlier brief's stop point is superseded only by the owner's
explicit authorization for these two Sky follow-ups.

### Classification, root cause and fix

**Real local star-loading regression, plus unchanged data limitations.** The
repair worktree has only sparse tracked skydata. Its relative Compose mount
omitted the installed, ignored Gaia survey in the owner checkout: 57,294 files,
3,575,576,465 bytes. The original survey metadata identifies an existing
Gaia-derived native EPH survey, release date 2019-02-11. No new dataset was
acquired, generated, mirrored, copied into Git, or baked into an image.

The qualified star chain registers the canonical profile followed by native Gaia
continuation. Its missing extensionless `surveys/gaia/v1/properties` request
returned **HTTP 200, text/html, the 1,960-byte application index**. Gaia never
requested faint EPH tiles. This masked a data mount failure; it was not a
unified iframe rendering defect, changed magnitude threshold, or frame throttle.
The old standalone and unified masked canvas images were identical.

`skydata_path.py` selects already-installed owner-checkout skydata using Git's
main worktree path, or a supplied `ORAS_SKYDATA_HOST_DIR`. Startup requires Gaia
metadata and a base-order tile; this is a prerequisite smoke check, not complete
coverage qualification. The normal launcher exports the selected absolute path
for both read-only frontend/backend mounts and preserves an explicit TLE override.
Missing Gaia aborts before artifact/runtime work. Separate assignment and export
are necessary: Bash `export VAR=$(failing_command)` otherwise masks the failure.
No datastore volume/container renewal or data mutation occurs.

Vite classifies all `/oras-sky-engine/skydata/` requests as data, including
extensionless metadata. Missing metadata now returns a real **404**, never the
SPA index, and does not add a CDN metadata fallback. Existing extensionful proxy
behavior is unchanged. Existing metadata remains `text/plain`.

Matched diagnostics use the same 1280×720 native canvas, frozen input time
2026-07-15T03:00:00Z, observer (41.44,-79.69,0), the existing Cygnus QA direction,
Bortle 3, exposure 2 and unchanged native star scales. Other visual layers and
DOM chrome are suppressed only in disposable diagnostic pages. Counts below
are **bright image components**, not catalog star counts:

| Native FOV | Before, both ORAS surfaces | Data-qualified reference | Final standalone | Final unified |
| --- | ---: | ---: | ---: | ---: |
| 70° | 229 | 239 | 239 | 239 |
| 20° | 33 | 768 | 768 | 768 |
| 5° | 5 | 1,727 | 1,727 | 1,727 |

Final standalone and unified masked PNGs are byte-identical at each FOV and
match their repaired-mount captures. Native Gaia EPH responses: 169 successful
tiles at 70°/20°, 179 at 5°; no Gaia HTTP failures in these captures. Native
progress bars settle to an empty array, and page-error arrays are empty.
Software-rendered Chrome reported 60 FPS at 70°, 45–46 at 20°, 33–36 at 5°;
these are diagnostic observations, not a hardware performance benchmark.

The reference container as started also had invalid data routing: metadata
requests returned HTML and no EPH tiles. It cannot be cited as a healthy stock
baseline. The explicitly **data-qualified reference** comparison uses read-only
Playwright routing to the same installed local skydata and mounted release packs;
no reference/source data or application source was changed for that comparison.
The reference container was stopped afterward.

All existing dense-star profiles pass the release validator. Visual default
remains 1,668 canonical stars, magnitude 4.8, 590 populated order-3 tiles.
The 37 observed default-profile 404s are absent cells, not lost manifested files:
all 590 expected files match the release, and none of those 37 cells occurs in
its manifest. The existing builder writes only populated cells. Native Gaia
continues after the canonical maximum magnitude, using unchanged engine logic.
Binocular remains 65,143 stars/magnitude 8.5. Deep catalog remains 84,129 canonical
stars, requested limit 13 but actual maximum 10.00014. No default threshold,
star scale, sky culture, catalog identity, coordinate or scientific math changed.

Wide-view sparsity is also real existing presentation behavior. A fresh unzoomed
390×844 mobile view had native FOV 120°, pitch 30°, yaw 0°, 144 canonical tile
requests, zero Gaia tile requests, an empty loader and 60 FPS. Native `stars.c`
skips a survey when its starting magnitude exceeds the current rendered magnitude
limit. An optional capture's expectation of more than 30 Gaia requests at that
wide view timed out; that expectation was invalid, not a failed restored-data
check. Its final screenshot waits for the actual wide-view data instead. The
70°/20°/5° comparison above proves continuation as native zoom admits faint stars;
this package does not force a denser all-sky display or change that engine policy.

### ORAS controls and ownership

Eight native controls remain exposed: constellation lines/labels, constellation
art, atmosphere, landscape, azimuthal grid, equatorial-of-date grid, deep-sky
visibility and night mode. Source/survey credits and existing native view settings
remain accessible. Fullscreen stays hidden in embedded Sky because Hub owns
immersive presentation. Native header/navigation/drawer, location/time editors,
selected-object panel and observing tabs stay hidden because Hub owns those
surfaces. The optional J2000 grid stays disabled by its existing configuration;
no duplicate grid control was introduced. Standalone native presentation remains
available, including its original images and exact links.

`oras_control_icons.js` supplies eight original SVG line drawings keyed by the
existing stable native `img_alt` control identifier. The controlled existing
BottomButton renders decorative inline SVG only while embedded. Original
BottomBar toggle handlers, store/core state and emitted actions are retained;
there is no React astronomy logic, new control/state system, protocol command,
renderer replacement or duplicated truth.

The dock uses Hub panel/text/accent colors, paired spacing, active fill/border
and a separate active indicator, hover treatment, 2px focus ring and 44×44 targets.
Pressed state is explicitly the string `true`/`false`, correcting Vue 2's removal
of a boolean false ARIA attribute. Desktop dock height is 54px; mobile reserves
60px for internal horizontal scrolling. Sky's Hub time/editor/selection/launcher
clearance moves upward 12px. Mobile open sheets move the native dock and credits
to separate upper rows. Keyboard Space/Enter toggles each native action, native
renderer changes update the same pressed state, and no document overflow occurs.

### Changed files and artifact identity

- `docker-compose.yml`
- `scripts/dev-local-stack.sh`
- `scripts/runtime/skydata_path.py`
- `frontend/vite.config.mjs`
- `frontend/src/features/workspace/workspace.css`
- `runtimes/sky-adapter/plugin.js`
- `integrations/sky-overlay/apps/web-frontend/src/components/bottom-button.vue`
- `integrations/sky-overlay/apps/web-frontend/src/assets/oras_control_icons.js`
- `frontend/tests/orasRuntimeSpaFallback.test.js`
- `frontend/tests/e2e/skyFollowup.spec.ts`
- `tests/test_local_skydata.py`
- `integrations/renderers.lock.json`
- `frontend/public/runtime-versions.json`
- `frontend/public/oras-sky-engine/index.html`
- `frontend/public/oras-sky-engine/oras-runtime-build.json`
- Generated `css/app.2f1be4ee.css` replaced by `css/app.e3189512.css` and
  `js/app.bc16ed55.js` replaced by `js/app.5b3707af.js` under that runtime path.
- This evidence document and `docs/context/LIVE_SESSION_BRIEF.md`.

**Artifact rebuild required and performed:** frontend-only SWE app build, from
the previous qualified reconstruction plus all 28 verified frontend overlays.
Native C/WASM, vendor JS/CSS and wheel input are unchanged. Promotion checks the
frozen native/vendor bytes before replacing application assets. The final locked
Sky artifact is `e4978c294aa36268ce4476662b1f1130e687b499bd748edf2ca0e5c254c32a0e`
(96 manifested application files). Lock, served marker and runtime metadata match.
Earth remains exactly `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.
No bulk skydata is included in either renderer build or frontend image.

```bash
python3 scripts/runtime/integrate_sky_bridge.py /var/tmp/oras-sky-followup/sky-app
docker run --rm -v /var/tmp/oras-sky-followup/sky-app:/app -w /app -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 -e NODE_OPTIONS=--openssl-legacy-provider node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 sh -c 'npm ci && npm run build'
# Rebuilds after lint/layout corrections used the same image/inputs and npm run build.
python3 scripts/runtime/record_sky_workspace.py /var/tmp/oras-sky-followup/sky-app/dist
python3 scripts/runtime/record_runtime_versions.py /home/rocco/Astronomy-Hub/data/runtime-artifacts/earth
COMPOSE_BAKE=false docker compose --project-name astronomy-hub -f docker-compose.yml -f docker-compose.dev.yml build frontend
npm --prefix frontend run build
npm run dev:local
```

### Fresh qualification and evidence

| Exact command (repository cwd unless noted) | Result |
| --- | --- |
| `python3 -m unittest discover -s tests -p 'test_local_*.py'` | 20 passed; six real disposable-worktree/launcher cases plus preserved provisioning/cleanup checks |
| `npm test` (frontend cwd) | 204 passed, 27 files |
| `npm run typecheck` (frontend cwd) | Passed |
| `npm --prefix frontend run build` | Passed |
| `node --test tests/runtime/*.test.mjs` | 28 passed |
| `python3 scripts/skydata/validate_oras_dense_star_tiles.py data/runtime-packs/dense-star-tiles` | All three profiles passed |
| `python3 -S scripts/validation/validate_architecture_docs.py` | 185 manifest entries, 8 packs, 37 Markdown checkpoints and 100 relative links passed |
| `git diff --check` | Passed |
| Browser preview command below | 23 passed in 2.6m |
| Browser normal-dev command below | 13 passed in 1.7m |
| `npm run validate:oras-deep-links` | 25 native exact-link cases, 7 API checks and 2 search checks passed |
| `SKIP_REFERENCE=1 STAR_PASS=after node /var/tmp/oras-sky-followup/star-compare.cjs` | Six final star captures passed; counts/table above, loaders settled, no page errors |
| `QUALIFY_REFERENCE=1 STAR_SURFACE=reference STAR_PASS=qualified-reference node /var/tmp/oras-sky-followup/star-compare.cjs` | Three read-only data-qualified reference captures |

```bash
# frontend cwd; built preview in the existing Docker frontend, skydata mounted externally
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyFollowup.spec.ts tests/e2e/skyUxRegressions.spec.ts tests/e2e/skyBfcache.spec.ts tests/e2e/earthBfcache.spec.ts tests/e2e/workspaceFinalReview.spec.ts --workers=1
# restored ordinary Docker development server, no temporary override
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyFollowup.spec.ts tests/e2e/skyUxRegressions.spec.ts --workers=1
```

These runs prove native wheel input in both surfaces; search and canonical Hub
selection agreement; Home/Observe/Tonight unified routing; standalone exact links;
Sky→Earth→Sky with one frame; actual cached-document restoration with
`pageshow.persisted=true`; and tested page-error arrays empty. The broader existing
exact-link matrix includes unchanged star, DSO, planet and satellite cases; it
is regression evidence, not new body/ISS feature work. Vite HMR still prevents
bfcache admission, so true cached-page proof uses built preview. Its temporary
readonly dist/data mounts are removed by the final normal launcher.

Initial red tests caught missing metadata being classified as a route, absent
ORAS control semantics, omitted false ARIA state and 2px/4px dock/time overlaps.
Those were corrected before the final green runs. The first icon build failed
existing ESLint formatting rules; the corrected build passes with two inherited
Webpack asset/entrypoint size advisories. No warning threshold was relaxed.

Logs, diagnostic script/design preview and release report:
`/var/tmp/oras-sky-followup/`. Screenshots and raw JSON:
`output/playwright/sky-followup/`, especially `controls-1440.png`,
`controls-390.png`, `controls-focus-1440.png`, `controls-focus-390.png`,
`controls-mobile-time-sheet.png`, `controls-mobile-end.png`,
`before-star-comparison.json`, `qualified-reference-star-comparison.json`,
`after-star-comparison.json`, and `after-{standalone,unified}-{70,20,5}.png`.
Desktop/mobile images were visually inspected. Previous UX-flow screenshots are
freshly refreshed under `output/playwright/sky-ux/`.

Category A: no remaining technical blocker for this bounded local Sky package.
Owner final visual review and integration approval remain next steps.
Category B: intentionally sparse bright-star profile/empty cells and native
wide-view magnitude limits; legacy installed
Gaia survey and unqualified full-sky/all-order coverage; limited canonical deep
catalog photometry; existing cold search/index cost not optimized or re-profiled;
renderer-local night mode; unchanged unrelated provider/data warning noise.
Full backend pytest, the broad dense-profile visual campaign and Earth/C5/provider
campaign were not rerun; no result for those untouched scopes is claimed.

The original tooling branch/commit `dev-wsl-performance-repair-1` / `1cb71b84`
and its unstaged `.vscode/settings.json` remain unchanged, hash
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
Postgres/Redis identities and persistent data are preserved. The normal five-service
launcher remains the owner workflow from this worktree. The next action is owner
local visual review of star density, zoom and controls, followed by separately
approved integration of the preserved tooling/Sky commits and PR #63 dependency.
Do not start that integration or another feature from this checkpoint.

After qualification, `docker restart astronomy-hub-backend-1 astronomy-hub-frontend-1`
released populated application caches without replacing the containers, followed
by `npm run dev:local` (ready in 1s). Final read-only checks verified installed Gaia
metadata, all 29 source overlay hashes, served Sky/marker/lock identity and unchanged
Earth metadata. Exactly five project services run; reference is exited and the
frontend command is ordinary `npm run dev`. A final memory snapshot was backend
69.89 MiB, frontend 192.2 MiB, Earth 16.14 MiB, Postgres 37.59 MiB and Redis 13.04 MiB.
This is post-test cache cleanup, not an indexing or renderer performance change.

## Fresh integration qualification, 2026-10-05

This section supersedes the earlier local-only integration stop gate for this
owner-authorized repository-hygiene task; it does not alter historical evidence.
PR #63 was verified at approved head `a9f3e207235d42399d37d8c51b18103f6edcbb87`
and normally merged as `126da1537c734de817d9f9c59468d995807da37c`. Its parents
are `70daeb8087a5439dc27d1a5da3d64d8ec436f495` and the approved head; main's
resulting tree is identical to that head. Four fresh unchanged-main Docker/browser
smokes passed: live USGS imagery near ORAS, outside-CONUS global fallback, C5
fixture layers and a canonical Sky → Earth → Sky round trip. Bare main does not
have `dev:local` yet; unchanged-main Compose smoke preceded launcher qualification
on reconstructed tooling. No feature implementation was added to PR #63.

Tooling [PR #64](https://github.com/Shadowgar/Astronomy-Hub/pull/64), branch
`dev-wsl-performance-integration-20261005`, remains unmerged. Sky branch
`sky-engine-ux-integration-20261005` is stacked on it: the installed-Gaia launcher
extends tooling's `dev-local-stack.sh`, so the tooling dependency is real.
Original Sky commits, authorship and messages remain preserved:

| Original | Replayed |
| --- | --- |
| `5328afbaa0b26c19a9581c4ec4051109b7119518` | `f8cf03fd1c6e3a19f863a71fd622c965d6f86e01` |
| `7b2d4927de148bd3edc6cecdc25149acf946a871` | `cb7bfaf127ab4ea69af99d226eb8bcae41653202` |

Only dated live-brief history conflicted. Current merged-HD/integration authority
was retained above explicitly historical Sky checkpoints. Tooling's subsequent
document-only review corrections were merged as `17d47aa9fe7161b0f095ed950413f212e11bb9e4`;
all non-document files still match original final Sky `7b2d4927` exactly.
The Sky review diff relative to the updated tooling head contains only the
preserved Sky package and current Sky execution/evidence reconciliation.

A fresh source reconstruction applied all 29 hash-verified contained overlays
and the existing bridge integration. The pinned Node 20 Docker build with
`ORAS_RUNTIME_COPY_SKYDATA=0` reproduced all 95 manifest payload files, the full
96-file tracked runtime installation and artifact
`e4978c294aa36268ce4476662b1f1130e687b499bd748edf2ca0e5c254c32a0e`.
Lock, release/export metadata, runtime marker and served identity agree. Native
WASM, native engine chunk, vendor JS and vendor CSS match merged main byte-for-byte.
Earth remains `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.
No artifact promotion or identity exception was needed. No bulk skydata was
copied into Git or images; ignored owner-installed data is mounted read-only.

All results below are fresh against the reconstructed branch:

| Exact command or qualified command group | Result |
| --- | --- |
| `python3 -m unittest discover -s tests -p 'test_local_*.py'` | 20 passed |
| `npm --prefix frontend test -- --run` | 204 passed, 27 files |
| `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs` | 79 passed, including 28 Sky/runtime checks |
| `npm --prefix frontend run typecheck` and `npm --prefix frontend run build` | Passed |
| `python3 scripts/skydata/validate_oras_dense_star_tiles.py data/runtime-packs/dense-star-tiles` | Three profiles passed |
| `python3 -m unittest -v tests.validation.test_architecture_manifest` | Six negative/manifest checks passed |
| `python3 -S scripts/validation/validate_architecture_docs.py` | Passed; final count recorded below |
| Pinned artifact build and `python3 /var/tmp/oras-integration-20261005/verify-sky.py` | Reproduced expected digest; file/source/served identities passed |
| `npm run dev:local:build` | Passed in 71s; new worktree had no installed Gaia and automatically discovered owner-root data |
| Normal-development browser command below | 13 passed in 2.6m |
| Built-preview browser command below | 23 passed in 3.5m |
| `npm run validate:oras-deep-links` | 25 native exact links, seven API checks, two search checks passed |
| `SKIP_REFERENCE=1 STAR_PASS=integration node /var/tmp/oras-integration-20261005/star-compare.cjs` | Six captures passed; paired surfaces byte-identical |
| `node /var/tmp/oras-integration-20261005/sky-cache-errors.cjs` | Actual same-document cached Sky restoration, persisted pageshow, one frame, working +1h bridge, zero page errors |

```bash
# frontend cwd; existing local Docker backend/renderers
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyFollowup.spec.ts tests/e2e/skyUxRegressions.spec.ts --workers=1 --output=/var/tmp/oras-integration-20261005/sky-browser-dev
# same frontend Docker service, temporary built-preview override and read-only data
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyFollowup.spec.ts tests/e2e/skyUxRegressions.spec.ts tests/e2e/skyBfcache.spec.ts tests/e2e/earthBfcache.spec.ts tests/e2e/workspaceFinalReview.spec.ts --workers=1 --output=/var/tmp/oras-integration-20261005/sky-browser-preview-qualified
```

Real browser input changed native FOV inward and outward in both Sky surfaces.
M31 native search selected the canonical object and agreed with Hub state; Focus
worked. Home's retained component, Observe and Tonight opened unified `/sky-engine`
with identity/RA/Dec/time/observer preserved; explicit standalone exact links
remained available. All eight ORAS controls, native state/handlers, keyboard
activation, active ARIA state, desktop/mobile sizing and dock/time-sheet layout
passed. Duplicate embedded chrome/fullscreen stayed hidden, and J2000's existing
disabled configuration was retained. Sky/Earth switching kept one active renderer.
Actual Sky and Earth bfcache restores retained document identity and usable
controls; page-error assertions were empty. Desktop/mobile controls and main HD
screenshots were visually inspected. This is local Docker/Chromium proof, not
physical-device qualification.

Gaia metadata returned HTTP 200 as text; installed faint tiles loaded. Missing
metadata returned HTTP 404 and never HTML success. Fresh masked captures under the
same frozen scene reproduced bright-component counts exactly:

| Native FOV | Standalone | Unified | Paired PNG identity |
| --- | ---: | ---: | --- |
| 70° | 239 | 239 | Byte-identical |
| 20° | 768 | 768 | Byte-identical |
| 5° | 1,727 | 1,727 | Byte-identical |

All six loaders settled with zero page errors. Fresh JSON and screenshots are
`output/playwright/sky-followup/integration-star-comparison.json` and
`integration-{standalone,unified}-{70,20,5}.png`. Full command arguments, exits,
logs and temporary diagnostic scripts are under `/var/tmp/oras-integration-20261005/`.

The first disposable preview startup failed because the read-only generated dist
lacked its empty external skydata mountpoint. An incorrectly launched browser run
then failed all 23 cases with connection refused. These failures are retained in
`sky-preview-startup.log` and `sky-browser-preview.log`; they were setup failures,
not application regressions. Creating only the ignored dist mountpoint corrected
startup. The complete fresh 23-case rerun passed; no application source or artifact
bytes changed. Normal `npm run dev:local` removes that temporary override.

Category A: no technical integration/runtime regression found. Both follow-up
PRs require separate owner review and remain unmerged. Tooling's two minor review
limits (future `src/dev` watch paths and alternate frontend ports) remain explicit;
the current qualified watcher and locked port 4173 pass.
Category B: cold-search cost (historical 21–23s, not re-profiled), populated backend
index memory (fresh 2.045 GiB snapshot), legacy Gaia/full-sky/order coverage,
37 expected sparse bright-profile empty-cell 404s, native wide-view magnitude and
deep-catalog photometry limits. Earth HD remains historical CONUS-focused USGS
imagery, with lower-resolution global fallback and ellipsoid-only terrain;
global HD, 3D/terrain, live imagery, Launch Library's known production HTTP 403,
physical-device performance and broad provider campaigns remain separately gated.
No cold-index optimization, new provider/body feature, full backend suite or broad
Earth/C5/dense-profile/provider campaign was performed in this integration task.
No production, SSH, Cloudflare, oras.org or remote infrastructure action occurred.

Original branches/worktrees and preservation refs remain intact. Owner-controlled
`.vscode/settings.json` remains unchanged and unstaged at hash
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
Postgres/Redis identities and mounts are preserved; no volumes were deleted.
Current execution docs mark bounded HD complete and tooling/Sky integration pending
owner review. Review tooling first, then Sky; no new feature phase is authorized.

Final post-test application-cache cleanup used
`docker restart astronomy-hub-backend-1 astronomy-hub-frontend-1`, then
`npm run dev:local` passed in 1s. This releases populated application caches;
it is not an index optimization or a new performance comparison. Final checks
verified five ordinary services, zero restarts, frontend `npm run dev`, backend
health, served Earth release/Sky marker/versions and datastore identity/mounts.
All 81 original Docker volumes remain; temporary/reference/qualification workloads
are stopped, not deleted. The external final-audit helper initially assumed a
bare frontend command array and the wrong Earth marker URL; correcting those
helper expectations to the actual shell command and `/earth-runtime/release.json`
produced a clean pass. No repository/runtime correction was required.
Final document validation passed 185 entries, eight packs, 37 Markdown checkpoints,
100 relative links and eight ADRs; six negative/manifest checks and `git diff --check`
passed. The non-document tree still matches original `7b2d4927` exactly.

Fresh review-context reconciliation: tooling commit `2f569582` adds its local
repair evidence to `review.load`; this stacked Sky branch adds this workspace
evidence to the same pack. Reviewers can inspect the linked proof within the
context-loading rules. Final revalidation after these document-only additions
passed 187 entries, eight packs, 37 checkpoints, 100 links, eight ADRs and six
manifest-negative checks. Runtime inputs and qualified artifacts are unchanged.


## PR #65 native-deselection P2 correction, 2026-10-05

Owner scope: fix only the reviewed stale canonical selection in
`frontend/src/features/workspace/workspaceRuntimeAdapter.ts`, preserving initial
restoration and the serialized/client-bound user-action behavior. Initial PR #65
head was `4c82b9f72f957b5509e38d0d395f7838cd9b9907`; PR #64 remained open at
`2f569582ae19518c202e47f87fa77dbc2ef50d60`, so the existing
`sky-engine-ux-integration-20261005` branch stays stacked on
`dev-wsl-performance-integration-20261005`. No history rewrite or dependency
merge was performed.

### Reproduction and boundary correction

Before any implementation change, ten focused real-hook/product-store tests
ran against the initial code: six passed and four failed with M31 still selected
after an authoritative null snapshot, including fresh module/session hydration.
A real Docker/Chrome search selected M31; an actual canvas click made native SWE
selection and the workspace drawer null while session intent still contained
catalog/source/model/RA/Dec. That browser regression failed at the empty persisted
identity assertion. These are runtime reproductions, not source-only reasoning.

The poller previously synchronized only non-null native selection. The correction
records selection-command revision and pending count in a per-client record.
Only a successful current-client null snapshot that began after an acknowledged
selection, with no pending/newer selection command and the same current canonical
intent, can clear acknowledgement, Hub selection and pending focus. The existing
store subscription removes persisted identity. A callback at the workspace routing
boundary removes catalog/source/model/RA/Dec/focus from the current route while
preserving time and observer intent. It sends no new selection command to SWE.

Initial null, delayed pre-restoration null, an in-flight replacement, newer
unacknowledged intent and a departed client cannot erase restoration intent.
Revision checks also prevent a stale non-null poll from overwriting selection
while a newer selection command is pending. Native scene/selection ownership,
protocol schema, search, Focus, the wheel adapter and layer restoration queue
are unchanged.

### Fresh qualification

| Exact command or command group | Result |
| --- | --- |
| `npm --prefix frontend test -- tests/workspaceSelectionSync.test.ts` before fix | Four failed / six passed; stale M31 state reproduced |
| Focused selection plus existing adapter tests | 13 passed |
| `npm --prefix frontend test` | 214 passed, 28 files |
| `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs` | 79 passed |
| `npm --prefix frontend run typecheck` and `npm --prefix frontend run build` | Passed |
| New native-deselection browser cases, ordinary Docker development | Two passed |
| Existing development browser command below | 16 passed, including all three restore/user-action serialization cases |
| `npm run validate:oras-deep-links` | 25 native exact links, seven API checks, two searches passed |
| Built Docker preview command below | 12 passed; genuine Sky/Earth bfcache and one-renderer lifetime |
| Source/built/served artifact verification | 29 source overlays, 95 Sky payload files and digest, all 96 served installation file hashes, marker/lock/versions/Earth release passed |

```bash
# frontend cwd; ordinary Docker development
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyNativeDeselection.spec.ts --workers=1 --output=/var/tmp/oras-pr65-deselection-20261005/native-green
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyFollowup.spec.ts tests/e2e/skyUxRegressions.spec.ts tests/e2e/workspaceLayerRestore.spec.ts --workers=1 --output=/var/tmp/oras-pr65-deselection-20261005/browser-development
# frontend cwd; generated Hub build in the same Docker frontend with read-only data
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test tests/e2e/skyNativeDeselection.spec.ts tests/e2e/skyBfcache.spec.ts tests/e2e/earthBfcache.spec.ts tests/e2e/workspaceFinalReview.spec.ts --workers=1 --output=/var/tmp/oras-pr65-deselection-20261005/browser-preview
```

Both native-search and canonical-link cases prove real empty-canvas deselection,
drawer removal, empty persisted/session identity, clean current and standalone
recovery URLs, Sky → Earth → Sky and reload without resurrection, then successful
M42 selection. Page-error assertions are empty. Existing cases freshly re-prove
unified/standalone inward/outward native FOV changes, qualified search/Focus,
eight ORAS native controls/state and desktop/mobile geometry, Home/Observe/Tonight
Open-in-Sky routing and standalone exact links. Layer restoration remains
serialized, newer user choices win, and departed-client work stays cancelled.

This changes only the Hub/frontend workspace integration. Sky artifact inputs,
source overlays, native WASM/vendor files, wheel input, data provisioning and
Earth inputs are byte-identical to initial `4c82b9f7`. The fresh Hub build and all
served Sky files verify artifact
`e4978c294aa36268ce4476662b1f1130e687b499bd748edf2ca0e5c254c32a0e`.
Earth remains `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.
No Sky-owned rebuild, artifact promotion or digest exception is needed.

Raw command arguments, exits, red/green logs, diagnostic scripts and the final
head/check/thread handoff are in `/var/tmp/oras-pr65-deselection-20261005/`.
New screenshots are `output/playwright/sky-ux/native-deselection-{native-search,canonical-link}.png`.
The initial unit command used the wrong checkout; its test file was moved into
the intended worktree before the real red run. The first browser invocation caught
a test syntax error, corrected before execution. The first zero-duration mouse
click was not sampled by the frame-driven native input loop; the actual pointer
click now holds for 150ms, and native click-count/selection observations prove it
executed. An initial delayed-response unit fixture advanced fake timers without
waiting for poll dispatch; awaiting dispatch corrected the fixture. Logs retain
these setup/test failures separately from the confirmed stale-selection regression.

Category B remains unchanged: cold search/index cost, legacy star/coverage limits,
wide-view magnitude/deep photometry limits, CONUS-only historical HD imagery and
lower-resolution global fallback, ellipsoid-only terrain, Launch Library's known
production 403, physical-device performance and broad provider campaigns.
Full backend/provider/HD/terrain/star-density campaigns were not rerun. No C5.7,
new body/provider feature, optimization, production/SSH/Cloudflare/oras.org or
remote infrastructure work occurred. Owner settings, installed data, original
worktrees, volumes and PostgreSQL/Redis identities are preserved. Final committed
head wheel proof, normal-mode restoration and GitHub thread/check state are in
the final handoff; neither PR is merged by this task.

Final document gate passed six manifest-negative checks and architecture
validation: 187 entries, eight packs, 37 checkpoints, 101 links and eight ADRs;
`git diff --check` passed. The named P2 is addressed by the bounded correction
and fresh native runtime proof; final owner review remains required.

## PR #65 three-objective readiness correction, 2026-10-05

The owner authorized only the stale Observe unified-route test, immersive Escape
recovery and expanded mobile Sky toolbar/credits P2. Initial head was
`f4fa788782c55dad19043343ed4cdb59c1fb9e9e`; PR #65 remains stacked on open tooling
PR #64. No merge, deployment, production or next-phase work is included.

The unchanged-head browser run reproduced both failures. Observe already opened
`/sky-engine`, while its test expected standalone `/oras-sky-engine/skysource/`
and top-document Vue. The corrected test follows the actual card's source-backed
API identity and checks represented RA/Dec, observer/time/focus, exactly one titled
runtime iframe, native SWE selection and yaw/pitch centering within 0.02 radians.
Back restores the exact Observe context and leaves no runtime frame. Standalone
coverage remains in the existing regression matrix.

Immersive was a product focus/key-routing defect: the entry button blurred itself,
leaving BODY active, outside the shell's React Escape path. Captured classes,
chrome state, key target/path, header visibility and completed transitions proved
that Escape never reached that handler and stage top remained 0. Entry now focuses
the existing focusable stage. The Sky bridge forwards native-toolbar Escape,
retains native search/Tab behavior and observes native panels in capture phase
before Vue closes them. First Escape closes an open native panel without leaving
immersive; the next canvas Escape restores the 56px header. Both immersive cases
passed three consecutive runs (six passes), with additional Hub/canvas/native-
toolbar diagnostic evidence and empty page-error arrays.

At 390x844, the red expanded sheet started at page y=204, while toolbar y=184–244
and credits y=252–296 overlapped it. With an open sheet, the owned adapter now puts
the horizontally scrollable eight-control toolbar at x=16, y=124, 278x60 and the
credits control at x=306, y=124, 68x44. Both end above the sheet and remain separate
from the mode switcher. Native search is suppressed while a mobile sheet is open
and restored on close. Normal no-sheet and desktop positions remain qualified.
All eight controls pass real touch toggling and keyboard restoration; every control
is at least 44x44. Context/time/diagnostics at 96/360/640 snaps have no sheet
intersection or document horizontal overflow. Exposed canvas input changes native
yaw while the expanded sheet stays open.

Layout proof found a second attribution obstruction: the native credits dialog's
Close button sat behind the expanded Hub sheet. Sky-only presentation reports now
pause Hub overlays while native settings/credits dialogs are open, then restore
the existing surface and snap. Reports are checked against current origin, frame,
nonce, generation and increasing sequence and removed on departure. Native Vue
retains dialog behavior. Sky sheets remain nonmodal so exposed native controls
and canvas receive input; Earth modal/inert behavior and shared protocol source
remain unchanged. Native dialog buttons have 44px targets. Touch/keyboard credits
activation, visible native Close and same-snap recovery are qualified.

The plugin is a Sky artifact input. The pinned Node 20 image reconstructed the
frontend from comparison anchor `023e3b26babf7ffddf45f39293230b14cfe96993` plus the
29 unchanged source overlays and qualified native inputs. Two builds reproduced
all 95 payload rows byte-for-byte. Promotion and runtime metadata were recorded
through repository tools, including the vendor-CSS freeze guard and explicit raw
Sky bridge input hashes. Old Sky:
`e4978c294aa36268ce4476662b1f1130e687b499bd748edf2ca0e5c254c32a0e`.
New Sky:
`b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`.
All 96 installation files and served hashes agree with marker/lock/versions.
WASM, native chunk, vendor JS/CSS and wheel input are unchanged. Earth remains
`ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`,
including every source input in its frozen release and shared protocol files.
Large installed skydata stays outside the build and mounted read-only.

Fresh supporting validation: frontend 229/229 (28 files), runtime/Earth 82/82,
typecheck/build, document authority checks (187 paths, eight packs, 37 checkpoints,
101 links, eight ADRs) and six manifest-negative tests passed. Broader browser
bundle passed 34/34: Tonight 3/3 (six exact targets), owned Earth 10/10, Sky UX
9/9, controls/Gaia 4/4, native deselection 2/2, native A→B 1/1, layer restoration
3/3 and mobile/desktop presentation 2/2. Deterministic queued departure passed
three further consecutive runs. Genuine Docker-preview bfcache passed all three
Sky/Earth cases, proving persisted same-document restoration and working time
bridge. Exact-link validator passed 25 native links, seven API checks and two
searches.

Entire frontend Playwright completed all 99 cases in 22.0 minutes: **91 passed,
zero failures, eight unchanged optional live/HD skips, zero flaky**. Full-run
publicShell 5/5, unifiedWorkspace 6/6 and every nonoptional case passed. JSON
report and per-file/skip summaries are retained; fixture and cached-document proof
is distinguished from optional provider/HD qualification.

Evidence and exact command arguments/exits are in
`/var/tmp/oras-pr65-final-qualification-20261005/`. Red/green immersive diagnostics,
mobile geometry and screenshots are retained there; final screenshots also live
in `output/playwright/sky-sheet-presentation/` and
`output/playwright/observe-unified-exact.png`. Preview is a temporary qualification
mode; ordinary Docker development is restored before handoff.

Category B limits remain: historical cold search/index cost, legacy Gaia/coverage
and native photometry limits, CONUS HD versus global fallback, ellipsoid terrain,
known Launch Library 403, physical-device performance and broad provider campaigns.
Optional live/HD skips do not establish provider or production qualification. No
God's Eye audit, C5.7, provider/body/terrain/starfield feature, SSH, Cloudflare or
oras.org action occurred. Owner settings stay unchanged/unstaged; installed data,
PostgreSQL/Redis identities and all initial Docker volumes are preserved.
