# 📄 `DATA_CONTRACTS.md`

This defines how **all data in Astronomy Hub must be structured, normalized, and exchanged**.

---

# 🌌 ASTRONOMY HUB — DATA CONTRACTS (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

* how all data is structured
* how engines expose data
* how objects are represented
* how cross-engine linking works
* how frontend and backend communicate

This is a **non-negotiable system contract**.

---

# 1. 🧠 CORE PRINCIPLE

```text
All data must be normalized into internal contracts
before it is used anywhere in the system.
```

---

# 2. 📦 CONTRACT TYPES

The system uses four primary contract types:

---

## 2.1 Scene Contract

Used to render the **current scene**.

Contains:

* objects to display
* minimal metadata
* positioning data
* rendering hints

---

## 2.2 Object Summary Contract

Used for:

* lists
* cards
* previews

Contains:

* identity
* type
* minimal attributes
* relevance score

---

## 2.3 Object Detail Contract

Used for:

* full object pages

Contains:

* full data
* media
* links
* related objects
* cross-engine references

---

## 2.4 Event Contract

Used for:

* alerts
* time-based phenomena

---

# 3. 🧩 UNIVERSAL OBJECT MODEL

Every object in the system must conform to this structure.

---

## 3.1 Base Object Schema

```json
{
  "id": "unique_id",
  "name": "Display Name",
  "type": "planet | satellite | flight | earthquake | sunspot | deep_sky | event",
  "engine": "earth | solar | satellite | flight | solar_system | deep_sky",
  "summary": "Short human-readable description",
  "relevance_score": 0.0,
  "timestamp": "ISO-8601",
  "last_updated": "ISO-8601"
}
```

---

## 3.2 Position Schema (Optional)

```json
{
  "position": {
    "lat": 0.0,
    "lon": 0.0,
    "alt": 0.0,
    "azimuth": 0.0,
    "elevation": 0.0
  }
}
```

Used for:

* Earth objects
* satellites
* flights
* sky positioning

---

## 3.3 Visibility Schema (Optional)

```json
{
  "visibility": {
    "is_visible": true,
    "visibility_window": {
      "start": "ISO-8601",
      "end": "ISO-8601"
    },
    "conditions": {
      "requires_dark_sky": true,
      "affected_by_moon": true
    }
  }
}
```

---

## 3.4 Classification Schema

```json
{
  "classification": {
    "category": "planet | comet | galaxy | storm | flare",
    "subtype": "optional subtype",
    "tags": ["visible", "high_priority", "rare"]
  }
}
```

---

# 4. 🖼️ MEDIA CONTRACT

---

## 4.1 Media Object

```json
{
  "media": [
    {
      "type": "image | video | map | diagram",
      "url": "https://...",
      "thumbnail": "https://...",
      "source": "NASA",
      "caption": "optional description",
      "timestamp": "ISO-8601"
    }
  ]
}
```

---

# 5. 📰 NEWS CONTRACT

---

## 5.1 News Object

```json
{
  "news": [
    {
      "id": "news_id",
      "title": "headline",
      "summary": "short summary",
      "url": "https://...",
      "source": "NASA / ESA / etc",
      "timestamp": "ISO-8601",
      "linked_objects": ["object_id_1", "object_id_2"]
    }
  ]
}
```

---

# 6. 🔗 CROSS-ENGINE LINKING

---

## 6.1 Linking Rule

```text
Objects must be linkable across engines via IDs.
```

---

## 6.2 Example

```json
{
  "related_objects": [
    {
      "id": "mars",
      "engine": "solar_system"
    },
    {
      "id": "perseverance",
      "engine": "satellite"
    }
  ]
}
```

---

## 6.3 Relationship Types

```json
{
  "relationships": [
    {
      "type": "orbits",
      "target": "earth"
    },
    {
      "type": "observed_by",
      "target": "jwst"
    }
  ]
}
```

---

# 7. 🎛️ SCENE CONTRACT

---

## 7.1 Scene Schema

```json
{
  "scope": "above_me | earth | sun | solar_system",
  "engine": "engine_name",
  "filter": "active_filter",
  "timestamp": "ISO-8601",
  "objects": [
    {
      "id": "object_id",
      "type": "object_type",
      "position": {},
      "summary": "short description",
      "relevance_score": 0.0
    }
  ]
}
```

---

## 7.2 Scene Constraints

* must be scoped
* must be filtered
* must contain limited objects
* must be optimized for rendering

---

# 8. 📊 ENGINE-SPECIFIC EXTENSIONS

---

Each engine may extend contracts.

---

## 8.1 Earth Engine Example

```json
{
  "magnitude": 5.2,
  "depth": 10.0,
  "region": "California"
}
```

---

## 8.2 Solar Engine Example

```json
{
  "intensity": "M-class",
  "region_id": "AR12345"
}
```

---

## 8.3 Satellite Example

```json
{
  "orbit_type": "LEO",
  "owner": "NASA",
  "launch_date": "ISO-8601"
}
```

---

# 9. 🔄 DATA FLOW CONTRACT

---

## 9.1 Flow

```text
External API → Ingestion → Normalization → Contract → Cache → API → Frontend
```

---

## 9.2 Rule

```text
No raw external data reaches the frontend.
```

---

# 10. 🧠 DETAIL VIEW CONTRACT

---

## 10.1 Structure

```json
{
  "object": {},
  "media": [],
  "news": [],
  "related_objects": [],
  "relationships": []
}
```

---

## 10.2 Rule

```text
Detail views must be complete, expandable, and engine-specific.
```

---

# 11. ⚠️ VALIDATION RULES

---

All data must:

* conform to schema
* include required fields
* use consistent types
* use ISO timestamps
* use normalized IDs

---

# 12. 🚫 FORBIDDEN PATTERNS

---

The system must NOT:

* expose raw API data
* allow inconsistent schemas
* mix engine responsibilities
* return unbounded datasets
* skip normalization

---

# 13. 🔥 FINAL CONTRACT STATEMENT

```text
All system data must be normalized, structured, and scoped
to support engine-based rendering and object-level exploration.
```

---

# ✔️ OUTCOME

This document ensures:

* consistent data across engines
* predictable frontend rendering
* scalable system behavior
* clean object routing
* proper linking across domains

---