# Blockers

This log records blockers that prevent module completion. Blockers must be explicit, minimal, and tied to one module gate.

## Blocker Template

| ID | Module | Gate | Blocker | Required Prerequisite | Owner | Created | Exit Criteria | Status |
|---|---|---|---|---|---|---|---|---|
| BLK-000 | module0-foundation-lock | G4 | Deterministic replay harness requires robust cross-runtime measurable signal that is not based on noisy pixel hash alone. | Implement deterministic parity mode signal and stable measurement contract. | Sky Engine Port | 2026-04-17 | Five-case deterministic replay produces stable metrics for Hub and reference checkpoints. | RESOLVED |
| BLK-002 | module0-foundation-lock | G5 | Independent `eraApco` second runtime vs Hub not automated. | PyERFA `apco` harness + committed `apcoInputs` per replay case on CI. | Sky Engine Port | 2026-04-17 | Five replay cases: PyERFA `apco` astrom slice matches Hub goldens on CI (see EV-0018). | RESOLVED |
| BLK-003 | module2-stars-full | G1 / G5 | Stellarium Web Engine **`src`**.c sources were not discoverable via workspace search when **`/study`** is gitignored; line-reference for `hip.c` / `stars.c` / `bv_to_rgb.c` needed a pinned Git URL + paths. | Document upstream repo + pinned commit + `src/` paths (see **`stellarium-web-engine-src.md`**). | Sky Engine Port | 2026-04-18 | **`BLK-003` RESOLVED**: **`docs/runtime/port/stellarium-web-engine-src.md`** + **EV-0037** (GitHub `Stellarium/stellarium-web-engine` at commit **`63fb3279e85782158a6df63649f1c8a1837b7846`**). Optional local tree: `study/stellarium-web-engine/source/stellarium-web-engine-master/src/`. | RESOLVED |

### BLK-000 — Resolution (tier-1 G4 contract)

- **Hub fingerprint:** `computeModule0ObserverGeometryFingerprint` + `frontend/tests/test_module0_deterministic_replay.test.js` (EV-0011).
- **Hub astrom / `ri2h` slice:** committed `frontend/tests/fixtures/module0_replay_astrom_goldens.json` (schema `module0-replay-astrom-v2` includes **`apcoInputs`**) + `frontend/tests/test_module0_replay_astrom_golden_contract.test.js` (EV-0017). Regenerate after intentional astrometry changes: `cd frontend && npm run parity:dump-module0-astrom-goldens`.
- **CI:** `.github/workflows/module0-parity.yml` runs both Vitest files on pushes/PRs touching the sky-engine spine or these tests.

### Module 0 & 1 — Blocker status

- **No OPEN `BLK-*` rows** for **`module0-foundation-lock`** or **`module1-hips-kernel`**. **BLK-000** and **BLK-002** are **RESOLVED**.
- Inventory rows marked **`BLOCKED`** (deferred native Stellarium C vs Hub TS) remain in **`module-inventory.md`**; they do **not** invalidate **COMPLETE** per **`module-gates.md`** until a future parity wave targets them.

### BLK-003 — Resolution (Stellarium `src` reference for module 2)

- **Pinned revision:** `63fb3279e85782158a6df63649f1c8a1837b7846` on [Stellarium/stellarium-web-engine](https://github.com/Stellarium/stellarium-web-engine).
- **Doc:** `docs/runtime/port/stellarium-web-engine-src.md` (raw URL pattern + module 2 paths).
- **Evidence:** **EV-0037**.

### BLK-002 — Resolution (PyERFA second runtime)

- **Inputs export:** `exportModule0EraApcoParityInputs` in `observerDerivedGeometry.ts` (same path as `deriveObserverGeometry` → `eraApco`).
- **Verifier:** `study/module0-parity/verify_apco_vs_hub.py` + pinned `study/module0-parity/requirements.txt` (`numpy<2`, `pyerfa`). PyERFA expects `ebpv` as structured `erfa_ufunc.dt_pv` (`p`/`v`), not a plain `(2,3)` float64 array.
- **CI:** same workflow installs the venv and runs the script before Vitest (EV-0018).
- **Stellarium C (optional):** `observer.c` still does not compile standalone (`swe.h` → `utarray.h`); deferred unless a minimal C harness is needed beyond PyERFA.

## Rules

- `Status`: `OPEN`, `RESOLVED`, `INVALID`.
- No work may move to a downstream module while blocker for current module remains `OPEN` unless prerequisite module is explicitly defined and completed first.
