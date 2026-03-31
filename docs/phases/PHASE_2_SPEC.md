````markdown
# 🌌 PHASE 2 — ENGINE SYSTEM (AUTHORITATIVE — MASTER PLAN ALIGNED)

---

# 0. PURPOSE

This document defines:

```text
The construction of the full multi-engine system
with user-controlled Scope → Engine → Filter → Scene.
````

Phase 2 transforms the system from:

```text
Single merged scene (Phase 1)
```

into:

```text
Multi-scope, multi-engine, filter-driven system
```

---

# 1. SYSTEM LAW (NON-NEGOTIABLE)

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## HARD RULE

```text
Every scene MUST be produced through this pipeline.
No shortcuts allowed.
```

---

# 2. PHASE 2 OBJECTIVE

The system MUST allow the user to:

* select scope
* select engine
* apply filters
* generate a new scene deterministically

---

## RESULT

```text
The user controls WHAT they are viewing,
but the system still controls WHAT matters.
```

---

# 3. SCOPE SYSTEM (INTRODUCED)

---

## REQUIRED SCOPES

* Above Me
* Earth
* Sun
* Satellites
* Flights
* Solar System
* Deep Sky

---

## RULES

* Scope selection changes the entire system context
* Scope determines:

  * available engines
  * available filters
  * scene type

---

## FAILURE

* scope does not change system behavior → INVALID

---

# 4. ENGINE SYSTEM (CORE OF PHASE 2)

---

## RULE

```text
Only ONE engine active at a time
(EXCEPT Above Me merge mode)
```

---

## REQUIRED ENGINES

* Satellite Engine
* Solar System Engine
* Deep Sky Engine
* Event / Alert Engine
* Earth Engine
* Solar Engine

---

## ENGINE RESPONSIBILITIES

Each engine MUST:

* define its dataset
* define its scene type
* define its valid filters
* return structured data only

---

## FAILURE

* engines overlap responsibility
* engines produce UI
* engines bypass filters

---

# 5. FILTER SYSTEM (INTRODUCED TO USER)

---

## RULE

```text
One active filter per engine
```

---

## FILTER RESPONSIBILITIES

Filters MUST:

* modify scene output
* be visible in UI
* clearly affect results

---

## EXAMPLES

* visibility filters
* time filters
* event filters
* object type filters

---

## FAILURE

* filter has no visible effect
* filter logic occurs in UI
* multiple conflicting filters active

---

# 6. SCENE SYSTEM (EXPANDED)

---

## RULE

```text
Each scope + engine + filter combination produces a unique scene.
```

---

## SCENE MUST

* be deterministic
* be reproducible
* be filter-bound
* be engine-specific (except Above Me)

---

## ABOVE ME EXCEPTION

* merges multiple engines
* still uses filters
* still produces ONE scene

---

## FAILURE

* scene inconsistent for same inputs
* scene assembled in UI
* scene ignores filters

---

# 7. UI SYSTEM (PHASE 2 INTEGRATION)

---

## RULE

```text
Phase 2 activates full command bar controls.
```

---

## COMMAND BAR MUST NOW INCLUDE

* Scope selector
* Engine selector
* Filter selector
* Location
* Mode

---

## UI MUST FOLLOW

* UI Information Architecture 
* UI Design Principles 

---

## RULE

```text
UI controls system context, not data interpretation.
```

---

# 8. INTERACTION MODEL

---

## REQUIRED FLOW

```text
Scope → Engine → Filter → Scene → Object → Detail → Return
```

---

## RULES

* changing scope resets engine/filter
* changing engine resets filter
* changing filter regenerates scene

---

## FAILURE

* stale data
* partial updates
* inconsistent transitions

---

# 9. DATA LAW (ENFORCED)

---

* backend constructs scene
* frontend displays scene
* frontend does NOT compute meaning

---

## FAILURE

* frontend builds scene
* frontend filters data

---

# 10. STATE MANAGEMENT

---

## REQUIRED

System MUST track:

* active scope
* active engine
* active filter
* current scene
* selected object

---

## RULE

```text
State must be deterministic and restorable.
```

---

# 11. LIVE DATA & LOCATION-TIME AUTHORITY

---

## RULE

```text
Above Me scene truth MUST come from live provider-backed, normalized backend data
for the active location and current time context.
```

---

## REQUIRED

* scene/object outputs are assembled from provider-ingested backend data, not static `MOCK_*` datasets
* active location (`lat`, `lon`, `elevation_ft`) is a real scene input for Above Me
* time context affects visibility/relevance decisions where applicable
* degraded mode is explicit when provider-backed inputs are unavailable

---

## PROVIDER BASELINE (PHASE 2)

* Open-Meteo — observing conditions input
* CelesTrak — satellite TLE/orbital input
* OpenSky Network — flight tracking input
* JPL/NASA ephemeris data — Sun/planet/moon positional input
* NOAA SWPC — space-weather/alert input
* NASA Images API — media enrichment only (not scene truth authority)

---

## FAILURE

* static mock datasets remain authoritative scene truth in runtime
* Above Me output is effectively location/time-insensitive
* provider failure silently returns static success payloads

---

# 12. PERFORMANCE MODEL

---

## REQUIRED

* only active scene computed
* no preloading all scopes
* no full dataset rendering

---

## FAILURE

* system computes unused scenes
* system slows with scope changes

---

# 13. TESTING

---

## REQUIRED

* scope switching works
* engine switching works
* filter switching works
* scene updates correctly
* no stale state
* object detail works across all contexts

---

# 14. ANTI-SCOPE

Phase 2 MUST NOT include:

* immersive 3D systems
* prediction systems
* personalization
* knowledge graph systems

---

# 15. COMPLETION RULE

Phase 2 is COMPLETE ONLY IF:

```text
- scope system works
- engine system works
- filter system works
- scenes are deterministic
- UI controls context correctly
- pipeline is enforced
- no Phase 3 leakage
```

---

# FINAL STATEMENT

```text
Phase 2 transforms Astronomy Hub into a true system:
user-controlled context with system-controlled meaning.
```

```
