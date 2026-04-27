# S2 Render GL Item Lifecycle Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: audit only. No runtime implementation changes.

## Files Audited

- `docs/runtime/port/PORT_DRIFT_AUDIT_2026-04-26.md`
- `docs/runtime/port/S1_POINT_ITEM_PIPELINE_AUDIT_2026-04-26.md`
- `docs/runtime/port/painter-c-api-surface-mapping.md`
- `docs/runtime/port/render-gl-backend-mapping-shell.md`
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`

---

## Executive Verdict

S2 should be accepted as a **partial source-faithful slice** for item reuse/reorder/flush lifecycle semantics on the point path.

Why:
- `get_item` backward scan + reorder barrier semantics are now materially closer to `render_gl.c`.
- Item compatibility now explicitly includes type/flags/halo/texture via compatibility key.
- `render_finish` now models ordered flush and release-record lifecycle instead of snapshot-only behavior.

Why not full parity:
- Still CPU-only; no `rend_flush` render dispatch/state transitions/resource teardown equivalent.
- No indices-capacity path (point-only pipeline).
- No full projection/cull/clip parity; no `areas_add_circle` parity side effects.

---

## Function-by-Function Comparison

## 1) `get_item` parity (`render_gl.c`)

Stellarium reference:
- `render_gl.c:393-415`
  - backward scan from newest item
  - reuse condition: type + vertex capacity + indices capacity (if needed) + texture identity
  - stop scan when candidate item does not allow reorder (`PAINTER_ALLOW_REORDER`)

S2 implementation:
- `painterPort.ts:716-770`
  - backward scan from newest mutable item (`737-751`)
  - compatibility key includes `type|flags|halo|texture` (`313-320`, `730-735`, `741`)
  - capacity check present (`742`)
  - reorder barrier stop present (`747-749`)
  - creates new item when incompatible (`753-769`)

Assessment:
- **Source-faithful:** backward scan, reorder barrier, type/texture compatibility (through key), capacity gating.
- **Simplified:** no indices-size compatibility branch because S2 currently models only point items (`render_points_*` path with implicit indices size 0).

---

## 2) Item flags and compatibility fields

Stellarium references:
- painter flags enum in `painter.h:88-103`
- points reuse extra checks in `render_gl.c:430-434` and `479-483` (halo + flags)

S2 implementation:
- flags enum mirrored in `painterPort.ts:42-53`
- compatibility key uses type/flags/halo/texture (`313-320`)
- reorder crossing keyed to `PAINTER_ALLOW_REORDER` (`747`)
- item fields include `flags`, `textureRef`, `halo`, `compatibilityKey`, `orderIndex`, `flushed` (`87-99`, `351-364`)

Assessment:
- **Source-faithful:** `PAINTER_ALLOW_REORDER` semantics now actively affect scan traversal; point halo/flags are part of compatibility.
- **Simplified/Missing:** broader `render_gl.c` item-type-specific compatibility families are not modeled (lines, mesh, text, etc.); no texture object identity/reference counting semantics equivalent to native texture handles.

---

## 3) `render_finish` / `rend_flush` lifecycle parity

Stellarium references:
- `render_finish` calls `rend_flush` (`render_gl.c:1796-1799`)
- `rend_flush` iterates items in order, dispatches by item type, then deletes/releases/free each item (`render_gl.c:1737-1790`), and resets GL state (`1791-1794`)

S2 implementation:
- `paint_finish` -> `render_finish` (`painterPort.ts:453-458`)
- `render_finish` now:
  - builds ordered flushed point-item snapshots (`682-696`)
  - builds explicit release records (`697-706`)
  - marks backend flush ready and stores results (`707-712`)
  - clears mutable queue (`713`)
- post-finish mutation blocked by frame-finalized guard (`521-524`)

Assessment:
- **Source-faithful (partial):** ordered flush boundary and release lifecycle representation now exist; post-finish mutation prevention is explicit.
- **Simplified:** no draw dispatch by item type, no GL state lifecycle, no real resource release (`texture_release`, `gl_buf_release`, free), no linked-list deletion semantics.

---

## 4) `paint_2d_points` / `paint_3d_points` call-through status

Stellarium references:
- `painter.c:172-181` direct call-through into `render_points_2d/3d`

S2 implementation:
- `painterPort.ts:465-475` call-through to `render_points_2d/3d` preserved

Assessment:
- **Source-faithful seam maintained** for API call path.
- **Remaining simplification:** runtime stars path still exercises 2D points only in current integration tests.

---

## Source-Faithful Behaviors in S2

- Backward-scan `get_item` behavior with reorder barrier stop rule.
- Compatibility gating now captures the point-path shape of native checks (type/flags/halo/texture + capacity).
- Ordered flush lifecycle seam with explicit flushed/released records.
- Immutable finalized frame behavior after `paint_finish`.
- Reset/prepare clears prior frame flushed state.

---

## Simplifications / Missing Behaviors

- No indices-capacity compatibility branch (point-only path).
- No native draw execution dispatch (`item_*_render`) in flush phase.
- No native resource-release lifecycle (`texture_release`, `gl_buf_release`, free).
- No GL state lifecycle resets during flush.
- No `areas_add_circle` parity side effects from point paths.
- No projection-depth parity (`proj_get_depth`) in 3D point depth updates.
- No `paint_prepare` parity for derived `cull_flipped` and projection transfer/caching equivalent.

---

## Test Coverage vs Source Behavior

Test evidence reviewed:
- `test_painter_backend_port.test.js`:
  - reuse, barrier stop, reorder crossing (`368-447`)
  - incompatible flags/texture (`449-497`)
  - capacity overflow (`499-523`)
  - flush ordering + release records + immutability/reset (`525-602`)
- `sky-engine-stars-runtime.test.js`:
  - stars runtime feeds painter point items and direct star layer remains active (`316-424`)

What is proven:
- Point-path reorder barrier behavior is functionally verified.
- Compatibility failures create new items.
- Capacity overflow splits items.
- Flush order/release records/immutability/reset are enforced.
- Direct star layer remains active with painter point emission.

What remains unproven:
- Native-style `rend_flush` render dispatch across item families.
- Native resource release semantics and GL state reset equivalence.
- 3D depth parity (`proj_get_depth`-based).
- Point-object picking side effects.
- Full clip/projection/cull parity from painter preamble.

---

## S2 Acceptance Decision

Accepted as: **partial source-faithful S2 slice**.  
Not accepted as: full `render_gl` parity.

This matches the requested S2 intent (item flags/reorder/flush lifecycle semantics) while preserving current constraints (CPU-side, no renderer replacement, no wrapper-stage expansion).

---

## Exact S3 Recommendation

Recommended S3 target: **(a) render_gl flush/resource lifecycle deeper parity**.

Reason this is the smallest next source-faithful step:
- It extends the same S2 seam directly (`render_finish`/`rend_flush`) without broadening into stars traversal or backend ownership replacement.
- Remaining highest-signal gap after S2 is flush execution lifecycle fidelity, not item matching logic.
- It can remain CPU-side while still modeling native lifecycle contracts more tightly (dispatch ordering, per-item terminal states, release semantics).

Why not the other options first:
- **(b)** clip/projection/cull parity is important but cross-cutting and larger.
- **(c)** `stars.c::render_visitor` is a different subsystem and broader scope jump.
- **(d)** actual backend draw execution is higher blast radius than needed for immediate parity-risk reduction.

---

## Final Note

Do not claim full `render_gl` parity from S2.  
S2 reduces the identified gap but leaves native flush execution/resource lifecycle and projection/clip behavior materially incomplete.

---

## Appendix — S3 Status Update (EV-0122)

Status: **S3 landed (deeper CPU-side flush/resource lifecycle parity, still not full `render_gl.c` parity)**.

S3 changes in `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`:
- `render_finish` now models an explicit CPU-side dispatch loop before release records.
- each flushed point item now carries terminal lifecycle fields:
  - `dispatched`
  - `released`
  - `terminalState` (`queued` -> `dispatched` -> `released`)
- backend frame now publishes explicit flush lifecycle artifacts:
  - `flushDispatches`
  - ordered `flushLifecycleEvents` (`dispatch`, `release`, `flush_complete`, `post_flush_state_reset`)
  - `flushCompleteRecord` (once per frame)
  - `postFlushStateResetRecord` (source-modeled GL reset seam, CPU-side only)
- mutable queue is cleared only after dispatch/release/complete/reset records are finalized.
- post-finish mutation remains blocked.

S3 tests extended in `frontend/tests/test_painter_backend_port.test.js`:
- verifies dispatch order and release order match source queue order.
- verifies per-item dispatch happens before release.
- verifies terminal item state is `released`.
- verifies one flush-complete record and one post-flush-state-reset record per frame.
- verifies lifecycle records are cleared by next-frame `reset_for_frame` + `paint_prepare`.
- verifies post-finish mutation remains blocked.

Validation run:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
