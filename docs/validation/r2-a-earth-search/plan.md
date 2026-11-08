# R2-A Earth search implementation plan

**Goal:** Deliver Hub-owned address/place/coordinate search and real Cesium navigation.
**Authority:** Owner's explicit 2026-10-17 R2-A directive; existing Adaptive Explorer design.
**Method:** Inline implementation, focused RED/GREEN, one final branch review. No new approval round.

Design alternatives: full upstream app is prohibited; duplicating a mapping engine is
unnecessary. Reuse pinned coordinate parsing and existing Cesium navigation, adapting
Photon's multi-result data into a bounded FastAPI endpoint and Hub-owned interface.
Upstream's single-result geocoder cannot meet explicit ambiguous-result selection.
Photon is already present in pinned God's Eye; primary public terms allow reasonable
requests without credentials. Use submit-only search, conservative application-wide
rate admission, coalescing, bounded cache/payload/time and explicit outages. No paid
Google fallback, public Nominatim, autocomplete, bulk geocoding or private datasets.

- [x] Add backend submitted Photon search with validated source-backed candidate DTOs.
  Tests: real fixture normalization, invalid/nonfinite/out-of-range source coordinates,
  no-results vs unavailable, same-query coalescing, bounded traffic/cache/backoff.
- [x] Reuse pinned coordinate parser unchanged with license/source identity. Add Hub
  EarthSearch inside existing Explore dialog: query/results/explicit selection,
  contextual details and source attribution, independent manual coordinates.
  Tests: invalid coordinate rejection, ambiguity/no result/error, stale/cancelled
  responses, pending-flight Sky block, accepted native destination and history.
- [x] Bind location navigation/history through existing runtime client. Preserve native
  camera code, observer/time intent and serial renderer lifecycle. Never invent
  result coordinates/elevation or call geocoder coordinates scientific observations.
- [x] Read PR71 source/evidence; write file-specific reuse/integration/rights/hardware
  assessment. Preserve its open branch/assets/rollback; no cherry-pick or merge.
- [x] Qualify actual Docker desktop/mobile result choice, real camera destinations,
  zoom/pan/anchor, Sky return, history/reload and one renderer. Retain unsuccessful
  cases and screenshots. Do not run stalled N1 navigation suites.
- [x] Run relevant backend/frontend/runtime suites, types, docs and exact artifacts/
  served bytes. Commit/push separate branch, open draft PR stacked on PR74, review
  exact head and report preview/SHA/limits. Stop; no deployment/R3/merging73/74.
