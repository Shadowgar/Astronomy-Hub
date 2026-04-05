# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

````markdown
# 🌌 PHASE 1 — COMMAND CENTER (AUTHORITATIVE — RECONCILED)

---

# 0. PURPOSE

This document defines:

```text
The minimum complete, deterministic product surface of Astronomy Hub.
````

Phase 1 delivers:

```text
A real-time, decision-support command center
for “Above Me” only.
```

---

# 1. SYSTEM LAW (NON-NEGOTIABLE)

The system MUST follow:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## HARD RULE

```text
If any implementation bypasses this pipeline → INVALID SYSTEM
```

---

# 2. PHASE 1 POSITION IN MASTER PLAN

Phase 1 implements:

```text
Single Scope + Multi-Engine Merge (Above Me)
```

Internally:

* engines exist
* filters exist
* scene instancing exists

Externally:

```text
ONLY ONE scene is exposed
```

---

# 3. CORE OBJECTIVE

The system MUST allow the user to determine:

* Is observing worthwhile?
* What should I look at?
* What matters right now?
* What requires immediate attention?

---

## FAILURE CONDITION

```text
If the system behaves like a data dashboard → INVALID
```

---

# 4. SCOPE MODEL

---

## ACTIVE SCOPE

```text
Above Me (ONLY)
```

---

## RULES

* Scope is NOT user-selectable
* Scope is ALWAYS active
* Scope defines participating engines

---

## FAILURE

* multiple scopes exposed → INVALID

---

# 5. ENGINE MODEL

---

## REQUIRED ENGINES

* Satellite Engine
* Solar System Engine (planets only)
* Deep Sky Engine
* Event / Alert Engine
* Earth Conditions Engine

### Conditions Baseline Alignment

Phase 1 uses a reduced subset of the Conditions Engine V2 model:

* observing decision output remains required
* cloud/wind/humidity context must be available
* richer V2 metrics (seeing/transparency/darkness/smoke) may be partial in Phase 1

---

## RULES

* engines MUST NOT render UI
* engines MUST return structured data only
* engines MUST be independent

---

## CRITICAL RULE

```text
Engines provide data.
Scene provides meaning.
```

---

# 6. FILTER MODEL

---

## REQUIRED

Filters MUST exist internally and control:

* visibility
* observing relevance
* time relevance
* event activity

---

## RULE

```text
Filters are NOT exposed in Phase 1.
```

---

## FAILURE

* unfiltered data → INVALID

---

# 7. SCENE MODEL

---

## RULE

```text
Scene is the ONLY visible data authority.
```

---

## SCENE MUST

* merge engine outputs
* filter results
* rank objects
* limit objects
* provide reasoning

---

## SCENE MUST ANSWER

```text
“What matters right now?”
```

---

## FAILURE

* raw lists
* no ranking
* no reasoning

---

# 8. UI SURFACE (CRITICAL RECONCILIATION)

---

## RULE

```text
Phase 1 mounts a command-center surface,
NOT a spatial exploration interface.
```

---

## DEFAULT SURFACE

* command-center module system
* scene-backed modules
* decision-first layout

---

## IMPORTANT

Spatial / immersive systems:

* MAY exist internally
* MUST NOT be the primary Phase 1 surface

---

# 9. UI AUTHORITY BINDING

---

Phase 1 UI MUST follow:

* UI Design Principles 
* UI Information Architecture 
* UI Phase B visual model 

---

## RULE

```text
If UI behavior conflicts with Phase 1 scope → Phase 1 wins.
```

---

# 10. COMMAND BAR (RESOLVED)

---

## VISIBLE IN PHASE 1

* location
* mode (light/dark/red)
* current context display

---

## RESERVED (NOT EXPOSED)

* scope switching
* engine selection
* filter selection
* time controls

---

## RULE

```text
Future controls may exist structurally but must not be active.
```

---

# 11. OBJECT CONTRACT

Each object MUST include:

* id
* name
* type
* engine owner
* summary
* position context
* time relevance
* reason for inclusion
* detail route

---

## RULE

```text
Objects must be actionable.
```

---

# 12. DECISION SYSTEM

---

## REQUIRED OUTPUTS

* observing score
* best target
* immediate opportunities
* time-sensitive events

Conditions interpretation in Phase 1 must remain decision-first:

* concise quality summary
* explanation of why now is good/fair/poor
* no raw weather dump

---

## RULE

```text
Every object answers: “why should I care?”
```

---

# 13. INTERACTION MODEL

---

## REQUIRED FLOW

```text
Scene → Object → Detail → Return
```

---

## RULES

* object clickable
* detail backend-driven
* return restores state

---

# 14. DATA LAW

---

* backend builds scene
* frontend receives normalized data
* frontend does NOT interpret data

---

## FAILURE

* UI logic shaping meaning → INVALID

---

# 15. PERFORMANCE LAW

---

```text
Only the active scene is computed.
```

---

# 16. TESTING

---

Must pass:

* backend tests
* frontend tests
* build
* type checks

---

# 17. ANTI-SCOPE

Phase 1 MUST NOT include:

* scope switching
* filters UI
* engine selection
* timeline
* prediction
* spatial exploration UI

---

# 18. COMPLETION RULE

Phase 1 is COMPLETE ONLY IF:

```text
- pipeline enforced
- scene authoritative
- decision system works
- UI is command center
- no Phase 2 leakage
- tests pass
```

---

# FINAL STATEMENT

```text
Phase 1 is a deterministic command center,
not a dashboard,
not an explorer.
```

````
