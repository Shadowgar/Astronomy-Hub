# PHASE_FE_EXECUTION.md

## 1. PURPOSE

This document defines the **exact execution steps** for Frontend Engineering (FE).

This document is authoritative.

* Follow steps in order
* Do not skip steps
* Do not combine steps
* Do not expand scope
* Do not introduce new tech

---

## 2. GLOBAL RULES

1. Only one FE step is active at a time
2. Each step must meet completion criteria before continuing
3. If a step fails, fix it before proceeding
4. Do not modify unrelated files
5. Do not introduce new architecture decisions
6. Frontend MUST consume backend contracts as defined
7. Frontend MUST NOT invent backend behavior
8. Frontend MUST NOT bypass the approved data layer

---

## 3. FE1 — FRONTEND STACK FOUNDATION

### Step FE1.1 — Confirm Frontend Runtime

Frontend runtime is locked to:

```text id="fe1p1"
React
Vite
TypeScript
```

Rules:

* React is the only frontend framework
* Vite is the only frontend build tool
* All new code MUST be TypeScript
* Existing JavaScript may remain temporarily only during migration

---

### Step FE1.2 — Create Canonical Frontend Structure

Frontend MUST use the following structure:

```text id="fe1p2"
frontend/src/
  app/
  pages/
  components/
  features/
  lib/
  state/
  routes/
  styles/
  types/
```

Rules:

* `app/` contains root app assembly
* `pages/` contains route-level screens
* `components/` contains shared presentational components
* `features/` contains domain-specific frontend modules
* `lib/` contains API helpers and shared utilities
* `state/` contains Zustand stores
* `routes/` contains router definitions
* `styles/` contains token/theme files
* `types/` contains shared TypeScript contracts

---

### Step FE1.3 — Eliminate Ad Hoc Routing

Rules:

* Manual pathname checks are forbidden
* React Router must become the only routing method

Completion:

* no route logic exists in `App` other than router mount
* no manual `window.location.pathname` branching remains

---

## 4. FE2 — DATA LAYER

### Step FE2.1 — Install and Configure TanStack Query

TanStack Query is the only approved server-state system.

Rules:

* all API calls MUST go through query hooks or query client patterns
* direct `fetch()` inside UI components is forbidden

---

### Step FE2.2 — Create API Client Layer

Create:

```text id="fe2p1"
frontend/src/lib/api/
```

Must include:

* base API client
* typed request helpers
* error handling helpers
* request ID propagation support if available

Rules:

* API URLs must be centralized
* no hardcoded endpoint paths inside UI components

---

### Step FE2.3 — Create Query Modules

Each major backend domain MUST have query modules, such as:

```text id="fe2p2"
conditions
scene
objects
targets
passes
alerts
scopes
location
assets
```

Rules:

* each domain query must be isolated
* query keys must be explicit and deterministic

Completion:

* all frontend data access flows through TanStack Query

---

## 5. FE3 — STATE LAYER

### Step FE3.1 — Install and Configure Zustand

Zustand is the only approved global UI state layer.

---

### Step FE3.2 — Define Global State Domains

Global state MUST cover:

* active scope
* active engine
* active filter
* selected object
* active scene state
* display mode/theme
* local UI toggles
* current location state

Rules:

* global state MUST NOT be handled by deep prop chains
* global state MUST NOT be duplicated across components

---

### Step FE3.3 — Remove Mixed State Patterns

Rules:

* route state, query state, and UI state must be clearly separated
* Zustand handles UI/app state
* TanStack Query handles server data
* React local state handles component-local temporary state only

Completion:

* state ownership is explicit
* no duplicated ownership exists

---

## 6. FE4 — DESIGN TOKEN AND THEME SYSTEM

### Step FE4.1 — Create Token System

Create token definitions for:

* spacing
* typography
* color
* radius
* border
* depth/shadow
* z-index
* motion duration
* density

Rules:

* hardcoded styling values are forbidden in final implementation
* all shared visual values must come from tokens

---

### Step FE4.2 — Create Theme System

Approved themes:

```text id="fe4p1"
light
dark
red
```

Rules:

* all themes must be token-driven
* theme switching must not require component-specific hacks
* theme behavior must be globally applied

---

### Step FE4.3 — Create Core UI Primitives

Core primitives MUST include:

* AppShell
* CommandBar
* Panel
* SectionHeader
* StatusBadge
* DataRow
* EmptyState
* ErrorState
* LoadingState

Rules:

* feature UIs must compose from primitives
* duplicated layout/card systems are forbidden

Completion:

* shared UI foundation exists
* repeated UI patterns are standardized

---

## 7. FE5 — COMMAND CENTER SHELL

### Step FE5.1 — Replace Equal-Weight Dashboard Structure

The main screen MUST contain exactly:

```text id="fe5p1"
1 primary command surface
supporting panels beneath it
```

Rules:

* equal-weight card grid layout is invalid
* one dominant primary surface is required
* supporting information must remain subordinate

---

### Step FE5.2 — Create Main Screen Hierarchy

Main screen order MUST be:

1. Command bar
2. Primary scene / primary command surface
3. Live intelligence / supporting decision panel
4. Supporting objects/events/context panels
5. Secondary metadata/supporting info

Rules:

* hierarchy must be visually obvious
* user must know the main focus immediately

---

### Step FE5.3 — Responsive Rules

Desktop:

* primary surface remains dominant
* supporting panels remain subordinate

Tablet:

* hierarchy preserved
* compression allowed

Mobile:

* primary surface first
* supporting panels stack beneath

Completion:

* layout remains meaningful at all sizes

Fail if:

* layout collapses into equal-weight cards
* primary surface loses dominance

---

## 8. FE6 — SCENE / OBJECT / DETAIL FLOW

### Step FE6.1 — Scene Rendering Flow

Frontend MUST support:

```text id="fe6p1"
Scene → Object selection → Detail → Return to same scene state
```

Rules:

* scene state must be preserved
* object selection must be explicit
* detail navigation must be deterministic

---

### Step FE6.2 — Object Interaction States

Each object interaction surface MUST support:

* default
* hover
* selected
* loading (if applicable)
* error (if applicable)

Rules:

* selection state must be visually obvious
* selected object identity must persist into detail flow

---

### Step FE6.3 — Detail View System

Detail views MUST support:

* object identity
* summary/explanation
* relevant metadata
* associated assets/media
* related context if available

Rules:

* detail view must not destroy scene context
* returning from detail must restore prior scene state

Completion:

* core product interaction loop works fully

---

## 9. FE7 — THREE.JS INTEGRATION

### Step FE7.1 — Introduce Three.js Foundation

Three.js is the only approved general 3D space/sky renderer.

Use cases:

* sky dome
* starfield
* solar system scene
* deep sky scene
* space-based object rendering

Rules:

* Three.js is for space/sky rendering only
* Earth/globe rendering must not be forced through Three.js when Cesium is the better fit

---

### Step FE7.2 — Create Visualization Boundary

Three.js must be isolated behind a feature/module boundary.

Rules:

* rendering logic must not leak across the app
* UI components must consume stable props/contracts
* direct rendering code inside unrelated UI files is forbidden

---

### Step FE7.3 — Progressive Adoption

Do not convert the entire frontend to 3D immediately.

Rules:

* start with foundation and controlled render surfaces
* preserve existing product flow while integrating rendering capability

Completion:

* Three.js foundation is operational and bounded

---

## 10. FE8 — CESIUMJS INTEGRATION

### Step FE8.1 — Introduce Cesium Foundation

CesiumJS is the only approved Earth/geospatial renderer.

Use cases:

* Earth globe
* satellites
* geospatial overlays
* Earth-based event visualization
* flight/global context later

Rules:

* Cesium is for Earth/globe/geospatial use
* Cesium and Three.js responsibilities must not overlap ambiguously

---

### Step FE8.2 — Create Geospatial Rendering Boundary

Cesium must be isolated behind a feature/module boundary.

Rules:

* do not scatter Cesium logic across general UI components
* geospatial rendering must remain modular

Completion:

* Cesium foundation is operational and bounded

---

## 11. FE9 — ASSET / MEDIA PRESENTATION LAYER

### Step FE9.1 — Create Asset Presentation Rules

Frontend asset handling MUST support:

* lazy loading
* loading placeholders
* error fallback states
* streamed/file-delivered assets
* attribution/source display where required

Rules:

* frontend must not preload large asset sets
* frontend must not assume assets are JSON payloads
* frontend must handle absent or degraded asset states gracefully

---

### Step FE9.2 — Create Media Components

Approved media presentation components SHOULD include:

* AssetImage
* AssetGallery
* AssetFallback
* MediaAttribution
* AssetLoadingState

Rules:

* media display behavior must be standardized
* asset handling must not be improvised per page

Completion:

* frontend is ready for large asset volume without breaking detail flows

---

## 12. FE10 — FRONTEND TESTING AND VERIFICATION

### Step FE10.1 — Unit / Component Testing

Use:

```text id="fe10p1"
Vitest
```

Tests MUST cover:

* core UI primitives
* key feature components
* state logic where applicable

---

### Step FE10.2 — End-to-End Testing

Use:

```text id="fe10p2"
Playwright
```

Must verify:

* app boot
* routing
* scene load
* object detail flow
* responsive shell stability
* error/fallback states for key flows

---

### Step FE10.3 — Runtime Verification

Completion requires:

* build succeeds
* app renders without broken layout
* data layer works through approved abstractions
* router works
* no manual route hacks remain
* no equal-weight dashboard shell remains

Fail if:

* frontend behavior is unverifiable
* critical flows rely on ad hoc logic
* tests do not cover core product flow

---

## 13. FINAL COMPLETION

Phase FE is complete when:

* frontend stack is fully aligned
* data layer is standardized
* state layer is standardized
* token/theme system is real
* command center shell exists
* scene/object/detail flow works
* Three.js foundation exists
* Cesium foundation exists
* asset/media layer exists
* testing verifies the rebuilt frontend

---

## 14. FAILURE CONDITIONS

Phase FE is invalid if:

* multiple routing systems exist
* direct fetch logic remains scattered in components
* global state ownership is unclear
* styling remains hardcoded and inconsistent
* equal-weight dashboard layout remains
* scene/detail flow is broken or ambiguous
* rendering responsibilities between Three.js and Cesium are mixed
* asset handling is improvised
* frontend is not testable

---

## 15. FINAL PRINCIPLE

```text id="feend"
Frontend must be deterministic, structured, and visually unambiguous at all times.
```
