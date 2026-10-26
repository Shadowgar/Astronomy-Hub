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
