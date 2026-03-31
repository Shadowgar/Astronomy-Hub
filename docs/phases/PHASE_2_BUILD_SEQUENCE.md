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

# STEP 14 — LIVE DATA & LOCATION-TIME AUTHORITY

---

## VERIFY

* Above Me scene runtime path does not use static `MOCK_*` datasets as authoritative scene truth
* provider-backed normalized backend inputs drive Above Me object selection
* materially different valid location/time context can produce different Above Me scene output where conditions differ
* provider/input degradation is explicit and does not silently return static success payloads
* provider baseline is wired and traceable in runtime:

  * Open-Meteo (conditions)
  * CelesTrak (satellites)
  * OpenSky Network (flights)
  * JPL/NASA ephemeris (Sun/planet/moon positions)
  * NOAA SWPC (space-weather/alerts)
  * NASA Images API (media enrichment only; not scene truth authority)

---

## LOCK CONDITION

```text
Above Me truth is live, location/time-aware, and provable.
```

---

# 🔥 STEP 15 — DATA INGESTION SYSTEM (CRITICAL GAP FIX)

---

## VERIFY

System implements:

```text
Provider → Adapter → Normalizer → Validator → Cache → Engine Input
```

---

## VERIFY

* provider clients exist per domain
* adapter layer converts raw payloads
* normalization produces canonical contracts
* validation rejects invalid/stale data

---

## LOCK CONDITION

```text
No raw provider data reaches engines or scenes.
```

---

# 🔥 STEP 16 — CACHE SYSTEM

---

## VERIFY

* provider-specific TTL exists
* stale detection exists
* refresh logic exists

---

## LOCK CONDITION

```text
Cache preserves performance without corrupting truth.
```

---

# 🔥 STEP 17 — ENGINE INPUT REFACTOR

---

## VERIFY

* engines consume ONLY normalized provider data
* no static datasets remain
* no mock runtime sources

---

## LOCK CONDITION

```text
Engines transform truth, not create it.
```

---

# 🔥 STEP 18 — REMOVE MOCK DATA

---

## VERIFY

* all runtime MOCK_* removed
* no fallback static success responses

---

## LOCK CONDITION

```text
System fails or degrades visibly — never fakes success.
```

---

# 🔥 STEP 19 — ABOVE ME ORCHESTRATION (CORRECTED)

---

## VERIFY

* Above Me merges multiple engines
* applies global visibility + time filters
* ranks cross-engine outputs

---

## LOCK CONDITION

```text
Above Me is an orchestrator, not an engine.
```

---

# 🔥 STEP 20 — SCENE AUTHORITY ENFORCEMENT

---

## VERIFY

* no engine → UI bypass
* all objects originate from scene

---

## LOCK CONDITION

```text
Scene is the ONLY source of surfaced objects.
```

---

# 🔥 STEP 21 — TRACEABILITY SYSTEM

---

## VERIFY

* provider source included in outputs
* timestamps included
* degraded state exposed

---

## LOCK CONDITION

```text
Every scene can be traced to provider inputs.
```

---

# 🔥 STEP 22 — LOCATION / TIME VALIDATION

---

## VERIFY

* changing location changes output
* changing time changes output

---

## LOCK CONDITION

```text
Scene reflects real-world context.
```

---

# 🔥 STEP 23 — VISIBILITY + RANKING

---

## VERIFY

* altitude filtering applied
* relevance filtering applied
* deterministic ranking applied

---

## LOCK CONDITION

```text
Only relevant objects are surfaced.
```

---

# 🔥 STEP 24 — DEGRADED MODE

---

## VERIFY

* provider failure detected
* degraded state exposed
* no silent fallback

---

## LOCK CONDITION

```text
System truth is transparent.
```

---

# 🔥 STEP 25 — FINAL REALITY VALIDATION

---

## VERIFY

* outputs match real-world expectations
* provider data drives all scenes
* no synthetic truth remains

---

## LOCK CONDITION

```text
System is reality-backed.
```

---

# FINAL PHASE LOCK

---

Phase 2 COMPLETE ONLY IF:

```text
ALL steps locked
ALL transitions deterministic
ALL state controlled
ALL data provider-backed
NO mock runtime data
NO pipeline violations
```

---

# FINAL RULE

```text
Do NOT proceed to Phase 3 unless Phase 2 is fully locked and reality-backed.
```

```
