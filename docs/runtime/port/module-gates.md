# Module Gates

This file tracks gate completion for each module in execution order.

Parity policy for all modules: target exact source parity where reference behavior exists (no "style-like" substitutes).

## Gate Definitions

- `G0 InventoryLock`: module source items fully enumerated and mapped.
- `G1 SourceContractLock`: exact source files/functions and AH target files frozen.
- `G2 HeuristicDebtZero`: no active local heuristics where source behavior exists.
- `G3 RuntimePathProof`: modified logic is verified on active update/render path.
- `G4 DeterministicReplay`: repeated runs stable for fixed observer/time/FOV profile.
- `G5 SideBySideParity`: Hub/Stellarium module checkpoints pass 100%.
- `G6 RegressionBuild`: tests, typecheck, build, and required probes pass.
- `G7 EvidenceDocsClosure`: evidence bundle complete and linked.

**Module 0–7 G6 scope:** Until **`module8-global-final-gate`**, **G6** for an active module means **`npm run typecheck`**, **`npm run build`**, and the **Vitest regression bundle** listed for that module in **`evidence-index.md`** (not necessarily the entire frontend `npm test`, which may include downstream UI tests unrelated to the module under closure). **Module 8** adds repo-wide test closure as the final gate.

## Status Legend

- `PASS`
- `FAIL`
- `BLOCKED`
- `N/A`

## Module Gate Table

| Module | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Overall |
|---|---|---|---|---|---|---|---|---|---|
| module0-foundation-lock | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | COMPLETE |
| module1-hips-kernel | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | COMPLETE |
| module2-stars-full | PASS | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | BLOCKED |
| module3-dso-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module4-dss-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module5-satellites-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module6-labels-overlays | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module7-remaining-swe | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module8-global-final-gate | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

*Module 2: gate columns remain **`FAIL`** until each gate is fully **`PASS`**; partial Hub work is documented in **`module2-source-contract.md` §5** and **`evidence-index.md`** (**EV-0038**–current).*

### Execution order vs inventory (`README.md`)

**Module Completion Rule** (`port/README.md`): each module must pass **all** gates in the checklist (inventory lock through evidence closure) **before** the **next** module is treated as the active completion target. Until then, downstream modules stay **`N/A`** here — that is the strict “one module to ~100% (all gates **PASS** / **COMPLETE**) before the next” plan.

**Inventory file** (`module-inventory.md`) is separate: **global G0** (no **`UNMAPPED`** file rows anywhere in the Stellarium `src` inventory) **PASS** as of **2026-04-18** G0 seed — every row is **`PORTED`** or **`BLOCKED`** (or future **`OUT-OF-SCOPE`** with approval). Downstream modules stay **`N/A`** here until the prior module is **`COMPLETE`** per the execution-order rule above.

**Module 0 subset:** every file row with `Planned Module == module0-foundation-lock` is **`PORTED`** or **`BLOCKED`** with an AH mapping (no **`UNMAPPED`** in that subset). **BLK-000** (G4 tier-1) is **RESOLVED**; **BLK-002** (G5 PyERFA `apco` second runtime vs Hub) is **RESOLVED** (**EV-0018**). Optional native Stellarium C / WASM matrix dumps remain out of scope for that blocker.

**Module 0 gate closure (EV-0019):** **G0** — no **`UNMAPPED`** file rows in `module-inventory.md` (2026-04-18 G0 seed). **G1** — `module0-source-contract.md` §1–§2 spine + every module 0 inventory row cross-referenced (§6). **G2** — observer/time/matrix spine uses explicit ERFA ports or documented stubs; no undocumented numeric shortcuts on that path. **G3** — G6 Vitest bundle exercises observer/clock/time/geometry services. **G4** — **EV-0011** + **EV-0017**. **G5** — Hub astrom goldens + PyERFA **EV-0018** (not bit-identical native Stellarium C). **G6** — `npm run typecheck`, `npm run build`, and the Vitest list in **EV-0019**. **G7** — this row + `evidence-index.md` through **EV-0019**.

**G1 (module 0):** `module0-source-contract.md` freezes the **implemented** observer/time/ERFA/refraction Hub paths vs Stellarium §1 sources. **`PORTED`** / **`BLOCKED`** inventory rows outside §1 remain tracked for future port waves; they do not invalidate **G1 PASS** for the closed module 0 gate set.

**Module 1 (hips-kernel) — COMPLETE (**EV-0034**): **G0** — nine `module1-hips-kernel` file rows in `module-inventory.md` (**`BLOCKED`** / deferred C port; inventory-only, not process blockers). **G1** — `module1-source-contract.md`. **G2** — EPH **`nuniq`**, **`shuffleEphTableBytes`**, **`convertEphFloat`** (**EV-0025**–**EV-0027**); Hipparcos quadtree depth from **`hips_get_render_order`** + **`clampHipsRenderOrder`** with **`normalizeProjectionMat11ForHips`** (**EV-0032**), not ad-hoc FOV thresholds. **G3** — RA wrap (**EV-0022**), Gaia merge (**EV-0023**), HEALPix (**EV-0026**), tile selection (**EV-0028**), **`buildSkyEngineQuery` ↔ `hipsViewport`** on visible tiles (**EV-0033**). **G4** — tile-load fingerprint (**EV-0024**). **G5** — Hub regression checkpoints: **`hips_get_render_order`** + Gaia **`resolveGaiaHealpixOrder`** (**EV-0029**–**EV-0031**), normalized viewport + tile depth policy (**EV-0032**); full native **`hips.c`** / worker / cache C parity remains inventory **`BLOCKED`**, not a gate failure for this module’s Hub subset. **G6** — `npm run typecheck`, `npm run build`, **`npm run test:module1`**, **`.github/workflows/module1-hips.yml`** (**EV-0021**, **EV-0034**). **G7** — this row + **`evidence-index.md`** through **EV-0034**. **`test_close_fov_star_counts.test.js`** is intentionally excluded from **`test:module1`** (long-running / asset-heavy; see contract §3).

**Module 2 (stars-full) — active; Overall BLOCKED:** **`module1-hips-kernel`** is **`COMPLETE`** (**EV-0034**). **`G0`/`G1`** promoted (**EV-0036**). **`BLK-003`** **RESOLVED** (**EV-0037**). **`G2` partial:** **`bv_to_rgb`** (**EV-0038**); **`nuniq_to_pix`** (**EV-0039**); **`render_visitor` limit magnitude** (**EV-0040**); native `stars.c::render_visitor` tile traversal loop (parent→child visit order, `limit_mag` + tile gates, point-clipped rejection) now wired on the active runtime path (**EV-0074**); **`hip_get_pix` / vendored `hip.inl` table** (**EV-0041**), plus removal of local projected-star floor/cap heuristics and packet-time star/label heuristics on the active stars path (**EV-0063**, **EV-0065**, **EV-0066**); and ERFA **`eraStarpv`** + **`eraEpb2jd`** + Stellarium **`stars.c::compute_pv` / `star_get_astrom`** ports replacing the hand-rolled `raDec → ICRF` shortcut for catalogue stars with measurable parallax (**EV-0070**). **`G3` partial:** Hipparcos tile merge + HIP ↔ HEALPix consistency (**EV-0042**), `obj_get_by_hip` helper (**EV-0044**) + scene wiring / HIP detail route / selection continuity (**EV-0045**, **EV-0046**, **EV-0047**), survey-wide loaded-tile lookup now aligned with `obj_get_by_hip` order traversal (`hip_get_pix(hip, 0)` then `hip_get_pix(hip, 1)`) (**EV-0075**, **EV-0091**), loaded-runtime `stars_list` loop traversal corrected to source row-order/continue semantics (no local sort+break heuristic, **EV-0092**), top/bottom HUD structure and asset parity passes (**EV-0049**, **EV-0050**, **EV-0053**) with intermediate dock experiments explicitly superseded (**EV-0051**, **EV-0052**), runtime tile-query signature stabilization against viewport float jitter to stop reload churn (**EV-0069**), scene assembler wiring of `star_get_astrom` through the observer-frame chain with per-star `pv` caching (**EV-0070**), and StarsModule consumption of tile traversal output via `starsRenderVisitor.ts` (**EV-0074**). **`G4` partial:** module 2 port algorithm fingerprint (**EV-0043**, extended **EV-0054**, **EV-0061**, **EV-0076**, **EV-0082**, **EV-0088**, **EV-0089**) now includes deterministic traversal order/entries, survey HIP lookup results, catalog-astrometry propagation slices, `stars_list` slices, scene-luminance slices, fixed-input runtime projection replay over `collectProjectedStars`, and deterministic projection-cache reuse decision replay from `StarsModule` thresholds; explicit module2 bundle regression suite for reuse thresholds/streak behavior is now added (**EV-0090**). **`G5`–`G7`** **FAIL**. Cross-module regression sweep through module0/module1/module2 bundles is recorded in **EV-0062**. Full runtime-port doc audit reconciliation (module-inventory function tables for module 2, `test:module2` bundle expansion to include `test_erfa_starpv.test.js`, repo-wide residuals catalog below) is recorded in **EV-0071**. `painter_project(FRAME_ASTROM → FRAME_OBSERVED)` apparent-place chain on the EV-0070 pv output is now sealed end-to-end by regression test + `test:module2` bundle extension (**EV-0072**), traversal bundle extension landed in **EV-0074**, `obj_get_by_hip` survey lookup extension is tightened by EV-0091, and `stars_list` loop semantics are tightened by EV-0092; G4 deterministic replay coverage has now been extended through **EV-0090**. `test:module2` is now **71/71 across 17 files**. Execution-order note: **EV-0035**. See **`module2-source-contract.md` §7** for agent handoff (files, commands, next steps).

### Known residuals (repo-wide `npm test`; not in module 0/1/2 bundles)

Per the **Module 0–7 G6 scope** rule above, the module bundles (`test:module0`, `test:module1`, `test:module2`) stay green and are the active gate signal. Full-repo `npm test` is only required at **`module8-global-final-gate`**. The residuals below are recorded here so future module owners pick them up and so the gate table is not mistaken for "everything passes":

- **`tests/sky-engine-runtime-frame-projection.test.js` (3 failures)** — asserts a Stellarium-style `limit_mag` visibility gate for non-moon planets / deep-sky objects / satellites. The active runtime (`runtimeFrame.ts::collectProjectedNonStarObjects`) currently gates **only** `minor_planet` / `comet` types; the planets/DSO/satellite render path defers to per-module visibility. Belongs to **`module3-dso-full`**, **`module5-satellites-full`**, and **`module7-remaining-swe`** (planets); assertions and runtime must be reconciled once those modules land. **Not** a module 2 regression.
- **`tests/test_close_fov_star_counts.test.js` (1 failure)** — long-running (~120 s) real-catalog FOV sweep. **Intentionally excluded** from `test:module1` per `module1-source-contract.md` §3. Fails when run from the full suite because real Hipparcos/Gaia assets are not guaranteed in every workspace; treat as an asset-heavy probe, not a module 1 gate signal.
- **`tests/test_sky_engine_overlay_persistence.test.js` (3)**, **`tests/test_sky_engine_scene_ownership.test.js` (1)**, **`tests/test_sky_engine_shell_decoupling.test.js` (1)**, **`tests/test_skyculture_runtime_switching.test.js` (1)** — UI/shell contract drift accumulated through the module 2 HUD parity passes (**EV-0048**–**EV-0053**, **EV-0055**) and later stabilization work (**EV-0057**–**EV-0060**). These target Sky-Engine **shell** glue (`SkyEnginePage`, overlay defaults, scene ownership, runtime sync cadence, sky-culture wiring), which is **module 6 / module 8** territory, not module 0/1/2 core. They do **not** retire module 0 or module 1 **COMPLETE** status.

Audit summary (2026-04-20, **EV-0071**): `npm run typecheck` PASS, `npm run build` PASS, `npm run test:module0` PASS (12/12), `npm run test:module1` PASS (43/43), `npm run test:module2` PASS (29/29 across 8 files after bundle expansion to include `test_erfa_starpv.test.js`). Repo-wide `npm test` → 10 failures across 6 files, all enumerated above.

Post-audit extension (2026-04-20, **EV-0072**): `test:module2` bundle now 32/32 across 9 files after adding `test_module2_painter_project_frame_astrom.test.js` (end-to-end `painter_project(FRAME_ASTROM → FRAME_OBSERVED)` regression); `npm run typecheck` PASS; module 0 / module 1 bundles unchanged.

Traversal extension (2026-04-20, **EV-0074**): `test:module2` bundle now 35/35 across 10 files after adding `test_module2_stars_render_visitor.test.js` and wiring native `stars.c::render_visitor` traversal semantics on the active StarsModule/runtimeFrame path; `npm run typecheck` PASS; `npm run test:module1` remains 43/43 and `npm run test:module0` remains 12/12.

Survey lookup extension (2026-04-20, **EV-0075**): `test:module2` bundle now 38/38 across 11 files after adding `test_module2_stars_lookup_survey.test.js` and extending `findRuntimeStarByHipInTiles` to survey-wide loaded-tile `obj_get_by_hip` lookup semantics; `npm run typecheck` PASS; `npm run test:module1` remains 43/43 and `npm run test:module0` remains 12/12.

G4 deterministic extension (2026-04-21, **EV-0076**): `computeModule2PortFingerprint` now records deterministic slices for native `stars.c::render_visitor` traversal order/entries (`visitStarsRenderTiles`), survey-wide `obj_get_by_hip` lookup outcomes (`findRuntimeStarByHipInTiles`), and `compute_pv`/`star_get_astrom` catalog astrometry propagation (`computeCatalogStarPvFromCatalogueUnits`, `starAstrometricIcrfVector`) — extending replay coverage over the EV-0070/EV-0074/EV-0075 seams. `test:module2` is now 39/39 across 11 files; `npm run typecheck`, `npm run build`, `npm run test:module1`, and `npm run test:module0` PASS.

G4 deterministic extension (2026-04-22, **EV-0088**): `computeModule2PortFingerprint` now adds a fixed-input `collectProjectedStars` replay slice (`stars-projection`) that locks active runtime projection output (`id`, ordering, screen/depth geometry, alpha/magnitude) for a stable `StarsModule`-path fingerprint. `test_module2_deterministic_replay.test.js` assertion + snapshot updated; `npm run typecheck`, `npm run build`, `npm run test:module2` (66/66), and `npm run test:module1` (46/46) PASS.

G4 deterministic extension (2026-04-22, **EV-0089**): `StarsModule.ts` now exports the projection-cache reuse predicate (`evaluateStarsProjectionReuse`) and `computeModule2PortFingerprint` records a deterministic `stars-reuse|` slice that locks cache-reuse/reproject threshold outcomes (center/FOV/lim-mag/timestamp deltas + reuse-streak gate). `test_module2_deterministic_replay.test.js` assertion + snapshot updated; `npm run typecheck`, `npm run build`, `npm run test:module2` (66/66), and `npm run test:module1` (46/46) PASS.

G4 deterministic extension (2026-04-22, **EV-0090**): added dedicated regression suite `test_module2_stars_projection_reuse.test.js` for `evaluateStarsProjectionReuse` threshold and streak-gate behavior; wired into `test:module2` and `.github/workflows/module2-stars.yml` path filters. `npm run typecheck`, `npm run build`, `npm run test:module2` (70/70), and `npm run test:module1` (46/46) PASS.

G3 runtime lookup alignment (2026-04-22, **EV-0091**): `findRuntimeStarByHipInTiles` now mirrors `stars.c::obj_get_by_hip` order traversal by probing `hip_get_pix(hip, 0)` before `hip_get_pix(hip, 1)`, replacing the Hub-specific order-2 bucket shortcut. `test_module2_stars_lookup_survey.test.js` adds explicit order-priority coverage; `npm run typecheck`, `npm run build`, `npm run test:module2` (71/71), and `npm run test:module1` (46/46) PASS.

G2/G3 `stars_list` loop alignment (2026-04-22, **EV-0092**): `listRuntimeStarsFromTiles` non-hint traversal now mirrors `stars.c::stars_list` row semantics by preserving tile star order and using `continue` (not break) for over-limit stars; Hub-only per-tile sort+early-break behavior was removed. `test_module2_stars_list.test.js` now locks mixed-order traversal output. `npm run typecheck`, `npm run build`, `npm run test:module2` (71/71), and `npm run test:module1` (46/46) PASS.

## Rules

- A module can be `COMPLETE` only if every gate is `PASS`.
- Any `UNMAPPED` in module inventory forces `G0=FAIL`.
- Active process blockers use **`BLK-***` rows in `blockers.md`**. **`BLOCKED`** status in `module-inventory.md` alone is normal deferred port work and does not require a **`BLK-***` unless it stops all forward progress.
