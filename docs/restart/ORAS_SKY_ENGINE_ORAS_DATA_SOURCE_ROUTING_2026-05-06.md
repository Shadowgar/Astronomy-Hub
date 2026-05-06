# ORAS Sky-Engine ORAS Data Source Routing - 2026-05-06

## Scope

This document records the current ORAS-owned runtime routing for Sky Engine search and object metadata on `/sky-engine`.

This slice is limited to:

- vendored runtime search routing
- same-origin ORAS API usage
- preservation of existing local SWE object fallback behavior

This slice does not claim full Stellarium parity and does not change renderer ownership.

## Traced Search Path

Current search UI flow:

1. `vendor/stellarium-web-engine/apps/web-frontend/src/components/skysource-search.vue`
2. `vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js`
3. existing SWE object lookup or locally synthesized sky-source metadata

Selection flow remains:

1. `vendor/stellarium-web-engine/apps/web-frontend/src/components/target-search.vue`
2. `swh.skySource2SweObj(ss)`
3. existing SWE object selection when present
4. `this.$stel.createObj(ss.model, ss)` only when no existing SWE object is found

## ORAS Replacement Path

Centralized ORAS data routing config now lives in:

- `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js`

Authoritative runtime paths in this slice:

- `ORAS_DATA_ROOT = /oras-sky-engine/skydata`
- `ORAS_SEARCH_API = /api/sky/search`
- `ORAS_OBJECT_API_ROOT = /api/sky/object`
- `ORAS_CATALOG_STATUS_API = /api/sky/catalog/status`
- `ORAS_RUNTIME_MODE = oras-local`

Runtime search routing now behaves as:

1. raw user query is preserved by `skysource-search.vue`
2. `sw_helpers.js` normalizes only trim and `GAIA <id>` alias input
3. same-origin ORAS backend search calls `GET /api/sky/search?q=...`
4. backend Gaia search results are mapped into runtime sky-source objects
5. if backend returns no results or is unavailable, existing local SWE lookup and local Solar System fallback are used
6. no NoctuaSky or other third-party runtime search service is called

## Gaia DR2 Search Behavior

Working now:

- `Gaia DR2 2252802052894084352` reaches `/api/sky/search` without losing spaces
- `GAIA 2252802052894084352` is normalized to `Gaia DR2 2252802052894084352` before backend search
- backend payloads are surfaced in the vendored runtime search list as ORAS-owned results
- `not_indexed` Gaia results are shown explicitly as `Not indexed in local ORAS catalog yet`

Selection behavior in this slice:

- if a matching SWE object already exists, `skySource2SweObj` can resolve `Gaia DR2 ...` through the existing `GAIA ...` designation fallback
- if the runtime does not already have the Gaia object, selection depends on the existing SWE `createObj` path and is not claimed as full parity here

## Local Fallback Behavior

Local fallback remains active for:

- Solar System objects in the local catalog (`Sun`, `Moon`, `Mercury`, etc.)
- existing SWE-resident objects resolved by designation lookup
- local fuzzy search when ORAS backend search returns no results
- backend-unavailable cases

Local fallback does not reintroduce any third-party runtime dependency.

## Static Data Roots

Existing same-origin runtime static roots remain unchanged:

- `/oras-sky-engine/skydata/stars`
- `/oras-sky-engine/skydata/dso`
- `/oras-sky-engine/skydata/surveys/...`
- `/oras-sky-engine/skydata/landscapes/...`
- `/oras-sky-engine/skydata/skycultures/...`
- `/oras-sky-engine/skydata/mpcorb.dat`
- `/oras-sky-engine/skydata/CometEls.txt`
- `/oras-sky-engine/skydata/tle_satellite.jsonl.gz`

This slice does not modify live promoted star assets under `/oras-sky-engine/skydata/stars`.

## Solved Now

- centralized same-origin ORAS routing constants exist for runtime search and object metadata
- vendored runtime search is ORAS-backend-first instead of local-only
- Gaia DR2 queries preserve backend-compatible formatting
- backend-unavailable behavior falls back to existing local SWE lookup only
- third-party runtime search remains disabled

## Still Blocked Or Deferred

- authoritative `.eph` writer and promoted star-pack generation remain blocked
- full Gaia runtime rendering parity is not claimed
- Gaia results that are not present in existing runtime star packs may still stop at metadata/search-result level depending on SWE `createObj` support
- broader backend search coverage beyond exact Gaia DR2 source-ID routing is still incomplete

## Proof References

Primary code paths for this slice:

- `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js`
- `vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js`
- `vendor/stellarium-web-engine/apps/web-frontend/src/components/skysource-search.vue`
- `frontend/tests/orasRuntimeSearchRouting.test.js`

Related backend authority already in place:

- `backend/app/routes/sky.py`
- `backend/app/services/sky_catalog_service.py`
- `backend/tests/test_gaia_sky_catalog.py`