# Earth and Sky cinematic completion

Implemented and technically qualified for draft review; **owner Earth/Sky visual acceptance pending**. Baseline PR88 `89491f72`.

Owner feedback: Solar looks better and camera/navigation is smooth on the owner's
computer. Owner-confirmed satisfactory responsiveness and positive visual feedback
are not final release approval or measured hardware benchmarking.

[Exact selected context paths/hashes](context.json) records 66 unique documents
from frontend/backend/validation/review/docs packs. The manifest itself was inspected.
Explicit task additions: approved original PNGs, Adaptive Explorer reference files,
PR86/87 implementation and PR88 evidence. No full documentation scan.

## Execution plan

1. E1: record actual PR88 baseline at global/continental/regional/city/address/ORAS
   views; inspect imagery requests, source resolution, compositing, settled state and
   input costs. Retain failed evidence and PEMA publication restrictions.
2. Correct demonstrated Earth problems in owned runtime/Hub UI. Preserve provider
   selection/cache/rights and camera contracts. Compact direct search, meaningful
   selected-location focus/context, clear map tools, source/quality disclosure.
3. Qualify focused red/green tests, real three-size browser journeys, Docker
   source/API, reproducible builds and source/served identity. Open E1 draft.
4. S1: audit native stellar depth/Milky Way/DSO/constellation/display capabilities
   and controlled real epochs. Implement supported native presentation and compact
   context through contained adapters, preserving settings and accepted mechanics.
   Capture baseline/new desktop/mobile/short states. Qualify and open stacked draft.
5. I1: qualify Sky→Earth→Solar→Earth→Sky, history, camera/time/observer restoration,
   selection, failure/recovery, touch/keyboard and serial renderer cleanup. Produce
   reference/baseline/new gallery, discrepancies, rights and performance ledger.
6. Independent exact-head review; fix genuine findings and qualify affected source.
   Record preservation; assess R4 Earth/Moon/Mars without implementation. Stop for
   owner visual acceptance. All PRs remain draft; no merge or deployment.

## Status

E1 delivered as draft [PR89](https://github.com/Shadowgar/Astronomy-Hub/pull/89),
`94f98598131f23d9179135ec492fb1ad5d739407`. S1 and combined I1 are delivered on
`cinematic-sky-completion-1`, stacked on E1. I1 needs no extra implementation branch: the
S1 head contains both packages and the combined qualification. No merge/deployment.
No quantified hardware performance improvement or visual acceptance claimed.

## E1 implementation and focused qualification

The native Cesium search marker, refocus/full-globe actions, compact direct search,
location details and short-screen composition are implemented. Imagery readiness
now includes outstanding source requests. This corrects a reproduced premature
ready status; it does not increase the underlying imagery resolution.

Fresh browser journeys: 1440×900,390×900,667×390, six groups each passed, including
real camera destinations, preserved UTC, native marker, focus/globe, sources,
keyboard orbit, 44px targets and pointer occlusion. Live Photon returned Paris and
Eiffel Tower street-address results; invalid coordinates were rejected. An injected
native refocus failure produces a visible error with results closed. Review found
and corrected that error visibility and the portrait Zoom In overlap. Earlier
failed/interrupted runs remain in evidence; they are not passes.

[Browser proof](evidence/earth-browser.json), [live search and controlled error](evidence/earth-search.json),
[build identities](evidence/builds.json), [source hashes](evidence/source-hashes.json).
Native Earth/runtime tests242passed; frontend336passed; subsequent focused frontend6passed;
TypeScript passed. Architecture/document validation passed. All are technical
qualification, not owner visual acceptance. The repeat Earth build matches all
emitted files; repeat Hub build matches its entire payload.

Actual screenshots: [orbital Earth](evidence/screenshots/1440x900-global.png),
[selected location](evidence/screenshots/1440x900-selected.png),
[expanded](evidence/screenshots/1440x900-expanded.png),
[portrait](evidence/screenshots/390x900-selected.png),
[short landscape](evidence/screenshots/667x390-selected.png).

Source diagnosis: early coarse tiles refine after loading; settled Paris city
imagery is recognizable. NASA Blue Marble500m and EOX2016 Sentinel-2 cloudless10m
remain static sources. Street-scale limitations cannot be repaired by sharpening
or fabricated detail. NAIP remains footprint-qualified. PEMA is local-only with
unverified public rights; no PEMA screenshot is published. No source/provider,
cache policy, terrain, building or weather capability was added. The reference's
clouds/night illumination are not supported by the active Earth imagery stack.
The background remains Cesium's bundled illustrative star texture, not a catalog.

Performance intervals and heap measurements in browser proof are **SwiftShader**,
not physical GPU benchmarks. Earth owner hardware responsiveness remains unqualified.
Windows PowerShell fetched the isolated preview with HTTP200. The prior owner
preview and all production services remain untouched.

E1 preview: `http://172.26.23.204:4219/earth` (Windows),
`http://127.0.0.1:4219/earth` (development environment).

## S1 supported native presentation and context

Fresh native defaults use exposure2.5 and star point scale1, with bounded accessible
native sliders, original-default reset and isolated persisted display preference.
Existing custom native choices and standalone display values are preserved. Native
Milky Way/DSS are exposed; lines/labels/art are independently controlled. No new
sky projection, star catalog, invented visibility or renderer math.

Actual native Moon selection revealed a missing Hub identity/context record. The
adapter now resolves that native SSO through the existing JPL API, validates canonical
identity, rejects stale responses and labels context epoch. Exact paused UTC is
used; live sampled context omits fallback coordinates. Stellarium still owns the
selected object, coordinates, focus and scene. API failure leaves native selection
usable without fabricated context. Focused tests reproduce missing/stale identity
and prove selection/time/disposal races are guarded.

Final browser proof: [12 groups across three sizes](evidence/sky-final.json),
[Moon/Jupiter/M42 and native close focus](evidence/sky-scenes.json),
[10 combined desktop/mobile groups](evidence/integration.json),
[4 observing/wheel/WebGL recovery groups](evidence/recovery.json).
Actual camera destinations, time, observer, history, native keyboard/mouse/emulated
touch and one active renderer are asserted. Reduced motion is enabled in these
journeys. WebGL loss/retry is exercised in the preserved Solar renderer; no claim
of new native SWE automatic context recovery. Native display preference and focus
restoration are tested through reload. Unit cancellation tests cover stale context
responses; Earth refocus failure uses a labeled controlled response.

Final runtime/native suite250 passed. Frontend336/51, TypeScript, Docker science23
and Earth search/observability28 passed. Source-preserved E1 evidence is explicitly
retained rather than relabeled a fresh run. Full prior N1 suites were not rerun.
See [exact commands and retained failures](COMMANDS.md).

## Unified review surface

Windows: `http://172.26.23.204:4220/earth`,
`http://172.26.23.204:4220/sky-engine?date=2026-08-13T04:00:00Z`,
`http://172.26.23.204:4220/solar-system`.
Development loopback: same routes at `http://127.0.0.1:4220`.
[Comparison gallery](http://172.26.23.204:4220/evidence/earth-sky-completion/gallery/index.html)
contains42 original-byte images: exact concepts, fresh PR88/candidate captures at
1440×900,390×900,667×390, retained E1 selected/expanded views, final S1 native scenes
and preserved Solar. [Image manifest](evidence/gallery-manifest.json),
[matched diagnostics](evidence/comparison.json), [specific gap matrix](FIDELITY.md).
The private development address depends on the current WSL host; no production
service/public deployment is implied. Windows HTTP200 is verified separately.

## Delivery, rights and preservation

[Source/performance ledger](SOURCES_AND_PERFORMANCE.md),
[exact repeated/served identities](evidence/delivery.json),
[protected paths](evidence/preservation.json), [changed files](FILES_CHANGED.txt).
Original archive/PNGs, Solar assets/source, scientific backend, ephemerides/catalogs,
native camera/scroll/satellite/panorama inputs and source pins are preserved.
No paid provider, new account, dependency, data bulk or destructive operation.
Owner root settings remain untouched. Database/volume bytes are not claimed
freshly snapshotted. Software measurements remain separate from hardware acceptance.

Independent E1 exact-head review found no remaining actionable issue after its
red/green corrections. Independent S1 source review likewise found no additional
issue after independent constellation, standalone preference and exact-epoch
corrections. Final exact-head result is recorded in the draft PR and handoff,
without altering a reviewed commit merely to embed its own SHA.

[R4 readiness assessment](R4_READINESS.md) recommends Earth first, with explicit
surface-frame/altitude/source contracts and existing native Cesium reuse. Moon and
Mars lack qualified surface orientation/terrain stacks. **R4 is not started.**
Stop for owner visual acceptance of Earth and Sky; all PRs remain draft.
