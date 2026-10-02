# `ASTRONOMY_HUB_DIAGRAM.md`

---

# ASTRONOMY HUB — SYSTEM DIAGRAM (AUTHORITATIVE)

---

## PURPOSE

Defines the **actual product structure, interaction model, and rendering authority** of Astronomy Hub.

This is a **product-definition document**, not a UI mock.

It defines:

* how the system behaves
* how engines interact
* how users move through the system

---

## CORE LAW

```text
Any mounted viewport is owned by its active engine. Decision pages need no renderer.
```

---

## SYSTEM MODEL

```text
Hub → Engine → Scene → Object → Detail → Exploration
```

---

## PUBLIC SCREEN STRUCTURE

```text
ORAS Astronomy Hub — shared accessible navigation
├── Home /: hero → Tonight summary → Observe Now / current conditions → Sky entry
├── Observe /observe: observer/time → categories → targets → selected detail
├── Tonight /tonight: evening date → darkness/Moon/forecast → opportunities
└── Sky /sky-engine: shared navigation → contained Stellarium viewport
```

Home, Observe and Tonight are decision surfaces; they do not mount a renderer.
Opening Sky mounts one contained runtime. `/oras-sky-engine/` remains the
standalone engine surface. The older command/control-panel diagram is not the
public Home layout.

---

## VIEWPORT RULE (NON-NEGOTIABLE)

```text
Viewport = Active Engine Scene
```

When Sky is opened, the viewport:

* is the Sky interaction surface
* is not decorative
* is not a preview
* is not controlled by the hub

---

## HUB RESPONSIBILITY

The hub:

* selects context
* aggregates feeds
* routes interactions

The hub must NOT:

* render scenes
* own objects
* override engine behavior

---

## ENGINE RESPONSIBILITY

Engines:

* own objects
* define scenes
* control rendering behavior
* define interaction logic

---

## ENGINE SET

```text
Sky Engine
Earth Engine
Solar System Engine
Sun Engine
Satellite Engine
Flight Engine
Deep Sky Engine
```

---

## ENGINE → VIEWPORT MAPPING

| Scope / Action | Result              |
| -------------- | ------------------- |
| Above Me       | Sky Engine          |
| Earth          | Earth Engine        |
| Sun            | Sun Engine          |
| Satellites     | Earth/Satellite     |
| Flights        | Earth/Flight        |
| Solar System   | Solar System Engine |
| Deep Sky       | Sky or Deep Sky     |

---

## CLICK BEHAVIOR (CRITICAL)

---

### Feed Interaction

```text
Feed Click →
  route to correct engine →
  update viewport →
  focus object →
  open detail
```

---

### Object Interaction (Viewport)

```text
Click Object →
  open detail →
  show related paths →
  allow deeper navigation
```

---

### Exploration Rule

```text
Object → Detail → Related → Deeper Exploration
```

No dead ends allowed.

---

## ABOVE ME MODE

Primary system mode.

```text
User selects Above Me →
  hub aggregates:
    sky objects
    planets
    conditions
    events
    satellites (later)
  →
  ranked output →
  Sky Engine renders viewport →
  feeds provide context
```

---

## DATA FLOW

```text
Frontend (Hub + Viewport)
        ↓
Backend (Scene Resolver + Engines)
        ↓
Data Layer (APIs + Catalogs + Ingestion)
```

---

## RENDERING STACK

```text
Contained Stellarium Web Engine → Sky Host Viewport
```

---

## ENGINE ARCHITECTURE

```text
Hub Shell
   ↓
Active Engine Viewport
   ↓
Engine Systems
   ├─ Sky
   ├─ Earth
   ├─ Solar System
   ├─ Sun
   ├─ Satellite
   ├─ Flight
   └─ Deep Sky
```

---

## CRITICAL RULES

---

### Rule 1 — Single Scene

```text
Only one active scene at a time
```

---

### Rule 2 — Engine Ownership

```text
Every object belongs to exactly one engine
```

---

### Rule 3 — No Hub Rendering

```text
Hub does not render scenes
```

---

### Rule 4 — No Dead Ends

```text
Every object must lead to deeper exploration
```

---

### Rule 5 — Routing Must Be Correct

```text
Object must route to correct engine
```

---

## FINAL PRINCIPLE

```text
The hub decides what matters.
The engine shows reality.
The user explores without limits.
```

---

