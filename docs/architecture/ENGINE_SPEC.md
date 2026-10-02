#`ENGINE_SPEC.md`

---

# ENGINE SPECIFICATION

---

## PURPOSE

Defines what an **engine is**, how engines are structured, and how they interact within Astronomy Hub.

This document is **authoritative for engine behavior**.

---

## Lifecycle and Product-State Boundary

This document describes generic engine responsibilities, not a deployed runtime
inventory. Current SWE and public routes are distinct from planned God's Eye
Earth and Cesium Planet Mode. Solar-system-scale rendering remains undecided.
Consult [Unified Universe Architecture](UNIFIED_UNIVERSE_ARCHITECTURE.md) before
renderer work.

The future Hub owns universal product state and camera/selection intent. Engines
own internal scene state, coordinate/math behavior and intent realization. A
shared selected entity can have qualified Sky and Earth representations without
creating competing product identities. Current URL inputs are not the future
universal state boundary.

Upstream SWE/God's Eye source is immutable by default, pinned and qualified;
external adapters/extensions preserve independent upgrades. No source edits for
UI convenience or removal of God's Eye non-astronomy capabilities. The completed
[Phase B study](../studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md) selected externally
SHA-pinned God's Eye source, independent full-application build and external ORAS
wrapper, alongside existing SWE. The planned topology is same-origin isolated/
disposable runtime frames, connected to Hub-owned state by small shared/versioned
bridge/protocol packages. Use a validated postMessage handshake, then MessageChannel,
with protocol versioning, capability negotiation and mount-generation/stale-message
protection. Exact production message schema, adapter and external extension APIs
still require definition and implementation qualification. Whether the proposed
small generic standalone composition hook is needed before full astronomy
extensions remains a qualification question. No Earth integration is implemented.

## CORE DEFINITION

An engine is a **domain-specific system** responsible for:

1. ingesting or receiving domain data
2. producing candidate objects or signals
3. providing detail and context
4. supporting domain exploration
5. controlling its runtime and rendering behavior (if primary)

---

## ENGINE TYPES

Astronomy Hub defines three types of engines:

---

### 1. PRIMARY ENGINES

A primary engine:

* owns a complete domain
* controls its own scene and rendering behavior
* owns its own runtime loop and internal module system
* can be entered directly
* defines its own exploration environment

Examples:

* Sky Engine
* Earth Engine
* Solar System Engine
* Deep Sky Engine
* Solar Engine
* Conditions Engine
* News/Knowledge Engine

---

### 2. SUB-ENGINES (LAYER ENGINES)

A sub-engine:

* operates **inside a parent engine**
* shares the parent rendering context
* represents a specialized data domain within that environment
* can be toggled as a layer or mode

Examples:

* Satellite Sub-Engine (inside Earth Engine)
* Flight Sub-Engine (inside Earth Engine)
* Conditions Layer (inside Earth Engine)

---

### 3. DUAL-ROLE ENGINES

A dual-role engine:

* exists as a **primary engine**
* also functions as a **sub-engine within another engine**

Used when a domain is both:

* globally important
* locally contextual

Example:

* Conditions Engine

---

## ENGINE RESPONSIBILITIES

Every engine MUST:

* ingest or receive domain data
* normalize data into the object model
* produce candidate objects or signals
* provide detail context
* support focus and interaction behavior

---

## ENGINE → SCENE RELATIONSHIP

Each primary engine controls a **Scene**.

The Scene:

* is the active rendering environment
* is owned by the active engine
* defines what is visible and interactive

Rule:

```text
Only one primary engine scene is active at a time.
```

---

## RENDERING RESPONSIBILITY

Primary engines:

* define rendering behavior
* control scene composition
* determine object visibility
* manage interaction within their scene

---

## PRIMARY ENGINE RUNTIME OWNERSHIP

A primary engine may be mounted inside the Hub viewport, but the mounted surface remains the engine runtime.

Primary engine ownership includes:

* render loop ownership
* renderer-specific scene ownership
* internal module graph ownership
* engine-internal observer / projection / navigation services

The active Sky Engine owns a contained Stellarium Web / Stellarium Web Engine
runtime at `/oras-sky-engine/`. It must not be replaced by another renderer or
moved into the Hub renderer.

The host may provide:

* mount surface
* location / time / route context
* selection and routing interfaces

The host must NOT:

* own the engine render loop
* compose engine-internal rendering modules
* extract one engine into a universal shared rendering core

Sub-engines:

* provide data layers
* integrate into the parent scene
* do NOT control rendering independently

---

## ACTIVE ENGINE VIEWPORT

The current Sky host provides a contained viewport; Home/Observe/Tonight do not
require one. The planned flagship workspace foregrounds one domain scene. Phase B
selected one active heavy renderer after a settled switch; dispose/unmount the
inactive runtime rather than retain WebGL/WASM/Cesium resources. Mobile defaults
to serial teardown/start unless later qualification proves a safe alternative.
Capable desktop devices may use brief controlled overlap only for a later
qualified visual handoff; it is not the Phase C default. Exact visual animation,
prewarm timing and actual memory/performance measurements remain open. This is
PLANNED direction, not implemented lifecycle or browser/runtime qualification.

This viewport always reflects:

```text
The currently active primary engine.
```

Switching engines:

* replaces the scene
* updates the rendering context
* preserves Hub product identity/time/context through qualified adapters; controlled
  renderer handoff is selected, while exact visual transition implementation is open

---

## CANDIDATE DISCOVERY OUTPUT TO HUB

For curated discovery, engines provide **candidate objects or signals only**.
This bounds the Above Me feed, not the complete applicable upstream Earth runtime.

The Hub:

* filters
* ranks
* truncates
* determines importance

---

## RESPONSIBILITY MATRIX

| Responsibility    | Engine           | Hub |
| ----------------- | ---------------- | --- |
| Data ingestion    | ✓                | ✗   |
| Object creation   | ✓                | ✗   |
| Basic filtering   | ✓                | ✓   |
| Final ranking     | ✗                | ✓   |
| Display decisions | ✗                | ✓   |
| Rendering control | ✓ (primary only) | ✗   |

---

## ENGINE ENTRY BEHAVIOR

### Primary Engine Object

* open owning engine
* load scene
* focus object

---

### Sub-Engine Object

* open parent engine
* activate sub-engine layer
* focus object

---

## SUB-ENGINE RULES

Sub-engines:

* do not own rendering context
* must integrate into parent scene
* must use parent coordinate system
* must expose layer toggles

---

## DUAL-ROLE ENGINE RULES

Dual-role engines:

* must function independently as a primary engine
* must expose a layer-compatible interface
* must maintain consistent data contracts across both contexts

---

## OBJECT OWNERSHIP

Each object belongs to:

* a primary engine OR
* a sub-engine

Ownership defines:

* routing
* rendering context
* detail provider

---

## ENGINE ISOLATION

Engines must be:

* independent in logic
* consistent in contracts
* interoperable via shared object model
* isolated in runtime ownership when primary
* thinly integrated at host boundaries

---

## NON-GOALS

Engines do NOT:

* control hub output
* decide importance
* manage global UI layout
* override other engine domains
* become a universal rendering core for the entire system

---

## EXECUTION RULE

```text
Only one primary engine should be actively implemented at a time.
```

Sub-engines only activate when their parent engine is active.

---

## FINAL PRINCIPLE

```text
Engines own reality.  
The Hub decides what matters.
```
