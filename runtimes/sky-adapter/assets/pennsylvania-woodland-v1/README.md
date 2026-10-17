# Illustrative Pennsylvania woodland v1

Original generated 360-degree artwork inspired by rural northwestern Pennsylvania.
**Illustrative, not surveyed ORAS terrain.** No real location or measured skyline is
represented. Artistic ridge heights are decorative pixels, never scientific horizon
measurements. Observer coordinates and native astronomical calculations are unchanged.

The source PNG is preserved exactly. The contained adapter selects its observed-frame
native HiPS landscape only in embedded presentation. Standalone native landscapes
remain available. The runtime loads 12 local order-zero 512px RGBA tiles and an
Allsky atlas (3 columns, 4 rows); no external asset service or dependency is added.

Generated with the built-in image generation tool, using the prompts in
`provenance.json`. No purchased or third-party landscape is used. The generated
matte has near-opaque interior alpha rather than exactly 255. Native-format encoding
normalizes alpha 250..255 to 255 and preserves antialiased boundaries, with
premultiplied-alpha bilinear resampling. The source PNG is not altered. Failed
opacity checks and the first draft remain in the task evidence.

Repackage from repository root with existing Chromium, C compiler and pinned SWE
source (no native renderer changes):

```
node scripts/runtime/build_pennsylvania_landscape.mjs
```

Set `SWE_SOURCE_DIR` to the pinned SWE `src` directory when it is elsewhere;
the packer checks the HEALPix source hash before compiling.

The helper calls the pinned source's unmodified HEALPix projection for format
encoding only. `manifest.json` records all bytes and source hashes. The panorama's
cyclic equirectangular longitude wraps; browser seam views remain necessary to
assess the artwork visually. No geospatial data should be derived from this image.
