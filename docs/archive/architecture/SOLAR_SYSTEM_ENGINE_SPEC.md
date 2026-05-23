# 📄 `SOLAR_SYSTEM_ENGINE_SPEC.md` (AUTHORITATIVE — V1)

---

# 🪐 SOLAR SYSTEM ENGINE — SPECIFICATION

## Status: 🔴 REQUIRED — CORE ENGINE

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The Solar System Engine answers:

> **“What solar system objects (planets, Moon) are visible from ORAS right now, where are they, and why do they matter?”**

---

# 🔥 CORE PRINCIPLE

> We do NOT approximate planetary positions.
> We use **authoritative ephemeris data**.

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text id="hfr1zj"
Object Selection (Planets + Moon)
        ↓
JPL Horizons (Ephemeris)
        ↓
Position Computation (Alt/Az)
        ↓
Visibility Filtering
        ↓
Ranking + Reasoning
        ↓
API (/api/solar-system)
        ↓
UI (Modules + Detail Panel)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* Ephemeris data (JPL Horizons)
* Time (system clock)
* Location (ORAS — Phase 2 fixed)

---

### Downstream Influence

* “Now Above Me”
* Solar System module
* Conditions engine (visibility weighting)
* Detail panel

---

# 📡 DATA SOURCES (LOCKED)

---

## 🔹 PRIMARY

### JPL Horizons

* planetary positions
* rise/set times
* altitude/azimuth
* brightness

---

## 🔹 OBJECT RESOLUTION

### Horizons Lookup API

* resolves object IDs
* handles naming consistency

---

## 🔹 ENRICHMENT (DETAIL PANEL ONLY)

* NASA APOD (optional)
* NASA image library
* JPL planetary data

---

# ⚙️ CORE COMPUTATION MODEL

---

## Step 1 — Object Set (Phase 2)

```text id="wff5u4"
Sun (excluded from this engine UI)
Moon
Mercury
Venus
Mars
Jupiter
Saturn
Uranus
Neptune
```

---

## Step 2 — Ephemeris Fetch

For each object:

* altitude
* azimuth
* rise/set
* magnitude

---

## Step 3 — Visibility Filtering

```text id="hpr6zo"
If altitude > 5–10°
→ considered visible
```

---

## Step 4 — Ranking

Criteria:

* altitude (higher = better)
* brightness (magnitude)
* time window
* conditions influence

---

## Step 5 — “Why It Matters” Logic

Examples:

* “High in sky, excellent viewing”
* “Visible after sunset”
* “Low on horizon, limited window”

---

# 🧠 OUTPUT MODEL

---

## `/api/solar-system`

```json id="52i1xm"
[
  {
    "name": "Jupiter",
    "type": "planet",
    "altitude_deg": 45,
    "azimuth_deg": 135,
    "magnitude": -2.5,
    "visibility": "excellent",
    "best_time": "21:00",
    "reason": "Bright and high in the sky"
  }
]
```

---

# 🖥️ UI INTEGRATION

---

## 🔹 “Now Above Me”

* includes visible planets

---

## 🔹 Solar System Module

* 3–5 visible objects
* ranked

---

## 🔹 Detail Panel

### Example: Jupiter

```text id="0v3aqz"
Jupiter

WHY IT MATTERS
- Bright and high tonight

[Overview]
- magnitude
- distance

[Sky Position]
- altitude
- direction

[Visibility]
- rise/set
- best viewing time

[Images]
- NASA / JPL imagery

[Data]
- physical stats
```

---

# ⚠️ UI RULES

* max 5 objects
* must include reason
* must be scannable quickly

---

# 🔄 SYSTEM BEHAVIOR

---

## Refresh Frequency

* every 5–15 minutes

---

## Caching

* required
* store computed results

---

## Fallback Behavior

If Horizons unavailable:

* use cached data
* degrade gracefully

---

# 🚀 PHASE BREAKDOWN

---

## 🔴 PHASE 2 (CORE)

### Build:

* Horizons integration
* visibility computation
* ranking system
* UI integration

---

### Constraints:

* no advanced sky visualization
* no 3D models
* no complex simulation

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* sky orientation overlay
* horizon projection
* better brightness modeling
* time slider (tonight)

---

## 🟡 PHASE 4+

### Add:

* 3D planet globes
* real-time imagery overlays (where possible)
* comparison views
* advanced observation guidance

---

# 🔒 HARD RULES (LOCKED)

1. Must use authoritative ephemeris (JPL)
2. Must compute local visibility
3. Must provide reasoning
4. Must integrate with conditions engine
5. Must remain lightweight in Phase 2

---

# 🧠 SUCCESS CRITERIA

* planets appear where expected
* visibility matches real sky
* output is believable
* UI is clear and useful

---

# 📌 SUMMARY

The Solar System Engine is:

> **A precision-driven system that converts ephemeris data into meaningful observing guidance**

---

# 15. SOURCE TIERS (ADDITIVE)

## 15.1 PRIMARY

* JPL-class ephemeris provider path for body position/time context
* backend visibility computation for local sky context

## 15.2 ENRICHMENT

* NASA/JPL imagery/media references
* optional mission/reference metadata for selected bodies

## 15.3 FALLBACK

If primary ephemeris source is unavailable:

* use cached ephemeris snapshots for bounded window
* mark output degraded and timestamped

---

# 16. NORMALIZED CONTRACT EXTENSION (ADDITIVE)

Solar-system scene/detail output should remain deterministic by input time/location:

```json
{
  "id": "solar:neptune",
  "name": "Neptune",
  "engine": "planets",
  "type": "planet",
  "position": {"azimuth_deg": 262.5, "elevation_deg": 8.0},
  "visibility": {
    "state": "visible_now",
    "window_start": "2026-04-03T22:00:00Z",
    "window_end": "2026-04-04T03:00:00Z",
    "best_viewing_time": "2026-04-03T22:00:00Z"
  },
  "why_it_matters": "Currently observable in the active context with a valid local visibility window.",
  "trace": {"provider": "jpl_ephemeris", "fetched_at": "2026-04-03T01:55:00Z"}
}
```

Contract notes:

* identical input context must produce identical deterministic output
* image/media fields should reference object-correct assets only (no cross-object image bleed)

---

# 17. MASTER PLAN ALIGNMENT + IMPLEMENTATION GUARDRAILS (ADDITIVE)

## 17.1 Master-Plan Alignment Targets

* Aligns to Master Plan §4.5 (Solar System Engine) and §5 object interaction flow.
* Phase-2 focus is accurate context + decisions, not full immersive rendering.

## 17.2 Minimum Phase-2 Real Capability

Must provide:

* locally relevant visible planetary set for active context
* deterministic ephemeris-based position + visibility windows
* best-viewing-time guidance with concise reason
* object detail tabs that remain backend-authoritative

## 17.3 3D/Immersive Boundary Rule

* advanced 3D globe/system rendering is Phase-3+ enhancement
* Phase-2 must still preserve future 3D handoff through stable object identity/contracts

## 17.4 Media Integrity Rule

* body media must be mapped by canonical object identity
* incorrect default imagery (e.g., sun image on Neptune) is a contract/data mapping failure

## 17.5 Build-to-Proof Checklist

Prove:

* `at` parameter changes output predictably
* identical inputs return identical ephemeris scene output
* detail payload fields match selected body identity and source trace
