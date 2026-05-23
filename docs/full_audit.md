# SKY ENGINE FULL AUDIT

Date: 2026-04-08
Classification: SUPPORT
Authority: Reference only unless explicitly promoted by DOCUMENT_INDEX.md

---

## Purpose

This document records the hard architecture and parity audit of the current Sky Engine against the target state:

* Sky Engine must become a self-contained Stellarium-like sky engine
* implemented in BabylonJS / TypeScript
* mounted inside Astronomy Hub as one independent engine
* not the universal core of the Hub
* able to communicate with other engines later through interfaces

---

## 1. Current State Summary

### What Sky Engine actually is today

Sky Engine is a React component-driven rendering layer living inside `frontend/src/features/sky-engine/`.

The central runtime artifact is `SkyEngineScene.tsx`, a large React component that:

* creates BabylonJS engine and scene instances inside React lifecycle
* receives observer, objects, scene packets, and sun state as props
* owns navigation, picking, labels, atmosphere setup, overlays, and render orchestration
* composites Babylon layers with Canvas2D drawing

The `engine/sky/` subdirectory is the most engine-like subsystem. It provides:

* star tile contracts
* tile indexing and selection
* query assembly
* coordinate transforms
* scene packet assembly

But it still produces flat scene data for the page component instead of owning an engine runtime.

### What parts are page-driven vs engine-driven

Page-driven today:

* render loop ownership
* Babylon scene lifecycle
* selection and picking orchestration
* label composition
* object composition
* atmosphere hookup
* navigation state mutation

Engine-driven today:

* tile visibility selection
* sky data contracts
* some observer transform math
* star packet assembly

### Main structural drift from target

The current implementation is not a self-contained engine runtime.

It is a page feature with embedded rendering.

Main drift:

* no `core` runtime object
* no engine-owned render loop
* no module system
* no shared painter abstraction
* no proper frame / observer pipeline
* no unified render ownership
* no thin host integration boundary

---

## 2. Stellarium Structure Map

Reference source reviewed from `/study/stellarium-web-engine/`.

### Major runtime objects

Stellarium Web Engine centers on `core_t`, which owns:

* observer
* field of view
* projection
* tonemapper
* renderer
* selection
* input state
* module list
* task list

### Module ownership

Major modules reviewed:

* atmosphere
* stars
* landscape
* constellations
* labels
* planets
* lines
* pointer
* cardinal

Each module exposes update and render behavior under core control.

### Render ownership

Render ownership is engine-internal:

* `core_update()` updates observer, navigation, tone mapping, and modules
* `core_render()` builds projection and painter state
* modules render through shared painter / renderer infrastructure

### Update / render flow

Structural flow:

`core -> observer -> projection -> painter -> ordered modules -> labels -> finish`

This is engine-owned, not page-owned.

---

## 3. Parity Audit by Subsystem

Scoring:

* 0 = Missing
* 1 = Stub
* 2 = Partial
* 3 = Functional but wrong architecture
* 4 = Near parity
* 5 = Parity

### Projection

* Current status: `projectionMath.ts` implements stereographic, gnomonic, orthographic projection math.
* Parity level: 3
* Key gaps: no projection registry, no core-owned projection object, no painter-owned projection lifecycle, missing broader projection family.

### Observer / navigation

* Current status: observer is a prop shape and navigation is imperative page logic.
* Parity level: 2
* Key gaps: no engine-owned observer object, no proper frame matrices, no full astrometric pipeline, no core-owned navigation update stage.

### Stars

* Current status: tile pipeline is useful, but final star rendering is page-layer compositing.
* Parity level: 3
* Key gaps: no true stars module, no point-spread / tonemapper-integrated rendering path, no engine-owned star module lifecycle.

### Atmosphere

* Current status: strong mathematical pieces exist, especially `preethamSky.ts`, but live rendering still uses a page-driven gradient approach.
* Parity level: 2
* Key gaps: Preetham model is not the actual runtime authority, no unified atmosphere module, weak integration with sky brightness and tone mapping.

### Landscape / horizon

* Current status: Babylon meshes create a generic ground disc, occluder, and rings.
* Parity level: 2
* Key gaps: no panoramic landscape system, no true horizon profile ownership, no Stellarium-like landscape module.

### Overlays

* Current status: overlay layer handles labels, line work, cardinals, and trajectories.
* Parity level: 2
* Key gaps: no full astronomical grid ownership, no clean module separation, overlay still page-composed.

### Labels

* Current status: collision handling and prioritization are reasonably strong.
* Parity level: 3
* Key gaps: label system is not a standalone engine service, and remains tied to page-layer composition.

### Constellations

* Current status: hardcoded small set of asterism-style line segments.
* Parity level: 1
* Key gaps: no sky-culture dataset loading, no proper constellation module, no artwork, no boundaries, no complete line set.

### Render architecture

* Current status: layered Babylon + Canvas2D composition, orchestrated by page code.
* Parity level: 2
* Key gaps: no painter abstraction, no core-owned render sequence, no unified module render ordering.

### Runtime / module ownership

* Current status: no core runtime, no module graph, no engine-owned lifecycle boundary.
* Parity level: 0
* Key gaps: this is the main architectural failure.

---

## 4. Codebase Classification

### KEEP

Keep and preserve as recovery inputs:

* `frontend/src/features/sky-engine/engine/sky/contracts/*`
* `frontend/src/features/sky-engine/engine/sky/core/*`
* `frontend/src/features/sky-engine/engine/sky/transforms/coordinates.ts`
* `frontend/src/features/sky-engine/engine/sky/services/sceneAssembler.ts`
* `frontend/src/features/sky-engine/engine/sky/adapters/*`
* `frontend/src/features/sky-engine/projectionMath.ts`
* `frontend/src/features/sky-engine/observerNavigation.ts`
* `frontend/src/features/sky-engine/preethamSky.ts`
* `frontend/src/features/sky-engine/atmosphericExtinction.ts`
* `frontend/src/features/sky-engine/skyBrightness.ts`
* `frontend/src/features/sky-engine/nightSkyBackground.ts`
* `frontend/src/features/sky-engine/astronomy.ts`
* `frontend/src/features/sky-engine/starRenderer.ts`

### REWORK

Rework into engine-owned modules or services:

* `frontend/src/features/sky-engine/SkyEngineScene.tsx`
* `frontend/src/features/sky-engine/directBackgroundLayer.ts`
* `frontend/src/features/sky-engine/directObjectLayer.ts`
* `frontend/src/features/sky-engine/directOverlayLayer.ts`
* `frontend/src/features/sky-engine/landscapeLayer.ts`
* `frontend/src/features/sky-engine/labelManager.ts`
* `frontend/src/features/sky-engine/constellations.ts`

### DISCARD / REFERENCE ONLY

Do not carry forward as the architectural basis:

* page-owned scene orchestration patterns
* Canvas2D fallback compositing as primary rendering path
* hardcoded constellation structures
* Babylon mesh contracts that assume the page is the runtime owner

---

## 5. Port Recovery Recommendation

Correct recovery strategy:

1. create a real Sky Engine runtime class
2. give that runtime ownership of observer, projection, render loop, and modules
3. preserve the useful tile and math subsystems
4. mount the runtime into the Hub through a thin interface
5. do not create a universal shared Hub rendering core
6. do not keep the React page component as the true engine owner

Recovery must be extraction-first, not greenfield rewrite.

---

## 6. Ordered Port Plan

1. Create Sky Core runtime and lifecycle boundary.
2. Extract observer, projection, and navigation into engine-owned services.
3. Move stars into a real module using the existing tile pipeline.
4. Replace page-driven atmosphere with a true atmosphere module using Preetham math.
5. Replace landscape and overlays with module-owned rendering.
6. Introduce a real labels service and constellation data pipeline.
7. Convert the React page component into a thin mount adapter.
8. Preserve Hub integration as event / context exchange only.

---

## 7. Non-Negotiable Rules

* Sky Engine must be an engine runtime, not a page component.
* The Hub may mount Sky Engine, but must not own its render loop.
* BabylonJS remains the active 3D engine for Sky Engine.
* No shared universal Hub rendering core may be extracted from Sky Engine.
* Sky Engine internals must become module-driven.
* Atmosphere must be driven by actual sky model math, not presentation-only gradients.
* Constellations must move to data-driven sky-culture ownership.
* All cross-engine communication must stay interface-based.

---

## 8. Documentation Changes Required

This audit requires live documentation to reflect:

* BabylonJS instead of Three.js for active Sky Engine work
* engine runtime isolation for primary engines
* thin host ↔ engine mounting boundaries
* Sky Engine as a self-contained Stellarium-like runtime inside the Hub

Legacy and archive documents may retain older references for history, but active execution and architecture documents must not.