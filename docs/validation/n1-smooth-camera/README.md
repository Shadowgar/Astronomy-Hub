# PR #75 — continuous Earth camera motion

**Native horizon follow-up:** a separate owner exception authorizes the minimal
native styling hook/rebuild. [Current horizon evidence](../n1-native-horizon/README.md)
records that correction; accepted scrolling remains unchanged.

**Owner update, 2026-10-15:** scrolling at `301f9eb3` is ACCEPTED ("I approve
the scrolling now"). The historical qualification record below is preserved.
The dark horizon is approved for implementation but blocked by the native-artifact
boundary; visual verification remains pending and the full N1 package is not
finalized. See [current investigation](../n1-horizon-investigation/README.md).

N1 remains **unaccepted, pending owner visual and interactive testing**.
Branch: `n1-sky-earth-navigation-1`. Existing PR #75 remains based on unmerged
#74, itself based on unmerged #73. No merge, production deployment or N2.

Owner preview: <http://127.0.0.1:4202/sky-engine> — refresh the page.
Served identity: <http://127.0.0.1:4202/evidence/motion-preview.json>.
[Exact qualified source hashes](source-identity.json) and
[served asset hashes](served-assets.json) bind the measured working tree to its
Earth artifact. The final serving record also verifies the committed source.

## Root cause and implemented correction

At rejected head `f36e0ae1c71e7be57f8fab1ce30cc789c31aa8b5`, each wheel callback
computed a multiplier and immediately called `camera.setView()`. There was no
intermediate motion after the event. Changing gain only changed jump size.
The bridge also interrupted the camera on every wheel event, which would cancel
an animation immediately after the controller started it.

Wheel input now changes a bounded log-distance target. One critically damped
spring approaches that target using the exact elapsed-time solution, with a
24/second response parameter (40/second under reduced motion). Further input
extends the same motion; opposite input discards pending motion and reverses on
the next update. Travel pending at any instant is capped at 1.4 log units, and
individual pixel/line/page input remains bounded. Tiny deltas remain proportional.
The existing continuous altitude gain is retained; no notch-count target is an
acceptance criterion.

The camera moves along the ray through its captured geographic center, preserving
world direction/up. Bounds are found along that ray, rather than independently
clamping cartographic height and sliding the target. Missing globe intersection
leaves the camera unchanged. Terrain/altitude bounds retain their existing
minimum/maximum settings. Default qualification uses ellipsoid terrain.

Cesium's existing `scene.preUpdate` drives motion; active movement requests a
render. There is no additional animation loop, timer queue or per-event flight.
The one subscription is removed at rest, on clamping, interruption and teardown;
the final imperceptible residual is left in place without a final snap. Cesium
continues owning native drag, tilt and pinch. Its public `enableInputs` setting
is temporarily disabled during custom wheel motion and restored before a native
pointer gesture, preventing competing camera/inertia updates. Native settings,
zoom event registrations and double-click ownership are cleaned up on destruction.

Pointer drag/rotation, camera keys, home/reset, location, entity focus/tracking,
view restoration, handoff snapshot and destruction cancel pending motion. Cached
page departure cancels the gesture while preserving the cached Viewer. The bridge
no longer cancels wheel animation. The existing embedded-presentation command
enables handoff intent; standalone Earth cannot latch behind an unhandled Sky
request. A review found and reproduced that standalone regression; its fix was
retested before final qualification.

Only fresh wheel input at the actual boundary earns continued-input credit.
Animation arrival can show guidance but cannot advance the guard. Existing
1.5 km entry / 2.5 km release hysteresis, timing/travel/count/momentum safeguards
and source timestamps remain in force. A requested handoff freezes outgoing
motion. Observer elevation stays distinct from camera altitude.

## Exact runtime changes and context

Production source:

- `runtimes/earth-runtime/core/CameraController.mjs`
- `runtimes/earth-runtime/core/RuntimeBridge.mjs`
- `runtimes/earth-runtime/entry.mjs`

Generated admission metadata:

- `integrations/renderers.lock.json`
- `frontend/public/runtime-versions.json`

Tests, measurement/serving drivers and governance/evidence files are separately
listed in [files-changed.txt](files-changed.txt). Default Mode was used, with
AGENTS, CORE/LIVE and manifest-listed debug/frontend/docs/validation/review packs;
[loaded-document ledger](loaded-documents.txt). No broad documentation scan.
The owner directive supersedes historical gain-only/notch calibration text,
which remains explicitly historical. No runtime override mode was activated.

## Measured before and after

The actual Docker-served Hub and Cesium Viewer were tested with real Chromium
mouse-wheel/CDP input, allowing native browser coalescing. Engine/camera results
were not mocked. [Before raw proof](before/proof.json),
[final raw proof](final/proof.json), [comparison](comparison.json) include camera
coordinates, geographic targets, delivered input, timestamps, range velocity and
height differences over time.

| Input scenario | Before camera changes | Final camera changes |
| --- | ---: | ---: |
| One −120 px wheel event | 1 | 5 |
| Twelve rapid −120 px inputs at 45 ms | 4 | 9 |
| Fifty varied trackpad-sized inputs at 20 ms | 16 | 17 |
| Inward input then reversal | 2 | 7 |

The single-event callback leaves the initial 40,000 m camera unchanged; subsequent
frames approach approximately 26,190 m monotonically and settle. This endpoint
matches the retained gain curve. The repair changes actual temporal motion.
Rapid/trackpad delivery differs slightly between runs because the browser
coalesces while busy; raw packet totals are retained. Event/change counts alone
are not acceptance: the proofs also assert intermediate motion, monotonicity,
rest, reversal and interruption.

One final single-event sample (elapsed from delivered wheel input):

| Elapsed | Camera height | Reported target-range velocity |
| --- | ---: | ---: |
| Event callback | 40,000.000 m | no camera write |
| 3.7 ms | 39,995.199 m | −9,524.9 m/s |
| 207.9 ms | 26,659.339 m | −9,455.4 m/s |
| 395.8 ms | 26,198.944 m | −193.2 m/s |
| 591.6 ms | 26,190.168 m | −2.7 m/s |
| 764.4 ms | 26,190.049 m | inactive |

These are sampled rendered-loop positions, not a fixed-rate simulation or a claim
that unobserved intermediate display frames existed.

Single-event rAF frame intervals were **166.7 ms median / 216.6 ms p95** before
and **183.4 ms median / 216.6 ms p95** in the final run. These are instrumented
software-rendered display-frame intervals, not a hardware performance budget or
an isolated controller CPU profile. No physical smoothness or performance gain
is claimed. The controller adds one bounded update while active; deterministic
tests verify no custom callback/render requests remain after rest or cancellation.

[Actual final regional view](final/regional.png),
[oblique view](edges/oblique.png), [near-minimum view](edges/near-minimum.png).
Raw recordings remain locally served under `/evidence/smooth-camera/`; each
proof records its video filename. Videos are retained locally rather than added
as large Git objects. Screenshots alone do not prove motion.

[Real edge proof](edges/proof.json) passes oblique center stability and the
100 m / 30,000,000 m bounds. Geographic target stays within 1e-6 degrees;
HPR-derived world orientation stays within an explicit ten-microradian bound.
The geometric unit fixture checks exact retained Cartesian direction/up.
Bounds setup uses the application's real history/view-restore contract at 120 m
and 29,500,000 m; subsequent measured wheel input goes through Chromium.
This is test setup, not fabricated engine output or astronomy data.

## Verification results

- Runtime/protocol/Earth: **132 passed, 0 failed** ([output](runtime-final.txt)).
- Frontend: **239 passed in 32 files** ([output](frontend-final.txt)).
- Typecheck: exit 0 ([output](typecheck-final.txt)).
- Pinned, network-disabled Docker Earth build: exit 0
  ([output](earth-build-reviewed.txt)); existing large-chunk warning remains.
- Hub build: exit 0 ([output](hub-build-final.txt)).
- Artifact verification: PASS ([output](artifact-verify-final.txt)).
- Final Docker/browser journeys: **22 desktop + 22 mobile/touch groups passed**,
  zero JavaScript page errors, maximum connected renderer count **1**
  ([proof](journeys/proof.json), [output](journeys-run.txt)).

The final journeys exercise native Sky wheel/FOV, Landscape and Sky-only Night
Mode, desktop/touch Earth drag, location, surface arrival without transition,
deliberate continuation, three further round trips with reversal, observer/time,
Back/Forward, loading cancellation, pending-snapshot Back, Escape, reduced motion,
mobile targets, Night OFF persistence, live time and fresh-session ORAS home.
Departed renderers report disposal and only one iframe is connected at a time.
[Desktop surface guidance](journeys/new-york-boundary-1440.png),
[mobile native Sky](journeys/new-york-sky-390.png),
[mobile Explore](journeys/mobile-explore-390.png).

Additional real Earth picking/Focus/Deselect checks pass on desktop and touch,
with no page errors or residual wheel motion ([proof](selection/proof.json),
[output](selection-run.txt), [touch screenshot](selection/selection-390.png)).

The deterministic tests run the production controller against a geometric fixture
with simulated elapsed times: 30/60/144 Hz and uneven intervals; intermediate
positions, accumulation, deceleration/rest, reversal, small/coalesced input,
conflicting input/actions, bounds/oblique ray, missing intersection, teardown,
arrival/continuation/cancellation, bridge ownership and standalone recovery.
Red/green evidence includes [original red](red.txt),
[boundary/bfcache red](boundary-bfcache-red.txt),
[standalone red](standalone-red.txt), and the final full suite above.

[Exact validation commands](commands.txt) and
[review, failed attempts and environment limitations](review-and-attempts.md)
retain the full qualification history. Earlier candidates and interrupted runs
are not substituted for final source qualification. Full backend/provider and
astronomy deep-link suites were not rerun for this bounded Earth camera repair.

## Preservation, rollback and remaining limits

[Preservation proof](preservation-after.json) verifies unchanged owner settings,
Sky artifact, immutable upstream source/pin, read-only mounts and all 512 files
of the prior Earth artifact. Sky remains
`3b80bb352c8d1680d9217ce9b8e7fc5dbb8ed0b71b59c2f0f66d1143d103b50f`.
Final Earth artifact is
`2f2c8530cd8499ef3c646b244d37c9a5ae8574047cabcdc751976e4908234794`.
No provider, package/dependency, source pin, astronomy dataset, native SWE binary,
landscape asset, owner preference, volume or data-mount change. Provider spending
remains **$0**. Existing free-feed failures retain their unavailable status.

Previous matching Earth and Hub bytes remain at
`output/n1/earth-before-smooth-camera` and `output/n1/hub-before-smooth-camera`.
The PR #74 fallback remains <http://127.0.0.1:4201/sky-engine>.
Rollback requires the matching source, built artifacts and admission metadata;
restore the prior complete set, not isolated bundle files. Existing older rollback
artifacts and historical evidence remain intact. No rollback was performed.

Chromium 145 uses ANGLE/SwiftShader software rendering. Mobile/touch and reduced
motion are emulated; physical mouse, trackpad, mobile and the owner's exact browser
remain unqualified. Long software-renderer frames remain visible. Default terrain
is ellipsoid-only; no new terrain, imagery coverage, data freshness or scientific
claim is made. Native live satellite tracking is not newly provider-qualified.

Recommended next task: owner visual and interactive testing of the refreshed
preview. Keep PR #75 open and unmerged; do not deploy, start N2 or expand scope.
