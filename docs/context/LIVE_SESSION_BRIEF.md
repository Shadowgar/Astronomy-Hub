# LIVE SESSION BRIEF

ORA-7's owner-approved locked unified workspace was merged in PR #58 on
2026-10-03 at `f55b9b2721cb692b4cda106e415c8fef59454c80`, including the final
Live-time/custom-timezone/Earth-observer correction `a45fa637dce0b420f63d49abe30f4d76633bd410`.
PR #59 / ORA-8 / Phase C5 was owner-approved and merged on 2026-10-04 at
`d8ca945a0b1a1c44622dae573d9787dde71f8a76`, with parents reviewed main
`fc41ac19d7e2021c9d4b56b5a13322981f3c6992` and reviewed head
`e0e69e4747e9123b75072f9636e566865948d584`. **Phase C5 is COMPLETE**:
owner review, merge and post-merge local/disposable qualification passed.
The owner reprioritized local WSL development repair on 2026-10-04, SINGLE
AGENT ONLY. The focused `dev-wsl-performance-repair-1` branch restores the exact
qualified Earth artifact at the stable local path, stops completed qualification
workloads, and bounds file watching. Use `npm run dev:local`; local measurements,
workflow and remaining limits are in [local development repair evidence](../validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md).
No next feature or remote work is authorized by this repair.
The previously authorized high-definition / close-zoom Earth package remains
implemented and awaiting owner review. The first bounded package is implemented and
locally qualified on `earth-hd-mapping-1`: keyless USGS CONUS aerial imagery,
bounded tile requests and explicit fallback/retry, preserving one owned Viewer.
Fresh Docker, desktop/mobile browser, provider/license and C5 regression evidence
is recorded in [HD mapping evidence](../validation/EARTH_HD_MAPPING_EVIDENCE.md).
The rebuilt artifact passes 75 Node and all 25 Docker/browser cases, including
the reviewed outside-CONUS source-status correction. Next action is owner
validation of the repaired local loop and review of the isolated tooling correction,
followed by owner review of [PR #63](https://github.com/Shadowgar/Astronomy-Hub/pull/63); do not merge without that review.
The unchanged locked design ancestor is `2a4a665bc2db8399dd0728f918f5aae695ac0cd5`.
No runtime override mode is active. Load `docs_change`, `planning`,
`frontend_change`, `backend_change`, `review` and `validation` packs as applicable.
Repository design documents remain authoritative; secondary Figma remains partial
under the owner waiver.

## Owner release policy, 2026-10-04

Development and qualification use laptop WSL and local/disposable Docker until
the owner explicitly declares a **Release Candidate**. External production
availability is not a feature-completion gate or Category A blocker. Deployment,
target host, persistent storage, public hostname, Cloudflare and `oras.org`
integration will be reassessed separately at Release Candidate. No public
production qualification is claimed by local proof.

`openclaw` and its unavailable external volume are historical infrastructure,
not the current target, blocker or next action. Do not SSH, deploy or repair that
host during this task. Preserve the recorded diagnostics as history. The active
HD package preserves one owned Cesium renderer, contained SWE, C5 layers and the
pinned God's Eye dependency. ISS, Moon/Mars, measured horizon and Phase D remain
out of scope. Preserve `.vscode/settings.json` unchanged and unstaged.
This owner decision supersedes the historical release/no-HD gates below; see the
[policy checkpoint](../validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md#owner-development-and-release-policy-checkpoint-2026-10-04).

## Preserved implementation and review history

The unified workspace is merged: `/` opens Sky, `/sky-engine` and `/earth` are
modes; Tonight/Observe are contextual surfaces with focused routes retained.
The locked design and merged lifecycle/ownership architecture are preserved.
Hub owns the independent Cesium Earth Viewer, camera, layers, selection, product
UI, attribution and lifecycle. SWE owns its contained Sky rendering/science.
God's Eye remains an immutable external feature dependency at
`e7707d9a0f34d9fbffc300023c319f95caa5be30`; no complete application or upstream
Viewer is admitted. Only one heavy renderer lives at a time through the existing
authenticated/versioned bridge. Native Sky source/data science is unchanged.

C5 qualifies USGS earthquakes, NIFC/WFIGS fire perimeters and NOAA/NWS nowCOAST
CONUS radar. Launch Library production access returned HTTP 403 and is blocked
in this environment; no launch data or trajectory is fabricated. FastAPI owns
bounded acquisition, normalization and independent provider caches. The owned
Earth runtime renders strict DTOs; provider source time is distinct from scene
time. Fire boundaries are a generalized, incomplete recent subset. Radar is
CONUS reflectivity, not a global surface or rainfall forecast.

Earth uses qualified NASA GIBS Blue Marble static imagery over local Natural Earth
fallback, with ellipsoid terrain. Configured terrain/3D admission exists, but no
account provider or photorealistic/terrain result is claimed without credentials
and separate qualification. Live aircraft/satellite/weather clocks remain distinct
from requested astronomy scene time; no historical provider simulation is claimed.

Current qualification and limitations are recorded in
[workspace implementation evidence](../validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md).
Historical Phase B/C and PR #58 qualification evidence is preserved. Owner merge
approval closes the ORA-7 implementation checkpoint. Deliver bounded follow-up
repairs with their own focused proof and qualification limits; do not assign
historical passing counts to changed sources. Do not merge follow-ups or start
another phase. Preserve unrelated
`.vscode/settings.json` unchanged and unstaged. No ISS handoff, Mars/Moon surfaces,
measured horizon or broad God's Eye feature-parity expansion is authorized.

Merged follow-ups, 2026-10-03: PR #60 merged at
`1e7fd3efab22d66fc7918890767ec9204aba5a95`, preserving the Sky endpoint through
cached navigation, explicitly resetting interaction and cleaning timers on every
pagehide, with genuine-departure cleanup retained. PR #61 merged at
`f3601bb82b0c52343d2c38f93ecfce747ef611c7`, preserving local Messier fallback,
partial OpenNGC enrichment recovery, canonical deduplication and source status.
Live-time/custom-timezone/Earth-observer corrections remain merged in `a45fa637`.
These repairs are preserved baselines, not pending implementation tasks.

Qualification and final handoff are recorded in
[Earth expansion evidence](../validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md).
Historical implementation and local qualification: 54 runtime/protocol, 42 frontend,
35 Docker backend tests; five fixture and one live Docker browser checks. The
three layers are ADAPTED NOW; launches are LICENSE/DATA BLOCKED by access 403.
PR [#59](https://github.com/Shadowgar/Astronomy-Hub/pull/59) is open on this branch.
The handoff status is **In Review**, not Done. The one requested normal review
is complete; both unique Category A findings were repaired with focused
regressions, two desktop/mobile polygon-pick retests and artifact rebuild. Owner
approval closes it. Do not merge or start another phase. No ISS, Mars/Moon, measured
horizon or other excluded layers. Preserve `.vscode/settings.json` unchanged and
unstaged. Historical Phase B/C and workspace evidence are preserved.

PR #62 context/validation enforcement merged at `fc41ac19`; mandatory rules,
exact failure identifiers, stack authority and Tonight contract are preserved.
PR #59 is the active Earth live-layer PR; this integration reruns its focused
qualification and merged maintenance checks without new feature implementation.
High-definition close-zoom Earth mapping is the NEXT major phase after #59,
subject to separate owner authorization. It has not started. No ISS or Mars/Moon
work has started. No PR merge or deployment is authorized.


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
