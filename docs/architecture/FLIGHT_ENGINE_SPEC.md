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

