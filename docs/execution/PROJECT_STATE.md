# PROJECT STATE — EXECUTION AUTHORITY

Reconciled2026-10-08. Validation→CORE→LIVE→manifest/index→this record govern
work; MASTER_PLAN is non-execution product reference. Evidence conflicts are
reported, not repaired by forcing runtime into stale docs. **SINGLE AGENT ONLY.**

## Current mode and authorized scope

C5.6.75 documentation/architecture/roadmap reconciliation prepared for owner
review in one docs-only PR. Original audit preserved separately at `09495238c2b5aebe358c66f9a09801382758f4f8`;
branch `c5-6-75-architecture-roadmap-reconciliation-1` descends from it and keeps
audit recovery ref. Allowed: document/context/index/ADR/validation reconciliation,
commits/push/PR/review corrections within docs scope. No PR merge by this task.
No C5.7/C6/ISS/Mars/Moon/other feature coding, pin/dependency/runtime/protocol/
artifact input changes, rebuild, provider purchase/account/production deployment.

## Verified merged baseline and environment

PR63 merged`126da1537c734de817d9f9c59468d995807da37c` (Oct5),
PR64 merged`521ffb27b16a31dfc9964260f98f89331b9e42d0` (Oct5),
PR65 merged`bb28aec7833d154c2f0b3b7fa7470d69a93c84b4` (Oct7), approved head`d73588f13fbfa6366fcc6784dae8d5f336599ce5`.
GitHub merge identities checked Oct8; main remains `bb28aec7833d154c2f0b3b7fa7470d69a93c84b4`. Completed bounded
checkpoint history below is evidence-backed, not global feature readiness.
Local laptop WSL/Docker only. `npm run dev:local` is ordinary startup. Preserve
owner `.vscode/settings.json` unchanged/unstaged, data/installations/evidence,
Docker volumes/Postgres/Redis identities. No reset/clean/prune/migrations.
Production/SSH/Cloudflare/oras.org/storage/deployment decisions are deferred until
owner-declared Release Candidate with separate approval; no current feature blocker.

Sky artifact `b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`; Earth `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`; external God's Eye `e7707d9a0f34d9fbffc300023c319f95caa5be30` unchanged.
[Audit handoff](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md) records source/installed/served hash verification
and post-merge3browser smoke. Historical full campaigns are not rerun here.

## Current capability truth and known gaps

[Audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md) and [Feature Tracker](../features/FEATURE_TRACKER.md)
separate code/UI/fixture/live/render/scope/acceptance. Aircraft503 is provider
observation; observer coverage and altitude display gate are separate. Stations
population/cap/15s refresh is intentional, not a proven missing-object bug. Point
Weather works for one modeled location; radar is separate CONUS snapshot. Earth
skybox explicitly disabled; standard visual stars proposed, not scientific catalog.
CONUS historical HD/coarse global fallback/ellipsoid terrain/dormant ion branches
remain. No full God's Eye parity/global weather/real terrain/production claim.
Gaia DR3-scale/zoom-aware depth, deep photometry/coverage, DSO media, full-sky HD
survey/passes/physical-device performance remain limited; DESI/WordPress deferred.

## Checkpoint sequence and approval gates

This table records owner-requested sequence, not blanket implementation permission.
[Validation law](../validation/SYSTEM_VALIDATION_SPEC.md) governs feature truth.
Only PROJECT_STATE and LIVE_SESSION_BRIEF activate a bounded task. Completion of
a package does not establish all feature parity, global coverage or production readiness.

| Checkpoint | Bounded status and dependencies | Evidence / limits / approval gate |
| --- | --- | --- |
| C0 — reproducible SWE | Completed bounded foundation | [Phase C evidence](../validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md); native science/math remain SWE-owned. |
| C1 — Hub-owned Cesium Earth | Completed bounded foundation | Same evidence; independent Viewer, not the full God's Eye app. |
| C2 — selective God's Eye adapters | Completed bounded foundation | Same evidence; observer aircraft, stations satellites, point weather; broad parity not complete. |
| C3 — Earth core parity foundation | Completed bounded foundation | Same evidence; core controls/facts/lifecycle, not every upstream layer. |
| C4 — unified bridge/lifecycle | Completed bounded foundation | [Workspace proof](../validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md); serial Sky/Earth lifetime and small product intent, not all future bodies/handoffs. |
| C5 — live-layer expansion | Completed bounded package, PR59 merged | [Expansion proof](../validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md); quakes/perimeters/latest CONUS radar; launch access historically blocked. |
| C5.5 — CONUS HD Earth | Completed bounded package, PR63 merged | [HD proof](../validation/EARTH_HD_MAPPING_EVIDENCE.md); historical CONUS imagery/coarse global fallback/ellipsoid terrain. |
| C5.6 — development and Sky stabilization | Completed bounded package, PR64/65 merged | [Local repair](../validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md), workspace proof, [post-merge audit smoke](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md); wheel/search/Gaia/control scope, scientific/catalog limits retained. |
| C5.6.5 — capability/implementation audit | Completed evidence, preserved in `09495238` | [Canonical audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md); dated Oct7/8 snapshot, provider/live uncertainties retained. |
| C5.6.75 — reconciliation | Current documentation checkpoint; prepared for owner review | [Reconciliation evidence](../validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md); no future implementation authorized. |
| C5.7 — core recovery | PROPOSED; not started | [C5.7 spec](C5_7_EARTH_CORE_RECOVERY_SPEC.md); owner approval/decisions, one package active at a time; artifacts requalified when inputs change. |
| C6 — global HD/terrain/3D | Approved product direction; not implemented | [C6 plan](C6_GLOBAL_MAPPING_SPEC.md); provider/account/cost/coverage qualification before provider-specific code. |
| D — ISS handoff | Planned | Identity/time/frame/observer/focus science qualification; separate bounded owner authorization. |
| E — Mars/body surfaces | Planned | Body/radii/datum/imagery/terrain rights proof, Mars first; Earth data cannot be relabeled. |
| F — astronomy extensions | Planned | Source-backed science/UTC/visibility/coverage; horizon remains unimplemented; no fake observing metrics. |
| G — immersive UX | Planned | Approved UX/device/scene/share contracts; media rights and physical qualification. |
| H — solar-system scale | Planned; renderer OPEN | Dedicated scale/frame/camera/renderer study; no Earth's renderer sufficiency assumed. |

## Planning references and next action

[Earth capability plan](EARTH_CAPABILITY_PLAN.md) is the normal planning reference;
[C5.7 proposed spec](C5_7_EARTH_CORE_RECOVERY_SPEC.md) holds A→B→C→D→E and the
unresolved Owner Decision Register; [C6 plan](C6_GLOBAL_MAPPING_SPEC.md) holds
ordered provider/imagery/terrain/3D/presentation/qualification stages. They do not
activate implementation. Only one explicitly approved package may be active.

**NEXT ACTION: owner review of C5.6.75 and its documentation PR.** Resolve scope/
provider/budget/asset decisions and separately authorize C5.7 before coding. Do not
merge this PR or implement any next phase automatically. Preserve both required
system models and contained SWE rendering/math/canonical string identities.

## Historical qualification excerpts (not current control)

All excerpts below are dated historical stop-points and artifact identities; current control above supersedes their open-PR/next-task language. Formal evidence files are preserved unchanged.

## Historical implementation evidence retained from PRs #51–#52

The following qualification was recorded before this docs-only checkpoint; it
was not rerun here. PR #52 is now merged. GitHub owns current check/review truth.

## Merged Tonight baseline

PR #51 merged on 2026-10-01. `/tonight` and `tonight.v1` are the unchanged
scientific baseline for this frontend pass. Its historical evidence remains in
`docs/validation/TONIGHT_MVP_EVIDENCE.md`; GitHub has current merge/review truth.

## Public shell qualification

Fresh qualification on 2026-10-01:

- `npm --prefix frontend run test`: 18 files, 155 tests passed.
- `npm --prefix frontend run typecheck`: exit 0.
- `npm --prefix frontend run build`: exit 0; 96 modules, 7m49s. Main JS
  265.58 kB (81.44 kB gzip), CSS 77.51 kB (13.01 kB gzip). Existing public
  runtime/data copying accounts for the long prepare-output-directory step.
- `git diff --check`: exit 0.
- `COMPOSE_BAKE=false docker compose up -d --build --no-deps frontend`:
  exit 0, one frontend rebuild, healthy container. Backend was not rebuilt.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 PLAYWRIGHT_SKIP_WEBSERVER=1 npm --prefix frontend run test:e2e -- publicShell.spec.ts tonight.spec.ts tonightRollover.spec.ts`:
  16 passed in 38.6s against Docker.

Desktop 1440x900 and mobile 390x844 passed all four public routes: active nav,
landmarks, direct refresh, Back/Forward, no horizontal overflow, usable Sky
viewport, category/detail interactions and supported route context. Keyboard
skip-link focus passed. Exact Observe identity/camera centering and Tonight
peak-time/site/identity handoffs passed; local-noon/DST rollover regressions
remain green. Home performs one Tonight and one Above Me request; Observe and
conditions share the latter cache. Controlled Tonight/Above Me/weather/all-data
failures leave independent modules and navigation usable. Pending Tonight does
not block Observe or Sky.

Screenshots: `output/playwright/public-shell-{home,observe,tonight,sky}-{desktop,mobile}.png`
and `public-shell-viewport-{home,observe,tonight,sky}-{desktop,mobile}.png`.
Failure screenshots use `public-shell-failure-{tonight,above-me,all,weather}.png`.

Console audit: Home, Observe and Tonight have zero console/page errors. Embedded
Sky has 58 resource 404 errors; unchanged standalone Sky has 61 of the same
missing mounted dense-star tile pattern, with zero other console errors and
zero fatal page errors. Counts depend on camera/viewport. Evidence:
`output/playwright/public-shell-console.json` and
`output/playwright/public-shell-standalone-console.json`. The blanket console-clean
acceptance gate is therefore PARTIAL, not claimed passed. This existing runtime
mount/data-availability issue is a Category B unrelated follow-up under the
owner's review stopping rule; catalog installs/rebuilds are outside this UI pass.

No backend tests were required or run: backend code/contracts are unchanged.
`git diff --name-only -- backend frontend/public vendor` is empty. Standalone
index SHA-256 remains `ee9a6b719213e8ff5785b9c9e3bf564795fde87ca049de900200ae7592fa4f55`.
No NightAstro code, CSS, assets, branding or scoring was copied. No new font,
icon library, heavyweight framework, sky renderer or bulk data was introduced.

PR #52 merged with the documented global console-cleanliness gap retained.
This evidence remains historical, not a new runtime qualification. The active
Phase B study must not merge its PR or implement Phase C or `oras_horizon.v1`.


Current-main integration is committed in `69c4f1f5` (parents accepted Earth head
`ff488339` and main `fc41ac19`). Fresh automatic review identified one additional
Category A P2: same-ID earthquake revisions retained stale depth color, magnitude
visibility range and label text. The focused correction refreshes those properties
while retaining entity/selection identity; selected/unselected regressions reproduce
the old failure and pass after correction. This is a third unique Category A
finding, separate from the two historical review repairs above. Its owned runtime
input change requires a pinned Earth rebuild and regenerated identity metadata.
Fresh qualification and the existing-PR handoff are recorded in
[Earth expansion evidence](../validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md).
This does not authorize another broad review, a new provider, mapping/ISS/Mars/Moon,
merge or production deployment. PR #59 remains In Review for owner approval.

Owner-review correction on reviewed head `2bb9ba8`: radar manifests now lease
exact timestamp-keyed PNG bytes for a bounded 120-second grace (two slots), and
WorkspaceShell serializes layer restoration/user commands per runtime client,
preserving newer user choices and cancelling departed-client work. Both mandatory
regressions failed before correction and pass afterward. Fresh proof: 42 local
backend, 37 Docker Earth/aircraft, 62 runtime/Earth, 196 frontend tests, 14 Docker
browser cases including desktop/mobile races, live providers and actual bfcache;
typecheck, six manifest negative tests and architecture validation pass.
No Earth-owned input changed: existing artifact `f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b`
is reverified against source, all files, recorded/served metadata and seven exports.
The two named Category A blockers are closed by implementation/qualification;
remote SHA, CI and thread closure are recorded in the final PR handoff. Next task
is owner re-review of #59. Category B limits and all excluded work remain unchanged.
