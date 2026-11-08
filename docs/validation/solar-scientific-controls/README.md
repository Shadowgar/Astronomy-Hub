# Solar scientific scale and camera controls — draft PR88

The owner rejected misleading globe enlargement and confusing Inner/Overview controls. This bounded correction replaces fixed enlarged glyphs with API mean radii in AU, keeps all nine supported bodies in the scene, and makes All planets / Inner planets / Outer planets explicit camera presets. Selecting a body approaches its actual source position; geometry is never enlarged to obtain a close-up. Unresolved positions use symbolic points and source-linked leader labels.

Branch `cinematic-hub-integration-1`, baseline `6180cc96a5bf7ca5111dfe11cab404117ab6147b`, existing [draft PR88](https://github.com/Shadowgar/Astronomy-Hub/pull/88), stacked on `cinematic-sky-ux-1` (#87). **OWNER VISUAL ACCEPTANCE PENDING. No merge or deployment.** The five cinematic packages and prior current-time fix are preserved. The owner's approved physical-scale direction explicitly supersedes older enlarged-glyph guidance, without replacing the approved glass interface or its original reference assets.

Working owner preview: [Solar System](http://172.26.23.204:4218/solar-system). [Actual screenshots and exact approved originals](gallery/index.html), also available through the preview at `/evidence/solar-scientific-controls/gallery/index.html`. This private WSL address is session-specific; Windows localhost forwarding previously refused connections. The task's existing Docker relay serves the preview without changing unrelated services.

## Behavior and scientific limits

- Physical globe radii are `shape.mean_radius_km / km_per_au` from the qualified API, using the same AU units as the immutable ephemeris vectors. NASA Mars UV geometry and all original imagery bytes remain intact.
- All / Inner / Outer only choose anchors for camera fitting. Every supported mesh remains present. Zoom, orbit and drag report Custom view; Recenter restores the last framing or selected-body close-up. The default is All planets.
- True-size planets are generally unresolved at system distances. Minimum-size points, leader lines, thumbnails and selection corners are interface symbols, not physical disks. Labels move to avoid collisions; astronomical positions do not move.
- All eight planets plus Sun are available. Close-ups move the camera across actual AU distances using a bounded logarithmic-distance approach. Near clipping and minimum distance change safely at arrival; user input cancels the approach.
- Optional atmosphere/corona/background and the statistical main belt are off by default, inside Science, scale & sources. Decorative stars have no catalog identity. The belt has no individual asteroid identities or ephemerides. The Sun photosphere/material and optical brightness remain illustrative, even with effects off; this is not calibrated photometry or a measured observation.
- Positions remain Sun-centered ICRF geometric vectors without light-time correction. Mars/outer anchors use the API's explicitly disclosed system barycenters. Mean-radius spheres at those anchors are not precision body-center/terrain solutions. Rotation and ring orientation remain static illustrations; historical Earth surface/cloud mosaics are not live weather. These limits are disclosed in the product.

## Fresh qualification

[Exact commands and logs](COMMANDS.md), [source/artifact receipt](evidence/delivery.json), [preservation receipt](evidence/preservation.json), [loaded context inventory](context.json), [complete changed-file list](FILES_CHANGED.txt).

| Qualification | Result on final source |
|---|---|
| Actual Docker-backed browser geometry/navigation | **176/176 groups**: 1440×900, 390×900, 540×390, 320×568; historical `2026-02-28T00:00:00Z` and `2026-10-23T01:05:00.123Z` |
| Physical geometry and source | Actual loaded mesh bounding radii match API radii; all nine exact vectors, camera destinations, UTC and selected globe/HUD bounds asserted |
| Presets, zoom and controls | All nine labeled in All view; no body hidden in any preset; zoom from Inner reveals outer labels; keyboard focus and ≥44px preset targets; expanded Earth/Saturn controls clear globes and one another |
| Normal approach | Earth/Mars 2/2, including details reflow; Mercury→Sun/Jupiter 2/2 plus input cancellation |
| Custom orientation across resize | Position, target, up and quaternion preserved; first zoom does not rotate the view |
| Lifecycle/recovery | 7/7: original-asset failure/recovery, display preferences across time change, actual WebGL loss/Retry, reduced motion/resize, idle RAF and late GLB disposal on Sky return |
| Current-time entry regression | 8/8 entries: desktop/mobile default controlled time, explicit milliseconds, historical whole-second and uncontrolled live current time |
| Frontend | **331/331 tests, 50 files**; TypeScript exit0 |
| Docker science API | **23 passed**, two existing deprecation warnings; no backend source changes |
| Reproducibility/served bytes | Three identical 136-file Hub builds, one pinned offline Docker build; every served file checked at both preview addresses |

Browser assertions use the real Docker ephemeris API and original local assets. Controlled wall-clock fixtures are labeled in their receipts; the separate uncontrolled entry uses actual current UTC. Browser motion/layout/texture evidence is representative controlled Chromium, not owner-device acceptance. Lifecycle software-rendering frame gaps measured median33.3ms, p9566.7ms during a normal approach; renderer was idle afterwards. SwiftShader was identified explicitly; physical GPU timings/hardware qualification were not obtained. No N1 stalled full navigation suites were repeated.

## Reproduced failures and corrections

| Observed failure | Evidence and correction |
|---|---|
| Previous fixed display radii did not match scientific API radii | [Actual browser red](evidence/physical-scale-red.json); physical-radius conversion plus actual loaded-geometry assertions now pass |
| Short-landscape and narrow system callouts exhausted greedy label slots | [Compact red](evidence/compact-label-red.json), [narrow red](evidence/narrow-label-red.json); bounded group placement and obstacle-edge candidates retain source anchors and all nine labels |
| Custom camera rotated when crossing the responsive orientation breakpoint | [Actual red](evidence/camera-state-red.json); retain Custom up/quaternion, [final browser green](evidence/camera-qualified.json) |
| Destination minimum distance clamped Mercury departures abruptly | [Unaltered raw samples](evidence/transition-raw-original.json), [derived failure audit](evidence/transition-red-audit.json); defer destination limits, retain smooth transition, [final green](evidence/transition-qualified.json) |
| Selected globe or expanded details collided on compact screens | [Short frame red](evidence/short-frame-red.json), [measured rectangles](evidence/short-frame-measurement.json), [short expanded red](evidence/short-expanded-red.json), [portrait expanded red](evidence/portrait-expanded-red.json); use legitimate small clear strips, actual card/control spacing, and move optional toggles into the existing dialog |

The initial transition probe falsely reported PASS because it checked only the first unchanged animation sample. Its original status is retained verbatim; the derived audit establishes the next-frame jumps from those actual samples. The corrected harness asserts every captured early-motion sample. Earlier failed and intermediate passed runs remain historical and are not relabeled as final-source qualification.

## Preservation and remaining visual gaps

Protected paths compared against6180cc96: backend science, packages, all native runtimes, integration/source pins, public native artifacts, Solar assets and original approved references are unchanged. Earth artifact remains `43e822e52ffe01bc7591579e329ce0fb5aed5a521ffb9cd47808173f8beb03d3`; Sky remains `b1dbd0f039ccf4ed4c0a669baf5bd7288b1ea07c9db98e199c04949431a644fb`. Original rollback files, ephemeris kernel, owner settings,117 original container states/mounts and90 volumes pass the preservation audit. Existing rollback build trees remain in `output/cinematic-acceptance/`; the new Hub is isolated in `output/solar-scientific-controls/`.

| Reference difference / remaining limitation | Objective reason / status |
|---|---|
| Large simultaneous planetary disks from the concept are absent | Intentionally rejected by owner: source distances and physical radii cannot produce that composition at one camera scale |
| System views show point symbols and long callout leaders around the crowded inner system | Real geometric scale; point and label dimensions are symbolic UI. All bodies remain discoverable through the rail and presets |
| Close-up globe is small on320×568, especially with expanded details | Physical camera fitting respects all44px controls and the real remaining clear strip; tested visible/resolved, not a claim of ample scene area on very short phones |
| Accurate spin, photometry, live clouds, precision ring/terrain and body-center solutions | Not provided by the qualified sources/models; static/illustrative status disclosed rather than invented |
| Physical desktop/mobile GPU performance | Not qualified here; SwiftShader result is separately labeled |
| Owner visual acceptance | Pending review of the revised working preview; technical passes do not grant it |

Independent scoped source review found no further confirmed regressions after fixing its camera-clamp finding. Final exact-commit review and local/remote/served identity are recorded in the PR conversation after delivery. PR88 remains draft; dependency chain through #87…#74→#73 and independent #71 are preserved. No merge, deployment, new provider/dependency, renderer replacement or R4 work. Recommended next task: owner review of the scientific-scale controls and preview.
