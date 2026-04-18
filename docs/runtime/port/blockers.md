# Blockers

This log records blockers that prevent module completion. Blockers must be explicit, minimal, and tied to one module gate.

## Blocker Template

| ID | Module | Gate | Blocker | Required Prerequisite | Owner | Created | Exit Criteria | Status |
|---|---|---|---|---|---|---|---|---|
| BLK-000 | module0-foundation-lock | G4 | Deterministic replay harness requires robust cross-runtime measurable signal that is not based on noisy pixel hash alone. | Implement deterministic parity mode signal and stable measurement contract. | Sky Engine Port | 2026-04-17 | Five-case deterministic replay produces stable metrics for Hub and reference checkpoints. | RESOLVED |
| BLK-002 | module0-foundation-lock | G5 | Independent `eraApco` second runtime vs Hub not automated. | PyERFA `apco` harness + committed `apcoInputs` per replay case on CI. | Sky Engine Port | 2026-04-17 | Five replay cases: PyERFA `apco` astrom slice matches Hub goldens on CI (see EV-0018). | RESOLVED |

### BLK-000 — Resolution (tier-1 G4 contract)

- **Hub fingerprint:** `computeModule0ObserverGeometryFingerprint` + `frontend/tests/test_module0_deterministic_replay.test.js` (EV-0011).
- **Hub astrom / `ri2h` slice:** committed `frontend/tests/fixtures/module0_replay_astrom_goldens.json` (schema `module0-replay-astrom-v2` includes **`apcoInputs`**) + `frontend/tests/test_module0_replay_astrom_golden_contract.test.js` (EV-0017). Regenerate after intentional astrometry changes: `cd frontend && npm run parity:dump-module0-astrom-goldens`.
- **CI:** `.github/workflows/module0-parity.yml` runs both Vitest files on pushes/PRs touching the sky-engine spine or these tests.

### BLK-002 — Resolution (PyERFA second runtime)

- **Inputs export:** `exportModule0EraApcoParityInputs` in `observerDerivedGeometry.ts` (same path as `deriveObserverGeometry` → `eraApco`).
- **Verifier:** `study/module0-parity/verify_apco_vs_hub.py` + pinned `study/module0-parity/requirements.txt` (`numpy<2`, `pyerfa`). PyERFA expects `ebpv` as structured `erfa_ufunc.dt_pv` (`p`/`v`), not a plain `(2,3)` float64 array.
- **CI:** same workflow installs the venv and runs the script before Vitest (EV-0018).
- **Stellarium C (optional):** `observer.c` still does not compile standalone (`swe.h` → `utarray.h`); deferred unless a minimal C harness is needed beyond PyERFA.

## Rules

- `Status`: `OPEN`, `RESOLVED`, `INVALID`.
- No work may move to a downstream module while blocker for current module remains `OPEN` unless prerequisite module is explicitly defined and completed first.
