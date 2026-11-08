# R4 readiness assessment — no implementation authorization

Recommendation: **Earth first**, as a bounded Planet View coordinate/frame,
source/quality and navigation contract using the existing owned Cesium runtime.
Do not create a second Earth renderer. This recommendation does not activate R4.

| Requirement | Earth | Moon | Mars |
|---|---|---|---|
| Current surface frame | Cesium geographic/cartographic Earth camera and ellipsoid | Native SWE/JPL identity and ephemeris exist; no qualified Hub surface frame | JPL Solar position and NASA globe model exist; no qualified Hub surface frame |
| Shape/radii | Existing Cesium Earth ellipsoid; Solar contract separately exposes mean sphere | Body-specific ellipsoid/terrain contract not qualified | Solar mean sphere/model is not a terrain datum |
| Rotation/orientation | Existing Earth renderer owns transforms; a shared body-fixed contract remains to qualify | Solar service does not supply body-fixed orientation | Solar service explicitly leaves body-fixed orientation unavailable |
| Imagery | Qualified static Blue Marble, EOX and footprint-gated NAIP; retained credits/cache | No admitted detailed surface tile provider in this package | Original NASA GLB/UV retained; not a georeferenced surface tile service |
| Terrain | Ellipsoid fallback; no newly qualified elevation provider | No qualified elevation stack | No qualified elevation stack |
| Rights | Preserve current source-specific terms; PEMA remains local-only/unverified for publication | New assets/provider rights require validation | Model rights do not establish rights/accuracy for a new terrain service |
| Navigation reuse | Working search, geographic marker, camera restore, native zoom/pan, Sky return | Body-specific navigation/frame/observer contract needed | Body-specific navigation/frame/observer contract needed |
| Performance | Real software-browser evidence available; owner GPU still pending | No hardware or tile-stack qualification | Solar globe evidence cannot establish detailed surface performance |

Evidence inspected: `backend/app/services/solar_exploration.py`,
`frontend/src/features/solar/solarContracts.ts`, the existing Earth runtime and
its source-policy/release records. Solar's ICRF/AU ephemeris positions and mean
radii do not establish a body-fixed terrain frame. The Earth land/cloud images
and Mars original UV mapping are visualization assets, not measured terrain or
live weather. Moon is not one of the nine primary Solar bodies in the current
system-view contract, although native Sky and the JPL API support its identity.

Suggested first authorized R4 package: explicitly define Earth surface coordinates,
ellipsoid versus measured altitude, orientation ownership, source resolution and
camera/observer return semantics; reuse existing imagery with honest terrain
absence. Qualify those contracts and hardware behavior before admitting detailed
terrain. Moon/Mars follow only after body-fixed rotation, shape, imagery datum,
source rights and terrain/navigation qualification. No R4 source changes occurred.
