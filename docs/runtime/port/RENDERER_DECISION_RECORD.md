# Renderer Decision Record - Full Stellarium Port

Date: 2026-05-01
Status: Final
Scope: Sky Engine renderer direction for strict Stellarium parity

## Decision

Recommended renderer path: Option 4 - use/fork Stellarium Web Engine directly as the rendering authority, integrated into Astronomy Hub through a thin host bridge.

This decision is final for the current parity cycle.

Consequence:
- Stop new Babylon parity-port implementation work unless an explicit blocker exception is approved.
- Keep existing Babylon-based code as a preserved fallback/asset, not as the primary parity path.

## Why This Path Wins

The repository already states strict source parity as the active goal and enforces Sky Engine isolation. Under that constraint, the renderer closest to Stellarium source has the highest probability of identical behavior with the lowest parity drift.

Option 4 is the only option that is source-native to Stellarium rendering behavior (painter, render_gl lifecycle, shader/material behavior, module interactions, and frame/update semantics).

## Option Comparison

Scoring scale:
- 5 = best/lowest risk/highest fit
- 1 = worst/highest risk/lowest fit

| Option | Parity Likelihood | Implementation Cost | Migration Cost | Performance Risk | Visual Parity Risk | React/AH Compatibility | Reuse Existing Work | Time/Location/FOV/Selection Control | Licensing/Build Risk | Long-Term Maintainability |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. Continue Babylon renderer | 2 | 2 | 4 | 3 | 2 | 5 | 5 | 4 | 4 | 2 |
| 2. Switch to Three.js/WebGPU | 1 | 1 | 1 | 2 | 1 | 4 | 2 | 4 | 4 | 2 |
| 3. Custom WebGL2/WebGPU renderer | 2 | 1 | 1 | 2 | 1 | 3 | 2 | 4 | 5 | 1 |
| 4. Use/fork Stellarium Web Engine directly | 5 | 3 | 3 | 3 | 5 | 3 | 4 | 5 | 2 | 4 |

Interpretation:
- Option 4 is clearly dominant for parity and control fidelity.
- Option 1 has strong local reuse but cannot reliably guarantee identical Stellarium output without ongoing drift.
- Options 2 and 3 are effectively new renderer programs and are not justified for a strict parity objective.

## Required Analysis by Criterion

### 1) Continue Babylon renderer

- Parity likelihood: Low to medium.
  - Requires continual behavioral recreation of native Stellarium renderer and module internals.
- Implementation cost: High remaining cost.
  - Existing partial work still leaves a long tail across stars, DSS, labels, landscapes, atmospherics, and module parity.
- Migration cost: Low.
  - Keeps current runtime shape.
- Performance risk: Medium.
  - Risk of duplicated CPU/GPU paths and abstraction overhead.
- Visual parity risk: High.
  - Drift risk remains whenever Stellarium uses renderer-specific internals not fully replicated.
- React/AH compatibility: High.
  - Native to current frontend architecture.
- Reuse existing work: Very high.
- Time/location/FOV/object selection control: High.
  - Already wired locally, but behavior equivalence remains the problem.
- Licensing/build risk: Low to medium.
- Long-term maintainability: Medium to low for parity objective.
  - Sustained burden of manually reproducing upstream behavior.

### 2) Switch to Three.js/WebGPU

- Parity likelihood: Low.
  - Not source-close to Stellarium render path.
- Implementation cost: Very high.
- Migration cost: Very high.
- Performance risk: Medium to high during rewrite.
- Visual parity risk: Very high.
- React/AH compatibility: Good.
- Reuse existing work: Low.
- Time/location/FOV/object selection control: High in theory.
- Licensing/build risk: Low.
- Long-term maintainability: Medium to low due to parity mismatch pressure.

### 3) Custom WebGL2/WebGPU renderer

- Parity likelihood: Medium at best, but only with very high effort.
- Implementation cost: Extreme.
- Migration cost: Extreme.
- Performance risk: High.
- Visual parity risk: Very high without exhaustive source equivalence work.
- React/AH compatibility: Medium.
- Reuse existing work: Low.
- Time/location/FOV/object selection control: High in theory.
- Licensing/build risk: Lower than Option 4.
- Long-term maintainability: Low.
  - Team would own full graphics engine complexity.

### 4) Use/fork Stellarium Web Engine directly

- Parity likelihood: Very high.
  - Renderer and module behavior originate from the Stellarium codebase.
- Implementation cost: Medium to high.
  - Integration and host-bridge work required, but less parity recreation.
- Migration cost: Medium.
  - Preserve route/UX shell, replace renderer authority.
- Performance risk: Medium.
  - Need profiling within AH shell, but renderer is purpose-built for this domain.
- Visual parity risk: Low.
- React/AH compatibility: Medium.
  - Requires adapter boundary and lifecycle ownership discipline.
- Reuse existing work: High for controls/contracts/tests/tooling; medium for Babylon render internals.
- Time/location/FOV/object selection control: Very high.
  - Available through SWE API surface and core object model.
- Licensing/build risk: Medium to high.
  - AGPL/commercial licensing and wasm toolchain governance must be handled explicitly.
- Long-term maintainability: High if fork strategy is disciplined.

## Rejected Options and Why

Rejected: Option 1 (continue Babylon as primary parity renderer)
- Reason: parity drift risk remains structurally high because this path reimplements, not reuses, renderer truth.
- Reason: current parity backlog indicates significant remaining renderer/module equivalence debt.

Rejected: Option 2 (Three.js/WebGPU rewrite)
- Reason: lowest source proximity to Stellarium behavior.
- Reason: effectively a new renderer project with poor parity economics.

Rejected: Option 3 (custom WebGL2/WebGPU renderer)
- Reason: highest engineering and maintenance burden.
- Reason: parity objective does not justify full custom engine ownership.

## Chosen Path Details

Chosen: Option 4 (use/fork Stellarium Web Engine directly)

### Migration Strategy

Phase 0 - Governance gate (mandatory)
- Confirm licensing route (AGPL compliance model or commercial license).
- Freeze new Babylon parity-port implementation changes pending this integration decision.

Phase 1 - Runtime authority boundary
- Keep Astronomy Hub as host shell (routing, state, controls, contracts).
- Mount SWE runtime as Sky Engine renderer authority at the sky viewport surface.
- Preserve single active-engine viewport law.

Phase 2 - Control bridge
- Implement thin bridge for:
  - time
  - location
  - FOV
  - selection/focus
  - camera/navigation commands
- Keep bridge unidirectional and explicit to preserve engine ownership.

Phase 3 - Data and contract alignment
- Map AH contract/state surfaces to SWE inputs/outputs.
- Keep backend meaning/contracts deterministic; avoid UI-side truth invention.

Phase 4 - Parity validation harness
- Run side-by-side visual checks against the local Stellarium reference runtime.
- Promote parity checks to acceptance gates before feature continuation.

Phase 5 - De-risk and retire parity debt
- Mark Babylon parity-render path as legacy fallback for rollback only.
- Stop spending parity effort in Babylon renderer internals unless an approved exception exists.

## What Happens to Babylon Sky Engine

- It is not deleted.
- It becomes:
  - fallback path for risk-managed rollback,
  - integration scaffold for non-renderer host concerns,
  - historical implementation reference.
- It is no longer the default path for strict Stellarium visual parity.

## What Happens to Current Port Code

Keep and reuse:
- route/state integration shell,
- control and observer/time plumbing where renderer-agnostic,
- parity tooling, evidence scripts, and validation harnesses,
- bridge-compatible contracts and tests.

Freeze/deprioritize for parity delivery:
- further Babylon painter/render backend emulation work,
- Babylon-only visual tuning intended to mimic Stellarium output.

Archive status guidance:
- keep code in place, label as legacy-parity path,
- do not delete until SWE-integrated runtime is validated and stable.

## Risks and Hard Blockers

Primary hard blocker candidate:
- Licensing path not approved for intended distribution model.

Secondary delivery risks:
- SWE build/toolchain maintenance (wasm/emscripten pinning),
- host integration complexity,
- performance tuning within AH shell.

If licensing is blocked and cannot be resolved, fallback decision must be reopened explicitly.

## Final Direction Statement

Final direction is Option 4.

No additional Babylon parity-port implementation should continue by default after this record.
Any exception requires explicit blocker rationale and approval.

## Next Implementation Prompt

Use this prompt for the next execution step:

"Stellarium Port Mode ACTIVE. Implement Phase 0 and Phase 1 of docs/runtime/port/RENDERER_DECISION_RECORD.md only. Do not continue Babylon parity renderer work. Create a thin host-mount boundary where Stellarium Web Engine is the rendering authority for the Sky Engine viewport, while preserving existing route/state shell and without deleting current code. Provide validation evidence and update parity tracking artifacts."
