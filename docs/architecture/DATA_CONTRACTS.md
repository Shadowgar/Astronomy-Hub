#DATA_CONTRACTS.md`


---

# DATA CONTRACTS

---

## PURPOSE

Defines how data moves between system layers in Astronomy Hub.

This document ensures:

* deterministic behavior
* consistent data exchange
* strict separation of responsibilities
* predictable frontend integration

---

## CORE PRINCIPLE

```text
Engines produce data.
The Hub refines data.
The frontend renders data.
```

No layer may bypass this structure.

---

## ENGINE → HUB CONTRACT

Engines provide **candidate objects** only.

```json id="qz1wlg"
{
  "id": "string",
  "type": "string",
  "name": "string",
  "engine": "string",
  "visible": true,
  "altitude": 0,
  "azimuth": 0
}
```

---

### Rules

* Engines MUST NOT rank objects
* Engines MUST NOT filter based on UI context beyond basic validity
* Engines MUST provide deterministic outputs

---

## HUB OUTPUT CONTRACT

The Hub provides **curated, ranked objects**.

```json id="7blp07"
{
  "id": "string",
  "name": "string",
  "type": "string",
  "score": 0,
  "reason": "string"
}
```

---

### Rules

* Hub owns ranking
* Hub owns final filtering
* Hub determines which objects are shown

---

## DETAIL CONTRACT

Used when an object is expanded.

```json id="4n2x7n"
{
  "id": "string",
  "name": "string",
  "type": "string",
  "engine": "string",
  "data": {},
  "related": []
}
```

---

### Rules

* Detail is owned by the object's engine
* Data must be complete and deterministic
* Related objects must follow object model

---

## SCENE CONTRACT

Defines what is rendered in the active scene.

```json id="8kqj3k"
{
  "engine": "string",
  "objects": [],
  "focus": "object_id"
}
```

---

### Rules

* Only one engine may define the scene
* Scene must match active engine
* Objects must conform to object model
* Focus is optional but recommended

---

## VIEWPORT CONTRACT (NEW)

Defines the active rendering context in the frontend.

```json id="kq7c2m"
{
  "active_engine": "string",
  "scene": {},
  "timestamp": "string",
  "location": {
    "lat": 0,
    "lon": 0
  }
}
```

---

### Rules

* Viewport always reflects one active engine
* Scene must be consistent with engine
* Time and location must be explicit
* Frontend must not infer missing context

---

## CONDITIONS CONTRACT

```json id="5nqz8t"
{
  "visibility_score": 0,
  "cloud_cover": 0,
  "light_pollution": 0,
  "seeing": 0,
  "transparency": 0
}
```

---

### Rules

* Must be deterministic
* Must be location-based
* Must be time-aware

---

## ENGINE ROUTING CONTRACT (NEW)

Defines how objects trigger engine transitions.

```json id="l9x1fs"
{
  "object_id": "string",
  "current_engine": "string",
  "target_engine": "string",
  "action": "focus | open | layer"
}
```

---

### Rules

* Routing must be explicit
* Engine switching must be deterministic
* No implicit engine inference allowed

---

## ERROR CONTRACT

```json id="h4n8xz"
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {},
    "request_id": "string"
  }
}
```

---

### Rules

* No raw exceptions returned
* All errors must be structured
* All errors must include request_id

---

## VALIDATION RULES

* No raw external data reaches frontend
* All data must be normalized
* All contracts must be schema-valid
* All outputs must be explainable

---

## NON-GOALS

This document does NOT define:

* UI layout
* rendering implementation
* engine logic
* ranking algorithms

---

## FINAL PRINCIPLE

```text
All system communication must be explicit, structured, and deterministic.
```
