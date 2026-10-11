# PROJECT STATE — EXECUTION AUTHORITY

Reconciled 2026-10-11. Validation→CORE→LIVE→manifest/index→this record govern
work; MASTER_PLAN is non-execution product reference. Evidence conflicts are
reported, not repaired by forcing runtime into stale docs. **SINGLE AGENT ONLY.**

## Current mode and authorized scope

Owner approved the visual-first order on 2026-10-10: **C5.7-D → C6-0/C6-1 → C6-2 → C6-3 → C6-4/C6-5 → preserved C5.7-A/PR #67 review → separately approved satellites and Weather**.
PR #70 is merged at `3e8276b705143b03af2c71658e8bc513d39b8e94`. The owner
separately authorized **C6-1A imagery-only implementation and local qualification**
on 2026-10-11. C6-2 terrain, C6-3 detail and later implementation remain
NOT AUTHORIZED; each package needs separate owner approval. Unfinished C5.7
physical-device, provider, science and integrated qualification gates remain open.

Provider spending is mandatory **$0**. No account/token creation, billing or
subscriptions. The owner assumes nonprofit PEMA/PASDA and ion Community use
permitted **for local development only**; verified public-release rights remain
outstanding. Ion requires explicit opt-in, a qualifying existing publishable token,
account-side zero-charge protection and bounded usage; absent these, fixtures only.
Reuse pinned God's Eye/Cesium exports; no new dependency, pin update, full upstream
Viewer factory or scientific star catalog.
PR #67 is closed/unmerged; preserve its branch/head/evidence for deferred work.
No production/SSH/Cloudflare deployment.

Isolated branch `c6-1a-global-imagery-adoption-1` starts at verified PR #70 merge
`3e8276b705143b03af2c71658e8bc513d39b8e94`. Implement the bounded
[C6-1A package](C6_GLOBAL_MAPPING_SPEC.md#active-c6-1a-imagery-package--2026-10-11)
through the PR #68 adoption exports, preserving the qualified Hub Viewer and Sky.
Commit/push/open one implementation PR; DO NOT MERGE. Matching browser proof and
bounded Earth artifact qualification precede handoff; stop for owner visual review.
Candidate Earth `a7be44c773d245f69ce38cd291275d43a7e8b5b06f065fe857e2e9cf4edc9eef` (inputs `63bb97c9d08e4acf888d38dd107ac75fbc089d802e0d457cb3856078b2461978`),
with two identical Docker builds and exact installed/served bytes.
[Current mapping evidence](../validation/EARTH_HD_MAPPING_EVIDENCE.md#c6-1a-local-imagery-qualification--2026-10-11) records results and remaining gates.

## Verified merged baseline and environment

PR 63 merged: `126da1537c734de817d9f9c59468d995807da37c` (Oct 5),
PR 64 merged: `521ffb27b16a31dfc9964260f98f89331b9e42d0` (Oct 5),
PR 65 merged: `bb28aec7833d154c2f0b3b7fa7470d69a93c84b4` (Oct 7), approved head: `d73588f13fbfa6366fcc6784dae8d5f336599ce5`.
PR #68 merged at `eea3e295ed5d234edae9053b3119f61e15e8371b`; PR #69 merged;
PR #70 merged at verified main `3e8276b705143b03af2c71658e8bc513d39b8e94`. PR #67 is closed/unmerged,
with work/evidence preserved. Completed bounded
checkpoint history below is evidence-backed, not global feature readiness.
Local laptop WSL/Docker only. `npm run dev:local` is ordinary startup. Preserve
owner `.vscode/settings.json` unchanged/unstaged, data/installations/evidence,
Docker volumes/Postgres/Redis identities. No reset/clean/prune/migrations.
Production/SSH/Cloudflare/oras.org/storage/deployment decisions are deferred until
owner-declared Release Candidate with separate approval; no current feature blocker.

Current Sky artifact `b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`;
merged-main Earth baseline `822b1baeb933636cc5570077e905b57a029ea003902173b48142e0bbaf8fa552`;
Earth rollback `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`;
external God's Eye `e7707d9a0f34d9fbffc300023c319f95caa5be30` unchanged.
[Audit handoff](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md) records source/installed/served hash verification
and the post-merge bounded Playwright smoke (`3 PASS`). Historical full campaigns are not rerun here.

## Current capability truth and known gaps

[Audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md) and [Feature Tracker](../features/FEATURE_TRACKER.md)
separate code/UI/fixture/live/render/scope/acceptance. Aircraft HTTP 503 is provider
observation; observer coverage and altitude display gate are separate. Stations
population/cap/15s refresh is intentional, not a proven missing-object bug. Point
Weather works for one modeled location; radar is separate CONUS snapshot. Earth
standard stars/atmosphere have local C5.7-D proof in the
[appearance evidence](../validation/C5_7_D_EARTH_APPEARANCE_EVIDENCE.md) and owner
acceptance from space; PR #69 is merged. Physical-device
and other unfinished qualification gates remain open; no scientific catalog claim.
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
| C5.6.5 — capability/implementation audit | Completed evidence, preserved in `09495238` | [Canonical audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md); dated Oct 7/8 snapshot, provider/live uncertainties retained. |
| C5.6.75 — reconciliation | Historical documentation checkpoint, superseded by merged PR #68 | [Reconciliation evidence](../validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md); historical evidence retained. |
| C5.7 — core recovery | D merged, bounded space appearance accepted; closed A/PR #67 preserved; B/C/E gates remain outstanding | [C5.7 spec](C5_7_EARTH_CORE_RECOVERY_SPEC.md); visual-first order, one package active at a time; artifacts requalified when inputs change. |
| C6 — global HD/terrain/3D | C6-0 merged; C6-1A imagery implemented locally; final evidence/owner visual acceptance gate; C6-2+ unapproved | [C6 plan](C6_GLOBAL_MAPPING_SPEC.md); provider/account/cost/coverage qualification before provider-specific code. |
| D — ISS handoff | Planned | Identity/time/frame/observer/focus science qualification; separate bounded owner authorization. |
| E — Mars/body surfaces | Planned | Body/radii/datum/imagery/terrain rights proof, Mars first; Earth data cannot be relabeled. |
| F — astronomy extensions | Planned | Source-backed science/UTC/visibility/coverage; horizon remains unimplemented; no fake observing metrics. |
| G — immersive UX | Planned | Approved UX/device/scene/share contracts; media rights and physical qualification. |
| H — solar-system scale | Planned; renderer OPEN | Dedicated scale/frame/camera/renderer study; no Earth's renderer sufficiency assumed. |

## Planning references and next action

Owner approved the visual-first order on 2026-10-10: **C5.7-D → C6-0/C6-1 → C6-2 → C6-3 → C6-4/C6-5 → preserved C5.7-A/PR #67 review → separately approved satellites and Weather**.
PR #70 is merged at `3e8276b705143b03af2c71658e8bc513d39b8e94`. The owner
separately authorized **C6-1A imagery-only implementation and local qualification**
on 2026-10-11. C6-2 terrain, C6-3 detail and later implementation remain
NOT AUTHORIZED; each package needs separate owner approval. Unfinished C5.7
physical-device, provider, science and integrated qualification gates remain open.

Provider spending is mandatory **$0**. No account/token creation, billing or
subscriptions. The owner assumes nonprofit PEMA/PASDA and ion Community use
permitted **for local development only**; verified public-release rights remain
outstanding. Ion requires explicit opt-in, a qualifying existing publishable token,
account-side zero-charge protection and bounded usage; absent these, fixtures only.
Reuse pinned God's Eye/Cesium exports; no new dependency, pin update, full upstream
Viewer factory or scientific star catalog.
PR #67 is closed/unmerged; preserve its branch/head/evidence for deferred work.
No production/SSH/Cloudflare deployment.

**NEXT ACTION: C6-1A implementation PR and owner actual-mapping visual review.
No C6-1A merge or C6-2 implementation without separate approval.**
Local scope proof: [appearance evidence](../validation/C5_7_D_EARTH_APPEARANCE_EVIDENCE.md).
Merged Earth `822b1baeb933636cc5570077e905b57a029ea003902173b48142e0bbaf8fa552`;
rollback identities above remain preserved. Physical/C5.7-E and other unfinished
acceptance remains outstanding; only appearance from space is owner-accepted.
Preserve contained SWE rendering/math/canonical string identities and both system models.

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
