# Above-Me Production Readiness Design

## Status

Approved for implementation on 2026-08-02 after category-balanced curation
merged in PR #46.

## Problem

`/api/above-me` now returns a bounded, category-balanced, exact-linkable object
list, but every identical request still rebuilds all candidates and propagates
satellites. Local Docker measurements are approximately 0.8 to 1.0 seconds per
request. The response also lacks a frozen contract identifier and explicit
metadata explaining which curated categories were available and selected.

The future Hub and WordPress consumers need a stable, observable API boundary
before UI integration starts.

## Evaluated Approaches

### Route-only HTTP caching

Adding browser cache headers is simple but does not prevent repeated backend
catalog assembly, does not help separate clients, and can expose observer query
responses to shared intermediary caches if configured incorrectly.

### Cache individual candidate builders

This offers fine-grained reuse but creates several independent invalidation
policies for stars, DSOs, ephemeris, and satellites. Satellite propagation and
final curation would still run for every request.

### Selected: short-lived whole-response Redis cache

Cache only fully validated successful payloads after candidate assembly and
curation. This removes the complete repeated computation while preserving the
existing builder boundaries. Redis failure remains non-fatal and falls back to
the current uncached path.

## Cache Contract

- Cache key version: `above-me:v1`.
- TTL: 30 seconds.
- Key inputs: exact normalized latitude, longitude, elevation, parsed limit,
  and requested time.
- Key storage: SHA-256 digest of the canonical key input so observer coordinates
  do not appear in Redis key names.
- Explicit times use the exact normalized UTC timestamp and are never rounded.
- Requests without a time use a 30-second UTC bucket because their time is
  server-generated.
- Invalid requests are rejected before cache access.
- Only `status: ok` payloads are cached.
- Corrupt or incompatible cached JSON is treated as a miss and replaced.
- Redis errors do not fail the endpoint.

## Response Metadata

Every successful response includes:

```json
{
  "contract_version": "above-me.v1",
  "cache": {
    "status": "hit|miss|degraded",
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
  }
}
```

Category metadata is derived only from real visible candidates and selected
objects. It does not create objects or alter visibility. For limits smaller than
the number of available categories, `reservation_satisfied` is false because
the complete reservation is mathematically impossible.

## Data Flow

1. Parse and validate observer, time, and limit.
2. Build the versioned hashed cache key.
3. Return a valid cached payload with `cache.status=hit` when present.
4. On a miss, run the unchanged candidate builders and balanced selector.
5. Add contract and curation metadata.
6. Store a cache-neutral copy for 30 seconds.
7. Return `cache.status=miss` when stored or `degraded` when Redis is
   unavailable.

## Non-Goals

- No astronomy calculation changes.
- No new catalogs or object categories.
- No frontend, Hub, or WordPress implementation.
- No shared/public CDN caching.
- No survey or Sky Engine runtime changes.
- No fabricated values or category availability.

## Acceptance Criteria

- Repeated identical requests execute catalog assembly once.
- Explicit times one second apart never share a key.
- Server-generated current requests share only their 30-second bucket.
- Redis failure returns a correct uncached response marked degraded.
- Category coverage metadata matches selected objects.
- Existing exact links, category balancing, Tier 2 caps, DSO deduplication,
  catalog packs, and satellites remain green.
- Docker warm-request latency is materially lower than the uncached baseline.
