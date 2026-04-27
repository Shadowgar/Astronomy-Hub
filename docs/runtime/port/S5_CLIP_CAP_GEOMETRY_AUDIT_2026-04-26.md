# S5 Clip Cap Geometry Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: audit only. No runtime implementation changes.

## Files Audited

- `docs/runtime/port/PORT_DRIFT_AUDIT_2026-04-26.md`
- `docs/runtime/port/S1_POINT_ITEM_PIPELINE_AUDIT_2026-04-26.md`
- `docs/runtime/port/S2_RENDER_GL_ITEM_LIFECYCLE_AUDIT_2026-04-26.md`
- `docs/runtime/port/S3_RENDER_GL_FLUSH_LIFECYCLE_AUDIT_2026-04-26.md`
- `docs/runtime/port/S4_PAINTER_CLIP_CULL_AUDIT_2026-04-26.md`
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/test_painter_port_command_queue.test.js`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/projection.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/projection.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/frames.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/frames.h`

Note: request listed `frame.c` / `frame.h`; pinned source uses `frames.c` / `frames.h`.

---

## Executive Verdict

S5 should be accepted as a **partial source-faithful slice** for painter cap geometry structure and lifecycle shape, but not full clip/projection parity.

Why:
- S5 now stores real cap geometry payloads (`boundingCap`, `viewportCaps[]`, `skyCap`) instead of booleans.
- S5 now models per-frame clip records and explicit unsupported-frame reporting.
- S5 uses center-direction + FOV input from `SkyCore` for cap computation context.

Why not full parity:
- `compute_sky_cap` is still simplified (`[0,0,1]` normal for supported frames) and does not use `convert_frame` output per frame.
- `FRAMES_NB` behavior is not fully ported; only observed frames are computed, others are explicit stubs.
- Tests prove finite/stable output and shape semantics, not numeric equality against Stellarium cap values.

---

## Function-by-Function Comparison

## 1) `compute_viewport_cap` (Stellarium) vs S5 `boundingCap`

Stellarium (`painter.c:69-110`):
- unprojects viewport center (`w/2`,`h/2`) to cap center
- unprojects four corners
- computes `max_sep` from center to corners
- sets `bounding_cap[3] = cos(max_sep)`

S5 (`painterPort.ts:830-907`):
- builds view from projection mode/FOV/viewport/center direction
- unprojects four corners with `unprojectViewportPoint`
- computes max angular separation from `centerVector`
- stores `boundingCap.limit = cos(maxSeparation)`

Assessment:
- **Source-faithful (partial):** same geometric shape for bound calculation (center + corners + cosine separation).
- **Simplified:** S5 center comes from forwarded runtime center direction, not `painter_unproject` of viewport center in each frame referential.

---

## 2) Stellarium `viewport_caps` construction vs S5 `viewportCaps[]`

Stellarium (`painter.c:97-109`):
- only when `max_sep <= pi/2`
- 4 side caps from cross products of adjacent corner vectors
- normalize + orient sign via `cap_contains_vec3(..., bounding_cap)`

S5 (`painterPort.ts:885-901`):
- same `maxSeparation <= pi/2` gate
- cross of adjacent corner directions
- normalize + orient sign via dot against center vector
- stores side caps with plane limit `0`

Assessment:
- **Source-faithful (partial):** same side-cap construction pattern and hemisphere orientation intent.
- **Simplified:** orientation check is dot-vs-center shortcut, not full `cap_contains_vec3` test against 4D cap form.

---

## 3) `compute_sky_cap` parity

Stellarium (`painter.c:112-117`):
- starts with observed zenith vector `[0,0,1]`
- calls `convert_frame(obs, FRAME_OBSERVED, frame, true, p, cap)`
- sets cap limit to `cos(91°)`

S5 (`painterPort.ts:909-920`):
- for supported frames only, returns:
  - `normal = [0,0,1]`
  - `limit = cos(91°)`

Assessment:
- **Source-faithful:** uses correct sky-cap angular threshold (`cos(91°)`).
- **Simplified/missing:** no per-frame normal conversion via `convert_frame`; sky-cap direction is currently constant.

---

## 4) `painter_update_clip_info` vs `FRAMES_NB` / `convert_frame` behavior

Stellarium:
- iterates `FRAMES_NB` (`painter.c:119-126`, `frames.h:101`)
- computes both viewport/sky caps for each frame using frame conversion infrastructure.

S5:
- iterates all 8 frame IDs (`SKY_FRAMES_NB=8`, `painterPort.ts:66`, `791-820`)
- computes caps only for `FRAME_OBSERVED_GEOM` and `FRAME_OBSERVED` (`436-439`)
- marks others `supported=false`, `unsupportedReason='frame_conversion_not_ported'` (`796-805`)

Assessment:
- **Source-faithful seam:** full-frame registry exists and unsupported paths are explicit.
- **Simplified:** no full `convert_frame` parity across `FRAMES_NB`.

---

## 5) Invalid/zero viewport handling

Stellarium:
- no explicit invalid viewport branch in `compute_viewport_cap`; normal flow assumes valid window size from runtime setup.

S5 (`painterPort.ts:780-789`):
- guards invalid viewport dimensions and returns `clipInfo=null`
- sets `clipInfoValid=false` in recorded state (`745-760`)
- tests verify safe handling (`test_painter_backend_port.test.js:534-560`)

Assessment:
- **Safe bounded behavior:** explicit defensive handling added for runtime safety.
- **Not direct source parity:** this is a defensive adaptation, not a mirrored native branch.

---

## Source-Faithful Behaviors in S5

- Cap geometry is now structurally real (vectors + cosine limits), not placeholder booleans.
- `compute_viewport_cap`-like flow now exists (corner unprojection + max-separation bounding cap + side-cap construction).
- Sky cap threshold uses source angle (`91°`) semantics.
- Per-frame clip records are explicit and deterministic.
- Unsupported frame conversion paths are explicit instead of silently implied parity.

---

## Simplifications / Missing Behaviors

- No `convert_frame`-based sky-cap normal computation across frame set.
- No full `FRAMES_NB` geometric parity (only observed-frame subset computed).
- Viewport cap center is not derived through the same native `painter_unproject(frame, center)` path.
- No clip-dependent fast-clip callable parity yet (`painter_is_*_clipped` remain no-op surfaces).
- No full projection struct/matrix parity in render path (`rend->proj` transfer still unported in `render_prepare` equivalent).

---

## Test Coverage Gaps

What tests prove now:
- real cap payload presence and finite numeric stability (`test_painter_backend_port.test.js:347-405`)
- side-cap and sky-cap existence for supported frame (`347-390`)
- explicit unsupported-frame reporting (`502-532`)
- invalid viewport safe behavior (`534-560`)
- command queue payload shape reflects new clip fields (`test_painter_port_command_queue.test.js:26-40`)
- S1/S2/S3/S4 lifecycle regressions still pass in same suite.

What tests do not prove:
- numeric equality vs Stellarium `compute_viewport_cap` outputs for identical observer/projection state
- numeric equality vs `convert_frame`-derived sky-cap normals per frame
- full-frame (`FRAMES_NB`) geometric parity

Conclusion:
- tests validate **finite/stable geometric shape and lifecycle behavior**, not strict numeric/geometric parity against Stellarium.

---

## S5 Acceptance Decision

Accepted as: **partial source-faithful S5 slice** (cap geometry model + bounded frame support with explicit limitations).  
Not accepted as: full `painter_update_clip_info` parity across Stellarium frame/projection contracts.

This matches the S5 constraints (CPU-side, no renderer replacement, no wrapper-stage expansion).

---

## Exact S6 Recommendation

Recommended S6 target: **(a) deeper frame conversion / FRAMES_NB clip-info parity**.

Reason:
- It is the direct residual gap from S5.
- It closes the largest remaining mismatch inside this seam: `convert_frame`-driven per-frame cap normals and full `FRAMES_NB` clip-info population.
- It improves clipping correctness before jumping to object-picking side effects or backend draw execution.

Why not first:
- **(b)** `stars.c render_visitor` is a different subsystem boundary.
- **(c)** `areas_add_circle` should follow stronger frame/clip parity.
- **(d)** `proj_get_depth` is important but belongs to point-3d depth seam, not this immediate clip-info residual.
- **(e)** backend draw execution is higher blast radius and still downstream of missing frame/clip math parity.

---

## Final Note

Do not claim full clip/projection parity from S5.  
S5 materially reduced clip-info drift, but frame-conversion-backed cap parity remains unported.

---

## Appendix — S6 Status Update (EV-0125)

Status: **S6 landed (partial frame-conversion/FRAMES_NB clip-info parity gain, still not full `frames.c` parity)**.

S6 runtime changes:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
  - added source-shaped frame identifiers with pinned numeric mapping (`FRAME_ASTROM..FRAME_VIEW`, `FRAME_ECLIPTIC`).
  - added bounded frame-conversion adapter for clip vectors:
    - supports `FRAME_OBSERVED -> FRAME_OBSERVED` (identity)
    - supports `FRAME_OBSERVED -> FRAME_OBSERVED_GEOM` (bounded identity fallback pending full refraction-state port)
    - supports `FRAME_OBSERVED -> FRAME_VIEW` via view-basis rotation derived from current center direction
    - leaves other frame conversions explicit as unsupported
  - `compute_sky_cap` now routes zenith vector through frame conversion adapter for supported frames instead of constant normal for all supported cases.
  - `compute_viewport_cap` now routes center/corner vectors through frame conversion adapter for supported frames.
  - expanded bounded supported clip-frame set from S5 to include `FRAME_VIEW`.
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
  - continues forwarding `centerDirection` and `fovRadians` into painter reset path; this now feeds the new frame-conversion-backed clip computations.

S6 tests added/extended:
- `frontend/tests/test_painter_backend_port.test.js`
  - verifies bounded supported set includes observed/observed_geom/view
  - verifies view-frame sky-cap normal differs from observed normal when center direction changes (conversion path active)
  - verifies `FRAMES_NB` count and frame IDs match pinned `frames.h` expectations
  - preserves unsupported-frame explicitness, invalid viewport safety, cull parity, and S1/S2/S3/S4/S5 regressions
- existing `frontend/tests/test_painter_port_command_queue.test.js` still validates clip-info command payload shape after S6.

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/test_painter_port_command_queue.test.js tests/test_sky_core_frame_lifecycle_order.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`

Remaining gaps (outside S6 scope):
- no full `convert_frame` parity across all frames and observer-state effects
- bounded observed->observed_geom conversion still uses identity fallback until refraction-state seam is ported
- unsupported frames remain explicit (`frame_conversion_not_ported`) by design
- no backend draw execution parity.
