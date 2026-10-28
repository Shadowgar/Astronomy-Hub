# Solar System 2.1 — implementation and qualification plan

Owner attachment dated2026-10-28 authorizes actual Takram Earth atmosphere and actual NASA 3D Tiles regional Moon terrain on existing PR107/recovery. Starting head: `b4005ce48e9869c298de4ed019c67e4e246accda`; main: `9a03d8260a529f5858c5c3298cbb9d32b721daeb`. No merge, production deployment, branch deletion, native-renderer replacement or protected-data changes. Owner acceptance and physical iPhone remain open.

## Loaded authority

Root and frontend/backend AGENTS; CORE_CONTEXT; LIVE_SESSION_BRIEF; CONTEXT_MANIFEST solar_reconstruction pack: SYSTEM_VALIDATION_SPEC, UNIFIED_UNIVERSE_ARCHITECTURE, decisions/0010-r3-a-solar-runtime, ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21, UNIFIED_WORKSPACE_DESIGN_SPEC, adaptive-explorer-r1a README, owner-acceptance README, visual-fidelity README, solar-system-2 PLAN and its existing implementation evidence. New owner attachment supersedes the prior Solar2 stop only for this scope. No full docs scan.

## Implementation ownership

- Root: dependency/build boundary, qualified Earth frame, existing Solar pipeline/controls integration, product terrain entry, preview, evidence/CI.
- Takram worker: actual module/LUTs, lifecycle, focused tests.
- Terrain source worker: official bounded NAC DTM/ortho acquisition, manifests, reproducible 3D Tiles conversion and source tests.
- Terrain runtime worker: actual TilesRenderer, regional camera/cache/LOD/lifecycle and focused tests.
- Fresh reviewers after implementation: frame/science, renderer integration, terrain source/frame/license. Reviewers must not approve their own code.

## Decisions and evidence ledger

1. Direct Takram0.19.1 install alongside React18 reproducibly fails npm ERESOLVE due optional React>=19 bindings. Do not force or ignore peers. Use a separate vanilla graphics package with its own coherent lockfile, standard npm ci, and bundler single-Three aliases. Upstream nonoptional React19/R3F peers are installed only inside the isolated graph; independent bundle inspection proves they are not imported. The Hub remains React18. Frontend installs that boundary via postinstall; Docker copies both manifests before npm ci.
2. Preserve single Solar RAF, floating origin and HDR output pass. Actual atmosphere precedes bloom/tone mapping. JPL Earth/Sun and explicitly qualified ICRF-to-ITRS Earth orientation drive its local metre frame. Custom atmosphere remains selectable and reported fallback.
3. Native Moon stays unchanged. Advanced regional terrain is a separate reachable route with serialized renderer lifetime and saved native return state. NASA package must perform actual streaming/LOD/rendering.
4. Bounded source: Apollo17 NAC5m DTM plus matching5m ortho, official PDS; frame realization limitations must be visible. Acquisition capped256MiB; served crop capped64MiB.

## Qualification sequence

Red/green focused source/frame/renderer tests; valid dependency tree and reproducible build; warning-clean Docker science; actual Windows Edge/NVIDIA fixed-camera A/B atmosphere and terrain cases, quality/context/lifecycle and navigation checks, measured CPU/GPU/RAF/load/cache costs; independent correction reviews; exact-head GitHub checks and PR107 factual update. Maintain Solar2 rollback and private4231 listener. Stop after qualification for owner acceptance.
