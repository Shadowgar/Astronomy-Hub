# Exact qualification commands and retained failures

Working directory `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`.
This is the existing recovery branch, not a new branch. Loaded authority: PLAN.
All source/data mounts below are read-only. No protected container/volume change.

## Local tests and builds

```bash
git rev-parse HEAD
git branch --show-current
git status --short
git diff --check
npm test --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend -- --outDir ../output/playwright/owner-acceptance/hub-solar211
uv run --offline --with pillow==12.3.0 python -m unittest discover -s scripts/planetdata -p test_lunar_context.py -v
/home/rocco/Astronomy-Hub/.venv/bin/python -B -m unittest discover -s scripts/planetdata -p test_prepare_lunar_3d_tiles.py -v
docker build --target build -f frontend/Dockerfile.production -t astronomy-hub-solar211-build-proof .
```

Starting HEAD exactly`ed0c81f785c6da68183e757ff381eba2727a2007`, clean existing
branch. Final frontend504tests/77files PASS, typecheck exit0, Vite build exit0
(existing chunk-size advisory). Context3tests PASS; original tile conversion10PASS.
Production Docker build PASS. Detailed local logs remain under`output/solar211-*`.
A final command audit caught plain systemPython missingNumPy; it failed import.
The documented existing projectvenv command above was rerun and passes10/10.
No runtime dependency/lock change. SystemPython/rootvenv lackedPillow; first offline
uv attempt failed. A development-only isolated`uv run --with pillow==12.3.0`
installedPillow12.3.0; following offline source/reprojection tests pass.

Context artifact uses only the existing pinned WACsource:

```bash
uv run --offline --with pillow==12.3.0 python scripts/planetdata/build_lunar_context.py \
 /home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-surface/release/moon-wac.png \
 frontend/src/features/terrain/assets/moon-context.png \
 --receipt docs/validation/solar-system-2.1.1/evidence/moon-context-source.json
```

Independent rebuild matches exactPNG;85GLB hashes match original source manifest.
No source geometry/DTM/imagery tiles were rebuilt. Acquisition/vertex/frame proof
from2.1 remains valid for unchanged source; see SOURCE_CONTEXT_REVIEW and its audit.

## Authoritative Docker science

```bash
docker run --rm --network none --read-only --tmpfs /tmp \
 -e PYTHONDONTWRITEBYTECODE=1 \
 -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/ephemeris \
 -v /home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026:/app:ro \
 -v /home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release:/runtime/ephemeris:ro \
 --workdir /app 00e343c5943a python -m pytest \
 backend/tests/test_solar_earth_frame.py backend/tests/test_solar_motion.py \
 -q -W error -p no:cacheprovider
```

**7 passed in4.61s.** Unchanged source frame also retains independent2.1
1,736rotation/0.0112814arcsec sampled interpolation evidence; not rerun as a new
physical accuracy claim. No full backend-suite pass is claimed (prior unrelated
legacy TestClient/AnyIO warning-clean collection gap remains).

## Actual private runtime

Only existing task-owned stopped containers restarted after host restart:
`docker start pr107-owner-backend pr107-owner-preview`. Preview root changed to
`/owner-review/hub-solar211`; tested/reloaded existing nginx. Listener remains
127.0.0.1:4231 and original backend/data/native runtime read-only mounts remain.
Old2.1 alias`solar21.localhost:4231` and all previous rollback aliases unchanged.

Vite controlled source fixture (first root-path attempt failed127, corrected):

```bash
cd frontend
VITE_DEV_PROXY_TARGET=http://127.0.0.1:4231 \
ORAS_EARTH_PROXY_TARGET=http://127.0.0.1:4231 \
ORAS_PLANET_PROXY_TARGET=http://127.0.0.1:4231 \
./node_modules/.bin/vite --host 127.0.0.1 --port 4235
```

## Windows Edge / NVIDIA

All commands below run the actual WindowsNode22.14 executable, visible Edge and
ANGLE NVIDIA RTX3060/D3D11 (not SwiftShader). Viewport sizes simulate phones on
that GPU; physical iPhone is unverified. Windows script/output paths use`wslpath`.
No simultaneous browser/test loads during dedicated Earth benchmarks.

```bash
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar211_depth.mjs")" http://127.0.0.1:4235 "$(wslpath -w "$PWD/output/playwright/solar-system-2.1.1/depth-2000au-green/proof.json")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar211_isolation.mjs")" http://solar21.localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.1.1/isolation-before-full")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar211_isolation.mjs")" http://127.0.0.1:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.1.1/isolation-after-full")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar211_application.mjs")" http://127.0.0.1:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.1.1/earth-portrait")" 390 844
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar211_application.mjs")" http://127.0.0.1:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.1.1/earth-landscape")" 844 390
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar21_failures.mjs")" http://127.0.0.1:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.1.1/earth-failures")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/frontend/tests/terrain211.browser.mjs")" http://127.0.0.1:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.1.1/terrain-final-r3")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/benchmark_solar21.mjs")" http://solar21.localhost:4231 "$(wslpath -w "$PWD/docs/validation/solar-system-2.1.1/evidence/performance-before.json")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/benchmark_solar21.mjs")" http://127.0.0.1:4231 "$(wslpath -w "$PWD/docs/validation/solar-system-2.1.1/evidence/performance-after.json")"
```

Desktop matching application used the same2.1capture harness plus default image,
retained`output/solar211-before.mjs`; output`before`and`earth-corrected`.
Fresh exact2000AUred used`output/solar211-depth-baseline.mjs`, same tracked fixture
but importing`frontend/dev/solar211-baseline/solarTakram.ts`, extracted by
`git show ed0c81f785c6da68183e757ff381eba2727a2007:frontend/src/features/solar/solarTakram.ts`.
Red exits1, green exits0; no fake scientific responses. Earlier200AUproof also
red/green, but not substituted for the exact2000AU proof. Isolation hooks are
injected by Playwright using Three's existing devtools observation event; no
production debug switch was added.

Terrain final result:**pass=true,10checks,errors=[]**. Includes all3layouts,
LOD3through real control zoom, native Moon exact camera/UTC, context restore,
short portrait2cases, locator503, root tile503retry and Solar/Earth/Sky exits.
Earth failures:**3groupsPASS**, missingLUT/framefallback and actual advancing
JPL/frame/time plus1kmzoom/Efficientfallback. Source payloads are not mocked.

## Retained failed attempts and independent corrections

- Initial added constructor Camera type failedTS2709 under existing ambientThree
  types; corrected to repository-compatible camera type, final typecheck passes.
- Initial capture helper polled nonexistent diagnostics fields; corrected to
  visibleTiles/transport. Original before captures are real, not passing assertions.
- Review found shortportrait collapse, hidden landscape disclosure and unguarded
  locator image failure. Corrected and all actual Windows cases now pass.
- Initial Overview clipped crop edges. New bounding-sphere regression failed
  (`2253.24 > 3620.39`false), then passed with limitingFOVfit; final actual3views fit.
- First full terrain test assumed Approach always loadsLOD3 regardless of pixel
  height. Landscape correctly chose a coarserLOD; test now uses real+zoom until
  source leaf detail is appropriate. Product LODpolicy was not forced.
- Second full run had six successfulgroups then real tile503Retry failure.
  Focused original reproduction throws`Cannot read properties of undefined
  (reading 'loadingState')`. Independent actual0.5.3source reproduction saved.
  Existing remount correction passes finalretry withcamera/UTC/disposal assertions.
- Browser error listeners now also cover the retry context, so thrown errors cannot
  disappear behind a readiness timeout. Failed receipts remain in localoutput.

Separate reviewers implemented neither correction. Their source/numerical and
actual-image/receipt dispositions are REVIEW_ATMOSPHERE and REVIEW_TERRAIN.
Hosted exact-head CI/CodeQL status and finalSHA are recorded factually on PR107.
