# Controlled native Moon terrain demonstration

Working private demonstration:
<http://localhost:4231/owner-review/solar2-terrain/>.
This uses the original `PlanetRuntime` class and actual Docker-backed Moon API,
with an explicitly installed LOLA provider. The default Moon route, contract,
renderer source and existing packaged artifacts remain unchanged.

The adapter in `runtimes/planet-runtime/lolaTerrain.mjs` creates native Cesium
`HeightmapTerrainData`, `GeographicTilingScheme` and availability metadata using
the existing qualified Cesium1.138.0 SDK. It owns no second viewer, render loop,
clock or ephemeris. The API supplies epoch2026-10-28T00:00Z, center301 and
`MOON_ME_DE440_ME421`; original PDS terrain uses compatible DE421 ME coordinates
and the1,737,400m lunar sphere. Heights are signed metres, with exaggeration1.

Tiles have91×91 samples; source levels0–3 end exactly at0.25° spacing. No source
tile above level3 exists. Native Cesium may upsample coarse geometry for display;
this does not add measured detail. Culling, mesh generation and geographic LOD
remain native. Provider disposal releases the source reference; AbortSignal and
native request cancellation prevent queued tiles from publishing after disposal.
The pixel-center grid ends at ±89.875°. Each exact pole uses the mean of its
nearest source row; native terminal triangles interpolate that cap. This is an
explicitly extrapolated, unmeasured cap, reported in diagnostics and the demo UI.
It ensures that all longitudes meet at one geometric point without inventing
high-resolution polar detail. Original data bytes and the source sampler remain
unchanged.

The demonstration loads the original2MiB LOLA grid only after SHA-256 admission.
The WAC image actually served by Docker matches its existing qualified hash
`218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8`.
The [receipt](terrain-qualification.json) binds source files, screenshots/video,
served API/image/height bytes, unchanged native source hashes, and browser results.

## Actual checks

- Native Cesium tests:4 passed. Checks include lunar ellipsoid/frame, signed
  metre interpolation via real `HeightmapTerrainData.interpolateHeight`, shared
  tile boundaries, source availability cap and queued cancellation/disposal;
  every pole tile across source levels0–3 has the same height at its pole.
- Height sampler tests:5 passed; frontend typecheck and `git diff --check` pass.
- Real Chromium:1440×900 desktop and390×844 portrait, one Moon canvas, zero page
  errors. Oblique camera at85km reaches source levels `{0:2,1:8,2:1,3:4}`.
- Same-camera native rendered heights at23°W and10°,13°,16°N:
  terrain−506.00/−805.75/−1642.88m;
  reference-sphere mesh−4.07/−16.12/−15.91m. Sphere values include native chord
  approximation; they are not invented zero-height assertions. Each comparison
  differs by more than400m with unchanged camera and epoch.
- Release removes the native canvas, destroys the viewer, disposes the terrain
  provider and reports zero retained source-grid bytes.
- Independent review reproduced a late initialization race by delaying actual
  WAC imagery, releasing the viewer and resuming the response. The demo now
  checks abort/disposal after initialization. Repeating that sequence leaves
  status `disposed`, `ready:false`, zero canvases/source bytes and no page error
  when Oblique is clicked.
- Independent review also exposed longitude-varying heights at the same pole.
  The new native pole regression failed before the cap correction and passes
  after it. Neither correction changes production Moon source or routing.
- Original `PlanetRuntime.mjs`, `contracts.mjs`, `entry.mjs` and `vite.config.mjs`
  are byte-identical to base51771f06. Qualified SDK checkout remains clean at
  `e7707d9a0f34d9fbffc300023c319f95caa5be30`.

Private actual evidence:
[latest reviewed globe](http://localhost:4231/owner-review/solar2-terrain/review-globe-latest.png),
[latest reviewed oblique](http://localhost:4231/owner-review/solar2-terrain/review-oblique-latest.png),
[independent regression receipt](http://localhost:4231/owner-review/solar2-terrain/review-regression.json).
The independent reviewer checked180 native pole samples over all source levels:
north−2.353125m and south31.131598m, each with zero longitude-dependent range;
the delayed-WAC release also passes. No actionable P1/P2 remains in that scoped
review.

Original midlatitude comparison captures, before the isolated guard/polar
corrections (relief unchanged, older UI disclosure):
[globe](http://localhost:4231/owner-review/solar2-terrain/globe-terrain-final.png),
[terrain oblique](http://localhost:4231/owner-review/solar2-terrain/oblique-terrain-final.png),
[same-camera sphere](http://localhost:4231/owner-review/solar2-terrain/oblique-sphere-final.png),
[portrait](http://localhost:4231/owner-review/solar2-terrain/portrait-terrain-final.png),
[interaction video](http://localhost:4231/owner-review/solar2-terrain/terrain-comparison-final.webm),
[full receipt](http://localhost:4231/owner-review/solar2-terrain/qualification.json).

## Reproduction

```sh
frontend/node_modules/.bin/tsx --test runtimes/planet-runtime/lolaTerrain.test.mts
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye node /var/tmp/oras-cesium/gods-eye/node_modules/vite/bin/vite.js build --configLoader native --config scripts/validation/solar2-terrain-demo/vite.config.mjs
cd frontend && npm test -- --run tests/lolaHeightGrid.test.ts
cd frontend && npm run type-check
```

Native tests4/4; sampler5/5; typecheck exit0. Isolated build completes1400 modules,
emitting the dedicated output folder only. It retains the normal Cesium bundle
size warning (4.73MB JavaScript); no warning-clean build is claimed. Earlier test
harness module-format/version-string mismatches and a top-level-await build
target mismatch were corrected before the successful checks.

Browser checks used the Playwright CLI, session`solar2-terrain`, against the URL
above: `open`, `resize 1440 900`, `snapshot`, real button clicks for Oblique
terrain → Reference sphere → LOLA terrain, `screenshot`, `video-start` /
`video-stop`, `resize 390 844`, and Release renderer. Condition-based waits used
actual `globeTilesLoaded` and real sourceLOD3 counts. The JSON probe snapshots in
the private output folder preserve each observed state. One stale CLI element
reference was refreshed from a new snapshot; no runtime defect was inferred.

## Limits

This is a controlled **coarse terrain adapter demonstration**, not the production
Moon terrain release or visual acceptance. Source detail remains7.58km/pixel,
so close imagery is visibly coarse. Illumination retains the existing sphere
mask; it does not implement terrain normals/self-shadowing. WAC historical
shadows and transparent no-data remain disclosed. No fake roughness or vertical
exaggeration was introduced. Current API `terrain:false` still describes the
production contract; harness `terrainInstalled` reports the explicit experiment.

The browser used Linux ANGLE/SwiftShader, with initial ReadPixels GPU-stall
warnings. This is not Windows NVIDIA or physical iPhone qualification, nor a
performance benchmark. The private Docker server already mounts this output
folder; no listener, firewall, public hosting or allowlist was changed. Host
build plus actual Docker-served browser evidence is distinguished from a fresh
Docker native build. No commit, push, deployment or archive publication was done
by the terrain subagent. Independent review remains with the integrating agent.
