# 🌌 ASTRONOMY HUB — UI INFORMATION ARCHITECTURE (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **How the user navigates, understands, and interacts with Astronomy Hub**

It establishes:

* UI structure
* navigation model
* layout hierarchy
* interaction flow
* system boundaries

This is the **UI structural law** of the system.

---

# 1. 🧠 CORE MODEL (MANDATORY)

---

## Primary Flow

```text id="z7v3k1"
Scope → Engine → Filter → Scene → Object → Detail → Return
```

---

## Rule

```text id="c9f2x6"
All UI behavior must follow this model.

No alternative navigation systems are allowed.
```

---

# 2. 🧱 PRIMARY UI REGIONS

The interface is divided into **five permanent regions**.

---

## 2.1 Command Bar (Top — Always Visible)

---

### Purpose

Global control of system context.

---

### Must Include

* Scope selector
* Engine selector
* Filter selector
* Time control (active in later phases, reserved now)
* Location indicator
* Global actions (settings, profile, help)

---

### Behavior

* updates global state
* triggers scene updates
* never disappears
* always reflects current context

---

## 2.2 Primary Command-Center Surface (Center — Dominant Region in Phase 1)

---

### Purpose

The **core mounted product surface** of the system in Phase 1 (command-center module grid shell).

---

### Rule

```text id="h1q3zp"
In Phase 1, the mounted command-center surface is the most important element on screen.
It is fed by canonical scene-backed data.
```

---

### Behavior

Changes based on:

* scope
* engine
* filter

---

### Examples

* operations modules (conditions, targets, alerts/events, passes, moon/news)
* scene-backed object context for Above Me
* ObservingHero (optional/non-default; not mounted in the current default Phase 1 runtime)

---

### Requirements

* must be interactive
* must expose object-focused context
* must reflect real scene-backed data
* must never present competing product truths outside the canonical scene-backed source

---

## 2.3 Live Intelligence Panel (Right Side)

---

### Purpose

Explain what is happening **right now**.

---

### Must Include

* observing summary
* top recommendations
* active alerts
* contextual insights

---

### Behavior

* updates with scene
* reflects current filter
* supports quick understanding

---

### Rule

```text id="y6x3rt"
This panel answers: "What matters right now?"
```

---

## 2.4 Context Panels (Bottom Region)

---

### Purpose

Provide structured supporting information.

---

### Required Panels

---

### 2.4.1 Objects Panel

* visible objects list
* categorized (satellite, planet, etc.)
* sorted by relevance

---

### 2.4.2 Events Panel

* active events
* upcoming events
* time-sensitive items

---

### 2.4.3 News Panel

* 3–5 items maximum
* linked to objects or events

---

### Rule

```text id="5q8rzt"
Bottom panels support the command-center context.
They are fed by scene-backed data, not separate product truths.
They must never compete with it.
```

---

## 2.5 Object Detail View (Overlay or Route)

---

### Purpose

Provide full information about any object.

---

### Trigger

```text id="u2k9x1"
User clicks object → Detail view opens
```

---

### Must Include

* object identity
* explanation
* why it matters now
* data / specs
* media
* related objects

---

### Behavior

* must preserve context
* must allow easy return
* must not reset scene state

---

# 3. 🔁 NAVIGATION SYSTEM

---

## 3.1 Navigation Model

```text id="8y2lq4"
Main → Scope → Engine → Filter → Scene → Object → Detail → Back
```

---

## 3.2 Return Behavior

```text id="4p9zv1"
Detail → Back → SAME scene state
```

---

## 3.3 Rule

```text id="r7w2mt"
Navigation must be state-driven, not page-driven.
```

---

# 4. 🎛️ SCOPE SYSTEM IN UI

---

## Supported Scopes

* Above Me
* Earth
* Sun
* Satellites
* Flights
* Solar System
* Deep Sky

---

## Behavior

* switching scope changes entire scene
* updates engine + filter context
* resets irrelevant state

---

---

# 5. 🧠 ENGINE SYSTEM IN UI

---

## Rule

```text id="g2t7mz"
Only one engine is active at a time
(except Above Me merge mode)
```

---

## Behavior

* engine determines data source
* engine determines scene type
* engine determines available filters

---

# 6. 🔍 FILTER SYSTEM IN UI

---

## Rule

```text id="q8j4lx"
Only one filter is active per engine
```

---

## Behavior

* filter changes scene content
* filter must visibly affect output
* filter must be clearly indicated

---

## Failure if:

* filter does not change scene
* user cannot tell which filter is active

---

# 7. 🔍 OBJECT INTERACTION MODEL

---

## All objects must:

* be visible
* be selectable
* have hover state
* have click state

---

## Click Behavior

```text id="k2v9re"
Click → Open Detail View
```

---

## Object Types

* satellite
* planet
* deep sky
* flight
* Earth event
* solar event

---

# 8. 🧠 “ABOVE ME” MODE (SPECIAL CASE)

---

## Behavior

* merges multiple engines
* filters by visibility
* ranks by relevance

---

## Must Include

* satellites
* planets
* deep sky
* flights

---

## Rule

```text id="x5v2nb"
Only objects above horizon are shown
```

---

# 9. 📊 INFORMATION HIERARCHY

---

## Priority Order

1. Command-Center Primary Surface
2. Selected Object
3. Live Intelligence Panel
4. Context Panels
5. Metadata

---

## Rule

```text id="b7m3xt"
If everything is important, nothing is important.
```

---

# 10. 📱 RESPONSIVE STRUCTURE

---

## Desktop

* full layout visible
* command-center surface dominant
* panels visible

---

## Tablet

* panels compress or stack
* command-center surface remains dominant

---

## Mobile

* stacked layout
* command-center primary surface first
* panels below
* command bar collapses

---

## Rule

```text id="t9r2qs"
Hierarchy must remain consistent across all devices
```

---

# 11. ⚠️ FORBIDDEN PATTERNS

---

The UI must NOT:

* behave like a dashboard grid
* show all data at once
* hide navigation
* allow multiple competing focuses
* show empty panels
* overload with information

---

# 12. 🧪 VALIDATION CRITERIA

---

UI Information Architecture is correct ONLY IF:

* user understands navigation immediately
* user can switch scope/engine/filter
* scene-backed command-center data updates correctly
* objects are interactive
* detail views work consistently
* layout remains stable

---

# 13. 🔥 FINAL STATEMENT

```text id="c5q8vz"
This document defines how the user experiences the system.

If UI structure deviates from this,
the system is considered broken.
```

---
