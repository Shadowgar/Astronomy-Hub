# S6 Frame Conversion + Clip-Info Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: audit only. No runtime implementation changes.

## Files Audited

1. `docs/runtime/port/CODEX-HANDOFF.md`
2. `docs/runtime/port/PORT_DRIFT_AUDIT_2026-04-26.md`
3. `docs/runtime/port/S4_PAINTER_CLIP_CULL_AUDIT_2026-04-26.md`
4. `docs/runtime/port/S5_CLIP_CAP_GEOMETRY_AUDIT_2026-04-26.md`
5. `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
6. `frontend/tests/test_painter_backend_port.test.js`
7. `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
8. `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`
9. `study/stellarium-web-engine/source/stellarium-web-engine-master/src/frames.c`
10. `study/stellarium-web-engine/source/stellarium-web-engine-master/src/frames.h`
11. `study/stellarium-web-engine/source/stellarium-web-engine-master/src/projection.c`
12. `study/stellarium-web-engine/source/stellarium-web-engine-master/src/projection.h`
13. `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c`

No additional repository documents were used for authority decisions in this audit.

## Executive Verdict

S6 is acceptable as a **partial source-faithful slice** for clip-info frame registry and bounded conversion behavior, but it is not full `frames.c`/`painter.c` conversion parity.

Decision: **Accept S6 as partial and proceed to S7 `stars.c render_visitor` traversal (option b)**, while keeping S6 limitations explicit.

Why:
- S6 now matches key source shape decisions (`FRAME_*` IDs including `FRAME_ECLIPTIC`; `FRAMES_NB=8`; loop bounded to clip frames 0..7).
- S6 routes clip vectors through a conversion seam for supported frames (observed, observed_geom, view) instead of hardcoded fixed sky-cap normals.
- Remaining gaps are clearly bounded and explicit (`frame_conversion_not_ported`) rather than hidden.

## Function-by-Function Comparison

## 1) Frame IDs and `FRAMES_NB`

Stellarium source:
- `frames.h`: `FRAME_ASTROM=0 ... FRAME_VIEW=7, FRAME_ECLIPTIC=8`
- `#define FRAMES_NB (FRAME_VIEW + 1)` => `8`

S6:
- `painterPort.ts`: same frame enum numeric mapping, including `FRAME_ECLIPTIC=8`
- `SKY_FRAMES_NB = 8`
- `buildClipInfoSubset()` loops `for (frameId = 0; frameId < SKY_FRAMES_NB; frameId++)`

Assessment:
- **Source-faithful:** frame IDs and bounded clip loop cardinality.
- **Intentional bound preserved:** clip-info iteration excludes `FRAME_ECLIPTIC` exactly as native `FRAMES_NB` does.

## 2) Bounded `convert_frame` adapter vs native `convert_frame`

Stellarium source:
- `frames.c::convert_frame` supports forward/backward conversion chains across frames.
- Includes atmospheric/refraction behavior between `FRAME_OBSERVED_GEOM` and `FRAME_OBSERVED` based on observer pressure.
- Includes ecliptic bridges (`FRAME_ECLIPTIC <-> FRAME_ICRF`).
- Includes mount/view matrix steps (`ro2m`, `ro2v`, `rv2o`).

S6 adapter (`convertFrameVectorForClipInfo`):
- `observed -> observed`: identity
- `observed -> observed_geom`: identity fallback (bounded, no refraction-state seam)
- `observed -> view`: basis rotation from center direction
- all other origins/destinations: `null` (unsupported)

Assessment:
- **Source-faithful (bounded seam behavior):** explicit conversion path exists and is used.
- **Missing parity:** no full conversion graph, no pressure/refraction branch parity, no ecliptic bridge, no mount/ICRF/CIRS/JNOW pathways.

## 3) Observed / Observed_geom / View support expectations

Stellarium expectations:
- `compute_sky_cap` calls `convert_frame(obs, FRAME_OBSERVED, frame, true, ...)` for every frame in `FRAMES_NB`.
- For view frame, transform is observer-matrix-derived (`ro2v`/`rv2o` chain in frame conversion logic).

S6:
- supported clip frames: `FRAME_OBSERVED_GEOM`, `FRAME_OBSERVED`, `FRAME_VIEW`
- unsupported others are explicit with `unsupportedReason: frame_conversion_not_ported`
- view conversion is basis-rotation-derived from current center direction

Assessment:
- **Source-faithful (partial):** support expanded beyond observed-only and includes view behavior.
- **Simplified:** observed->observed_geom identity is not native refraction-aware behavior.

## 4) `compute_sky_cap` parity check

Stellarium (`painter.c`):
- `p = [0,0,1]`
- `convert_frame(obs, FRAME_OBSERVED, frame, true, p, cap)`
- `cap[3] = cos(91°)`

S6:
- starts from observed zenith `[0,0,1]`
- routes through bounded conversion adapter for supported frames
- uses `limit = cos(91°)`

Assessment:
- **Source-faithful:** zenith origin and 91-degree cap threshold.
- **Simplified:** conversion math is subset-only; native observer-state-dependent conversions are not fully represented.

## 5) `compute_viewport_cap` parity check

Stellarium (`painter.c`):
- unproject viewport center and corners in target frame
- compute max separation from center to corners
- `bounding_cap.limit = cos(max_sep)`
- if `max_sep <= pi/2`, compute four side caps from adjacent corner cross products and orient each cap against bounding cap containment

S6:
- unprojects corners in observed space, then converts vectors into destination frame via bounded adapter
- computes max separation and cosine bound
- computes side caps from adjacent corner crosses, orientation by sign vs center vector

Assessment:
- **Source-faithful (shape):** same geometric sequence (center/corners, max-sep cosine, optional side-cap set).
- **Simplified:** orientation test is simplified vs native `cap_contains_vec3` containment test.

## 6) What Is Source-Faithful in S6

- Frame enum mapping, including `FRAME_ECLIPTIC` numeric ID.
- `FRAMES_NB=8` clip-iteration boundary for clip-info.
- Explicit per-frame clip records and explicit unsupported-frame outcomes.
- `compute_sky_cap` threshold (`cos(91°)`) and observed-zenith source vector.
- `compute_viewport_cap` geometric pattern (center/corners, max separation, side caps).
- View-frame sky-cap and viewport cap vectors are produced through a conversion path (not constant fallback).

## 7) What Remains Simplified or Missing

- Full `frames.c::convert_frame` parity across the complete frame graph.
- Refraction-aware observed/observed_geom round-trip behavior.
- Native ecliptic bridge behavior in conversion path.
- Native frame-matrix parity (`ro2v`, `rv2o`, mount and intermediate frame transforms).
- Native containment/orientation test parity (`cap_contains_vec3` exact semantics).
- Clip fast-path callable parity (`painter_is_*_clipped`) remains stubbed/no-op in Hub runtime.

## 8) Test Coverage Reality (What Is Proven vs Not Proven)

Current tests (`test_painter_backend_port.test.js`) prove:
- frame enum + `FRAMES_NB` shape matches pinned `frames.h`
- bounded supported set includes observed, observed_geom, view
- unsupported frames stay explicit
- view sky-cap normal differs from observed when center direction changes (conversion path active)
- clip-info payload is finite and structurally valid

Current tests do **not** prove:
- numeric parity against native `convert_frame` outputs for same observer/projection state
- numeric parity of cap normals/limits vs Stellarium across frames
- full geometric parity of side-cap orientation/containment behavior
- end-to-end clipping parity in render traversal (`painter_is_healpix_clipped`, etc.)

Conclusion: tests currently prove **bounded adapter behavior and state shape**, not full numeric/geometric parity.

## 9) S6 Acceptance Decision

Accepted as: **partial source-faithful S6 slice** (frame IDs, clip-loop cardinality, bounded conversion-backed clip info for observed subset + view).

Not accepted as:
- full `frames.c` conversion parity
- full `painter_update_clip_info` geometric parity for all clip frames
- full projection/frame-matrix parity

This preserves source truth while avoiding parity overclaims.

## 10) Exact S7 Recommendation

Recommended S7 target: **(b) `stars.c render_visitor` traversal**.

Rationale:
- S6 closed the immediate clip-info shape gap enough to unblock traversal-facing work without pretending full conversion parity.
- `render_visitor` is the next highest product-impact seam for visible stars behavior and directly ties into module2 acceptance trajectory.
- Further deepening conversion parity first (option a) is valid later, but it is a larger cross-frame/math branch that does not unblock traversal ownership as directly as option (b).

S7 scope guardrails:
- Port traversal/control-flow decisions from `modules/stars.c::render_visitor` and `stars_render` first.
- Keep clip fast-path limitations explicit where current painter clip calls are still stubbed.
- Do not broaden into backend draw parity (`e`) or projection-depth parity (`d`) during S7 traversal slice.
- Defer `areas_add_circle`/picking side effects (`c`) until traversal parity baseline is in place.

## Option Ranking (for this exact transition)

1. **(b) `stars.c render_visitor` traversal** — recommended next.
2. **(a) deeper full `convert_frame` parity** — important residual, but not best immediate next for module2 traversal closure.
3. **(c) `areas_add_circle` / picking side effects** — downstream of traversal behavior.
4. **(d) projection-depth parity (`paint_3d_points` / `proj_get_depth`)** — renderer-depth seam, separate from immediate traversal parity.
5. **(e) actual backend draw execution** — highest blast radius; not the next bounded module2 move.

## Final Constraint Statement

This audit does **not** claim full frame/projection parity. It records S6 as a bounded, source-shaped partial slice that is sufficient to proceed to S7 traversal work under explicit limitations.
