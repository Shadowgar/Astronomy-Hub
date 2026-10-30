# Apollo 17 regional terrain runtime

The owner’s Solar System 2.1 directive explicitly authorizes the separate advanced
terrain route on `recovery/reconcile-20261026` / PR107. It supersedes the prior
Solar 2.0 product stop only for this integration. Existing native Moon scene/math,
Sky, Earth and their scientific payloads are preserved. No release or owner visual
acceptance is implied.

## Context and implementation boundary

Loaded: repository/user AGENTS, frontend AGENTS (its reconciliation supersedes
historical FE8.5), CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST and the
`solar_reconstruction` pack: SYSTEM_VALIDATION_SPEC, UNIFIED_UNIVERSE_ARCHITECTURE,
ADR0010, cinematic reference, workspace design specification, Adaptive Explorer
R1-A README, owner-acceptance README, visual-fidelity README and Solar2.0 PLAN.
The parent explicitly requested the prior R4 Moon contracts; its README and
current `planetContracts.ts`, `PlanetWorkspace.tsx`, `PlanetFrame.tsx`,
`solarVisitState.ts` and existing Solar/system return contracts were inspected.
No full docs scan was performed. The attached owner directive controls the new
scope; older architecture “R4 unavailable” text is historical, not runtime truth.

New application files:

- `frontend/src/features/terrain/TerrainWorkspace.tsx`: product route, source
  disclosure, quality/relief controls, time/observer/history and native returns.
- `TerrainScene.ts`: actual `TilesRenderer` import/instance, one Three scene,
  explicit Moon ellipsoid, local transform, camera, LOD, timing and disposal.
- `terrainContracts.ts`: source/frame/budget admission, double-precision ENU
  transforms, native Moon return validation.
- `terrainNavigation.ts`: native Earth/Sky handoff via existing `solarExit`, with
  canonical observer intent validated independently of source/GPU initialization.
- `terrainTransport.ts`: same-origin qualified-pack transport, file/session byte
  caps and session/root/content cancellation.
- `terrain.css`: scene-first desktop and touch layout with shared glass classes.
- `frontend/tests/terrainContracts.test.ts`, `terrainTransport.test.ts`,
  `terrainNavigation.test.ts`, `terrain.browser.mjs` and `terrain.handoffs.browser.mjs`: pure contract/transport and actual browser checks.

Parent-owned integration adds the route `/planet-terrain/apollo17-nac-v1`, the
native Moon entry and exact pinned package aliases/locks. The source task owns
the real pack and conversion receipts. No custom substitute tile system is used.

## Source and coordinate contract

The manifest at `/planet-terrain/apollo17-nac-v1/manifest.json` supplies an exact
5.12 km square from the released LROC NAC Apollo17 stereo DTM and matching 5 m
orthomosaic. There are 85 local GLBs at four directly decimated levels:
40, 20, 10 and 5 m posts. The source task records original HTTP range hashes,
source labels, confidence, source rights, conversion, seams and generated hashes.
Source confidence includes stereo/interpolated estimates; 5 m posting is not a
5 m accuracy claim. The source imagery retains acquisition shadows and receives
a documented grayscale display stretch.

The admitted body is Moon301 and radius is exactly 1,737,400 m. Latitude is
planetocentric and longitude east-positive. `LROC_ME` is the source’s Mean Earth /
polar-axis frame; the exact DE realization is unspecified. We do **not** claim
sub-metre registration with the native `MOON_ME_DE440_ME421` globe. Navigation is
an explicit renderer handoff, not continuous frame-qualified flight.

The pack root maps regional ENU into lunar body-fixed Cartesian metres. Its origin
is the actual source center, including signed radial height. The runtime applies
the inverse ENU transform to `tiles.group`, cancelling large coordinates with CPU
doubles before GPU matrices. The camera uses local east/north/up metres with Z up.
Standard glTF Y-up content is converted by NASA’s loader. The package’s WGS84
default is explicitly replaced with the lunar sphere before loading. The two
ellipsoid consumers, `tiles.ellipsoid` and `tiles.surface`, use the same object.

Default imagery is the source’s unlit material: no claim of current Sun lighting.
Optional gray relief computes normals from actual measured geometry and uses
explicit fixed illustrative lighting. It changes neither positions nor heights.
The source’s 80 m seam skirts are disclosed as non-measured rendering geometry.
No synthesized fine terrain, fake sphere displacement or procedural craters.

## Lifecycle and budgets

React owns the route/chrome; the terrain engine owns all scene and GPU state.
Native Moon disposal is awaited before route entry; its full URL (including native
camera) and nested return state are retained. UTC remains canonical. Direct
bookmarks keep Earth-observer `lat/lng/elev` separately from lunar `lat/lon`.
Return to Moon, Solar, Earth and Sky use existing native/hierarchy return contracts.
History stores regional camera state. Browser Back mounts a fresh owned renderer.

| Budget | Balanced | Efficient |
| --- | ---: | ---: |
| Maximum device pixel ratio |1.5|1|
| Screen-space error target |5 px|10 px|
| LRU byte ceiling |128 MiB|64 MiB|
| LRU tile ceiling |90|40|
| Simultaneous downloads |4|2|
| Simultaneous GLB parses |1|1|
| Node queue jobs |1|1|

These are owned per-instance caches/queues, replacing the package’s shared defaults.
Each tile is capped by its manifest maximum (561,688 bytes in the final source revision),
root JSON at256KiB, source pack at64MiB, session received bytes at160MiB (including
failed transfers/retries). Only local pack GLBs and its one root JSON are admitted.
Nested/foreign resource URLs and redirects are rejected. HTTP failures remain
visible; Retry tiles calls the package’s actual `resetFailedTiles()`.

The scheduler renders on camera/tile/resize events, continuing only for damping;
hidden tabs suspend it. Reduced motion removes damping. Download and parsing work
does not run in the render loop. Teardown cancels animation and fetches (including
the root), releases models/textures/normal/relief materials, controls/listeners,
ResizeObserver, GPU timer queries and WebGL context. Context restoration replaces
the lost instance and restores the camera/UTC. User retry also recovers a context
that the browser does not restore automatically.

`window.orasTerrainDiagnostics()` reports the real package instance, Three revision,
source frame/ellipsoid, actual tile depths/URIs, stats, transferred bytes, cache,
draw calls/triangles, renderer geometry/texture counts, local/body-fixed camera,
initial visible time, CPU/active frame intervals and supported GPU timer queries.
The last eight disposed snapshots are retained as `window.orasTerrainDisposed`.
Frame intervals are active render intervals, not a continuous idle FPS benchmark.

## Validation so far

Commands run from the recovery worktree:

```sh
npm --prefix frontend test -- --run tests/terrainContracts.test.ts tests/terrainTransport.test.ts tests/terrainNavigation.test.ts tests/solarNavigation.test.ts
npm --prefix frontend run typecheck
cd frontend
node tests/terrain.browser.mjs
```

Final focused tests: **29 passed / 4 files** (25 terrain +4 existing native handoff tests). Typecheck and `git diff --check` passed. Initial red contract test
failed because implementation was absent; it passed after implementation. A first
test placement under `src` was not collected by the repository config, then moved
to the existing `frontend/tests` convention.

Initial Linux Chromium CLI inspection found a real browser-native `fetch` binding
error in the transport; fixed by invoking the injected function without class `this`.
Fresh actual rendering then showed `instanceOfTilesRenderer=true`, Three180,
correct lunar radii, four level1 tiles /135,168 triangles, followed by levels2–3 /
642,048 triangles on Approach. Cache grew from3.17MB to23.48MB below its limit.
Actual screenshots: `output/playwright/solar-system-2.1/terrain-linux-overview.png`
and `terrain-linux-detail.png`. These are supporting Linux/software-rendering
evidence, **not Windows hardware, physical iPhone or owner acceptance**.

The expanded Linux browser run passed **7 groups**, with zero page exceptions:
three layouts (1440×900,390×844,844×390), real CDP pinch input, keyboard, resizing,
reduced motion, WebGL context restoration, HTTP503 tile retry, history restoration,
and Solar/Earth/Sky exits preserving observer coordinates and releasing all terrain
geometries/textures. [Receipt](receipts/terrain-linux.json). Native destination
readiness and native Moon entry are added to the subsequent hardware script, not
retroactively claimed by that Linux receipt.

The first uninstrumented regression stopped at a30s timeout, with cause unresolved;
its [failed receipt](receipts/terrain-linux-initial-timeout.json) is retained. The
instrumented run and expanded run passed. Actual portrait inspection then found
shrinking toolbar labels overlapping; the terrain-only CSS now prevents shrinking
and wraps to two rows. Final captures must use this correction.

Four initial Windows Edge runs failed at the first private navigation with
`ERR_CONNECTION_REFUSED`, before application resources loaded. Root cause was a
**real nginx route collision**: the SPA path matched the physical source-pack
directory, so nginx redirected to the internal8877 port. Manifest file requests
returned200 and the Vite SPA had passed, which initially obscured this boundary.
The parent corrected both product and private-preview nginx routing to serve the
terrain route as application HTML without redirect. Missing GLB paths remain404.
The [failed receipt](receipts/terrain-windows-connectivity-failure.json) is retained.
The hardware script now checks final origin, HTTP200 and exact served/local source
manifest hashes. No host firewall, public exposure or browser sandbox relaxation
was performed; an unsuccessful temporary browser DNS probe is not in final launch
options.

Docker/private-preview, Windows GPU, independent review, hosted checks and owner
acceptance remain separately qualified in the overall Solar2.1 report.


## Windows graphics and native Moon evidence

After the nginx correction, Windows Edge156 / ANGLE NVIDIA RTX3060 Laptop GPU
(D3D11) completed all three layouts, actual tile refinement through level3,
cache limits, gray relief, Efficient quality, keyboard/pinch/resize, context-loss
recovery, native Moon entry, native Moon camera/epoch return and Browser Back.
Each departure recorded zero remaining terrain geometries/textures. Videos and
original screenshots remain in `output/playwright/solar-system-2.1/terrain-windows-final/`.
The exact served/local manifest SHA was
`3cfcbb6c270bbe1df4eadfacefc143e2843d5cd1d18994a72f6fb1c9ce3c3543`.

[Hardware graphics subset receipt](receipts/terrain-windows-graphics-before-handoff-fix.json)
retains the complete run’s **FAIL** status at the later Earth observer assertion;
the preceding graphics/native Moon assertions are individually successful.

| Viewport | First visible tile | Balanced GPU median / p95 | Detail cache |
| --- | ---: | ---: | ---: |
|1440×900|391.5 ms|0.364 /1.597 ms|26.02 MB|
|390×844 touch emulation|99.3 ms|0.476 /1.378 ms|18.40 MB|
|844×390 touch emulation|68.0 ms|0.604 /2.224 ms|18.40 MB|

These bounded samples include actual tile loading/navigation with recording enabled;
not a universal frame-rate claim. Mobile layouts are emulated, not physical iPhone.
GPU timing is the actual supported disjoint timer query, not CPU timing relabeled.
The later script also records raw, unfiltered90-step RAF intervals independently of
idle/event-driven renderer diagnostics.

### Corrected native handoff finding

The Windows run reproduced a genuine terrain→Earth error: observer parameters in
the URL were correct, but `planetModeReturn` alone supplied no native `n1View` or
Earth recenter command for a direct terrain bookmark. The terrain adapter now
passes the returned destination through the already-qualified `solarExit` helper,
including canonical observer, saved native views, selection and mobile policy.
No Earth/Sky renderer or native science changes were needed.

Independent review then reproduced the failure path before source/GPU startup:
observer ingestion was previously delayed until successful terrain mount.
`terrainNativeExit` now validates the current URL intent immediately before
building the native handoff, and entry ingestion also precedes asynchronous
initialization. This covers loading, missing manifest, GPU initialization failure
and same-route observer query updates. The new focused tests exercise these cases
with the real canonical validator and native handoff helper. A test fixture’s
invalid `elevationSource:'user'` was corrected to the actual `provided` contract;
it was not a product defect.

Final rebuilt Windows verification now passes **8/8 destination groups**:
Earth and Sky each after normal terrain startup, a deliberately held manifest,
HTTP503 manifest failure and simulated terrain-only WebGL initialization failure.
All returned actual native observers retain40°N,80°W,400 m and the selected UTC;
there is exactly one native iframe and no terrain canvas. Normal terrain departures
record zero geometries/textures. Every group verifies the exact final manifest SHA.
[Final hardware handoff receipt](receipts/terrain-windows-handoffs-final.json).

The initial GPU-failure test hook also intercepted newly created native frames;
that harness error was corrected to the top frame only. Its failed exploratory
receipt remains in `output/playwright/solar-system-2.1/terrain-handoffs-final/`.
The corrected eight-group result is in `terrain-handoffs-corrected/`. This is
separate from the original application's Earth handoff defect and its correction.

Windows command (from recovery root):

```sh
'/mnt/c/Program Files/nodejs/node.exe' \
  "$(wslpath -w "$PWD/frontend/tests/terrain.handoffs.browser.mjs")" \
  http://127.0.0.1:4231 \
  "$(wslpath -w "$PWD/output/playwright/solar-system-2.1/terrain-handoffs-corrected")"
```

[Original video mapping and SHA receipts](receipts/terrain-videos.json) bind the
three untouched VP8 recordings to actual encoded viewport dimensions, read with
Playwright's bundled `ffmpeg -hide_banner -i` (standalone ffprobe is unavailable).
No frames were replaced or synthesized. The full browser script now writes video
basenames directly for future captures. The native Moon source is globally coarse;
its camera minimum30km means the detailed regional camera is not a continuous
or pixel-identical comparison. The owner gallery must disclose that distinction.

The pre-fix failed hardware run remains failed; its individually successful
three-layout graphics/native Moon evidence and the later successful correction
run form the bounded proof. Independent terrain source/frame/license/runtime
review is in `REVIEW_TERRAIN.md`; the final reviewer independently closed the
failure-path observer finding. Owner visual acceptance and physical iPhone remain
open, and the parent owns overall hosted/release qualification.
