# Solar System 2.3 — independent asset/source-adapter review

Reviewer: science workstream, which did not author the asset generator, delivered asset manifest or celestial source adapter. Review date: 2026-11-02. Branch `recovery/reconcile-20261026`, starting HEAD `767ec130faa60606e689a889f7ed4c3c58ee74fc`; reviewed working-tree files listed below. No commit, push or external publication performed.

**Result: no actionable asset-generation or source-adapter defect found in the reviewed scope.** This is a source/data/code review, not browser appearance or complete graphics-lifecycle acceptance. The legacy frame coefficients were authored by this reviewer and received a separate independent science review; this report does not count as independent review of those coefficients.

## Scope

Inspected `scripts/planetdata/build_solar23_assets.py`, `test_solar23_assets.py`, reused `build_solar22_textures.py` compact-GLB/JPEG functions, `frontend/public/planetary-assets/v2.3/manifest.json`, delivered GLBs/JPEGs, cached original NASA/PDS files and labels, `frontend/src/features/celestial/celestialAssets.ts`, relevant shared resource-owner behavior and `celestialBody.test.ts`. Read the asset worker's `ASSETS.md` and explicit PDS frame/unit declarations. No unrelated docs or runtime surfaces were scanned.

## Independently checked evidence

- All 30 runtime files exactly match the manifest inventory, with no extra held derivatives. Total is **23,524,035 bytes including the manifest**. Each delivered derivative's byte count and SHA-256 match. All source originals match their pinned SHA-256 values.
- Twelve NASA originals each contain one image used by the expected base-color texture. Independently decoded dimensions match the manifest; embedded images have no ICC profile. Cached source pages credit NASA VTAD for all twelve bodies.
- Existing tests independently compare original and delivered accessors, nodes, meshes, samplers and materials, plus every non-image buffer view. They passed. Original source UV/index/geometry data survives compact delivery; the image changes are bounded resampling/JPEG encoding. No higher detail tier exceeds the original native image dimensions.
- Phobos vertex/facet counts and positions/indices match the source PDS table after explicit float32 packing; Deimos retains the original 5-degree radial samples, merging only repeated seam/pole entries. Closed-surface edge, Euler and positive-volume checks pass. Neither shape is normalized to a mean-radius sphere or recentered by the builder.
- PDS4 labels and the PDS3 Phobos unit-label hashes match the manifest. The Phobos unit label explicitly supplies kilometers. The original source body-centered origin remains unchanged, with no new COM correction.
- Original source physical envelopes are **13.930039097852525 km** for Phobos and **8.7068 km** for Deimos. The source adapter exposes these envelopes separately from nominal scientific radii and classifies the geometry as `measured-shape-km`.
- The source adapter preserves Phobos `IAU_PHOBOS` / `pds-gaskell-phobos-pck00006` and Deimos `PDS_THOMAS_DEIMOS` / `pds-thomas-deimos-label-v1` pins. These describe the legacy mesh coordinate models. The new renderer must continue checking those pins before applying a body-frame quaternion.
- No measured-shape texture is fabricated. Neither native-1024 Umbriel nor Miranda receives a fictitious higher-resolution detail tier. Unknown appearance IDs return null. Existing Solar bodies retain the shared Solar appearance catalog; their scientific target/center identity is not overwritten by appearance lookup.
- Detail texture loading preserves the GLTF `flipY=false` convention for source UV assets and the existing equirectangular convention for map assets. It supplies known source dimensions to the bounded resource owner, and requests no more than the source dimensions. GPU compression is explicitly unimplemented, with no invented memory saving claim.

## Rights/provenance checks

Fresh official retrievals confirmed the [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/), the [PDS FAQ](https://pds-ppi.igpp.ucla.edu/faq.jsp), and representative [Io](https://science.nasa.gov/resource/io-3d-model/) and [Titan](https://science.nasa.gov/resource/titan-3d-model/) source pages. Cached acquisition pages were checked for all twelve NASA model credits. NASA guidance permits relevant factual educational/informational use with source acknowledgment and no endorsement; it distinguishes separately identified third-party material. The PDS FAQ identifies archived datasets as public-domain data and requests suitable citation. The manifest retains the source institution, download URL, product/version description, terms URL, hashes and relevant PDS DOI/author metadata.

The rights-constrained JHUAPL/SBMT alternatives remain outside the runtime inventory and outside the generator's admitted source list. Their availability for download or a related paper's license was not treated as permission to redistribute the files. Only the PDS replacements are delivered.

These checks support the documented source disposition. They do not authorize a future change in use, removal of attribution, or a claim of NASA endorsement.

## Scientific disclosure checks

NASA model UV registration is explicitly **illustrative**, with unknown datum/longitude fields left null. A qualified pole transform is not used to claim texture registration. Titan is labeled an atmospheric-haze visualization, not an infrared/radar surface mosaic or calibrated natural-color photograph. The Uranian and Triton sources retain partial-coverage disclosures and neutral gaps. No fabricated relief, terrain, unobserved geography or synthetic inpainting was found in the builder.

The PDS shapes have qualified registration only against their documented older source models. They do not claim modern PCK11 registration or independent observational orientation accuracy. Deimos' use of TDB days follows the stated IAU/SPICE convention; the source label does not itself name a time scale. Frame-evaluator qualification is separately recorded in `SCIENCE.md` and the independent science review.

The inherited Moon asset URL is a `/planet-data/` proxy resource, not a newly bundled file. The adapter preserves the existing LROC/native-ME declaration. Its live proxy availability and visual registration remain part of root's Earth–Moon browser/runtime qualification, not a new asset claim from this review.

## Commands and results

```bash
output/playwright/solar-system-2.3/asset-tools-venv/bin/python -m unittest discover -s scripts/planetdata -p test_solar23_assets.py
npm --prefix frontend test -- tests/celestialBody.test.ts
```

Results: **6 asset tests passed**, **5 shared-body tests passed**.

Additional independent Python inspection decoded every delivered/source file and label, checked all SHA-256/size/dimension/image-input assertions, and compared the exact directory inventory: **PASS 30 files / 23,524,035 bytes**. A `tsx` adapter inspection exercised both measured shapes, their expected frame/model IDs and physical envelopes, absent shape detail textures, native-1024 limits, and unknown-source fallback: **PASS**.

No files other than this review report were changed as part of this independent asset review. Docker/browser/GPU performance, actual journey imagery, mobile composition, source-frame application in the finished scene, source-window navigation and owner visual acceptance remain required in the parent integration workstream.

## Reviewed file identities

- `frontend/public/planetary-assets/v2.3/manifest.json`: `a1870b8ddfc10e2778499fa2bcf2b5d233a85abd676bc48e4c8de07ed0843674`.
- `scripts/planetdata/build_solar23_assets.py`: `5fa179bfc9f4d418daa617fd0735757fa1e03cea3a698be78faa85d579d51432`.
- `frontend/src/features/celestial/celestialAssets.ts`: `6ad3749568eee83e5e64391b713d523ade429a628aa2d5853ba1ee2f280abdf8`.
