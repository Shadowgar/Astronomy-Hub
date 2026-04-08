# Sky Engine Port Recovery Phase 0A Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move Sky Engine Babylon lifecycle ownership behind `SkyCore` while preserving current scene behavior through a temporary bridge.

**Architecture:** Introduce a runtime-owned `SkyCore` with ordered module registration and a single bridge module that wraps the current scene update/render pipeline. Keep `SkyEngineScene.tsx` as a thin mount adapter that forwards props and temporary pointer input into `SkyCore`.

**Tech Stack:** React, Vite, TypeScript, BabylonJS, Vitest, Playwright

---

### Task 1: Add the runtime boundary files

**Files:**
- Create: `frontend/src/features/sky-engine/engine/sky/runtime/types.ts`
- Create: `frontend/src/features/sky-engine/engine/sky/runtime/SkyModule.ts`
- Create: `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`

**Step 1:** Define `SkyCore` config and context types for Babylon lifecycle ownership.

**Step 2:** Add minimal `SkyModule` lifecycle interface with stable `id` and `renderOrder`.

**Step 3:** Implement `SkyCore` with `start`, `stop`, `update`, `render`, `registerModule`, `syncProps`, and `dispose`.

**Step 4:** Verify TypeScript shape compiles.

### Task 2: Bridge the existing scene runtime through SkyCore

**Files:**
- Create: `frontend/src/features/sky-engine/SkyEngineRuntimeBridge.ts`
- Modify: `frontend/src/features/sky-engine/SkyEngineScene.tsx`

**Step 1:** Move non-React runtime ownership code and helpers out of `SkyEngineScene.tsx` into a bridge file.

**Step 2:** Implement one temporary bridge module that preserves the current render/update pipeline inside `SkyCore`.

**Step 3:** Keep pointer event wiring in `SkyEngineScene.tsx`, but forward wheel/pointer events into `SkyCore`.

**Step 4:** Remove direct Babylon lifecycle ownership from `SkyEngineScene.tsx`.

### Task 3: Add proof for the new runtime boundary

**Files:**
- Create: `frontend/tests/test_sky_core_runtime_boundary.test.js`
- Modify: `frontend/tests/test_sky_engine_scene_ownership.test.js` if needed

**Step 1:** Add structural assertions that `SkyCore` exists and `SkyEngineScene.tsx` no longer creates Babylon `Engine`/`Scene` directly.

**Step 2:** Add assertions that the scene component creates `SkyCore` and forwards into it.

**Step 3:** Run the targeted ownership/runtime tests.

### Task 4: Validate the slice

**Files:**
- Modify only if verification exposes bounded issues

**Step 1:** Run `npm test -- --run tests/test_sky_core_runtime_boundary.test.js tests/test_sky_engine_scene_ownership.test.js`.

**Step 2:** Run `npm run typecheck`.

**Step 3:** Run `npm run build`.

**Step 4:** Run the strongest local Playwright proof already used for the sky runtime slice and record any pre-existing blocker without overclaiming.
