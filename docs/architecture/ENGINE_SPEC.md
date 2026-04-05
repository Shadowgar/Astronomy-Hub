#`ENGINE_SPEC.md`

---

# ENGINE SPECIFICATION

---

## PURPOSE

Defines what an **engine is**, how engines are structured, and how they interact within Astronomy Hub.

This document is **authoritative for engine behavior**.

---

## CORE DEFINITION

An engine is a **domain-specific system** responsible for:

1. ingesting or receiving domain data
2. producing candidate objects or signals
3. providing detail and context
4. supporting domain exploration
5. controlling its rendering behavior (if primary)

---

## ENGINE TYPES

Astronomy Hub defines three types of engines:

---

### 1. PRIMARY ENGINES

A primary engine:

* owns a complete domain
* controls its own scene and rendering behavior
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

Sub-engines:

* provide data layers
* integrate into the parent scene
* do NOT control rendering independently

---

## ACTIVE ENGINE VIEWPORT

The frontend provides a single viewport.

This viewport always reflects:

```text
The currently active primary engine.
```

Switching engines:

* replaces the scene
* updates the rendering context
* preserves user interaction state where possible

---

## ENGINE OUTPUT TO HUB

Engines provide **candidate objects or signals only**.

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

---

## NON-GOALS

Engines do NOT:

* control hub output
* decide importance
* manage global UI layout
* override other engine domains

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
