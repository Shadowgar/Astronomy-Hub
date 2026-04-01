# 📄 `CONDITIONS_ENGINE_SPEC.md` (AUTHORITATIVE — V1)

---

# 🌌 OBSERVING CONDITIONS ENGINE — SPECIFICATION

## Status: 🔴 REQUIRED — HIGHEST PRIORITY

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The Observing Conditions Engine is the **primary decision-making layer** of Astronomy Hub.

It answers:

> **“Is tonight worth observing from this location, and why?”**

---

# 🔥 CORE PRINCIPLE

> This engine does NOT return raw weather.
> It returns a **decision + explanation**.

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text
External Data Sources
        ↓
Conditions Engine (Compute + Score)
        ↓
Ranking Layer (affects all engines)
        ↓
UI (Hero Panel + Context Panel + Module)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* NOAA / NWS weather data
* NOAA atmospheric models (GFS / HRRR)
* Moon data (from Solar System Engine)
* Light pollution dataset (static)

---

### Downstream Influence (CRITICAL)

This engine directly affects:

* Deep Sky Engine (target ranking)
* Solar System Engine (visibility importance)
* Satellite Engine (visibility clarity)
* Astrophotography Engine (future)
* UI Hero Panel

---

# 📡 DATA SOURCES (LOCKED)

## 🔹 PRIMARY (REQUIRED)

### NOAA / NWS

* Cloud cover
* Hourly forecast
* Wind
* Humidity
* Temperature

---

### NOAA Atmospheric Models (Derived Use)

* Cloud layers
* Upper-atmosphere wind (seeing approximation)

---

### Moon Data (Internal Dependency)

* Phase
* Illumination %
* Rise / Set
* Altitude

---

### Light Pollution (Static Dataset)

* Bortle approximation
* Stored locally

---

## 🔹 OPTIONAL (PHASE 3+)

* Meteoblue (seeing / transparency)
* Satellite cloud imagery
* NOAA SWPC integration (partial overlap with Sun Engine)

---

# ⚙️ CORE COMPUTATION MODEL

## Inputs

```text
Cloud Cover %
Wind Speed
Humidity
Temperature
Dew Point
Moon Phase
Moon Altitude
Light Pollution
```

---

## Derived Metrics

### 1. Cloud Score

* < 20% → Excellent
* 20–50% → Mixed
* > 50% → Poor

---

### 2. Seeing (Approximation)

Derived from:

* wind speed
* upper atmosphere data

Output:

* Poor / Fair / Good

---

### 3. Transparency (Approximation)

Derived from:

* humidity
* haze
* cloud layering

---

### 4. Moon Interference

* Phase
* Brightness
* Position in sky

---

### 5. Wind Stability

* Telescope usability
* Image stability

---

# 🧠 FINAL OUTPUT MODEL

## `/api/conditions`

```json
{
  "observing_score": "GOOD",
  "confidence": "high",
  "cloud_cover_pct": 12,
  "seeing": "good",
  "transparency": "excellent",
  "moon_interference": "low",
  "wind_mph": 4,
  "summary": "Clear skies, stable atmosphere, minimal moon impact"
}
```

---

# 🧮 SCORING SYSTEM (V1)

## Weighted Logic (Phase 2)

```text
Cloud Cover → 40%
Transparency → 20%
Seeing → 15%
Moon → 15%
Wind → 10%
```

---

## Final Output

```text
EXCELLENT
GOOD
FAIR
POOR
```

---

# 🖥️ UI INTEGRATION

## 🔹 Hero Panel (PRIMARY DRIVER)

Displays:

* Observing Score
* Summary
* Key callouts:

  * “Best night for deep sky”
  * “Moon interference high”

---

## 🔹 Right Context Panel

Displays:

* Conditions breakdown
* Alerts
* Metrics

---

## 🔹 Conditions Module (Grid)

Displays:

* simplified metrics
* quick summary

---

# ⚠️ UI RULES

* No raw data dump
* Always include explanation
* Always include summary
* Must be readable in < 5 seconds

---

# 🔄 SYSTEM BEHAVIOR

## Refresh Frequency

* Every 5–15 minutes

---

## Caching

* Required
* Avoid excessive API calls

---

## Fallback Behavior

If data unavailable:

* Use last known good state
* Degrade gracefully
* Mark confidence as LOW

---

# 🚀 PHASE BREAKDOWN

---

## 🔴 PHASE 2 (REQUIRED — CORE)

### Build:

* Data ingestion (NOAA)
* Basic computation model
* Observing score
* Summary generation

### UI:

* Hero panel integration
* Context panel display
* Conditions module

### Constraints:

* No advanced atmospheric modeling
* No paid APIs
* Keep logic simple but believable

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* Improved seeing model
* Transparency refinement
* Time-based forecasting (tonight timeline)
* Better moon impact modeling

---

## 🟡 PHASE 4+ (ADVANCED)

### Add:

* Astro-specific scoring modes
* Imaging vs visual modes
* Forecast windows (multi-hour planning)
* Integration with astrophotography engine

---

# 🔒 HARD RULES (LOCKED)

1. Must answer “Is tonight worth it?”
2. Must provide explanation
3. Must influence ALL engines
4. Must NOT depend on a single API
5. Must degrade gracefully
6. Must remain simple in Phase 2

---

# 🧠 SUCCESS CRITERIA

The engine is complete when:

* User opens app and immediately understands conditions
* Score matches real-world expectations
* Output is believable
* Other engines respond to conditions

---

# 📌 SUMMARY

The Observing Conditions Engine is:

> **The intelligence layer that transforms data into decisions**

Without it:

* system = data dashboard

With it:

* system = decision support tool

---
