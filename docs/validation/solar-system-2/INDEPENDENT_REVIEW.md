# Solar System 2.0 — independent integration review

**Scoped verdict: PASS — no remaining actionable P1/P2 findings in the examined changes.** This is a non-author review of Solar integration, the shared planetary-system lighting correction, the comparison gallery source, and an independently delegated review of the isolated lunar terrain demonstration. It is not release approval or owner visual acceptance.

Reviewed branch `recovery/reconcile-20261026`, starting at `51771f06`; final source inventory was taken at HEAD `ea5aa46e453c93e4d007c059de8999708653fa71` plus the integration changes awaiting commit. [Exact source hashes, browser commands/results and test commands](evidence/integration-review-green.json) identify the reviewed files independently of later documentation commits. Reviewer changed only this report and its evidence receipt; no application edits, commits, push or PR changes.

## Findings and correction verification

| P2 cause / files | Correction and independent evidence |
| --- | --- |
| Date-less `/solar-system` derived its load epoch from mutable canonical time in `SolarWorkspace.tsx`, so the first playback update paused and reloaded the scene. | Entry epoch is stable. Final browser playback remains running after one second, with exactly one snapshot request. Pause flushes the exact final epoch to canonical/session state. |
| Recenter reset the controller to orbit while React retained free-flight controls; reselecting the already-selected body produced the inverse mismatch. `SolarCameraController.ts`, `SolarWorkspace.tsx`. | Controller mode changes notify the UI; same-ID selection explicitly focuses. Both reproduced branches now report orbit in controller/UI and remove the flight pad. |
| Persistent `SolarScene.ts` retained construction-time trajectory arrays after an explicit date seek. | Accepted snapshots refresh bounded path buffers. All eight path first/last epochs and 129-point counts match the fresh API after a seek; renderer instance is unchanged. Fixed reference paths during playback are disclosed. |
| Context Retry loaded the original URL epoch and could lose camera/control state. Restoring an Eros close-up before assets arrived also reused an incompatible near/minimum distance and allowed deferred focus to overwrite restoration. `SolarWorkspace.tsx`, `SolarScene.ts`, `solarVisitState.ts`. | Recovery restores accepted epoch, camera, near plane and preferences. Earth recovery retained exact camera/time, free mode, asteroid layer and one canvas. Eros recovery retained exact camera and near `1.1256844713900063e-9` AU; its 189.405px apparent radius was unchanged. |
| Ordinary OrbitControls wheel/pan bypassed the collision helper. `SolarCameraController.ts`. | Whole input segments are guarded; accepted position is refreshed across modes and programmatic orbit is guarded. A real wheel event moved inside a fixture body before correction (0.036975 AU from center, radius 0.2 AU); afterward it stopped at 0.204 AU. |
| Eros outside source coverage silently showed an enabled, inert approach and a false close-up label. `SolarWorkspace.tsx`, `SolarScene.ts`. | At 2020-01-01, geometry remains unavailable, Approach is disabled, and the visible status explains coverage. No position is fabricated. |
| Applying navigation restoration unconditionally cancelled initial direct-link approaches; deferred Eros focus depended on source arrival order. `SolarWorkspace.tsx`, `SolarScene.ts`. | Restoration is conditional, and pending focus is explicit. Direct Saturn reaches a 212.450px physical view; direct Eros reaches a physical close-up before the recovery test. |
| Shared Solar shaders no longer supported the old system shader-text lighting patch. `systemMaterials.ts`, `SystemScene.ts`. | Explicit body-to-Sun vectors preserve parent-centered scientific coordinates for each material/body. Saturn's system material does not cast shadows from nonexistent rings. Focused adapter tests pass; real Earth-system entry/return also passes. |
| Isolated terrain demo published readiness after Release during imagery initialization; polar terminal vertices gave one physical pole different radii. `solar2-terrain-demo/entry.mjs`, `lolaTerrain.mjs`. | Separate non-author reviewer reproduced both. Late completion now stays disposed with zero canvases/resources. All 180 native pole samples across LOD0–3 match independently decoded row means, with zero longitude variation; extrapolated caps are explicitly marked unmeasured. |

System return also preserves the rate (3600), asteroid layer, free mode, exact epoch and Custom camera classification. A subsequent resize changes no camera coordinates. The gallery uses fixed filenames/enumerated choices and no untrusted HTML sink; no actionable source-level security finding remains in that page.

## Validation

From `frontend`:

```sh
npm test -- --run tests/solarCameraController.test.ts tests/solarVisitState.test.ts tests/solarFoundation.test.ts tests/solarAssets.test.ts tests/solarLighting.test.ts tests/systemMaterials.test.ts
npm run typecheck
git diff --check
```

Final result: **6 files / 32 tests passed**, typecheck passed, whitespace check passed. Earlier distinct supporting commands in the receipt passed **30 tests / 5 files** and **25 tests / 6 files**; these overlap and are not a cumulative total.

Browser commands use `/home/rocco/.codex/skills/playwright/scripts/playwright_cli.sh -s=solar2-review run-code`; the complete executed snippets and measured outputs are in the receipt. Linux headless Chromium exercised the actual private Docker-served candidate at `http://solar2.localhost:4231`, including actual context loss, API comparisons and system navigation. Final recorded batches have **zero page errors**. An initial Vite proxy 502 and an incorrect ready-system return-button locator were retained as failed setup/harness attempts, not relabeled as application passes.

Terrain-specific commands/results and source/artifact hashes are in [the independent terrain receipt](../../../output/playwright/owner-acceptance/solar2-terrain/review-regression.json): sampler **5/5**, final native-provider **4/4**, original 1,036,800-sample source verification, delayed-real-imagery cancellation, and native pole invariants. This review does not repeat the separate full application, Windows performance or science campaigns.

## Context and boundaries

Loaded the owner Solar2 directive; `AGENTS.md`; `docs/context/CORE_CONTEXT.md`, `LIVE_SESSION_BRIEF.md`, `CONTEXT_MANIFEST.yaml`; and the scoped `solar_reconstruction` pack:

- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`
- `docs/architecture/decisions/0010-r3-a-solar-runtime.md`
- `docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md`
- `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
- `docs/design/adaptive-explorer-r1a/README.md`
- `docs/validation/repository-recovery-20261026/owner-acceptance/README.md`
- `docs/validation/repository-recovery-20261026/visual-fidelity/README.md`
- `docs/validation/solar-system-2/PLAN.md`

The parent explicitly added the gallery and targeted terrain source/evidence review. No broad documentation scan was used; historical memory did not determine current execution state.

Windows GPU/performance, physical devices, visual acceptance, source-distribution/release qualification, hosted CI and consolidated PR acceptance remain separate gates. The optional terrain demonstration does not qualify production Moon terrain or crater-level detail. No finding or acceptance claim is made about the separately investigated inherited Earth observer/picking policy.

**Next:** commit the reviewed integration and run the requested hosted checks/CodeQL; retain draft PR107 and the owner's visual/release gates.

## Independent Solar handoff addendum

A separate non-author review examined `frontend/src/features/solar/solarNavigation.ts`,
`frontend/src/features/solar/SolarWorkspace.tsx` and
`frontend/tests/solarNavigation.test.ts` on `recovery/reconcile-20261026`, HEAD
`ea5aa46e453c93e4d007c059de8999708653fa71` plus the pending changes.
The parent subsequently committed these identical source files at
`fe3c3e876b8ea1e3a95020779497d7bb5bd5fdb9`; a focused `git diff --exit-code HEAD`
for the three files returned exit 0.
**Source/focused-test verdict: PASS; no remaining actionable P1/P2 finding in
this bounded correction.** This addendum qualifies the Solar handoff separately
from the earlier exclusion of native Earth observer/picking policy.

| Cause | Verified correction |
| --- | --- |
| The inherited Solar exit forwarded a saved Sky camera when entering Earth. `RuntimeHost.tsx` correctly rejected the mismatched camera mode, leaving Earth's default globe view; its actual map-center pick then changed the outgoing Sky observer. | `solarExit` uses the existing `handoffPath`/`handoffView` contracts, the validated saved native observer and final accepted Solar UTC. Different-mode Earth entry supplies `n1Center:true`; same-mode return keeps the exact saved camera with `n1Center:false`. Native Earth map-center/elevation policy remains unchanged. |
| Forwarding Earth search-history flags through a different-mode exit could retain `r2Search` and later trigger an uncentered second restore in `useEarthLocation`. | Only same-mode returns retain the source route state. Different-mode destinations drop `r2Search`/`r2Place`, preserving the normal handoff contract. |
| Direct Solar bookmarks had no saved native camera; their observer URL was not ingested by Solar, and Earth fell back to its ORAS home camera. | Solar entry ingests the validated URL or saved-native observer through existing canonical state validation. Exit receives the canonical observer and constructs bounded default camera intent at that actual location; Earth entry is explicitly centered. No geographic coordinate or elevation is invented. |

Independent command, from `frontend`:

```sh
npm run test -- --run tests/solarNavigation.test.ts
```

Result: **1 file / 4 tests passed**, exit 0. Coverage includes final UTC and
observer preservation, unchanged same-mode Earth camera, moved Earth observer
on Sky entry, removal of cross-mode search-history flags, controlled invalid
route fallback, and direct-bookmark canonical observer initialization.

Exact reviewed SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `frontend/src/features/solar/solarNavigation.ts` | `cb5f9ff7e20bcc8a27d3ea338f55ba754183b2afd18bae3d5aea855dacb16945` |
| `frontend/src/features/solar/SolarWorkspace.tsx` | `ba6b268466c21b54802ea8f4eef6fed581f7456cfb918c75a7ca1a50e727d1d3` |
| `frontend/tests/solarNavigation.test.ts` | `b7192ec6178d103b53b4b1bd143521a9067884a625d58baca1eb3d38b645eee4` |

`git diff --stat 51771f06 -- runtimes/earth-runtime frontend/src/features/workspace/viewNavigation.ts frontend/src/features/workspace/useViewNavigation.ts`
returned no changes. This reviewer changed only this report; no application,
native-runtime, commit, push or PR changes. Review context was the owner Solar2
directive, CORE/LIVE/manifest, the renderer architecture and relevant Solar and
controlled-handoff contracts; this report was explicitly added to the scope.

Browser qualification is separate: this addendum does not claim a new independent
browser run. The original `output/playwright/solar2/handoffs/proof.json` retains
the failed pre-correction observations and must not be presented as green.
The reviewer read `output/playwright/solar2/handoffs-corrected/proof.json`: actual
Windows desktop, portrait and landscape runs all **PASS**, with zero page errors,
covering final UTC, observer/elevation, serial renderer disposal and native Sky
controls. The subsequent `output/playwright/solar2/handoffs-final/proof.json`
retains **desktop FAIL, portrait PASS, landscape PASS**: desktop failed the repeated
moved-Earth coordinate assertion and did not reach the direct-bookmark check. The
parent identified this as a mixed-build attempt started before the latest build
finished; that explanation does not turn its failed observations into passes.

The fresh, frozen-build Windows receipt
`output/playwright/solar2/handoffs-qualified/proof.json` was independently read:
**desktop PASS (5 checks), portrait PASS (3), landscape PASS (3), zero page errors**.
All three layouts preserve the supplied 457 m elevation and observer within the
existing `1e-5` degree native-pick tolerance. Native Earth/Sky UTC is 1 ms earlier
than each final Solar epoch. Desktop additionally passes the moved-Earth repeated
Solar/Sky/Earth journey: the selected 12°,23° point returns as
12.000000064652921°,23.000001188898306°, retaining the honest unavailable/0 m
elevation. Its direct Solar bookmark at 12°,23°,456 m arrives at
12.000000062929743°,23.000001188443022°,456 m and exactly
`2026-10-27T04:00:00.000Z`. These results qualify the previously failed expanded
desktop paths against the frozen candidate without changing native Earth policy.

No actionable finding remains in the examined correction. Same-mode camera
preservation has source/focused-test evidence; the extra direct-bookmark and
moved-Earth repeat browser checks are desktop-only. The reviewer did not operate
the Windows browser. Physical-device, owner visual acceptance and release/source
gates remain open.

