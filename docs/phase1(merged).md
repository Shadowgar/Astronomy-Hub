# 🌌 ASTRONOMY HUB — PHASE 1 MASTER SPEC (MERGED)

## Phase Name

Local Sky MVP

## Primary Objective

Provide a calm, location-aware, field-ready astronomy dashboard that tells an ORAS member:

> “Is tonight worth observing, and what should I look at right now?”

---

# 1. Purpose of Phase 1

Phase 1 is NOT the full system.

Phase 1 is:

* fast
* focused
* practical
* usable in the field

User flow:

* open ORAS member dashboard
* click Astronomy Hub
* confirm location
* immediately understand:

  * observing conditions
  * what to look at
  * upcoming passes/events

---

## 1.1 Core Interaction Loop (LOCKED)

All features must support this loop:

1. Open Astronomy Hub
2. Confirm location
3. See observing conditions
4. See recommended targets
5. See passes and alerts
6. Drill deeper if desired

If a feature does not support this loop → it does NOT belong in Phase 1.

---

# 2. What Phase 1 Solves

ORAS currently spreads data across:

* tools (weather, sky charts, light pollution)
* resources (guides, news, materials)

Phase 1 creates:

> A single decision layer for “tonight, here, now”

---

# 3. Success Definition

A user can answer in under 60 seconds:

* Is tonight good?
* What should I look at?
* When should I go outside?
* What satellites/events matter?
* What do I check next?

---

# 4. Scope Boundaries

## INCLUDED

* Member dashboard entry
* Location system
* Conditions summary
* Recommendations
* Satellite passes
* Alerts/events
* Moon summary
* Drill-down pages
* Lightweight backend

## EXCLUDED (LOCKED)

* globe view
* Cesium / 3D Earth
* aircraft tracking
* AR
* observatory networks
* solar deep dashboards
* PostGIS systems
* large-scale ingestion pipelines
* advanced astrophotography tools

---

# 5. User Types

### Casual Member

Simple answers, quick decisions

### Field Observer

Timing, conditions, efficiency

### Beginner

Guidance, clarity, low jargon

---

# 6. UX Philosophy

* show only what matters
* rank by usefulness
* hide depth behind clicks
* avoid overload
* answer “what matters now”

---

# 7. Page Structure

## 7.1 Entry

Member Hub → Astronomy Hub

---

## 7.2 Dashboard Layout

```
+---------------------------------------------------------+
| Astronomy Hub | Location | Mode Toggle (Day/Night/Red) |
+---------------------------------------------------------+
| Observing Score + Conditions                           |
| Tonight’s Best Targets                                 |
| Alerts / Notable Events                                |
| Upcoming Passes                                        |
+---------------------------------------------------------+
| [ Show Me What To Look At ]                            |
+---------------------------------------------------------+
| Explore: Sky | Satellites | Conditions | Events        |
+---------------------------------------------------------+
```

---

# 8. Information Architecture

## Dashboard (Summary Only)

* conditions
* targets
* alerts
* passes

## Sky Tonight

* objects
* planets
* constellations
* viewing windows

## Satellites

* passes
* direction
* elevation
* details

## Conditions

* cloud
* darkness
* moon interference
* score

## Events

* meteor showers
* eclipses
* alerts

## Moon & Planets

* phase
* rise/set
* visibility

---

# 9. Feature Definitions

## 9.1 Location Model

* ORAS Observatory
* Current location
* Saved locations

---

## 9.2 Conditions Card

Includes:

* cloud cover
* darkness window
* moon phase

### Observing Score (REQUIRED)

* GOOD
* FAIR
* POOR

With explanation.

---

## 9.3 Targets Card (EXPANDED)

Each target MUST include:

* name
* category
* direction
* elevation band
* best viewing time
* why it matters
* difficulty

---

## 9.4 Satellite Passes

Max 5 entries:

* name
* time
* direction
* elevation
* visibility

---

## 9.5 Alerts

Max 3 entries:

* event type
* summary
* relevance

---

## 9.6 Mini Sky Snapshot

* compass directions
* simplified markers
* no heavy rendering

---

## 9.7 Time Context System

Global toggle:

* Now
* Tonight
* Next 24h

ALL data must respect this.

---

## 9.8 UI Density Limits (LOCKED)

* targets: max 5
* passes: max 5
* alerts: max 3
* no scrollable cards

---

## 9.9 Guided Action

Button:

```
[ Show Me What To Look At ]
```

Outputs top 3–5 prioritized items.

---

# 10. Backend Strategy

## Goal

* fetch
* normalize
* cache
* serve JSON

---

## Architecture

```
APIs → Fetch Jobs → Normalize → Cache → REST → Frontend
```

---

## 10.4 Failure Handling

* never break UI
* use cached data
* show “last updated”
* graceful fallback only

---

# 11. Frontend Strategy

## 11.1 Integration

* WordPress plugin shell
* modular UI

---

## 11.2 Priorities

* fast
* mobile
* clean
* reusable

---

## 11.3 Components

* cards
* lists
* toggles
* navigation

---

## 11.4 UI Mode System (CRITICAL)

Modes:

* Day
* Night
* Red

Red Mode:

* red-only colors
* low brightness
* astronomy-safe

---

# 12. Data Categories

Required:

* conditions
* moon
* satellites
* events
* targets

---

# 13. Data Contracts

Must be strict JSON schemas.

---

# 14. Recommendation Engine

Rules-based only:

* darkness
* moon
* clouds
* timing

Outputs:

* top 3–7 targets

---

# 15. ORAS Integration Layer

Include:

* ORAS featured target
* beginner guidance
* curated notes

---

# 16. Risks

* overload → limit UI
* backend creep → strict scope
* weak usefulness → prioritize decisions
* AI drift → strict contracts

---

# 17. Validation Checklist

Complete when:

* loads in member hub
* location works
* dashboard is clear
* targets useful
* passes accurate
* alerts clean
* mobile works
* no overload
* works with cached data

---

# 18. Required Documents

You must create:

* MASTER_PLAN.md
* PHASE_1_SPEC.md (this file)
* PHASE_1_ACCEPTANCE.md
* ARCHITECTURE.md
* DATA_CONTRACTS.md
* UI_STRUCTURE.md
* CODING_RULES.md
* VALIDATION.md
* CONTINUITY.md

---

# 19. Build Order

1. structure
2. contracts
3. mock data
4. UI shell
5. modules
6. backend hookup
7. testing

---

## 19.1 Mock-First Rule (LOCKED)

NO live APIs until UI is complete.

---

# 20. Final Statement

Phase 1 delivers:

> A field-ready astronomy assistant that tells users exactly what to do tonight.

---

# ✅ DONE