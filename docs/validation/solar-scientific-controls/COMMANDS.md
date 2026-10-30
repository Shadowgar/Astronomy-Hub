# Exact commands and evidence

Working directory `.worktrees/cinematic-hub-integration-1`. Existing timeouts were not increased. Browser jobs ran serially. The original API/asset error injections are limited to the named lifecycle cases. Terminal logs are retained losslessly as UTF-8 JSON strings with original SHA256; raw proof statuses remain intact.

```bash
npm --prefix frontend test
npm --prefix frontend run typecheck
docker exec -e PYTHONPATH=/work -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work oras-cinematic-hub-backend python3 -m pytest -o cache_dir=/tmp/cinematic-acceptance-pytest backend/tests/test_solar_exploration.py -q
```

331tests/50files passed; TypeScript exit0; Docker23passed with2existing warnings. [Frontend log](evidence/frontend-tests.log.json), [typecheck](evidence/typecheck.log.json), [science API](evidence/docker-science.log.json).

```bash
SOLAR_OUT=output/solar-scientific-controls/browser-final-qualified timeout 240s node scripts/validation/verify_solar_scientific_controls.mjs
SOLAR_OUT=output/solar-scientific-controls/approach-qualified timeout 60s node scripts/validation/verify_solar_approach_motion.mjs
SOLAR_OUT=output/solar-scientific-controls/transition-qualified timeout 60s node scripts/validation/verify_solar_transition_limits.mjs
SOLAR_OUT=output/solar-scientific-controls/camera-qualified timeout 60s node scripts/validation/verify_solar_camera_state.mjs
CINEMATIC_BASE=http://172.26.23.204:4218 CINEMATIC_LIFECYCLE_EVIDENCE=output/solar-scientific-controls/lifecycle-qualified timeout 180s node scripts/validation/verify_cinematic_lifecycle.mjs
SOLAR_OUT=output/solar-scientific-controls/epoch-qualified timeout 120s node scripts/validation/verify_solar_epoch_precision.mjs
```

[176geometry/navigation groups](evidence/browser-qualified.json), [2approaches](evidence/approach-qualified.json), [2destination transitions +interruption](evidence/transition-qualified.json), [custom resize](evidence/camera-qualified.json), [7lifecycle groups and software frame timing](evidence/lifecycle-qualified.json), [8current-time entries](evidence/epoch-qualified.json). The general approach script defaults to Linux4217; the other new scripts use the private4218 owner address; both serve identical bytes.

```bash
npm --prefix frontend run build -- --outDir ../output/solar-scientific-controls/hub --emptyOutDir
npm --prefix frontend run build -- --outDir ../output/solar-scientific-controls/hub-second --emptyOutDir
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1:/work:ro -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1/output/solar-scientific-controls:/proof -w /work/frontend node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node --input-type=module -e 'globalThis.__dirname="/work/frontend";const{build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
python3 output/solar-scientific-controls/verify-delivery.py
python3 output/cinematic-acceptance/verify-preservation.py
```

Three identical136-file builds; all136served bytes at both addresses match. [Verification script](evidence/verify-delivery.py), [receipt](evidence/delivery.json), [preservation](evidence/preservation.json). The first publish correctly refused a138-file output containing stale Vite chunks; rebuilding with `--emptyOutDir` corrected that harness/output issue. Original qualified builds were preserved. Existing large-chunk build warning remains in the complete [host](evidence/build-first.log.json), [second](evidence/build-second.log.json) and [Docker](evidence/build-docker.log.json) logs.

```bash
npm --prefix frontend test -- tests/solarScientificView.test.ts tests/solarAcceptance.test.ts tests/solarPresentation.test.ts tests/solarRefinement.test.ts tests/solarExpansion.test.ts
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
```

Focused21/21green; genuine prior failure receipts and red/green unit logs are retained. Documentation/asset validator outputs are recorded in [validation log](evidence/document-validation.log.json). Final git identities/exact-head review are recorded in PR88 after commit; source hashes in these precommit receipts identify the precise qualified source without pretending the then-current baseline commit included those changes.

The Windows-host access check was read-only:

```powershell
$ErrorActionPreference="Stop"
(Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "http://172.26.23.204:4218/solar-system").StatusCode
(Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "http://172.26.23.204:4218/evidence/solar-scientific-controls/gallery/index.html").StatusCode
```

Both HTTP200, [raw output](evidence/windows-preview-check.log.json). All20 served gallery files were byte-matched to the versioned18original-byte PNGs plus HTML/manifest. The first gallery publication targeted the wrong directory beneath the existing evidence mount and returned404; publishing to that mount's actual `output/solar-scientific-controls/gallery` path corrected the evidence path without any application/service modification. The working application already returned200.
