# Commands, outcomes and retained failures

Working directory for all relative commands:
`/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`.
Branch `recovery/reconcile-20261026`, starting HEAD `b4005ce48e9869c298de4ed019c67e4e246accda`; verified remote main `9a03d8260a529f5858c5c3298cbb9d32b721daeb`.

## Local/build checks

- `npm install --prefix output/solar21-peer-check --package-lock-only --ignore-scripts --no-audit --no-fund`: **FAIL ERESOLVE**, direct Takram versus HubReact18. No force/legacy retry.
- `npm install --prefix frontend/graphics --package-lock-only --ignore-scripts --no-audit --no-fund`; `npm ci --prefix frontend/graphics --no-audit --no-fund`: **PASS**,36packages. Standard production Docker npmci additionally installs root+isolated graph. Unused isolated React19/R3F peers are recorded; not bundled.
- `npm ls --prefix frontend/graphics --all`: **PASS**, coherent pinned graph. `npm audit --prefix frontend/graphics --omit=dev --json`: **0 advisories**. Existing Hub audit has12affected entries, unchanged resolved versions; see DEPENDENCIES.
- `npm test --prefix frontend`: **500tests /75files PASS** after final terrain departure corrections.
- `npm run typecheck --prefix frontend`; `git diff --check`: **PASS**.
- `npm run build --prefix frontend -- --outDir ../output/playwright/owner-acceptance/hub-solar21`: **PASS**. Existing large chunk advisory remains; no build error. Only explicit bounded LUT/terrain/source/legal assets are copied, no global skydata.
- `python3 -B -m unittest discover -s tests/validation -p test_source_package.py -v`: **6 PASS**.
- Source conversion10tests, bitwise reproduction, independent1,414,485vertex/GDAL audit and exact commands: TERRAIN_SOURCE / REVIEW_TERRAIN.
- Independent actual-browser atmosphere fixture and source-frame commands: ATMOSPHERE / EARTH_FRAME_REVIEW / ATMOSPHERE_INTEGRATION_REVIEW. Fresh final reviewer39tests, then25correction tests passed; see REVIEW_FINAL.

## Docker science and build

```sh
docker run --rm --network none --read-only --tmpfs /tmp \
  -e PYTHONDONTWRITEBYTECODE=1 \
  -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/ephemeris \
  -v /home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026:/app:ro \
  -v /home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release:/runtime/ephemeris:ro \
  --workdir /app 00e343c5943a python -m pytest \
  backend/tests/test_solar_earth_frame.py backend/tests/test_solar_motion.py \
  -q -W error -p no:cacheprovider
```

**7 passed in2.36s**; warnings are errors, kernel/worktree mounts read-only. Added Earth frame test first failed `KeyError: earth_orientation`, then passed against direct source rotations. Independent Docker frame audit checked1,736 rotations; maximum sampled interpolation0.0112814arcsec, not claimed physical accuracy.

A broader attempt also included `backend/tests/test_solar_exploration.py` and **failed collection**: installed Starlette TestClient accesses deprecated `anyio.abc.BlockingPortal`; `-W error` promotes it. No blanket full-backend pass is claimed. The focused ASGI motion tests and prior valid unchanged Solar2 source evidence are used; this run does not rewrite unrelated legacy tests or suppress warnings.

```sh
docker build --target build -f frontend/Dockerfile.production \
  -t astronomy-hub-solar21-build-proof .
```

Initial build installed both graphs successfully but failed on the preexisting missing shared/glass.css Docker copy. Corrected explicit copy/context allowlist; complete clean-source build **PASS**. Exact final build is repeated after source freeze. No production container deployment or protected-volume change. Only task-owned preview/backend were refreshed.

## Actual Windows checks

Scripts run with Windows Node, headed Edge, sandbox enabled and default unsafe SwiftShader flag removed. Example invocation (replace SCRIPT/OUT with the literal paths below):

```sh
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/SCRIPT")" \
  http://127.0.0.1:4231 "$(wslpath -w "$PWD/OUT")"
```

- `scripts/validation/verify_solar21_application.mjs`, `output/playwright/solar-system-2.1/application-final`: **10 matched A/B captures PASS**, actual JPL epoch/cameras; day, limb, crescent, backlit, near-horizon. Initial harness compared equivalent ISO spellings literally; changed to UTC epoch comparison, preserved first failed run. Final screenshots inspected.
- `scripts/validation/verify_solar21_failures.mjs`, `output/playwright/solar-system-2.1/failures-final`: **3 groups PASS**: controlled LUT503, motion/frame503, and normal moving Earth/time + real zoom to1,000.000001m + efficient fallback. Failure injection is explicit; source vectors are not mocked.
- `scripts/validation/benchmark_solar21.mjs`, `docs/validation/solar-system-2.1/performance.json`: **12 measured cases PASS**,40warm-up/200active RAF intervals, actual RTX3060; no concurrent browser/capture during measurement.
- `scripts/validation/verify_solar2.mjs`, `output/playwright/solar-system-2.1/solar-regressions`: **27 groups PASS**,3layouts, actual videos; preserves Saturn/Eros/time/camera/system/resize/context behaviors after metre rendering changes.
- `frontend/tests/terrain.browser.mjs`: actual NASA instance/LOD3, three layouts/nativeMoon return, real touch/keyboard, resize/reduced-motion/context/disposal, injected503 recovery. Original run discovered the nativeEarth observer issue after three passing recorded journeys. Final focused handoff proof and receipts are recorded in TILES_RUNTIME and README.

First terrain Windows attempts reported connection refusal. Root HTTP inspection proved a301 redirect from asset-directory/SPA-route collision to internal port8877, not a host network defect. Exact route handlers fixed production/preview nginx: route/slash200HTML with noLocation, manifest/tileset/GLB200, missingGLB404. Separate review verified this. No firewall, public listener or tunnel was created.

Additional retained red/green findings: AU logarithmic-depth banding; inappropriate Earth projection of distant opaque sources; terrain float32-before-local rounding; DOM markers through Earth; production missing graphics lock; source observer loading/failure exits. See the scoped review reports for exact lines, causes, corrections and independent evidence.

The staged whitespace check detected CRLF records in the three original PDS label captures. A narrow `.gitattributes` rule preserves their raw bytes (`-text -whitespace`), following the existing raw-source receipt convention. Labels were not reformatted; their source hashes remain exact. Subsequent staged diff check passes.

Private gallery: `python3 scripts/validation/build_solar21_gallery.py` copied34 original-byte captures/references/videos. Windows `scripts/validation/verify_solar21_gallery.mjs` verified28images,6videos, all34HTTP assets and no horizontal overflow across3layouts. No dynamic text-to-HTML logic is used.

## Hosted CI follow-up: obsolete G6 workflows

At implementation commit `527f38aedfd160f4998c085cd85f14d3ff4f4dde`, all four
CodeQL language jobs and aggregate CodeQL passed. Repository integrity (push and
PR) and Playwright passed. Two historical G6 jobs built/types-checked successfully,
then failed with `npm error Missing script: "test:module1"` / `"test:module2"`:
[HiPS run](https://github.com/Shadowgar/Astronomy-Hub/actions/runs/40667143610),
[stars run](https://github.com/Shadowgar/Astronomy-Hub/actions/runs/40667143588).

`git show f75bc9eb -- frontend/package.json` proves commit
`f75bc9eb4e3785cd6d891573766b47669275bab4` removed both commands and the old
Babylon/ported Sky renderer and tests in May. `git merge-base --is-ancestor
f75bc9eb origin/main` exits0. Both commands are absent from current main too.
Of the26 unique frontend path filters in module1,25 are absent; of88 in module2,
85 are absent, identically on main and the recovery branch. Remaining matches are
package.json/styles.css and an intentionally disabled legacy generator. These
jobs do not execute native Stellarium HiPS/star tests.

Local `npm run test:module1` and separate `npm run test:module2` each reproduce
exit1/missing script. The correction removes exactly the two obsolete workflows,
without dummy npm aliases, conditionally skipping assertions, suppressing alerts,
or changing runtime files. Existing Repository integrity retains all500 current
frontend tests/types/build, native runtime/science/source contracts and archive
contracts. Its triggers now also cover main/master pushes and master-target PRs,
preserving the removed jobs' build/typecheck event coverage through the current
suite rather than obsolete script names; Playwright and CodeQL remain unchanged. No branch protection was
changed: read-only main/protection returned404 `Branch not protected` and
rules/branches/main returned `[]`.

Focused current-boundary command from frontend:

```sh
npm test -- --run tests/skyEngineImportBoundary.test.js tests/orasDenseStars.test.ts tests/orasRuntimeDataSources.test.js tests/orasCatalogPacks.test.js
```

**4 files /33 tests PASS**, exit0. Full successful hosted500-test evidence at the
implementation SHA remains valid for this CI/documentation-only follow-up. Final
exact-head check links and the independent retirement review are recorded in PR107.
