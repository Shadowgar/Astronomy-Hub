# ENGINE CATALOG

---

## PURPOSE

Defines all engines in Astronomy Hub and their responsibilities.

This is a **reference inventory**, not an execution plan.

---

# PRIMARY ENGINES

---

## 🌍 EARTH ENGINE

### Purpose

Earth-centered geospatial environment for:

* global events
* atmosphere
* near-Earth space
* observational context

### Visualization

* 2D map
* 3D globe

### Responsibilities

* Earth-based rendering context
* layer coordination
* event visualization

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

* rendered as a layer
* supports trajectory visualization

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

* rendered as a layer
* supports identification of objects in sky

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

---

# 🌦 CONDITIONS ENGINE (PRIMARY)

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
* provide global/local observability context

### Dual Role

* operates independently
* also functions as sub-engine in Earth Engine

---

# ☀️ SOLAR ENGINE

### Purpose

Solar activity monitoring

### Objects

* sunspots
* solar flares
* CMEs

### Outputs

* solar events
* activity levels

---

# 🪐 SOLAR SYSTEM ENGINE

### Purpose

3D planetary system exploration

### Objects

* planets
* moons
* comets
* asteroids

### Outputs

* positions
* orbital paths

---

# 🌌 DEEP SKY ENGINE

### Purpose

Astronomical observation targets

### Objects

* galaxies
* nebulae
* clusters

### Outputs

* visible targets
* telescope recommendations

---

# 📰 NEWS & KNOWLEDGE ENGINE

### Purpose

Cross-domain information

### Outputs

* scientific news
* mission updates

---

# ⚡ TRANSIENT EVENTS ENGINE

### Purpose

Short-lived phenomena

### Objects

* meteor events
* fireballs

---

# ENGINE RELATIONSHIP MODEL

---

## PRIMARY / SUB / DUAL

```text
Earth Engine
 ├── Satellite Sub-Engine
 ├── Flight Sub-Engine
 └── Conditions Sub-Engine

Conditions Engine (Primary + Sub)
```

---

## ROUTING RULES

| Object Type | Target                           |
| ----------- | -------------------------------- |
| Satellite   | Earth Engine → Satellite Layer   |
| Flight      | Earth Engine → Flight Layer      |
| Conditions  | Conditions Engine OR Earth Layer |
| Planet      | Solar System Engine              |
| Deep Sky    | Deep Sky Engine                  |
| Solar Event | Solar Engine                     |

---

## EXECUTION NOTE

* Only one primary engine active at a time
* Sub-engines only active within parent engine

---

## FINAL RULE

> Engines define domains.
> The Hub defines importance.
