````markdown
# 🌌 PHASE 2 BUILD SEQUENCE (AUTHORITATIVE — MASTER PLAN ALIGNED)

---

# 0. PURPOSE

Defines the exact execution steps to build:

```text
Scope → Engine → Filter → Scene system
````

Execution model:

```text
VERIFY → ACCEPT or REBUILD → RE-VERIFY → LOCK
```

---

# 1. EXECUTION LAW

For EVERY step:

1. VERIFY against:

   * PHASE_2_SPEC.md
   * SYSTEM_VALIDATION_SPEC.md

2. IF VALID → LOCK

3. IF INVALID → FIX MINIMALLY

4. RE-VERIFY

5. LOCK

---

# 2. GLOBAL RULES

```text
No batching
No skipping
No Phase 3 features
No UI-side logic
```

---

# STEP 1 — STATE FOUNDATION

---

## VERIFY

System tracks:

* active scope
* active engine
* active filter
* current scene
* selected object

State must:

* be deterministic
* be restorable

---

## LOCK CONDITION

```text
All context state exists and is stable.
```

---

# STEP 2 — SCOPE SYSTEM

---

## VERIFY

* All required scopes exist:

  * Above Me
  * Earth
  * Sun
  * Satellites
  * Flights
  * Solar System
  * Deep Sky

* Scope switching:

  * resets engine
  * resets filter
  * regenerates scene

---

## LOCK CONDITION

```text
Scope fully controls system context.
```

---

# STEP 3 — ENGINE SYSTEM

---

## VERIFY

* Engines exist independently
* Only ONE engine active (except Above Me)

Each engine:

* defines its dataset
* defines valid filters
* returns structured data only

---

## LOCK CONDITION

```text
Engine system is isolated and deterministic.
```

---

# STEP 4 — FILTER SYSTEM

---

## VERIFY

* One filter active per engine
* Filters visibly affect scene
* Filters execute in backend

---

## LOCK CONDITION

```text
Filters deterministically modify scene output.
```

---

# STEP 5 — SCENE GENERATION

---

## VERIFY

Scene is generated ONLY from:

```text
Scope + Engine + Filter
```

Scene must:

* be deterministic
* be reproducible
* be backend-generated

---

## LOCK CONDITION

```text
Scene is fully controlled by pipeline inputs.
```

---

# STEP 6 — ABOVE ME MERGE MODE

---

## VERIFY

Above Me:

* merges multiple engines
* applies filters
* outputs ONE scene

---

## LOCK CONDITION

```text
Above Me behaves as multi-engine merge system.
```

---

# STEP 7 — COMMAND BAR ACTIVATION

---

## VERIFY

Command bar now includes:

* scope selector
* engine selector
* filter selector
* location
* mode

Verify:

* each control updates state
* triggers scene rebuild

---

## LOCK CONDITION

```text
UI controls context, not data logic.
```

---

# STEP 8 — SCENE TRANSITIONS

---

## VERIFY

Changing:

* scope
* engine
* filter

Produces:

* full scene refresh
* no stale data
* no partial updates

---

## LOCK CONDITION

```text
All transitions are clean and deterministic.
```

---

# STEP 9 — OBJECT SYSTEM

---

## VERIFY

Objects:

* come ONLY from scene
* maintain identity across changes
* support detail routing

---

## LOCK CONDITION

```text
Object system is stable across all contexts.
```

---

# STEP 10 — DATA BOUNDARY ENFORCEMENT

---

## VERIFY

* frontend receives normalized scene only
* no raw data in UI
* no UI filtering
* no UI ranking

---

## LOCK CONDITION

```text
Backend owns all meaning.
```

---

# STEP 11 — PERFORMANCE CONTROL

---

## VERIFY

* only active scene computed
* no multi-scope preloading
* no full dataset rendering

---

## LOCK CONDITION

```text
System scales without performance degradation.
```

---

# STEP 12 — TESTING

---

## VERIFY

* scope switching works
* engine switching works
* filter switching works
* scene updates correctly
* object detail works everywhere

---

## LOCK CONDITION

```text
All system transitions are verified.
```

---

# STEP 13 — ANTI-SCOPE

---

## VERIFY

System does NOT include:

* spatial UI
* prediction
* personalization
* knowledge graph

---

## LOCK CONDITION

```text
Phase 2 scope is clean.
```

---

# FINAL PHASE LOCK

---

Phase 2 COMPLETE ONLY IF:

```text
ALL steps locked
ALL transitions deterministic
ALL state controlled
NO leakage from future phases
```

---

# FINAL RULE

```text
Do NOT proceed to Phase 3 unless Phase 2 is fully locked.
```

---

```
