# PR #75 — real-world scrolling repair

N1 was rejected by the owner at `8fe05ca1a8505dc20449635fa47b615e4bd23a0c`.
The previous 40 passing checks did not qualify ordinary wheel behavior. This
repair remains **pending owner testing and acceptance**. No merge, deployment or
N2 is authorized. Branch: `n1-sky-earth-navigation-1`; dependency chain:
PR #75 → unmerged PR #74 → unmerged PR #73.

Application commit: `746e5f8a8131a4bb4ebdadaa89784dfeb59923f5`. Subsequent
handoff commits contain evidence and authority reconciliation only. Preview:
<http://127.0.0.1:4202/sky-engine>. Preserved PR #74 preview:
<http://127.0.0.1:4201/sky-engine>.

Context: Default Mode, `frontend_change` and `validation` packs; CORE/LIVE and the
exact [loaded-document ledger](loaded-documents.txt), plus the explicitly supplied
AGENTS instructions. No broad documentation scan or extra task pack was used.
[Exact repair files](files-changed.txt) and [executed commands](commands.txt) are
retained for review.

## Observable corrections

At the qualified native outward FOV clamp, sustained extra outward input now
enters Earth without a required pause. Slow notches retain progress. Standard
pixel/line/page deltas determine intent independently of legacy `wheelDelta`
quantization; the original native Stellarium zoom factor and cursor math remain.
Guidance says to keep scrolling, or use Explore.

Arrival and short overshoot alone cannot transition. The guard requires 350 ms
past arrival before counting travel, at least 480 normalized pixels (capped at
120 per delivered event), four delivered events, 650 ms at the boundary and 350 ms
of credited continuation. Sustained decreasing input rate rejects the tested
coalesced momentum tail. Source input timestamps govern these checks. Progress
expires after 2.5 seconds of abandoned input; slow ordinary notches do not reset
it every 280 ms. Reversal, pan/reset and boundary departure discard intent. Sky
retains its five-degree release band; Earth retains 1.5 km entry / 2.5 km release
range thresholds and the existing mount/reset cooldown.

Earth wheel gain now tapers continuously with actual camera height. An ordinary
orbital notch advances about two-thirds of the remaining height; near the
surface a small delta gives much finer control. Large/coalesced events are
bounded. The existing view ray, orientation and altitude clamps remain in charge;
there is no new fly-to animation or geographic recentering during wheel zoom.
Camera height remains separate from observer elevation.

Neutral landscape enforcement is scoped to embedded exploration. Standalone
`/oras-sky-engine/` retains native landscape selection and Landscape OFF/ON.
The verified browser image shows the bundled Guéreins panorama standalone;
Central Park uses the neutral horizon and identified unavailable-elevation 0 m
fallback. No new landscape discovery or geographic panorama claim is made.

The touch repair also distinguishes Hub control focus from native canvas focus.
A delayed canvas blur cannot clear focus owned by Explore or resurrect a latent
hide. Reveal cancels pending auto-hide and briefly protects against delayed
renderer interaction reports.

## Before / after measurements

[Before regular input](before-regular/measurements.json),
[after regular input](after-regular/measurements.json),
[before device cadence](before-device-cadence/measurements.json), and
[after device cadence](after-device-cadence/measurements.json) retain exact samples,
served payload hashes and elapsed wall time.

| Actual Earth approach | Before | Corrected |
| --- | ---: | ---: |
| Starting height | 15,621,863 m | 15,621,863 m |
| Input | −120 px ordinary notches | −120 px ordinary notches |
| Requested interval after each wheel acknowledgement | 250 ms | 250 ms |
| Notches to ≤1,500 m | 47 | 13 |
| Observed wall time | 46,085 ms | 12,586 ms |
| Final height | see sample ledger | 1,210.10 m |

The camera/input modules measured at `956b1fec0c74e58e76fe4664bc9509efe3b23f4c`
are byte-identical in the final application commit; the later change is Hub focus
ownership. This is about 72% fewer notches and 73% less wall time in this Chromium software
renderer. Both include actual rendering/acknowledgement delays; 250 ms is not a
claim of the total wall time per notch. Latitude variation among corrected zoom
samples is below 0.000001 degrees; actual coordinates remain in the ledgers.

The device-cadence experiment queues real Chromium wheel input at its source
cadence, allowing natural browser coalescing while the renderer is busy. No
synthetic DOM wheel events, fabricated engine responses, or special boundary
pause are used.

| Outward input from Sky | Before observation | Corrected observation |
| --- | --- | --- |
| +120 px / 100 ms continuous | Stayed Sky after 24 events, 2,734 ms | Earth after 22 sent events, 5,771 ms |
| +120 px / 600 ms slow notches | Stayed Sky after 14 events, 8,118 ms | Earth after 9 sent events, 9,013 ms |
| +12 px / 20 ms trackpad sized | Stayed Sky after 280 events, 5,898 ms | Earth after 111 sent events, 6,613 ms |

These wall times include queued-event processing and renderer handoff. A separate
regular Playwright wheel run also enters Earth for all three corrected input
patterns. The old regular continuous run sometimes transitioned because waiting
for rendering acknowledgements inserted the pause required by the old guard;
that accidental success is preserved, not presented as a reproduction failure.

## Browser qualification

The [focused safeguard proof](safeguards/proof.json) passes five real application
checks: short overshoot, a decaying coalesced trackpad tail, reverse cancellation,
varied small-delta continuation and standalone native Landscape OFF/ON. Raw
received wheel deltas and timestamps are retained. Inspect
[standalone Landscape ON](safeguards/standalone-landscape-on.png).

[Final journey proof](journeys/proof.json) passes 22 desktop (1440 × 900) and
22 mobile/touch (390 × 844, reduced motion) groups at the application commit above.
There are no JavaScript page errors; the maximum connected renderer iframe count
is one, and departed runtimes report disposal. The journeys include ORAS round
trip, Central Park selection and return, continuous/slow/small-delta input,
three further cycles, reversal, cancellation, Back/Forward, pending-snapshot Back,
fixed observer/time, native Landscape, persistent Sky-only Night Mode OFF/ON,
live time, native touch drag, keyboard/touch Explore and 44 px mobile controls.
[Exact timing and resource summary](browser-summary.json) and
[the run output](journeys-run.txt) accompany the full raw ledger.

Normal completed handoff overlays lasted approximately 0.7–3.2 seconds. The
serial fade and visible Opening/Cancel state expose the projection change;
this is not a seamless single-camera flight. Full input/rendering interactions
are longer on this software renderer. Seven notches from the selected 40 km
Central Park view to the entry band took 8.2–9.0 seconds on mobile and 18.3–21.0
seconds on desktop in the repeated tour. Those delays remain visible limits,
not a physical-device speed claim. The isolated orbital comparison above remains
13 notches / 12.6 seconds versus 47 / 46.1 before.

Inspect [desktop Central Park Sky](journeys/new-york-sky-1440.png),
[mobile Central Park Sky](journeys/new-york-sky-390.png),
[mobile Explore](journeys/mobile-explore-390.png) and
[near-surface guidance](journeys/new-york-boundary-1440.png).
The host restart interrupted an earlier run; [its partial output](interrupted-run.txt)
is not a pass. Subsequent failed mobile runs remain in `failed-attempts/`.

The owner’s exact ChatGPT browser cannot be automated here. Chromium 145 uses
ANGLE/SwiftShader software rendering. Mobile/touch and reduced motion are
emulated; no physical mouse, trackpad or phone qualification is claimed.
Input classification is a bounded heuristic, not a browser-provided hardware
momentum flag. Owner testing remains required across their actual devices.

## Served commit and cache verification

[Served asset proof](served-assets.json) compares actual HTTP JavaScript bytes
against the rebuilt Hub, every qualified Sky JavaScript/module file and the Earth
entry bundle. Runtime build/admission metadata also matches. Responses use
`Cache-Control: no-store`; the old pause guidance is absent from the Hub bundle.
The final live identity record is
<http://127.0.0.1:4202/evidence/scroll-preview.json>. Open or refresh the corrected
preview to load these assets; an already-open old tab retains its loaded program.
[The verifier](verify-served.py) is retained with the exact command ledger.

## Regression and build proof

- [Runtime/Earth](scroll-runtime-resumed.txt): 118 passed, 0 failed.
- [Frontend](scroll-frontend-focus-final.txt): 239 passed in 32 files.
- [Typecheck](scroll-typecheck-focus-final.txt): exit 0.
- [Hub build](scroll-hub-build-focus-final.txt): exit 0.
- [Sky build](scroll-sky-build-3.txt) and [Earth build](scroll-earth-build-3.txt):
  pinned Docker images, network disabled, existing dependencies reused; exit 0.
- Red/green records include natural continuation, legacy wheel quantization,
  coalesced momentum, altitude traversal, standalone landscape and touch reveal.
  Initial test-harness errors were corrected before capturing qualified red runs;
  `zoom-red-qualified.txt` and `landscape-red-qualified.txt` fail behavior assertions
  against the rejected source, not missing VM globals.
- Earlier failed browser attempts are preserved under `failed-attempts/`.
  The resumed mobile run also exposed focus masking a latent hidden state; the
  focus-ownership regression failed before the final Hub correction.
  The first inertia driver lacked reliable received-input instrumentation; the
  final driver hovers the actual canvas and asserts real wheel delivery. The
  coalesced packet failure led to the rate/duration safeguard and a replay test.

## Preservation, scope and rollback

[Preservation](scroll-preservation.json) and [read-only mounts](scroll-preview-mounts.json)
record unchanged native WASM/vendor identities, source pins, owner settings and
ORAS home configuration. No astronomy catalog, scientific calculation, renderer
binary, package/dependency, provider, subscription, Docker volume or data mount
change is made. Native Night Mode remains persistent and Sky-only. Existing Earth
imagery, satellites, aircraft, weather and Solar System implementation are outside
this repair. Provider spending remains $0.

Review reconciliation: the standalone landscape finding was valid and corrected.
The Earth-authorization finding referenced the historical R1-B restriction; the
owner explicitly authorized N1 and this repair. The stale AGENTS header is now
marked historical and the existing authorization is recorded, with no added scope.

Known inherited runtime limits include missing tiles in the mounted partial
`visual-default` dense-star profile, native wide-FOV HiPS warnings and free-provider
timeouts, network changes and cancelled requests during navigation. They are recorded in browser
ledgers and are not repaired by replacing data or changing providers. No new
astronomy/data completeness claim is made. Full backend and astronomy deep-link
suites were not rerun for this bounded input/UI change.

Rollback is the preserved PR #74 preview at port 4201, or restoration of the
rejected PR #75 source/artifact set at `8fe05ca1a8505dc20449635fa47b615e4bd23a0c`
with its known scroll defects. Source rollback must restore matching Sky/Earth
artifacts, lock and admission metadata together; do not mix artifacts. Original
and failed evidence remains available. No rollback, merge or deployment has been
performed. The recommended next task is owner testing of the corrected experience.

Captured terminal copies normalize trailing whitespace; raw originals remain under
`output/n1/`. JSON/input samples and screenshots are preserved unchanged.
