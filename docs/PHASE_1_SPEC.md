# 📄 `PHASE_1_SPEC.md`

This is no longer a “minimal MVP.”

This defines a **real, usable product slice** that delivers immediate value and aligns with the full system vision.

---

# 🌌 ASTRONOMY HUB — PHASE 1 SPEC (AUTHORITATIVE)

---

# 0. PURPOSE

Phase 1 delivers the first **complete, usable product experience**:

> A **Live Astronomy Command Center** answering:
> “What is happening above me right now, and what should I look at?”

---

# 1. 🎯 PHASE GOAL

Deliver a system where a user can:

* open the app
* immediately understand the sky above them
* identify objects in the sky
* click any object and understand what it is
* receive actionable observing guidance

---

# 2. 🧠 CORE EXPERIENCE

---

## 2.1 Primary Mode

```text
Scope: Above Me
Engine: Unified Main
Filter: Visible Sky Objects
```

---

## 2.2 User Journey

```text
Open app
  → See sky-based command center
    → See objects above them
      → Click object
        → Learn everything about it
```

---

# 3. 🖥️ MAIN SCREEN REQUIREMENTS

---

## 3.1 Primary Mounted Surface (MANDATORY)

Must display:

* command-center module grid shell as the primary mounted surface (conditions, targets, alerts/events, passes, moon/news)
* scene-backed sky context from the canonical Above Me scene source
* objects above horizon only
* categorized objects:

  * satellites
  * planets
  * deep sky objects

---

## 3.2 Object Representation

Each object must include:

* icon/type
* name
* position (approximate)
* visibility indicator
* click interaction

---

## 3.3 Live Briefing Panel

Must display:

* observing score (simple)
* top recommended target
* next major event (e.g., satellite pass)
* moon impact
* current sky condition summary

---

## 3.4 “Now Above Me” Panel

Must include:

* list of visible objects
* categorized
* sorted by relevance

---

## 3.5 Events Panel

Must include:

* active or near-term events:

  * satellite passes
  * meteor activity
  * notable alignments

---

## 3.6 News Panel (Light)

Must include:

* 3–5 curated items
* tied to objects or events

---

# 4. 🔍 OBJECT INTERACTION (MANDATORY)

---

## 4.1 Click Behavior

Clicking any object must:

```text
Route → owning engine → load detail view
```

---

## 4.2 Required Object Types

Must support:

* satellite
* planet
* deep sky object

---

## 4.3 Detail View Requirements

Each object must show:

* name and type
* explanation (plain language)
* why it matters now
* visibility guidance
* basic data
* at least one image
* related news (if available)

---

# 5. 🔗 ENGINE INTEGRATION (PHASE 1 LIMIT)

---

Phase 1 uses **limited filters from each engine**:

---

## 5.1 Satellite Engine

* visible passes filter only

---

## 5.2 Solar System Engine

* visible planets only

---

## 5.3 Deep Sky Engine

* visible tonight filter only

---

## 5.4 Earth Engine

* observing conditions only:

  * cloud cover (simplified)
  * moon phase
  * basic visibility impact

---

## ❗ NOT INCLUDED IN PHASE 1

* flight engine
* flights / aircraft tracking
* full Earth map
* solar engine
* full solar system view
* deep data exploration
* multi-filter systems
* global scope

---

# 6. 🧠 SCENE RULES

---

## 6.1 Scope Constraint

```text
Only Above Me scope exists in Phase 1
```

---

## 6.2 Filter Constraint

```text
Each engine contributes only one filter
```

---

## 6.3 Scene Constraint

* only above-horizon objects
* limited object count
* ranked by relevance

---

# 7. ⚙️ BACKEND REQUIREMENTS

---

Backend must:

* provide a unified scene endpoint:

  ```text
  /api/scene/above-me
  ```
* treat `/api/scene/above-me` as the canonical scene source that feeds the frontend mounted module-grid shell
* normalize all engine outputs
* merge data into a single scene contract
* provide object detail endpoints:

  ```text
  /api/object/{id}
  ```

---

## Backend MUST NOT:

* expose raw APIs
* compute unnecessary data
* return full datasets

---

# 8. 🖥️ FRONTEND REQUIREMENTS

---

Frontend must:

* render the command-center primary surface (mounted module grid shell)
* consume scene-backed data from `/api/scene/above-me`
* handle object interaction
* display panels (briefing, events, news)
* manage state (scope, filter)
* progressively load object details

---

## Rendering Requirements

* simple sky layout (no full 3D required yet)
* directional hints acceptable
* approximate positioning acceptable

---

# 9. 📊 DATA REQUIREMENTS

---

Must include:

* object ID
* name
* type
* engine
* visibility
* position (approximate)
* summary

---

Detail must include:

* explanation
* media
* related data

---

# 10. 🧪 VALIDATION CRITERIA (STRICT)

---

Phase 1 is complete ONLY IF:

---

## 10.1 Core Functionality

* app loads without errors
* primary mounted surface reflects objects above user from scene-backed data
* objects are clickable
* detail pages load

---

## 10.2 Product Experience

* user can identify objects in the sky
* user understands what they are seeing
* user can decide what to observe

---

## 10.3 Performance

* fast load (<2–3 seconds)
* no excessive data load
* responsive interaction

---

## 10.4 UI Quality

* no blank screens
* no placeholder-only components
* no debug UI
* clear hierarchy

---

# 11. 🚫 FAILURE CONDITIONS

---

Phase 1 is NOT complete if:

* UI is empty or minimal
* objects cannot be identified
* detail views are missing
* data is inconsistent
* system behaves like a mock/demo

---

# 12. 🔥 FINAL STATEMENT

```text
Phase 1 delivers a real, usable astronomy command center
focused on “What is above me right now”
with full object interaction and meaningful output.
```

---

# ✔️ OUTCOME

After Phase 1:

* the system is useful
* the system is understandable
* the system reflects the final vision
* the system has a stable foundation

---

## Next Step

👉 `PHASE_2_SPEC.md`

This is where we expand into:

* full engine exploration
* Earth / Sun / Satellite / Flight systems
* filter expansion
* real visual systems

---
