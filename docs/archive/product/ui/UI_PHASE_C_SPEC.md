# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

# 🌌 ASTRONOMY HUB — UI PHASE C SPEC (AUTHORITATIVE)

---

# 0. PURPOSE

UI Phase C transforms the system from:

> a clear, structured command center (Phase B)

into:

> a **spatial, immersive, high-fidelity exploration interface**

---

# 1. 🎯 PHASE GOAL

Deliver a UI where the user can:

* explore space, Earth, and systems visually
* move through environments naturally
* understand scale and position
* transition between overview and detail seamlessly
* feel immersed without losing clarity

---

# 2. 🧠 CORE PRINCIPLE

```text id="m4z7p2"
Immersion must never reduce clarity.
```

---

# 3. 🔄 CORE TRANSFORMATION

---

## Before Phase C

* UI is clear
* UI is structured
* interaction is strong
* visuals are functional

---

## After Phase C

* UI is immersive
* UI is spatial
* interaction is fluid
* visuals are expressive but controlled

---

# 4. 🌌 SCENE IMMERSION SYSTEM

---

## 4.1 Rule

```text id="k8q3x9"
Every scene must feel like a space, not a panel.
```

---

## 4.2 Requirements

Scenes must:

* show depth
* provide spatial context
* support camera movement
* maintain object clarity

---

## 4.3 Supported Scene Types

* sky dome (Above Me)
* Earth globe (2D + 3D)
* solar surface
* orbital map
* solar system

---

# 5. 🎥 CAMERA & MOVEMENT SYSTEM

---

## 5.1 Required Controls

User must be able to:

* pan
* zoom
* rotate (where applicable)
* reset view

---

## 5.2 Behavior Rules

* movement must be smooth
* movement must be predictable
* movement must not disorient

---

## 5.3 Constraints

```text id="q3p9v1"
Camera must never hide important context
```

---

# 6. 🔄 TRANSITION SYSTEM (CRITICAL)

---

## 6.1 Required Transitions

* scope → scope
* engine → engine
* filter → filter
* scene → object
* object → detail
* detail → scene

---

## 6.2 Rules

Transitions must:

* be smooth
* preserve orientation
* maintain context
* not feel abrupt

---

## 6.3 Object Zoom Transition

```text id="t7k4r2"
Click object → zoom/focus → detail
```

---

## 6.4 Return Transition

```text id="d2m9x8"
Back → return to exact position
```

---

# 7. 🔍 OBJECT FOCUS SYSTEM

---

## 7.1 States

Objects must support:

* default
* hover
* focused
* selected

---

## 7.2 Focus Behavior

When focused:

* object becomes visually dominant
* surrounding objects reduce prominence
* contextual info appears

---

## 7.3 Rule

```text id="p8v3t6"
User must always know what is selected
```

---

# 8. 🧠 CONTEXT PRESERVATION

---

## Rule

```text id="m2q7k4"
User must never feel lost when navigating
```

---

## Must Maintain

* orientation
* scale awareness
* position
* selected context

---

## Failure if:

* user loses track of location
* transitions feel disconnected

---

# 9. 🎛️ OVERLAY SYSTEM

---

## Purpose

Provide contextual information without clutter.

---

## Allowed Overlays

* object labels
* orbit paths
* event markers
* filter indicators
* selection highlights

---

## Rules

* overlays must be readable
* overlays must collapse when excessive
* overlays must respect hierarchy

---

## Constraint

```text id="x5r2n8"
Overlays must never overwhelm the scene
```

---

# 10. 🪐 ENGINE-SPECIFIC UI BEHAVIOR

---

## 10.1 Above Me (Sky Scene)

Must:

* show horizon-based sky
* separate object types clearly
* prioritize visible objects

---

## 10.2 Earth Engine

Must:

* support globe + map
* allow region zoom
* highlight events clearly

---

## 10.3 Solar Engine

Must:

* display solar surface clearly
* highlight active regions
* show events in context

---

## 10.4 Satellite Engine

Must:

* show orbital paths
* highlight selected satellite
* support tracking

---

## 10.5 Solar System Engine

Must:

* show planetary positions
* support zoom into planets
* maintain scale awareness

---

## 10.6 Deep Sky Engine

Must:

* support sky exploration
* maintain readability
* avoid visual overload

---

# 11. 📊 INFORMATION HIERARCHY (PHASE C)

---

## Priority

1. Scene
2. Focused object
3. Active context
4. Supporting overlays
5. Panels

---

## Rule

```text id="g7p4v2"
The scene always remains dominant
```

---

# 12. 🎨 VISUAL SYSTEM (PHASE C LEVEL)

---

## Requirements

* deeper contrast control
* refined color usage
* improved depth cues
* clear object differentiation

---

## Must Maintain

* readability
* consistency
* semantic color meaning

---

## Must NOT Introduce

* excessive glow effects
* noisy animations
* clutter

---

# 13. 🎬 MOTION SYSTEM

---

## Allowed Motion

* transitions
* zoom
* hover effects
* focus animations

---

## Rules

```text id="n4q8p1"
Motion must clarify state, not decorate it
```

---

## Constraints

* must not slow interaction
* must not distract
* must not cause confusion

---

# 14. 📱 RESPONSIVE IMMERSION

---

## Desktop

* full immersive experience
* all features enabled

---

## Tablet

* reduced overlays
* preserved interaction

---

## Mobile

* simplified interaction
* preserved focus
* scene-first layout

---

## Rule

```text id="p2k7x5"
Immersion must scale without breaking usability
```

---

# 15. ⚠️ FORBIDDEN PATTERNS

---

The UI must NOT:

* become visually noisy
* behave like a game UI
* overwhelm user with data
* hide important context
* break navigation clarity

---

# 16. 🧪 VALIDATION CRITERIA

---

UI Phase C is complete ONLY IF:

---

## Immersion

* user feels spatial context

---

## Clarity

* user never feels lost

---

## Interaction

* movement is smooth
* object interaction is clear

---

## Continuity

* transitions preserve context

---

## Performance

* no lag
* no rendering issues

---

# 17. 🚫 FAILURE CONDITIONS

---

UI Phase C is NOT complete if:

* visuals are confusing
* transitions are disorienting
* scene is cluttered
* object focus is unclear
* performance degrades

---

# 18. 🔥 FINAL STATEMENT

```text id="r6p3x9"
UI Phase C makes Astronomy Hub feel alive.

But if clarity is lost,
the system has failed.
```

---

## Where you are now

Now:

* UI Phase A → structure
* UI Phase B → clarity
* UI Phase C → immersion

are all properly defined.

---

## Next (critical for your requirement)

👉 `STYLING_DECISION.md`

This is where we **lock your 5-mode system correctly**, including:

* Light
* Light High Contrast
* Dark
* Dark High Contrast
* Red Mode (astrophotography)

---
