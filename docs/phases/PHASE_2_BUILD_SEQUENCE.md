# 📄 ✅ **PHASE 2 BUILD SEQUENCE (REWRITE — ENGINE + UI ALIGNED)**

````markdown
# 🌌 PHASE 2 BUILD SEQUENCE (AUTHORITATIVE — ENGINE + UI ALIGNED)

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
   * ENGINE SPEC (if applicable)

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
All engines MUST follow their spec documents
```

---

# 🔴 STEP 1 — UI LAYOUT FOUNDATION (NEW FIRST STEP)

---

## VERIFY

UI matches UI_SPEC.md:
UI matches ASTRONOMY_HUB_DIAGRAM.md:

* top control bar
* main scene area
* right context panel
* now above me section
* engine module grid
* detail panel placeholder

NO logic
NO APIs
Static/mock data only

---

## LOCK CONDITION

```text
UI visually matches system diagram.
```

---

# 🔴 STEP 2 — UI STANDARDIZATION

---

## VERIFY

* module structure consistent
* grid system consistent
* item layout consistent
* typography + spacing consistent

---

## LOCK CONDITION

```text
All modules follow identical structure.
```

---

# 🔴 STEP 3 — DETAIL PANEL SYSTEM (UI ONLY)

---

## VERIFY

* right-side panel exists
* shared layout for all objects
* no data wiring yet

---

## LOCK CONDITION

```text
Detail panel structure is complete and reusable.
```

---

# 🔥 STEP 4 — DATA INGESTION SYSTEM

---

## VERIFY

System implements:

```text
Provider → Adapter → Normalizer → Validator → Cache → Engine Input
```

---

## VERIFY

* provider clients exist
* adapter transforms raw payloads
* normalization produces contracts
* validation rejects bad data

---

## LOCK CONDITION

```text
No raw provider data reaches engines.
```

---

# 🔴 STEP 5 — CONDITIONS ENGINE

SPEC: CONDITIONS_SPEC.md

---

## VERIFY

* Open-Meteo ingestion working
* observing score computed
* summary generated
* output matches spec contract

---

## LOCK CONDITION

```text
Conditions engine produces believable decision output.
```

---

# 🔴 STEP 6 — SATELLITE ENGINE

SPEC: SATELLITE_ENGINE_SPEC.md

---

## VERIFY

* TLE ingestion working
* propagation implemented
* pass computation accurate
* above-me detection correct

---

## LOCK CONDITION

```text
Satellite passes match real-world behavior.
```

---

# 🔴 STEP 7 — SOLAR SYSTEM ENGINE

SPEC: SOLAR_SYSTEM_ENGINE_SPEC.md

---

## VERIFY

* JPL Horizons integration working
* planet positions accurate
* visibility filtering correct

---

## LOCK CONDITION

```text
Planets match real sky positions.
```

---

# 🔴 STEP 8 — DEEP SKY ENGINE

SPEC: DEEP_SKY_ENGINE_SPEC.md

---

## VERIFY

* Messier catalog loaded
* RA/Dec conversion correct
* visibility computed
* ranking applied

---

## LOCK CONDITION

```text
Deep sky targets are realistic and useful.
```

---

# 🔴 STEP 9 — SUN ENGINE

SPEC: SUN_ENGINE_SPEC.md

---

## VERIFY

* DONKI ingestion working
* SWPC integration working
* solar activity classification correct

---

## LOCK CONDITION

```text
Solar activity reflects real conditions.
```

---

# 🟡 STEP 10 — TRANSIENT EVENTS ENGINE

SPEC: TRANSIENT_EVENTS_ENGINE_SPEC.md

---

## VERIFY

* meteor dataset loaded
* time filtering working
* ranking applied

---

## LOCK CONDITION

```text
Events are timely and relevant.
```

---

# 🟡 STEP 11 — FLIGHT ENGINE

SPEC: FLIGHT_ENGINE_SPEC.md

---

## VERIFY

* OpenSky ingestion working
* filtering applied
* only relevant aircraft shown

---

## LOCK CONDITION

```text
Flight engine is lightweight and non-intrusive.
```

---

# 🔴 STEP 12 — STATE FOUNDATION

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

# 🔴 STEP 13 — SCOPE SYSTEM

---

## VERIFY

* all required scopes exist
* switching resets engine + filter
* regenerates scene

---

## LOCK CONDITION

```text
Scope fully controls context.
```

---

# 🔴 STEP 14 — ENGINE SYSTEM VALIDATION

---

## VERIFY

Each engine:

* follows its spec
* uses correct providers
* outputs structured data only
* does not invent truth

---

## LOCK CONDITION

```text
All engines are spec-compliant.
```

---

# 🔴 STEP 15 — FILTER SYSTEM

---

## VERIFY

* one filter active
* filters affect output
* filters executed in backend

---

## LOCK CONDITION

```text
Filters modify scene deterministically.
```

---

# 🔴 STEP 16 — SCENE GENERATION

---

## VERIFY

Scene generated from:

```text
Scope + Engine + Filter
```

---

## LOCK CONDITION

```text
Scene fully controlled by pipeline.
```

---

# 🔴 STEP 17 — ABOVE ME ORCHESTRATION

---

## VERIFY

* merges multiple engines
* applies visibility rules
* applies ranking
* produces one scene

---

## LOCK CONDITION

```text
Above Me is a true orchestrator.
```

---

# 🔴 STEP 18 — DATA BOUNDARY ENFORCEMENT

---

## VERIFY

* no raw data in UI
* frontend does not filter or rank

---

## LOCK CONDITION

```text
Backend owns all meaning.
```

---

# 🔴 STEP 19 — TRACEABILITY

---

## VERIFY

* provider source tracked
* timestamps present
* degraded state visible

---

## LOCK CONDITION

```text
All outputs traceable to provider.
```

---

# 🔴 STEP 20 — LOCATION / TIME VALIDATION

---

## VERIFY

* location affects output
* time affects output

---

## LOCK CONDITION

```text
Scene reflects real-world context.
```

---

# 🔴 STEP 21 — VISIBILITY + RANKING

---

## VERIFY

* altitude filtering applied
* relevance filtering applied
* ranking deterministic

---

## LOCK CONDITION

```text
Only meaningful objects surfaced.
```

---

# 🔴 STEP 22 — DEGRADED MODE

---

## VERIFY

* failures detected
* degraded state exposed
* no silent fallback

---

## LOCK CONDITION

```text
System truth is transparent.
```

---

# 🔴 STEP 23 — FINAL REALITY VALIDATION

---

## VERIFY

* outputs match real world
* no synthetic data
* engines behave correctly

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
ALL engines spec-compliant
ALL data provider-backed
NO mock runtime data
NO pipeline violations
```

---

# FINAL RULE

```text
Do NOT proceed to Phase 3 unless Phase 2 is fully locked and reality-backed.
```
----