# Independent lunar source and context feasibility review

**Verdict: retain the measured regional surface and add a deliberately separate
Moon locator. The available sources do not qualify a seamless surrounding surface.**
This source review does not approve the eventual visual correction. The owner
rejected the original floating regional patch; the preceding 2.1 technical checks
did not establish owner acceptance.

Reviewed on `recovery/reconcile-20261026`, baseline
`ed0c81f785c6da68183e757ff381eba2727a2007`, existing draft PR107. The owner explicitly
authorized independent review for the two Solar2.1.1 corrections. Earlier product
stops are superseded only within that scope. No implementation changes, commits,
pushes, deployment, native-renderer changes or bulk downloads by this reviewer.

## Context and actual source inventory

Loaded repository AGENTS, CORE_CONTEXT, LIVE_SESSION_BRIEF and CONTEXT_MANIFEST;
the `solar_reconstruction` pack supplies SYSTEM_VALIDATION_SPEC,
UNIFIED_UNIVERSE_ARCHITECTURE, ADR0010, the October21 cinematic reference,
UNIFIED_WORKSPACE_DESIGN_SPEC, Adaptive Explorer R1-A README, recovery
owner-acceptance and visual-fidelity READMEs, Solar2 PLAN and Solar2.1 PLAN.
The parent explicitly added Solar2.1 TERRAIN_SOURCE, TILES_RUNTIME,
REVIEW_TERRAIN and README. No full documentation scan or other documentation
pack was loaded. Historical execution statements in architecture/design records
do not override the current owner correction. Memory only located the previous
Moon frame contract; the facts below were checked against present files.

Actual inspected contracts and sources:

- `frontend/public/planet-terrain/apollo17-nac-v1/{manifest.json,tileset.json}`,
  all three attached PDS source labels, the original root GLB and hashes of all85
  GLBs; `scripts/planetdata/prepare_lunar_3d_tiles.py`.
- `frontend/public/solar-assets/lunar-height-v1/{manifest.json,ldem_4.lbl,ldem_4.img}`;
  `frontend/src/features/planet/lolaHeightGrid.ts`.
- `runtimes/planet-runtime/{moon-source-manifest.json,PlanetRuntime.mjs}`;
  `scripts/planetdata/prepare_moon_imagery.py`; original mounted WAC PNG and actual
  private HTTP response.
- Current `TerrainScene.ts`, `TerrainWorkspace.tsx`, `terrainContracts.ts`,
  `PlanetWorkspace.tsx`, `planetContracts.ts` and terrain browser regression.

| Existing source | Qualified facts | Boundary |
| --- | --- | --- |
| Apollo17 NAC DTM + matching ortho | 5m samples; 5.12×5.12km; 85 NASA3DTiles GLBs; source-local LROC_ME; radius1737400m | Exact DE realization unspecified; regional acquisition shadows; source estimates/precision limits remain |
| LDEM_4 V3.0 | Original2,073,600-byte signed little-endian grid; 1440×720; 0.25° centers; 0.5m/unit; DE421 mean Earth/polar axis; same radius | ~7.58km equatorial samples; source interpolation; not NAC-scale surrounding terrain |
| WAC_GLOBAL_E000N0000_008P v1.3 browse | Original morphology converted losslessly to2880×1440 gray+alpha PNG; DE421 MER source; ~3.79km equatorial pixels | Historical brightness/seams/shadows; 325,773 source no-data pixels; no terrain or calibrated albedo |
| Native Moon | MOON_ME_DE440_ME421 / frame31009; unchanged source sphere/globe, orientation and return camera | No native elevation enabled; no assertion of seamless regional flight |

## Why a seamless merge is not qualified

The NAC labels specify planetocentric coordinates, east-positive longitude,
equirectangular projection and1737.4km axes. They do not name DE421 or another
DE realization. The retained [LROC RDR SIS](https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DOCUMENT/RDRSIS.PDF)
establishes the general mean Earth/polar-axis convention, not a newly measured
cross-frame transform for this crop. Preserve the existing `LROC_ME` label.
The [official NAC product](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_DTM_APOLLO17)
and [product README](https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DATA/SDP/NAC_DTM/APOLLO17/NAC_DTM_APOLLO17_README.TXT)
remain source references, not evidence of an unrecorded exact realization.

The freshly read [NAIF DE440 lunar frame kernel](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf)
explicitly distinguishes MOON_ME_DE421 from MOON_ME_DE440_ME421. Its sampled
comparison reports a maximum3.0709840342771e−7rad (~0.534m at the lunar surface)
over2000–2040 and5.8204420784597e−7rad (slightly over1m) over1900–2051. These
values support coarse global context compatibility, not exact equality and not
an error bound for this NAC product's unknown realization. Do not substitute
IAU_MOON or a PA frame.

There is also a much larger resolution/height mismatch, independently measured
here. [Read-only audit](evidence/audit_lunar_context.py) decodes all16,641 original
root surface vertices, converts glTF `(east,up,-north)` through the declared ENU
root transform, reconstructs radial heights, and samples the original LOLA grid
at the nominal same latitude/longitude. It verifies all85 GLB hashes plus the
LOLA SHA. No scientific input, mesh or source height is changed.

**This comparison is deliberately not frame-qualified registration or an accuracy
assessment of either source.** It demonstrates the consequence of the proposed
naive equal-coordinate compositing using the actual existing assets.

| Quantity | Observed metres |
| --- | ---: |
| NAC center height | −2611.294189453125 |
| Bilinear LOLA center height | −2415.7727083779537 |
| LOLA minus NAC, all root surface samples | +13.322356 to +596.667272 |
| LOLA minus NAC,512 root edge samples | +23.504060 to +593.745944 |
| RMS of nominal sample differences | 234.954862 |

[Exact deterministic receipt](evidence/lunar-context-comparison.json).
The entire NAC crop is also2521–2726m below the native reference sphere. Merely
adding that sphere buries the crop. Existing LOLA interpolation is above every
sampled root vertex. Neither source supplies a seamless5m transition. Existing
80m seam skirts are non-measured crack covers and cannot solve this mismatch.
Do not lift NAC, lower the globe, invent a feathered elevation bridge, conceal
the mismatch with fabricated detail, or describe nominal placement as proven
seamless alignment. A later seamless package needs an appropriate intermediate
source, known realization/transform, measured overlap residuals, source-resolution
limits and independent seam/camera qualification.

## Narrow viable presentation and locator coordinates

Keep actual NASA TilesRenderer, original5m geometry, source appearance and native
Moon intact. Present the region as a deliberate bounded measured-surface view,
with a visible full-Moon WAC locator, a legible regional boundary/extent and
native Moon overview return. Use a static qualified orthographic projection,
with no second active WebGL renderer. The locator is spatial context, not another
terrain surface behind the crop and not a simulated view from Earth at the UTC.
Default regional framing must keep the surface substantial; a tiny isolated
square after ordinary zoom-out repeats the rejected behavior.

The existing source URL is **`/planet-data/moon-wac.png`**,4256691bytes,
SHA256 **`218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8`**.
Current private preview mounts this file read-only from
`/home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-surface/release`.
Actual localhost4231 bytes and mounted bytes both match the source manifest.
No copy into or change to that protected source pack is required.

The PNG is left-to-right−180°..+180° longitude, top-to-bottom+90°..−90° latitude.
Continuous source pixel-center coordinates are
`column=(longitude+180)*8−0.5`, `row=(90−latitude)*8−0.5`.
Preserve alpha0 as unavailable; neutral gray underneath is not measurement.
For a north-up near-side orthographic locator centered at0°N,0°E, normalized
screen coordinates are `right=cos(latitude)*sin(longitude)`, `up=sin(latitude)`;
visibility is `cos(latitude)*cos(longitude)>=0`. Canvas y is the negative of `up`.
For inverse projection inside the unit disk, use
`z=sqrt(1−right²−up²)`, `latitude=asin(up)`, `longitude=atan2(right,z)`.
Do not add current-sun shading to this historical-context diagram.

At nominal NAC center20.1800754679°N,30.7100213491°E, the marker is
`(right,up)=(0.4793433952,0.3449718184)`: **upper-right**, source pixel center
`(1685.1801708,558.0593963)`. This is approximate cross-source location context;
show20.18°N/30.71°E rather than survey-looking decimal precision.
The true5.12km footprint is subpixel on a small full-Moon locator. Any visible
dot/ring must be identified as an enlarged location marker, not the true extent.
Keep5m regional sampling and~3.79km global imagery clearly distinguished.

## Required correction qualification

1. Preserve original85GLB hashes, tileset geometry/root frame, scale and NASA
   runtime ownership. No new high-resolution source or alignment claim.
2. Check locator forward/inverse anchors:0°N/0°E at center, east right, north up,
   limbs/poles, source wrap and no-data. Hash-match the consumed WAC bytes;
   hide/mark unavailable on source failure rather than draw a fabricated Moon.
3. Actual desktop/portrait/landscape captures must show legible globe context,
   a substantial region, readable sampling/extent and obvious boundary; inspect
   overview, approach, overhead, pan and zoom limits. Reaching real LOD3/5m,
   source occlusion, unchanged heights and reduced-motion behavior still matter.
4. Native Moon→region→Return retains exact UTC and saved native camera. Retry,
   context restore and Back preserve regional camera. Globe locator must not
   overwrite native return intent or imply a cross-frame continuous flight.
5. Demonstrate zero second native/WebGL renderer, bounded locator CPU/memory,
   load cancellation/disposal and no late work after route departure. Existing
   Earth/Sky/Solar return/source-failure checks remain required.

## Commands and limits

```sh
python3 docs/validation/solar-system-2.1.1/evidence/audit_lunar_context.py
# PASS_READ_ONLY_COMPARISON_NOT_REGISTRATION;85 hashes;16641 vertices;512 edge samples.
docker inspect pr107-owner-preview --format '{{range .Mounts}}{{if eq .Destination "/planet-data"}}{{.Source}} -> {{.Destination}} {{.RW}}{{end}}{{end}}'
# Existing r4-a-planet-view-1 source mount -> /planet-data false.
sha256sum /home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-surface/release/moon-wac.png
curl --fail --silent --show-error http://127.0.0.1:4231/planet-data/moon-wac.png -o /tmp/solar211-review-moon-wac.png
sha256sum /tmp/solar211-review-moon-wac.png
# Both:218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8.
git diff --check
```

Fresh official NAIF text was read through the web tool. That tool could not reopen
the PDS LOLA label and NAC README URLs; the committed original LOLA/NAC labels,
source manifests and prior retained source qualification were inspected instead.
The earlier `/tmp/solar21-lunar-source` acquisition cache is absent in this session;
this review does not repeat original-range/GDAL or every-finest-vertex validation.
Initial environment discovery found `python` unavailable; the audit uses `python3`.

Reviewer changes are this report, its audit script and deterministic JSON receipt
only. No browser was operated and no correction runtime/build is approved by this
report. Source feasibility is qualified within the limits above; actual visual
improvement, correction integration, owner acceptance and physical iPhone remain
open. Next task: implement the bounded context correction, then obtain independent
non-author review and actual Windows browser evidence before owner evaluation.
