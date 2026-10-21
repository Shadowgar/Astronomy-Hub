# Executed qualification commands

Working directory: `.worktrees/r3-a-cinematic-solar-1`, baseline `7aaeeef4`.
The original PR81/82 and owner checkout are preserved. No package installation.
Versioned text logs trim trailing whitespace only; raw outputs remain in the task output directory.
The commands below produced the versioned logs/JSON in this package; source-sensitive
browser evidence is tied to255 inputs in `evidence/navigation.json`, including both
source assets. Final exact-head verifier does not re-execute historical browser tests.

```bash
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
npm --prefix frontend test -- --run tests/solarContracts.test.ts tests/solarPresentation.test.ts
npm --prefix frontend run typecheck
npm --prefix frontend test
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye node --test --test-concurrency=1 tests/runtime/*.test.mjs tests/earth/*.test.mjs
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release timeout 30s .venv/bin/python -m pytest backend/tests/test_solar_exploration.py -q
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/solar-cinematic/hub-first
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/solar-cinematic/hub-second
python3 scripts/validation/start_solar_cinematic_preview.py
docker exec -e PYTHONPATH=/work -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work oras-solar-cinematic-backend python3 -m pytest -o cache_dir=/tmp/cinematic-pytest-cache backend/tests/test_solar_exploration.py backend/tests/test_planetary_ephemeris_service.py backend/tests/test_planetary_ephemeris_provider.py -q
node scripts/validation/verify_solar_cinematic.mjs
R3_EVIDENCE=output/playwright/solar-cinematic-navigation timeout 240s node scripts/validation/verify_cinematic_navigation.mjs
timeout 90s node scripts/validation/verify_cinematic_lifecycle.mjs
R3_IDENTITY_EVIDENCE=output/playwright/cinematic-identity timeout 90s node output/solar-cinematic/run_identity.mjs
R3_RACE_EVIDENCE=output/playwright/cinematic-history-race timeout 40s node output/solar-cinematic/run_history_race.mjs
R3_ENTRY_EVIDENCE=output/playwright/cinematic-entry-race timeout 90s node output/solar-cinematic/run_entry_race.mjs
python3 scripts/validation/verify_cinematic_delivery.py --candidate
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git status --short
git diff --check
git diff --cached --check
```

`verify_cinematic_returns.py` reproduces the exact3 private runners above from the
unchanged original R3 suites, with only4210→4211 and opening the new time dialog.
Those genuine-response identity/race suites were executed as the listed three Node
commands; the added orchestration wrapper is a reproducibility aid, not an additional
fresh suite pass. Native navigation similarly preserves assertions from the prior14
checks per viewport; selector changes follow new collapsed details/time UI. No timeouts
were increased. Actual dialog/source/texture/keyboard checks use the new focused suite.

Independent offline pinned Docker reproduction (existing legacy Vite config uses
`__dirname`; task-only wrapper supplies it without changing application configuration):

```bash
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/r3-a-cinematic-solar-1:/work:ro -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro -v /home/rocco/Astronomy-Hub/.worktrees/r3-a-cinematic-solar-1/output/solar-cinematic:/proof -w /work/frontend node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node --input-type=module -e 'globalThis.__dirname="/work/frontend";const{build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
```

Fresh before screenshots were captured from unchanged PR81 Docker4210 with the
same1440×900/390×900 viewports and UTC, selecting overview/Earth/Mars/close/sources;
no original scene code was changed. Source geometry diagnostics are in `before.json`.
RED layout proof invoked the new browser suite with `CINEMATIC_BASE=http://127.0.0.1:4210`
and failed the full-viewport assertion before implementation. Initial helper RED3
and portrait RED1 are retained. Failed sandbox/startup/tolerance attempts are explicitly
classified in the README, not counted as passing runs.

After the qualified implementation commit, exact committed source and served bytes:

```bash
python3 scripts/validation/verify_cinematic_delivery.py
git status --short
git log --oneline -5
git rev-parse HEAD
git ls-remote origin refs/heads/r3-a-cinematic-solar-1
```

No broad backend sweep, old N1 timeout investigation, production deployment, unrelated
service restart, resource pruning or native artifact rebuild was performed.

## Review-driven responsive correction

```bash
CINEMATIC_COMPACT_EVIDENCE=output/playwright/solar-cinematic-compact-red timeout 90s node scripts/validation/verify_cinematic_compact.mjs
timeout 90s node scripts/validation/verify_cinematic_compact.mjs
CINEMATIC_EVIDENCE=output/playwright/solar-cinematic-reviewed timeout 90s node scripts/validation/verify_solar_cinematic.mjs
R3_EVIDENCE=output/playwright/solar-cinematic-reviewed-navigation timeout 240s node scripts/validation/verify_cinematic_navigation.mjs
```

The same three build commands above ran again after the single CSS correction, writing
`review-build-{first,second,docker}.log`. No timeout was increased. The original RED
runner predates the additive effects-button reachability assertion/hash capture; it
fails on the first blocked Overview pointer target. GREEN includes all controls and
source hashes. Docs/link/artifact/preservation checks ran again for the delivery SHA.
