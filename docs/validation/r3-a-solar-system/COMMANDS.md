# R3-A executed qualification commands

Working directory: `.worktrees/r3-a-solar-system-1`, base PR80 at23f5c41f.
Source/authority inspection commands and failed intermediate probes are classified
in the README. These are qualification commands; counts are actual, not inferred.

```bash
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
git diff --cached --check
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release .venv/bin/python -m pytest backend/tests/test_solar_exploration.py -q
npm --prefix frontend test -- --run tests/solarContracts.test.ts
npm --prefix frontend run typecheck
npm --prefix frontend test
GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye node --test --test-concurrency=1 tests/runtime/*.test.mjs tests/earth/*.test.mjs
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/r3-a/hub-first
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/r3-a/hub-second
python3 scripts/validation/start_r3_preview.py
docker exec -e PYTHONPATH=/work -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work oras-r3-a-backend python3 -m pytest -o cache_dir=/tmp/r3-pytest-cache backend/tests/test_solar_exploration.py backend/tests/test_planetary_ephemeris_service.py backend/tests/test_planetary_ephemeris_provider.py -q
R3_EVIDENCE=output/playwright/r3-a-qualified timeout 240s node scripts/validation/verify_r3_solar.mjs
R3_IDENTITY_EVIDENCE=output/playwright/r3-identity-green timeout 90s node scripts/validation/verify_r3_identity.mjs
python3 scripts/validation/verify_r3_delivery.py
```

Offline pinned Docker reproduction (existing legacy Vite config uses `__dirname`;
the task-only wrapper supplies that global; application configuration is preserved):

```bash
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/r3-a-solar-system-1:/work:ro -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro -v /home/rocco/Astronomy-Hub/.worktrees/r3-a-solar-system-1/output/r3-a:/proof -w /work/frontend node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node --input-type=module -e 'globalThis.__dirname="/work/frontend";const {build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
```

Broad backend sweep (INCOMPLETE; not a mandatory focused Solar PASS):

```bash
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests -q
ln -s /home/rocco/Astronomy-Hub/.venv .venv
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release timeout 180s /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests -q --tb=short
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release timeout 20s /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_phase2_provider_cache_ttl.py -q --tb=short
```

The isolated TTL file also ran on unchanged PR80 with
`PYTHONDONTWRITEBYTECODE=1` and `-p no:cacheprovider`; identical1FAIL/3PASS.
No broader repeat, native rebuild, N1 timeout investigation, unrelated service
change or data/provider modification followed.
