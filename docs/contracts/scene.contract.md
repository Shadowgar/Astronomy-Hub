# Scene Contract — Phase 2

## Purpose

This document defines the **canonical structure and rules for all scenes** in Astronomy Hub.

A "scene" is the system’s primary decision unit.

Every scene must answer:

> “What should I know right now, and what should I look at?”

This contract is **authoritative** and must be followed by all backend endpoints and frontend renderers.

---

## Canonical Scene Schema

All scenes MUST conform to this structure:

- scene_id (string)
- scene_type (string)
- title (string)
- summary (string)

- conditions (object)
  - visibility (string)
  - moon_phase (string)
  - light_pollution (string)
  - notes (optional string)

- time_context (object)
  - now (string)
  - next_event (optional string)
  - best_window (optional string)

- groups (array)
  - group_id (string)
  - title (string)
  - reason (string)
  - priority (number)
  - objects (array of object references)

- objects (array)
  - id (string)
  - name (string)
  - type (string)
  - altitude (number or null)
  - azimuth (number or null)
  - visibility (string)
  - time_relevance (string)
  - reason (string)

- decision_notes (array of strings)

- actions (array of strings)

---

## Scene Types (Phase 2)

The following scene types are **allowed and fixed**:

### above_me
- Purpose: Show current sky state overhead
- Question: “What is in the sky right now above me?”

### best_tonight
- Purpose: Ranked decision scene
- Question: “What is most worth observing tonight?”

### planets_moon
- Purpose: Solar system focus
- Question: “What planets or lunar conditions matter right now?”

### deep_sky_tonight
- Purpose: Deep sky observation
- Question: “What deep sky objects are worth viewing now?”

### passing_objects
- Purpose: Time-sensitive events
- Question: “What is passing or happening soon?”

### conditions
- Purpose: Observing viability
- Question: “Are conditions good enough to observe?”

### class_filtered
- Purpose: Category exploration
- Question: “What objects of this type are worth viewing?”

No additional scene types are allowed in Phase 2.

---

## Scene Rules

A scene MUST:

- Answer a **clear decision question**
- Provide **reasoning**, not just data
- Group objects meaningfully
- Reflect **current time and conditions**
- Be self-explanatory without needing object detail

A scene MUST NOT:

- Be a raw list of objects
- Duplicate full object detail
- Act as a database query response
- Depend on frontend interpretation to make sense

---

## Object Presence Rules

Every object in a scene MUST include:

- A reason it appears
- A time relevance indicator
- A visibility context

Objects appear ONLY if:

- They are observable OR relevant soon
- They contribute to the scene’s decision goal

Objects MUST NOT appear if:

- They are not actionable
- They are not relevant to the scene type

---

## Group Rules

Groups are required.

Each group MUST:

- Represent a meaningful decision category
- Include a reason for grouping
- Have a priority value

Examples:

- “Best First Targets”
- “Setting Soon”
- “High Visibility”
- “Short Window”

---

## Time Context Rules

- "now" = current system time context
- "soon" = near-future window (implementation-defined later)
- "best_window" = peak viewing time (if applicable)

Scenes MUST express time relevance in human-understandable terms.

---

## Conditions Contract

All scenes MUST include:

- visibility
- moon_phase
- light_pollution

Optional:

- notes

Conditions MUST influence:

- object selection
- grouping
- decision notes

---

## Decision Notes

Decision notes are REQUIRED.

They must:

- Guide the user toward action
- Be short and clear
- Reflect current conditions

---

## Actions

Actions represent possible next steps.

Examples:

- "View object details"
- "Switch scene"
- "Check later time"

Actions are NOT interactive definitions, only intent signals.

---

## Authority Rule

The backend is the **single authority** for:

- scene composition
- object inclusion
- reasoning

The frontend MUST NOT:

- invent logic
- reorder priorities arbitrarily
- reinterpret scene meaning

---

## Contract Stability

This contract is locked for Phase 2.

Changes require architectural review.