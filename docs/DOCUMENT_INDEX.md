# ASTRONOMY HUB — DOCUMENT INDEX (AUTHORITATIVE MAP)

## 0. Purpose
This document is a human-readable map of the documentation system.

It explains document roles and relationships.
It does not control context loading or execution.

## 1. Control Rules (Non-Negotiable)
- Validation overrides all other documentation.
- `docs/context/CONTEXT_MANIFEST.yaml` controls what can be loaded for a task.
- Phase documents control execution scope.
- UI documents enforce behavior inside phase scope.
- UI documents do not define a competing roadmap authority.
- Recovery protocol and state transitions are subordinate extensions.
- Recovery may respond to failures only and may not define system truth.

## 2. Authority Order
Use this order when documents conflict:
1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/context/CONTEXT_MANIFEST.yaml`
5. `docs/execution/PROJECT_STATE.md`
6. `docs/execution/MASTER_PLAN.md`
7. Phase execution documents under `docs/phases/`
8. Architecture and contracts docs under `docs/architecture/` and `docs/contracts/`
9. UI enforcement/support docs under `docs/product/ui/`
10. `docs/product/ASTRONOMY_HUB_MASTER_PLAN.md` (vision only)

## 3. Document System Structure

### A) System Control Docs
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`

Purpose:
- define truth, constraints, active execution state, load boundaries, and current reality

### A.1) Authoritative Recovery Extensions (Subordinate)
- `docs/enforcement/FAILURE_RECOVERY_PROTOCOL.md`
- `docs/execution/STATE_TRANSITIONS.md`

Purpose:
- define bounded post-stop recovery and legal execution-state movement under existing authority

Constraint:
- these documents are subordinate and cannot override validation, context, or phase authority

### B) Phase Execution Docs (Execution Authority)
Each phase is authoritative only through its Spec + Build Sequence + Acceptance Criteria.

Phase 1 — Command Center (Above Me only)
- `docs/phases/PHASE_1_SPEC.md`
- `docs/phases/PHASE_1_BUILD_SEQUENCE.md`
- `docs/phases/PHASE_1_ACCEPTANCE_CRITERIA.md`

Phase 2 — Engine System (Scope -> Engine -> Filter -> Scene)
- `docs/phases/PHASE_2_SPEC.md`
- `docs/phases/PHASE_2_BUILD_SEQUENCE.md`
- `docs/phases/PHASE_2_ACCEPTANCE_CRITERIA.md`

Phase 3 — Spatial / Immersive System (coexists with command center)
- `docs/phases/PHASE_3_SPEC.md`
- `docs/phases/PHASE_3_BUILD_SEQUENCE.md`
- `docs/phases/PHASE_3_ACCEPTANCE_CRITERIA.md`

Phase 4 — Knowledge Graph / Relationship System
- `docs/phases/PHASE_4_SPEC.md`
- `docs/phases/PHASE_4_BUILD_SEQUENCE.md`
- `docs/phases/PHASE_4_ACCEPTANCE_CRITERIA.md`

Phase 5 — Prediction / Personalization System
- `docs/phases/PHASE_5_SPEC.md`
- `docs/phases/PHASE_5_BUILD_SEQUENCE.md`
- `docs/phases/PHASE_5_ACCEPTANCE_CRITERIA.md`

### C) UI Enforcement Docs (Support Layer, Not Parallel Roadmap)
Global UI enforcement:
- `docs/product/ui/UI_DESIGN_PRINCIPLES.md`
- `docs/product/ui/UI_INFORMATION_ARCHITECTURE.md`
- `docs/product/ui/UI_VALIDATION_RULES.md`

Phase-support UI docs:
- Phase 1/2 support (command-center behavior and structure):
  - `docs/product/ui/UI_PHASE_B_SPEC.md`
  - `docs/product/ui/UI_PHASE_B_LAYOUT_BLUEPRINT.md`
  - `docs/product/ui/UI_PHASE_B_VISUAL_MODEL.md`
  - `docs/product/ui/UI_MODULE_TRANSFORMS.md`
  - `docs/product/ui/UI_VISUAL_CALIBRATION.md`
  - `docs/product/ui/UI_THEME_REFERENCES.md`
  - `docs/product/ui/STYLING_DECISION.md`
- Phase 3 support (spatial/immersive behavior):
  - `docs/product/ui/UI_PHASE_C_SPEC.md`

UI roadmap note:
- `docs/product/ui/UI_MASTER_PLAN.md` is supporting roadmap context.
- It does not override phase execution authority.

### D) Supporting / Reference Docs
Examples:
- `docs/README.md`
- `docs/runtime/PUBLIC_CHANGELOG.md`
- `docs/enforcement/CHANGELOG_UPDATE_RULES.md`
- `docs/tools/PHASE_BE_STARTUP_PROMPT.md`
- `docs/runtime/EXECUTION_LOG.md`
- `docs/runtime/FAILURE_PATTERNS.md` (support memory only; non-authoritative)
- `docs/archive/` contents

These assist navigation, operations, or history.
They do not override system control or phase authority.

## 4. Phase Boundary Rules
- Phase 1 does not expose scope/engine/filter controls.
- Phase 2 introduces user-controlled scope/engine/filter.
- Phase 3 adds immersive/spatial mode as explicit coexistence; command center remains default primary surface.
- Phase 4 introduces graph-backed relationships only.
- Phase 5 introduces prediction/personalization with deterministic, explainable behavior.

## 5. Context Loading Rule
Do not decide load scope from this index.
Use `docs/context/CONTEXT_MANIFEST.yaml` only.

## 6. Drift Rule
If this file conflicts with higher-authority docs, this file must be corrected.
