# PR107 independent Hub/runtime review receipt

Reviewed immutable baseline: branch `recovery/reconcile-20261026`, HEAD `56f5645aac51d0d4bf16508dd85fba77e76db43c`, base main `9a03d8260a529f5858c5c3298cbb9d32b721daeb`. Worktree `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`.

Initial assignment was read-only. Parent later explicitly authorized one reproduced adapter correction and owning tests only; that uncommitted correction is separated below. No commit/push/branch/deployment, Docker mutations, production access, data changes or subagents were performed by this reviewer. Parent is independently editing deployment configuration in the shared checkout; those edits are outside this reviewer's ownership.

## Loaded context

Default Mode, review manifest indexes0 through17 inclusive, plus root/frontend AGENTS and CONTEXT_MANIFEST, followed by parent-requested UNIFIED_UNIVERSE_ARCHITECTURE and recovery/p0 README evidence. This is the assigned review pack portion; parent/other reviewers cover remainder. No broad docs scan and no unrelated authority documents loaded. Linked `r4-a-planet-view/COMMANDS.md` was consulted as implementation command evidence.

0. `docs/context/CORE_CONTEXT.md`
1. `docs/context/LIVE_SESSION_BRIEF.md`
2. `docs/validation/r3-a-solar-system/RECONCILIATION.md`
3. `docs/validation/r4-a-planet-view/README.md`
4. `docs/validation/planetary-systems/README.md`
5. `docs/validation/sky-satellite-live/README.md`
6. `docs/architecture/decisions/0010-r3-a-solar-runtime.md`
7. `docs/product/PRODUCT_VISION.md`
8. `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
9. `docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md`
10. `docs/validation/solar-cinematic/README.md`
11. `docs/validation/cinematic-acceptance/README.md`
12. `docs/validation/solar-scientific-controls/README.md`
13. `docs/validation/solar-cinematic-balance/README.md`
14. `docs/validation/earth-sky-completion/README.md`
15. `docs/validation/cinematic-glass/README.md`
16. `docs/design/adaptive-explorer-r1a/README.md`
17. `docs/validation/SYSTEM_VALIDATION_SPEC.md`

Additional explicit documents: `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`; `docs/validation/repository-recovery-20261026/README.md`; `docs/validation/repository-recovery-20261026/p0-satellite-usability/README.md`.

Constraints: Hub owns intent/navigation; native SWE owns selection/camera/math/scene and remains contained. Solar uses Sun+eight source-qualified bodies, independent cinematic sizing with persistent disclosure and physical-scale option; All/Inner/Outer are camera framing only. Local systems use actual parent centers, bounded source samples and UTC-to-TDB science, no fabricated motion. Moon Planet View uses301, MOON_ME_DE440_ME421,1737400m sphere, coarse historical LROC and explicit no-terrain limits. Cinematic graphics are not imagery/science/GPU acceptance. Native math/source pins/data/settings and renderer-lifetime separation remain protected. Current LIVE explicitly stops satellite rework; committed satellite qualification is reused only with its original limits. Current recovery supersedes historical R3-only/no-R4 activation text for review; old dated documentation is not authority to remove working later slices. Owner/device/advisory/source-offer/build-completeness gates remain open.

## Findings against reviewed HEAD

### P1 — Canonical frontend deployment never serves the new Moon renderer/data

Changed introduction: `frontend/src/features/planet/PlanetFrame.tsx:27`, iframe `/planet-runtime/?channel=...`; timeout at:10. Related introduced consumer `frontend/src/features/systems/SystemScene.ts:68` requests `/planet-data/moon-wac.png`.

Cause: canonical `frontend/vite.config.mjs:18-33` proxies only Earth/API/Sky remote. `generateBundle` at:173-181 emits125 assets but zero planet-runtime or planet-data files; copyPublicDir is false. `frontend/nginx.conf:7` routes Earth, then generic SPA fallback:53; no Moon routes. `frontend/Dockerfile.production` copies Hub dist only. Original canonical Compose has no Moon artifact/surface delivery mount/service. Thus the iframe receives Hub SPA instead of Moon entry and cannot emit its frameReady message. It times out at30s even if the independently missing backend source mounts are fixed. The system Moon texture is also unavailable. Local custom recovery preview configuration hides the deployment omission.

Focused actual-config reproduction: `node /tmp/pr107-planet-routing-repro.mjs [candidateRoot]`. Original output: devProxy and previewProxy keys `["/earth-runtime/","/api","/oras-sky-engine/remote-data"]`; emitted125; planetRuntimeAssets=[];planetDataAssets=[]; productionPlanetRoute=false;productionPlanetData=false;composePlanetRuntime=false;composeMoonSurface=false; exit1 `canonical Vite must serve or proxy the new Moon renderer`.

Smallest coherent correction: provide delivery-only same-origin /planet-runtime and /planet-data routing to separately mounted read-only qualified Moon artifact and LROC release; preserve `/earth-runtime/cesium/` SDK dependency; absent files404, never Hub SPA. Use `scripts/runtime/build_planet_runtime.sh` with pinned qualified Cesium1.138.0 if building. Do not bake scientific data into images.

Important boundary discovered: `scripts/runtime/record_owned_earth.py:11` recursively records every file in runtimes/earth-runtime, including nginx.conf and Dockerfile. `scripts/runtime/earth_artifact.py:54-62` enforces those bytes and source_input digest. Editing Earth nginx solely to serve Moon invalidates its qualified release. Parent was advised to place delivery-only config outside protected renderer source (separate static nginx service/config or externally mounted config), preserving Earth artifact/source lock.

Status: **genuine release-blocking baseline finding; parent owns packaging correction and final review/runtime proof.** Static reproduction, not a fresh Docker/browser result.

### P2 — Failed time acknowledgment permanently poisons observer/selection URL synchronization

Changed code at baseline `frontend/src/features/workspace/workspaceRuntimeAdapter.ts:55-68`: timeWork caches completion by same client and date/live key; unsuccessful result is retained. Every later URL sync awaits this failed Promise and exits before observer/selection work. A successful explicit same-epoch retry through public runtime.request does not replace the old cached failure. Product/URL observer can then diverge from native observer, affecting sky science and deep links until time key/client changes.

Reproduction injects one native time response `{ok:false}` or thrown bridge exception, then a successful explicit retry, then changes observer URL at same date. Actual hook dispatched only two time commands and no observer command before correction. Existing12 hook controls passed; two new regressions failed with received[] instead of expected observer `{lat:35,lon:-120,elevationM:10,elevationSource:"provided"}`.

Small correction, authorized by parent: invalidate only failed current-client/current-work temporal cache after completion. Pending and successful acknowledgments remain reusable; no clock-reset regression for selection-only URL updates. Production delta is3 added lines (two comments, one conditional) at:61-63. Owning tests add13 lines and two fault cases. No renderer/native code or math changed.

Status: **corrected locally, uncommitted; focused supporting qualification passes. Independent review/final application qualification belongs to parent.**

## Commands and exact results

- `git status --short`, `git rev-parse HEAD` at entry: clean; HEAD56f5645aac51d0d4bf16508dd85fba77e76db43c. Current shared checkout includes parent configuration changes plus this reviewer's2files; parent changes were not overwritten.
- `git diff --stat 9a03d826..HEAD -- frontend/src ...`, `git diff --name-only ...`, bounded `git diff`/`nl -ba`/`cat`/`rg` source inspections: examined added Solar/Planet/System workspaces/renderers/contracts, RuntimeHost, WorkspaceShell, useViewNavigation/viewNavigation, runtime product state and adapter, Earth location search/navigation, runtime protocol validation and Sky/Earth bridge commands, canonical Vite/nginx/Compose/build/attestation paths.
- `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4230/solar-system`:000, exit7. No fresh preview/browser claim. Parent independently confirmed no existing preview resources.
- Initial direct ESM import of Vite config failed because Vite supplies `__dirname` in its config-loader context; controlled Node reproduction sets globalThis.__dirname to exact frontend directory, then executes the actual plugin. This tooling correction changes no application file.
- `node /tmp/pr107-planet-routing-repro.mjs`: baseline exit1 with exact JSON above, expected RED assertion.
- `npm test -- tests/workspaceRuntimeAdapter.test.ts tests/viewNavigation.test.ts tests/planetContracts.test.ts tests/planetarySystems.test.ts tests/solarVisitState.test.ts`: baseline5files34tests passed.
- `/tmp/pr107-runtime-hypotheses/node_modules/.bin/vitest run --config vitest.config.mjs` (cwd its /tmp directory): exploratory actual-hook fault test12passed1failed; original hypothesis before repo edits retained there.
- `npm test -- tests/workspaceRuntimeAdapter.test.ts > /tmp/pr107-time-cache-red.txt 2>&1`: after adding regression before implementation,1file failed,12passed2failed, exit1. Failed assertions both prove missing observer dispatch.
- `npm test -- tests/workspaceRuntimeAdapter.test.ts tests/viewNavigation.test.ts tests/planetContracts.test.ts tests/planetarySystems.test.ts tests/solarVisitState.test.ts > /tmp/pr107-time-cache-green.txt 2>&1`:5files36tests passed, exit0 after correction. Includes unchanged provenance/time/Back/Forward/pending sharing contracts.
- `npm run typecheck > /tmp/pr107-time-cache-typecheck.txt 2>&1`: `tsc --noEmit`,exit0.
- `git diff --check`:exit0 after correction.
- `git diff --numstat -- frontend/src/features/workspace/workspaceRuntimeAdapter.ts frontend/tests/workspaceRuntimeAdapter.test.ts`:3/0 and13/0 respectively.

## Review and evidence limitations

No further actionable P0/P1/P2 is asserted from this bounded frontend pass. This is not exhaustive whole-product certification. Actual routes, return-state parsing, source identity validators, native barrier/lifetime paths and time/observer bridges were traced; no new scientific source or native SWE correction was justified.

No fresh Docker/frontend build/browser/camera-pixel/source-provider/physical-device/performance endurance qualification was performed. Focused tests use the existing real-hook harness with mocked bridge failures, not actual native renderer outage. They establish retry/cache behavior, not current native source accuracy. Parent was asked to run the final appropriate bundle after combined changes; a full frontend suite was deliberately not repeated inside this bounded reviewer assignment. No satellite investigation or native rendering changes were repeated.

Unverified hypothesis intentionally not filed: same-selected/same-epoch system history entries with different URL cameras might bypass the selected/ready/epoch restore effect; no concrete user-journey reproduction was obtained, so no severity/finding is claimed.

Deferred/current limitations remain: owner Earth/Solar/shared UX acceptance; physical GPUs/mobile devices; bounded major-moon source coverage; coarse Moon imagery/no terrain/Mars surface qualification; current provider rights/reliability; default build/deprecation warnings; historical N1 suite caps; release source offer/build reproducibility/security advisories tracked by parent.

Recommended next task: independently review the adapter correction and packaging/source-mount fixes, then qualify the actual canonical Docker service path with Moon imagery, planetary-system API and preserved native Earth/Sky return. Keep PR107 draft and stop at existing owner integration/release gates.

## Own changed files and delivery

`frontend/src/features/workspace/workspaceRuntimeAdapter.ts`; `frontend/tests/workspaceRuntimeAdapter.test.ts` only. No commit, push or PR write by this reviewer; branch HEAD remains56f5645a. Detailed review receipt and reproductions only /tmp.

Memory was used only to route recovery evidence/preservation scope; current SHA/documents were verified live. Memory reference: MEMORY.md:30-41, rollout01a176f7-a456-7612-9c89-ba9cd70c2097. No memory fact substitutes for current review evidence.
