# Earth and Sky cinematic completion

Work in progress; not qualified or visually accepted. Baseline PR88 `89491f72`.

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

Baseline investigation active. No completion or performance improvement claimed.

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
S1 and combined integration/gallery/R4 readiness are still outstanding.
