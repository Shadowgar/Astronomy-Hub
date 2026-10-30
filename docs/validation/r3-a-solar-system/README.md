# R3-A Solar System qualification

## Stage 1 — documentation reconciliation

PASS: current R0–R5 authority reconciled for owner directive2026-10-21 before runtime
implementation. [Supersession/context/plan ledger](RECONCILIATION.md),
[verified PR states](pr-state-before.json), [loaded paths](loaded-documents.txt).
PR80 has no review threads or submitted code reviews at initial verification.

Commands/results:

- `python3 scripts/validation/validate_architecture_docs.py`: PASS317 manifest entries,
  eight packs,58 documents,1612 relative references (16 registered private historical
  artifacts), balanced fences and nine existing ADRs. No missing private artifact
  becomes fresh proof.
- `python3 scripts/validation/validate_reconciliation_docs.py`: PASS67 capability
  records,51 source references,448 links/65 fragments. Its C6 “D-only” output describes
  the preserved historical proposal checks; current R3-A activation is in current
  authority and does not activate C6 implementation.
- Changed-document link/fragment validation: PASS658 links,78 fragments across31
  Markdown files before manifest routing; `git diff --check`: PASS.
- Root checkout unchanged except pre-existing `.vscode/settings.json`;
  pre-task snapshot112 containers/90 volumes; no runtime mutation in Stage1.

Initial checks caught manifest load order and mixed historical line endings during
editing; corrected before the passing checks. Historical validation/audits and all
runtime/data/artifact bytes remain unchanged in Stage1. Existing status hierarchy
and sole canonical roadmap retained. Browser/runtime tests not applicable to this
stage; no R3 implementation or owner visual acceptance claimed by this result.

## Stage 2 — bounded vertical slice

Implemented isolated Solar System mode with Sun/Earth/Mars-system source-backed
vectors, controlled UTC epoch/day steps, calculated prior paths, body details,
real focus/orbit/zoom/pointer/touch and keyboard/reduced-motion alternatives.
Explore entry captures acknowledged native camera/return context; return preserves
incoming observer/selection and last qualified astronomical epoch. Solar selection
has separate URL/history identity. Unsupported Planet View remains usable and
honest; no R4 renderer or speculative X effects. [Renderer/science/R4 ADR](../../architecture/decisions/0010-r3-a-solar-runtime.md).

Scope qualification:

- Frontend `npm --prefix frontend test`:302PASS/43files; typecheckPASS.
- Focused new science/API:7PASS. Docker existing+new ephemeris:15PASS/2SKIP,
  two dependency deprecations. Skips are existing tests that detect local release
  by checkout-relative path; new four reference-vector cases execute against the
  actual mounted kernel through the configured path.
- Existing qualified runtime/Earth command:231PASS/0FAIL. No accepted controller,
  native scene policy, landscape, satellite, search provider/cache code changed.
- Desktop1440×900 and emulated mobile390×900:14 browser groups each, actual source
  vectors and camera transforms, native Earth coordinate destination and Sky return,
  observer/time/Pennsylvania panorama, Back/Forward/reload and one active renderer.
  Separate shared-link/native Mars identity and rejected-epoch return:3 groups PASS.
  Final exact source/served receipt follows commit; software proof is not physical
  device or owner visual acceptance.
- Two UTC reference epochs2000-01-01T12:00:00Z and2026-02-28T00:00:00Z × Earth399/
  Mars-system4, compared with independently retrieved NASA/JPL Horizons raw vectors.
  ICRF/Sun10/geometric/AU/UTC input explicit,50km inter-kernel tolerance; actual
  maximum measured axis residual0.07723km (77.23m), residuals retained. No inferred coordinates from visual plausibility.
- Two clean host builds and pinned offline Docker Node24 build: identical133-file
  Hub artifact recorded in [build identity](evidence/build-identity.json).
  Lazy Solar bundle525kB causes the visible500kB build advisory; not suppressed.
  Initial native-config invocation lacked its legacy `__dirname`; task-only wrapper
  supplies it. Initial reused output directories retained old chunks; clean builds
  use `--emptyOutDir` and contain no stale artifacts. No app change for these harness issues.

## Reproduced corrections and retained unsuccessful evidence

Actual browser startup rejected valid source trajectory microseconds. Focused
RED1FAIL/8PASS → GREEN9PASS accepts source timestamp precision without changing
vectors. First journey then used a nonexistent Sky diagnostic name; corrected to
existing `orasSkyAdapter`, a test-harness failure, not an application assertion.
Shared Solar links lost observer/selection on return: browser RED → GREEN retains
query context. A rejected out-of-coverage epoch incorrectly became return time:
browser RED → GREEN retains the last qualified epoch. None touched accepted engines.

Broad backend sweep is **INCOMPLETE**, not green: initial missing worktree `.venv`
caused18 installer-harness failures (287PASS before stopping). Reusing the existing
virtualenv cleared those failures in the single bounded rerun. That rerun reached
327/621 cases (326PASS/1FAIL), then180s cap while entering
`test_phase2_scene_scope_switch.py::test_location_and_time_context_change_scene_payload`;
underlying stall mechanism UNKNOWN,294 cases not completed. No retry cycle.
`test_phase2_provider_cache_ttl.py::test_provider_fetchers_use_provider_specific_ttls`
fails with `KeyError: jpl` under local-kernel configuration and independently reproduces
unchanged on baseline PR80; isolated file1FAIL/3PASS on both. This historical mock
expects the remote JPL cache key. No unrelated provider/test behavior was changed.
Focused mandatory R3 and critical N1/R2 checks above remain separate from this sweep.
Historical N1 full-navigation5/22 and7/22 at240s remains unchanged/causeUNKNOWN.

## Preservation and acceptance boundary

Read-only kernel/data/source mounts; pinned DE442s/Three/Cesium/SWE/God's Eye and
original Earth/Sky artifacts retained. Root owner settings and original112 container
states/mounts/90volumes are checked by the delivery verifier. Original PR80 worktree,
scientific ingestion source and all tracked rollback bytes must remain unchanged.
No production/deployment/merge/provider account/spending/dependency changes.

R3-A is a reviewable first slice, not full R3, Planet View, physical performance or
owner visual acceptance. Sun/glyph sizes/colors/ambient light are illustrative;
positions/distances are source-backed. Mars uses system barycenter. Rotation,
body-fixed longitude/ellipsoid/surface imagery/terrain are unavailable and must be
separately qualified for R4. Body count is deliberately3; orbit paths are open
samples, not closed osculating ellipses. X1–X4 remain deferred.

Proposed R3-B after owner review: extend qualified bodies and time/navigation scope
with bounded source/scale/performance/history proof; select R4 body/source separately.
Do not merge any PR or deploy. Stop for owner review of this slice.

## Reviewable artifacts and commands

[Exact changed-file list](FILES_CHANGED.txt), [commands](COMMANDS.md),
[browser proof](evidence/browser-proof.json), [identity/time return](evidence/identity-proof.json),
[reference residuals](evidence/reference-residuals.json),
[reproducible build hashes](evidence/build-identity.json),
[desktop overview](evidence/1440-overview.png), [desktop Mars focus](evidence/1440-mars-focused.png),
[mobile overview](evidence/390-overview.png), [mobile Mars focus](evidence/390-mars-focused.png).
Commit/served identity is verified after commit with `verify_r3_delivery.py` and
published as `/evidence/r3-a/delivery.json`; it is not a replacement browser run.

## Independent review corrections

Review of `9666a34683d2d2f5257cb93c51a6048a37649819` identified a P2 stale body
focus while a genuine epoch response was pending. Delayed-response browser RED
showed Earth URL/details with actual Mars camera target. The completion now reads
the latest identity; callback reads current navigation context. Identical browser
GREEN targets Earth. A second review hypothesis reproduced as P2: a delayed genuine
native navigation ACK overrode same-frame Back with a stale Solar entry. Entry is
now bound to current route/client identity, invalidated on history/client changes
and unmount. Same native ACK browser GREEN remains at the restored Earth location.
No accepted native camera/controller or scientific-source changes.

The preservation verifier initially compared Docker mount-array order. Read-only
inspection established112 unchanged container states and identical complete mount
records after sorting by destination. The verifier retains every field and compares
order-independent mount identity; no workload was restarted or modified.

Some exact raw console logs contain trailing whitespace/blank final lines; JSON
wrappers retain original UTF-8 lines and SHA256 so repository whitespace checks pass
without altering the original console bytes. Latest exact-head review and served
receipt are reported in PR81's conversation; an earlier review is not a later-head pass.
