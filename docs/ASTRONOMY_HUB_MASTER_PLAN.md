# 🌌 ASTRONOMY HUB — MASTER SYSTEM PLAN

**Goal:** Build a lightweight, web-based, location-aware astronomy intelligence hub that aggregates *everything happening in space and sky* into a single unified interface.

---

# 1. 🧭 SYSTEM VISION

A user opens the ORAS website → enters location → instantly sees:

* What’s above them **right now**
* What’s coming **tonight / this week**
* What’s happening **globally in space**
* Alerts for **major events**
* Ability to explore:

  * Satellites
  * Solar activity
  * Astronomical events
  * Earth-space interactions

**Design Philosophy:**

* Lightweight (Raspberry Pi capable backend)
* Client-heavy rendering (browser/WebGL)
* Modular (feature-based expansion)
* API-first aggregation (no heavy computation locally)

---

# 2. 🧱 CORE ARCHITECTURE

## 2.1 Frontend (User Interface)

* WordPress Plugin (primary portal)
* Optional standalone web app (future)
* Tech:

  * Vanilla JS or React (lightweight)
  * WebGL via **CesiumJS** or **Three.js**
  * Mobile-first responsive UI

---

## 2.2 Backend (Lightweight Aggregator)

* Hosted on Raspberry Pi / Ubuntu server
* Responsibilities:

  * Fetch + cache data (cron jobs)
  * Normalize API responses
  * Serve lightweight JSON

---

## 2.3 Data Flow

```
External APIs → Pi Aggregator → Cached JSON → WordPress Plugin → Browser Rendering
```

---

# 3. 📡 DATA SOURCES (CORE INTELLIGENCE LAYER)

## 3.1 Satellite Tracking

* TLE Data (Celestrak, Space-Track)
* Satellite metadata:

  * Name, NORAD ID
  * Orbit type (LEO, GEO)
  * Purpose (communications, military, science)

---

## 3.2 Astronomy Events

* NASA / JPL APIs
* Minor Planet Center (comets, asteroids)
* Meteor showers database
* Eclipse databases

---

## 3.3 Space Weather / Solar

* NOAA SWPC
* NASA Solar Dynamics Observatory
* Data:

  * Solar flares
  * CMEs
  * Sunspots
  * Geomagnetic storms

---

## 3.4 Earth + Observation Conditions

* Weather APIs (cloud cover, visibility)
* Light pollution maps
* Atmospheric seeing conditions (future)

---

## 3.5 Alerts / Transients

* Gamma-ray burst feeds
* Supernova alerts
* Astronomical Telegram feeds (if accessible)

---

## 3.6 Earth Observation Imagery (Optional)

* Sentinel Hub
* Landsat (delayed imagery)

---

# 4. 🧠 CORE FEATURE MODULES

---

## 4.1 LOCAL SKY ENGINE (FOUNDATION)

User inputs location → system calculates:

* Visible satellites (next passes + times)
* Visible planets
* Moon phase + position
* Current constellations
* Upcoming events (next 24–72 hrs)

**Output:**

* Timeline
* Sky map
* “Look here” guidance

---

## 4.2 SATELLITE INTELLIGENCE SYSTEM

Features:

* Real-time satellite positions (approximate via TLE)
* Satellite passes (ISS, Starlink, etc.)
* Satellite detail view:

  * Owner
  * Mission
  * Orbit path
* Filtering:

  * Visible only
  * Brightest passes
  * Specific satellite groups

---

## 4.3 GLOBAL SPACE MAP

Interactive globe showing:

* Satellite orbits
* Eclipse paths
* Meteor impacts (if available)
* Solar storm effects (aurora zones)

Zoom levels:

* Local → Regional → Global

---

## 4.4 EVENT FEED (CRUCIX-STYLE)

Feed system:

* Priority-based events
* Categories:

  * 🚨 Major (solar storm, comet, eclipse)
  * 🌠 Observational (meteor shower peak)
  * 🛰 Satellite events
* Sorting:

  * Relevance to user location
  * Severity / importance

---

## 4.5 SOLAR DASHBOARD

Dedicated “Sun” tab:

* Live solar imagery (if available)
* Flare tracking
* CME direction
* Impact predictions (Earth-facing events)

---

## 4.6 AUGMENTED SKY GUIDE (KEY FEATURE)

User taps **“Guide Me”**:

* Phone orientation used (future: sensors)
* Displays:

  * “Look 45° NE”
  * “Object located near Orion”
* Optional:

  * AR overlay (future phase)

---

## 4.7 OBSERVATORY & SCIENCE LAYER (ADVANCED)

* Show major observatories:

  * Location
  * What they’re observing (if public)
* Integration with:

  * Citizen science (future)

---

## 4.8 HISTORICAL + REPLAY MODE

* Past satellite paths
* Past sky conditions
* Replay:

  * “What did the sky look like last night?”

---

## 4.9 USER CUSTOMIZATION

* Alerts:

  * ISS passes
  * Meteor showers
  * Solar storms
* Saved locations
* Preferences:

  * Visual complexity
  * Notification thresholds

---

# 5. 🗺️ VISUALIZATION STRATEGY

---

## 5.1 SKY VIEW (PRIMARY)

* Dome-style sky projection
* Objects plotted:

  * Stars
  * Satellites
  * Events
* Minimal GPU usage

---

## 5.2 3D SPACE VIEW (OPTIONAL MODE)

* Simplified orbit visualization
* Toggle:

  * “Performance Mode”
  * “Enhanced Mode”

---

## 5.3 EARTH GLOBE VIEW

* CesiumJS lightweight globe
* Overlays:

  * Satellite paths
  * Event zones

---

# 6. ⚙️ PHASED DEVELOPMENT PLAN

---

## 🔹 PHASE 1 — FOUNDATION (MVP)

**Goal:** Local sky awareness

* Location input
* Basic satellite passes
* Basic astronomy events
* Simple sky map
* WordPress plugin UI
* Backend cache system

---

## 🔹 PHASE 2 — GLOBAL CONTEXT

* Globe view
* Event feed system
* Satellite filtering
* Multi-location support

---

## 🔹 PHASE 3 — INTELLIGENCE LAYER

* Satellite metadata enrichment
* Solar data integration
* Weather + visibility layer
* Alerts system

---

## 🔹 PHASE 4 — IMMERSIVE EXPERIENCE

* “Guide Me” directional system
* Advanced sky rendering
* Mobile optimization

---

## 🔹 PHASE 5 — ADVANCED DATA + SCIENCE

* Observatory integrations
* Transient events (supernova, GRB)
* Historical replay

---

## 🔹 PHASE 6 — POLISH + PUBLIC RELEASE

* Performance optimization (Pi-ready)
* UI/UX refinement
* Accessibility modes
* Documentation + onboarding

---

# 7. 🧮 PERFORMANCE STRATEGY (CRITICAL)

To stay Raspberry Pi compatible:

* Pre-cache all data (cron jobs)
* No real-time heavy calculations
* Limit satellites per query (filtering)
* Use simplified math (SGP4 libraries lightweight)
* Lazy-load visual layers

---

# 8. 🚀 EXPANSION IDEAS (FUTURE)

* AI assistant (“What should I look at tonight?”)
* Voice interaction
* Astrophotography planner
* Telescope integration
* Live sky camera feeds
* Community reports

---

# 9. 🧠 KEY INSIGHT (IMPORTANT)

This system is **NOT one app**
It is a **data orchestration engine + visualization layer**

You are building:

> “A civilian space awareness command center”

---

# 10. 📌 FINAL BUILD STRATEGY

Start with:

> Local Sky → Then Expand Outward

NOT:

> Global → Then Try to Personalize