# S1 Point-Item Pipeline Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: quality audit only for S1 point-item pipeline; no feature implementation.

## Files Audited

- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render.h`

---

## Executive Result

S1 is a **partial source-shaped port**, not full parity.

- It is source-faithful on basic point-item lifecycle shape: prepare -> get/reuse item -> append points -> finish.
- It is still simplified for projection/depth math, painter state, clipping/object-picking side effects, and flush semantics.
- Current tests prove **shape/count/lifecycle consistency**, not full behavioral parity with Stellarium runtime.

S1 should be treated as: **valid foundation, parity incomplete**.

---

## Function-by-Function Comparison

## 1) `render_prepare` (Stellarium) vs AH equivalent

Stellarium:
- `render_gl.c:365-382` sets framebuffer size/scale, cull flag, full `proj`, resets texture-cache usage flags, and resets depth range.

AH:
- `painterPort.ts:626-637` sets framebuffer size/scale, cull flag, resets point item list, resets depth range.
- `paint_prepare` calls this at `painterPort.ts:404-417`.

Faithful:
- Framebuffer/scale reset and depth reset are present.
- Called from `paint_prepare` in same lifecycle position.

Simplified/Missing:
- No renderer texture-cache reuse/in-use reset (`render_gl.c:377-378`).
- No stored projection matrix equivalent to `rend->proj = *proj` (`render_gl.c:375`).
- `cullFlipped` is hardcoded false in `paint_prepare` call (`painterPort.ts:416`), while Stellarium derives it from projection flip flags in `painter.c:138-141`.

---

## 2) `get_item` (Stellarium) vs AH equivalent

Stellarium:
- `render_gl.c:393-415` scans backward through queued items.
- Reuses item if type, remaining capacity, indices capacity (when needed), and texture match.
- Continues search only while `PAINTER_ALLOW_REORDER` is set.
- Returns `NULL` if no compatible item.

AH:
- `painterPort.ts:658-700` scans backward through mutable point items.
- Reuses item on type/capacity/texture/halo/flags compatibility.
- Stops unless `PAINTER_ALLOW_REORDER` is set (`painterPort.ts:681-683`).
- Creates a new point item if none found.

Faithful:
- Backward scan + reorder stop rule is preserved.
- Capacity and texture compatibility checks exist.

Simplified/Missing:
- Only point items are modeled (`ITEM_POINTS`, `ITEM_POINTS_3D`), no indices-based item families.
- Capacity model is fixed `4096` and point-only.
- Reuse checks are inlined for points; full renderer-wide item compatibility set is not present.

---

## 3) `render_points_2d` (Stellarium) vs AH equivalent

Stellarium:
- `render_gl.c:417-463` caps to `MAX_POINTS=4096`, obtains/reuses `ITEM_POINTS`, validates halo+flags compatibility, writes vertex buffer attrs in NDC/size/color, and updates global clickable areas for `obj`.

AH:
- `painterPort.ts:710-733` caps to 4096, gets/reuses `ITEM_POINTS`, computes NDC via `window_to_ndc` (`painterPort.ts:702-708`), stores size/color/positions in CPU arrays.

Faithful:
- Max-point cap, item reuse path, NDC transform, per-point size/color insertion are present.

Simplified/Missing:
- No GPU `gl_buf_*` writes (CPU-only storage by design for this slice).
- No `areas_add_circle` object-picking side effect (`render_gl.c:455-461`).
- No explicit logging on overflow path; it silently clamps.

---

## 4) `render_points_3d` (Stellarium) vs AH equivalent

Stellarium:
- `render_gl.c:465-513` caps to 4096, obtains/reuses `ITEM_POINTS_3D`, appends 3D vertices, computes depth using projection (`proj_get_depth`), and updates picking areas by projecting to window coordinates.

AH:
- `painterPort.ts:735-768` caps to 4096, gets/reuses `ITEM_POINTS_3D`, appends 3D point payloads, updates `depthMin/depthMax`.

Faithful:
- Same high-level flow and item type split.
- Depth range tracking exists.

Simplified/Missing:
- Depth is derived from `point.pos[2]` directly (`painterPort.ts:759-760`), not projection depth (`render_gl.c:502-504`).
- No object-picking area updates (`render_gl.c:506-511`).
- No GPU buffer path.

---

## 5) `render_finish` (Stellarium) vs AH equivalent

Stellarium:
- `render_gl.c:1796-1799` calls `rend_flush`, which renders each queued item then releases resources (`render_gl.c:1760-1794`).

AH:
- `paint_finish` calls `render_finish` (`painterPort.ts:421-424`).
- AH `render_finish` snapshots point items and marks `flushReady=true` (`painterPort.ts:640-655`).
- Finalization freezes command/batch lists (`painterPort.ts:504-532`).

Faithful:
- Explicit end-of-frame finish boundary exists.

Simplified/Missing:
- No draw dispatch/flush execution equivalent to Stellarium `rend_flush`.
- No per-item GL state changes, resource release, or render-item destruction pass.
- Finish is a CPU finalization seam only.

---

## 6) `paint_2d_points` / `paint_3d_points` call-through parity

Stellarium:
- `painter.c:172-181` forwards directly to `render_points_2d`/`render_points_3d`.

AH:
- `painterPort.ts:432-442` forwards directly to internal `render_points_2d`/`render_points_3d` after command record.

Faithful:
- Direct call-through seam exists for both functions.

Simplified/Missing:
- Live star render path currently invokes 2D point path only in `StarsModule` (`StarsModule.ts:191-206`, `366-376`).
- No live module path currently exercises `paint_3d_points`.

---

## What Is Source-Faithful in S1

- Point pipeline lifecycle shape (`paint_prepare` -> point accumulation -> `paint_finish`).
- Point-item reuse scan with reorder guard.
- 2D NDC conversion formula equivalent form (`render_gl.c:358-363` vs `painterPort.ts:702-707`).
- 4096 max-point clamp behavior.
- Exposed `paint_2d_points` / `paint_3d_points` call-through seam.

---

## What Is Simplified

- CPU-side item arrays instead of renderer buffer writes and draw dispatch.
- Simplified depth model in 3D points.
- Simplified render-item families (points only in this slice).
- Fixed item capacity and no generalized buffer/indices model.
- `cullFlipped` not derived from projection flip flags in prepare path.

---

## What Is Missing

- `rend_flush`-equivalent execution and cleanup behavior.
- Full projection transfer and usage in renderer state.
- Texture cache in-use invalidation semantics from `render_prepare`.
- Object-picking side effects (`areas_add_circle`) for both 2D/3D point paths.
- Live usage of `paint_3d_points` from stars path.

---

## Test Coverage Audit

Assessed tests:
- `frontend/tests/test_painter_backend_port.test.js` (`S1` block at lines `302-441`)
- `frontend/tests/sky-engine-stars-runtime.test.js` (stars painter integration block at lines `316-421`)

What current tests prove:
- Frame reset clears prior frame point items and depth sentinels.
- `paint_2d_points` creates/fills an `ITEM_POINTS` item.
- Compatible item reuse path works for repeated 2D point writes.
- `paint_finish` finalizes and preserves expected item/batch counts.
- Stars module writes painter commands and point items while direct star layer remains active.

What current tests do not prove:
- Projection-correct depth parity (`proj_get_depth` equivalent) for 3D points.
- Full reorder semantics across mixed item flags/order barriers.
- `rend_flush`-equivalent draw/cleanup behavior.
- Object-picking side effects parity (`areas_add_circle`) from point renders.
- `paint_3d_points` live-module integration behavior.

Conclusion on tests:
- Current tests validate **shape/count and lifecycle boundaries**, not full source parity.

---

## Exact S2 Recommendation (Smallest Source-Faithful Next Slice)

Recommended target: **(a) render_gl item flags/reorder/flush behavior**.

Why this is the smallest next parity slice:
- It extends the same S1 seam (`render_prepare/get_item/render_points/render_finish`) already in place.
- It directly addresses the largest remaining mismatch in this subsystem: flush and item lifecycle semantics.
- It avoids premature scope jump into clipping/projection matrix correctness, stars traversal, or backend replacement.

S2 should include:
- Source-faithful `get_item` barrier behavior under `PAINTER_ALLOW_REORDER` with mixed item conditions.
- `render_finish` behavior upgrade from snapshot-only to source-modeled item flush lifecycle semantics (still allowed to remain non-visual if gated, but lifecycle must mirror source contracts).
- Explicit tests for reorder barrier behavior and finish-flush lifecycle contracts.

S2 should not target first:
- (b) clipping/projection behavior (important but larger cross-cutting seam).
- (c) `stars.c::render_visitor` traversal (different subsystem boundary).
- (d) actual backend draw execution (higher blast radius than needed for immediate parity closure).

---

## Final Audit Verdict

S1 is acceptable as a **partial point-item pipeline port foundation**, but it is not sufficient evidence of full Stellarium parity for renderer behavior.  
Proceed to S2 only with option **(a)** and with parity assertions tied to `render_gl.c` function contracts, not wrapper-stage status.

---

## Appendix — S2 Status Update (EV-0121)

Status: **S2 landed (partial parity gain, not full `render_gl.c` parity)**.

S2 changes implemented in `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`:
- item model now includes source-relevant lifecycle fields used by `get_item`/flush assertions:
  - `type`, `flags`, `textureRef`, `capacity`, `pointCount`
  - `orderIndex`
  - `compatibilityKey`
  - `flushed`
- `get_item` matching now uses an explicit compatibility key (`type|flags|halo|texture`) plus capacity/free-space checks and the reorder barrier scan rule.
- `render_finish` now models a `rend_flush`-like lifecycle seam:
  - produces ordered flushed snapshots
  - records per-item flush/release results
  - marks items flushed and clears mutable queue after flush.

S2 tests added/extended:
- `frontend/tests/test_painter_backend_port.test.js`
  - compatible item reuse
  - reorder barrier stop when newest incompatible item does not allow reorder
  - crossing prior compatible item when reorder is allowed
  - incompatible flags/texture create new item
  - capacity overflow creates new item
  - flush order and release lifecycle records
  - post-finish immutability and next-frame reset behavior
- `frontend/tests/sky-engine-stars-runtime.test.js`
  - stars runtime still feeds point items and direct star layer remains active.

Validation (EV-0121):
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`

Remaining gaps (still outside S2 scope):
- no GPU draw execution replacement / no renderer ownership handoff from direct star layer
- no full projection-depth parity (`proj_get_depth`) for 3D points
- no `areas_add_circle` side-effect parity
- no broader `render_gl.c` item families beyond point-path focus.
