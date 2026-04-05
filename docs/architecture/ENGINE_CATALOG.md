# `ENGINE_CATALOG.md`

---

# ENGINE CATALOG

---

## PURPOSE

Defines all engines in Astronomy Hub and their responsibilities.

This is a **reference inventory**, not an execution plan.

---

# PRIMARY ENGINES

---

## 🌌 SKY ENGINE (PRIMARY)

### Purpose

Primary observational sky system.

This is the **default engine of the system** and the foundation of the "Above Me" experience.

### Objects

* stars
* constellations
* visible planets
* deep sky objects

### Outputs

* visible sky objects
* positional data
* object interaction targets

### Visualization

* 3D sky dome (Babylon.js)

### Responsibilities

* render sky from user location and time
* provide primary interaction surface
* support object selection and highlighting
* serve as the base context for observational decisions

### Notes

* All “Above Me” rendering originates from this engine
* Other engines may feed data into this context, but do not replace it

---

## 🌍 EARTH ENGINE

### Purpose

Earth-centered geospatial environment for:

* global events
* atmosphere
* near-Earth space
* environmental conditions affecting observation

### Visualization

* 2D map
* 3D globe

### Responsibilities

* Earth-based rendering context
* layer coordination
* event visualization
* environmental awareness

---

### SUB-ENGINES (EARTH ENGINE)

---

## 🛰️ SATELLITE SUB-ENGINE

### Purpose

Orbital tracking within Earth context

### Objects

* ISS
* Starlink
* satellites

### Outputs

* visible passes
* orbital paths
* brightness

### Behavior

* rendered as a layer within Earth Engine
* supports trajectory visualization
* integrates with sky context when needed

---

## ✈️ FLIGHT SUB-ENGINE

### Purpose

Atmospheric aircraft tracking

### Objects

* commercial flights
* overhead aircraft

### Outputs

* altitude
* direction
* origin/destination

### Behavior

* rendered as a layer within Earth Engine
* supports identification of objects seen in the sky

---

## 🌦 CONDITIONS SUB-ENGINE (EARTH LAYER)

### Purpose

Local observational conditions within Earth context

### Outputs

* cloud cover
* atmospheric conditions
* visibility overlays

### Behavior

* rendered as an Earth overlay
* tied to geographic location
* informs observational viability

---

# 🌦 CONDITIONS ENGINE (PRIMARY / DUAL ROLE)

### Purpose

Global observability intelligence

### Outputs

* visibility score
* sky quality
* cloud coverage
* light pollution impact

### Responsibilities

* influence hub ranking
* determine observation viability
* provide global and local observability context

### Dual Role

* operates independently as a primary engine
* also functions as a sub-engine within Earth Engine

---

## ☀️ SOLAR ENGINE

### Purpose

Solar activity monitoring

### Objects

* sunspots
* solar flares
* CMEs

### Outputs

* solar events
* activity levels
* solar imagery references

### Visualization

* solar map
* rotating solar globe

---

## 🪐 SOLAR SYSTEM ENGINE

### Purpose

3D planetary system exploration

### Objects

* planets
* moons
* comets
* asteroids
* spacecraft

### Outputs

* positions
* orbital paths
* spatial relationships

### Visualization

* 3D system model
* zoomable planetary views

---

## 🌌 DEEP SKY ENGINE

### Purpose

Astronomical observation targets

### Objects

* galaxies
* nebulae
* clusters

### Outputs

* visible targets
* telescope recommendations
* observational difficulty

---

## 📰 NEWS & KNOWLEDGE ENGINE

### Purpose

Cross-domain information

### Outputs

* scientific news
* mission updates
* research context

### Behavior

* links to objects across all engines
* provides contextual enrichment

---

## ⚡ TRANSIENT EVENTS ENGINE

### Purpose

Short-lived phenomena

### Objects

* meteor events
* fireballs
* transient astronomical events

### Outputs

* event detection
* timing
* visibility windows

---

# ENGINE RELATIONSHIP MODEL

---

## PRIMARY / SUB / DUAL STRUCTURE

```text
Sky Engine (default)

Earth Engine
 ├── Satellite Sub-Engine
 ├── Flight Sub-Engine
 └── Conditions Sub-Engine

Conditions Engine (Primary + Sub)
```

---

## ROUTING RULES

| Object Type        | Target                           |
| ------------------ | -------------------------------- |
| Star               | Sky Engine                       |
| Planet (sky view)  | Sky Engine                       |
| Planet (deep view) | Solar System Engine              |
| Deep Sky Object    | Deep Sky Engine                  |
| Satellite          | Earth Engine → Satellite Layer   |
| Flight             | Earth Engine → Flight Layer      |
| Conditions         | Conditions Engine OR Earth Layer |
| Solar Event        | Solar Engine                     |

---

## RENDERING OWNERSHIP

Primary engines own rendering context:

* Sky Engine → sky rendering (Babylon.js)
* Earth Engine → globe rendering
* Solar System Engine → planetary rendering
* Solar Engine → solar visualization

Sub-engines:

* do NOT own rendering
* operate as layers within parent engine

---

## EXECUTION RULES

* Only one primary engine is active at a time
* Sub-engines activate only within their parent engine
* The active engine defines the current scene

---

## DEFAULT SYSTEM ENTRY

The system always starts in:

```text
Sky Engine (Above Me context)
```

---

## FINAL RULE

> Engines define domains.
> The Hub defines importance.
