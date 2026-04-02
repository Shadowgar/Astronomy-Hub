````markdown
# 🌌 PHASE 1 BUILD SEQUENCE (AUTHORITATIVE — MASTER PLAN ALIGNED)

---

# 0. PURPOSE

This document defines:

```text
The exact execution procedure for Phase 1.
````

Phase 1 MUST be executed as:

```text
VERIFY → ACCEPT or REBUILD → RE-VERIFY → LOCK
```

This document is not advisory.

It is the required execution path for Phase 1.

---

# 1. EXECUTION LAW

Each step MUST follow this procedure:

```text
1. VERIFY against:
   - PHASE_1_SPEC.md
   - PHASE_1_ACCEPTANCE_CRITERIA.md
   - SYSTEM_VALIDATION_SPEC.md

2. IF VALID:
   - mark COMPLETE
   - do NOT modify

3. IF INVALID:
   - rebuild minimally
   - fix only the failing requirement

4. RE-VERIFY

5. LOCK the step
```

---

# 2. GLOBAL RULES (NON-NEGOTIABLE)

```text
NO step may be skipped.
NO step may be batched.
NO valid system may be rebuilt.
NO Phase 2+ work may be introduced.
```

---

## FAILURE RULE

```text
If correctness cannot be proven, the step is INVALID.
```

---

# 3. PHASE 1 EXECUTION GOAL

Phase 1 must produce:

```text
A deterministic, scene-first command center
for the Above Me scope only.
```

The result must answer:

* Is observing worthwhile?
* What should I look at?
* What matters right now?
* What needs attention soon?

---

# STEP 1 — AUTHORITATIVE RUNTIME

---

## VERIFY

Confirm the system runs in the canonical runtime:

* Docker Compose starts successfully
* frontend starts
* backend starts
* supporting services required by runtime start
* frontend is reachable
* backend responds

Confirm runtime law:

* Docker is the authoritative runtime
* system is not dependent on ad hoc local-only execution

---

## IF VALID

```text
LOCK STEP 1 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* Docker configuration
* service startup wiring
* runtime connectivity

Do NOT expand architecture.

---

## LOCK CONDITION

```text
Phase 1 runs through Docker as the canonical runtime.
```

---

# STEP 2 — PIPELINE ENFORCEMENT

---

## VERIFY

Confirm the system follows:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

For Phase 1 specifically verify:

* active scope is Above Me only
* participating engines exist internally
* filters exist internally
* scene is assembled before frontend rendering
* objects come from scene
* detail resolves from object identity

---

## IF VALID

```text
LOCK STEP 2 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* missing engine boundaries
* missing internal filtering
* scene assembly violations
* object/detail ownership violations

Do NOT expose Phase 2 controls.

---

## LOCK CONDITION

```text
Phase 1 pipeline is enforced end-to-end without bypass.
```

---

# STEP 3 — SCOPE DISCIPLINE

---

## VERIFY

Confirm:

* Above Me is the only active scope
* scope is not user-selectable
* no alternate scope UI exists
* no multi-scope routing is exposed in the Phase 1 surface

---

## IF VALID

```text
LOCK STEP 3 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* exposed scope switching
* alternate scope entry points
* scope leakage from future phases

---

## LOCK CONDITION

```text
Phase 1 exposes Above Me only.
```

---

# STEP 4 — ENGINE PARTICIPATION

---

## VERIFY

Confirm the Phase 1 scene is internally supported by the required engine participation:

* Satellite Engine
* Solar System Engine (planets only)
* Deep Sky Engine
* Event / Alert Engine
* Earth Conditions Engine

Verify:

* engines are independent
* engines return structured outputs only
* engines do not render UI directly
* engines do not overlap domain authority improperly

---

## IF VALID

```text
LOCK STEP 4 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* missing engine ownership
* mixed engine responsibilities
* raw engine payload exposure
* UI-coupled engine behavior

---

## LOCK CONDITION

```text
All required Phase 1 engines participate correctly in the Above Me scene.
```

---

# STEP 5 — INTERNAL FILTER ENFORCEMENT

---

## VERIFY

Confirm internal filters exist and operate before scene output.

At minimum verify filtering for:

* above horizon
* observing relevance
* time relevance
* event activity

Also verify:

* filters are not exposed to the user in Phase 1
* unfiltered datasets do not reach the scene
* filters constrain inclusion, not just presentation

---

## IF VALID

```text
LOCK STEP 5 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* missing internal filter application
* unfiltered object inclusion
* Phase 2-style exposed filters

---

## LOCK CONDITION

```text
Only filtered, decision-relevant objects reach the Phase 1 scene.
```

---

# STEP 6 — SCENE AUTHORITY

---

## VERIFY

Confirm the scene is the only visible decision surface.

Verify the scene:

* merges engine outputs
* limits surfaced objects
* ranks surfaced objects
* provides meaning, not raw data
* exists before frontend interpretation

Verify the frontend does NOT:

* assemble the scene
* rank objects independently
* generate reasoning

---

## IF VALID

```text
LOCK STEP 6 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* frontend scene assembly
* missing backend merge logic
* missing scene ranking
* raw list output

---

## LOCK CONDITION

```text
Scene is authoritative and is the only visible decision surface.
```

---

# STEP 7 — OBJECT CONTRACT INTEGRITY

---

## VERIFY

Confirm every surfaced object includes the required Phase 1 fields:

* id
* name
* type
* engine owner
* summary
* position context
* time relevance
* reason for inclusion
* detail route

Verify:

* objects are actionable
* objects do not include full detail payloads
* object identity is stable

---

## IF VALID

```text
LOCK STEP 7 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* missing required fields
* unstable object identity
* detail duplication inside scene objects

---

## LOCK CONDITION

```text
Every surfaced object is complete, actionable, and detail-compatible.
```

---

# STEP 8 — DECISION SYSTEM

---

## VERIFY

Confirm the Phase 1 surface explicitly guides the user.

Required outputs must exist and be usable:

* observing score
* best target
* immediate opportunities
* time-sensitive events

Conditions decision check (Phase 1 baseline):

* conditions output is explanatory (not raw weather)
* score/summary is coherent with cloud/wind/humidity context
* no frontend-authored interpretation

Verify:

* each surfaced item explains why it matters
* user does not need to interpret raw astronomy data
* system behavior is decision-oriented, not dashboard-like

---

## IF VALID

```text
LOCK STEP 8 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* missing decision outputs
* missing reasoning
* dashboard-style undifferentiated information display

---

## LOCK CONDITION

```text
The system actively guides user attention and answers what matters now.
```

---

# STEP 9 — UI HIERARCHY

---

## VERIFY

Confirm the UI follows the command-center structure:

```text
Command Bar
Primary Scene
Decision Panel
Supporting Panels
```

Verify:

* scene is visually dominant
* no equal-weight grid controls the experience
* panels are subordinate
* hierarchy is understandable quickly

---

## IF VALID

```text
LOCK STEP 9 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* equal-weight dashboard layout
* poor hierarchy
* dominant secondary panels
* scene underemphasis

---

## LOCK CONDITION

```text
UI behaves as a guided command center, not a dashboard.
```

---

# STEP 10 — INTERACTION LOOP

---

## VERIFY

Confirm the required loop works:

```text
Scene → Object → Detail → Return
```

Verify:

* surfaced objects are clickable
* detail resolves through backend authority
* return restores prior scene state
* navigation is stable and deterministic

---

## IF VALID

```text
LOCK STEP 10 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* broken object clicks
* broken detail routing
* broken return flow
* lost scene state

---

## LOCK CONDITION

```text
The full scene-to-detail loop works without ambiguity.
```

---

# STEP 11 — DATA BOUNDARY ENFORCEMENT

---

## VERIFY

Confirm all Phase 1 data obeys data law:

* backend assembles scene
* frontend receives normalized data only
* no raw provider payloads reach UI
* no component-level fallback parsing exists
* no frontend-generated ranking or reasoning exists

---

## IF VALID

```text
LOCK STEP 11 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* raw provider data leakage
* component-level data shaping
* frontend ranking/reasoning logic
* fallback parsing in components

---

## LOCK CONDITION

```text
Frontend consumes normalized, backend-authored meaning only.
```

---

# STEP 12 — PERFORMANCE DISCIPLINE

---

## VERIFY

Confirm the Phase 1 runtime obeys scene-instancing discipline:

* only the active scene is computed
* surfaced object count is limited
* full datasets are not rendered
* detail loads on demand
* no Phase 3-style heavy visualization is driving the runtime

---

## IF VALID

```text
LOCK STEP 12 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* uncontrolled object volume
* unnecessary full-dataset rendering
* premature heavy visualization coupling

---

## LOCK CONDITION

```text
Phase 1 computes the active decision scene only.
```

---

# STEP 13 — TESTING AND VERIFICATION

---

## VERIFY

Run and confirm required verification paths succeed.

Backend:

* project runtime backend tests pass

Frontend:

* tests pass
* type checks pass
* build passes

Verify coverage of core Phase 1 flows:

* scene load
* decision surface rendering
* object detail flow
* return navigation
* responsive behavior

---

## IF VALID

```text
LOCK STEP 13 — DO NOT MODIFY
```

---

## IF INVALID

Fix only:

* failing core tests
* missing verification for core Phase 1 flows
* broken build or type state

Do NOT add speculative tests outside the phase.

---

## LOCK CONDITION

```text
Phase 1 core flows are provably verified.
```

---

# STEP 14 — ANTI-SCOPE ENFORCEMENT

---

## VERIFY

Confirm the Phase 1 system does NOT include:

* scope switching
* engine selection UI
* exposed filters UI
* 3D globe systems
* timeline systems
* prediction systems
* personalization
* Phase 2+ exploration controls

---

## IF VALID

```text
LOCK STEP 14 — DO NOT MODIFY
```

---

## IF INVALID

Remove only the violating additions.

---

## LOCK CONDITION

```text
Phase 1 scope is clean and future-phase leakage is absent.
```

---

# FINAL PHASE LOCK

---

Phase 1 is COMPLETE ONLY IF:

```text
ALL steps are locked
ALL verification is proven
ALL required decision behaviors exist
NO future-phase scope has entered the system
```

---

# FINAL RULE

```text
Do NOT proceed to Phase 2 unless Phase 1 is fully verified and locked.
```

---

```
