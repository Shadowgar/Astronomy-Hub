# Solar System 2.3 architecture review

## Current disposition — 2026-11-02, final captures and hash review

**No unresolved P1/P2 implementation finding remains in this review's inspected
scope.** This supersedes the chronological pending statements below. The shared
body boundary, source-window renewal, scientific/illustrative orientation split,
resource ownership, return state, shader cancellation/readiness and framing
corrections have been reviewed in current source. The review remains tied to a
changing working tree, not an immutable final commit or release approval.

Independently inspected retained evidence: `journeys-qualified` contains 27
passing checks copied exactly from three completed per-layout cases;
`lifecycle-r2` passes four deliberate lifecycle/native-terrain checks;
`after-r2` passes 51 captures plus four additional mobile Saturn/Titan captures
on ANGLE/NVIDIA RTX 3060 with no recorded asset, shader-readiness or browser
errors. Actual images show resolved Saturn
ring clipping, Mars/footer overlap, compact mobile action cards and the corrected
physical-close-up control. All six final desktop system overviews were viewed,
along with targeted final landscape/portrait cases. The latest independent test
run passed **3 files / 21 tests**. Independent filesystem hashes match all 33
recorded runtime inputs and all 312 frontend build files across local dist,
served preview directory and retained Docker export. The SPK manifest hash and
Docker image identifier also match their retained evidence. Full-suite totals
reported by the implementation owner are separate from this reviewer's executions.

The final exclusive Windows/NVIDIA benchmark is independently reviewed:
**28/28 cases PASS**, aggregate `MEASURED`, with stable source positions, renderer
identity and bounded resource ownership. Maximum steady GPU p95 is 1.574ms;
maximum measured RAF p95 is 7.1ms. Startup still includes a worst 166.6ms frame
interval. All cold startups use Balanced before steady-quality switching, and
browser/driver shader caches were not forcibly reset. This is not a hitch-free
or strict cold-cache A/B claim.

**Remaining handoff:** bind the verified working-tree inputs to the final commit/PR.
No unresolved source defect is asserted here. Broader device coverage and owner visual acceptance
are not implied. Only this report was edited by this reviewer; no browser/GPU,
Docker activation, application edits, commits or pushes were performed.

## Historical baseline and review progression

Read-only baseline assessment at `767ec130faa60606e689a889f7ed4c3c58ee74fc`,
branch `recovery/reconcile-20261026`, 2026-11-02. The owner's 2.3 attachment
explicitly supersedes the 2.2 product-work stop for this reconstruction. This
review does not qualify an implementation or grant visual/release acceptance.

## Context and inspection

Loaded root/frontend operating rules and the `solar_reconstruction` context:
CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST, SYSTEM_VALIDATION_SPEC,
UNIFIED_UNIVERSE_ARCHITECTURE, ADR0010, cinematic reference contract,
UNIFIED_WORKSPACE_DESIGN_SPEC and adaptive-explorer-r1a README (relevant design
sections), recovery owner-acceptance/visual-fidelity reports, Solar 2/2.1/2.1.1/2.2
plans and 2.2 README. These match the declared pack. No unlisted repository
documents or full docs scan were used. Current source, not historical memory,
establishes implementation reality.

Inspected SolarScene, SolarCameraController, solarAssets, solarTextureStreaming,
solarVisualAssets, solarMaterials, solarRings, solarAtmosphere,
solarRenderPipeline, solarTakram, solarEarthFrame, solarPrecision,
solarPresentation, SolarWorkspace, solarVisitState, SystemScene,
SystemWorkspace, systemMaterials, systemSceneMath, systemContracts,
systemTypes, systemPlayback and their focused tests.

Inspection commands were `git status --short`, `git rev-parse HEAD`, targeted
`cat`, `sed -n`, `rg -n` and `rg --files` over those paths. Baseline Git status
was empty and HEAD matched the requested SHA. One design-section `rg` expression
had an unmatched parenthesis; the corrected expression returned the requested
sections. No application edits, browser/GPU runs, tests, Docker changes, commits
or pushes were made by this baseline review. The only reviewer output is this file.

## Smallest coherent shared boundary

Extract the actual Solar body construction, source mesh adoption, material/ring
creation and map promotion into a per-renderer `CelestialBodyLayer`. Both Solar
and System scenes must instantiate it. Merely importing the existing shaders
again leaves the rejected duplicate renderer architecture in place.

The layer owns body meshes, body extras, one overview asset owner and one detail
streamer sharing a texture budget. It receives the scene and frame request
callback; it creates no WebGLRenderer, RAF loop, science clock, camera, router,
labels or global GPU cache. The host retains composition/Takram, scene lifecycle,
camera, picking, labels and scientific sample evaluation. An equally small
factory plus body instances is acceptable if ownership is just as explicit.

Suggested interface, deliberately limited to the current rendering need:

```ts
type BodyDescriptor = {
  id: string;                         // route/canonical object identity
  appearanceId: string;               // independently qualified asset key
  naifId: string;
  positionReference: string;           // center or named barycenter, never inferred
  radiusAU: number;
  shape: 'mean-radius-sphere' | 'source-shape';
  sourceId: string;
};
type BodyFrame = {
  positionAU: readonly number[];       // caller's unchanged ICRF source position
  sunPositionAU: readonly number[];    // same origin and units as positionAU
  renderOriginAU: readonly number[];
  surfaceQuaternion?: readonly number[];
  ringQuaternion?: readonly number[];
  orientationStatus: 'qualified' | 'illustrative' | 'unavailable';
  displayScale: number;
};
class CelestialBodyLayer {
  add(body: BodyDescriptor): BodyInstance;
  update(id: string, frame: BodyFrame): void;
  setDetailTarget(id: string | null): void;
  setQuality(quality: SolarQuality): void;
  setEffects(enabled: boolean): void;
  diagnostics(): unknown;
  dispose(): void;
}
```

`BodyInstance` exposes its principal pick mesh, physical/visual envelope and
appearance readiness; it does not expose mutable science state. The API need not
adopt these exact names. A planet's appearance identity may be shared between a
Solar barycenter-anchored visual and its physical-center system while the two
position references remain explicitly different.

Preserve the existing source-model/UV pairing rule: never install a source-UV
detail atlas on the initial generic sphere. Clone/apply original node transforms,
retain UV/index buffers and adopt matching map+geometry atomically. Mean-radius
planetary spheres may normalize positions as currently qualified; verified
irregular shapes must retain their shape and documented scale instead. Unknown
moon assets use a neutral, explicitly unavailable material, not the Mercury
procedural fallback. Source-detail failure retains the last admitted overview.

## Units, precision and Earth

SystemScene currently uses km/1000 while Solar's controller and precision helpers
are AU-oriented (`maxDistance=500`, AU near/minimum and flight-speed limits).
The least risky reuse is one boundary conversion: system source km to CPU AU,
serialized camera AU back to km. Subtract the camera origin in JS doubles before
setting GPU object positions. Use a zero-position render camera and the existing
metre-valued pipeline scale `kmPerAU * 1000`.

If km/1000 is retained, every camera/precision threshold must instead become
unit-aware; the physical raster conversion is then 1,000,000 metres per scene
unit. Passing km/1000 into AU helpers or multiplying it by metres-per-AU is wrong.
The pipeline temporarily scales the scene and clip distances while rendering;
its render camera must therefore be camera-relative, not a nonzero absolute
camera whose translation was left unscaled.

Earth surface/cloud orientation must retain the qualified ICRF-to-ITRS result at
the same UTC as positions. Feed actual AU coordinates into the existing Takram
adapter, or add an explicit tested conversion at its boundary. Never use an
identity matrix to make unavailable orientation appear qualified. Takram remains
Earth-specific and requires physical scale, valid frame and altitude, admitted
quality and valid LUTs. Native Earth, native Moon and Apollo17 remain separate
serial destinations; no second Earth renderer is mounted behind a system scene.

## Frame and illumination rules

Compute each body-to-Sun direction from source doubles before rebasing or display
enlargement. Every moon uses its own source position; no parent-only fixed light
direction. A standard-material light must receive the equivalent camera-relative
position. Test invariance under common-origin translation and unit scaling.

RingGeometry's local XY plane has +Z normal. A Three equirectangular sphere has
local +Y north. Therefore the sphere's final surface quaternion must not simply
be copied onto rings. Compose each qualified body-fixed-to-ICRF transform with
the asset's own mesh-to-body-fixed registration; compose the ring transform with
its equatorial-plane registration separately. Update the planet material's
`ringNormal` from that exact rendered ring quaternion. Otherwise the visible
plane and shadow plane diverge. Existing ring radii/profile math is normalized
to the body's mean radius and can be reused at either display scale.

The shared single-output-transform pipeline is required for all qualities.
Direct output rendering of translucent rings/clouds tone-maps each fragment
before blending; importing the shaders alone reintroduces the already corrected
2.2 transparency defect. Keep linear composition and the disclosed RGBA8 fallback.

## Baseline defects and acceptance regressions

| Baseline source behavior | Required correction and proof |
| --- | --- |
| SystemScene loads original Earth/Mars itself; giant parents lack qualified Solar atlases, rings and shared detail management. | Both scenes use the same body layer, source maps/UVs, ring material and lifecycle. Compare actual same-parent closeups. |
| `displayRadius` uses cinematic mode even after selecting a moon. | Selected-body approaches force physical radii; no source-center movement or silent size inflation. Test size mode, transition and restore. |
| SystemWorkspace maps picked parent to null, overloading parent focus with overview. | Preserve a distinct selected-parent identity and explicit overview intent. Both visible parent selection and keyboard controls must focus/orbit it. |
| Fixed 900ms linear camera interpolation has no swept collision test. | Reuse staged Solar travel and collision guard; test all mandatory moon/parent ordered transitions plus real wheel/pinch interruption. |
| Fixed view direction fits all historical path extrema, producing sparse views. | Fit the current source distribution and readable parent/moon composition; orbital paths remain honest sampled paths and never move centers. |
| Playback exposes positive rates only and clamps only at interval end. | Reverse/pause/resume and both interval boundaries; no extrapolation, NaN or negative wall-time advancement. Same UTC drives positions, orientation and lighting. |
| SystemVisitState lacks quality/navigation/close-view intent; camera restoration accepts positions without physical clearance. | Validate and restore explicit camera intent/preferences at the matching epoch; reject invalid/underground bookmarks without destroying the last valid view. |
| SystemScene has only CPU draw timing and a manual context-loss retry. | Shared diagnostics, resource retirement and loss/retry state retention; no late asset completion can recreate a disposed scene. |

Solar-to-system-to-Solar return needs a deliberate policy when time advances:
retain the departure camera orientation and its selected-body-relative offset at
the new source time, or explicitly retain a free absolute camera. Changing only
the saved epoch while reusing old absolute close-up coordinates can lose the
selected planet. Test this with a material time advance, not just an unchanged
epoch round trip. Native Moon return must retain system camera and selected Moon.

## Cold-travel hitch investigation

Existing asset decode timings begin after download. Upload and shader compilation
are deferred into the first draw, so those decode numbers cannot explain the
recorded 319.5ms hitch. Existing scene timings and GPU timers do not independently
identify network/decode/upload/compile cost.

Add bounded timestamped events for request start/end, decode start/end, reservation,
map application, first rendered use, shader-program count changes and resource
retirement. Record the full cold journey RAF sequence, maximum, p95, renderer CPU
and available GPU queries; retain aborted/stale generations in the evidence. A
PerformanceObserver long-task trace can correlate main-thread stalls where
supported. Measure deliberate texture initialization/compile preparation separately
before claiming it improves the journey. Avoid hiding the first draw or only
reporting warmed steady-state frames. Shader compilation and upload are browser/
driver-dependent; do not label their time from an undifferentiated render span.

## Independent implementation review gate

Before accepting the shared boundary, review these implemented behaviors:

1. Shared original model UV/index identity, overview/detail atomic promotion,
   missing imagery, stale completion, quality downgrade and disposal reservations.
2. Explicit target/parent frame and source IDs; unchanged centers under quality,
   cinematic/physical scaling, view changes and camera-origin rebasing.
3. Earth ITRS/Takram regression, ring-plane/surface-shadow agreement and unit
   conversion at a representative moon closeup.
4. Parent selection, physical approach, swept collisions, source-follow, reverse
   coverage boundaries, changed-epoch return and browser Back/Forward restoration.
5. One live renderer through rapid Solar/system/Moon switching and context loss.
6. Actual desktop/portrait/landscape pixels and cold/steady measurements on the
   owner's available NVIDIA GPU, with source/visual/physical-device limits separate.

Relevant existing tests include `systemSceneMath`, `systemMaterials`,
`systemPlayback`, `planetarySystems`, `solarAssets`, `solarTextureStreaming`,
`solarLighting`, `solarCameraController`, `solarTravel22`,
`solarTravelCollision22`, `solarEarthFrame`, `solarTakram` and
`solarTakramDepth`. Reuse meaningful behavioral tests; shader-name/static-import
checks alone cannot qualify actual shared rendering or visual quality.

Status: baseline architecture assessment complete; implementation, runtime,
browser, science-source expansion and owner visual acceptance remain unqualified
by this document. Recommended next task is implementation against these boundaries,
then a fresh independent review of the actual changed source and runtime receipts.

## First implementation review — working tree, 2026-11-02

Reviewed the uncommitted `CelestialBody.ts`, `celestialAssets.ts`,
`systemPresentation.ts`, replacement SystemScene, SolarScene extraction and
solarTextureStreaming changes. Related system orientation/contracts and the
in-progress Workspace integration were inspected where necessary to trace a
caller. The implementation changes during this coordinated review; these findings
are a working-tree review, not an immutable final-commit approval.

The implemented factory boundary is appropriate. Both scenes really use the
same body construction, original model/UV adoption, map transition and ring/limb
implementation. Host-owned asset budget, streamer, renderer, scheduler and camera
are narrower and clearer than a generic manager. Measured shape vertices keep
COM offsets and kilometre dimensions; the collision envelope uses maximum vertex
distance about the COM. Detail textures remain borrowed from their streamer and
the matching source-UV geometry gates promotion. No new science clock is inside
the shared factory.

| Finding | Reproduction / impact | Correction status at this review |
| --- | --- | --- |
| P1: every source refresh rejected | SystemScene `updateSource` required `state[parent.id]`. All three backend snapshot producers emit only Sun and satellite state because the parent is implicitly zero. Every valid adjacent-window refresh therefore threw. | Reported; inspected correction excludes the parent. An actual successful refresh preserving renderer/camera is still required. |
| P2: Titan missing-map fallback invented rocky features | Factory exempted Titan from neutral fallback while `planetMaterial('titan')` fell through to Mercury's procedural palette. Delay/failure therefore displayed a rocky body instead of unavailable visible-haze imagery. | Reported; owner of implementation is adding a homogeneous fallback and distinct haze response. Correction proof pending. |
| P2: parent focus undone by URL effect | Workspace initially focused a picked parent, then its selection effect admitted only IDs in `snapshot.tracks`; the parent is never in those satellite tracks, so the new URL reset focus to overview. | Reported; correction and actual parent/deep-link checks pending. |
| P2: camera-mode UI diverges from controller | SolarCameraController `move` changes mode to Orbit. SystemScene omitted its mode callback, so Focus/Overview/restore could leave the UI showing Free/Follow while the controller was Orbit. | Reported; propagation and behavioral correction checks pending. |
| P2: return loses render/navigation preferences | SystemVisitState persisted size mode and paths only. A native Moon round trip remounted quality/navigation as Balanced/Orbit regardless of the departure choice. | Reported; optional validated saved preferences and final restoration checks pending. |

The initial Saturn implementation independently oriented PCK rings while leaving
the texture sphere at the old static tilt. The first retained SPICE Saturn fixture
at JD2460676.5 has ring pole `[0.0855035068, 0.0732336113, 0.9936427872]`; the
old illustrative sphere north was `[0, -0.4617791755, 0.8869949228]`, an axis
misalignment of 32.055 degrees. Surface shadow normal already followed the actual
ring geometry correctly. The implementation owner chose a bounded correction:
align audited source-visual north with the PCK pole while retaining illustrative
longitude and `qualified=false`. Inspection confirms this pole-only branch now
exists; asset-specific north evidence and actual Saturn pixels remain necessary.
Full body-fixed registration is still reserved for Earth, native Moon and the
exact PDS shape-frame/model pairing.

Independent command:

```text
cd frontend
npm test -- --run tests/celestialBody.test.ts tests/systemPresentation.test.ts tests/solarTextureStreaming.test.ts tests/solarEarthFrame.test.ts tests/solarTakram.test.ts tests/solarLighting.test.ts tests/solarCameraController.test.ts
```

Observed before the subsequent reported corrections: **7 files passed, 39 tests
passed**, duration443ms. These tests cover extraction, borrowed maps, stale model
completion, shape dimensions, ring/shadow transform, texture retirement and
existing camera/Earth frame boundaries. They do not cover the rejected source
refresh or Workspace integration findings above. No browser/GPU or Docker work
was performed by this reviewer. Final source identity, new correction tests,
browser return/context-loss/refresh proof and visual/performance evidence remain
open for a later independent review.

## Correction review — working tree, 2026-11-02

The five findings above are **corrected in inspected code**: parent state is
excluded from refresh membership, Titan has a homogeneous missing-map fallback
and separate haze response, parent IDs pass the route focus guard, controller
mode changes reach Workspace, and optional quality/navigation fields are saved,
validated and restored. Their full application journeys remain **runtime pending**
in this review. Source inspection is not equivalent to an actual refreshed source
window or native-Moon return.

An actual candidate inspection by the implementation owner exposed Saturn's
three-mesh source GLB, which the initial strict-one-mesh admission rejected. The
correction explicitly admits the pinned globe names `Saturn001` and `Saturn.001`
while keeping the two original source ring meshes under the asset owner's
disposal lifetime; only the existing shared radial ring renderer is displayed.
The reviewed test exercises a globe plus two ring meshes and verifies that the
globe's map is adopted. Original UV/index buffers remain unchanged by the factory.
Both sanitized and unsanitized names, and missing/duplicate globe rejection, are
recommended test cases. Final application assertions should reject unexpected
asset fallback rather than counting a neutral sphere as a successful load.

The pole-only transform now aligns source visual north with the checked PCK pole
without claiming a registered meridian. The separate ring quaternion still drives
the shadow normal. The added test compares transformed surface +Y with ring +Z;
the physical Earth/Moon and exact legacy PDS frame paths remain separate.

Solar return rebasing now uses a saved selected-body Solar source anchor. It
translates camera and target by that same Solar body's new source position,
preserving the offset while avoiding a physical-center/barycenter substitution.
The new test verifies offset preservation and source-state immutability. One
additional **P2 was reported**: a selected planet can remain selected in Free
flight, but the current anchor is still saved and rebased, moving what should be
an absolute free camera with the planet. Omit the anchor for Free flight and
defensively preserve absolute coordinates when the saved navigation is Free.
The regression should retain an explicitly selected body while testing this case.

Loading instrumentation now records bounded fetch samples and separate
`initTexture` upload-call spans. A second correctness issue was reported:
`awaitingDraw` was marked at detail upload even while source-UV geometry was
unavailable, so the next frame could be recorded as first use without drawing
that map. First use must be gated on the actual installed map and matching body
geometry, associated with its generation, and histories must remain bounded.
The first-use render span is whole-scene CPU time, not isolated shader compilation
or GPU duration. Cold journey evidence must retain that distinction.

Independent correction command:

```text
cd frontend
npm test -- --run tests/celestialBody.test.ts tests/systemPresentation.test.ts tests/solarTextureStreaming.test.ts tests/solarVisitState.test.ts tests/planetarySystems.test.ts tests/systemOrientation.test.ts tests/systemPlayback.test.ts tests/solarAssets.test.ts tests/solarCameraController.test.ts tests/solarEarthFrame.test.ts tests/solarTakram.test.ts
```

Observed: **11 files passed, 76 tests passed**, duration554ms. This is a fresh
focused run after the original five corrections and Saturn admission change.
The tests exercise meaningful map/geometry races, source dimensions, frame/time
admission, texture retirement, capped source LODs and the existing physical camera
and Earth atmosphere contracts. They do not prove Workspace effect ordering,
adjacent-window runtime refresh, context restoration or visual acceptance.

Review status: **code corrections verified; application/runtime qualification
pending**, with the two additional reported edge cases above still requiring
correction evidence. No application source, tests or browser artifacts were
edited by this reviewer; only this report changed. No commits, pushes, Docker or
browser/GPU actions were performed. Final immutable-source review must bind the
resolved code to the actual source-matching journey and performance receipts.

## Playback and follow-up correction review — working tree, 2026-11-02

The additional Free-return finding is corrected in inspected code. Solar omits
the selected-body anchor when departing in Free mode, and the rebase helper
defensively preserves an older anchored state whose saved navigation is Free.
The regression retains a selected-body anchor and asserts the original absolute
state is returned unchanged. Optional system graphics/navigation restoration now
also has legacy-admission and invalid-value regressions.

The first-use instrumentation now waits for the exact installed detail map and
keeps both upload and first-use histories bounded to 64 entries. Metric labels
correctly distinguish CPU texture initialization/submission and the whole-scene
CPU render span from isolated GPU time. One residual qualification concern was
reported: `mesh.visible` does not prove the renderer submitted a mesh that may
be outside the frustum. A matching `onAfterRender` event, or a weaker label that
only claims a render after map installation, is necessary before calling the
record an actual first draw. Final cold-load evidence must use the corrected
meaning and retain the whole-scene CPU caveat.

A further **P1 source-window renewal defect** was found in Workspace while the
implementation owner investigated a playback journey timeout. Near the forward
boundary, `remaining < 0.3 * span` implies `time > end - 0.3 * span`; the old
request epoch `time + 0.3 * span` is therefore beyond `end`, while its admission
guard required that same epoch to be below `end`. The reverse branch had the
same impossible inequality. Prefetch never ran in either direction, even though
the earlier parent-membership correction allowed valid refreshed snapshots.
The implementation owner independently observed playback stopping at the sample
boundary with no new requests and no browser error.

The inspected correction extracts `systemWindowRefreshEpoch`, which requests
a symmetric window centered on the current admitted epoch, only near a sample
edge with remaining full-source coverage. Workspace still verifies that the
returned window contains the current simulation epoch before adopting it. The
new regression covers forward/reverse thresholds, the middle of a window, and
both global coverage boundaries. The owner reports reproducing red then green;
this reviewer independently ran the corrected tests below. Actual successful
browser renewal with unchanged renderer identity remains pending at this review.

Scheduler inspection found no added independent RAF or intended React remount
on adjacent-window adoption: SystemScene owns the render callback, Workspace
supplies one playback callback, and mounting depends on the system ID. The
successful renewal path currently calls `updateSource` once in the promise and
again in the snapshot effect, recreating path geometry twice. This is avoidable
allocation overhead, not a correctness blocker. The satellite SPK window is
four days wide, so the 30% threshold leaves about 1.2 wall seconds at the fastest
one-day-per-second rate. Qualification must show whether renewal arrives in time;
a slow request must pause safely at admitted coverage, never extrapolate.

Independent follow-up command:

```text
cd frontend
npm test -- --run tests/systemPresentation.test.ts tests/systemPlayback.test.ts tests/solarVisitState.test.ts tests/planetarySystems.test.ts tests/celestialBody.test.ts
```

Observed at 10:04:01: **5 files passed, 34 tests passed**, duration 431ms. This run
includes the corrected refresh helper, Free camera return, saved preferences,
source orientation and Saturn multi-mesh globe admission. It does not prove
React effect ordering or actual GPU participation.

Review status: **source corrections and focused regressions verified; runtime,
native-Moon return, context restoration and final source-matching visual/performance
receipts pending**. The first-draw frustum qualification above remains open in
this review. This reviewer still changed only this report and performed no
application edits, commits, pushes, Docker or browser/GPU actions.

## Render callback and retained journey review — working tree, 2026-11-02

The residual first-draw finding is **closed in inspected source**. Each shared
globe now installs an `onAfterRender` callback that checks its exact pending map;
the per-frame drawn set is cleared before rendering and checked after rendering.
Frustum-culling therefore cannot turn a mere map installation into a draw record.
The history remains bounded to 64 records, and the recorded duration remains
explicitly a whole-scene CPU render span, not isolated shader or GPU timing.

This reviewer read the retained
`output/playwright/solar-system-2.3/journeys-r2/journeys.json` and the relevant
journey script, without opening a browser. The receipt reports **PASS**, nine
checks in each of 1440×900, 390×844 and 844×390, and an empty errors array. All
24 retained scene samples have no body asset errors or detail-streamer errors.
Comparison of the retained samples independently confirms the same renderer
instance ID before and after source-window renewal in all three layouts. The
initial admitted window ends on October 29; refreshed windows end on October 31
and retain simulated epochs on October 30. This closes the source-refresh
runtime blocker for those recorded journeys.

The recorded checks also cover parent focus, Free-to-Focus mode synchronization,
forward/reverse motion, selected-body Solar return offset and asset retirement,
one replacement canvas after context loss, and saved camera/time/quality/navigation
on the native-Moon return path. The earlier native-Moon receipt can return as
soon as the return control appears; the stronger native-runtime-ready and Apollo
terrain journey remains separately pending. The current script contains a ready
wait, but source updated after a receipt is not proof that the old receipt ran it.

Actual images inspected include new `journeys-r2` Saturn at all three layouts,
desktop Io/Europa/Titan/Enceladus, portrait and landscape Europa/Titan, and older
candidate Jupiter overview/close-up, Phobos close-up and portrait native Moon.
The old rejected Saturn captures were not reused as evidence of its correction.
The new Saturn image has a loaded source globe and shared radial rings; all
inspected flagship moon images visibly contain their intended imagery or haze.

Two presentation concerns were reported for the final capture pass:

- **P2 mobile close-up hierarchy:** in the retained portrait Europa/Titan images,
  the selected disk is approximately 64 pixels across, while the collapsed
  details card consumes about 178 vertical pixels and already has a scrollbar.
  In landscape, the approximately 98-pixel disk is accompanied by a card whose
  Focus/Details actions fall below its initial scroll area. Selected Saturn's
  landscape ring span is only about 85 pixels. The latest HUD adjustments need
  a fresh capture proving that body inspection and primary actions receive
  adequate space.
- **P2 misleading scale action:** retained selected-body images say physical
  close-up while offering “Use physical scale,” although selection already forces
  physical dimensions. The action needs to communicate its overview-only effect
  or be suppressed during selection.

Saturn has a conspicuous dark equatorial band and a sharply shadowed ring sector.
The retained source atlas has no such black band, and the code contains dynamic
mutual ring/planet shadows. This is a visual qualification observation, not a
proven UV defect; it should be assessed at more than one light/view angle before
claiming broad Saturn fidelity.

The in-progress performance receipt inspected at this point is **FAIL** after
21 runs (`8 !== 7` assertion), with actual ANGLE/NVIDIA RTX 3060 Laptop GPU
identified in its hardware record. It is not accepted performance evidence;
the implementation owner is running the exclusive benchmark qualification.
No performance pass is inferred from journey frame timings.

Current review disposition: the reported architecture/source correctness fixes
and source-refresh runtime blocker are resolved in the inspected scope. Final
mobile presentation, stronger native runtime/terrain proof, complete performance
qualification and source-matching final captures remain open. No new test run was
needed for this read-only capture inspection; the most recent independent focused
run remains 5 files / 34 tests passed. Only this report changed.

## Cold shader preparation review — working tree, 2026-11-02

Reviewed `solarShaderPreparation.ts`, the shared pipeline preparation method,
both scene callers, their cleanup paths and current readiness assertions against
the installed, pinned Three.js 0.180.0 `WebGLRenderer` / `WebGLProgram` source.
The private `compile` → material `currentProgram` → `isReady` sequence matches
that version's own `compileAsync` implementation. The adapter retains shader
error validation, bounds polling to 30 seconds, and cancels its timer before
material/renderer disposal through the asset owner's abort signal. No second
renderer or render animation loop is introduced.

Preparation binds the composer's linear render target during synchronous program
creation, then restores the previous target in `finally` before asynchronous
polling. That selects the same no-material-tone-mapping, linear-output scene
variant used by the real scene pass. Scene scale, near/far changes and source
texture uniform promotion do not change that program variant. Restoration is
appropriate for these initial calls from the default framebuffer. The method
does not prepare the separate bloom/output/FXAA fullscreen scenes or delayed
Takram shaders; final timing evidence must include their residual first-use cost.
Benchmark/capture readiness now requires both a ready preparation state and at
least one rendered frame, avoiding a black-canvas capture counted as settled.

Two failure/interaction concerns were sent to the implementation owner:

- **P2 synchronous compile escape:** `renderer.compile` initially ran before
  creation of the returned Promise. A synchronous exception therefore escaped
  before the scene's attached `.catch`, and before mount returned its disposal
  handle to Workspace. Workspace then had no handle for its new canvas/resources.
  The bounded correction is to return a rejected Promise for synchronous compile
  failures (for example, by making the helper async), preserving the scene's
  existing error-disposal path. A stub renderer reproduced this exactly:
  `synchronous escape: compile-fixture-failure` and `promise returned: false`.
- **P2 slow-start playback race:** Workspace initially reports ready and enables
  Play before preparation finishes. On a slow compiler, source renewal can then
  replace/dispose orbit-path materials while they remain in the preparation set;
  polling treats the retired program as a fatal renderer error. Startup playback
  should wait for actual shader/frame readiness, or preparation must explicitly
  accommodate intentional replacement. The ordinary measured half-second stall
  is shorter than this window, but it does not qualify the bounded 30-second
  pending path.

Independent command:

```text
cd frontend
npm test -- --run tests/solarShaderPreparation.test.ts tests/solarRenderPipeline.test.ts
```

Observed at 10:18:43: **1 file, 3 tests passed**, duration 142ms. There is no
`solarRenderPipeline.test.ts`; the actual executed file was the new shader helper
test. The tests verify cancellation before later property access, completion of
all pending programs with validation enabled, and honest unsupported-extension
reporting. Pre-aborted, synchronous-failure and timeout paths were recommended
as additional regressions. The runtime cold-stall reduction remains pending.

Read-only inspection also confirms the optional `docker-compose.solar23.yml`
uses a read-only bind with `create_host_path: false`, while `.dockerignore`
explicitly excludes the satellite SPK pack. No Compose command, service change
or runtime activation was performed by this reviewer.

## Shader lifecycle correction and fullscreen extension review

Both preceding shader findings are **corrected in inspected code**. The helper
is now async, so synchronous program-creation failures reject through the scene's
returned readiness Promise. Both scenes expose that Promise; their Workspaces
wait before enabling source playback and dispose their returned scene handle on
failure. The independent shader test rerun at 10:29:14 passed **1 file / 6 tests**
in 165ms, adding pre-aborted lifetime, synchronous failure and bounded-timeout
regressions to the prior three cases.

The retained `output/playwright/solar-system-2.3/lifecycle/lifecycle.json` is
**PASS**, with three checks and no recorded errors. Inspection of its test harness
confirms that it deliberately holds the KHR completion query incomplete while
checking disabled playback and route teardown; separately throws from the native
WebGL `createProgram` once and checks zero canvases after failure / one after
retry; and waits for ready native Moon, ready Apollo 17 terrain, ready Moon and
the restored system. The final journey preserves UTC and camera and leaves no
native iframe. The actual retained portrait Apollo image was inspected and shows
the bounded measured terrain tile. This closes the previously pending stronger
native-runtime/terrain route proof for the captured case.

The pipeline extension now prepares existing bloom high-pass, five blur,
composite, blend and OutputPass materials through a temporary fullscreen triangle.
Its ACES/sRGB OutputPass defines match pinned r180. Temporary geometry is never
drawn and is released in the returned Promise's `finally`; materials remain
owned by their normal passes. Original target restoration remains synchronous.

Review caught one variant mismatch in the first extension: FXAA is the last
enabled composer pass and therefore renders to the default framebuffer, while
the first preparation compiled it against the linear offscreen target. Those
targets generate distinct r180 program parameters/cache keys. The inspected
correction gives FXAA a separate temporary scene compiled with render target
`null`, while the other prepared materials retain the linear target. Both
temporary scenes are cleared and share one disposed temporary geometry. Delayed
Takram remains a separately disclosed preparation/performance boundary.

One additional **P2 Solar readiness race** was reported: if context loss disposes
Solar during held preparation, its readiness Promise resolves as aborted, but
the caller originally continued to set “Solar System ready” and load motion
because only the URL fetch abort/version was checked. Unlike the system caller,
it did not require the same live scene after the await. Capture the scene handle
and verify it is still the active, undisposed engine before marking ready. A
controlled Solar context-loss-during-preparation check is recommended to prove
the correction. The initial system lifecycle receipt above does not cover this
separate caller race.

Review remains source/read-only except for this report. No GPU work or test
harness execution was performed by this reviewer; browser results above were
independently inspected from retained receipts and harness source.

## Final framing and Solar readiness correction review

Solar now captures `preparedScene` before awaiting readiness and requires that
same non-null handle to remain the active engine afterward, in addition to its
abort/version guards. This closes the reported stale-ready continuation in
source. `lifecycle-r2/lifecycle.json` records **PASS, four checks, errors []**;
the additional check deliberately loses Solar's context during held compilation
and verifies that readiness/playback cannot revive, followed by a single-renderer
retry. The earlier native Moon/Apollo and system shader failure/cancellation
checks remain in that passing receipt.

Inspection of all 18 initial `after` overview images found a real framing defect
in Saturn and landscape Mars. Saturn's rings were absent from the cinematic
screen budget and the camera fitted only body centers. Including the rings in
the enlargement budget alone could not solve physical clipping: retained
landscape diagnostics put Saturn at y=283.18 with a physical ring radius about
61.4 pixels and the footer at y=324, leaving only about 34.8 pixels after the gap.
Physical dimensions must not be shrunk to cover that mismatch.

The corrected screen budget includes each object's full envelope when competing
with edges, HUD and neighboring bodies, then returns a globe radius for display
scaling. Saturn uses a conservative factor of 2.5. The overview camera now fits
physical envelopes as well as centers, with a near-side depth allowance; source
positions remain unchanged. Close Saturn also adds envelope depth to the ellipse
fit so perspective cannot enlarge its near ring edge into the footer. Labels
reserve the ring envelope. Regression cases cover the ring screen budget and
physical-envelope containment in shallow landscape framing.

Independent command:

```text
cd frontend
npm test -- --run tests/systemSceneMath.test.ts tests/systemPresentation.test.ts tests/solarShaderPreparation.test.ts
```

Observed at 10:42:27: **3 files / 21 tests passed**, duration 254ms.

The refreshed `after-r2/candidate.json` records **PASS, 51 captures, errors []**
and ANGLE/NVIDIA RTX 3060 Laptop GPU. Every retained case has a rendered frame,
ready shader preparation, and zero body/detail asset errors. Direct image review
confirms that desktop and landscape Saturn overview rings are fully on-screen
and clear of the footer, landscape Mars clears the footer, and selected desktop
Saturn's ring ellipse now fits comfortably. Portrait Uranus's Overview label is
fully visible. All six final desktop overviews were reviewed. The earlier mobile
Enceladus captures demonstrate the larger resolved disk, compact card with visible
actions, and a disabled, accurately labeled physical-close-up control; those
original mobile findings are resolved. Extra final mobile selected-Saturn/Titan
captures remain planned by the implementation owner.

No new source blocker was found in this final pass. The top disposition governs
current status; earlier open statements are retained as the correction history.

## Final mobile, completed-journey assembly and hash verification

The four actual captures in `after-mobile-saturn` were inspected: selected Saturn
and Titan at 390×844 and 844×390. Saturn's full ring silhouette fits clear of the
controls; Titan has a resolved haze disk and compact visible actions. No new
blocking visual finding was identified. Their original PNG hashes equal both
the copies merged into `after-r2` and the static gallery copies. These are
desktop-emulated mobile dimensions, not physical-phone qualification.

`journeys-qualified/journeys.json` reports **PASS**, 27 checks, no errors. The
aggregation was independently checked by comparing each complete run object:

- 1440×900 exactly matches the completed nine-check `PASS` case inside
  `journeys-final/journeys.json`; that interrupted combined document remains
  `RUNNING` and is not promoted wholesale.
- 390×844 exactly matches the nine-check `PASS` case in
  `journeys-portrait-final/journeys.json`.
- 844×390 exactly matches the nine-check `PASS` case in
  `journeys-landscape-final/journeys.json`.

Read-only Python `hashlib.file_digest(..., 'sha256')` checks against
`evidence/source-binding.json` produced:

```text
runtime checked 33 missing [] mismatched []
dist checked 312 missing [] mismatched []
preview checked 312 missing [] mismatched []
Docker exact normalized paths 312 checked 312 mismatches [] missing []
Docker image manifest in build log True
SPK manifest matching True
gallery local refs 185 missing []
```

The Docker comparison reads `docker-dist-final.tar` without extraction or a
Docker invocation and normalizes only its leading `./` member prefix. All 312
recorded paths match exactly; the image manifest recorded in the binding appears
in the retained `docker-build-final.log`. The bounded SPK release manifest hashes
to the recorded value. The 33 runtime input hashes match the current source tree.
This proves the recorded artifact equality at review time; it does not itself
prove that the working tree has already been committed. The binding's forward
reference to a final PR commit must be satisfied by the owner's actual final
commit/PR step before reporting immutable-source completion.

The static gallery's 185 local references resolve on disk and its introduction
accurately distinguishes actual application pixels, desktop mobile emulation,
illustrative longitude, measured shape coverage and owner visual acceptance.
At this point the exclusive benchmark and final commit binding remained pending;
the subsequent benchmark inspection below supersedes that status. No browser,
GPU, test suite or build was run during this filesystem-only pass.

## Final exclusive benchmark inspection

Independently read `performance-final/performance.json` and
`scripts/validation/benchmark_solar23.mjs`. The aggregate is `MEASURED`; all
**28 individual cases are PASS with empty error arrays**. A read-only Python
inspection recomputed the retained assertions for every case: 200 measured RAF
intervals, at least 200 rendered frames, unchanged instance/epoch/source positions,
requested steady quality, one tone-mapping stage, bounded texture reservations,
stable owned resource counts, bounded uploaded geometry counts and zero shader
failures. All 28 cases passed those independent receipt checks and report the
NVIDIA RTX 3060 renderer.

Computed from the retained values:

| Measurement | Observed bound |
| --- | --- |
| Startup through readiness | 519.120–1006.533ms |
| Maximum startup RAF interval | 166.6ms |
| Maximum steady per-case GPU p95 | 1.573888ms |
| Maximum steady per-case RAF p95 | 7.1ms |
| Longest recorded native texture upload call | 47.6ms, `texSubImage2D` |
| Delayed Earth first-use validation calls | 81.1ms and 39.4ms, `getProgramInfoLog` |

The harness performs 70 real keyboard-orbit warm-up frames and 200 measured orbit
frames, with the page visible and no simultaneous video/screenshots/tracing.
It disables HTTP cache, but retains possible browser/driver shader cache reuse.
All startup measurements occur at initial Balanced quality; Efficient/Detailed
are selected only after startup has been recorded. The diagnostics named
`measurement.initial` are collected after that switch and must not be read as
the cold-start quality. The startup values are therefore not independent cold
measurements of all three quality modes.

Native WebGL-call durations are CPU submission/blocking measurements, not
asynchronous GPU compiler completion. Texture reservations exclude compositor
targets and driver VRAM; actual uploaded counts can increase when previously
offscreen owned objects enter view. The harness checks ownership/budget stability
and the explicit geometry bound instead of falsely requiring all GPU uploads to
have occurred before rotation. Delayed Takram preparation remains visible in
the Earth startup stall. These results support bounded steady operation on the
recorded hardware; they do not claim zero startup hitch, broad device coverage,
or a cache-controlled before/after improvement ratio.

Final review disposition remains **no unresolved P1/P2 finding in the inspected
implementation and evidence**. Final commit/PR binding and owner visual approval
remain outside this read-only reviewer's actions. No new GPU run, build or test
suite was executed for this receipt inspection.
