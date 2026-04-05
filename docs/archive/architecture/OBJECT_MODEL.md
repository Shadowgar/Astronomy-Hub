# OBJECT MODEL

---

## PURPOSE

Defines the normalized object structure used across the system.

---

## BASE OBJECT

```json
{
  "id": "string",
  "type": "planet | satellite | flight | dso | event",
  "name": "string",
  "engine": "string",
  "altitude": number,
  "azimuth": number,
  "visible": boolean
}
```

---

## OPTIONAL FIELDS

```json
{
  "magnitude": number,
  "brightness": number,
  "direction": "string",
  "elevation": number,
  "trajectory": [],
  "metadata": {}
}
```

---

## HUB FIELDS

```json
{
  "score": number,
  "reason": "string"
}
```

---

## RULES

* All objects must conform to base structure
* Optional fields vary by engine
* No fabricated values allowed
* Missing data must be explicit

---

## PURPOSE

This model ensures:

* consistency across engines
* predictable UI behavior
* clean data exchange
