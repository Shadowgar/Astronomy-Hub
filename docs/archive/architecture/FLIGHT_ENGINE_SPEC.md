# 📄 `FLIGHT_ENGINE_SPEC.md` (AUTHORITATIVE — V1)

---

# ✈️ FLIGHT TRACKING ENGINE — SPECIFICATION

## Status: 🟡 OPTIONAL — SUPPORTING ENGINE

## Phase Ownership: Phase 2 (Basic) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The Flight Tracking Engine answers:

> **“What aircraft are currently overhead or relevant to the observing location?”**

---

# 🔥 CORE PRINCIPLE

> This is NOT a radar system.
> It is a **relevance-filtered awareness layer**.

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text id="y6m0qx"
ADS-B Exchange (Raw Data)
        ↓
Ingestion Layer
        ↓
Geographic Filtering
        ↓
Relevance Filtering
        ↓
Ranking
        ↓
API (/api/aircraft/above)
        ↓
UI (Module + Detail Panel)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* Aircraft position data (ADS-B Exchange)
* Time (real-time)
* Location (ORAS — Phase 2 fixed)

---

### Downstream Influence

* “Now Above Me”
* Flight module
* Detail panel

---

# 📡 DATA SOURCES (LOCKED)

---

## 🔹 PRIMARY

### ADS-B Exchange

* aircraft position
* altitude
* heading
* callsign

---

## 🔹 OPTIONAL (PHASE 3+)

* aircraft metadata enrichment (airline, type)

---

# ⚙️ CORE COMPUTATION MODEL

---

## Step 1 — Data Ingestion

* fetch aircraft within bounding region

---

## Step 2 — Geographic Filtering

```text id="7x3mbk"
Radius filter (e.g. 100–200 miles from ORAS)
```

---

## Step 3 — Altitude Filtering

```text id="rpxr8n"
Exclude:
- low altitude (< 5,000 ft)

Include:
- cruising aircraft
```

---

## Step 4 — Overhead Detection

```text id="0xg6x9"
Distance + altitude → determine “overhead”
```

---

## Step 5 — Ranking

Criteria:

```text id="qdrgwl"
Distance (closer = higher)
Altitude
Relevance (direct overhead vs nearby)
Movement direction
```

---

## Step 6 — “Why It Matters” Logic

Examples:

* “Passing directly overhead”
* “High-altitude aircraft nearby”
* “Visible in southern sky”

---

# 🧠 OUTPUT MODEL

---

## `/api/aircraft/above`

```json id="2yyhpm"
[
  {
    "callsign": "DAL123",
    "altitude_ft": 34000,
    "heading": 270,
    "distance_mi": 12,
    "direction": "W",
    "type": "commercial",
    "reason": "Passing directly overhead"
  }
]
```

---

# 🖥️ UI INTEGRATION

---

## 🔹 “Now Above Me”

* optional inclusion
* low priority vs astronomy objects

---

## 🔹 Flight Module

* short list (3–5 aircraft)

---

## 🔹 Detail Panel

### Example: Aircraft

```text id="j37dr2"
DAL123

WHY IT MATTERS
- Passing directly overhead

[Overview]
- altitude
- heading

[Position]
- direction
- movement

[Data]
- callsign
- type
```

---

# ⚠️ UI RULES

* must not dominate UI
* max 3–5 aircraft
* optional visibility

---

# 🔄 SYSTEM BEHAVIOR

---

## Refresh Frequency

* every 5–10 seconds (lightweight)
* or 10–30 seconds (preferred)

---

## Caching

* short-term caching

---

## Fallback Behavior

If data unavailable:

* hide module
* degrade silently

---

# 🚀 PHASE BREAKDOWN

---

## 🟡 PHASE 2 (BASIC)

### Build:

* ingestion (or mock)
* filtering
* basic ranking
* UI integration

---

### Constraints:

* no global radar
* no heavy UI
* minimal importance

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* aircraft type enrichment
* improved filtering
* better relevance scoring

---

## 🟡 PHASE 4+

### Add:

* flight path visualization
* notifications
* tracking specific aircraft

---

# 🔒 HARD RULES (LOCKED)

1. Must remain lightweight
2. Must filter aggressively
3. Must not overwhelm UI
4. Must not replace astronomy focus
5. Must degrade gracefully

---

# 🧠 SUCCESS CRITERIA

* only relevant aircraft shown
* system remains clean
* no performance issues
* adds awareness without clutter

---

# 📌 SUMMARY

The Flight Engine is:

> **A lightweight awareness system for aircraft overhead, not a full tracking platform**

---

# 13. SOURCE TIERS (ADDITIVE)

The Flight Engine keeps strict source tiers:

## 13.1 PRIMARY

* ADS-B position feed(s) used by backend ingestion
* minimum needed fields: identifier/callsign, lat/lon, altitude, heading, timestamp

## 13.2 ENRICHMENT

* optional aircraft metadata registries for operator/type/route context
* applied only when data quality is acceptable

## 13.3 FALLBACK

If primary feed is unavailable:

* return explicit degraded state
* avoid presenting stale aircraft as live truth

---

# 14. NORMALIZED CONTRACT EXTENSION (ADDITIVE)

Flight summaries should prefer a stable contract with explicit provenance:

```json
{
  "id": "flight:dal123",
  "name": "DAL123",
  "type": "flight",
  "engine": "flights",
  "position": {"lat": 40.8, "lon": -79.2, "altitude_ft": 34000},
  "motion": {"heading_deg": 270, "ground_speed_kts": 450},
  "relevance": {"distance_mi": 12, "overhead": true, "rank": 1},
  "why_it_matters": "Passing directly overhead in current sky window.",
  "trace": {"provider": "adsb_exchange", "fetched_at": "2026-04-03T02:40:00Z"}
}
```

Contract notes:

* `why_it_matters` must be concise and user-facing
* `trace` must be machine-usable for diagnostics/provenance
* missing optional values should be explicit (not silently dropped)

---

# 15. FEATURED USER VALUE (ADDITIVE)

At Phase-2-level behavior, the user should get:

* quick awareness of relevant overhead aircraft
* strong filtering against low-relevance traffic
* clean separation between astronomy-critical objects and flight context

This engine remains supporting context, not the main scene authority.

---

# 16. MASTER PLAN ALIGNMENT + IMPLEMENTATION GUARDRAILS (ADDITIVE)

## 16.1 Master-Plan Alignment Targets

* Aligns to Master Plan §4.4 (Flight Engine) and Above Me merge awareness.
* Must provide context without displacing astronomy priorities.

## 16.2 Minimum Phase-2 Real Capability

Must provide:

* bounded overhead/nearby high-relevance aircraft list
* simple movement and relevance context
* clear why-it-matters messaging

## 16.3 Priority Boundary Rule

* Flight context is supporting signal in the command center.
* It must not dominate “Now Above Me” ranking over astronomy-critical objects by default.

## 16.4 Regional Context Rule

* relevance scoring must be tied to active location/time
* route/position snapshots lacking location coupling are insufficient

## 16.5 Build-to-Proof Checklist

Prove:

* location/time changes reorder or filter overhead flights correctly
* stale data is explicitly degraded
* output remains bounded and concise for UI scanability
