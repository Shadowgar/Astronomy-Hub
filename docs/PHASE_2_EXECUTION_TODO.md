# PHASE 2 — EXECUTION TODO

## 1. Execution Rules

- Execute ONE step at a time
- Do NOT batch steps
- Do NOT skip steps
- Do NOT invent steps
- Do NOT expand scope
- Minimal diffs only
- Verify each step before continuing

If a step fails:
- STOP
- use debug mode
- fix only the failure
- resume execution

---

## 2. Phase Objective

Implement:

User → Scope → Engine → Filter → Scene → Object → Detail

Without breaking Phase 1.

---

## 3. Execution Sequence

---

## STEP 1 — Lock Phase 2 Spec

### Goal
Ensure Phase 2 specification is authoritative and complete.

### Tasks
- [ ] Verify `docs/PHASE_2_SPEC.md` exists
- [ ] Verify scopes are defined
- [ ] Verify engines are defined
- [ ] Verify filters are defined
- [ ] Verify system pipeline is defined
- [ ] Verify anti-scope rules are present

### Verification
- No ambiguity in scope/engine/filter definitions
- No missing sections
- No conflicting statements

---

## STEP 2 — Backend Scope Routing

### Goal
Introduce scope-level control in backend.

### Tasks
- [ ] Define scope list in backend
- [ ] Map scopes → allowed engines
- [ ] Add routing entry for scope selection

### Verification
- Invalid scopes are rejected
- Each scope returns correct engines
- No frontend dependency

---

## STEP 3 — Backend Engine Routing

### Goal
Introduce engine-level control.

### Tasks
- [ ] Define engine registry
- [ ] Map engines to scopes
- [ ] Add engine selection handling

### Verification
- Engines cannot be accessed outside scope
- Invalid engine requests fail cleanly
- No duplicated logic between engines

---

## STEP 4 — Backend Filter Layer

### Goal
Introduce controlled filtering per engine.

### Tasks
- [ ] Define allowed filters per engine
- [ ] Implement filter validation
- [ ] Attach filters to engine execution path

### Verification
- Invalid filters are rejected
- Filters do not bypass engine logic
- Filters affect object selection

---

## STEP 5 — Engine Scene Generation (Core)

### Goal
Enable engines to generate scenes.

### Tasks
- [ ] Implement deep_sky engine scene output
- [ ] Implement planets engine scene output
- [ ] Implement moon engine scene output
- [ ] Implement satellites engine scene output

### Verification
Each engine must:
- return structured scene output
- include grouped objects
- include reasoning
- avoid raw lists

---

## STEP 6 — Align Existing Above Me Engine

### Goal
Bring Phase 1 engine into Phase 2 structure.

### Tasks
- [ ] Ensure above_me follows engine routing
- [ ] Ensure it supports filter path (if applicable)
- [ ] Ensure output aligns with Phase 2 expectations

### Verification
- No regression in existing behavior
- Output remains stable
- Fully compatible with new pipeline

---

## STEP 7 — Object Resolution Integrity

### Goal
Ensure all scene objects resolve correctly.

### Tasks
- [ ] Verify all objects include valid IDs
- [ ] Ensure `/api/object/{id}` works for all engines
- [ ] Add missing metadata if required

### Verification
- No broken object links
- No duplicated detail data in scenes
- Detail endpoint remains authoritative

---

## STEP 8 — Scene Endpoint Exposure

### Goal
Expose controlled endpoints for Phase 2.

### Tasks
- [ ] Implement scope-based endpoint entry
- [ ] Implement engine-based endpoint handling
- [ ] Ensure filters are passed through correctly

### Verification
- Requests follow:
  scope → engine → filter
- Invalid combinations fail cleanly
- Output is consistent

---

## STEP 9 — Frontend Scope Selection

### Goal
Allow user to select scope.

### Tasks
- [ ] Add scope selector UI
- [ ] Connect to backend scope routing

### Verification
- Scope changes correctly update available engines
- No UI logic duplication

---

## STEP 10 — Frontend Engine Selection

### Goal
Allow user to select engine.

### Tasks
- [ ] Add engine selector
- [ ] Connect to backend engine routing

### Verification
- Engine switching loads correct scene
- No frontend filtering logic

---

## STEP 11 — Frontend Filter Controls

### Goal
Expose filters safely.

### Tasks
- [ ] Add filter controls per engine
- [ ] Send filter selection to backend

### Verification
- Filters affect results
- Invalid filters cannot be selected

---

## STEP 12 — Scene Rendering Alignment

### Goal
Render all engine outputs consistently.

### Tasks
- [ ] Ensure shared scene rendering
- [ ] Render grouped objects
- [ ] Render decision reasoning

### Verification
- No custom UI per engine
- Scenes feel consistent
- No data dumping

---

## STEP 13 — Object Detail Flow

### Goal
Preserve Phase 1 interaction.

### Tasks
- [ ] Ensure object click opens detail view
- [ ] Ensure return to scene works

### Verification
- No regression
- Navigation is stable

---

## STEP 14 — Full System Validation

### Goal
Verify Phase 2 integrity.

### Tasks
- [ ] Test all scopes
- [ ] Test all engines
- [ ] Test all filters
- [ ] Test object resolution

### Verification
- System follows full pipeline
- No broken paths
- No duplicated logic

---

## STEP 15 — Anti-Scope Validation

### Goal
Ensure Phase 2 boundaries are respected.

### Tasks
- [ ] Confirm no UI redesign work
- [ ] Confirm no visualization systems
- [ ] Confirm no AI/prediction logic
- [ ] Confirm no timeline simulation

### Verification
- System remains Phase 2 compliant

---

## 4. Completion Rule

Phase 2 is COMPLETE only when:

- full pipeline works end-to-end
- all required engines are functional
- scenes remain decision-driven
- backend authority is preserved
- no scope drift has occurred

Do not mark complete early.