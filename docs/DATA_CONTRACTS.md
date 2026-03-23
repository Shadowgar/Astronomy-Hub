# Astronomy Hub — Data Contracts

## Purpose

All backend responses must follow strict schemas.

Frontend MUST rely only on these contracts.

---

## Conditions Contract

```json
{
  "location_label": "Oil City, PA",
  "cloud_cover_pct": 22,
  "moon_phase": "Waxing Crescent",
  "darkness_window": {
    "start": "ISO8601",
    "end": "ISO8601"
  },
  "observing_score": "good",
  "summary": "string",
  "last_updated": "ISO8601"
}

<!-- NOTE: Phase 1 refinement — Active Observing Location -->
<!-- The backend MUST populate `location_label` using the Active Observing Location.label. -->
<!-- No change to the Conditions contract fields is required for this refinement. -->

## Active Observing Location (documentation)

The Active Observing Location is a documentation-only object describing the location used by Phase 1. It is not a new endpoint. Backends and frontends MUST support the following minimal shape when representing the active location:

```json
{
  "label": "ORAS Observatory",
  "latitude": 41.321903,
  "longitude": -79.585394,
  "elevation_ft": 1420
}
```

Note: For Phase 1 there is no requirement to add this object to existing endpoint payloads; instead, backends MUST ensure `location_label` in the `Conditions` contract is populated from the Active Observing Location.label. If an implementation wishes to include the full Active Observing Location object inline in responses, that is acceptable but NOT required for Phase 1 and must be documented.
{
  "name": "Jupiter",
  "category": "planet",
  "direction": "SE",
  "elevation_band": "mid",
  "best_time": "10:30 PM",
  "difficulty": "beginner",
  "reason": "Bright and clearly visible tonight"
}
{
  "object_name": "ISS",
  "start_time": "ISO8601",
  "max_elevation_deg": 61,
  "start_direction": "NW",
  "end_direction": "SE",
  "visibility": "high"
}
{
  "priority": "major",
  "category": "meteor_shower",
  "title": "Peak tonight",
  "summary": "Best after midnight",
  "relevance": "local_tonight"
}