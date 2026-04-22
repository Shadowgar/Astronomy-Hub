# Codex Handoff — Stellarium Web Engine → Astronomy Hub Port

**Purpose:** This file is the single entry point for a fresh agent (Codex 5.3 or any successor) taking over the runtime port without prior chat context. Read this file first, then the four "required reads" below, then start coding.

**Last updated:** 2026-04-22, evidence **EV-0097** (`overlayCadence.ts` introduces a pure overlay cadence decision seam consumed by `OverlayRuntimeModule.ts`; `module2ParityFingerprint.ts` now records an `overlay-cadence` deterministic replay slice with dedicated regression coverage; **100/100** / **20 files**; module1 **46/46**; typecheck + build PASS).

---

## 1. What this project is

Astronomy Hub is porting the **Stellarium Web Engine** (C sources) into its own React + Babylon + TypeScript runtime (`frontend/src/features/sky-engine/`). The port is **behavior-first and source-faithful**:

- Math, thresholds, frames, lifecycle, and rendering contracts must match Stellarium.
- UI structure and iconography must match Stellarium's `apps/simple-html/` demo. The word `Stellarium` must **not** appear as user-facing branding.
- Do not invent mechanisms, "style-like" approximations, or Hub-specific heuristics when the Stellarium source defines the behavior. Replace incorrect local logic when it conflicts with source.
- The Hub runtime and active tooling must stay self-contained. Do **not** add runtime dependencies on any external local source tree (no `study/...` imports at runtime); the pinned GitHub revision below is the contract reference.
- The Sky-Engine runtime loads on **port 4173 only** (see `frontend/package.json` `dev`/`preview`).

These constraints come from the top-level `AGENTS.md` §6.5 (Sky Engine Isolation Rule) and §13 (Stellarium Port Mode) and are authoritative.

---

## 2. Required reads (in this order)

1. **`docs/runtime/port/CODEX-HANDOFF.md`** — this file.
2. **`docs/runtime/port/README.md`** — canon rules + current module-completion state.
3. **`docs/runtime/port/module2-source-contract.md`** — active module (§1–§2 source mapping, §5 gate status, §7 handoff / next coding targets / commands / evidence).
4. **`docs/runtime/port/module-gates.md`** — gate-by-gate state per module + "Known residuals (repo-wide `npm test`)" section.
5. **`docs/runtime/port/evidence-index.md`** — the evidence ledger. Cite an existing `EV-xxxx` when referencing work; add a new row for any new work you land (**next free ID: EV-0098**; `EV-0067` and `EV-0068` are intentionally unused).

Only open deeper files (inventory, blockers, source contract for module 0/1, per-plan files) when the task points at them.

---

## 3. Pinned upstream reference

- **Upstream:** [github.com/Stellarium/stellarium-web-engine](https://github.com/Stellarium/stellarium-web-engine)
- **Pinned commit:** `63fb3279e85782158a6df63649f1c8a1837b7846`
- **Raw prefix:** `https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/63fb3279e85782158a6df63649f1c8a1837b7846/`
- **Inventory layout:** see `docs/runtime/port/stellarium-web-engine-src.md`. Module 2 source paths: `src/hip.c`, `src/hip.h`, `src/modules/stars.c`, `src/algos/bv_to_rgb.c`.

Never anchor a port claim to a moving branch — always diff against the pinned commit.

---

## 4. Module completion state (authoritative as of EV-0076)

| Module | Status | Bundle | Notes |
|---|---|---|---|
| `module0-foundation-lock` | **COMPLETE** (EV-0019) | `npm run test:module0` → **12/12** | Observer/time/matrix spine. No open `BLK-*`. |
| `module1-hips-kernel` | **COMPLETE** (EV-0034) | `npm run test:module1` → **46/46** | EPH / HEALPix / tile / HiPS render-order spine. `test_close_fov_star_counts.test.js` is an intentionally-excluded asset-heavy probe (see `module1-source-contract.md` §3). |
| `module2-stars-full` | **BLOCKED / partial** (active) | `npm run test:module2` → **100/100 / 20 files** | G0/G1 PASS (EV-0036). G2/G3/G4 partial (EV-0038–EV-0097). G5–G7 FAIL. See `module2-source-contract.md` §5 + §7. |
| `module3-dso-full` | N/A — not started | n/a | Some repo-wide `npm test` residuals belong here (see `module-gates.md` "Known residuals"). |
| `module4-planets-moon-sun` | N/A | n/a | — |
| `module5-satellites-full` | N/A | n/a | Some repo-wide residuals belong here. |
| `module6-ui-shell` | N/A | n/a | Sky-Engine shell/overlay test drift belongs here (see residuals). |
| `module7-remaining-swe` | N/A | n/a | Planets visibility-gate residuals belong here. |
| `module8-global-final-gate` | N/A | n/a | Full-repo `npm test` is the final gate; not required for any earlier module. |

Do **not** promote a `BLOCKED` row to `COMPLETE` without closing every gate G0–G7 per `module-gates.md`.

---

## 5. Execution order

Modules are worked strictly in order. You are on **module 2**. Do not start module 3+ work while module 2 has any open gate.

Within module 2, the next concrete coding targets (from `module2-source-contract.md §7`, ordered) are:

1. **Extend G4 deterministic coverage** (`runtime/module2ParityFingerprint.ts`) further (frame-pacing traces remain partially open) beyond EV-0076 + EV-0082 + EV-0088 + EV-0089 + EV-0090 + EV-0096 + EV-0097 traversal/lookup/astrometry/`stars_list`/projection/reuse/survey-registry/overlay-cadence slices.
2. **`stars_list` / `stars_add_data_source` seams.** Live fetch lifecycle + full `stars.c` object graph remain open after loaded-tile adapter + iterator/loop-semantics hardening and survey-registry extraction (**EV-0078**–**EV-0082**, **EV-0092**, **EV-0093**, **EV-0094**, **EV-0095**, **EV-0096**).
3. **Runtime stabilization.** User-reported blockers (no visible stars at default observer, laggy interaction) are not yet tied to a specific evidence row — treat frame pacing as a P0 investigation after #1 and #2 are in place.

Every landed change must:
- Reference the exact Stellarium source line(s) it mirrors.
- Add or extend a test that runs in `npm run test:module2`.
- Add a new `EV-xxxx` row to `evidence-index.md`.
- Cite the evidence ID in `module-inventory.md` (function table) and, where relevant, in `module-gates.md` and `module2-source-contract.md` §5 / §7.

---

## 6. Hard constraints (non-negotiable)

1. **Exact parity.** Ports replicate Stellarium math, thresholds, frames, and lifecycle. No "looks close enough" adjustments.
2. **Source-authoritative override.** If Hub abstractions conflict with Stellarium, Hub abstractions must be adjusted or bypassed (root `AGENTS.md` §6.5 Port Integrity Rule).
3. **Self-contained runtime.** No runtime imports from `study/` or any other external tree. Active test fixtures may read committed JSON under `frontend/tests/fixtures/`.
4. **No `Stellarium` branding in UI.** Internal filenames, comments, and evidence notes may keep historical names.
5. **Port 4173 only.** `frontend/package.json` uses `vite --port 4173 --strictPort` for both `dev` and `preview`.
6. **No scope expansion / speculative redesign.** See root `AGENTS.md` §7.
7. **No module skipping.** See `module-gates.md` top of file.
8. **Minimal diffs.** Touch only files required for the current step (root `AGENTS.md` §8).

---

## 7. Commands (run from `frontend/`)

```bash
npm run typecheck        # tsc --noEmit — required before claiming done
npm run build            # vite production build
npm run test:module0     # 12/12 (module 0 gate bundle)
npm run test:module1     # 46/46 (module 1 gate bundle)
npm run test:module2     # 100/100 across 20 files (module 2 gate bundle as of EV-0097)
npm run dev              # Vite dev server on 4173
npm run preview          # Preview build on 4173
npm test                 # Full Vitest; has 10 known residuals in module 3/5/6/7/8 scope — see module-gates.md "Known residuals". Not a module 2 gate.
```

CI gate workflows:

- `.github/workflows/module0-parity.yml` — module 0 replay + PyERFA.
- `.github/workflows/module1-hips.yml` — module 1 HiPS kernel.
- `.github/workflows/module2-stars.yml` — module 2 stars-full; path-filtered. Extend the `paths:` filter when you add new source/test files.

---

## 8. Where module 2 lives in the code

| Area | Primary Hub paths |
|---|---|
| B−V → RGB (`bv_to_rgb.c`) | `frontend/src/features/sky-engine/engine/sky/adapters/bvToRgb.ts`, `frontend/src/features/sky-engine/starRenderer.ts` |
| `nuniq` ↔ tile (`stars.c::nuniq_to_pix`, `eph-file.c`) | `frontend/src/features/sky-engine/engine/sky/adapters/starsNuniq.ts`, `ephCodec.ts` |
| Star render limit magnitude (`stars.c::render_visitor` policy) | `frontend/src/features/sky-engine/engine/sky/runtime/stellariumPainterLimits.ts`, `runtime/modules/StarsModule.ts` |
| Native `render_visitor` traversal loop | `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts`, `runtime/modules/runtimeFrame.ts`, `runtime/modules/StarsModule.ts`, `services/sceneAssembler.ts`, `contracts/scene.ts` |
| `hip_get_pix` + `hip.inl` table | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts`, vendored `hipPixOrder2.generated.ts` |
| `compute_pv` / `star_get_astrom` / ERFA `eraStarpv` / `eraEpb2jd` | `frontend/src/features/sky-engine/engine/sky/runtime/starsCatalogAstrom.ts`, `runtime/erfaStarpv.ts` |
| `painter_project(FRAME_ASTROM → FRAME_OBSERVED)` (`eraLdsun` + `eraAb` + `bpn^T` + `ri2h`) | `frontend/src/features/sky-engine/engine/sky/runtime/erfaAbLdsun.ts`, `transforms/coordinates.ts::convertObserverFrameVector` |
| Per-star pv cache (`on_file_tile_loaded` once-per-tile behavior) | `frontend/src/features/sky-engine/engine/sky/services/sceneAssembler.ts` (`resolveCatalogPv` + `projectStarFromPv`) |
| `obj_get_by_hip` (survey-wide loaded-tile lookup) | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` |
| HIP detail route + selection continuity | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`buildHipDetailRoute`), `frontend/src/features/sky-engine/SkyEngineScene.tsx` (`detailRoute`), `useSkyEngineSelection.ts` |
| Hipparcos merge HIP ↔ HEALPix check | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (`filterSurveyStarsForMerge` → `runtimeStarMatchesHipHealpixLookup`) |
| Public module 2 exports | `frontend/src/features/sky-engine/engine/sky/index.ts` |
| Stellarium simple-html UI assets | `frontend/public/stellarium-web/`, `frontend/src/pages/stellariumWebUiAssets.ts`, `frontend/src/pages/SkyEnginePage.tsx` (EV-0053) |
| G4 deterministic fingerprint | `frontend/src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts`; test `test_module2_deterministic_replay.test.js` (EV-0043) |

Module 2 function inventory (per-function `PORTED` / `BLOCKED` status against concrete Hub paths, evidence, and tests) lives in **`module-inventory.md`** → "Module 2 Function Inventory (Stars Pipeline)".

---

## 9. Evidence conventions

- Every `PASS` gate must reference at least one evidence row (`module-gates.md` Rules).
- When you land new work, append a new row to `evidence-index.md` with the next free ID (**next: EV-0098**). Use the existing column shape: `| Evidence ID | Module | Gate | Command / Probe | Artifact Path | Result | Notes |`.
- Keep existing EV rows immutable. `EV-0067` and `EV-0068` are intentionally unused — do not reuse them.
- Cite the new EV ID in every doc that references the landed surface: `module-inventory.md` (function table), `module-gates.md` (module row), `module2-source-contract.md` (§5 gate + §7 evidence table), and any README range bumps.

---

## 10. Known user-visible symptoms (do not re-diagnose)

These are documented so you don't spend context re-deriving them:

- "No stars visible / very few stars." Native `render_visitor` traversal (EV-0074) and survey-wide loaded-tile `obj_get_by_hip` lookup are landed (EV-0075, tightened to source order traversal in EV-0091); G4 fingerprint coverage now also includes deterministic traversal/lookup/catalog-astrometry slices (EV-0076), and remaining `stars.c` list/datasource seams are still open, so keep runtime symptom claims scoped to evidence-backed changes only.
- "Laggy / choppy interaction." Quantized `hipsViewport` signature (EV-0069) and per-star pv caching (EV-0070) removed two known thrash sources. Further pacing work is a P0 after #1, not before.
- "Different from Stellarium visually." Expected until module 6 UI parity work. Simple-html assets are vendored (EV-0053) but shell/overlay drift tests live under `module-gates.md` "Known residuals" and belong to module 6 / module 8.

---

## 11. Completion rule (reminder)

A module is only `COMPLETE` when:

1. Every in-scope source row in `module-inventory.md` is `PORTED` or explicitly `OUT-OF-SCOPE` (user-approved).
2. All gates G0–G7 show PASS in `module-gates.md`.
3. `evidence-index.md` has at least one row per PASS claim.
4. `npm run typecheck`, `npm run build`, and the module bundle are green.
5. The relevant CI workflow covers the new files (update the `paths:` filter when adding sources or tests).

No partial status is allowed — `COMPLETE` or `BLOCKED` only.
