# 📄 `SATELLITE_ENGINE_SPEC.md` (AUTHORITATIVE — V1)

---

# 🛰️ SATELLITE ENGINE — SPECIFICATION

## Status: 🔴 REQUIRED — CORE ENGINE

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The Satellite Engine answers:

> **“What satellites are above me right now, and what passes should I care about?”**

---

# 🔥 CORE PRINCIPLE

> We do NOT rely on third-party pass APIs.
> We compute passes from orbital data (TLE).

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text
CelesTrak / Space-Track (TLE)
        ↓
TLE Ingestion
        ↓
Propagation Engine (SGP4 / Skyfield)
        ↓
Pass Computation
        ↓
Filtering + Ranking
        ↓
API (/api/passes, /api/above)
        ↓
UI (Modules + Detail Panel)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* TLE data source (CelesTrak primary)
* Time (system clock)
* Location (ORAS — Phase 2 fixed)

---

### Downstream Influence

* “Now Above Me” module
* Satellite module
* Detail panel
* Conditions engine (visibility clarity tie-in)

---

# 📡 DATA SOURCES (LOCKED)

## 🔹 PRIMARY

### CelesTrak

* TLE feeds
* curated groups (stations, visual satellites)

---

## 🔹 BACKUP AUTHORITY

### Space-Track

* full catalog
* fallback ingestion

---

## 🔹 FALLBACK APIs (DEGRADED MODE ONLY)

* Free HTTP API (satellite predictions)
* N2YO (strict rate-limited fallback)

---

# ⚙️ CORE COMPUTATION MODEL

---

## Step 1 — TLE Ingestion

```text
Fetch TLE data (scheduled)
Store normalized orbital elements
```

---

## Step 2 — Propagation

Use:

* SGP4 / Skyfield

Compute:

* position over time
* ground track
* altitude / azimuth

---

## Step 3 — Pass Computation

Determine:

* rise time
* max elevation
* set time
* visibility window

---

## Step 4 — “Above Me” Detection

```text
If altitude > threshold (e.g. 10°)
→ satellite considered visible
```

---

## Step 5 — Filtering

Limit to:

* ISS / stations
* bright satellites
* curated set

---

## Step 6 — Ranking

Criteria:

* brightness
* max elevation
* duration
* current visibility

---

# 🧠 OUTPUT MODELS

---

## `/api/above`

```json
[
  {
    "name": "ISS",
    "altitude_deg": 42,
    "azimuth_deg": 180,
    "brightness": "very bright",
    "reason": "Currently overhead, highly visible"
  }
]
```

---

## `/api/passes`

```json
[
  {
    "name": "ISS",
    "start_time": "20:14",
    "max_elevation": 78,
    "duration_sec": 360,
    "direction": "W → E",
    "visibility": "excellent",
    "reason": "High pass, long duration"
  }
]
```

---

# 🖥️ UI INTEGRATION

---

## 🔹 “Now Above Me”

* shows current visible satellites
* mixed with other engines

---

## 🔹 Satellite Module

* upcoming passes
* ranked list

---

## 🔹 Detail Panel

When clicking:

### ISS Example

```text
ISS

WHY IT MATTERS
- Bright, high pass in 12 minutes

[Overview]
- magnitude
- duration

[Sky Position]
- path direction
- elevation

[Pass Details]
- timeline
- visibility quality

[Map / Sky View] (Phase 3+)
```

---

# ⚠️ UI RULES

* max 5–7 passes shown
* must include reason
* must not overwhelm

---

# 🔄 SYSTEM BEHAVIOR

---

## Refresh Frequency

* TLE: every 6–24 hours
* Pass computation: every 5–15 minutes

---

## Caching

* required
* store computed passes

---

## Fallback Behavior

If TLE unavailable:

* use cached TLE
* fallback to API (limited use)

---

# 🚀 PHASE BREAKDOWN

---

## 🔴 PHASE 2 (CORE)

### Build:

* TLE ingestion (CelesTrak)
* propagation engine
* pass computation
* above-me detection
* ranking system

---

### UI:

* populate modules
* connect to detail panel

---

### Constraints:

* limited satellite set
* no global catalog
* no heavy visualization

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* sky path visualization
* horizon projection
* improved brightness modeling
* alerts (“ISS in 5 min”)

---

## 🟡 PHASE 4+

### Add:

* full catalog filtering
* user tracking favorites
* advanced notifications
* 3D orbital visualization

---

# 🔒 HARD RULES (LOCKED)

1. No dependency on pass APIs
2. Must compute locally
3. Must use curated dataset (Phase 2)
4. Must provide reasoning for ranking
5. Must degrade gracefully

---

# 🧠 SUCCESS CRITERIA

* ISS passes are accurate
* visible satellites match reality
* output feels trustworthy
* system performs efficiently

---

# 📌 SUMMARY

The Satellite Engine is:

> **A computation-driven system that converts orbital data into meaningful sky events**

---
