# Solar 2.0 appearance assets and coarse lunar height source

Prepared on `recovery/reconcile-20261026`, starting at `51771f06d9ffd3b919672b7542a9c84df13d92f6`.
This is source/data qualification. Browser integration, visual acceptance and
physical-device qualification belong to the integrated run; none are implied here.

The October28 owner Solar2.0 instruction supersedes CORE/LIVE's October27 stop
for this package. Loaded: owner attachment; repository AGENTS; CORE_CONTEXT;
LIVE_SESSION_BRIEF; CONTEXT_MANIFEST; UNIFIED_UNIVERSE_ARCHITECTURE; R4-A README,
IMAGERY and SCIENCE; existing Moon source manifest; existing Solar provenance.
These are the explicitly authorized source/renderer documents and matching
frontend/validation pack entries. No full-doc scan or unrelated pack was loaded.

## Appearance package

`frontend/public/solar-assets/v2/manifest.json` is the complete machine-readable
receipt: source/resource URLs, acquisition date, SHA-256, exact bytes, dimensions,
image hashes, UV linkage, vertex/triangle counts, model bounds, node transforms,
attribution, terms, mapping, classification and budgets.

| Original public NASA resource | Bytes | Color texture | Source mesh |
| --- | ---: | --- | --- |
| [Jupiter](https://science.nasa.gov/resource/jupiter-3d-model/) | 11,479,456 | 4096×3072 cube atlas | 1,649 vertices |
| [Saturn](https://science.nasa.gov/resource/saturn-3d-model/) | 5,476,584 | 4096×3072 cube atlas | 1,649 body vertices; two ring meshes |
| [Mercury](https://science.nasa.gov/resource/mercury-3d-model/) | 3,048,920 | 2048×1536 cube atlas | 2,034 vertices |
| [Venus](https://science.nasa.gov/resource/venus-3d-model/) | 298,748 | 1440×720 | 3,062 vertices |
| [Uranus](https://science.nasa.gov/resource/uranus-3d-model/) | 172,652 | 1024×512 | 3,256 vertices |
| [Neptune](https://science.nasa.gov/resource/neptune-3d-model/) | 585,104 | 1024×512 | 3,256 vertices |
| [Eros](https://science.nasa.gov/resource/eros-3d-model/) | 2,392,188 | 1024×1024 | 839 vertices / 1,536 triangles |

All are **NASA-issued visualization models**. The selected resource pages credit
NASA Visualization Technology Applications and Development (VTAD). The pages do
not establish observation epochs, calibrated albedo, scientific texture longitude,
body orientation or Eros shape accuracy. Preserve that distinction in UI. They
are not current cloud observations, elevation, or a source for scientific vectors.
No NASA Eyes browser asset was downloaded. Existing Earth/Mars/cloud assets and
native Moon/Sky/Earth data remain unchanged.

[NASA's media terms](https://www.nasa.gov/nasa-brand-center/images-and-media/)
explicitly cover polygon and texture data for educational/informational graphical
simulations, require acknowledgement and prohibit implied endorsement. Selected
resource/model metadata has no third-party copyright designation. No logos or
persons are part of the selected model content. This is a bounded informational
use qualification, not an assertion that every NASA/ESA asset is unrestricted
or permission for branded merchandise/promotional use.

Integration contracts:

- Use the original body mesh and `TEXCOORD_0` together; do not apply cube atlases
  to `SphereGeometry`. Body mesh is index0. `solarVisualAssets.ts` exposes receipts.
- Preserve node transforms once: Uranus/Neptune rotate source Z-polar geometry
  onto Y. Source orientation remains illustrative. Authoritative centers, physical
  radii and epochs are separate inputs.
- Saturn source meshes1/2 are top/bottom versions of the same rings. Use body0
  plus the single application ring renderer, avoiding duplicate opacity.
- `saturn-rings-nasa.png` is the exact embedded4096×16 RGBA image,9,615 bytes.
  Source mesh establishes outward u from1.232301 to2.330901 body-equatorial radii.
  This is graphical RGB/alpha, **not measured optical depth**. Physical edge
  registration and the application's approximate scattering model stay separate.
- Eros's normal map supplies graphical detail, not qualified elevation. Original
  geometry units/frame/spin are unqualified; disclose normalized visual extent.
- Color textures use sRGB. Original Jupiter/Saturn each cost64MiB RGBA8 with
  mipmaps at full resolution. Max dimensions1024/2048/4096 correspond to roughly
  4/16/64MiB each. Recommended cache192MiB; load on demand and cancel stale work.

The visual package is23,463,267 bytes, below its32MiB cap; per-file cap16MiB.
Original GLBs are unchanged. Only the ring image is extracted, byte for byte.

## LOLA source and sampling API

`frontend/public/solar-assets/lunar-height-v1/manifest.json` pins original
[PDS LDEM_4.IMG and label](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.lbl).
The2,073,600-byte grid SHA-256 is
`c04632eba6449af49e3108ed7c25b3b1c450600abd3690df4fc815853a1af476`.

V3.0 was created2017-09-15 from2009-07-13 through2016-11-29 observations. The
label explicitly gives DE421 Mean Earth/polar axis, east-positive longitude,
1440×720 pixel registration,0.25° spacing, signed16LE half-metres, and a
1,737,400m reference sphere. First pixel center:0.125°E,89.875°N. Source actual
elevations range−8,878.5 to10,504m. The label's minimum differs by one half-metre
unit from the admitted data; both values are retained in the receipt.

This is **coarse7.58km/pixel global relief**, not high-resolution terrain.
The label warns about45° latitude-band artifacts and describes interpolation
of incomplete coverage in higher resolution products. No missing-data sentinel
or density mask is supplied here. Zero is preserved, never guessed to be missing.

The [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) independent delivery
`ldem_4_uint.tif` was also downloaded for comparison. All1,036,800 values match
exactly after its+20,000 offset and720-column longitude shift: **zero mismatches**.
Use the original PDS bytes to avoid those additional transforms. NASA/GSFC/LRO
LOLA attribution and informational-use terms are recorded; the PDS landing page
also links its copyright/image-use policy.

`frontend/src/features/planet/lolaHeightGrid.ts` exports a SHA-admitted loader,
`sampleHeightMeters(eastLongitudeDegrees,northLatitudeDegrees)` and bounded
`sampleTile(west,south,east,north,columns,rows)`. Tiles return north-to-south
row-major float metre elevations; default65×65 is16,900 bytes. Shared tile edges
sample exactly alike. Longitude wraps; polar-row extrapolation is explicitly
reported. No renderer is created and the existing Moon renderer is unchanged.

The owner continuation now includes a working native Cesium heightmap adapter in
an isolated controlled demonstration using the existing Moon sphere/frame and
the unchanged `PlanetRuntime` class. [Actual adapter, browser proof and limits](TERRAIN_DEMO.md).
Source LOD ends at0.25°; any finer native geometry is interpolation. Production
Moon routing remains unchanged. Detailed image/height alignment, surface-normal
lighting, high-resolution/skirt qualification and physical hardware acceptance
remain open. No measured subpixel detail or terrain self-shadowing is claimed.

## Pinned 3D Tiles renderer inspection

Inspected [NASA-AMMOS/3DTilesRendererJS at bb07918c58327e1115b629a9267e140ef7c14f2d](https://github.com/NASA-AMMOS/3DTilesRendererJS/tree/bb07918c58327e1115b629a9267e140ef7c14f2d):
`package.json`, `LICENSE`, Three `TilesRenderer.js`, `TilesRendererBase.js`,
`QuantizedMeshPlugin.js`, `ImageOverlayPlugin.js`, `example/three/mars.js`,
`example/three/quantMeshOverlays.js`. Package version0.5.3; Apache2.0; Three peer
`>=0.167.0` includes existing0.180, while its own dev dependency is0.185.
Declared compatibility is not runtime qualification. No dependency was installed
and no upstream code copied into the application.

Downloaded source tar SHA-256:
`4b1a01a9f259c26b41a66c96ec7824ebbeb20f4ba6b4399557a63fd7876b5212`.
LICENSE SHA-256:
`12ab00e5637ce70e16be1f6693dfa5f9b7a4fe0f5f976a0329477d0c32d53e86`.

The library supplies screen-error refinement, download/parse queues, bounded
cache controls, abort/disposal, quantized-mesh loading and image overlays.
Its default ellipsoid is **WGS84**; a lunar application must supply the lunar
ellipsoid and source frame. `3DTILES_ellipsoid` can override radius metadata.
The quantized-mesh example uses ion and provider credentials; it does not supply
an authorized Moon terrain source. There is no lunar example at this exact pin.

Its Mars sample points to Dingo Gap. Sample-data tree
`76444abbb4faff1b05f46a09b81ca2c24602b333` lists10,629 Dingo files totaling
362,212,452 bytes. The release README credits multiple instrument organizations,
but no LICENSE/NOTICE appears in that tree (`/LICENSE` returns404). Do not infer
dataset redistribution rights from the renderer's Apache license. Local terrain
frame registration and mixed imagery rights also need qualification. No Dingo
bulk data or speculative lunar tile service was acquired.

The existing native Moon renderer can consume the bounded height API without
adding another renderer. 3DTiles remains a qualified code candidate for a later
properly licensed/local-frame tiled dataset, not an enabled product capability.

## Validation and remaining gates

Exact commands from repository root unless stated:

```text
python3 scripts/planetdata/acquire_solar_visual_assets.py
PASS 7 original GLBs + 1 original ring PNG; 23463267 bytes; hashes/UV links/dimensions
python3 -m unittest discover -s scripts/planetdata -p 'test_acquire_solar_visual_assets.py' -v
Ran 4 tests; OK (offline admission, tampering, no-overwrite, no implicit network)
python3 scripts/planetdata/acquire_lola_height_grid.py
PASS 1036800 signed16 samples; -8878.5..10504.0 m; original frame and label
cd frontend && npm test -- --run tests/lolaHeightGrid.test.ts
1 file passed; 5 tests passed (source samples, seam/poles, adjacent tiles, bounds, SHA/cancel)
cd frontend && npm run type-check
PASS, exit0 at integration snapshot2026-10-28T04:35Z
git diff --check
PASS
```

Acquisition is explicit: each script defaults to offline verification; `--fetch`
admits missing source bytes only after the pinned hash check. The visual script
also supports a separate `--output` and `--cache`. Existing mismatched files are
never silently overwritten. No protected pack, volume, setting or original asset
was edited. These files were not committed or pushed by the asset subagent.
No public artifact was published. The prior source archive does not cover this
revision until the root run rebuilds and qualifies a matching distribution.

Docker/browser/GPU integration validation is not part of the source-package
checks above and must be reported separately by the integrating agent. Independent
source/license review and owner visual acceptance remain required.
