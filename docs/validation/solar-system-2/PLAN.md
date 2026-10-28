# Solar System 2.0 implementation plan

> **For agentic workers:** Use the executing-plans and test-driven-development workflows, with coordinated parallel specialists and independent non-author reviews. The owner explicitly authorizes autonomous execution without intermediate approval gates.

**Goal:** Replace the limited Solar presentation/exploration layer with a materially richer, source-connected, usable explorer on existing recovery PR107.

**Architecture:** Retain one Three.js runtime, React controls and existing FastAPI/JPL science authority. Separate scientific epochs/vectors from camera-relative presentation, resource ownership, materials/postprocessing, navigation and time controls. Native Sky, Earth and Moon remain independent. Keep the previous private build as rollback until browser qualification.

**Tech stack:** React18, Three0.180 (one instance; bundled addons preferred), TypeScript, FastAPI/Skyfield, Vitest, Playwright, existing private Docker preview.

**Spec:** Owner's October28 Solar System2.0 directive (21 sections), exact approved cinematic PNGs and existing science contracts. This plan records implementation decisions within that explicit scope; it does not claim owner visual acceptance.

## Constraints and loaded context

Existing branch `recovery/reconcile-20261026`; starting SHA51771f06d9ffd3b919672b7542a9c84df13d92f6; remote main9a03d8260a529f5858c5c3298cbb9d32b721daeb. No new PR/branch, merge, deployment, public source publication, data/volume/settings alteration or native engine replacement. New local source packs must be separately qualified and never overwrite protected originals. No invented positions, imagery resolution, body center, terrain or coverage. All/Inner/Outer remain camera presets. Cinematic radii are disclosed and reversible. Physical close-ups approach source positions.

Task-specific context: AGENTS.md permanent rules; CORE_CONTEXT and LIVE_SESSION_BRIEF current directives; CONTEXT_MANIFEST; SYSTEM_VALIDATION_SPEC; UNIFIED_UNIVERSE_ARCHITECTURE; ADR0010; ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21; UNIFIED_WORKSPACE_DESIGN_SPEC; adaptive-explorer-r1a/README; recovery owner-acceptance and visual-fidelity reports; source contracts in solarContracts/systemContracts/backend services. Historical activation/stop rules are superseded only by the explicit current directive. No full docs scan.

## Decisions

Use Three addons for a bounded HDR/bloom pipeline, avoiding a duplicate engine or React major upgrade. Compare pinned external code/licenses before reuse; graphics specialist records compatibility. Preserve scientifically validated JPL source windows; reuse the existing planetary Hermite strategy for running Solar time. Stop/pause visibly at unavailable coverage. Source updates never recreate WebGL.

Solar selection stays in Solar with explicit Fly to / planetary-system entry. The current automatic route-away on selection conflicts with the owner's requested Saturn destination and will change. Existing moon systems remain the accurate parent-centered destination until physical-center alignment is qualified. No moons attached silently to a planetary barycenter.

Use camera-relative doubles on the CPU and local floats on GPU, explicit Sun direction independent of floating origin, source mean radii for close-ups and collision limits. One render scheduler owns camera travel/time/free flight; visibility suspension prevents hidden-tab jumps.

The existing build `output/playwright/owner-acceptance/hub-visual` remains the visual baseline. New output uses a separate directory. Exact approved originals remain byte-identical. New preview replaces only the task nginx root after qualification; no network policy changes.

## Review focus

- Time/source arrival races, reverse playback and coverage boundaries must retain last good state and never attach stale vectors to a new epoch.
- Camera-relative rebasing must preserve source coordinates, lighting and close-range precision, including at Neptune and during long flights.
- Rapid navigation/context loss/asset completion must not revive a disposed renderer or leak GPU resources.
- Mobile disclosures, keyboard focus and persistent observer/time state must survive body/system/mode handoffs.
- Assets/orbits/terrain must retain source identity and truthful resolution/approximation/rights limits.

## Stage 1 — foundation and source windows

Files: new solarPrecision.ts, solarClock.ts, solarAssets.ts; SolarScene.ts; backend Solar motion service/schema/route; solarMotion.ts; focused tests.

Interfaces: source SolarSnapshot stays `oras.solar.v1` ICRF/AU/UTC with explicit JPL targets. New motion window carries source hash, identity, coverage, validated tracks and interpolation error; pure evaluator returns vectors for a single epoch or rejects outside coverage. `SolarScene.updateSnapshot(snapshot)` updates scientific state without rebuilding resources. `SolarClock` advances a monotonic interval only while running and can reverse/seek/pause.

- [x] Write/run red tests for small local offsets at outer-planet distances, origin-invariant illumination, monotonic/reverse/paused clock and cancellation/budgets.
- [x] Implement precision/resource/clock units and validated JPL motion windows.
- [x] Integrate source updates with one persistent scene; test source identity and renderer lifetime.
- [x] Run focused Vitest/backend tests and typecheck; commit reviewed foundation.

## Stage 2 — materials, Saturn and navigation

Files: solarMaterials.ts, new solarRings.ts and solarRenderPipeline.ts; new camera controller; SolarScene.ts, SolarWorkspace.tsx and Solar fidelity CSS; asset manifest and acquisition script.

Interfaces: world Sun direction from authoritative positions; render pipeline owns targets/effects and one final color/tone transform. Explicit quality profiles bound pixel ratio/effects. Scene exposes orbit/follow/free flight/travel and stable diagnostics. Asset acquisition is abortable and disposed on unmount.

- [x] Inspect pinned upstream source/license; choose qualified maps/models and retain receipts.
- [x] Add/execute tests for ring bands/shadows, transform invariance, quality/disposal and camera collision/input cancellation.
- [x] Implement real imagery materials, Saturn rings/limb/shadows, bounded HDR Sun/bloom.
- [x] Add accessible direct search, camera modes, time controls and explicit system handoff. Preserve native state.
- [x] Build and capture desktop/portrait/landscape, inspect actual imagery and repair shader/navigation issues; commit coherent rendering changes.

## Stage 3 — small bodies and terrain boundary

Files: source-backed asteroid ingestion/manifest, orbit evaluator/renderer, selected object controls; optional isolated terrain adapter where source rights/frame permit.

- [x] Qualify published orbital elements, epoch/time scale/frame and a named shape source. Test propagation against independent reference epochs.
- [x] Integrate bounded batched orbital population with live time, source identity and approximation disclosure; named body selection/approach; no movie-density claims.
- [x] Inspect pinned 3DTiles and existing lunar sources. Attempt an isolated legal terrain demonstration only with actual source elevation/frame; keep coarse native globe fallback truthful.
- [x] Test failure/coverage/LOD/cancellation and capture actual behavior; record precise dataset blockers without blocking independent work.

## Stage 4 — integrated qualification

- [x] Run affected frontend/science/runtime contracts, typecheck/build and asset/reference hash checks.
- [x] Exercise actual Windows NVIDIA renderer, frame/GPU/CPU timings, camera/time/source navigation and context recovery; retain raw receipts and failures.
- [x] Capture matched original/before/after gallery and short actual recordings. Include Saturn geometry, Earth/Mars, asteroid and time/free flight. Mobile emulation is not a physical iPhone pass.
- [x] Obtain separate non-author science/material/license/integration review; reproduce and repair consequential findings.
- [ ] Commit/push staged changes only to PR107; wait for hosted checks/CodeQL and repair introduced failures. Final hosted status is recorded on PR107 at the exact published head, after this plan is committed.
- [x] Update private preview and concise evidence/PR with exact SHA and honest incomplete capabilities. Keep draft, owner visual and release/source/device gates open.
