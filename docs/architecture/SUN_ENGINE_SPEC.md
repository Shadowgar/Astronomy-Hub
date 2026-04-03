# ☀️ SUN ENGINE — SPECIFICATION

## Status: 🔴 REQUIRED — CORE ENGINE (SEPARATE FROM SOLAR SYSTEM)

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The Sun Engine answers:

> **“What is happening on the Sun right now, and does it matter to me?”**

---

# 🔥 CORE PRINCIPLE

> The Sun is NOT treated as a normal object.
> It is a **data-rich, event-driven system** with its own APIs and behavior.

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text id="j8w6s1"
Helioviewer / SDO (Imagery)
        +
NASA DONKI (Events)
        +
NOAA SWPC (Conditions / Alerts)
                ↓
Normalization Layer
                ↓
Solar State Model
                ↓
API (/api/sun)
                ↓
UI (Modules + Detail Panel)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* Solar imagery (Helioviewer / SDO)
* Solar events (DONKI)
* Space weather (NOAA SWPC)

---

### Downstream Influence

* Conditions Engine (space weather context)
* Events Engine (future)
* Detail panel

---

# 📡 DATA SOURCES (LOCKED)

---

## 🔹 PRIMARY IMAGERY

### Helioviewer API

* SDO imagery
* multi-wavelength views
* current solar disk

---

## 🔹 SOLAR EVENTS

### NASA DONKI

* solar flares
* CMEs
* SEP events
* event timelines

---

## 🔹 OPERATIONAL CONDITIONS

### NOAA SWPC

* alerts
* forecasts
* current solar activity levels

---

## 🔹 OPTIONAL (PHASE 3+)

* EPIC imagery (context only)
* additional solar datasets

---

# ⚙️ CORE COMPUTATION MODEL

---

## Step 1 — Solar Image Fetch

* current solar disk image
* timestamped

---

## Step 2 — Event Aggregation

From DONKI:

* active events
* recent events

---

## Step 3 — Space Weather State

From NOAA SWPC:

* activity level
* alerts / warnings

---

## Step 4 — Solar Activity Classification

```text id="l8u7mt"
QUIET
MODERATE
ACTIVE
HIGH
```

---

## Step 5 — “Why It Matters” Logic

Examples:

* “Low solar activity, stable conditions”
* “Active region detected, potential flares”
* “Elevated solar activity, possible aurora impact”

---

# 🧠 OUTPUT MODEL

---

## `/api/sun`

```json id="f8s2je"
{
  "activity_level": "moderate",
  "events": [
    {
      "type": "solar_flare",
      "class": "M1",
      "time": "14:22",
      "impact": "low"
    }
  ],
  "summary": "Moderate solar activity with minor flare events",
  "image_url": "helioviewer_image_url"
}
```

---

# 🖥️ UI INTEGRATION

---

## 🔹 Sun Module

* activity summary
* key events
* simple classification

---

## 🔹 “Now Above Me”

* minimal inclusion (only if relevant)

---

## 🔹 Detail Panel

### Example: Sun

```text id="6yhj4o"
Sun

WHY IT MATTERS
- Moderate activity, minor flares detected

[Overview]
- activity level

[Events]
- flare timeline
- CME activity

[Images]
- solar disk imagery

[Data]
- solar metrics
```

---

# ⚠️ UI RULES

* must remain simple in Phase 2
* no overwhelming event lists
* must include summary

---

# 🔄 SYSTEM BEHAVIOR

---

## Refresh Frequency

* every 5–15 minutes

---

## Caching

* required
* avoid excessive API calls

---

## Fallback Behavior

If data unavailable:

* use last known state
* degrade gracefully

---

# 🚀 PHASE BREAKDOWN

---

## 🔴 PHASE 2 (CORE)

### Build:

* imagery reference (Helioviewer)
* event ingestion (DONKI)
* activity classification
* summary generation

---

### Constraints:

* no 3D rendering
* no detailed hotspot mapping
* no heavy visualization

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* better event correlation
* timeline view
* improved activity modeling
* integration with Events Engine

---

## 🟡 PHASE 4+

### Add:

* 3D Sun globe
* hotspot mapping
* surface overlays
* interactive visualization

---

# 🔒 HARD RULES (LOCKED)

1. Must treat Sun as separate engine
2. Must combine imagery + events + conditions
3. Must provide simple summary
4. Must not overwhelm UI
5. Must degrade gracefully

---

# 🧠 SUCCESS CRITERIA

* solar activity reflects reality
* events are meaningful
* UI is clear and usable
* system feels informative, not noisy

---

# 📌 SUMMARY

The Sun Engine is:

> **An event-driven system that combines solar imagery and space weather into meaningful context**

---

# 15. SOURCE TIERS (ADDITIVE)

## 15.1 PRIMARY

* NOAA SWPC-style solar activity/event feeds
* backend solar activity normalization path

## 15.2 ENRICHMENT

* Helioviewer/NASA imagery references
* optional mission-linked media/analysis references

## 15.3 FALLBACK

If primary event feed fails:

* return last-known solar state with explicit staleness marker
* keep summary concise and truthful about degraded freshness

---

# 16. NORMALIZED CONTRACT EXTENSION (ADDITIVE)

Sun engine outputs should combine activity state + event context:

```json
{
  "id": "sun:activity",
  "engine": "sun",
  "state": {"activity_level": "quiet", "risk_window": "low"},
  "events": [{"type": "flare", "class": "M1.2", "time": "2026-04-03T00:40:00Z"}],
  "why_it_matters": "Current solar activity remains low with no immediate severe impact indicators.",
  "trace": {"provider": "noaa_swpc", "fetched_at": "2026-04-03T01:45:00Z"}
}
```

Contract notes:

* summary must remain decision-support oriented, not raw telemetry dump
* event lists should be bounded and relevance-ranked

---

# 17. MASTER PLAN ALIGNMENT + IMPLEMENTATION GUARDRAILS (ADDITIVE)

## 17.1 Master-Plan Alignment Targets

* Aligns to Master Plan §4.2 (Solar Engine) and cross-engine condition/event relevance.
* Must answer: “What is happening on the Sun now, and does it affect observing?”

## 17.2 Minimum Phase-2 Real Capability

Must provide:

* current solar activity state (quiet/moderate/active/high)
* bounded event list with impact context
* concise why-it-matters summary consumable by briefing panel

## 17.3 Cross-Engine Relevance Rule

* Sun output should provide explicit hooks for Conditions and Events engines.
* Cross-linking must preserve owning-engine identity and source provenance.

## 17.4 Visualization Boundary Rule

* Phase-2: informative summary + image references
* Phase-3+: advanced surface/globe visualization
* No placeholder 3D should be presented as real Phase-2 capability

## 17.5 Build-to-Proof Checklist

Prove:

* source traces and freshness are exposed
* activity classification is deterministic for identical input snapshots
* downstream panel callouts consume sun summary without raw payload leakage
