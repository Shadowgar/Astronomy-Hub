# Above Me API Contract

## Purpose

`/api/above-me` is the backend-owned discovery contract for future Hub and
WordPress surfaces that need a curated "what's above you right now" object list.

It is not a rendered scene and it is not a shortcode. It returns linkable object
records that can open ORAS Sky Engine on the exact target.

## Endpoint

```text
GET /api/above-me?lat=<lat>&lng=<lng>&time=<iso8601>&limit=<n>
```

## Query Parameters

| Field | Required | Rule |
| --- | --- | --- |
| `lat` | yes | Observer latitude in decimal degrees. |
| `lng` | yes | Observer longitude in decimal degrees. |
| `time` | no | ISO-8601 time. Defaults to server current UTC time. |
| `limit` | no | Result count. Server may clamp to a safe maximum. |
| `elev` | no | Observer elevation used for generated Sky Engine links. |

## Response Shape

The endpoint uses the standard `ResponseEnvelope`.

```json
{
  "status": "ok",
  "data": {
    "objects": [
      {
        "id": "Messier (local):M31",
        "catalog": "Messier (local)",
        "source_id": "M31",
        "model": "dso",
        "name": "Andromeda Galaxy",
        "type": "galaxy",
        "ra": 10.68,
        "dec": 41.269,
        "alt": 50.0,
        "az": 60.0,
        "magnitude": 3.4,
        "is_visible": true,
        "priority": 0.8,
        "reason": "Local Messier galaxy at 50.0 deg altitude.",
        "sky_engine_url": "/oras-sky-engine/skysource/AndromedaGalaxy?catalog=Messier+%28local%29&source_id=M31&model=dso&ra=10.68&dec=41.269"
      }
    ]
  },
  "meta": {
    "observer": {
      "lat": 41.44,
      "lng": -79.69,
      "elev": 0.0
    },
    "time": "2026-06-04T02:16:04Z",
    "limit": 25,
    "total_candidates": 40,
    "visible_candidates": 12,
    "object_sources": {}
  }
}
```

## MVP Inclusion Rule

Only objects with stable Sky Engine identity and RA/Dec may receive
`sky_engine_url` values.

Current MVP-supported sources:

| Source | Status | Reason |
| --- | --- | --- |
| Local Messier DSOs | included | Stable identity and RA/Dec exist. |
| Local bright stars | included | Stable identity and RA/Dec exist. |
| Hipparcos Tier 2 stars | included | Existing local dataset provides stable string IDs, RA/Dec, and magnitude. |
| Gaia DR2 | lookup only | Exact object lookup exists, but broad ranked discovery is not implemented in this pass. |
| Planets | gap | JPL ephemeris exists, but exact Sky Engine identity plus RA/Dec adapter is missing. |
| Moon/Sun | gap | Moon ephemeris exists; Sun exact-link support and RA/Dec adapter are missing. |
| Satellites | gap | TLE ingestion exists, but exact satellite identity, topocentric RA/Dec, and Sky Engine selection contract are missing. |

## Non-Goals

This contract does not define:

- WordPress shortcode rendering.
- Hub homepage UI.
- Survey imagery UI.
- DESI, Pan-STARRS, OpenNGC, or TheSkyLive ingestion.
