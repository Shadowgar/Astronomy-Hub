# R4 Moon imagery and native renderer qualification

This bounded package selects the Moon. It uses a lunar reference sphere with an original NASA PDS LROC image product. It does not qualify elevation, landing-site detail, photometric measurements or the entire R4 roadmap. Context was inherited from the root task's declared six manifest packs, recorded in `loaded-documents.txt`; no additional repository authority documents were loaded by this subtask. Source research used primary public dataset and software documentation.

## Candidate evidence before implementation

| Gate | Moon | Mars |
| --- | --- | --- |
| Center and orientation | Existing ephemeris supports center 301; science package qualifies NAIF `MOON_ME_DE440_ME421`, frame 31009 | Existing small ephemeris exposes system barycenter 4; body center 499 and a compatible orientation path need separate qualification |
| Shape | Selected PDS product specifies a 1,737,400 m sphere | [USGS Viking mosaic](https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m) specifies 3,396,190/3,376,200 m radii and planetocentric coordinates; applying an oblate geographic projection requires careful latitude conversion |
| Imagery and rights | Original LROC global morphology browse product; public domain, cite authors | USGS/NASA Ames Viking colorized global mosaic: public domain, artistic color, original 12 GB, smaller browse available; not ingested |
| Terrain | No terrain provider qualified; reference sphere only | MOLA exists as a potential future source; no terrain provider/datum qualified here |
| Hardware | One 2880×1440 image, no additional provider or dependency; DPR capped at 1.5 | SDK capable of a custom globe, but science gates remain open |

[NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) was investigated and rejected for this slice because it includes inpainted gaps and aesthetically processed polar fill. The implemented asset uses original LROC morphology product pixels and retains missing coverage explicitly.

## Original product and reproducibility

The [LROC product page](https://data.lroc.im-ldi.com/lroc/view_rdr_product/WAC_GLOBAL_E000N0000_008P) identifies `WAC_GLOBAL_E000N0000_008P`, 8 pixels/degree, 3790.418803 m/pixel at the equator, simple cylindrical projection centered at zero longitude, west/east −180/+180 and south/north −90/+90. Its PDS label records product v1.3, creation 2014-04-18, source observations 2009-11-07 through 2011-01-31, planetocentric latitude, east longitude and all three axes 1737.4 km. The [global product documentation](https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_GLOBAL) describes geometric correction, photometric normalization and the 643 nm channel.

The [LROC RDR SIS](https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DOCUMENT/RDRSIS.PDF) explicitly identifies the mean Earth/polar axis reference system. The LROC team's [2024 coordinate paper](https://doi.org/10.3847/psj/ad54c6) explains alignment to DE421 MER and DE440 compatibility within LRO geolocation uncertainties. The science package separately qualifies the DE440/ME421 rotation; this imagery supports regional visualization, with a roughly 3.79 km pixel size, and makes no subpixel accuracy claim.

The fetched [original NASA PDS browse TIFF](https://pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/EXTRAS/BROWSE/WAC_GLOBAL/WAC_GLOBAL_E000N0000_008P.TIF) is 4,153,799 bytes, SHA256 `8a9077d46618ae617234d38794bcaef3a79be9df63e7dbcf1362ec2fb5fe6164`. Its geospatial tags independently confirm both axes 1,737,400 m, 3790.4188030187 m pixels and upper-left tiepoint (−5458203.0763469, 2729101.5381735) m. TIFF tag 42113 (`GDAL_NODATA`) explicitly records ASCII `0`; zero is not guessed from apparent darkness.

`prepare_moon_imagery.py` validates the exact source hash and TIFF layout, preserves every 8-bit grayscale pixel, and gives only explicitly designated no-data pixels zero alpha. There is no reprojection, scaling, color synthesis or inpainting. The generated PNG is 4,256,691 bytes, SHA256 `218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8`. There are 325,773 no-data pixels out of 4,147,200 (~7.86% of map pixels; this is not a spherical area fraction). Gray gaps on the reference sphere mean imagery unavailable.

Both originals and generated PNG stay outside Git under `data/runtime-packs/lunar-surface/release/`, mounted read-only at `/planet-data/`; they are not baked into a Docker image or placed in frontend public data. The committed ledger is `runtimes/planet-runtime/moon-source-manifest.json` and is emitted into the runtime shell artifact. The [USGS dataset rights record](https://astrogeology.usgs.gov/search/map/moon_lro_lroc_wac_global_morphology_mosaic_100m) states public domain and requests author citation. Native canvas attribution identifies NASA, Arizona State University and LROC; the ledger retains the requested Speyerer et al. / Wagner et al. citations. No paid service, access token, scraping or new dependency is involved.

Reproduce from the network:

```sh
python3 scripts/planetdata/prepare_moon_imagery.py
```

Or from the already fetched original:

```sh
python3 scripts/planetdata/prepare_moon_imagery.py --source data/runtime-packs/lunar-surface/release/WAC_GLOBAL_E000N0000_008P.TIF
```

## Native ownership and safety gates

`runtimes/planet-runtime/` is a separate owned Cesium iframe. The pinned Earth SDK is reused read-only at Cesium 1.138.0; no Earth controller, God's Eye upstream file or Stellarium source was edited. Explicit lunar ellipsoids are passed independently to Viewer/Scene, Globe, map projection, terrain provider, imagery tiling and Cartesian camera construction. No global Cesium default ellipsoid is mutated.

Earth Sun/Moon sprites, skybox, atmosphere, fog and water effects are absent. The API's geometric Moon-to-Sun unit vector is negated for Cesium `DirectionalLight`, whose direction is emitted light propagation. A supported `Globe.material` also uses that same qualified vector for Lambert sphere attenuation of the untouched mosaic, with native Earth lighting disabled. This removes Cesium's hard-coded ellipsoid night floor/diffuse boost; it does not modify upstream shaders. The material recovers the actual Moon-centered point from native eye space because the ellipsoid provider has no terrain vertex normals. The viewer clock is fixed to the API epoch. Native imagery is historical with baked acquisition shadows; sphere illumination is geometric, without elevation self-shadowing or Earthshine. Night side and no-data pixels are never synthesized into observations.

The bridge checks same origin, the parent window, namespace and per-frame channel before accepting initialization. Its contract validator requires center 301, lunar sphere, qualified frame, a right-handed orthonormal orientation matrix, UTC epoch, unit illumination vector and explicit unsupported terrain. Image loading and exact dimensions must succeed before the globe is shown. Failed imagery leaves an error, with no Earth texture or fabricated fallback. Build/deployment qualification must also compare mounted/served asset hashes with the ledger.

Native touch/mouse controls, keyboard arrows and zoom operate on the lunar sphere. Commands are immediate `setView` operations, including reduced-motion behavior. Camera height is bounded from 30 km to 12,000 km above the reference sphere; it is not an elevation measurement. Optional heading/pitch/roll round-trip through history. Readiness requires an actual completed native frame with tiles loaded. Disposal cancels pending initialization, removes listeners, cancels camera flight and destroys the native viewer and material. Diagnostics expose actual scene/globe/projection/terrain/imagery radii, epoch, source, camera, effect switches and destruction status.

## Historical acquisition/subtask evidence

- Red: `node --test runtimes/planet-runtime/contracts.test.mjs` initially failed `ERR_MODULE_NOT_FOUND` before the implementation.
- Green: `node runtimes/planet-runtime/contracts.test.mjs` — **5 tests, 5 pass, 0 fail** (identity/frame/shape gates, bounds, history orientation, illumination sign, bridge rejection).
- `python3 -m unittest discover -s scripts/planetdata -p 'test_*.py' -v` — **2 tests, 2 pass**, including byte-for-byte source pixels and every no-data alpha value.
- `python3 scripts/planetdata/prepare_moon_imagery.py --source /tmp/r4-moon-source.tif` — exact dimensions, bytes and hashes above.
- `node --check runtimes/planet-runtime/PlanetRuntime.mjs` — exit 0.
- `git diff --check` — exit 0 at subtask verification.
- Supporting local build: `GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye ORAS_PLANET_OUT=/tmp/r4-planet-build node /var/tmp/oras-cesium/gods-eye/node_modules/vite/bin/vite.js build --configLoader native --config runtimes/planet-runtime/vite.config.mjs` — built successfully; native Cesium bundle approximately 4.03 MB / 1.10 MB gzip. Vite reported its default >500 kB chunk warning; this is recorded and not treated as runtime/performance qualification.

Docker, actual native browser journeys, hemisphere brightness, served-byte comparison, mobile screenshots, touch navigation and teardown under integration are owned by the root qualification task and are not claimed by these local results. No browser was started by this subtask, to preserve coordinated GPU access. No commit, push or PR was created by this subtask.

Final integrated verification and remaining limitations are recorded in [README](README.md) and [interfaces](INTERFACES.md); the subtask counts above are historical and are not relabeled as final browser qualification.
