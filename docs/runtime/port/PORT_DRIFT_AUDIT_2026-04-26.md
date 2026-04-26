# PORT DRIFT AUDIT — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: stop stage progression, audit current Stars Painter work for true source parity vs wrapper drift.

## Audit Context Loaded

Read for this audit (required + direct source anchors):

- docs/runtime/port/CODEX-HANDOFF.md
- docs/runtime/port/module-inventory.md
- docs/runtime/port/star-render-path-to-painter-migration-audit.md
- docs/runtime/port/painter-c-api-surface-mapping.md
- docs/runtime/port/render-gl-backend-mapping-shell.md
- docs/runtime/port/core-c-frame-lifecycle-mapping.md
- frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts
- frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts
- frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort.ts
- frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterStarsBackendLayer.ts
- frontend/src/features/sky-engine/engine/sky/runtime/modules/SceneReportingModule.ts
- frontend/src/features/sky-engine/SkyEngineRuntimeBridge.ts
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/core.c
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/render.h
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/module.c
- study/stellarium-web-engine/source/stellarium-web-engine-master/src/obj.c

No additional implementation work was performed in this audit.

## Executive Conclusion

Current Stage 4B/4C/4D output is mostly wrapper infrastructure around existing AH direct-star rendering, not a true Stellarium render/painter port.

- True ported surface exists in frame lifecycle ordering and painter API naming boundary.
- Render backend behavior parity (render_prepare/get_item/render_points/render_finish flush path) is not ported.
- Stars traversal/loading/render behavior in `modules/stars.c` remains mostly unported.
- Several labels/statuses can read as stronger parity than what is implemented.

Verdict: **port drift is real**. The work should be frozen at current prototype boundary and redirected to source-faithful render_gl/painter behavior porting.

## What Is Actually Ported

1. Core frame lifecycle control-flow parity (partial but real)
- AH `SkyCore.runFrameLifecycle` now owns per-frame update/render/postRender ordering.
- This aligns with Stellarium `core_update` / `core_render` sequencing intent:
  - `core_update` module update ordering and loop ownership (`core.c:286+`)
  - `core_render` preamble -> module render -> paint_finish -> post_render (`core.c:521+`)

2. Painter API surface naming and call boundary (interface-level parity)
- AH `painterPort.ts` mirrors many `painter.h` names and enums.
- `paint_prepare`/`paint_finish` call shape aligns to `painter.c` entry points (`painter.c:128`, `painter.c:145`).

3. Explicit declaration that direct star layer remains active
- Stage docs/runtime paths clearly maintain side-by-side and non-replacement behavior in current slice.

## What Is Only Wrapper Infrastructure

1. Backend mapping plan shell
- `painterBackendPort.ts` maps finalized batches to metadata with `renderGlReference` string markers.
- This is declarative metadata, not `render_gl.c` execution.

2. Runtime feature gating + status orchestration
- `resolvePainterBackendExecutionEnabled`, status enums, side-by-side counters.
- Useful for controlled rollout but not source rendering parity.

3. Painter-owned backend layer adapter shell
- `painterStarsBackendLayer.ts` tracks created/synced/starCount state.
- No proven `render_gl`-equivalent item batching/flush semantics.

4. Telemetry expansion around wrapper states
- `SceneReportingModule.ts` reports extensive execution deltas and adapter lifecycle flags.
- This validates scaffolding behavior, not source rendering fidelity.

## What Is Misleadingly Labeled As Ported

1. `renderGlReference` fields in mapping output
- Names (`render_points_2d`, `ITEM_POINTS`, `get_item`, `render_finish`) are attached as labels.
- They do not enforce or execute corresponding source behavior.

2. `executed_side_by_side` / `executed_side_by_side_painter_layer`
- These statuses can imply backend parity progress.
- In practice they indicate wrapper sync paths while direct renderer still owns visible output.

3. “Painter-owned Babylon render object prototype” framing
- Current adapter mainly stores sync state and star counts.
- It is not yet evidence of `render_gl.c` item lifecycle parity.

4. Stage progression signal (4B -> 4C -> 4D)
- Progression mainly increased orchestration/telemetry/adapter states.
- It did not materially reduce the largest parity gap: source render backend behavior.

## What Must Be Frozen (Immediately)

1. Freeze Stage advancement beyond 4D
- Do not proceed with Stage 4E wrappers/telemetry layers.

2. Freeze addition of new status enums and telemetry fields in this lane
- No more status proliferation until source behavior is ported.

3. Freeze new adapter abstractions around stars backend
- Prevent another indirection layer before implementing source batching/flush semantics.

4. Freeze documentation language that overstates parity
- Any wording implying backend execution parity should be downgraded to “prototype/wrapper.”

## Freeze/Delete/Keep Recommendations

Keep:
- `SkyCore.ts` lifecycle ownership and ordering work.
- `painterPort.ts` API boundary scaffolding as temporary integration seam.

Freeze:
- `painterBackendPort.ts` new feature/status growth.
- `painterStarsBackendLayer.ts` abstraction growth.
- `SceneReportingModule.ts` painter-backend telemetry expansion.

Delete or retire (when next slice lands):
- String-only `renderGlReference` markers as a parity signal.
- Any telemetry/status fields that no longer represent implemented source behavior.

## Top 10 Unported Stellarium Functions Blocking Real Stars Parity

1. `render_prepare` (render_gl.c:365)
2. `get_item` batching/reorder item selection (render_gl.c:393)
3. `render_points_2d` item population path (render_gl.c:417)
4. `render_points_3d` item population + depth tracking (render_gl.c:465)
5. `render_finish` flush contract (`rend_flush`) (render_gl.c:1796)
6. `painter_update_clip_info` viewport/sky caps (painter.c:119)
7. `paint_2d_points` direct call-through contract to renderer (painter.c:172)
8. `paint_3d_points` direct call-through contract to renderer (painter.c:178)
9. `render_visitor` tile traversal + star projection/filtering path (modules/stars.c:645)
10. `stars_render` survey traversal and luminance reporting loop (modules/stars.c:720)

Near-term additional blockers:
- `on_file_tile_loaded` catalog parse/transform path (modules/stars.c:451)
- `stars_add_data_source` survey loading lifecycle (modules/stars.c:856)

## What Must Be Ported Next

1. Render backend item lifecycle (source-first)
- Port behavior of `render_prepare` -> `get_item` -> `render_points_2d/3d` -> `render_finish`.
- Preserve reorder and batching semantics where source defines them.

2. Painter-to-render call contract
- Ensure `paint_2d_points`/`paint_3d_points` feed the real backend item path, not metadata-only mappings.

3. Stars render traversal fidelity
- Align `stars_render` + `render_visitor` decision chain with source clipping, tile traversal, and draw emission behavior.

4. Clip-info behavior parity
- Port practical `painter_update_clip_info` behavior used by stars clipping fast paths.

## Recommended Next Source-Faithful Slice

Slice name: **Stars Backend Slice S1 — Real Point Item Pipeline**

Goal:
- Replace wrapper-only stars backend execution path with a source-faithful minimal point-item backend path for stars.

Source anchors:
- `src/painter.c`: `paint_prepare`, `paint_2d_points`, `paint_3d_points`, `paint_finish`
- `src/render_gl.c`: `render_prepare`, `get_item`, `render_points_2d`, `render_points_3d`, `render_finish`

AH target files (expected):
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort.ts` (shrink/repurpose)
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterStarsBackendLayer.ts` (convert from state shell to real item sink or remove)
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts` (integration point)

Acceptance boundary (strict):
- No new wrapper status stages.
- No new telemetry-only stage.
- Demonstrate stars points emitted through real backend item batching/flush path.
- Keep direct-star path available behind explicit safety gate until parity checks pass.

## Audit-Specific Risks

1. Risk of “measurement over implementation”
- Telemetry can continue to improve while parity remains flat.

2. Risk of abstraction lock-in
- Additional wrapper layers may harden non-source architecture and increase rework.

3. Risk of parity illusion in docs
- Stage labels can imply progress beyond actual source behavior parity.

## Final Decision Record

- Stage work should remain halted.
- Treat current 4B/4C/4D as prototype scaffolding.
- Next approved work should be direct source-faithful backend item pipeline porting, starting with Slice S1 above.
