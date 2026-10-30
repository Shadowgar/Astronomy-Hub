# Commands and qualification outcomes

Run from `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`.
Loaded authority and task pack are listed in [PLAN.md](PLAN.md); no full docs scan.
The explicit Solar2 owner directive supersedes prior review-only stop points.

## Supporting source/build checks

```sh
npm test --prefix frontend
# 69 files, 463 tests PASS (final source, 2026-10-28 01:27 local)
npm run typecheck --prefix frontend
# tsc --noEmit exit0
npm run build --prefix frontend -- --outDir ../output/playwright/owner-acceptance/hub-solar2 --emptyOutDir
# exit0; existing >500kB bundle warning retained
npm ls three --prefix frontend
# one three@0.180.0
node --test tests/runtime/solar2-gallery.test.mjs tests/runtime/visual-gallery.test.mjs
# 7/7 PASS:12 new gallery combinations,60 prior combinations and hostile inputs
python3 -m unittest discover -s scripts/planetdata -p test_acquire_solar_visual_assets.py -v
# 4/4 PASS
python3 scripts/planetdata/acquire_solar_visual_assets.py
# 7GLB +1PNG exact hashes,23,463,267bytes
python3 scripts/planetdata/acquire_lola_height_grid.py
# original signed16 grid/label PASS,1,036,800 samples
python3 scripts/validation/verify_cinematic_references.py
# original4 PNGs and original archive SHA/bytes PASS
frontend/node_modules/.bin/tsx --test runtimes/planet-runtime/lolaTerrain.test.mts
# final native4/4, separately verified by non-author terrain reviewer
npm exec --prefix frontend -- vitest run tests/solarCameraController.test.ts tests/solarVisitState.test.ts --root frontend
# initial2 failures /3pass; final6/6 PASS (including real OrbitControls wheel input)
git diff --check
# exit0
```

Science backend12 warning-clean Docker tests and client11 checks are retained in
[SCIENCE.md](SCIENCE.md); original-source and changed-mtime red/green evidence are
reused without repeating untouched ephemeris suites. Material/system GPU exact
commands and native-terrain commands are in their scoped reports.

The first host attempt `python3 -m pytest scripts/planetdata/test_acquire_solar_visual_assets.py -q`
failed because host pytest is absent. These four tests use unittest; the correct
standard-library command above passes. No missing test dependency was installed.

## Actual private runtime/browser checks

Windows uses the existing approved local Docker preview and actual mounted JPL
sources, not mocked positions. Every Windows script is launched as:

```sh
'/mnt/c/Program Files/nodejs/node.exe' \
  "$(wslpath -w "$PWD/scripts/validation/<script>.mjs")" \
  http://solar2.localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar2/<run>")"
```

Scripts: `capture_solar2.mjs` (final argument9 requires all source planet assets),
`verify_solar2.mjs`, `verify_solar2_handoffs.mjs`. `benchmark_solar2.mjs` arguments
and raw timing receipt are in PERFORMANCE.md. Browser is headed Windows Edge,
NVIDIA RTX3060Laptop Direct3D11;390×844 and844×390 are emulated, not physical phones.

Captured initial failures are retained privately:
- `first/`: newGLBs accidentally omitted from Vite's explicit public-file output;
  permissive initial readiness guard allowed procedural fallback. Corrected the
  explicit build allowlist and require9actual textures before final captures.
- `journeys1/`: Saturn minimum-distance clamp blocked the smaller Eros approach;
  failing controller test reproduced it and passes after destination-minimum reset.
- `journeys2/`: harness looked for nonexistent `Return to Solar` button;
  corrected to the real accessible `← Solar System` name, not an application fix.
- `journeys3/`: all3 layouts passed the integrated journey before final independent
  edge-case corrections; later final receipts supersede it for current source.
- Initial performance receipt includes real502 failures when the task backend was
  restarted to invalidate its old in-memory source receipt. A clean stable-backend
  rerun is distinguished explicitly; failed samples are never called a pass.

The served small-body JSON was compared structurally with the committed receipted
packet after restarting **only** `pr107-owner-backend`. It retains actual acquisition
UTC2026-10-28T04:43:43.865131Z; response823,747bytes differs from the823,748-byte
source file only by its trailing newline. Source values match exactly.

Focused review corrections, actual browser results and final capture hashes are
recorded in INDEPENDENT_REVIEW.md and the final compact runtime receipt. No full
satellite investigation or historical all-repository device suite was repeated.

Final Windows evidence: `final-journeys/proof.json`3/3 layouts,27 journey groups;
`handoffs-qualified/proof.json`3/3 layouts,11 handoff groups including moved-Earth
repeat and direct-Solar bookmark; no page errors. `final-current/captures.json`
contains12 final fixed-epoch captures and actual served module names. Actual
render timing evidence is reused for unchanged rendering paths; late corrections
only affect native navigation/restoration (PERFORMANCE.md records that boundary).

The first handoff attempt exposed an inherited desktop mode-menu stacking
obstruction and mismatched native camera handoff. Both were repaired at Solar's
boundary. A subsequent expanded attempt began before the last successful build
and failed the repeated-route check; it is retained as a failed mixed-build run,
not final evidence. A fresh frozen-build repeat passes all cases. An intermediate
new helper imported the validator from the wrong module (3test failures) and
needed a TS non-null assertion for its validated fallback (typecheck failure).
Both setup/type failures were fixed before the final build and browser repeat.

CodeQL and repository/Playwright hosted conclusions must be read on PR107 for
the exact final SHA; these local results do not predict or replace hosted checks.

Private gallery real-browser verification (`output/playwright/solar2/verify-gallery-current.mjs`
launched with Windows Node) passes12scene/layout combinations, original primary
reference SHA, hostile unsupported select value, portrait no-overflow, and the
default localhost preview's9actual source textures. An initial portrait overflow
failed; the single source-hash text wrap correction has separate390/1440 browser
red/green review. Gallery proof is included in runtime-receipt.json.

Hosted checkpoint18506d947c934662aa8d727c4dff5c80c0774245 passed Repository integrity,
Playwright, all4CodeQL analyses and aggregateCodeQL. The final evidence/gallery
head is checked separately on PR107; no inherited-alert-free claim is made.
