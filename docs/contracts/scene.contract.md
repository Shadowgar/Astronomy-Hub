# `scene.contract.md`


---

# Scene Contract

---

## Purpose

This document defines the canonical structure and rules for scenes in Astronomy Hub.

A scene is the **active rendered context** of the system.

It represents:

* the current engine’s domain
* the current scope and filters
* the objects available for interaction

This contract defines what a scene must contain conceptually.
It is not a UI layout spec.

---

## Authority

Related documents:

* `docs/architecture/ARCHITECTURE_OVERVIEW.md`
* `docs/architecture/ENGINE_SPEC.md`
* `docs/architecture/OBJECT_MODEL.md`
* `docs/architecture/DATA_CONTRACTS.md`

---

## Core Rule (CRITICAL)

```text
Only one scene may be active at a time.
```

---

## Viewport Rule (CRITICAL)

```text
Center Viewport = Active Engine Scene
```

Meaning:

* the scene is what the user sees in the main viewport
* the scene is owned by the active primary engine
* the hub does not render scenes directly

---

## Scene Definition

A scene is the currently active user-facing context.

A scene may represent:

* the Above Me hub context
* a primary engine view
* a parent engine with an active sub-engine layer
* a focused object state within an engine

---

## Scene Types

---

### 1. hub

The curated Above Me decision surface.

Purpose:

* show a ranked, filtered set of relevant items
* provide context for interaction

---

### 2. engine

A primary engine scene.

Purpose:

* provide domain exploration
* render domain-specific objects
* support interaction and navigation

---

### 3. engine_layer

A parent engine scene with an active sub-engine layer.

Examples:

* Earth Engine + Satellite layer
* Earth Engine + Flight layer
* Earth Engine + Conditions layer

---

### 4. object_focus

A focused state within the current engine.

This is NOT a new engine.

It is:

* a focused interaction state
* within the current engine scene

---

## Canonical Scene Structure

Every scene must define:

```text
scene_id
scene_type
scope
engine
active_layer
title
summary
time_context
location_context
focus_object_id
objects
decision_notes
meta
```

---

### Field Definitions

| Field            | Description                                |
| ---------------- | ------------------------------------------ |
| scene_id         | Unique identifier                          |
| scene_type       | hub / engine / engine_layer / object_focus |
| scope            | Current scope selection                    |
| engine           | Active primary engine                      |
| active_layer     | Active sub-engine (if any)                 |
| title            | Human-readable name                        |
| summary          | Explanation of scene                       |
| time_context     | Current time context                       |
| location_context | Current location context                   |
| focus_object_id  | Selected object                            |
| objects          | Objects in scene                           |
| decision_notes   | Optional guidance                          |
| meta             | Non-visual metadata                        |

---

## Scene Behavior Rules

---

### Rule 1 — Scene must be self-describing

The scene must clearly communicate:

* what it represents
* what domain it belongs to
* why its contents are relevant

---

### Rule 2 — Scene is not a raw data response

Scenes must never be:

* unfiltered lists
* direct API dumps
* unstructured outputs

---

### Rule 3 — Hub scenes are curated

Hub scenes must:

* contain ranked objects
* be limited in size
* support quick decision-making

---

### Rule 4 — Engine scenes are exploratory

Engine scenes:

* may show more data
* must remain coherent
* must still respect scope and filters

---

### Rule 5 — Sub-engine layers stay inside parent

Sub-engines:

* do not create new scenes
* do not create new engines
* exist within parent engine context

---

### Rule 6 — Object focus does not change engine ownership

Focusing an object:

* does NOT switch engine automatically
* remains within current engine unless explicitly routed

---

### Rule 7 — Scene must match engine ownership

```text
Scene.engine must always match the active primary engine
```

---

## Hub Scene Requirements

A hub scene must:

* be location-aware
* be time-aware
* merge data from multiple engines
* present only relevant objects

---

### Hub Must NOT

* render full engine scenes
* show raw engine outputs
* act as a simulation surface

---

## Engine Scene Requirements

An engine scene must:

* identify its active engine
* support object interaction
* support object focus
* remain within engine domain

---

## Earth Engine Layer Requirements

When:

```text
engine = earth
```

Then:

```text
active_layer = satellite | flight | conditions | null
```

Rules:

* rendering remains Earth-centered
* layers do not override engine
* layers enhance context

---

## Time Context Requirements

Every scene must include:

* current timestamp

Optional:

* best viewing window
* event timing
* validity range

---

## Location Context Requirements

When applicable, scene must include:

* latitude
* longitude
* optional location label

Required for:

* hub scenes
* sky observation
* conditions
* local context

---

## Object Rules Inside Scenes

Objects must follow:

* `OBJECT_MODEL.md`

Rules:

* no custom object structures
* no partial objects without schema compliance
* objects must be resolvable

---

## Frontend / Backend Authority

---

### Backend

Responsible for:

* object generation
* filtering inputs
* ranking inputs
* detail data

---

### Frontend

Responsible for:

* rendering scene
* viewport behavior
* focus interaction
* visual transitions

---

### Forbidden

Frontend must NOT:

* invent objects
* alter object truth
* redefine scene meaning

---

## Stability Rule

This contract is stable.

Changes must:

* be intentional
* update related architecture documents
* not be implemented ad hoc

---

## Final Principle

```text
A scene is not a screen.
A scene is the current reality defined by the active engine.
```

---