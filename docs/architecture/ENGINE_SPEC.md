#`ENGINE_SPEC.md`

---

# ENGINE SPECIFICATION

---

## PURPOSE

Defines what an **engine is**, how engines are structured, and how they interact within Astronomy Hub.

This document is **authoritative for engine behavior**.

---

## Lifecycle and Product-State Boundary

Generic engine responsibilities below are reference, not proof that every domain
exists. Current Sky is SWE; current Earth is the Hub-owned independent Cesium
runtime. Small Hub product state, bounded bridge and serial active-only lifetime
are qualified within C0–C5.6; body-aware planetary surfaces and solar-system-scale
renderer are unimplemented/open. See [Unified Universe Architecture](UNIFIED_UNIVERSE_ARCHITECTURE.md).

SWE owns its scene/math/native selection/camera. Hub-owned Earth owns its Viewer,
scene and bounded layer registry. Product intent and canonical string identities
cross the validated versioned handshake/MessageChannel with stale-generation guards;
renderer-internal state does not. The deployed bridge is defined by current source
`packages/runtime-protocol/index.mjs`, not illustrative legacy DTOs.

Pinned upstream source remains immutable by default and independently qualified.
[ADR0009](decisions/0009-owned-earth-feature-reuse.md) supersedes Phase B full-app
Earth topology: prefer qualified feature reuse/wrapping; no application/main startup
or upstream Viewer singleton. Unexported seams require bounded hook/port reasoning,
not a speculative broad rewrite. Provider/security/public-host/device gates and
broad astronomy extension APIs remain open, with no current implementation approval.

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

The product shell must NOT absorb SWE or engine-internal rendering:

* own the engine render loop
* compose engine-internal rendering modules
* extract one engine into a universal shared rendering core

Sub-engines:

* provide data layers
* integrate into the parent scene
* do NOT control rendering independently

---

## ACTIVE ENGINE VIEWPORT

The `/sky-engine` workspace mounts Sky or Earth, serially disposing the inactive
heavy runtime. `/` is Sky-first; `/earth` opens Earth. Observe/Tonight remain
focused decision routes without a renderer requirement. Qualified current
handoffs preserve bounded Hub identity/time/observer/context through adapters.
Exactly one heavy renderer remains active after settled switches. Brief overlap,
prewarming and richer animation are deferred pending device/resource qualification.
Historical Phase B lifetime recommendations are not a claim of production proof.

```text
Viewport = currently active primary engine scene
```

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
