# Commands and qualification boundaries

Working directory: `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`.
Loaded context and the explicit2.2 override are listed in [PLAN.md](PLAN.md).
The owner checkout's existing `.vscode/settings.json` modification is untouched.

```sh
git status --short
git rev-parse HEAD
git ls-remote origin refs/heads/recovery/reconcile-20261026 refs/heads/main
python3 -B -m unittest discover -s scripts/validation -p test_recover_owner_preview.py -v
python3 -B scripts/validation/recover_owner_preview.py
npm test --prefix frontend
npm run type-check --prefix frontend
npm run build --prefix frontend
git diff --check
docker build --target build -f frontend/Dockerfile.production -t astronomy-hub-solar22-build-proof .
docker run --rm --network none --read-only --tmpfs /tmp \
  -e PYTHONDONTWRITEBYTECODE=1 -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/ephemeris \
  -v /home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026:/app:ro \
  -v /home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release:/runtime/ephemeris:ro \
  --workdir /app 00e343c5943a python -m pytest \
  backend/tests/test_solar_earth_frame.py backend/tests/test_solar_motion.py \
  -q -W error -p no:cacheprovider
```

Results: recovery guards5PASS; frontend599PASS/81files; types/build/diffcheck exit0;
Docker science7PASS. Existing Vite large-chunk warning remains. Source generation,
four source checks and loader11-test commands are recorded in [SOURCES.md](SOURCES.md).
Only bounded NASA source acquisition occurred; no scientific pack was rebuilt.

Windows scripts use Windows Node and headed Microsoft Edge, not Linux SwiftShader.
Each ran serially, with the NVIDIA renderer checked. The command pattern was:

```sh
'/mnt/c/Program Files/nodejs/node.exe' \
  "$(wslpath -w "$PWD/scripts/validation/verify_solar22_visuals.mjs")" \
  http://localhost:4231 \
  "$(wslpath -w "$PWD/output/playwright/solar-system-2.2/visuals")" \
  "$(wslpath -w "$PWD/output/playwright/solar-system-2.2/preview/browser.json")"
```

The same invocation pattern executed `verify_solar22_journeys.mjs` (27groups),
`verify_solar22_earth.mjs` (10views), `verify_solar22_travel.mjs` (3layouts) and
`verify_solar22_streaming.mjs` (6cases), using their respective output directories.
[STREAMING.md](STREAMING.md) and [PERFORMANCE.md](PERFORMANCE.md) give exact special
arguments and distinguish controlled barriers from natural browser behavior.

## Retained failures and corrections

- Three initial travel tests failed: late target acquisition, fixed duration and
  edge-on Saturn framing. The first interpolation correction introduced eight
  planet→Sun collisions, independently reproduced. The staged correction passes
  all72 ordered journeys; the committed73-test matrix preserves every-frame clearance.
- Material tests initially failed5new cases; corrections pass. Independent review
  exposed the Efficient nonlinear-blending gap, corrected with a common linear target.
- Streamer tests exercise cancellation before and during decode. The uncancellable
  native decode now retains its reservation until its bitmap actually closes.
- The first visual comparison asserted exact floating-point array equality and
  failed on~1e-15AU restoration roundoff. It now enforces a recorded1e-12AU tolerance.
- The first streaming run exposed harness readiness/transport classifications,
  not a proven renderer failure: Eros initially became available between samples;
  completed Takram streaming could report a reader-cancel abort. The corrected
  harness requires source readiness and narrowly records validated completed-LUT
  cancellation; unrelated errors still fail. Initial receipts remain in `output/`.
- A Docker artifact comparison was attempted before tar export had exited; it
  failed with unexpected-end-of-data. After the export exited0, all284 files matched.
- A broader Docker source inventory initially treated intentionally excluded skydata
  as a build failure. Checking the actual `.dockerignore` accounts for3747 mounted
  skydata files,15dev artifacts and2test-result files; all654 included inputs match.
- Final gallery inspection found portrait overflow from the unwrapped full SHA.
  The gallery now wraps code text; the corrected test compares against actual
  clientWidth rather than the viewport including its scrollbar. Desktop1425/1425
  and portrait375/375 pass, with40images/3videos loaded in each. Initial evidence
  is retained as a failure. No application rendering changed.
- A stronger intermediate corona produced visible fans and was rejected after
  actual pixel inspection. Its images remain in `visuals-corona-iteration/`.

No failing assertion was suppressed to obtain a success status. No review thread,
security alert or warning was manually dismissed. Local receipts and full recordings
remain under `output/playwright/solar-system-2.2/`; selected durable evidence is here.
