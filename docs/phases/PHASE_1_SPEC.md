# PHASE 1 — FOUNDATION & ABOVE ME

## Status

Legacy reference. Not execution authority.

This document defines the foundational system behavior, data model expectations, and constraints established in Phase 1.

It does not define execution order or task sequencing.

---

# 0. PURPOSE

Phase 1 establishes the first working version of Astronomy Hub centered on:

> real-time awareness of what is above a user at a given location and time

This phase validates the core concept:

* location-aware sky awareness
* object selection
* detail resolution

---

# 1. CORE SYSTEM BEHAVIOR

## 1.1 Primary Function

The system must:

* accept a location (lat/lon)
* accept a time context
* determine what objects are above the user
* present a list of relevant objects
* allow the user to select an object
* resolve detail for that object

---

## 1.2 Scene Model (Initial)

Phase 1 operates on a single scene:

* Above Me Scene

This scene:

* contains objects from multiple domains
* is location + time dependent
* acts as the main user entry point

---

## 1.3 Object Domains (Initial)

Phase 1 supports mixed-domain objects:

* planets
* satellites
* deep sky objects
* events (basic)
* other visible phenomena

All objects are treated uniformly at this stage.

---

# 2. DATA DOCTRINE (INITIAL)

## 2.1 Backend Authority

Backend must:

* determine object presence
* provide object data
* provide detail data

Frontend must:

* render only
* not derive meaning
* not invent object properties

---

## 2.2 Data Requirements

For each object:

* name
* type
* approximate position or visibility context
* time relevance
* identifier for detail resolution

---

## 2.3 Detail Model

Detail must:

* be resolvable from object identity
* provide more information than the scene
* not break the user’s context

---

# 3. LOCATION & TIME LAW (INITIAL)

Phase 1 introduces location/time as core inputs.

## 3.1 Required Inputs

* latitude
* longitude
* current time

## 3.2 Rule

Changing location or time must change output where applicable.

## 3.3 Failure Patterns

Invalid Phase 1 behavior includes:

* static output regardless of location
* static output regardless of time
* no observable difference between locations

---

# 4. OBJECT MODEL (INITIAL)

Objects must be:

* identifiable
* selectable
* resolvable to detail

## 4.1 Required Object Properties

At minimum:

* id
* name
* type
* source domain
* reason for inclusion (implicit or explicit)

---

## 4.2 Object Identity Rule

An object must maintain identity across:

* scene view
* detail view

---

## 4.3 Object Failure Patterns

Invalid behavior includes:

* object identity changing unexpectedly
* detail not matching selected object
* duplicate objects representing same entity

---

# 5. SCENE LIMITATIONS (PHASE 1)

Phase 1 intentionally lacks:

* domain separation
* filtering system
* ranking system
* deterministic engine boundaries
* ingestion normalization pipeline
* relationship system
* prediction system

---

# 6. PERFORMANCE MODEL (INITIAL)

The system should:

* compute only the current scene
* avoid loading unnecessary data
* defer detail loading until requested

---

# 7. UI MODEL (INITIAL)

The UI must:

* show a list of objects above the user
* allow selection of an object
* show detail for selected object

UI must not:

* interpret data
* rank objects independently
* create synthetic meaning

---

# 8. KNOWN FAILURE PATTERNS

Phase 1 is considered broken if:

* too many objects are shown without prioritization
* objects lack meaningful differentiation
* detail content is generic or placeholder
* system behaves like a raw list instead of a decision surface

---

# 9. SYSTEM LIMITATIONS

Phase 1 is intentionally:

* non-deterministic in ranking
* weak in filtering
* mixed-domain without control
* lacking ingestion structure

These limitations are addressed in Phase 2.

---

# 10. RESULT

Phase 1 proves:

> a location-aware astronomy interface is viable

But exposes the need for:

* domain separation
* filtering
* determinism
* backend pipeline structure
* improved object detail
