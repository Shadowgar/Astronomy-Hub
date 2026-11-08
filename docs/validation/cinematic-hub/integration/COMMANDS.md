# Integrated qualification commands

Default Mode context and exact64-document list: `../context.json`. Existing dependencies reused; no install, provider spending or production actions.

```bash
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/cinematic-hub/hub
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/cinematic-hub/hub-second
R3_BASE=http://127.0.0.1:4216 R3_EVIDENCE=output/cinematic-hub/navigation timeout 240s node scripts/validation/verify_cinematic_hub.mjs
CIN_MODE_OUT=output/cinematic-hub/mode-overlay-red timeout 90s node scripts/validation/verify_cinematic_mode_overlay.mjs
CIN_MODE_OUT=output/cinematic-hub/mode-overlay-green timeout 90s node scripts/validation/verify_cinematic_mode_overlay.mjs
docker exec -e PYTHONPATH=/work -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work oras-cinematic-hub-backend python3 -m pytest -o cache_dir=/tmp/cinematic-hub-pytest backend/tests/test_solar_exploration.py -q
python3 output/cinematic-hub/verify-delivery.py
python3 output/cinematic-hub/verify-preservation.py
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
git diff --check
git status --short
git log --oneline -5
```

Pinned offline independent build:

```bash
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1:/work:ro -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1/output/cinematic-hub:/proof -w /work/frontend node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node --input-type=module -e 'globalThis.__dirname="/work/frontend";const{build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
```

Independent executed commands and full source/renderer/performance details are in `independent-review/REVIEW.md` and its preserved runners. The first integrated run failed on actual mobile pointer interception; focusedRED/GREEN and subsequent14/14each corrected-source run are separately retained. No timeout increase. Reviewer initialsearchwait failure remains unknown/unreproduced; nativefocus/Tab sampling races were corrected to await actual acknowledgements, without application timeout changes. Failed logs are never relabeled green.

Three builds136files, served136Hub/514Earth, frontend316/48files, TypeScriptPASS and Docker23passed/2existingdeprecationwarnings. ExistingVite largechunk advice remains in logs. Archived verifier/setup source is readable in `evidence/*.py.txt`; these operate in the task workspace with preserved private mounts/snapshots, not a clean-checkout production stack. Final exactHEAD/remote/served identity and independent docs-only follow-up are recorded in the PR and immutable task receipt after commit. No merge/deploy/R4.

The versioned reviewer bundle omits only its3.8MB duplicate full-context text; the exact context inventory remains versioned, and the original full-text artifact/hash manifest remain privately preserved. The curated reviewer manifest covers the included unchanged artifacts.
