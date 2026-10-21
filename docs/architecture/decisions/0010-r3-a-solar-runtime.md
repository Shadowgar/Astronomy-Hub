# ADR0010 — bounded geometric Solar exploration

Date2026-10-21. R3-A implementation decision under explicit owner authority;
qualification/visual acceptance are separate. No R4 surface renderer is activated.

## Inspected reuse alternatives

Existing `planetary_ephemeris_service.py` validates/loads mounted DE442s and builtin
Skyfield timescale; wrap that loader, preserve its observer apparent RA/Dec APIs.
`solar_system_catalog_service.py` supplies canonical Sun/Mars identities. Old Solar
scene modules are observer lists, not qualified 3D orbit navigation. No synthetic
Kepler elements, provider fallback, production catalog hand-registration or data copy.

Owned Cesium Earth has accepted ellipsoid/camera/imagery/cache and bridge behavior;
changing its Viewer into a Solar scene would change accepted contracts and require
new frame/scale qualification. Contained SWE specializes in apparent observer Sky;
no free-flight Solar camera seam was qualified. Neither renderer is modified.
Already installed/locked Three.js0.180 supplies native WebGLRenderer, sphere/line
buffers, picking and OrbitControls for one separate engine. No new dependencies,
upstream patches, universal renderer, texture downloads or licensed assets.
React owns controls/mount, engine owns scene/camera/GPU. Lazy route waits for existing
RuntimeHost disposal before creating WebGL; Solar teardown synchronously cancels
frames, listeners and controls, disposes geometry/materials/renderer and loses context.

## Science/display contract

`GET /api/v1/solar-system?epoch=<aware ISO UTC>` returns simultaneous geometric
heliocentric ICRF vectors in AU (149597870.7km/AU), origin Sun center10. Existing
Skyfield converts UTC to dynamical TDB for kernel evaluation. No apparent/light-time
correction or ecliptic/Earth-fixed transformation. Targets Sun10/Earth399/Mars4:
Mars4 is **system barycenter**, not physical center499. DE442s mounted SHA
`54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c` unchanged.

Open sampled prior trajectories (129 points maximum each, Earth365.25d/Mars687d,
coverage-clipped), not decorative closed ellipses or osculating elements. Explicit
missing/out-of-range error, no fabricated fallback. Independent Horizons VECTORS
checks use two UTC epochs × Earth399/Mars4, Sun10 origin, ICRF/NONE/AU-D; raw responses
retained.50km per-axis tolerance covers inter-kernel differences (local DE442s vs
current Horizons reference). Measured actual residuals belong in qualification.

Reference mean radii: Earth6371km/Mars3389.5km (NASA/NSSDC), Sun695700km (IAU2015
nominal). Visible spheres/colors are enlarged illustrative glyphs, separate from
physical metadata and unexaggerated distance. No terrain/texture/orientation/rotation,
photometry or scientific surface illumination claim. Source geometry supplies Sun
light direction with illustrative ambient fill; camera plane is not the ecliptic.

## R4 and return contract

Versioned intent: canonical identity, ephemeris target/reference/origin/frame/epoch/
time scale, units, camera target/arrival, reference mean sphere/source, explicitly
unavailable body-fixed frame/orientation/longitude, surface status, capabilities,
request ID/cancellation and return context. No surface renderer supports these
bodies yet; unavailable/cancelled entry retains current scene/context. Later R4 must
negotiate body/frame/shape/orientation/source support, separately choose Earth/Mars/
Moon and qualify ellipsoid/longitude/imagery/terrain. Sun has no terrestrial surface.

Incoming Sky selection/observer/native camera bookmark survives Solar entry/return;
Solar selection is separate `solarBody` history identity. Explicit controlled Solar
time changes follow return views. Back/Forward restores serially; cleanup owns no
provider cache/data/upstream/settings. R3-A budgets: three glyphs, two129-point paths,
one active heavy renderer, no ephemeris polling or gesture network requests.
R3-B proposed after owner slice review: extend qualified body/time/navigation coverage.

## Primary references

[Skyfield frames](https://rhodesmill.org/skyfield/positions.html),
[JPL API](https://ssd-api.jpl.nasa.gov/doc/horizons.html),
[Three OrbitControls](https://threejs.org/docs/pages/OrbitControls.html),
[NASA facts](https://nssdc.gsfc.nasa.gov/planetary/factsheet/),
[IAU2015 nominal constants](https://arxiv.org/abs/1510.07674).

## Cinematic presentation extension — owner authorization 2026-10-21

The earlier no-texture statement records the original PR81 scope. The owner-approved
cinematic package now reuses two small attributed NASA assets through existing Three
TextureLoader/GLTFLoader; no new dependency or native-renderer patch. Original Earth
PNG and original Mars GLB/color-atlas/UV geometry remain byte-preserved. Source positions,
identities, trajectories, epochs, physical radii and R4 contract do not change.
Fixed visual orientations are explicitly illustrative, not a body-fixed frame. Sphere
sizes remain exaggerated. Sun granulation/corona, atmospheric rims, background stars
and optical brightness are presentation effects without scientific measurement claims.
React owns HUD/dialogs only; the contained Three engine owns scene/camera/disposal.
Async texture/model arrivals after disposal release resources and cannot revive it.
No continuous animation loop; capped pixel ratio1.5,4000 points, three body meshes,
two source paths. Reduced motion is immediate, effects and paths can be disabled.
[Provenance, browser qualification and real software-GPU limits](../../validation/solar-cinematic/README.md).
