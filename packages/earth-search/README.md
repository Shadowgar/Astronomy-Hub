# Pinned coordinate parsing reuse

`coordinateParser.mjs` is an exact, unmodified copy of `src/search/coordinateParser.js`
from God's Eye pin `e7707d9a0f34d9fbffc300023c319f95caa5be30`.
Its MIT notice and upstream third-party scope notice are retained in LICENSE.txt.
The Hub reuses this small pure module without importing the upstream application,
adding a dependency, changing a source pin or owning Cesium/SWE math.

Photon transport is adapted in FastAPI because the qualified backend owns transport
and the upstream single-choice API discards alternate candidates. Search data remains
Photon/OpenStreetMap, not a hand-maintained place catalog. No Google/Nominatim fallback.
