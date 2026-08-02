# Above Me API Contract

## Purpose

`/api/above-me` is the backend-owned discovery contract for future Hub and
WordPress surfaces that need a curated "what's above you right now" object list.

It is not a rendered scene and it is not a shortcode. It returns linkable object
records that can open ORAS Sky Engine on the exact target.

## Endpoint

```text
GET /api/above-me?lat=<lat>&lng=<lng>&elev=<meters>&time=<iso8601>&limit=<n>
```

Contract version: `above-me.v1`.

Additive fields may be introduced within v1. Existing identity, coordinate,
visibility, link, and metadata fields must not be removed or change meaning
without a new contract version.

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
        "sky_engine_url": "/oras-sky-engine/skysource/AndromedaGalaxy?catalog=Messier+%28local%29&source_id=M31&model=dso&ra=10.68&dec=41.269&lat=41.44&lng=-79.69&elev=0"
      }
    ]
  },
  "meta": {
    "contract_version": "above-me.v1",
    "observer": {
      "lat": 41.44,
      "lng": -79.69,
      "elev": 0.0
    },
    "time": "2026-06-04T02:16:04Z",
    "limit": 25,
    "total_candidates": 40,
    "visible_candidates": 12,
    "cache": {
      "status": "miss",
      "ttl_seconds": 30,
      "key_version": "v1"
    },
    "curation": {
      "policy": "balanced-v1",
      "available_categories": ["solar_system", "dso", "bright_star", "satellite"],
      "selected_category_counts": {
        "solar_system": 1,
        "dso": 7,
        "bright_star": 1,
        "satellite": 1
      },
      "missing_categories": [],
      "reservation_satisfied": true
    },
    "object_sources": {
      "messier_local": {"status": "included"},
      "openngc_local": {"status": "included"},
      "bright_star_local": {"status": "included"},
      "hipparcos_tier2_local": {"status": "included"},
      "gaia_dr2": {"status": "lookup_only"},
      "planets": {"status": "included"},
      "moon_sun": {"status": "included"},
      "satellites": {
        "status": "included",
        "freshness_status": "fresh",
        "nearest_tle_epoch": "2026-06-04T01:57:05Z",
        "nearest_tle_age_days": 0.013,
        "newest_tle_epoch": "2026-06-05T23:36:57Z",
        "newest_tle_age_days": 1.89
      }
    }
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
| OpenNGC DSOs | included | Normalized NGC/IC records provide bounded discovery and exact identity. |
| Local bright stars | included | Stable identity and RA/Dec exist. |
| Hipparcos Tier 2 stars | included | Existing local dataset provides stable string IDs, RA/Dec, and magnitude. |
| Gaia DR2 | lookup only | Exact object lookup exists, but broad ranked discovery is not implemented in this pass. |
| Planets | included when provider available | Mounted JPL DE442s supplies observer-specific RA/Dec and alt/az; controlled JPL Horizons fallback remains available. |
| Moon/Sun | included when provider available | Mounted JPL DE442s supplies observer-specific RA/Dec and alt/az; controlled JPL Horizons fallback remains available. Sun results include a safety warning. |
| Satellites | included when feed is fresh | Local TLE records are propagated with Skyfield for bounded visible discovery. TLEs older than 14 days are excluded rather than presented as current positions. |

`meta.object_sources` describes configured capabilities, not proof that every
provider returned candidates for a particular request. JPL-dependent results may
be absent when both the mounted ephemeris and controlled upstream fallback are
unavailable; those failures are logged.
Satellite source metadata reports `freshness_status`, nearest and newest TLE
epochs, and their age in days relative to the requested time. Freshness is based
on the nearest record epoch, while every candidate is independently age-checked
before propagation. A stale feed reports `status: degraded`; exact TLE identity
lookup remains available.

## Curation Metadata

`meta.curation` describes the real category coverage for the request:

- `available_categories` contains primary categories with at least one visible,
  source-backed candidate.
- `selected_category_counts` reports how many selected objects belong to each
  primary category.
- `missing_categories` contains primary categories with no visible candidate.
- `reservation_satisfied` is true when every available primary category is
  represented in the bounded result.

The primary curation categories are `solar_system`, `dso`, `bright_star`, and
`satellite`. A small `limit` can make complete reservation impossible; the API
then preserves the highest-ranked category representatives and reports
`reservation_satisfied: false`.

## Cache Behavior

Successful responses use a private backend Redis cache with a 30-second TTL.
The cache key uses exact normalized observer values, parsed limit, contract
version, and requested time, then stores only a SHA-256 digest in the key name.

- Explicit request times are exact and are never rounded together.
- Requests without `time` share only their server-generated 30-second UTC time
  bucket.
- `cache.status=hit` means a validated payload was reused.
- `cache.status=miss` means the payload was generated and stored.
- `cache.status=degraded` means Redis was unavailable or storage failed; the
  returned astronomy payload is still computed normally.
- Invalid or incompatible cached JSON is ignored and replaced.

This backend cache does not authorize shared CDN caching of observer-specific
responses.

## Satellite Feed Deployment Status

```text
GET /api/sky/satellite-feed?time=<iso8601>
```

This endpoint validates the independently mounted satellite release and returns
its source, release version, acquisition time, record count, checksum, epoch
range, required-ID status, and freshness for the requested time. It does not
return the bulk satellite catalog.

Status meanings:

| Status | Meaning |
| --- | --- |
| `ready` | Manifest/feed validation passes and the nearest TLE epoch is fresh. |
| `degraded` with `mounted: true` | Release is mounted but stale or invalid. |
| `degraded` with `mounted: false` | Feed or manifest mount is missing. |

The source-backed CelesTrak Active release is built and installed outside
Docker images. See `docs/runtime/ORAS_SATELLITE_TLE_DEPLOYMENT.md` for the
acquisition, validation, atomic install, mount, refresh, and rollback contract.

## Non-Goals

This contract does not define:

- WordPress shortcode rendering.
- Hub homepage UI.
- Survey imagery UI.
- DESI, Pan-STARRS, or TheSkyLive ingestion.
