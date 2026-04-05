Below is the **final, fully re-rewritten** version of your master plan—now incorporating:

* engine-based architecture
* scope system
* scene instancing (your Guild Wars 2 insight)
* client-heavy rendering + Pi backend reality
* full dream-level capability without breaking feasibility

This is now your **authoritative vision document**.

---

# 🌌 ASTRONOMY HUB — MASTER SYSTEM PLAN (AUTHORITATIVE)

---

# 0. CORE IDENTITY

Astronomy Hub is a **real-time, multi-engine astronomy intelligence system**.

It is a **command center for Earth, sky, and space** that allows a user to:

* understand what is happening **above them right now**
* explore **Earth, Sun, satellites, and the solar system**
* investigate **any object or event in detail**
* navigate across **scales of reality** (local → global → cosmic)

---

# 1. 🧭 SYSTEM VISION

A user opens Astronomy Hub and can instantly:

* see what is above them in the sky
* understand what is happening on Earth
* observe solar activity in real time
* explore satellites and flights around the planet
* navigate the solar system in 3D
* investigate deep space objects like M13
* access images, research, and news tied to any object

---

## The system answers:

> “What is happening right now — and what does it mean?”

And allows the user to expand that into:

> “Show me everything about it.”

---

# 2. 🧠 CORE PHILOSOPHY

---

## 2.1 Power with Control

* The system is **extremely powerful**
* The system is **never overwhelming**

Rule:

> Everything exists. Only what is observable from the users location is shown.

---

## 2.2 Engine-Based Architecture

Astronomy Hub is built as a federation of **independent intelligence engines**.

Each engine:

* owns a domain
* ingests its own data
* structures its knowledge
* exposes filtered outputs
* is a self contained reality for that topic

---

## 2.3 Filter-Based Interaction Model

Each engine contains all relevant data for its own topic. But can filter that data to the main front page (hub)

A filter:

* defines what subset of the engine is active
* determines what data is processed
* determines what is rendered

Rule:

> Only the active filter drives computation and display.

---

## 2.4 Scene-Based Instancing (CRITICAL)

The system behaves like an **instanced environment**:

* only the current scene (engine window) is active
* only relevant data is processed
* only visible objects are rendered (unless user selects a non-viewable object to read more about.)

Rule:

> The system computes only what the user is currently looking at.

---

## 2.5 Client-Heavy Rendering

* Browser handles:

  * 3D rendering
  * map/globe visualization
  * object interaction
  * scene transitions

* Backend handles:

  * aggregation
  * normalization
  * caching
  * distribution

---

## 2.6 Deterministic Core

* No AI dependency for system truth
* All outputs must be explainable
* AI is optional and additive only

---

# 3. 🌍 SYSTEM STRUCTURE

---

## Key Concepts

### Engine

A domain authority (Earth, Sun, Satellites, etc.)

### Filter

The active data focus inside an engine

### Scene

What is currently being rendered

### Scope

The scale of the system:

* Above Me (Hub - Main screen)
* Earth
* Moon
* News
* Sun
* Solar System
* Deep Sky Obejects
* Galaxy (future)

### Object

A clickable entity:

* satellite
* planet
* earthquake
* sunspot
* flight
* deep sky object
* new items

---

# 4. 🧠 ENGINE SYSTEM (AUTHORITATIVE)

---

## 🌍 4.1 EARTH ENGINE

Earth as a dynamic system.

### Filters:

* weather
* cloud cover
* earthquakes
* volcanic activity
* meteor/fireball events
* radiation
* geomagnetic field
* aurora zones
* light pollution
* Satellites
* flights

### Visualization:

* 2D map
* 3D globe

### Purpose:

Understand what is happening on Earth and how it affects observation.

---

## ☀️ 4.2 SOLAR ENGINE

Live solar intelligence.

### Filters:

* sunspots
* solar flares
* CMEs
* magnetic activity
* solar imagery

### Visualization:

* solar map
* rotating solar globe

---

## 🛰️ 4.3 SATELLITE ENGINE (Sub-Engine of Earth Engine)

Orbital intelligence.

### Filters:

* visible passes
* Starlink
* communication satellites
* science satellites
* Lagrange / deep space assets

### Data:

* orbit
* ownership
* mission
* brightness
* position

---

## ✈️ 4.4 FLIGHT ENGINE (Sub-Engine of Earth Engine)

Atmospheric tracking.

### Filters:

* all flights
* above-horizon flights
* high altitude flights

### Purpose:

Differentiate aircraft from space objects.

---

## 🪐 4.5 SOLAR SYSTEM ENGINE

3D planetary system.

### Filters:

* planets
* moons
* comets
* asteroids
* NEOs
* spacecraft
* orbital alignment

### Features:

* real-time 3D system
* zoom into planets
* object-level exploration

---

## 🌌 4.6 DEEP SKY ENGINE

Galactic objects.

### Filters:

* galaxies
* nebulae
* clusters
* visible tonight
* telescope targets

### Data:

* imagery
* research
* observation data

---

## 📰 4.7 NEWS & KNOWLEDGE ENGINE

Cross-domain intelligence.

### Organized by engine:

* Earth news
* solar activity news
* satellite launches
* planetary missions
* scientific discoveries

---

# 5. 🎛️ MAIN ENGINE (UNIFIED SYSTEM)

---

## 5.1 Scope Selection

User selects:

* Above Me
* Earth
* Sun
* Satellites
* Flights
* Solar System
* Deep Sky

---

## 5.2 “WHAT’S ABOVE ME” MODE

This is the core experience.

The system merges:

* visible satellites
* visible planets
* deep sky objects
* flights
* events

Filtered by:

* location
* time
* horizon
* visibility

---

## 5.3 Object Interaction

User clicks any object:

System routes to correct engine:

* satellite → Satellite Engine
* planet → Solar System Engine
* M13 → Deep Sky Engine

Then displays:

* images
* data
* news
* research
* related events

---

# 6. ⚙️ ARCHITECTURE

---

## Backend (Raspberry Pi)

* FastAPI runtime
* PostgreSQL + PostGIS
* Redis (cache + queue)
* scheduled ingestion
* normalized contracts

Responsibilities:

* fetch
* normalize
* cache
* serve

---

## Frontend (Browser)

* React-based UI
* WebGL (Three.js / CesiumJS)
* scene rendering
* object interaction
* dynamic loading

Responsibilities:

* render scenes
* manage filters
* handle exploration

---

## Data Strategy

* ingest minimal authoritative sources
* normalize aggressively
* cache results
* precompute summaries

---

# 7. 🚀 PERFORMANCE MODEL

---

## Core Rule

> The system does not compute the universe.
> It computes the current scene.

---

## Constraints

* only active engine runs
* only active filter is processed
* only visible objects are rendered
* detail loads on demand

---

## Result

* scalable system
* responsive UI
* realistic backend load

---

# 8. 🌐 LONG-TERM VISION

Astronomy Hub evolves into:

* a global astronomy intelligence platform
* a research exploration system
* a public-facing space awareness tool
* a community-driven ecosystem

Future possibilities:

* plugins
* AI-assisted insights
* historical replay
* predictive modeling

---

## 8.1 EXECUTION PHASE MAPPING (REFERENCE)

This section maps the execution phase system to the vision above.
It clarifies alignment only and does not replace phase authority documents.

* Phase 1 — Command Center (Above Me): single mounted command-center surface for immediate sky decisions.
* Phase 2 — Engine System: user-controlled Scope → Engine → Filter expansion across supported domains.
* Phase 3 — Spatial / Immersive System: immersive mode coexists with command center; command center remains default primary surface.
* Phase 4 — Knowledge Graph / Relationship System: canonical graph-backed, typed, cross-engine relationship navigation.
* Phase 5 — Prediction / Personalization System: deterministic, explainable prediction, alerts, timeline, and optional user personalization.

---

# 9. 🔥 FINAL STATEMENT

> Astronomy Hub is a unified command center for Earth, sky, and space—allowing users to explore reality from their location to the structure of the cosmos.

It begins with:

> “What is above me right now?”

And expands into:

> “Show me everything.”

---

# ✔️ What This Version Achieves

This version:

* restores your original vision
* introduces engine architecture
* introduces filters (correct model)
* introduces instanced scene computation
* keeps system technically feasible
* aligns with Raspberry Pi + browser reality
* prevents future drift
