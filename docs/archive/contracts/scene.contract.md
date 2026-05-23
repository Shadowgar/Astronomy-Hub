# Scene Contract

## Purpose

This document defines the canonical structure and rules for scenes in Astronomy Hub.

A scene is the active rendered context for either:

* the Above Me Hub, or
* an engine / sub-engine exploration view

This contract defines what a scene must contain conceptually.
It is not a UI layout spec.

Related authority:

* `docs/architecture/ARCHITECTURE_OVERVIEW.md`
* `docs/architecture/ENGINE_SPEC.md`
* `docs/architecture/OBJECT_MODEL.md`
* `docs/architecture/DATA_CONTRACTS.md`

---

## Scene Definition

A scene is the currently active user-facing context.

A scene may represent:

* the Above Me hub decision surface
* a primary engine view
* a parent engine with one active sub-engine layer
* a focused object context inside an engine

Only one scene is active at a time.

---

## Scene Types

The system supports these architectural scene classes:

### 1. hub

The curated Above Me decision surface.

Purpose:

* show a ranked, filtered set of current relevant items

### 2. engine

A primary engine scene.

Purpose:

* provide domain exploration for a primary engine

### 3. engine_layer

A parent engine scene with an active sub-engine or layer.

Examples:

* Earth Engine with Satellite layer active
* Earth Engine with Flight layer active
* Earth Engine with Conditions layer active

### 4. object_focus

A scene state where one object is actively focused inside the current engine context.

This is not a separate engine.
It is a focused state of the current scene.

---

## Canonical Scene Structure

Every scene must define these conceptual elements:

* `scene_id` — unique identifier for the active scene instance
* `scene_type` — one of: `hub`, `engine`, `engine_layer`, `object_focus`
* `scope` — current top-level scope
* `engine` — active primary engine
* `active_layer` — active sub-engine or layer if applicable, else null
* `title` — human-readable scene title
* `summary` — short explanation of what the scene is showing
* `time_context` — current time context for the scene
* `location_context` — current location context for the scene when location matters
* `focus_object_id` — selected object id if any, else null
* `objects` — objects currently present in scene context
* `decision_notes` — optional concise user guidance, especially for hub scenes
* `meta` — non-visual scene metadata if needed

---

## Scene Rules

### Rule 1 — Scene must be self-describing

A scene must clearly state:

* what domain it belongs to
* what it is currently showing
* why the current contents are relevant

### Rule 2 — Scene must not be a raw query dump

A scene is a user-facing context, not a database response.

### Rule 3 — Hub scenes are curated

Hub scenes must contain ranked, filtered, decision-ready items only.

### Rule 4 — Engine scenes are exploratory

Engine scenes may show richer domain context than hub scenes, but must still be coherent and bounded.

### Rule 5 — Sub-engine layers do not create independent worlds

A sub-engine layer must remain inside the parent engine scene.

### Rule 6 — Object focus stays within current scene ownership

Focusing an object does not invent a new engine. It focuses that object within the correct engine context.

---

## Hub Scene Requirements

A hub scene must:

* be tied to selected location/time
* consume candidate objects from engines
* present only a curated result set
* provide enough meaning without requiring detail view

A hub scene must not:

* show raw engine lists
* act like a full immersive engine scene
* contain dead actions or placeholder reasoning

---

## Engine Scene Requirements

An engine scene must:

* identify its active engine
* support domain exploration
* support object focus
* remain consistent with engine ownership rules

---

## Earth Engine Layer Requirements

When the active engine is Earth and a layer is active:

* `engine` must remain `earth`
* `active_layer` must identify the sub-engine/layer (`satellite`, `flight`, `conditions`, etc.)
* all rendered context remains Earth-centered

A satellite object selected from the hub should open:

* `engine = earth`
* `active_layer = satellite`

A flight object selected from the hub should open:

* `engine = earth`
* `active_layer = flight`

A conditions-related Earth view may open:

* `engine = earth`
* `active_layer = conditions`

---

## Time Context Requirements

Every scene must carry enough time context to make the contents interpretable.

At minimum:

* current timestamp used for the scene

Optional:

* best viewing window
* next event time
* validity window

Time language shown to users must be human-readable.

---

## Location Context Requirements

When a scene is location-dependent, it must include:

* latitude
* longitude
* any named location label if available

Location context is required for:

* hub scenes
* observing conditions
* local sky / horizon-dependent engine scenes

---

## Object Rules Inside Scenes

Objects shown in scenes must use the canonical object model from:

* `docs/architecture/OBJECT_MODEL.md`

Scenes must not redefine object structure.

A scene may include a subset of object fields, but any object it references must still be resolvable through the canonical object/detail system.

---

## Frontend / Backend Authority

Backend is authoritative for:

* candidate generation
* inclusion rules
* ranking inputs
* detail data assembly

Frontend is authoritative for:

* rendering the scene
* focus behavior
* visual transitions
* layer toggles within allowed engine rules

Frontend must not invent scene meaning or object truth.

---

## Stability Rule

This contract is architectural and should remain stable.

If scene behavior changes, this document must be updated deliberately rather than bypassed in UI or route code.
