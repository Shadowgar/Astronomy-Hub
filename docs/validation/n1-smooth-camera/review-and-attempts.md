# Review and retained attempts

The first motion regression fails five behavioral assertions against f36e0ae1;
its first failure reproduces the event-time 40000 -> 26190 m teleport.
Initial green development found a tiny final spring snap and a spherical-fixture
prototype mismatch. The snap was removed: stopping leaves an imperceptible
residual rather than snapping to the exact scalar target. Bounds tests disable
handoff intent using Ctrl-wheel so deliberate Sky requests cannot stop a bounds
fixture before it reaches the floor. This is distinct from normal boundary tests.
Old event-focus/lifecycle fixtures lacked the newly exercised interruption and
motion diagnostic dependencies; the focus regression now uses the shared actual
controller harness. Initial broad failures were harness TypeErrors (cancelFlight,
reset and motionState), not runtime browser failures; final suite passes.

The first baseline browser attempt timed out racing auto-hide and Explore click.
The measurement driver now activates the actual accessible button with Enter.
The failed proof/log/video is retained in before-explore-timeout.

One read-only reviewer reproduced a P2 standalone wheel latch after gate=request.
standalone-red.txt reproduces it. Camera handoff defaults OFF; the existing
embedded setPresentation contract enables it. Sustained standalone input and
both ordinary and Ctrl-wheel reversal now pass; the reviewer found no remaining
issue in that correction. No reviewer file edits, builds, browsers or providers.
The earlier candidate journey was deliberately interrupted for this correction;
its proof/log/video and passed intermediate steps remain under
journeys-pre-review-partial. It is not final qualification.

The first oblique browser driver dragged toward the nadir limit, causing no tilt.
The corrected real gesture drags away from nadir and waits between native moves.
The next assertion incorrectly demanded constant local pitch on a curved globe;
local pitch legitimately changes along an oblique straight geographic ray. Its
raw proof preserves stable geographic target coordinates. A subsequent derived
world-orientation assertion of 1 microradian was too tight for native HPR-derived
measurements (about 2.4 microradians observed). The final assertion uses an
explicit ten-microradian budget, as an explicit angular bound, alongside unchanged
1e-6-degree geographic target checks. No production motion adjustment was made
for these driver corrections. All failed edge attempts remain available.

An initial preservation comparison incorrectly compared Docker mount-list order.
Comparing complete mount records sorted by destination passes; all records remain
identical and read-only. Settings, Sky identity, upstream pin and 512 prior Earth
files independently verify. No mount/volume repair or mutation was performed.

The execution environment changed during the final motion capture. Its process
session ended before proof.json could be finalized; the partial log, screenshot
and video remain in final-environment-interrupted. It is not a passing run.
The completed edge proof predates that interruption and retains the reviewed
artifact digest. Final motion and journeys are rerun after the environment change.

A repeated Node suite inside the newly restricted sandbox could not spawn the
Python artifact-fixture subprocess (spawnSync python3 EPERM). The file-level
runner reported 29/30; direct execution retained the actual EPERM cause. This is
not a product pass. The same full suite is rerun with authorized process access.

The first final journey used short approach bursts without draining the browser
input queue and active spring before deciding on another burst. Its raw trace
shows surface boundary at 32107.8 ms, then fresh input/progress at 34075 ms and
request at 34524.6 ms. It legitimately entered Sky, while the driver expected an
Earth hint. The driver now observes delivered delta totals and waits for actual
animation rest before sending more approach input. Arrival itself still earns
no intent; explicit continuation is tested separately. Production code is unchanged.
The failed run remains in journeys-undrained-input-attempt.

The extra desktop/touch selection smoke passed desktop, then raced the mobile
reveal button disappearing between visibility detection and click. The driver
uses actual Tab input to reveal/focus the controls before selecting actions.
The failed proof is retained in selection-reveal-attempt. No product change.

A subsequent selection-smoke attempt incorrectly sought the mobile launcher
after selection had already opened its context sheet. The driver now follows
the actual automatic-sheet flow and clicks its visible Focus action directly.
That failed proof remains in selection-sheet-attempt. No product change.
