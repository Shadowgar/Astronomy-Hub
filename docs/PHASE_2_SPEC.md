# 📄 `PHASE_2_SPEC.md`

This phase expands Astronomy Hub from a single unified sky view into a **multi-engine exploration system** while preserving all Phase 1 guarantees.

---

# 🌌 ASTRONOMY HUB — PHASE 2 SPEC (AUTHORITATIVE)

---

# 0. PURPOSE

Phase 2 expands the system from:

> “What is above me?”

into:

> “Let me explore each domain of Earth, Sun, satellites, and space.”

---

# 1. 🎯 PHASE GOAL

Deliver a system where a user can:

* switch between engines (Earth, Sun, Satellites, etc.)
* explore each engine independently
* apply filters within each engine
* interact with objects in each domain
* maintain the Phase 1 “Above Me” experience

---

# 2. 🧠 CORE SHIFT FROM PHASE 1

---

## Phase 1

* single scope: Above Me
* limited filters
* unified scene

---

## Phase 2

* multiple scopes
* independent engines
* filter-driven exploration
* multiple scene types

---

# 3. 🎛️ SCOPE SYSTEM (MANDATORY)

---

## 3.1 Supported Scopes

```text id="d09j42"
Above Me       (Phase 1 retained)
Earth          (NEW)
Sun            (NEW)
Satellites     (NEW)
Flights        (NEW - first introduced in Phase 2)
Solar System   (NEW - simplified)
Deep Sky       (NEW - limited)
```

Flight tracking is excluded from Phase 1.
It enters the product for the first time in the dedicated Flights scope in Phase 2.

---

## 3.2 Scope Behavior

Each scope must:

* activate its corresponding engine
* load a scoped scene
* expose available filters

---

# 4. 🧠 ENGINE ACTIVATION

---

## 4.1 Rule

```text id="7b82xv"
Only one engine is active at a time
(except Above Me merge mode)
```

---

## 4.2 Engine Entry Points

User must be able to:

* switch engines via UI
* select filters per engine
* return to main command center

---

# 5. 🔍 FILTER SYSTEM (MANDATORY)

---

## 5.1 Rule

```text id="7xek4x"
Each engine must support multiple filters
but only one filter is active at a time
```

---

## 5.2 Required Filters by Engine

---

### Earth Engine

Must support:

* weather
* earthquakes
* aurora / geomagnetic
* meteor/fireball events

---

### Solar Engine

Must support:

* sunspots
* solar flares
* solar activity summary

---

### Satellite Engine

Must support:

* visible passes
* Starlink
* general tracked satellites

---

### Flight Engine

Must support:

* global flights
* above-horizon flights

---

### Solar System Engine (Phase 2 Limited)

Must support:

* planets only
* basic orbital layout (non-immersive acceptable)

---

### Deep Sky Engine (Phase 2 Limited)

Must support:

* visible tonight
* major objects (Messier-level)

---

# 6. 🖥️ ENGINE SCENES (MANDATORY)

---

Each engine must render a **distinct scene**.

---

## 6.1 Earth Scene

Must include:

* 2D map (minimum)
* events plotted based on filter
* selectable objects

---

## 6.2 Solar Scene

Must include:

* solar map or image
* active regions
* event markers

---

## 6.3 Satellite Scene

Must include:

* Earth representation
* satellite positions
* selectable objects

---

## 6.4 Flight Scene

Must include:

* flight markers
* optional map
* selectable aircraft

---

## 6.5 Solar System Scene

Must include:

* simplified layout of planets
* relative positioning
* selectable planets

---

## 6.6 Deep Sky Scene

Must include:

* object list or simple sky layout
* selectable deep sky objects

---

# 7. 🔍 OBJECT INTERACTION (EXPANDED)

---

## 7.1 Rule

All Phase 1 interaction rules remain.

---

## 7.2 New Requirements

Objects must now include:

* engine-specific data
* filter-specific context
* cross-engine links

---

## 7.3 Detail View Expansion

Detail views must now support:

* more structured data
* additional media
* expanded related objects
* deeper linking

---

# 8. 🔗 CROSS-ENGINE LINKING (NEW)

---

## 8.1 Rule

```text id="qvubc7"
Objects must be linkable across engines
```

---

## 8.2 Examples

* satellite → linked to launch event
* planet → linked to missions
* solar flare → linked to Earth aurora

---

# 9. ⚙️ BACKEND REQUIREMENTS

---

## 9.1 New Endpoints

Must support:

```text id="v1x0na"
/api/scene/{scope}
/api/engine/{engine}?filter={filter}
/api/object/{id}
```

---

## 9.2 Backend Responsibilities

* support engine-specific queries
* support filter-based queries
* maintain normalized contracts
* cache results

---

## 9.3 Backend Constraints

Must NOT:

* compute unnecessary engines
* return unbounded datasets
* mix engine responsibilities

---

# 10. 🖥️ FRONTEND REQUIREMENTS

---

## 10.1 Must Support

* scope switching
* engine switching
* filter selection
* multiple scene types

---

## 10.2 Rendering

Frontend must support:

* map rendering
* basic globe (optional)
* simple 3D (optional)
* list-based fallback

---

## 10.3 Interaction

User must be able to:

* switch filters instantly
* click objects
* navigate back

---

# 11. 📊 DATA REQUIREMENTS

---

Each engine must provide:

* scene contract
* object summaries
* object detail

---

## 11.1 Data Constraints

* limited object count
* scoped results only
* relevance-based sorting

---

# 12. 🧪 VALIDATION CRITERIA (STRICT)

---

Phase 2 is complete ONLY IF:

---

## 12.1 System Behavior

* user can switch scopes
* each scope loads correct engine
* filters change scene data

---

## 12.2 Engine Functionality

* each engine renders its scene
* objects are clickable
* detail views load correctly

---

## 12.3 Cross-System Integrity

* object routing works
* data is consistent
* no engine conflicts

---

## 12.4 Performance

* fast scene switching
* no full-system computation
* stable rendering

---

# 13. 🚫 FAILURE CONDITIONS

---

Phase 2 is NOT complete if:

* engines are not independent
* filters do not change output
* scenes are empty or broken
* object routing fails
* UI becomes cluttered

---

# 14. 🔥 FINAL STATEMENT

```text id="1v52r4"
Phase 2 transforms Astronomy Hub into a multi-engine,
filter-driven exploration system while preserving the
core “Above Me” command center experience.
```

---

# ✔️ OUTCOME

After Phase 2:

* user can explore multiple domains
* system feels expansive
* architecture is proven
* foundation supports future scale

---

## Next Step

👉 `PHASE_2_5_SPEC.md`

This is where we:

* stabilize backend
* introduce FastAPI properly
* enforce contracts in runtime
* prepare for large-scale expansion

---
