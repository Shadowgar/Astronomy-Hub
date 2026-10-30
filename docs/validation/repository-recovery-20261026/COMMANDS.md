# Execution receipts

Commands below ran in `.worktrees/repository-recovery-20261026` unless noted. Raw capture root: `/tmp/astronomy-recovery-20261026`. Exact Docker mount/command arrays are in `receipts/preview-receipt.json` and `receipts/backend-test-command*.json`; collector/analyzer scripts record pagination and comparisons. They are replay evidence, not a request to repeat external writes.

## Inventory and preservation

```sh
git fetch --all --tags --no-prune
git fetch origin '+refs/pull/*/head:refs/recovery/20261026/pr/*'
python3 /tmp/astronomy-recovery-20261026/collect.py
python3 /tmp/astronomy-recovery-20261026/collect_remaining.py
python3 /tmp/astronomy-recovery-20261026/analyze.py
git worktree list --porcelain
git status --short
git diff --check
git merge --no-ff --no-commit origin/main
git bundle create output/recovery/repository-preservation.bundle --all
git bundle verify output/recovery/repository-preservation.bundle
sha256sum output/recovery/repository-preservation.bundle
```

The collector uses paginated GitHub REST reads for all PRs and branches, exact per-PR detail, commits/files/comments/reviews/checks, repository settings, rulesets, protection, workflows, environments and deployments. Additional GraphQL reads captured review threads. Main-protection GET returned 404 (unprotected); rulesets/deployments were empty. All 210 remaining historical-detail requests succeeded.

## Build and source tests

```sh
(cd frontend && npm ci --offline --no-audit --no-fund)
npm ci --offline --no-audit --no-fund
(cd frontend && npm test -- --run)
(cd frontend && npm run typecheck)
(cd frontend && npm run build -- --outDir ../output/recovery/hub)
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs tests/planet/*.test.mjs tests/runtime-protocol/*.test.mjs
python3 -m unittest discover -s tests/runtime -p test_native_satellite_source_stage.py -v
python3 scripts/runtime/apply_sky_overlay.py output/recovery/sky/upstream
python3 scripts/runtime/integrate_sky_bridge.py output/recovery/sky/upstream/apps/web-frontend
python3 scripts/runtime/record_sky_workspace.py output/recovery/sky/upstream/apps/web-frontend/dist
python3 scripts/runtime/record_runtime_versions.py /home/rocco/Astronomy-Hub/.worktrees/cinematic-earth-completion-1/output/earth-sky-completion/earth
ORAS_SKY_BUILD_DIR="$PWD/output/recovery/clean-sky" bash scripts/runtime/build_sky_horizon.sh
```

The UI reconstruction used `node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0`, network disabled, UID1001, isolated app at `/work`, qualified dependency cache mounted read-only, `ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/`, `ORAS_RUNTIME_COPY_SKYDATA=0`, `NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096'`, and `npm run build`. Clean native reconstruction command is completely specified by the retained build script and renderer lock.

## Docker backend tests

```sh
docker exec -e PYTHONPATH=/work -w /work oras-repository-recovery-20261026-backend python3 -m pytest backend/tests -q -p no:cacheprovider
python3 /tmp/astronomy-recovery-20261026/backend_tests.py
python3 /tmp/astronomy-recovery-20261026/backend_tests_final.py
```

First command: 619 passed,57 failed,14 skipped. Disposable corrected full run:678 passed,12 skipped. Test fixture writes were redirected to a task-owned archive and lock path. Existing runtime science remained read-only; final archive was made with `git archive 0075b2011a0c8ccf51a271972e054998555ee708`. Exact final run result is retained separately. Fixtures use the historical catalog expected by those tests; fresh-data correctness is separate native/API evidence, never inferred from historical fixture success.

## Browser

```sh
node output/playwright/recovery/smoke.mjs
PS_URL=http://127.0.0.1:4230 PS_OUT=output/playwright/recovery/planetary node scripts/validation/verify_ps3_cross_systems.mjs
CIN_SKY_BASE=http://127.0.0.1:4230 CIN_SKY_OUT=output/playwright/recovery/sky-controls node scripts/validation/verify_cinematic_sky_acceptance.mjs
node output/playwright/recovery/earth-search.mjs
node output/playwright/recovery/native-inventory.mjs
node output/playwright/recovery/native-count.mjs
PS_URL=http://127.0.0.1:4230 PS_OUT=output/playwright/recovery/native-moon PS_VIEWPORT=1440x900 node scripts/validation/verify_ps3_earth_native.mjs
CIN_SKY_BASE=http://127.0.0.1:4230 CIN_SKY_OUT=output/playwright/recovery/sky-search-final node scripts/validation/verify_cinematic_sky.mjs
```

Legacy `R4_URL=http://127.0.0.1:4230 node scripts/validation/verify_r4_earth_return.mjs` failed waiting for a direct Moon button no longer present after PS1–3; the current planetary-system journey passed. Initial Sky exact-text lookup selected an unsuitable hidden result; visible-row diagnostics established API200/native results. The corrected real pointer run then reproduced landscape-mobile interception, followed by the scoped CSS repair and a three-viewport green rerun. No forced pointer clicks were used.

## Dependency/security checks

```sh
(cd frontend && npm audit --json)
(cd integrations/sky-overlay/apps/web-frontend && npm audit --json)
(cd /tmp/astronomy-recovery-20261026/dependency-pr-76 && npm ci --offline --ignore-scripts --no-audit --no-fund)
(cd /tmp/astronomy-recovery-20261026/dependency-pr-77 && npm ci --ignore-scripts --no-audit --no-fund)
```

PR76: ERESOLVE. PR77: install and build passed; additionally built inside the same pinned Node20 image with network disabled and the build environment above. Neither lockfile was promoted. Audit reports are not clean and remain explicit release blockers.

## Remote reconciliation and final verification

Published only `recovery/reconcile-20261026` with `git push -u origin recovery/reconcile-20261026`; opened draft107 through the connected GitHub create-pull-request tool. For each of the23 preserved, unchanged heads, added its factual C disposition and called update-pull-request with state closed. No merge/delete API was called. `receipts/closures.json` and the fresh paginated snapshot confirm actual results.

```sh
python3 /home/rocco/.codex/skills/gh-fix-ci/scripts/inspect_pr_checks.py --repo . --pr 107 --max-lines 100 --context 20
python3 /tmp/astronomy-recovery-20261026/final_snapshot.py
```

Initial hosted CI:218 passed/40 failed because two pinned upstream Earth modules were absent from the runner. The repair retrieves the exact God’s Eye SHA from the renderer lock and passes GODS_EYE_SOURCE to unchanged tests. Existing checkout cleanup also reported an inherited unconfigured `third_party/spectorjs` gitlink; no submodule source was silently replaced. Docker preservation compares mounts by destination and stable lifecycle/health status, excluding rolling health-log entries; the initial order-sensitive diagnostic was corrected, not treated as actual container mutation.

Exact raw test/build logs are preserved as `receipts/*.log.gz` to retain original bytes (including whitespace and terminal sequences) without treating them as source diffs. Read with `gzip -cd <receipt.log.gz>`.

```sh
gh api repos/BabylonJS/Spector.js/commits/563813ea5269b53b1b27621580a50dc5f8b9fe58 --jq '{sha:.sha,url:.html_url,message:.commit.message}'
git submodule foreach --recursive true
git ls-tree HEAD third_party/spectorjs
```

Restoring the missing `.gitmodules` metadata for the already-recorded, upstream-verified Spector.js pin fixed the checkout failure without changing or initializing that dependency. Local red exit128 and green exit0 logs are retained.

## Final application revision e1bd2e57

```sh
python3 /tmp/astronomy-recovery-20261026/backend_tests_qualified.py
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs tests/planet/*.test.mjs tests/runtime-protocol/*.test.mjs
(cd frontend && npm test -- --run && npm run typecheck)
node output/playwright/recovery/smoke.mjs
node output/playwright/recovery/native-count.mjs
python3 /tmp/astronomy-recovery-20261026/final_snapshot.py
```

The disposable backend archive is e1bd2e57:679 passed,12 skipped,38 warnings. Node:258 passed. Frontend concurrent run:382 passed,2 timeouts at the existing5000ms threshold; sequential rerun:384 passed across58 files, typecheck exit0. No timeout settings were changed. The earlier Hub/Sky build remains applicable because final API/CI repairs did not change those runtime sources/artifacts. API HTTP check:invalid request400 with fixed public message, feed200 with15,901 fresh records and the recorded release hash at08:17UTC. CodeQL and both hosted source jobs passed at e1bd2e57; original failing logs and annotations remain retained.

The exact regression invocation and Docker test environment are in `receipts/backend-test-command-qualified.json`; controlled-error red/green logs are `api-exception-red.log.gz` and `api-exception-green.log.gz`. Full changed-path manifest: [CHANGED_FILES.txt](CHANGED_FILES.txt).

Final owner-status comparison explicitly sets cwd to the owner checkout. An earlier invocation from the candidate compared the wrong working directory and returned a false status mismatch; direct owner status and all original worktree comparisons confirmed unchanged settings and HEAD.
