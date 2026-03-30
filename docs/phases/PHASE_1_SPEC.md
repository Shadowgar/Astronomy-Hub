# 🌌 PHASE 1 SPEC — COMMAND CENTER (AUTHORITATIVE — DIAGRAM ENFORCED)

---

# 0. PURPOSE

This document defines:

```text
The exact system behavior, structure, and constraints for Phase 1.
```

Phase 1 defines the **minimum complete product surface** of Astronomy Hub.

This document is **authoritative**.

---

# 1. SYSTEM LAW (NON-NEGOTIABLE)

The system MUST operate through:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## HARD RULE

```text
If any implementation bypasses this pipeline → INVALID SYSTEM
```

---

# 2. PHASE 1 OBJECTIVE

Phase 1 MUST deliver:

```text
A scene-first command center answering:
“What is above me right now, and what should I look at?”
```

---

## REQUIRED OUTCOME

User MUST be able to determine:

* Is observing worthwhile?
* What objects are visible?
* What should be prioritized?
* What events/passes matter now?

---

## FAILURE CONDITION

* System behaves like a data dashboard → INVALID

---

# 3. CANONICAL RUNTIME (LOCKED)

---

## REQUIRED

The system MUST run via:

```text
Docker Compose
```

---

## REQUIRED SERVICES

* frontend (React/Vite/TypeScript)
* backend (FastAPI)
* postgres/postgis
* redis

---

## RULE

```text
Docker runtime is the ONLY authoritative runtime.
```

---

## FAILURE CONDITIONS

* system cannot run in Docker → INVALID
* system only works outside Docker → INVALID

---

# 4. SCOPE MODEL (PHASE 1)

---

## ACTIVE SCOPE

```text
Above Me (DEFAULT AND ONLY ACTIVE PHASE 1 SCOPE)
```

---

## RULES

* Scope MUST always be active
* Scope determines engine participation
* Phase 1 MUST NOT expose multi-scope UI switching

---

## FAILURE CONDITIONS

* multiple scopes exposed → INVALID

---

# 5. ENGINE MODEL (PHASE 1)

---

## ACTIVE ENGINES (PHASE 1)

Allowed engines:

* Satellite Engine
* Solar System Engine (planets only)
* Deep Sky Engine (visible targets only)
* Event/Alert Engine
* Earth Conditions Engine

---

## ENGINE RULES

* engines MUST NOT render UI
* engines MUST return structured data only
* engines MUST be independent
* engines MUST NOT overlap domains

---

## FAILURE CONDITIONS

* engine controls UI → INVALID
* engine returns mixed-domain data → INVALID

---

# 6. FILTER MODEL (PHASE 1)

---

## REQUIRED

Filters MUST:

* operate within engine or scene assembly
* restrict data (never full dataset)
* be deterministic

---

## PHASE 1 FILTERS

* above horizon
* visible tonight
* active events
* observing relevance

---

## FAILURE CONDITIONS

* unfiltered datasets returned → INVALID

---

# 7. SCENE MODEL (CORE SYSTEM)

---

## REQUIRED

The Scene is the ONLY visible data surface.

Scene MUST:

* be assembled by backend
* merge multiple engines
* be ranked
* contain limited objects only

---

## SCENE STRUCTURE

Each object MUST include:

* id
* name
* type
* engine
* summary
* position context
* detail route

---

## FAILURE CONDITIONS

* UI builds scene → INVALID
* scene is not merged → INVALID
* scene not ranked → INVALID

---

# 8. “ABOVE ME” MERGE (CRITICAL)

---

## REQUIRED PROCESS

```text
Engine outputs → Filter → Merge → Rank → Annotate → Scene
```

---

## REQUIRED BEHAVIOR

Scene MUST:

* include multiple engine types
* include ONLY above-horizon objects
* rank by relevance
* attach metadata and routing

---

## FAILURE CONDITIONS

* single-engine scene → INVALID
* raw engine output exposed → INVALID

---

# 9. UI ARCHITECTURE (COMMAND CENTER)

---

## REQUIRED LAYOUT (STRICT)

The main screen MUST contain:

```text
1. Command Bar
2. Primary Scene (dominant)
3. Live Decision Panel (right-side or secondary)
4. Supporting Panels
```

---

## REQUIRED COMPONENTS

### Command Bar

* scope indicator (Above Me)
* time selector (Now)
* location indicator (ORAS/default or override)
* command actions

---

### Primary Scene

* AboveMeScene
* clickable objects
* visually dominant

---

### Live Decision Panel

* observing score
* best target
* next pass/event
* short summary

---

### Supporting Panels

* visible objects list
* events/alerts
* conditions

---

## UI RULES

* equal-weight grid is FORBIDDEN
* scene MUST dominate visually
* panels MUST be subordinate

---

## FAILURE CONDITIONS

* grid layout exists → INVALID
* scene not dominant → INVALID

---

# 10. INTERACTION FLOW

---

## REQUIRED FLOW

```text
Scene → Object → Detail → Return
```

---

## RULES

* object MUST be clickable
* detail MUST load deterministically
* return MUST restore state

---

## FAILURE CONDITIONS

* detail breaks scene → INVALID

---

# 11. OBJECT OWNERSHIP

---

## REQUIRED

Every object MUST include:

* engine owner
* detail route

---

## RULE

```text
Detail MUST be resolved through owning engine.
```

---

## FAILURE CONDITIONS

* object has no owner → INVALID
* routing ambiguous → INVALID

---

# 12. DATA LAYER (FE2 ENFORCED)

---

## REQUIRED

* TanStack Query ONLY
* centralized API layer
* no direct fetch in UI

---

## STRICT RULE

```text
UI MUST NOT perform:
- payload.data fallback
- raw response parsing
```

---

## FAILURE CONDITIONS

* fallback logic in component → INVALID

---

# 13. STATE LAYER (FE3 ENFORCED)

---

## REQUIRED

* Zustand = UI/global state
* Query = server data
* React = local state

---

## FAILURE CONDITIONS

* mixed ownership → INVALID

---

# 14. VISUAL SYSTEM (FE4–FE5)

---

## REQUIRED

* token-based styling
* theme system (light/dark/red)
* responsive hierarchy

---

## RULE

```text
UI must guide attention, not present equal choices.
```

---

## FAILURE CONDITIONS

* hardcoded styling dominates → INVALID

---

# 15. THREE.JS FOUNDATION (FE7)

---

## REQUIRED

* bounded starfield / sky rendering
* isolated rendering boundary

---

## FAILURE CONDITIONS

* rendering leaks into UI → INVALID

---

# 16. CESIUM FOUNDATION (FE8)

---

## REQUIRED

* bounded Cesium component exists
* not driving main UI

---

## FAILURE CONDITIONS

* Cesium controls command center → INVALID

---

# 17. MEDIA SYSTEM (FE9)

---

## REQUIRED

* AssetImage exists
* standardized media handling

---

## FAILURE CONDITIONS

* direct `<img>` scattered → INVALID

---

# 18. TESTING (FE10)

---

## REQUIRED

Must pass:

```bash
npm run test
npm run build
npm run type-check
npm run test:e2e
```

---

## REQUIRED COVERAGE

* scene load
* object detail flow
* navigation
* responsive layout
* error fallback

---

## FAILURE CONDITIONS

* missing E2E → INVALID

---

# 19. BACKEND REQUIREMENTS (BE-ALIGNED)

---

## REQUIRED

* FastAPI only runtime
* routes under `/api/v1`
* services extracted
* contracts stable

---

## REQUIRED ENDPOINTS

* `/api/v1/scene/above-me`
* `/api/v1/object/{id}`

---

## FAILURE CONDITIONS

* server.py used → INVALID

---

# 20. FINAL COMPLETION RULE

---

Phase 1 is COMPLETE ONLY IF:

```text
- Docker runtime works
- pipeline is enforced
- scene is dominant
- scene → object → detail works
- contracts enforced
- FE + BE align with execution docs
- testing verifies core flows
```

---

# 🔥 FINAL STATEMENT

```text
Phase 1 delivers a deterministic, scene-first astronomy system
built on a strict pipeline, with clear object interaction and zero ambiguity.
```

---

