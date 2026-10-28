# Independent terrain implementation and source review

Reviewer: Solar atmosphere specialist; did not author the terrain runtime or
conversion. Reviewed the current recovery worktree for the root's explicitly
authorized Solar 2.1 scope. No commit/push, Windows interaction or external
publication by this reviewer.

**Result: no remaining actionable terrain implementation/source findings after
the corrections below.** This is a code/data review and independent numerical
verification. It does not grant owner visual acceptance, physical-device
qualification, hosted check success or source distribution approval.

## Findings and corrections

1. **Corrected: avoidable radial quantization before local rebasing.**
   `body_fixed()` added the 1,737,400m lunar radius directly to a float32 source
   height array. NumPy retained float32, creating 0.125m radial increments before
   conversion into local coordinates. Independent original-height comparisons
   found 0.0625036m maximum error in the root tile. This is below the dataset's
   reported uncertainty, but unnecessary and inconsistent with the intended
   double-precision source-to-local conversion. The source author now casts
   height to float64 before radius addition, added a red/green regression,
   regenerated all 85 GLBs and updated their hashes/receipts. The reviewer then
   checked **1,414,485 actual surface vertices** using GDAL-decoded PDS coordinates
   and original source heights: maximum position difference **0.000122071m**.
   [Initial failure](evidence/terrain-independent-geometry-red.json) and
   [independent corrected audit](evidence/terrain-independent-geometry.json).
2. **Corrected defensively: newly loaded geometry rechecks camera clearance.**
   Collision checks previously ran only when the camera moved. Loading/refining
   a tile beneath a stationary camera could change its clearance until the next
   input. The terrain author now marks the camera dirty on model load and tile
   updates/visibility changes, preserving the existing 25m clearance check on
   the next frame. This was a code-path finding, not a reproduced collision in
   the current dataset; it is not presented as observed camera penetration.

## Source and coordinate checks

Reviewed `prepare_lunar_3d_tiles.py`, its tests, pinned acquisition JSON, all three
attached source labels, original cached byte ranges, source README and SIS/frame
text, datum guide, generated manifest/tileset, GLB container layout and source
receipts. Current manifest SHA256:
`3cfcbb6c270bbe1df4eadfacefc143e2843d5cd1d18994a72f6fb1c9ce3c3543`.

- Independently SHA-checked all three original range files and header files.
  No new imagery or global product download was made during review.
- Independently repeated GDAL/rasterio projection decoding of 15 PDS control
  points across the three attached headers. Maximum coordinate discrepancy from
  the stated source mapping is **2.96e−12 degrees**.
  [Control-point audit](evidence/terrain-independent-gdal.json).
- Independently reconstructed every tile's surface positions from original
  float32 heights promoted before radius addition, using GDAL's inverse
  projection instead of the converter's offset formula. Verified root ENU
  basis determinant1 and source center, metre units, glTF Y-up→ENU mapping,
  original byte hashes, and absence of external image/buffer URIs in all85 GLBs.
- Original negative elevations, 5m sampling, confidence/no-data limitations and
  the source's photographic shadows are disclosed. The 80m seam skirts are
  explicitly rendering geometry. Parent bounds, hierarchy progression and
  same-level geometry seams pass the focused source suite and pack verifier.
- PDS products use the lunar mean Earth/polar-axis frame; exact DE realization
  is not asserted. The source-local scene and explicit return to native Moon
  therefore do not claim sub-metre ME421 registration or continuous frame-matched
  flight. That limitation is appropriate and remains open.
- Freshly checked official [LROC terms](https://www.lroc.im-ldi.com/about/terms):
  the PDS source products used here are public domain; the displayed
  NASA/GSFC/Arizona State University attribution is appropriate. The review did
  not infer rights in curated images from that rule or from the renderer license.

## Runtime checks

Reviewed `TerrainScene.ts`, `terrainTransport.ts`, `terrainContracts.ts`,
`TerrainWorkspace.tsx`, relevant tests and the installed NASA0.5.3 parser/cache
contracts. Actual `TilesRenderer` owns traversal and loading; its default WGS84
ellipsoid is replaced with the1,737,400m Moon sphere for both `ellipsoid` and
`surface`. The inverse ENU parent transform cancels source body-fixed coordinates
in CPU matrices before GPU upload. Source imagery is unlit by default; optional
relief lighting is identified as illustrative rather than current UTC sunlight.

Transport admits only the one same-origin qualified pack, rejects external or
nested tileset requests and redirects, streams with per-file/session bounds,
and shares owner cancellation with root and tile loads. Current GLBs contain all
images/buffers internally, so they do not introduce subordinate external fetches.
Own queues/cache limits, parse concurrency, resize, reduced-motion damping,
keyboard controls, context reconstruction and model/material/texture disposal
follow the package's installed contracts. Native return paths retain observer
state separately from lunar coordinates and preserve canonical UTC.

The author's final Linux browser receipt was inspected:
`output/playwright/solar-system-2.1/terrain-browser-final-linux/results.json`.
It reports7 actual groups passing, zero recorded page errors, real finest-LOD
geometry, bounded cache usage, resize/input/reduced-motion, context replacement,
HTTP503 recovery and native-mode return/disposal. This is inspected supporting
evidence, not a reviewer-operated Windows run. Immediately recorded disposed
transport snapshots may show an aborting fetch until its promise settles; owner
abort and subsequent rejection are tested, and zero owned GPU resources are
recorded. No claim of synchronous network settlement is made.

## Commands run independently

```text
npm --prefix frontend test -- --run tests/terrainContracts.test.ts tests/terrainTransport.test.ts
  2 files passed, 19 tests passed
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/planetdata/prepare_lunar_3d_tiles.py
  PASS; 85 tiles, 5m finest spacing, 204.375244m relief, 0.0m shared-edge delta
/home/rocco/Astronomy-Hub/.venv/bin/python -m unittest discover -s scripts/planetdata -p 'test_prepare_lunar_3d_tiles.py' -v
  final corrected source: 10 tests passed
uv run --offline --with rasterio python scripts/validation/verify_solar21_terrain_source.py
  PASS; 6 source hashes, 85 tiles, 1,414,485 vertices, max0.000122071m error
git diff --check
  exit 0, no output
```

Reviewer-owned additions are this report, the independent audit script and its
three JSON receipts. Source/runtime corrections were made by their authors.
Next gate: root's final current-build Docker/Windows application journeys,
including the corrected generated pack, then hosted checks and owner evaluation.
