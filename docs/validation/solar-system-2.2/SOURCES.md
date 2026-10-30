# Solar 2.2 texture source and streaming evidence

This is source/implementation evidence, not owner visual acceptance. Starting
branch `recovery/reconcile-20261026`, HEAD `66fff05108ca7ed7ee0ee1d5137b4b2619c28373`.
The October30 owner directive supersedes the historical2.1.1 stop for this work.

Loaded: root/frontend AGENTS; CORE_CONTEXT; LIVE_SESSION_BRIEF; CONTEXT_MANIFEST
`solar_reconstruction` pack: SYSTEM_VALIDATION_SPEC, UNIFIED_UNIVERSE_ARCHITECTURE,
ADR0010, cinematic reference2026-10-21, UNIFIED_WORKSPACE_DESIGN_SPEC,
adaptive-explorer-r1a README, recovery owner-acceptance/visual-fidelity READMEs,
Solar2/2.1/2.1.1 PLAN. No full docs scan or unrelated task packs.

## Source changes and limits

The original loader downloaded all full models and reduced color atlases to2048.
Jupiter/Saturn actually contain4096×3072 atlases, but Mars and Earth originals
are only2048 pixels wide. Merely increasing the decoder cap cannot improve those.
Every original GLB and Earth/cloud file is retained byte-identical for rollback.

The complete per-file SHA-256, dimensions, bytes, GPU estimate, attribution,
source URL, transformation and128 Mars tile receipts are in
[`frontend/public/solar-assets/v2.2/manifest.json`](../../../frontend/public/solar-assets/v2.2/manifest.json).
Original model licenses/provenance remain in the adjacent `v2/manifest.json`.
All derivative images are Lanczos resized when needed, JPEG quality95/no chroma
subsampling. They contain no generated features or texture sharpening.

| Detail map | Dimensions | Delivered bytes | RGBA8 + mip allowance | SHA-256 |
|---|---:|---:|---:|---|
| Jupiter |4096×3072|1,977,325|64 MiB|`a95ed6cc1f232f2f926323c665098ee1bfae16ef6b2a8fac264ed78826ca4510`|
| Saturn |4096×3072|900,798|64 MiB|`72db55d8c971006ea7870b573266e816f9dc6871a4ebb370472173cfec8fd4af`|
| Mars |4096×2048|4,223,475|42.67 MiB|`460436630ccc7433d2d95b294db651ced16b1685b8d1a29583fe85109910388f`|
| Earth Detailed |8192×4096|8,872,855|170.67 MiB|`c0bd43e6b99a0681fd564658fcd56c949b3ffda8789efc5cc551d79610656e03`|

- **Jupiter/Saturn and other NASA models:** source mesh POSITION, normals, UV
  buffer views, nodes and sampler definitions remain byte-identical in compact
  overview GLBs. Their source cube atlases must never be put on SphereGeometry.
  All pinned GLBs omit samplers; detail reproduces glTF repeat/linear/trilinear
  defaults and unflipped bitmap orientation. Source atlases were inspected:
  Jupiter has real visible cloud structure; Saturn is intrinsically softer and
  low contrast. No observation epoch, photometric calibration or pole/spin
  solution is supplied; NASA publication does not qualify physical accuracy.
- **Earth:** original NASA [Blue Marble context](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-2181/),
  [8192×4096 source](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_8192.png),
 24,147,269 bytes, SHA-256 `aaddcd967a9f09fb2d7ef50ff452bebfcf10192c520465d5eb1ad8446c716e98`.
  NASA/GSFC, Reto Stockli, Earth Observatory; historical land/ocean/sea-ice
  composite, not current weather. No crop/rotation/flip was introduced in the
  derived files. Mid-latitude registration against the previously qualified
  map has its unique minimum at zero longitude shift (7.05/255 mean RGB error;
  ±1pixel is worse). The existing surface quaternion and Takram frame remain.
  Polar ice/color differences belong to the historical source. Original2048
  cloud composite remains in the scene; no artificial cloud detail is claimed.
- **Mars:** [NASA Trek's documented WMTS service](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars),
  layer `Mars_Viking_MDIM21_ClrMosaic_global_232m`, EPSG:104905. Exactly128
  level3 tiles,16columns×8rows,256pixels each;6,802,707 source bytes, below8MiB.
  Capabilities specify top-left(-180°,90°), global equirectangular coverage.
  The assembled4096×2048 map is approximately5.2km/pixel at the equator, despite
  the original layer's232m name. NASA/JPL-Caltech/USGS; historical colorized
  Viking mosaic with visible polar/mosaic artifacts. Both overview and detail
  use the same spherical UV map, west-to-east and north-to-south. Static Mars
  presentation orientation remains illustrative; no terrain, modern weather,
  calibrated true color or body-fixed rotation qualification is implied.

Educational/informational use, attribution and non-endorsement follow
[NASA's media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
No paid provider, recursive source crawl, raw global survey download or protected
pack modification occurred. Source cache is outside the runtime; only25 bounded
runtime files totaling25,892,787 bytes are delivered. All overview derivatives
total2,768,574 bytes; the integrated scene retains the original Eros/cloud files,
so its initial appearance transfer is5,097,161 bytes before HTTP compression and
excluding application/science/Takram resources. This is an asset inventory,
not measured browser startup time.

## Ownership, budgets and transitions

`SolarTextureBudget` is shared by the permanent overview owner and selected-body
detail owners. GPU admission counts each Texture separately, including objects
sharing one bitmap. RGBA8 plus a conservative4/3 mip allowance is reserved before
manifest-qualified image decode; decoded input sharing does not undercount GPU
allocations. This accounting excludes render targets, Takram LUTs and driver
overhead, which remain separate renderer diagnostics. CPU bitmap backing stores
are additional memory, not a claim of actual total browser/GPU allocation.

| Quality | Detail ceiling | Shared texture admission ceiling |
|---|---:|---:|
| Efficient |2048|64 MiB|
| Balanced |4096|192 MiB|
| Detailed |8192 only where source exists|384 MiB|

All overview maps are at most1024, except unchanged source clouds/ring/Eros.
Hardware maxTextureSize also caps detail. Balanced requests the4k Earth file;
it does not fetch8k and discard half the pixels. Jupiter/Saturn stop at source4k;
Mars stops at4k; Mercury2k and Venus1440 have no fabricated upscale.

Only selected demand loads detail. Fetch aborts on demand change; generation
identity prevents stale publication. The previous valid map remains until a
completed replacement is synchronously installed, then its owner is disposed.
Failures retain the valid overview/current map. Returning to overview drops
detail. Browser ImageBitmap decode itself is uncancellable: its reservation stays
counted until the late bitmap is closed. Replacement admission and a smaller
texture budget wait for that retirement, reported explicitly by diagnostics.
Camera travel/clock and the single rendering scheduler are never reset.

## Executed validation

From repository root:

```sh
PYTHONPATH=/home/rocco/.cache/uv/archive-v0/qYZnpTXMTkoe9eTU python3 scripts/planetdata/build_solar22_textures.py --cache /tmp/solar22-sources --fetch
PYTHONPATH=/home/rocco/.cache/uv/archive-v0/qYZnpTXMTkoe9eTU python3 scripts/planetdata/build_solar22_textures.py --cache /tmp/solar22-sources
PYTHONPATH=/home/rocco/.cache/uv/archive-v0/qYZnpTXMTkoe9eTU python3 -m unittest scripts/planetdata/test_solar22_textures.py -v
```

Cached Pillow12.3.0 is an authoring dependency, not a frontend dependency.
Builder: `PASS 10 sources; overview 2768574 bytes; Mars 128 tiles / 6802707 bytes; Earth 24147269 bytes`.
Offline source checks:4/4 pass (all hashes/dimensions, exact original geometry/UV,
complete bounded Mars grid, zero-shift Earth registration). Initial64KiB tile
limit rejected one valid tile; it was raised to96KiB while retaining8MiB total.
Existing sources and mismatched derivatives are never silently overwritten.

From `frontend`:

```sh
npm test -- --run tests/solarAssets.test.ts tests/solarTextureStreaming.test.ts
npm run type-check
```

11/11 focused tests pass, including late decode cancellation, retirement-before-
downgrade, shared budgets, no startup detail fetch, source-sized file selection,
atomic replacement, failure retention and hardware limits. Typecheck passes.
These are local source/unit checks. Docker/browser/GPU timing, matched visual
quality, owner acceptance and physical-device qualification belong to the
integrated validation; this source report does not assert those results.

Prepared bounded Windows browser regression (not yet executed by this author):

```sh
node --check scripts/validation/verify_solar22_streaming.mjs
node scripts/validation/verify_solar22_streaming.mjs http://127.0.0.1:4231 output/playwright/solar-system-2.2/streaming
```

Syntax check passes. The second command requires Windows Node, headed Edge and
the coordinated exclusive GPU window; it rejects software renderers and anything
other than the qualified NVIDIA RTX3060. It records actual overview/detail
requests, promotion timing, draw/resources, delayed-model UV race, selection
cancellation, explicit503 fallback, actual8k/2k Earth transitions, controlled
bitmap-delivery retirement, original Eros and actual context-loss/retry. Its
network/decode barriers are disclosed; it does not replace normal journey timing.
