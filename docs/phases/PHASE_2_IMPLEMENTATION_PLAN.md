# PHASE 2 — IMPLEMENTATION PLAN

## 1. Purpose

This document defines the implementation structure for **Phase 2 — Engine Exploration**.

It translates the Phase 2 specification into a controlled build sequence.

This is an implementation-planning document only.

It does not authorize scope expansion beyond the Phase 2 spec.

---

## 2. Implementation Goal

Phase 2 must expand Astronomy Hub from a single-engine/single-scene system into a **multi-engine exploration system** while preserving the Phase 1 interaction guarantees.

The build goal is to support:

- multiple scopes
- multiple engines
- engine-specific filters
- engine-generated scenes
- preserved object detail flow

The system must remain:

- backend-authoritative
- scene-driven
- decision-support oriented

---

## 3. Locked Architectural Rule

Phase 2 must preserve the following system path:

User → Scope → Engine → Filter → Scene → Object → Detail

This is not optional.

All implementation work must reinforce this model.

No work may bypass it.

---

## 4. Phase 2 Build Strategy

Phase 2 should be implemented in the following order:

1. lock contracts and routing structure
2. introduce scope/engine/filter authority in backend
3. add scene generation per engine
4. align object resolution and detail compatibility
5. expose controlled frontend navigation
6. validate anti-scope compliance

This order is mandatory.

Frontend must not move ahead of backend authority.

---

## 5. Workstreams

## 5.1 Workstream A — Contract + Routing Foundation

### Objective
Establish the canonical structure that all Phase 2 work will follow.

### Required Outcomes
- Phase 2 specification is treated as authoritative
- scope list is fixed
- engine list is fixed
- filter model is fixed
- scene output shape is fixed
- routing responsibilities are clear

### Notes
This workstream prevents drift before implementation begins.

No engine-specific improvisation is allowed after this point without explicit architectural change.

---

## 5.2 Workstream B — Backend Scope / Engine / Filter Layer

### Objective
Introduce backend authority for:

- scope selection
- engine selection
- filter handling

### Required Outcomes
- the backend can determine which engines belong to which scope
- the backend can determine which filters belong to which engine
- engine/filter combinations produce valid scene requests
- invalid combinations are rejected cleanly

### Required Behavior
- scope is the first control layer
- engine is the second control layer
- filter is constrained by engine authority

### Must Not Happen
- frontend-defined engine logic
- filter behavior implemented only in UI
- unbounded combinations

---

## 5.3 Workstream C — Engine Scene Generation

### Objective
Enable each allowed engine to generate scene outputs under the Phase 2 architecture.

### Required Engines
- above_me
- deep_sky
- planets
- moon
- satellites

### Optional Engine
- flights

### Required Outcomes
Each engine can:

- receive its scope context
- receive its filter context
- produce a scene
- group results meaningfully
- include reasons for surfaced objects
- remain compatible with object-detail flow

### Important Constraint
Engines do not return raw lists.

They must return decision-ready scene outputs.

---

## 5.4 Workstream D — Existing Phase 1 Alignment

### Objective
Preserve Phase 1 assets while bringing them into Phase 2 structure.

### Required Outcomes
- existing `above_me` behavior remains functional
- existing object detail flow remains functional
- existing scene behavior is aligned with the Phase 2 system path
- no Phase 1 rebuild occurs

### Must Not Happen
- replacement of existing Phase 1 systems
- unnecessary rewrites
- frontend reimplementation of existing scene behavior

---

## 5.5 Workstream E — Object Resolution Compatibility

### Objective
Ensure every scene-surfaced object can resolve cleanly into authoritative detail.

### Required Outcomes
- all surfaced objects have stable identity
- all surfaced objects are compatible with `/api/object/{id}`
- new engine outputs do not duplicate detail payloads
- scene summary and object detail remain separate concerns

### Rule
Scenes surface.

Details explain.

That separation must remain intact.

---

## 5.6 Workstream F — Frontend Exploration Controls

### Objective
Expose the new Phase 2 system in the frontend without redesigning the Phase 1 UI.

### Required Outcomes
- user can select scope
- user can select engine
- user can select filter where allowed
- scene renders remain consistent
- object selection still opens authoritative detail

### Important Constraint
This is structural UI expansion only.

This is not a presentation redesign effort.

### Must Not Happen
- custom visual treatment per engine
- a new dashboard paradigm
- frontend-owned ranking or reasoning

---

## 5.7 Workstream G — Validation + Review

### Objective
Verify that the implemented system matches the Phase 2 specification.

### Required Outcomes
- all allowed scopes work as intended
- all required engines work as intended
- filters behave correctly
- scenes remain decision-support outputs
- object-detail authority is preserved
- anti-scope rules are respected

---

## 6. Proposed Backend Shape

Phase 2 backend work should separate responsibilities clearly.

### 6.1 Required Responsibility Layers
- scope routing
- engine routing
- filter validation
- scene generation
- object resolution

### 6.2 Rule
The backend must remain the single source of truth for:

- available engines
- valid filters
- object inclusion
- ranking/grouping logic
- scene meaning

The frontend may request; it may not define.

---

## 7. Proposed Frontend Shape

Frontend should evolve in a minimal structural way.

### Required UI Responsibilities
- show current scope
- show available engines within scope
- show allowed filters for current engine
- render returned scene
- allow object selection
- allow return from detail to scene context

### Rule
Frontend must render a system that already has meaning.

It must not create meaning.

---

## 8. Sequence Constraints

The following sequence constraints are mandatory:

### Backend Before Frontend
Frontend work must not begin until backend authority for scope/engine/filter is defined.

### Existing Before New
Existing Phase 1 paths must be aligned before deep new branching occurs.

### Required Before Optional
Required engines must ship before any optional engine.

### Contract Before Expansion
No engine-specific behavior should be implemented before contract/routing structure is settled.

---

## 9. Anti-Drift Rules

The following are not allowed inside this implementation plan:

- UI polish work
- visual redesign work
- animation initiatives
- charts or map systems
- 3D rendering
- time simulation
- AI assistant behavior
- recommendation engines
- personalization
- freeform search

If work does not strengthen:

Scope → Engine → Filter → Scene → Object → Detail

it does not belong in Phase 2.

---

## 10. Completion Standard

Phase 2 implementation is complete only when:

- the user can move through scope → engine → filter → scene → object → detail
- required engines are functioning
- scenes remain structured decision surfaces
- object detail remains authoritative
- no Phase 3 or later concerns have entered the build
- the system is clearly more capable than Phase 1 without losing architectural discipline

---

## 11. Execution Handoff Requirement

Implementation must proceed through an atomic execution TODO.

No batching.

No skipping.

No speculative additions.

No undocumented work.