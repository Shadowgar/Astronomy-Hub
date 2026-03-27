# 🌌 ASTRONOMY HUB — OBJECT MODEL (AUTHORITATIVE)

## 0. PURPOSE

This document defines:

> **What an object is in Astronomy Hub, how objects are identified, how they are structured, who owns them, and how they are linked**

It exists to prevent:

* inconsistent identity
* duplicated object definitions
* cross-engine confusion
* broken detail routing
* weak relationship modeling

This is a **core system law document**.

---

## 1. CORE RULE

```text id="4k8pz2"
Everything the user can click, inspect, track, relate, or explore
must be modeled as an object or an event object.
```

---

## 2. WHAT IS AN OBJECT?

An object is any domain entity that Astronomy Hub treats as a first-class, explorable unit.

An object may be:

* visualized in a scene
* listed in a panel
* opened in detail view
* linked to news
* linked to research
* linked to other objects
* tracked over time

Examples:

* ISS
* Mars
* M13
* a sunspot region
* an earthquake
* an aurora event zone
* a flight
* a comet
* a flare event
* a meteor/fireball event

---

## 3. WHAT IS NOT AN OBJECT?

The following are not objects by default:

* a filter
* a scope
* a scene
* a UI panel
* a renderer
* a raw provider record
* a cache entry
* a visual marker without object identity

These may reference objects, but they are not objects themselves.

---

## 4. OBJECT OWNERSHIP RULE

### Rule

```text id="7p2mk4"
Every object belongs to exactly one owning engine.
```

Examples:

* ISS → Satellite Engine
* Mars → Solar System Engine
* M13 → Deep Sky Engine
* earthquake event → Earth Engine
* sunspot region → Solar Engine
* commercial flight → Flight Engine

An object may be related to other engines, but it still has only one owner.

---

## 5. OBJECT IDENTITY RULE

### Rule

```text id="9x4vq1"
Every object must have a stable canonical identity inside Astronomy Hub.
```

This means:

* one canonical `id`
* one owning engine
* one canonical type
* one canonical display name
* one canonical detail route target

Object identity must not depend on:

* UI state
* provider-specific temporary formatting
* random list position
* scene ordering

---

## 6. OBJECT CLASSES

Astronomy Hub supports two major classes:

### 6.1 Persistent Objects

Long-lived entities.

Examples:

* planet
* moon
* satellite
* deep sky object
* spacecraft
* comet
* asteroid
* flight identity (if modeled as active tracked object)

### 6.2 Event Objects

Time-bound entities treated as first-class objects.

Examples:

* solar flare
* CME
* earthquake
* meteor/fireball event
* launch event
* conjunction event
* bright ISS pass event

### Rule

```text id="6m3kt8"
Events may be modeled as objects when they require identity, linking, routing, and detail views.
```

---

## 7. OBJECT TYPE SYSTEM

Every object must have a canonical type.

Illustrative top-level types:

* planet
* moon
* star
* sunspot
* flare
* cme
* satellite
* spacecraft
* flight
* comet
* asteroid
* neo
* galaxy
* nebula
* cluster
* deep_sky
* earthquake
* aurora_event
* weather_event
* meteor_event
* launch_event
* conjunction_event
* research_item
* news_item

### Rule

```text id="2q7vm5"
Type names must be canonical, finite, and documented.
```

No engine may invent untracked type names ad hoc.

---

## 8. OBJECT MINIMUM REQUIRED FIELDS

Every object must include, at minimum:

```json id="3t9pk6"
{
  "id": "canonical_object_id",
  "name": "Display Name",
  "type": "canonical_type",
  "engine": "owning_engine",
  "summary": "Short human-readable description",
  "timestamp": "ISO-8601",
  "last_updated": "ISO-8601"
}
```

### Field meaning

* `id` → stable canonical identity
* `name` → primary display label
* `type` → canonical object type
* `engine` → owning engine
* `summary` → short explanation
* `timestamp` → object-time relevance or generated time
* `last_updated` → backend freshness marker

---

## 9. OBJECT OPTIONAL FIELD GROUPS

Objects may extend through structured optional groups.

### 9.1 Position Group

Used when the object has Earth-relative, sky-relative, or scene-relevant position.

```json id="1k8px7"
{
  "position": {
    "lat": 0.0,
    "lon": 0.0,
    "alt": 0.0,
    "azimuth": 0.0,
    "elevation": 0.0,
    "distance": 0.0
  }
}
```

Not all objects need all fields.

---

### 9.2 Visibility Group

Used for observability and scene relevance.

```json id="4v2qm9"
{
  "visibility": {
    "is_visible": true,
    "visibility_window": {
      "start": "ISO-8601",
      "end": "ISO-8601"
    },
    "conditions": {
      "requires_dark_sky": true,
      "affected_by_moon": true,
      "affected_by_clouds": true
    }
  }
}
```

---

### 9.3 Classification Group

Used for object categorization.

```json id="5m7pt1"
{
  "classification": {
    "category": "planet",
    "subtype": "gas_giant",
    "tags": ["visible_now", "high_priority", "beginner_friendly"]
  }
}
```

---

### 9.4 Media Group

Used when objects have images, videos, diagrams, maps, or galleries.

```json id="7q3vx2"
{
  "media": [
    {
      "type": "image",
      "url": "https://...",
      "thumbnail": "https://...",
      "source": "NASA",
      "caption": "Optional caption",
      "timestamp": "ISO-8601"
    }
  ]
}
```

---

### 9.5 Relationship Group

Used to connect objects to other objects.

```json id="2x9pk4"
{
  "relationships": [
    {
      "type": "orbits",
      "target_id": "earth",
      "target_engine": "solar_system"
    },
    {
      "type": "observed_by",
      "target_id": "jwst",
      "target_engine": "satellite"
    }
  ]
}
```

---

### 9.6 Related Objects Group

Used for discovery navigation.

```json id="8m4qt6"
{
  "related_objects": [
    {
      "id": "mars",
      "engine": "solar_system",
      "type": "planet",
      "name": "Mars"
    }
  ]
}
```

---

### 9.7 News / Research Groups

Used for linked knowledge.

```json id="6p2kx9"
{
  "news": [
    {
      "id": "news_item_id",
      "title": "Headline",
      "summary": "Short summary",
      "url": "https://...",
      "source": "NASA",
      "timestamp": "ISO-8601"
    }
  ],
  "research": [
    {
      "id": "paper_id",
      "title": "Paper title",
      "url": "https://...",
      "source": "arXiv",
      "timestamp": "ISO-8601"
    }
  ]
}
```

---

## 10. OBJECT VIEW LEVELS

Objects must support different levels of representation.

### 10.1 Scene Representation

Minimal representation for rendering.

Must include only what is necessary to:

* place object in scene
* identify object visually
* interact with object

### 10.2 Summary Representation

Used in:

* side panels
* lists
* search/discovery previews
* object cards

Must include:

* identity
* type
* engine
* short summary
* relevance if applicable

### 10.3 Detail Representation

Used in full object detail views.

Must include:

* all meaningful object fields
* media
* relationships
* related objects
* linked news/research where available

### Rule

```text id="9k3pv8"
Scene, summary, and detail are views of the same object,
not different object definitions.
```

---

## 11. OBJECT ROUTING RULE

### Rule

```text id="3q8mk7"
Every object must be routable to exactly one detail authority.
```

This means:

* `id` must resolve uniquely
* owning engine must be uniquely identifiable
* detail route must specify the fetch location for the object

Canonical conceptual route:

```text id="5v7pt2"
Click object → identify engine → load canonical object detail
```

---

## 12. OBJECT RELATIONSHIP RULE

Relationships do not change object ownership.

Example:

```text id="2m6qx4"
Aurora event
  owner: Earth Engine
  related to:
    solar flare (Solar Engine)
    CME (Solar Engine)
```

That does not make the aurora a Solar Engine object.

### Rule

```text id="8p2vk3"
Relationships create links, not ownership transfer.
```

---

## 13. OBJECT FRESHNESS RULE

Every object must support freshness awareness where applicable.

### Required freshness fields

* `timestamp`
* `last_updated`

### Purpose

This allows the system to:

* show current relevance
* identify stale data
* support trust and debugging
* rank scene relevance properly

### Rule

```text id="1q9mt5"
Objects must never pretend stale data is current.
```

---

## 14. OBJECT RANKING SUPPORT

Objects shown in scenes or panels may include a `relevance_score`.

Example:

```json id="4p8qx2"
{
  "relevance_score": 0.92
}
```

### Purpose

Used to:

* sort visible objects
* prioritize scene display
* choose top recommendations

### Rule

```text id="7m4pv1"
Ranking aids presentation.
It does not redefine object identity.
```

---

## 15. OBJECT PROVIDER MAPPING RULE

An object may originate from one or more external providers, but Astronomy Hub must expose only the canonical object model.

Provider-specific IDs may exist internally as metadata, but not as the public system identity.

Example internal metadata:

```json id="2t7mv8"
{
  "source_refs": [
    {
      "provider": "celestrak",
      "provider_id": "25544"
    }
  ]
}
```

### Rule

```text id="5x2qk9"
Provider references are implementation metadata, not object identity.
```

---

## 16. OBJECT REUSE RULE

If the same real-world entity appears in multiple contexts, it must still resolve to the same canonical object.

Examples:

* ISS in scene
* ISS in events panel
* ISS in search
* ISS in news link

All must resolve to the same object identity.

### Rule

```text id="9p3kt4"
One real thing should not become multiple unrelated objects in the system.
```

---

## 17. OBJECT DETAIL PAGE REQUIREMENTS

Every detail-capable object should support a common shell with engine-specific content.

The detail page should be able to display:

* identity
* type
* why it matters now
* data/specs
* position/trajectory if relevant
* media
* related objects
* linked news / research

### Rule

```text id="6q8pv3"
The shell may be shared, but the content remains engine-owned.
```

---

## 18. EVENT OBJECT MODEL

Event objects must include:

* canonical event id
* event type
* owning engine
* time window
* summary
* linked causing/affected objects where applicable

Example:

* flare event
* launch event
* earthquake event
* meteor event
* pass event

### Rule

```text id="4m2qx7"
An event becomes an object when it requires identity, routing, linkage, or detail.
```

---

## 19. OBJECT MODEL BY ENGINE (ILLUSTRATIVE)

### Earth Engine Objects

* earthquake
* aurora event
* weather event
* meteor/fireball event
* radiation anomaly zone if modeled as object

### Solar Engine Objects

* sunspot region
* flare event
* CME event

### Satellite Engine Objects

* tracked satellite
* spacecraft asset
* visible pass event

### Flight Engine Objects

* flight
* overflight event if modeled separately

### Solar System Engine Objects

* planet
* moon
* comet
* asteroid
* NEO
* spacecraft in solar-system context

### Deep Sky Engine Objects

* galaxy
* nebula
* cluster
* catalog target

### News / Knowledge Engine Objects

* news item
* research item
* media package if modeled as object

---

## 20. FORBIDDEN PATTERNS

The system must NOT:

* let the same real entity have multiple canonical IDs
* create objects with no owning engine
* expose raw provider schemas as object models
* mix scene-only marker data with full canonical object records
* allow object types to proliferate without governance
* route objects ambiguously
* invent engine ownership at the UI layer

---

## 21. VALIDATION CRITERIA

The object model is correct only if:

* every object has one owner
* every object has canonical identity
* scene, summary, and detail outputs refer to the same object
* related objects are linkable
* detail routing is deterministic
* object schemas remain consistent across the system

---

## 22. FAILURE CONDITIONS

The object model is broken if:

* two IDs represent the same real-world thing without intentional alias handling
* one object has multiple owning engines
* object schemas differ unpredictably
* object detail routing is ambiguous
* provider IDs leak into public canonical identity
* scenes and detail pages describe the same thing as if they were different entities

---

## 23. FINAL STATEMENT

```text id="8v3mk2"
The object model is the identity system of Astronomy Hub.

If object identity is weak,
detail routing breaks.
If detail routing breaks,
exploration breaks.
If exploration breaks,
the product fails.
```

## 24. PRACTICAL SUMMARY

In Astronomy Hub:

* Objects are first-class entities
* Every object has one owner
* Every object has one canonical identity
* Scene, summary, and detail are different views of the same object
* Relationships connect objects, but do not change ownership
* The frontend may present objects differently, but it must never redefine them
