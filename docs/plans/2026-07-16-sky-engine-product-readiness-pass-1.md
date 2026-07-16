# Sky Engine Product Readiness Pass 1

## Scope

Improve the existing `/api/above-me` and `/api/sky/search` foundations without
starting WordPress, Hub homepage, survey, or catalog expansion work.

## Measured Baseline

- Warm catalog-only above-me assembly is under one second locally.
- JPL Horizons fetches nine bodies sequentially with a four-second timeout per
  body and is the primary cold-request latency risk.
- Satellite candidate generation reconstructs Skyfield satellite objects and
  re-sorts the immutable TLE catalog on every request.
- The bundled TLE feed is stale relative to the current date and is not rejected
  by visible-candidate discovery.
- Messier and OpenNGC representations of the same DSO can both reach the curated
  result list.
- Search merging can rank partial DSO names ahead of an exact star name.

## Implementation

1. Serialize JPL API requests process-wide to comply with the provider fair-use
   policy while preserving the existing hourly cache.
2. Run synchronous above-me assembly in FastAPI's worker threadpool so network
   and catalog work cannot block the event loop.
3. Cache immutable TLE scan ordering and parsed `EarthSatellite` objects, but
   continue propagating each candidate for the requested observer and time.
4. Calculate TLE age from the real epoch, exclude stale satellites from visible
   candidates, and report feed freshness in above-me source metadata.
5. Deduplicate source-backed aliases for the same physical DSO after priority
   sorting, preserving the preferred higher-priority representation.
6. Re-rank merged search results by exact, prefix, then substring match across
   display names and aliases.
7. Correct stale Polaris/C6 browser-harness identities only if backend exact
   search proves the current source-backed identity.

## Validation

- Targeted provider, satellite, above-me, and catalog search tests.
- Full backend test suite.
- Full frontend test suite.
- `npm run validate:oras-deep-links`.
- Docker rebuild and runtime/API timing checks.
- Confirm generated catalog and dense-star packs remain mounted and ignored.

## Deferred

- WordPress and Hub UI.
- New catalogs or imagery.
- Redis/distributed response caching.
- Local or scheduled-ingestion planetary ephemerides that remove Horizons from
  the cold request path.
- TLE acquisition automation beyond exposing stale/degraded state.
- Full fresh-clone/runtime packaging audit.
