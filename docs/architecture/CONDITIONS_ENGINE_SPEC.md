# 📄 `CONDITIONS_ENGINE_SPEC.md` (AUTHORITATIVE — V2)

---

# 🌌 OBSERVING CONDITIONS ENGINE — V2 (CLEAR SKY INTEGRATED)

## Status: 🔴 REQUIRED — HIGHEST PRIORITY

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE (UPDATED)

Answer:

> “What are the observing conditions right now, and is it worth observing?”

With:

* real astronomy metrics
* transparent reasoning
* trusted observational model

---

# 🔥 CORE PRINCIPLE (UPDATED)

The engine returns:

```text
Astronomy conditions + decision + explanation
```

NOT just a score.

---

# 🧱 ENGINE ARCHITECTURE (NEW)

```text
External Data (NOAA, etc)
        ↓
Atmospheric Processing Layer
        ↓
Astronomy Metrics Layer (ClearSky-aligned)
        ↓
Decision Engine (scoring + interpretation)
        ↓
Scene / UI
```

---

# 🧪 NEW CORE METRICS (LOCKED)

These are FIRST-CLASS outputs:

1. Cloud Cover
* percentage-based
* mapped to sky-state quality

2. Transparency
* Poor → Excellent
* derived from humidity, aerosols, smoke, haze

3. Seeing
* 1/5 → 5/5 scale
* derived from wind, temperature gradients, upper atmosphere

4. Darkness
* limiting magnitude estimate
* derived from moon phase, moon altitude, sun position

5. Smoke
* PM2.5-equivalent impact
* affects transparency

6. Wind
* mph
* usability impact

7. Humidity
* dew risk
* fog formation risk

---

# 🧠 KEY SHIFT

Instead of:

```text
observing_score = GOOD
```

the contract includes explicit astronomy metrics:

```json
{
  "conditions": {
    "cloud_cover": "10%",
    "transparency": "above_average",
    "seeing": "4/5",
    "darkness": "5.5 mag",
    "smoke": "low",
    "wind": "4 mph",
    "humidity": "60%"
  }
}
```

---

# 🧮 DECISION LAYER (SYSTEM VALUE)

The engine interprets ClearSky-style metrics into a decision:

```json
{
  "observing_score": "EXCELLENT",
  "confidence": "high",
  "best_for": ["deep_sky", "planetary"],
  "warnings": ["light dew risk"],
  "summary": "Clear skies, strong transparency, and steady seeing make this an excellent observing night."
}
```

---

# ⚖️ UPDATED SCORING MODEL

ClearSky-weighted interpretation baseline:

* Cloud Cover → HARD GATE
* Transparency → HIGH IMPACT
* Seeing → TARGET-SPECIFIC IMPACT
* Darkness → CRITICAL FOR DSO
* Wind → USABILITY IMPACT
* Smoke → TRANSPARENCY MODIFIER

Example rules:

* cloud > 60% → auto downgrade
* transparency poor → deep-sky discouraged
* seeing excellent → planetary boost
* darkness low → deep-sky penalty

---

# 🧠 TARGET-SPECIFIC RECOMMENDATIONS

The engine supports target suitability output:

```json
{
  "best_targets": {
    "planets": "excellent",
    "deep_sky": "good",
    "astrophotography": "fair"
  }
}
```

---

# 🖥️ UI IMPACT

Hero panel:

* quality summary (e.g., stars/bar + label)
* concise interpretation (clear/steady/dark)
* best-for callouts
* warnings

Context panel:

* cloud cover
* transparency
* seeing
* darkness
* wind
* humidity
* smoke (when available)

---

# 🔄 PHASE ALIGNMENT

## Phase 2 (NOW)

Keep existing core behavior and add:

* transparency model
* seeing model
* darkness model

## Phase 3

* refine metric accuracy
* improve atmospheric modeling

## Phase 4

* NOAA radar integration
* smoke-model enrichment
* tighter real-time refresh behavior

---

# 🚨 IMPORTANT RULES

* Do NOT scrape ClearSky directly
* Do NOT depend on ClearSky web infrastructure
* Reproduce the model behavior using Astronomy Hub provider inputs and normalization

---

# 🔒 HARD RULES (LOCKED)

1. Must answer “Is tonight worth it?”
2. Must provide explanation
3. Must influence cross-engine relevance where applicable
4. Must not depend on a single provider
5. Must degrade gracefully
6. Must remain Phase-appropriate (no future-phase leakage)

---

# 🧠 SUCCESS CRITERIA

The engine is complete when:

* user immediately understands observing quality
* metrics and decision are coherent and believable
* output supports target-specific recommendation
* downstream engine prioritization can consume the conditions decision safely

---

# 📌 SUMMARY

The Observing Conditions Engine is:

> The intelligence layer that transforms atmospheric/astronomy context into actionable observing decisions.

