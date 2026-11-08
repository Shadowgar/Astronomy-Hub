# Solar 2.1: Apollo 17 regional source and local 3D Tiles

Source conversion is qualified locally. Actual NASA TilesRenderer loading,
application navigation, Docker/Windows rendering, GPU resource behavior and owner
visual acceptance are separate integration checks; this report does not imply them.

Worktree: `.worktrees/repository-recovery-20261026`, branch
`recovery/reconcile-20261026`, starting HEAD `b4005ce48e9869c298de4ed019c67e4e246accda`.
No commit, push, PR change, deployment or public publication by the source agent.
Existing draft PR107 and every protected native/data pack remain unchanged.

Loaded context: owner Solar2.1 attachment; repository AGENTS; CORE_CONTEXT;
LIVE_SESSION_BRIEF; CONTEXT_MANIFEST; UNIFIED_UNIVERSE_ARCHITECTURE;
SYSTEM_VALIDATION_SPEC; Solar2.0 ASSET_SOURCES. The owner explicitly supersedes the
Solar2.0 visual stop for this implementation. This is the source/terrain part of
the bounded Solar pack, not a full documentation scan. Prior Moon memory was used
only to locate the sphere/frame contract, then checked against current source.

## Source and permitted use

Selected official [Apollo 17 LROC NAC DTM release](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_DTM_APOLLO17)
contains stereo elevation and orthophotos produced together. The actual acquired
files are PDS products, not curated LROC artwork. The [LROC terms](https://www.lroc.im-ldi.com/about/terms)
explicitly place PDS-delivered products in the public domain; attribution is
**NASA/GSFC/Arizona State University**. This does not infer rights in unrelated
curated images from the renderer's code license.

| Product, v1.9 | Original complete bytes | Original byte range acquired | Acquired bytes | SHA-256 of that original range |
| --- | ---: | --- | ---: | --- |
| NAC_DTM_APOLLO17_E203N0308.IMG | 463,343,940 | 251622000–292640379 | 41,018,380 | `71bcc4f75369148af9b6a1d8e5e12709020d0d7d31f5f3ead03d18071c7065a5` |
| NAC_DTM_APOLLO17_MOSAIC_5M.IMG | 231,671,970 | 125811000–146320189 | 20,509,190 | `361b51ca76c556386638963b9fd0e7d734dfb5a224eebb8e0117d3e6bdf10ac4` |
| NAC_DTM_APOLLO17_CONF.IMG | 115,835,985 | 62905500–73160094 | 10,254,595 | `f3299e886d0bd55a190ad0218566e7c34057304eb969e0866ab82c6c8f72b248` |

Every request was preceded by metadata/HEAD/range inspection. Each data response
was HTTP206 with the exact requested `Content-Range`. Total scientific range data:
**71,782,165 bytes**; three original header ranges add98,304 bytes. Source reference
files/terms add2,868,160 bytes. Thus selected source acquisition totals74,748,629
bytes, under256MiB. Exploratory page responses and temporary development tools are
separate small acquisitions; no global/full IMG download occurred. Whole-product
SHA-256 is deliberately **not claimed**: exact original range SHA-256, full size,
ETag, Last-Modified, URL and header hashes are pinned in
`scripts/planetdata/lunar_apollo17_sources.json`.

The task cache is `/tmp/solar21-lunar-source`; only newly created task files are
used. `--fetch` requires exact HTTP206, ETag and pinned SHA; a full HTTP200 response
is rejected before its body is read. Existing mismatched cache bytes are rejected.
Default invocation is offline verification and makes no network request.

## Location, frame, datum and matching imagery

The admitted1025×1025 source-post crop is5.12km×5.12km in the Apollo17
Taurus–Littrow valley:

- Center:20.1800754679358°N,30.7100213490662°E.
- Source-post extent:20.0956520792208–20.2644988566508°N,
  30.6201798553185–30.7998628428138°E.
- All three input grids share exact projection, dimensions, offsets and5m spacing.
- Planetocentric latitude, east-positive longitude; lunar sphere1,737,400m.
- Signed radial elevation:−2725.6572265625 to−2521.281982421875m.
  Actual relief204.375244140625m; center elevation−2611.294189453125m.
- Reference source frame: **LROC mean Earth/polar-axis**, recorded as `LROC_ME`.
  The [RDR SIS](https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DOCUMENT/RDRSIS.PDF)
  specifies this frame but the product does not explicitly identify a DE realization.
  No exact ME421 or sub-metre cross-frame registration is fabricated. The regional
  scene stays source-local; transferring survey-level positions to the existing
  Moon ME421 runtime needs a separately qualified alignment.
- The official [LROC processing guide](https://lroc.im-ldi.com/data/support/downloads/LROC_NAC_Processing_Guide.pdf),
  page4, converts NAC DTM heights to radius by adding1,737,400m. Together with the
  attached product's three1737.4km axes, this establishes the radial datum/sign.

The attached labels use the post-November2011 offset convention: positive offsets
locate the projection origin right/below pixel center(1,1). In zero-based array
coordinates, `x=(column−855375.5)*5`, `y=(129197.5−row)*5`,
`latitude=y/R`, `longitude=180°+x/(R*cos(20°))`. The20° center latitude is the
standard parallel, not a latitude offset. Source row0 is north.

A real conflict was found in legacy `DSMAP.CAT`: it contains a1734.4km typo and
older incompatible offset signs. The newer attached v1.9 labels and independent
GDAL PDS interpretation govern. The reported longitude bounds differ from exact
pixel centers by less than one pixel; they are not used to interpolate placement.
`lunar-gdal-crosscheck.json` records15 control points across all three source
labels using rasterio1.5.2/GDAL3.12.2 and its independent projection inverse.
Converter agreement is better than1e−9degree. The first test incorrectly treated
reported latitude bounds as outer pixel edges, failed, and was corrected after
this external check; production coordinate math already matched GDAL.

The [product README](https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DATA/SDP/NAC_DTM/APOLLO17/NAC_DTM_APOLLO17_README.TXT)
reports5m post spacing,2.55m precision and1.77m RMS against30 LOLA tracks.
Observations span2010-07-28 to2016-03-17 per attached labels. The full source has
stereo correlation/interpolation limitations and possible seams. The chosen crop
has **zero no-data pixels**. Original confidence values1–19 are retained as a
histogram; the old README does not explain every intermediate composite value,
so these are not converted into fabricated per-pixel accuracy or a clean-quality
claim. Low-confidence source estimates remain source estimates.

The matching5m signed16 orthophoto has no calibrated scale/offset per its README.
It is displayed in grayscale with a documented linear1st–99th-percentile stretch
(DN135–372), retaining acquired shadows. It is neither calibrated albedo nor an
image of current sunlight. Negative valid DN is not mistaken for no-data.

## Converted data and runtime contract

`frontend/public/planet-terrain/apollo17-nac-v1/manifest.json` describes85 local
GLB tiles, a3D Tiles1.1 `tileset.json`, source labels, hashes, geometry, confidence,
resolution, bounds, attribution and limitations. Final pack is below64MiB; exact
bytes and validation are recorded in `lunar-source-validation.json`.

The quadtree has4 levels at40/20/10/5m vertex/imagery sampling. Each tile has a129²
surface grid using exact source posts; no terrain subdivision manufactures detail.
There is no smoothing, invented crater, hole filling or vertical exaggeration.
Every same-level shared edge has byte-identical float positions. Parent boxes
bound all descendants, not just their coarser vertices. Geometric error is at
least the source sampling interval and the measured coarse triangle deviation.
Leaf error0 means the finite source-resolution endpoint, not perfect accuracy.

The root transform is Moon body-fixed: X at0° longitude, Y at90°E, Z north.
Its translation is the actual center surface point; its columns are east/north/up.
GLB vertices are `(east, up, −north)` to obey glTF Y-up; the standard3D Tiles
loader Y→Z conversion produces local ENU. Units remain metres. Runtime recentering
uses double-precision CPU transforms before GPU upload. No Earth/WGS84 data or
coordinate transform is used. Radius and source frame are explicit metadata.

Tile interiors are actual triangles with depth occlusion. An80m downward perimeter
skirt covers mixed-LOD cracks; skirts are explicitly rendering geometry, not
measured terrain. Their bounds are included. Default `KHR_materials_unlit`
materials preserve the source image's lighting. The runtime may compute normals
for a separately labeled illustrative relief-lighting mode. Source image shadows
must not be represented as current simulated illumination.

Original range data stays in the task cache. The final local pack is small enough
for the bounded private application shell/static delivery; it contains no global
lunar bulk data. The runtime agent owns actual TilesRenderer ellipsoid/cache/
cancellation/parse/disposal/navigation qualification.

## Files and local validation

New task-owned files:

- `scripts/planetdata/prepare_lunar_3d_tiles.py`
- `scripts/planetdata/test_prepare_lunar_3d_tiles.py`
- `scripts/planetdata/lunar_apollo17_sources.json`
- `frontend/public/planet-terrain/apollo17-nac-v1/` (manifest, tileset,3 labels,85GLBs)
- `docs/validation/solar-system-2.1/TERRAIN_SOURCE.md`
- `docs/validation/solar-system-2.1/lunar-gdal-crosscheck.json`
- `docs/validation/solar-system-2.1/lunar-source-validation.json`

Exact repeatable commands from the worktree:

```text
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/planetdata/prepare_lunar_3d_tiles.py --build
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/planetdata/prepare_lunar_3d_tiles.py --build --output /tmp/solar21-lunar-repro
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/planetdata/prepare_lunar_3d_tiles.py
/home/rocco/Astronomy-Hub/.venv/bin/python -m unittest discover -s scripts/planetdata -p 'test_prepare_lunar_3d_tiles.py' -v
git diff --check
```

The converter requires NumPy; this run uses the existing repository Python
virtual environment. Acquisition can be independently repeated explicitly with
`--fetch --cache <new-task-cache> --build --output <new-output>`. No implicit fetch
occurs. A separate rasterio/GDAL environment was used only for geodesy cross-checks;
it is not an application/runtime dependency. Temporary development tools did not
modify repository dependency files.

Result:10 tests PASS;85 tiles verified,5m finest spacing,204.375m actual relief,
0.0m shared-edge difference. A clean second conversion is checked for identical
relative paths and SHA-256 of every generated file. Whitespace check PASS.
Remaining gates: actual Docker/browser pixels and resource/lifecycle acceptance,
independent source review, exact global-frame alignment if later required,
physical-device qualification and owner visual acceptance. Recommended next task:
complete the actual NASA TilesRenderer product journey and independent review.

Independent review correction: promoting the float32 source height array to
float64 **before** adding the lunar radius removes an avoidable0.0625m radial
rounding error. A dedicated regression failed before the change and passes after.
Original source heights and image bytes are unchanged; all85 GLBs and receipts
were regenerated, and all90 output files reproduced identically.
