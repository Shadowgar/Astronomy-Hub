# 📄 `TRANSIENT_EVENTS_ENGINE_SPEC.md` (AUTHORITATIVE — V1)

---

# 🌠 TRANSIENT EVENTS ENGINE — SPECIFICATION

## Status: 🟡 HIGH VALUE — SUPPORTING ENGINE

## Phase Ownership: Phase 2 (Basic) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The Transient Events Engine answers:

> **“What special, time-sensitive astronomical events are happening that I should not miss?”**

---

# 🔥 CORE PRINCIPLE

> This engine focuses on **time-bound, high-value events**, not static objects.

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text
Event Sources (APIs / datasets)
        ↓
Normalization Layer
        ↓
Time Filtering (Tonight / Near-term)
        ↓
Visibility Filtering (ORAS)
        ↓
Ranking + Importance
        ↓
API (/api/events)
        ↓
UI (Module + Detail Panel + Alerts)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* Event datasets (meteor showers, comets, conjunctions)
* Time (critical)
* Location (ORAS — Phase 2 fixed)
* Conditions Engine (affects visibility)

---

### Downstream Influence

* “Now Above Me”
* Events module
* Alerts system (future)
* Detail panel

---

# 📡 DATA SOURCES (LOCKED)

---

## 🔹 PRIMARY (PHASE 2)

### Meteor Showers (Static Dataset)

* name
* peak dates
* radiant direction
* intensity

---

### Conjunctions (Derived or dataset)

* planetary alignments
* close sky events

---

---

## 🔹 SECONDARY (PHASE 3+)

### Comets

* visible comets
* brightness
* sky position

---

### NeoWs

* asteroid close approaches
* small body events

---

---

## 🔹 ENRICHMENT

* NASA APOD (optional)
* science context

---

# ⚙️ CORE COMPUTATION MODEL

---

## Step 1 — Event Ingestion

```text
Meteor showers
Conjunctions
(Comets later)
```

---

## Step 2 — Time Filtering

```text
Events within:
- tonight
- next 24–72 hours
```

---

## Step 3 — Visibility Filtering

Using:

* ORAS location
* altitude of radiant/object
* time window

---

## Step 4 — Conditions Adjustment

Using Conditions Engine:

* clouds
* moon interference

---

## Step 5 — Ranking

Criteria:

```text
Event timing (peak proximity)
Visibility
Conditions
Rarity
Impact
```

---

## Step 6 — “Why It Matters” Logic

Examples:

* “Peak meteor shower tonight”
* “Rare planetary conjunction visible”
* “Comet visible after midnight”
* “Event affected by moonlight”

---

# 🧠 OUTPUT MODEL

---

## `/api/events`

```json
[
  {
    "name": "Perseid Meteor Shower",
    "type": "meteor_shower",
    "peak_time": "02:00",
    "visibility": "good",
    "direction": "NE",
    "intensity": "high",
    "reason": "Peak tonight with favorable conditions"
  }
]
```

---

# 🖥️ UI INTEGRATION

---

## 🔹 Events Module

* 3–5 events
* ranked

---

## 🔹 “Now Above Me”

* include if highly relevant

---

## 🔹 Detail Panel

### Example: Meteor Shower

```text
Perseid Meteor Shower

WHY IT MATTERS
- Peak tonight, high activity expected

[Overview]
- intensity
- peak time

[Viewing Info]
- direction
- best time

[Conditions Impact]
- moon interference

[Data]
- historical info
```

---

# ⚠️ UI RULES

* must stay concise
* max 3–5 events
* must prioritize importance

---

# 🔄 SYSTEM BEHAVIOR

---

## Refresh Frequency

* hourly or slower
* not real-time intensive

---

## Caching

* long-lived caching acceptable

---

## Fallback Behavior

If data unavailable:

* show static events
* degrade gracefully

---

# 🚀 PHASE BREAKDOWN

---

## 🟡 PHASE 2 (BASIC)

### Build:

* meteor shower dataset
* conjunction detection (basic)
* time filtering
* simple ranking

---

### Constraints:

* no comet tracking yet
* no asteroid integration yet
* no alert system yet

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* comet integration
* NeoWs asteroid events
* better conjunction detection
* conditions-aware ranking

---

## 🟡 PHASE 4+

### Add:

* alert system
* notifications
* personalized event tracking
* advanced scheduling

---

# 🔒 HARD RULES (LOCKED)

1. Must focus on time-sensitive events
2. Must filter aggressively
3. Must integrate with conditions
4. Must prioritize importance
5. Must remain lightweight

---

# 🧠 SUCCESS CRITERIA

* events are relevant and timely
* users notice meaningful opportunities
* system highlights rare events
* UI remains clean

---

# 📌 SUMMARY

The Transient Events Engine is:

> **A time-aware system that highlights rare and important sky events**

---

# ✅ NEXT STEP

At this point, you now have **ALL ENGINE SPECS CREATED**:

* Conditions Engine
* Satellite Engine
* Solar System Engine
* Deep Sky Engine
* Sun Engine
* Flight Engine
* Transient Events Engine

---