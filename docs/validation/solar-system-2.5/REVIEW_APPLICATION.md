# Independent mission application review

**Final scoped result: independent application review passes. All seven confirmed
P2 findings below are corrected; independent source review plus the combined real
Windows Edge/NVIDIA receipts qualify the checked implementation and journeys.**
Historical failing results and their correction evidence are retained below. The
aggregate `journeys-qualified` receipt remains FAIL; its three passing flagship
rows are combined with the separate final Voyager 1 PASS, as documented in the
closure. This is not whole-PR approval, owner visual acceptance or physical
iPhone qualification. Reviewer did not author the mission implementation.

Repository/branch: `recovery/reconcile-20261026`, based on
`ea4d384af3aead949de7bec1947e8aff41465bca`, existing draft PR107.
Loaded context: root/frontend operating instructions, current CORE/LIVE and
`solar_reconstruction` pack, owner Solar 2.5 directive, and the specific Solar 2.4
review/source/browser evidence already recorded in `REVIEW_SOLAR24.md`. No broad
document scan. This pass inspects `missionContracts.ts`, `MissionScene.ts`, their
shared camera/resource/shader/pipeline dependencies, and the supplied model
manifest. The early review sections retain their original pending limits; final
runtime disposition is recorded in the closure below.

## P2 APP-01 — delayed model completion prepares a disposed pipeline

Initial location: `frontend/src/features/missions/MissionScene.ts:76`,
`loaded.then(() => pipeline.prepare(assets.signal))`.

When a user leaves while the spacecraft GLB is loading or decoding, `dispose()`
aborts the resource lifetime and disposes the pipeline. The loader's catch resolves
its promise; the next `then` still calls pipeline preparation. The disposed pipeline
has nulled its output/composer passes, and preparation dereferences `output.material`.
This causes a rejected readiness promise during route teardown; depending on the
caller, it becomes an unhandled error or a stale failure state.

Focused reproduction uses the actual shared pipeline with a minimal renderer
interface, disposes it, then executes the same delayed preparation call:

```sh
frontend/node_modules/.bin/tsx output/playwright/solar-system-2.5/review-missions/reproduce-disposed-preparation.mts
```

Output: `DEFECT_REPRODUCED TypeError: Cannot read properties of null (reading 'material')`.
This is a local lifecycle proof, not a browser/runtime pass.

Correction: check the scene lifetime before calling `pipeline.prepare`, return an
aborted readiness result, and regression-test departure during delayed GLB loading
and shader preparation. The author has acknowledged the finding and is correcting
it; independent green verification remains pending.

## P2 APP-02 — scientific identity substitution is admitted

Initial location: `frontend/src/features/missions/missionContracts.ts:22`, `:28`.

The validator only requires spacecraft and target NAIF identifiers to be strings.
It does not bind them to mission/target IDs, and accepts any `appearance_id`.
Consequently a response requested and labeled as New Horizons can carry spacecraft
`naif_id: '-31'`, while the target labeled Pluto carries `naif_id: '599'` and
`appearance_id: 'jupiter'`. Validation succeeds and the scene consumes the mismatched
identity/appearance. Declared interpolation residuals are also accepted without
finite/nonnegative validation.

Focused malformed-response reproduction:

```sh
frontend/node_modules/.bin/tsx output/playwright/solar-system-2.5/review-missions/reproduce-admission.mts
```

Output: `DEFECT_REPRODUCED incompatible identity admitted`, followed by the exact
incompatible NAIF/appearance tuple. This does not assert that the current acquired
source pack contains these wrong identities; it proves that the source admission
boundary cannot reject them, unlike the existing precise Solar destination contract.

Correction: bind spacecraft IDs to qualified NAIF identities; bind target identity
and appearance to the qualified mission source/catalog contract; reject nonfinite
or negative interpolation qualification metadata. Add focused wrong-NAIF,
wrong-target/appearance and malformed-qualification regressions alongside the
existing epoch/frame tests.

## Other source inspection results and pending checks

The renderer preserves the complete GLTF scene hierarchy and applies one uniform
root scale plus a separate display-center translation. It does not replace the
spacecraft with a sphere, flatten the first primitive, or derive orientation from
velocity. Camera-relative CPU subtraction precedes GPU upload, and the shared
pipeline converts raster units to metres. Path replacement explicitly retires GPU
geometry/materials and removes them from final-disposal ownership.

Two presentation requirements remain for the integrated browser pass: a readable
symbolic spacecraft position marker when its physical model is too small, and
occlusion of DOM labels behind intervening bodies. The author is adding these;
this preliminary pass does not classify unfinished UI as final delivered defects.

Historical source compatibility, real Windows/NVIDIA model rendering, numerical
camera behavior, source refresh/playback/reversal, return-state preservation,
context loss/recovery, rapid route teardown and repeated mission switching remain
unverified for the new scene. Existing Solar 2.4 browser qualification does not
substitute for these checks. No implementation code, containers, commits or PR
state were changed by this reviewer.

## First correction re-review and live API binding

The author corrected APP-01 by checking `disposed || assets.signal.aborted` before
calling pipeline preparation; a null/aborted result cannot arm rendering. Source
inspection confirms that the previously reproduced delayed-call path is closed.
Real rapid-route teardown/context-loss qualification is still pending the mission
browser pass.

APP-02 now binds craft identity to the explicit mission NAIF mapping and the
selected catalog entry, and binds body NAIF/appearance to that catalog's target
contract. Finite nonnegative interpolation residuals and unavailable historical
attitude are checked. The reviewer fetched the actual private-preview Voyager 1
catalog/state response for `1979-03-05T12:05:26Z`: valid admission passes and five
independent wrong-craft, wrong-target, wrong-appearance, negative-position-error
and null-velocity-error mutations reject.

```sh
npm test --prefix frontend -- --run tests/missionContracts.test.ts tests/solarShaderPreparation.test.ts
frontend/node_modules/.bin/tsx output/playwright/solar-system-2.5/review-missions/verify-contract-correction.mts
```

Results: **18 tests passed in 2 files, 220 ms**; live API admission/mutation probe
**PASS**. The local API inputs are retained as `live-catalog.json` and
`live-state.json` beside the probe. These checks do not replace complete browser
qualification.

## P2 APP-03 — source timestamp precision is lost during client interpolation

Location at discovery: `frontend/src/features/missions/missionContracts.ts`,
`interpolate()` expression using `Date.parse(a.epoch)` and `Date.parse(b.epoch)`
to compute `u`.

The source/API preserves microsecond UTC labels and TDB knots, but JavaScript
`Date.parse` truncates the fractional source labels to integer milliseconds.
The resulting Hermite fraction differs from the server's source evaluation.
Using the actual unmodified Voyager 1 response above, evaluating the client at
its exact returned epoch differs from `craft.position` by **0.03425763689436057 km**
(34.3 m). The source fitting tolerance is 50 m, so this avoidable client error is
material to the numerical qualification. It is not physical orbit uncertainty.

The live correction probe prints `positionDifferenceKm` and reproduces the
quantity. Correction: preserve fractional source time precision or consistently
map the requested time to the supplied TDB anchor, then add a server/client
round-trip comparison using actual microsecond source knots. Validate the
combined client result independently rather than assuming source-only residuals
qualify the rendering path. Author notified; correction/re-review pending.

## APP-03 independent correction verification

The correction uses the API's TDB anchor plus elapsed UTC seconds and exact
TDB knot intervals. It preserves the two-part time difference instead of adding
a small step to a large Julian date; source UTC microseconds are retained for
knot selection. The backend clips windows at leap transitions.

The independent reviewer added only `frontend/tests/missionPrecision.test.ts`,
using the actual preview Voyager 1 response's two bracketing craft/Jupiter knots
and independently evaluated server positions. The fixture records the immutable
preview manifest and runtime SHA256 values. Exact-anchor agreement is under one
millimetre, including return to the anchor after forward/reverse playback. The
two inward millisecond endpoints and +/-1 second positions agree within two
metres, allowing the independent float64 Julian-date rounding (about 40 us per
ULP). Both out-of-coverage millisecond probes reject. This is numerical agreement,
not physical navigation accuracy. The prior 34.2576 m reproduction is retained.

```sh
npm test --prefix frontend -- --run tests/missionPrecision.test.ts tests/missionContracts.test.ts
```

Result: **17 tests passed in 2 files, 172 ms**. APP-03 is closed for this actual
source/client regression. Full integrated browser lifecycle qualification remains
a separate requirement. No production implementation was changed by this reviewer.

## P2 APP-04 — mixed-quality trajectories labelled reconstructed

Final static-pass location: `MissionScene.ts:44` and
`MissionWorkspace.tsx:76`. The path-color conditional maps both `reconstructed`
and `mixed` to blue, while the visible trajectory legend says blue means
reconstructed. The actual final Voyager 1 trajectory includes `cruise-3` with
quality `mixed` beside distinct mission-design/reconstructed/predicted intervals.
The full-path display therefore overstates that segment's source qualification.

Reproduction: open Voyager 1, choose Trajectory, compare the blue `cruise-3`
path classification against `/api/v1/solar/missions/voyager1/trajectory` and the
visible legend. Static evidence is the actual final API payload retained as
`output/playwright/solar-system-2.5/review-missions/final-source-defaults.json`.
Correction: use an explicit mapping for all four qualified source classes and
a matching legend; retain separate temporal dimming. Author notified.

## APP-04 correction and final static pass

The author replaced the fallback color conditional with the explicit shared
`missionQualityStyles` mapping. Both scene paths and the visible legend consume
that mapping; mixed sources have a distinct lavender color and `Mixed source`
label. Temporal dimming remains separate. The independent source re-review
confirms that the actual `cruise-3` mixed classification can no longer be labelled
reconstructed. Focused contract/precision/review suites: **24 passed in 3 files,
340 ms**. Browser proof of the rebuilt legend is still required.

The final static pass inspected the mission renderer/workspace, shared camera and
compositor, `SolarWorkspace.saveSolarDeparture`, the lazy mission route and Vite
asset copying. Metre-valued shadow-camera dimensions are consistent with the
shared render-time AU-to-metres scale; model hierarchy and one uniform physical
scale remain intact. Symbolic markers and labels use common body occlusion.
Path replacement disposes and retires geometry/material ownership; delayed GLB
completion checks disposal before preparing the compositor. The asset build adds
only the named bounded mission pack, rejects symlinks and retains the 64 MiB
per-pack limit. Scientific trajectory files remain mounted outside the image.

Departure-state extraction preserves the existing Solar system entry contract;
mission entry captures the same camera/anchor/preferences/time context. The
mission's displayed UTC is retained on mode departure, and native parent-system
entry remains restricted to that system release's supported dates. Historical
source gaps and missing model/attitude coverage remain explicit.

Two final fault/state scenarios were handed to the separate GPU reviewer rather
than treated as already reproduced: context loss before initial scene readiness,
and restoring a full-trajectory camera after return when only the local source
path has been loaded. Final application disposition must incorporate those
results and the separate real Windows/NVIDIA journey review. This reviewer has
not declared the whole application or PR independently approved.

## P2 APP-05 — pending readiness re-enables a lost renderer

Locations at discovery: `MissionWorkspace.tsx:44` and `:46`. Context loss
disposes the scene, clears the engine and disables readiness, but the pending
`scene.ready` callback tests only the route cleanup flag. Disposal resolves the
guarded readiness promise, and that callback sets readiness true again although
the renderer no longer exists. Play and Inspect controls become enabled on an
error view and cannot perform their stated actions.

The separate non-author GPU reviewer reproduced this on real Windows Edge by
holding the actual GLB response, invoking `WEBGL_lose_context`, then allowing
completion. The receipt shows zero canvases, a disposed scene, and enabled Play
and Inspect controls: `output/playwright/solar-system-2.5/lifecycle-edges-before/lifecycle-edges.json`
and `pending-model-context-loss.png`. This is distinct from the earlier disposed
pipeline call fixed in APP-01: that guard prevents the exception, while the
workspace must also reject stale readiness.

Correction: mark the failed scene lifetime and admit readiness only for the
currently active nonfailed scene. Retest the same held-model/context-loss sequence
and retry recovery. Author notified; final rebuilt-browser recheck pending.

## Initial default-epoch normalization and trajectory restoration follow-up

The first Trajectory request can be cancelled by the route persistence effect:
`entry.default_epoch` retains six fractional UTC digits, whereas `parseSceneDate`
on the persisted query returns three digits. The represented instant is equal,
but the `epoch` dependency changes and the effect aborts the just-created
trajectory request. Normalize both entry paths to the same canonical UTC. The
separate reviewer encountered the cancelled first request while isolating full
trajectory restoration; a direct-entry first-Trajectory regression is required
after rebuilding.

## P2 APP-06 — trajectory return restores the camera but loses its source range

Locations at discovery: `MissionWorkspace.tsx:46`, `:62`, `:68`, and
`MissionScene.ts:18`, `:83`. Route state persists only the mission camera, with
`view: trajectory`; it omits whether the path is full-mission or a selected
interval. A fresh scene loads `snapshot.tracks`, the local sample window, then
restores the previously distant trajectory camera. The user sees the former full
path framing with most of that path missing.

The separate non-author real Windows Edge/NVIDIA reviewer reproduced:
Voyager 1 full trajectory **11 segments / 2,841 points** → Solar → browser Back
restores the same trajectory camera but only **1 segment / 128 points**. Both
this and APP-05 are retained as failed checks in
`output/playwright/solar-system-2.5/lifecycle-edges-before3/lifecycle-edges.json`,
with screenshots in that directory.

Correction: persist the full/range path intent, validate it, and lazily restore
its qualified source segments alongside the saved camera. Preserve custom range
endpoints and source-gap separation. The author is correcting the state contract;
independent static and rebuilt-browser rechecks remain required.

## Final static correction disposition

APP-05 now admits readiness only while `engine.current === scene`. Graphics
failure clears that identity and aborts restoration, prefetch and trajectory
requests; late promise completion cannot re-enable controls. APP-06 stores full
or selected-range path intent with the camera/preferences, loads and validates
that bounded trajectory before restoring its camera, and waits for both source
restoration and renderer readiness. Route cleanup aborts its request; stale
completion checks the scene identity. An unavailable saved range returns to the
current encounter with an explicit notice. All mode departures persist the same
mission state, including Sky/Earth, before disposing their renderer.

Default catalog epochs and query epochs now use the same `parseSceneDate`
canonical form, closing the equal-instant string change that could cancel an
initial trajectory request. Full/range restoration remains lazy and does not
load other mission models or full paths at startup.

**Static correction review: pass; no additional confirmed P1/P2 remains in the
inspected implementation.** Source/input SHA256 values are recorded in
`evidence/final-application-static-review.json`. This is conditional on the
separate rebuilt real-GPU recheck for APP-05/06, direct-entry Trajectory and the
new source-quality legend. Existing failed receipts are preserved. The final
application qualification must combine this non-author static review with that
separate non-author browser evidence, and still does not establish owner visual
acceptance or whole-PR approval.

## Independent rebuilt-browser lifecycle closure

The separate GPU reviewer's `lifecycle-edges-fixed/lifecycle-edges.json` receipt
passes all four focused checks with no page errors: pending-real-GLB context loss
keeps disposed-renderer controls disabled, first direct-entry Trajectory succeeds,
full trajectory return retains its source segments and camera, and selected-range
return repeats the same source request and points. **APP-05 and APP-06 are closed
by independent source and actual Windows Edge/NVIDIA rechecks.**

The separate `journeys-qualified/journeys.json` receipt passes complete Voyager 2,
Cassini and New Horizons journeys and three secondary missions. Its aggregate
status remains FAIL because the newly added Voyager 1 fast-playback check found
the stop-notice defect below. It must not be presented as a fully green receipt.

## P2 APP-07 — playback boundary explanation disappears during persistence

Location at discovery: `MissionWorkspace.tsx:32` and `:56`. At 16 days/second,
playback correctly pauses at the admitted source-window boundary and sets the
explanation notice. `persist()` updates the route epoch; its source effect then
unconditionally clears the notice before returning through the same-window
reuse path. Users see playback stop without its coverage explanation. The GPU
reviewer reproduced the missing `.mission-notice`; no extrapolation was observed.

The narrow correction retains notice state through same-window persistence,
clearing it on a new source, explicit seek or new Play action. Independent static
re-review confirms that the boundary-stop branch now survives its own route
update, while changed contexts clear stale feedback. Scientific source evaluation,
scene rendering and source-window bounds are unchanged. The separate final
Voyager 1 GPU rerun is still required to close this finding at runtime.

The same reviewed workspace revision visibly discloses Arrokoth's reference
sphere, its source maximum-semiaxis basis, and unavailable resolved shape/imagery.
It also retains explicit NASA VTAD model credit. These disclosures agree with the
qualified source/asset records and make no new geometric or photometric claim.

Only `MissionWorkspace.tsx` differs from the previous static input binding; its
new SHA256 is `0c05513281e7639dd0538d365868d6602ea5ab5f9605c7ce9dc1da814d835607`.
The binding and remaining browser gate are updated in
`evidence/final-application-static-review.json`. `git diff --check` passes. No
implementation edits, new broad suites or GPU run were performed by this
static reviewer for the narrow feedback correction.

## Final combined independent application closure

The separate GPU reviewer’s consolidated [browser qualification](BROWSER-JOURNEYS.md)
and [machine-readable combined receipt](evidence/browser-journeys.json) record the
exact tested artifacts, four passing journeys and four lifecycle checks.

The final `journeys-voyager1-fixed/journeys.json` receipt is **PASS**, with no page
errors and no working-tree changes during that run. At 16 days/second Voyager 1
stops within its admitted window at `1979-03-06T12:05:26Z`, retains the visible
coverage explanation, and successfully reverses to
`1979-03-04T23:24:32.240Z`. Its complete journey also passes source-time advance,
trajectory range selection, unavailable-date recovery, repeated renderer
retirement and Solar observer/time/camera restoration. **APP-07 is closed.**

Combine this receipt with the passing Voyager 2, Cassini and New Horizons rows
in `journeys-qualified/journeys.json` and the four checks in
`lifecycle-edges-fixed/lifecycle-edges.json`. The older aggregate failed result
is preserved and is not relabelled green. These receipts were produced by the
separate non-author GPU reviewer; the source reviewer has inspected their
reported outcomes and bindings.

The final text-only workspace delta adds a Pluto/Charon disclosure that black
map regions are unobserved coverage and surface longitude is illustrative. It
matches the retained source limitations in Solar 2.4 `ASSETS.md`, including
the unchanged black southern source gaps. It does not change rendering, lighting,
source imagery or scientific positions. Updated final source hashes appear in
`evidence/final-application-static-review.json`; owner visual acceptance remains
pending.

Final non-code checks: all **147 original containers and 90 original volumes**
remain; the existing preview is still bound to `127.0.0.1:4231`. Ten additive
task helper containers introduce no host ports, named volumes or writable bind
mounts. Four prior mounted scientific manifest hashes, fourteen Solar 2.4 visual
asset hashes, and six tracked visual manifests match their baseline evidence.
The supplied inventory has no volume-content fingerprints, so this review does
not claim to prove volume-content equivalence. See `evidence/preservation-final.json`.

Final release completeness: actual service output passes the production schemas
for **100 mission states, ten trajectory envelopes, 90 source segments and 32
events**. Streamed inspection of the final handoff Docker artifact matches the
three qualified GLBs and model manifest byte-for-byte. Four flagship entries
have their qualified design models; six secondary entries remain explicitly
trajectory-only. See `evidence/mission-build-completeness.json`. No production
resources, git commits, merges or deployment were performed by this reviewer.
