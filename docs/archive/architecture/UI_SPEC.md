# 📄 `UI_SPEC.md` (AUTHORITATIVE — V1)

---

# 🧭 ASTRONOMY HUB UI — SPECIFICATION

## Status: 🔴 REQUIRED — CORE SYSTEM

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The UI is the **primary interface layer** of Astronomy Hub.

It must answer:

> **“What is in the sky right now, what matters, and what do I want to explore?”**

---

# 🔥 CORE PRINCIPLE

> The UI is a **structured command center (hub)**
> NOT a dashboard
> NOT a recommendation-only system

---

# 🧱 UI ARCHITECTURE MODEL

```text
Top Bar
   ↓
Main Scene (Above Me)
   ↓
Right Context Panel
   ↓
Now Above Me
   ↓
Engine Modules Grid
   ↓
Detail Panel (interaction layer)
```

---

# 🔷 1. TOP CONTROL BAR

## Purpose:

Control system context

---

## Elements:

```text
Scope | Engine | Time | Location | Mode
```

---

## Phase 2 Behavior:

* Scope → default: “Above Me”
* Engine → filter only (does NOT change layout)
* Time → locked to “Now”
* Location → ORAS only
* Mode → UI theme only

---

## Rules:

* must remain simple
* must not break layout
* must not expose advanced controls yet

---

# 🔷 2. MAIN SCENE AREA (“ABOVE ME”)

## Purpose:

Display **current sky context**

---

## Content:

* mixed objects:

  * satellites
  * planets
  * deep sky
  * flights (optional)

---

## Behavior:

* top-ranked items only
* max 5–7 objects
* must include reason

---

## Example:

```text
ISS — overhead, very bright
Jupiter — high in SE
M13 — excellent conditions
```

---

# 🔷 3. RIGHT CONTEXT PANEL

## Purpose:

Display **system state and environment**

---

## Content:

* Observing Conditions (primary)
* Alerts
* Summary

---

## Behavior:

* always visible
* supports quick scan
* no scrolling overload

---

# 🔷 4. “NOW ABOVE ME” SECTION

## Purpose:

Provide **live snapshot of sky**

---

## Content:

* top objects across engines

---

## Rules:

* max 5–7 items
* must be ranked
* must include reason

---

# 🔷 5. ENGINE MODULE GRID

## Purpose:

Allow exploration of all engines

---

## Modules (ALL REQUIRED):

* Solar System
* Deep Sky
* Satellites
* Sun
* Flights
* Conditions
* Events

---

## Module Structure:

```text
Title
Item List (3–10 items)
Short reason per item
```

---

## Rules:

* consistent layout across all modules
* no module-specific UI variations
* no oversized modules

---

# 🔷 6. DETAIL PANEL SYSTEM (CRITICAL)

## Purpose:

Display **full object detail without leaving hub**

---

## Behavior:

```text
Click object → panel opens (right side)
Click another object → panel updates
Hub remains visible
```

---

## Structure:

```text
HEADER
- Name
- Type

WHY IT MATTERS (ALWAYS FIRST)

----------------------------

[Overview]
[Sky Position]
[Images]
[Data]
[Events / News (Phase 3+)]
```

---

## Rules:

* must be reusable across all engines
* must not navigate away from hub
* must not block entire UI

---

# 🔷 7. SKY / VISUAL MODES

## Phase 2:

* simple directional guidance
* no 3D
* no immersive view

---

## Phase 3+:

* sky overlay
* horizon alignment
* Google Maps / visual alignment
* 3D models

---

# 🔷 8. UI STATE MODEL

---

## States:

```text
HUB VIEW (default)

DETAIL VIEW (panel open)

FILTERED VIEW (engine filter active)
```

---

## Rules:

* hub always persists
* transitions must be fast
* no full reload navigation

---

# 🔷 9. DATA FLOW (UI SIDE)

```text
API
 ↓
Modules
 ↓
User Click
 ↓
Detail Panel
```

---

# 🔷 10. DESIGN RULES (LOCKED)

---

## Density Rules:

* max 5–10 items per module
* max 5–7 in “Now Above Me”

---

## Consistency Rules:

* all modules use same layout
* all items show:

  * name
  * reason

---

## Clarity Rules:

* must be scannable in < 10 seconds
* must avoid clutter
* must prioritize readability

---

## Interaction Rules:

* no hidden navigation complexity
* no deep nesting
* click → immediate response

---

# 🔷 11. PHASE BREAKDOWN

---

## 🔴 PHASE 2 (CORE)

### Build:

* full layout (match diagram)
* module grid
* context panel
* detail panel (UI only → then wired)
* static/mock data integration

---

### Constraints:

* no advanced visualization
* no heavy animation
* no complex filtering

---

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* sky visualization
* interactive overlays
* improved detail views
* comparison tools

---

## 🟡 PHASE 4+

### Add:

* immersive UI
* AR / 3D features
* advanced personalization

---

# 🔒 HARD RULES (LOCKED)

1. Hub must remain visible at all times
2. Detail must not replace hub
3. All engines must use same UI system
4. UI must match master diagram
5. No engine-specific UI fragmentation
6. Must support fast scanning

---

# 🧠 SUCCESS CRITERIA

The UI is complete when:

* matches diagram visually
* is usable without explanation
* allows exploration without confusion
* supports all engines cleanly

---

# 📌 SUMMARY

The UI is:

> **A structured command center that exposes all engines while enabling deep exploration through a unified detail system**

---