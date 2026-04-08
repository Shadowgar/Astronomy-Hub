# Sky Engine Background Render Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the dominant active-sky background path from `backgroundCanvas` into Babylon-native rendering while preserving current backdrop, glare, and horizon behavior.

**Architecture:** Add a Babylon background layer beside the existing direct object and direct overlay layers. `SkyEngineScene` will prepare a background frame from the existing projection and solar-state inputs, then sync that frame into Babylon. Procedural density stars only migrate if the implementation stays small; otherwise they become the single intentional canvas fallback.

**Tech Stack:** React, TypeScript, Babylon.js, Vitest, Playwright

---

### Task 1: Lock the structural regression test

**Files:**
- Modify: `frontend/tests/test_sky_engine_overlay_unification.test.js`
- Test: `frontend/tests/test_sky_engine_overlay_unification.test.js`

**Step 1: Write the failing test**

Add assertions that `SkyEngineScene.tsx` no longer owns `backgroundCanvasRef` once the Babylon background layer is installed, unless the file still contains a bounded density-star fallback marker.

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: FAIL because `SkyEngineScene.tsx` still contains `backgroundCanvasRef` and direct background canvas calls.

**Step 3: Write minimal implementation**

Update the structural test so it checks for:
- `createDirectBackgroundLayer`
- absence of the dominant background canvas path
- explicit bounded fallback marker if density stars remain on canvas

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/tests/test_sky_engine_overlay_unification.test.js
git commit -m "test: lock sky background layer ownership"
```

### Task 2: Add Babylon background layer

**Files:**
- Create: `frontend/src/features/sky-engine/directBackgroundLayer.ts`
- Modify: `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- Test: `frontend/tests/test_sky_engine_overlay_unification.test.js`

**Step 1: Write the failing test**

Add assertions that `directBackgroundLayer.ts` exists and that `SkyEngineScene.tsx` uses `createDirectBackgroundLayer`.

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: FAIL because the background layer file and import do not exist yet.

**Step 3: Write minimal implementation**

Implement a Babylon background layer that:
- owns backdrop state
- owns sun glare state
- owns horizon blocking state
- exposes `sync(...)` and `dispose(...)`

Wire it into `SkyEngineScene.tsx`.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/features/sky-engine/directBackgroundLayer.ts frontend/src/features/sky-engine/SkyEngineScene.tsx frontend/tests/test_sky_engine_overlay_unification.test.js
git commit -m "feat: add Babylon sky background layer"
```

### Task 3: Move backdrop, glare, and horizon blocking into Babylon

**Files:**
- Modify: `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- Modify: `frontend/src/features/sky-engine/directBackgroundLayer.ts`
- Modify: `frontend/src/styles.css`
- Test: `frontend/tests/test_sky_engine_overlay_unification.test.js`

**Step 1: Write the failing test**

Add assertions that `SkyEngineScene.tsx` no longer calls:
- `drawBackground(`
- `drawProceduralSkyBackdrop(`
- `drawSolarGlare(`
- `drawLandscapeMask(`

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: FAIL because those calls still exist before the migration.

**Step 3: Write minimal implementation**

Replace the direct canvas calls with prepared background frame data and Babylon layer sync. Remove unused background canvas styling if the canvas stops owning the dominant background path.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/features/sky-engine/SkyEngineScene.tsx frontend/src/features/sky-engine/directBackgroundLayer.ts frontend/src/styles.css frontend/tests/test_sky_engine_overlay_unification.test.js
git commit -m "feat: move sky backdrop and glare into Babylon"
```

### Task 4: Contain or migrate procedural density stars

**Files:**
- Modify: `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- Modify: `frontend/src/features/sky-engine/directBackgroundLayer.ts`
- Test: `frontend/tests/test_sky_engine_overlay_unification.test.js`

**Step 1: Write the failing test**

Add one assertion for the final allowed state:
- either density stars are Babylon-owned
- or `SkyEngineScene.tsx` contains a single explicit bounded fallback marker for density stars only

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: FAIL until the density-star ownership is made explicit.

**Step 3: Write minimal implementation**

Prefer the small Babylon migration. If that becomes too large, keep the density stars as the only canvas fallback and ensure they are isolated from unnecessary redraw ownership.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/features/sky-engine/SkyEngineScene.tsx frontend/src/features/sky-engine/directBackgroundLayer.ts frontend/tests/test_sky_engine_overlay_unification.test.js
git commit -m "refactor: isolate procedural density star fallback"
```

### Task 5: Verify the slice

**Files:**
- Modify: `frontend/tests/e2e/sky-engine-calibration.spec.js`
- Test: `frontend/tests/test_sky_engine_overlay_unification.test.js`
- Test: `frontend/tests/test_sky_engine_scene_ownership.test.js`
- Test: `frontend/tests/test_projection_math.test.js`
- Test: `frontend/tests/test_sky_engine_runtime_slice.test.js`

**Step 1: Write the failing test**

Update any scene-state expectation that still references the older background ownership marker.

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js tests/test_sky_engine_scene_ownership.test.js tests/test_projection_math.test.js tests/test_sky_engine_runtime_slice.test.js`
Expected: FAIL until the scene-state marker and tests match the final implementation.

**Step 3: Write minimal implementation**

Align scene-state proof strings and test expectations with the final Babylon background ownership path.

**Step 4: Run test to verify it passes**

Run:
- `cd frontend && npm test -- --run tests/test_sky_engine_overlay_unification.test.js tests/test_sky_engine_scene_ownership.test.js tests/test_projection_math.test.js tests/test_sky_engine_runtime_slice.test.js`
- `cd frontend && npm run typecheck`
- `cd frontend && npm run build`
- `cd frontend && npx playwright test tests/e2e/sky-engine-calibration.spec.js --grep "sky engine proves moon, labels, aids, guidance, and time controls in runtime"`

Expected:
- targeted tests PASS
- typecheck PASS
- build PASS
- Playwright may still fail on the known unrelated guided-target blocker; record exact outcome

**Step 5: Commit**

```bash
git add frontend/tests/e2e/sky-engine-calibration.spec.js frontend/tests/test_sky_engine_overlay_unification.test.js frontend/tests/test_sky_engine_scene_ownership.test.js frontend/src/features/sky-engine/SkyEngineScene.tsx frontend/src/features/sky-engine/directBackgroundLayer.ts frontend/src/styles.css
git commit -m "refactor: unify sky background render ownership"
```
