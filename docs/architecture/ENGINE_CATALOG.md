# `ENGINE_CATALOG.md`

---

# ENGINE CATALOG

---

## PURPOSE

Defines all engines in Astronomy Hub and their responsibilities.

This is a **reference inventory**, not an execution plan.

CURRENT: contained SWE Sky and owned Cesium Earth, bounded workspace/bridge/
serial lifecycle and source-backed layers, qualified locally under C0–C5.6.
[Unified Universe Architecture](UNIFIED_UNIVERSE_ARCHITECTURE.md) defines current
ownership; [ADR0009](decisions/0009-owned-earth-feature-reuse.md) supersedes full-app
Earth topology. Prefer qualified pinned feature reuse/wrapping, never upstream app
or Viewer singleton. PLANNED: broader Earth parity, global mapping/terrain/3D,
planetary surfaces and astronomy extensions. OPEN: solar-system-scale renderer,
provider/public-host/physical-device gates. Domain lists describe scope, not proof.


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

* contained Stellarium Web / Stellarium Web Engine runtime at `/oras-sky-engine/`

### Responsibilities

* render sky from user location and time
* provide primary interaction surface
* support object selection and highlighting
* serve as the base context for observational decisions
* own observer, projection, and render flow for sky behavior

### Notes

* `/api/above-me` provides curated discovery; the Sky Engine renders selected sky objects
* Other engines may provide source-backed candidates, but do not control Sky Engine rendering
* Sky Engine must remain self-contained and mounted through thin Hub interfaces
* The runtime follows Stellarium's own core → observer → projection → modules → render lifecycle

---

## Earth Mode (CURRENT bounded foundation; broader capabilities gated)

Hub owns the independently built Cesium Viewer, camera/layers/selection/credits/
lifecycle and justified FastAPI paths. Selected God's Eye exports are reused;
stronger science/security guards remain justified. Preserve applicable aircraft,
satellites, ships, CCTV, traffic, environment, imagery/terrain and infrastructure
in the [Earth capability plan](../execution/EARTH_CAPABILITY_PLAN.md), subject to
scope/source/hook/provider/data/asset rights and owner approval. Omission today is
not blanket rejection; current29-layer pin does not imply29 qualified Hub layers.

Current aircraft is observer-bounded; Earth satellites are stations-only/cap100/
15s; Weather is modeled observer-point data, with separate CONUS radar snapshot.
HD is bounded CONUS; terrain/3D and most upstream products are unqualified.
Broader astronomy additions stay external adapters/extensions and separately gated.

## Planet Mode (PLANNED)

Body-aware Cesium surfaces with qualified body-specific imagery/terrain/context;
Mars is the first proof, Moon and other supported bodies may follow. Earth-only
layers do not apply to other worlds. Gas giants may need atmospheric/globe views.

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

* normalized identity/TLE releases, freshness/provenance and local propagation (current source paths)
* Earth stations-only15s propagation/selection exists; broader tracking/populations unqualified
* qualified passes (future); legacy passes are not production-grade
* unknown brightness must remain unavailable, never invented

### Behavior

* Sky satellite authority and Earth stations-source paths are distinct current paths; do not claim a unified population
* God's Eye orbit/tracking behavior may be reused after qualification
* identity/time/provider/frame reconciliation remains open

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

* current Earth observer100NM path exists, audit503 unavailable; home-altitude display gates separately proven
* study and likely adapt God's Eye providers/layers, fallback, freshness and tracking
* future real-position-to-ORAS azimuth/elevation/range projection needs qualification
* local ORAS ADS-B receiver is an optional future differentiator

---

## 🌦 CONDITIONS SUB-ENGINE (EARTH LAYER)

### Purpose

Local observational conditions within Earth context

### Outputs

* cloud cover
* atmospheric conditions
* visibility overlays

### Behavior

* current modeled observer point; separate CONUS radar snapshot, not a full weather map
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

## Solar-System-Scale Navigation (PLANNED; renderer OPEN)

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

* future cross-body/scale navigation with controlled renderer handoffs
* compatibility study must assess SWE capability versus a justified dedicated scene
* no solar-system-scale renderer selected here; Planet surfaces are a separate Cesium direction

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
| Planet (surface exploration) | PLANNED Planet Mode / body-aware Cesium |
| Cross-body navigation | PLANNED solar-system scale; renderer OPEN |
| Deep Sky Object    | Sky Engine (current sky view)    |
| Satellite          | Sky Engine (current sky view)    |
| Flight             | Current bounded owned Earth adapter; broader scope/future Sky projection unqualified |
| Conditions         | Conditions Engine OR Earth Layer |
| Solar Event        | Solar Engine                     |

---

## RENDERING OWNERSHIP

Primary engines own rendering context:

* Sky Engine → contained Stellarium Web Engine rendering
* CURRENT Earth Mode → owned Cesium runtime with bounded pinned feature reuse; broader parity gated
* PLANNED Planet Mode → body-aware Cesium with qualified body data
* OPEN solar-system-scale renderer → evaluate SWE capability before deciding
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

The public entry `/` opens the Sky-first workspace; `/sky-engine` is an alias
workspace route and `/earth` selects Earth. Observe/Tonight remain focused routes.
Only the selected heavy runtime is mounted; this is not the older PR52 decision homepage.

---

## FINAL RULE

> Engines define domains.
> The Hub defines importance.
