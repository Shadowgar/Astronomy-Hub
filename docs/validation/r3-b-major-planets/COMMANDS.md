# R3-B qualification commands

Working directory: `.worktrees/r3-b-major-planets-1`.

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/r3b/hub
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/r3b/hub-second
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release PYTHONPATH=. /home/rocco/Astronomy-Hub/.venv/bin/python scripts/validation/compare_r3b_ephemerides.py
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_solar_exploration.py -q -k 'not route'
timeout 150s node scripts/validation/verify_r3b_major_planets.mjs
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
git status --short
git diff --check
```

Docker science command (authoritative route qualification):

```bash
docker run --rm --network none \
  -v /home/rocco/Astronomy-Hub/.worktrees/r3-b-major-planets-1:/work:ro \
  -v /home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release:/runtime/planetary-ephemeris:ro \
  -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work \
  sha256:00e343c5943ae02f94c5312d17fec4ab6c5aaa2376d27ce9ff2486793dc15c6a \
  python3 -m pytest backend/tests/test_solar_exploration.py -q -p no:cacheprovider
```

Third reproducible build:

```bash
docker run --rm --network none --user 1001:1001 \
  -v /home/rocco/Astronomy-Hub/.worktrees/r3-b-major-planets-1:/work:ro \
  -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro \
  -v /home/rocco/Astronomy-Hub/.worktrees/r3-b-major-planets-1/output/r3b:/proof \
  -w /work/frontend \
  node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 \
  node --input-type=module -e 'globalThis.__dirname="/work/frontend";const{build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
```

A Python verification hashed every file under `output/r3b/hub`, compared it with both `hub-second` and `hub-docker`, fetched the corresponding `http://127.0.0.1:4215/` path and asserted identical SHA256. All136 files passed; the complete path/hash receipt is retained. No historical browser proof was relabeled fresh. The two baseline screenshots are explicitly reused from b68.
