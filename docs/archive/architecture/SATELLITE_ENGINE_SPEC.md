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

# 17. SOURCE TIERS (ADDITIVE)

## 17.1 PRIMARY

* TLE/orbital element sources used for pass computation (e.g., CelesTrak-class feeds)
* backend local propagation/pass computation output

## 17.2 ENRICHMENT

* satellite/operator metadata registries
* optional mission/media cross-reference sources

## 17.3 FALLBACK

If fresh TLE/propagation input is unavailable:

* use cached recent pass windows with explicit degraded flag
* avoid presenting stale computed passes as fully live

---

# 18. NORMALIZED CONTRACT EXTENSION (ADDITIVE)

Satellite scene/detail output should include structured traceability:

```json
{
  "id": "sat:25544",
  "name": "ISS",
  "engine": "satellites",
  "type": "satellite",
  "pass": {
    "start": "2026-04-03T01:18:00Z",
    "peak": "2026-04-03T01:21:00Z",
    "end": "2026-04-03T01:24:00Z",
    "max_elevation_deg": 63.2
  },
  "visibility": {"above_horizon": true, "brightness": "high"},
  "why_it_matters": "Bright pass window crossing the local sky in the next 15 minutes.",
  "trace": {"provider": "satnogs", "fetched_at": "2026-04-03T01:10:00Z"}
}
```

Contract notes:

* core pass times and visibility fields are mandatory for ranked output
* enrichment fields (operator/mission/images) are optional but should be explicit when missing

---

# 19. MASTER PLAN ALIGNMENT + IMPLEMENTATION GUARDRAILS (ADDITIVE)

## 19.1 Master-Plan Alignment Targets

* Aligns to Master Plan §4.3 (Satellite Engine) and §5.2 (Above Me merge).
* Must answer: “What satellites are above me now, and which pass matters next?”

## 19.2 Minimum Phase-2 Real Capability

Must produce:

* ranked visible/current/near-term pass candidates
* per-item why-it-matters reason
* object detail fields for mission/operator/origin/catalog where available
* explicit placeholders for unavailable details (never silent empty fields)

## 19.3 Quality and Integrity Rules

* Satellite images must be object-correct; cross-object image bleed is a failure.
* Known bad/unusable media URLs must not be shown as authoritative images.
* If source metadata is incomplete, output must state that explicitly.

## 19.4 Above-Me Coupling Rule

* Above Me must include satellite candidates when visibility criteria are met.
* Satellite contribution must be filtered/ranked, not raw catalog dump.

## 19.5 Build-to-Proof Checklist

Prove with runtime tests/evidence:

* location/time context changes pass windows/ranking
* deterministic output for identical inputs
* detail payload includes structured context (status/country/catalog/launch/mission) when available
