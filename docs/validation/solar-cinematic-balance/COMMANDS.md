# Exact commands and results

Working directory `.worktrees/cinematic-hub-integration-1`. No test timeout was increased. Browser jobs were serialized. Logs retain original UTF-8 bytes through JSON strings plus SHA256; proof statuses remain unchanged.

```bash
npm --prefix frontend test
npm --prefix frontend run typecheck
docker exec -e PYTHONPATH=/work -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work oras-cinematic-hub-backend python3 -m pytest -o cache_dir=/tmp/cinematic-acceptance-pytest backend/tests/test_solar_exploration.py -q
```

336/51frontend tests/files pass, TypeScript exit0, Docker23passed/2existing warnings: [frontend](evidence/frontend-tests.log.json), [types](evidence/typecheck.log.json), [science](evidence/docker-science.log.json).

```bash
SOLAR_OUT=output/solar-cinematic-balance/presentation-qualified timeout 120s node scripts/validation/verify_solar_cinematic_presentation.mjs
timeout 120s node scripts/validation/measure_solar_cinematic_balance.mjs
SOLAR_OUT=output/solar-cinematic-balance/browser-final-hud-qualified timeout 240s node scripts/validation/verify_solar_scientific_controls.mjs
SOLAR_OUT=output/solar-cinematic-balance/approach-final timeout 60s node scripts/validation/verify_solar_approach_motion.mjs
SOLAR_OUT=output/solar-cinematic-balance/transition-final timeout 60s node scripts/validation/verify_solar_transition_limits.mjs
SOLAR_OUT=output/solar-cinematic-balance/camera-final timeout 60s node scripts/validation/verify_solar_camera_state.mjs
CINEMATIC_BASE=http://172.26.23.204:4218 CINEMATIC_LIFECYCLE_EVIDENCE=output/solar-cinematic-balance/lifecycle-final timeout 180s node scripts/validation/verify_cinematic_lifecycle.mjs
SOLAR_OUT=output/solar-cinematic-balance/epoch-final timeout 120s node scripts/validation/verify_solar_epoch_precision.mjs
```

[32cinematic groups](evidence/presentation-qualified.json), [3actual36-step performance cases](evidence/performance.json), [184default/physical groups](evidence/browser-qualified.json), [2approaches](evidence/approach-qualified.json), [2transitions+interruption](evidence/transition-qualified.json), [Custom resize](evidence/camera-qualified.json), [7lifecycle groups](evidence/lifecycle-qualified.json), [8epoch entries](evidence/epoch-qualified.json). The general approach script uses Linux4217; the other scripts use private4218. Both serve identical bytes. Real Docker API; controlled epochs/wall clocks labeled; original assets. Current-source final proof receipts match the five delivery source hashes.

```bash
node /tmp/profile-solar-balance.mjs
npm --prefix frontend test -- tests/solarCinematicScale.test.ts
npm --prefix frontend test -- tests/solarCinematicScale.test.ts tests/solarAcceptance.test.ts tests/solarScientificView.test.ts
```

The initial one-off [profile script](evidence/profile-solar-balance.mjs) measured both4217 and older4216; [aggregates](evidence/performance-initial.json) identify the differing sources/defaults, not a matched GPU benchmark. A later retained155e7df9 static-byte interception comparison failed API fetching/15s readiness; its failure remains retained and this path was abandoned. Actual served-candidate measurement succeeded after replacing a strict-float target assertion with1e-12AU tolerance; original failure retained. No product change to hide that roundoff.

New display-budget/rectangle tests had genuine red→green cycles: [missing helper red](evidence/unit-red.log.json), [budget red](evidence/budget-red.log.json), [rectangle red](evidence/rectangle-red.log.json), [focused green](evidence/unit-green.log.json). The original8px aesthetic threshold failure is retained and explained in the report; revised functional disk-resolution criteria do not claim visual acceptance.

```bash
npm --prefix frontend run build -- --outDir ../output/solar-cinematic-balance/hub --emptyOutDir
npm --prefix frontend run build -- --outDir ../output/solar-cinematic-balance/hub-second --emptyOutDir
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1:/work:ro -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1/output/solar-cinematic-balance:/proof -w /work/frontend node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node --input-type=module -e 'globalThis.__dirname="/work/frontend";const{build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
python3 output/solar-cinematic-balance/verify-delivery.py
python3 output/cinematic-acceptance/verify-preservation.py
```

Three identical136-file builds; existing large-chunk warning retained in [first](evidence/build-first.log.json), [second](evidence/build-second.log.json), [Docker](evidence/build-docker.log.json). [Byte verification script](evidence/verify-delivery.py), [receipt](evidence/delivery.json), [preservation](evidence/preservation.json). Original qualified build trees remain intact.

```bash
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
```

[Exact validator output](evidence/document-validation.log.json); original archive/four PNGs/NASA asset bytes/UVs unchanged. [Context inventory](context.json), [complete changed paths](FILES_CHANGED.txt). Postcommit local/remote/served identities and independent exact-head review are recorded in PR88; the precommit receipts' HEAD is explicitly the capture baseline, with source hashes identifying the candidate.

Windows-host read-only access:

```powershell
$ErrorActionPreference="Stop"
(Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "http://172.26.23.204:4218/solar-system").StatusCode
(Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "http://172.26.23.204:4218/evidence/solar-cinematic-balance/gallery/index.html").StatusCode
```

Both HTTP200: [raw output](evidence/windows-preview.log.json). All20reference/actual image responses match their original versioned PNG SHA256. Reference images reuse the unchanged previous gallery copies, without introducing duplicate/modified original assets.
