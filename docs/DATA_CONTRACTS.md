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