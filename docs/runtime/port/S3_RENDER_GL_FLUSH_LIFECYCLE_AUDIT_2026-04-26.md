# S3 Render GL Flush Lifecycle Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: audit only. No runtime implementation changes.

## Files Audited

- `docs/runtime/port/PORT_DRIFT_AUDIT_2026-04-26.md`
- `docs/runtime/port/S1_POINT_ITEM_PIPELINE_AUDIT_2026-04-26.md`
- `docs/runtime/port/S2_RENDER_GL_ITEM_LIFECYCLE_AUDIT_2026-04-26.md`
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`

---

## Executive Verdict

S3 should be accepted as a **partial source-faithful slice** for CPU-side flush lifecycle sequencing, but not as full `render_gl.c` flush parity.

Why:
- S3 now models explicit ordered dispatch -> release terminal transitions per item during `render_finish`.
- S3 adds once-per-frame flush-complete and post-flush-reset lifecycle records.
- S3 keeps post-finish immutability and next-frame lifecycle reset behavior deterministic.

Why not full parity:
- Native `rend_flush` executes real item render functions and real GL state transitions; S3 does not.
- Native cleanup releases live GPU/texture/JSON/buffer resources by item family; S3 records lifecycle only.
- Native post-flush reset is real GL state reset; S3 is a CPU marker (`glStateResetMode: 'cpu_modeled'`).

---

## Function-by-Function Comparison

## 1) `render_finish` parity (`render_gl.c`)

Stellarium reference:
- `render_gl.c:1796-1799` — `render_finish` is a thin boundary that calls `rend_flush`.
- `painter.c:145-148` — `paint_finish` directly forwards to `render_finish`.

S3 implementation:
- `painterPort.ts:503-510` — `paint_finish` records and calls `render_finish` once (guarded when already finalized).
- `painterPort.ts:761-859` — `render_finish` performs lifecycle modeling and queue finalization.

Assessment:
- **Source-faithful seam:** call-through boundary exists and frame-finish ownership is centralized.
- **Simplified:** S3 `render_finish` is not a true renderer flush execution boundary; it is a modeled lifecycle boundary.

---

## 2) Flush dispatcher parity vs `rend_flush` item loop

Stellarium reference:
- `render_gl.c:1737-1779` — iterates queued items in order and dispatches by `item->type` to concrete render functions.
- `render_gl.c:1781-1789` — deletes each item and frees resources.

S3 implementation:
- `painterPort.ts:766-805` — iterates mutable items in order and records per-item `dispatch` then `release`.
- `painterPort.ts:831-859` — snapshots finalized items, stores lifecycle records, then clears mutable queue.

Assessment:
- **Source-faithful (partial):** ordered per-item lifecycle loop exists and queue-clear happens after per-item lifecycle processing.
- **Simplified:** no real type-specific dispatch (`item_points_render`, `item_mesh_render`, etc.), only lifecycle records for point-path items.

---

## 3) Dispatch records vs native item dispatch behavior

Stellarium reference:
- `render_gl.c:1738-1775` — dispatch chooses concrete renderer per item type.
- Example point execution path: `item_points_render` (`render_gl.c:1145+`) performs shader setup, GL blend/depth decisions, buffer upload, and draw.

S3 implementation:
- `painterPort.ts:770-784` — records dispatch events and per-item dispatch metadata (`flushDispatches`).

Assessment:
- **Source-faithful (partial):** preserves item-order dispatch intent and per-item dispatch boundary visibility.
- **Simplified:** no concrete draw pipeline behavior (shader, GL calls, buffer upload, draw). Dispatch is representational, not executable.

---

## 4) Release records vs native cleanup/resource release

Stellarium reference:
- `render_gl.c:1781-1789` — `DL_DELETE`, `texture_release`, optional normalmap release, optional JSON free, `gl_buf_release` for buffers/indices, then `free`.

S3 implementation:
- `painterPort.ts:786-805` — records `released: true` and terminal state.
- `painterPort.ts:858` — clears mutable queue after records are emitted.

Assessment:
- **Source-faithful (partial):** release is modeled as a distinct post-dispatch lifecycle phase.
- **Simplified:** no real texture/buffer/heap release semantics and no type-specific release branches.

---

## 5) Post-flush reset record vs native GL reset behavior

Stellarium reference:
- `render_gl.c:1715-1735` sets default GL state pre-loop.
- `render_gl.c:1791-1793` restores depth/color masks after loop.

S3 implementation:
- `painterPort.ts:820-823` and `825-830` — emits post-flush reset record (`glStateResetMode: 'cpu_modeled'`).
- No GL operations occur.

Assessment:
- **Source-faithful (partial):** explicit post-flush reset seam now exists as a first-class lifecycle event.
- **Simplified:** state reset is declarative only; no GL state mutation parity.

---

## Source-Faithful Behaviors in S3

- `paint_finish` -> `render_finish` boundary remains aligned to source call flow (`painter.c:145-148`, `render_gl.c:1796-1799`).
- Flush lifecycle now has ordered per-item dispatch then release phases.
- Terminal per-item lifecycle states are explicit and deterministic.
- Queue clear occurs after lifecycle processing, not before.
- Once-per-frame flush-complete and post-flush-reset lifecycle boundaries exist.
- Next-frame prepare/reset clears prior-frame flush lifecycle records.

---

## Simplifications / Missing Behaviors

- No real `rend_flush` execution of item render functions across item families.
- No real GL state setup/reset parity (`glClear`, `glViewport`, `glDepthMask`, blend/depth toggles, etc.).
- No real resource lifecycle parity (`texture_release`, `gl_buf_release`, `json_builder_free`, `free`).
- Point-path-only lifecycle model; no full non-point item family lifecycle coverage.
- `paint_prepare` still hardcodes `cullFlipped=false` and does not mirror source projection/cull-flip derivation (`painter.c:138-141`, `render_gl.c:365-382`).

---

## Test Coverage vs Source Behavior

Reviewed tests:
- `frontend/tests/test_painter_backend_port.test.js` (`525-646`)
- `frontend/tests/sky-engine-stars-runtime.test.js` (`236-252`, plus stars ownership assertions)

What tests prove:
- Ordered dispatch/release records and terminal `released` state per flushed item.
- Dispatch occurs before release for each item.
- One flush-complete and one post-flush-reset record per frame.
- Post-finish mutation is blocked.
- Next-frame reset clears prior flush lifecycle records.
- Direct star layer remains active in runtime path.

What tests do not prove:
- Any native draw dispatch execution parity (`item_*_render` behavior).
- Any native resource release equivalence (actual texture/buffer/object teardown).
- Any GL state reset equivalence.
- Any parity across non-point item families.

Conclusion:
- Current tests prove **lifecycle-shape parity**, not full native flush behavior parity.

---

## S3 Acceptance Decision

Accepted as: **partial source-faithful S3 slice** (CPU-side flush lifecycle modeling).  
Not accepted as: full `render_gl` flush/resource execution parity.

This acceptance is consistent with S3 scope constraints (CPU-side, no renderer replacement, no wrapper-stage expansion).

---

## Exact S4 Recommendation

Recommended S4 target: **(b) `painter_update_clip_info` + projection flip/cull behavior**.

Reason:
- After S3, additional flush lifecycle deepening without actual backend execution (option a) has sharply diminishing parity value.
- A concrete, source-defined gap remains at frame preamble: `cull_flipped` derivation and projection/prepare state transfer (`painter.c:138-141`, `render_gl.c:365-382`), plus clip-info lifecycle surface.
- This is the smallest next source-faithful seam that materially improves real rendering decision parity without jumping to full backend execution.

Why not first:
- **(a)** more lifecycle-record depth would mostly add metadata without closing execution-parity gaps.
- **(c)** `stars.c::render_visitor` is a broader subsystem jump.
- **(d)** actual backend draw execution is higher blast radius and should follow improved projection/clip/cull contract alignment.

---

## Final Note

Do not claim full `render_gl` parity from S3.  
S3 reduces flush lifecycle drift, but native dispatch/render/resource/GL-state behavior remains materially unported.

---

## Appendix — S4 Status Update (EV-0123)

Status: **S4 landed (partial projection/clip/cull preamble parity gain, still not full projection pipeline parity)**.

S4 changes in runtime code:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
  - `paint_prepare` no longer hardcodes `cullFlipped=false`; it now derives cull parity from source-modeled flip flags:
    - `cullFlipped = flipHorizontal XOR flipVertical` (mirrors `painter.c:138-141` intent)
  - `painter_update_clip_info` now provides a practical subset for active point/star path:
    - viewport dimensions
    - `clipInfoValid`
    - bounded placeholders for `boundingCapComputed` / `skyCapComputed`
  - render backend frame now stores projection/clip/cull preamble state:
    - `projectionMode`
    - `projectionFlags`
    - `flipHorizontal` / `flipVertical`
    - `cullFlipped`
    - `clipInfoValid`
  - added a narrow projection adapter seam (`sync_projection_state`) for runtime projection metadata injection where exact native projection flags are not yet fully ported.
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
  - `reset_for_frame` now receives projection mode + projection flags from a narrow services adapter path (`projectionService.getProjectionMode/getProjectionFlags` when available).
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyProjectionService.ts`
  - added narrow projection flags carrier (`syncProjectionFlags`, `getProjectionFlags`) defaulting to `0`.

S4 tests extended:
- `frontend/tests/test_painter_backend_port.test.js`
  - `paint_prepare` computes/stores clip/projection state.
  - `cullFlipped` false on non-flipped flags.
  - `cullFlipped` toggles correctly on flip parity.
  - `render_prepare` frame state stores computed cull value.
  - next-frame prepare recomputes/clears clip-cull state.
  - point item creation remains valid after clip/cull prep.
- Existing S2/S3 reorder/flush assertions continue to pass.
- `frontend/tests/sky-engine-stars-runtime.test.js` still confirms direct star layer remains active.

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
