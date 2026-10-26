# Repository recovery — 2026-10-26

**BLOCKED for mainline integration and product acceptance.** One isolated candidate replaces the review of the accumulated stack. Closing an old review vehicle is not a merge and does not certify its functionality. All original branches, worktrees, data and evidence remain preserved.

## Identity and dependency decision

- Baseline: 105 PRs total, **25 open**, **84 remote branches**. Rejected #102/#104 and superseded #103 were already closed without merge.
- Protected baseline `main`: `9a03d8260a529f5858c5c3298cbb9d32b721daeb`. Main is currently unprotected; no ruleset was returned. No main changes are authorized or performed.
- Candidate branch: `recovery/reconcile-20261026`; worktree `.worktrees/repository-recovery-20261026`.
- Tested code SHA: `0075b2011a0c8ccf51a271972e054998555ee708`. Subsequent evidence/governance commits must preserve this application tree; receipts distinguish earlier `f7e69519` runs from final runs.
- Verified chain: **73 → 74 → 78 → 79 → 80 → 81 → 82 → 83 → 84 → 85 → 86 → 87 → 88 → 89 → 90 → 91 → 92 → 93 → 94 → 95 → 101 → 105**. PR75 was merged into PR74, not main. Every one of these heads is reachable from the candidate. No rejected 102/103/104 head is admitted.
- Candidate combines PR105 with current main through local merge `ee116769`, retaining the native Sky, qualified Earth/Cesium, Solar, Moon and major-moon source work. It does not cherry-pick the accumulated feature diffs repeatedly.
- PR71's automatic imagery/cache work was carried into PR79 and subsequently evolved. Several source files match PR79 exactly; others have evolved. Its seven distinct historical commits and original artifacts remain preserved; whole-tree equivalence is **not** asserted.
- PR76 remains blocked by reproducible dependency incompatibility. PR77 installs and builds in pinned Node20 but has a changed app bundle without matching browser qualification. Neither is included.

[Every PR and disposition](PR_DISPOSITIONS.md) · [Every branch and disposition](BRANCH_DISPOSITIONS.md) · [Machine inventory](inventory.json) / [full cumulative diff metadata](inventory-detail.json.gz) · [Technical receipts](receipts/) · [Commands](COMMANDS.md).

## Repairs and current proof

1. PR105 changed the source satellite presentation policy without rebuilding its generated Sky app. The source/artifact test failed. The contained runtime was rebuilt at `f7e69519`; native WASM and vendor chunks were preserved. A separate clean native reconstruction matched all **110 application files** byte-for-byte.
2. A real 667×390 pointer test found the selected-object Hub launcher intercepting native Observing tools. The Hub-only media rule now centers that launcher in landscape mobile; the same desktop/portrait/landscape pointer journey passed. Native rendering/source was not changed. The existing browser verifier now uses the current visible result and native observing-control selectors.
3. Added a proposed CI workflow that actually checks Hub/runtime sources. Existing `Playwright Tests / test` only visits **playwright.dev**, so its green status is not application validation. No branch-protection setting has been changed.

| Evidence | Result / limit |
|---|---|
| Backend, disposable Docker test filesystem | 678 passed, 12 skipped at committed code 0075b201 (208.68 s, 38 deprecation warnings). Historical TLE test fixtures remain distinct from the fresh runtime feed. |
| Frontend | 384 tests / 58 files passed; typecheck and Hub production build passed. Build retains >500 kB chunk warning. |
| Runtime/Earth/planet/protocol Node contracts | 258 passed, 0 failed, 0 skipped at committed code 0075b201. |
| Source admission | 5 parser tests passed; release validator accepted 15,901 source-backed records. |
| Clean Sky build | Pinned native + Node builders, no network; all 110 application payload files reproduced. Existing dependency cache/image used, so this is not proof of fresh dependency/image acquisition. |
| Docker/browser | Task-only preview at `http://127.0.0.1:4230`; all mounted scientific inputs read-only. Desktop/mobile five-mode smoke, eight planetary groups, genuine Paris/address/coordinate navigation, native Sky settings/state return and current Earth-system → native Moon journey passed. |
| Native catalog | CelesTrak acquisition 2026-10-26 05:43 UTC; 15,906 original records, 15,901 admitted, five epoch-window exclusions. Native log and direct module enumeration both confirm 15,901. Short NORAD lookups require five-digit padding. |
| Freshness/provenance | Shared native/backend release SHA-256 `902387afd7a0b268c16bbe0303c9706873a2031dccd2eaaeb6668cca90575a21`; ordinary current UTC and native 1× clock retained. No 155-record pilot, historical feed substitution in runtime, Passes, or simulation. |
| Security audit | Hub lock: 12 advisories (1 critical, 5 high, 6 moderate). Sky lock: 156 (12 critical, 55 high, 76 moderate, 13 low). These are registry findings, not proof that every advisory is exploitable; no clean-security claim. |

Initial red evidence is retained: backend 619 passed/57 failed/14 skipped against read-only runtime paths and mismatched fixture environment; source/artifact mismatch; stale direct-Moon-button harness; initial hidden-result Sky selector timeout; genuine landscape pointer interception. Corrected test harnesses do not turn those historical runs green.

## Gates still missing

- **Satellite pixels:** full native fresh-data loading and native propagation are demonstrated; ordinary unselected pixel motion relative to fixed stars is **not** demonstrated. At the captured ordinary ORAS 120° live view, brightest sampled native magnitudes were around 9.2. No photometry, camera or time manipulation was used to manufacture visible points. No owner acceptance of satellite UX.
- **Device/UX:** no Windows hardware GPU or physical mobile qualification; Chromium software rendering/touch emulation only. N1's explicitly accepted historical scope is preserved and is not reopened. Later full-product UX still needs owner review.
- **Source/offer:** prepared a 10.6 MB reconstructed source candidate with SHA `7b25bd4f6a975cddaf6004dc796489df703d1fda424f63434760a1fff2a3f18b`; no public immutable archive or prominent build-matched interactive source offer. Combined-work source completeness and fresh build-image/dependency reproduction remain unqualified. Do not call AGPL release compliance established.
- **Security/review:** registry advisories and inherited PR73 review threads require disposition; exact consolidated-head independent review is absent. Do not represent prior PR reviews as approval of this candidate.
- **Runtime limitations:** existing dense-star tile 404s occurred during Sky smoke. Full resource-leak/performance endurance and production provider rights/readiness are not qualified. Earth/planet artifacts are retained, source-hash checked existing builds; only Sky and Hub were freshly rebuilt.
- **Source preservation is not rollout:** no database migration, Compose replacement, production deployment, source promotion, main merge, branch/worktree deletion, protection change or paid provider operation occurred.

## Preservation and one decision gate

The verified self-contained local Git bundle `output/recovery/repository-preservation.bundle` has SHA-256 `d2fe5e2e8498f53f0793579288300eb982ec90fbb37d463ab88899a9b4eab76e` and contains fetched PR refs, local/remote branches and tags through `f7e69519`. Later candidate commits remain in the candidate branch. Existing owner `.vscode/settings.json`, the untracked cinematic verifier, all 49 original worktrees, existing Docker resources, mounted science and native/Earth artifacts remain intact. Snapshot consumers and ignored artifact directories are recorded per branch. The bundle is local rollback material, not a remotely hosted backup.

**Do not merge this draft yet.** Once the missing gates above are genuinely satisfied, the consolidated owner decision must cover this exact set:

1. Merge one final reviewed recovery candidate into recorded main using a merge commit, retaining ancestry and a retrievable immutable main rollback ref. Recheck main and candidate SHAs before the action; abort on drift or failed mandatory checks. No blind sequential merging of 22 accumulated PR diffs.
2. Apply [proposed main protection](proposed-main-protection.json) only after its named checks exist and pass, an independent reviewer can satisfy the one-approval rule, and deployment owners confirm compatibility. The proposed rule dismisses stale approvals, requires last-push approval/conversation resolution and current checks, applies to admins, blocks force-push/deletion, and leaves merge commits allowed. No auto-merge or auto-delete setting is enabled.
3. Approve only exact remote branch names/tips in [remote cleanup proposal](remote-cleanup-proposal.json), after a fresh consumer/reachability check. The initial proposal contains 29 branches already reachable from baseline main without registered worktree/container/workflow/open-PR consumers. Unregistered external consumers still require owner confirmation. No local worktree, local branch or artifact deletion is proposed. Candidate-only branches stay retained until approved integration and a subsequent exact proof.

Governance thereafter: use one independently reviewable concern per PR; draft until source/runtime evidence and applicable human acceptance exist; do not extend a stack beyond one dependent draft without an explicit bounded integration decision; preserve rejected/superseded explanations; perform exact-tip cleanup after accepted integration. Release manifests must pair code, renderer hashes, data versions/rights, source-offer URLs and rollback identity. CI does not substitute for product acceptance.

## Loaded authority

Default context plus the user's explicit repository-recovery assignment: `AGENTS.md`; `CORE_CONTEXT.md`; `LIVE_SESSION_BRIEF.md`; `CONTEXT_MANIFEST.yaml`; reconciliation pack `DOCUMENT_INDEX.md`, `DOC_INVENTORY.md`, `SYSTEM_VALIDATION_SPEC.md`, `UNIFIED_UNIVERSE_ARCHITECTURE.md`, `ARCHITECTURE_OVERVIEW.md`, `ENGINE_SPEC.md`, `ENGINE_CATALOG.md`, `OBJECT_MODEL.md`, `DATA_CONTRACTS.md`, `PROJECT_STATE.md`, `MASTER_PLAN.md`, `FEATURE_EXECUTION_MODEL.md`, `FEATURE_CATALOG.md`, `FEATURE_ACCEPTANCE.md`, `FEATURE_TRACKER.md`, `FEATURE_MIGRATION_MAP.md`; explicitly required `STACK_OVERVIEW.md`, `FAILURE_RECOVERY_PROTOCOL.md`; scoped frontend/backend AGENTS; current recovery Issue106 and native-satellite recovery receipt; current licensing readiness/source-offer audit. No broad document-content scan. Older live-brief task restrictions were surfaced as stale and superseded only by the explicit recovery assignment.
