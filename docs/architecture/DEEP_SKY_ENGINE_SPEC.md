# 📄 `DEEP_SKY_ENGINE_SPEC.md` (AUTHORITATIVE — V1)

---

# 🌌 DEEP SKY ENGINE — SPECIFICATION

## Status: 🔴 REQUIRED — CORE ENGINE

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The Deep Sky Engine answers:

> **“What deep sky objects are worth observing or imaging from ORAS right now?”**

---

# 🔥 CORE PRINCIPLE

> Deep sky objects are NOT fetched from APIs.
> They are **computed from catalog data + sky position**.

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text id="hh4r0h"
Catalog (Messier / NGC / IC)
        ↓
Normalization Layer
        ↓
Sky Computation (RA/Dec → Alt/Az)
        ↓
Visibility Filtering
        ↓
Ranking (Conditions-aware)
        ↓
API (/api/deep-sky)
        ↓
UI (Modules + Detail Panel)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* Deep sky catalog (local dataset)
* Time (system clock)
* Location (ORAS — Phase 2 fixed)
* Conditions Engine (critical for ranking)

---

### Downstream Influence

* “Now Above Me”
* Deep Sky module
* Astrophotography Engine (future)
* Detail panel

---

# 📡 DATA SOURCES (LOCKED)

---

## 🔹 PRIMARY (PHASE 2)

### Messier Catalog

* bright
* beginner-friendly
* ideal for initial dataset

---

## 🔹 EXPANSION (PHASE 3+)

### NGC Catalog

### IC Catalog

---

## 🔹 ENRICHMENT (DETAIL PANEL)

* NASA image library
* ESO imagery
* public astrophotography sources

---

# ⚙️ CORE COMPUTATION MODEL

---

## Step 1 — Catalog Ingestion

Each object includes:

```text id="4a9u2g"
Name
Catalog ID (M, NGC, IC)
RA (Right Ascension)
Dec (Declination)
Magnitude
Type (galaxy, nebula, cluster)
Constellation
Angular size
```

---

## Step 2 — Position Conversion

```text id="9z0z3k"
RA/Dec → Altitude/Azimuth
```

Using:

* time
* ORAS location

---

## Step 3 — Visibility Filtering

```text id="lqk1px"
Altitude > 20° → Good candidate
Altitude 10–20° → Marginal
< 10° → Exclude
```

---

## Step 4 — Conditions Adjustment

Using Conditions Engine:

* poor conditions → reduce deep sky visibility
* high moon → penalize faint objects

---

## Step 5 — Ranking

Criteria:

```text id="2fwq8y"
Altitude (primary)
Magnitude (brightness)
Object type
Conditions
Moon interference
Seasonality
```

---

## Step 6 — “Why It Matters” Logic

Examples:

* “Bright, high in sky, excellent for viewing”
* “Best after 11 PM”
* “Visible but affected by moonlight”
* “Low on horizon, short window”

---

# 🧠 OUTPUT MODEL

---

## `/api/deep-sky`

```json id="7bb7r6"
[
  {
    "name": "Orion Nebula",
    "catalog": "M42",
    "type": "nebula",
    "constellation": "Orion",
    "altitude_deg": 45,
    "magnitude": 4.0,
    "visibility": "excellent",
    "best_time": "22:00",
    "reason": "Bright and high, excellent viewing conditions"
  }
]
```

---

# 🖥️ UI INTEGRATION

---

## 🔹 “Now Above Me”

* includes top deep sky objects

---

## 🔹 Deep Sky Module

* 5–10 objects
* ranked list
* short reasons

---

## 🔹 Detail Panel

### Example: Orion Nebula (M42)

```text id="5t7x9m"
Orion Nebula (M42)

WHY IT MATTERS
- Bright and high, excellent viewing tonight

[Overview]
- type, magnitude, size

[Sky Position]
- altitude, direction

[Viewing Info]
- best time
- conditions impact

[Images]
- NASA / ESO imagery

[Data]
- distance, size, constellation
```

---

# ⚠️ UI RULES

* max 10 objects
* must be ranked
* must include reasoning
* must avoid overwhelming lists

---

# 🔄 SYSTEM BEHAVIOR

---

## Refresh Frequency

* every 5–15 minutes

---

## Caching

* required
* store computed visibility

---

## Fallback Behavior

If computation fails:

* use cached results
* degrade gracefully

---

# 🚀 PHASE BREAKDOWN

---

## 🔴 PHASE 2 (CORE)

### Build:

* Messier catalog ingestion
* RA/Dec → Alt/Az computation
* visibility filtering
* ranking system
* UI integration

---

### Constraints:

* no full NGC catalog yet
* no astrophotography logic yet
* no complex sky maps

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* NGC / IC expansion
* improved ranking logic
* astrophotography scoring
* moon interference modeling

---

## 🟡 PHASE 4+

### Add:

* framing guidance
* exposure suggestions
* equipment recommendations
* advanced filtering

---

# 🔒 HARD RULES (LOCKED)

1. Must compute visibility locally
2. Must use curated dataset (Phase 2)
3. Must integrate with Conditions Engine
4. Must provide reasoning
5. Must avoid overwhelming UI

---

# 🧠 SUCCESS CRITERIA

* objects shown match sky reality
* recommendations feel useful
* system adapts to conditions
* UI remains clear

---

# 📌 SUMMARY

The Deep Sky Engine is:

> **A computation-driven system that transforms catalog data into meaningful observing targets**

---
