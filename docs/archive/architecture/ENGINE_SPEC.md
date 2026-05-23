# ENGINE SPECIFICATION

---

## PURPOSE

Defines what an **engine is**, how engines are structured, and how they interact within the Astronomy Hub system.

---

## CORE DEFINITION

An engine is a **domain-specific system** responsible for:

1. Producing candidate objects or signals
2. Providing detail and context
3. Supporting domain exploration

---

## ENGINE TYPES

Astronomy Hub defines three types of engines:

---

### 1. PRIMARY ENGINES

A primary engine:

* owns a complete domain
* controls its own rendering scene
* can be entered directly
* defines its own exploration environment

Examples:

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

Every engine (primary or sub-engine) MUST:

* ingest or receive domain data
* normalize data into the object model
* produce candidate objects or signals
* provide detail context
* support focus behavior

---

## ENGINE OUTPUT TO HUB

Engines provide **candidate objects or signals only**.

The Hub:

* filters
* ranks
* truncates

---

## RESPONSIBILITY MATRIX

| Responsibility    | Engine | Hub |
| ----------------- | ------ | --- |
| Data ingestion    | ✓      | ✗   |
| Object creation   | ✓      | ✗   |
| Basic filtering   | ✓      | ✓   |
| Final ranking     | ✗      | ✓   |
| Display decisions | ✗      | ✓   |

---

## ENGINE ENTRY BEHAVIOR

### Primary Engine Object

* open owning engine
* load scene
* focus object

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
* must also expose a layer-compatible interface for parent engines
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

---

## EXECUTION RULE

> Only one primary engine should be actively implemented at a time.

Sub-engines only activate when their parent engine is active.
