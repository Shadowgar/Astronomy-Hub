# Solar System 2.3 asset qualification

Status: bounded asset pipeline and local source-preservation checks passed, 2026-11-02. Runtime integration and visual acceptance are separate gates. This document belongs to the owner-authorized Solar System 2.3 reconstruction; the parent agent loaded `CORE_CONTEXT.md`, `LIVE_SESSION_BRIEF.md` and the `solar_reconstruction` manifest pack. No additional repository documentation pack was scanned by the asset worker. The owner attachment and source/runtime asset scripts were inspected.

Branch: `recovery/reconcile-20261026`; acquisition began at `767ec130faa60606e689a889f7ed4c3c58ee74fc`. No commit, push, merge, deployment, public source publication, browser or GPU run was performed by this worker.

## Acquisition and admission

Root-approved limits: 128 MiB aggregate new raw image/model acquisition, 32 MiB per asset, 64 MiB final new runtime pack target. The twelve original NASA GLBs total **69,883,684 bytes**. Admitted PDS shapes total **4,333,103 bytes**. Two JHUAPL ZIPs totaling **3,879,928 bytes** failed redistribution qualification and remain HOLD in the source cache. Aggregate acquired image/model bytes, including held sources: **78,096,715**. The delivered models and detail JPEGs total **23,480,719 bytes**, plus the small manifest. No full USGS GeoTIFF or bulk PDS archive was downloaded.

Originals, source-page captures, acquisition records, decoded-source inspection and a contact sheet are in `output/playwright/solar-system-2.3/source-cache/`. They are research cache, not automatic public runtime assets. `acquisition.json`, `shape-acquisition.json`, `inspection.json` and `source-pages.json` retain URLs, dimensions, byte counts and hashes. Intermediate byte-exact extracted PNG copies were removed after inspection; the original pixels remain embedded in the retained GLBs. Extracted OBJ files are retained alongside their ZIPs. A temporary Pillow 11.3.0 environment is under `output/playwright/solar-system-2.3/asset-tools-venv`; no application dependency changed.

## Selected practical imagery: original NASA VTAD models

Each [NASA 3D resource](https://science.nasa.gov/3d-resources/) entry credits NASA Visualization Technology Applications and Development (VTAD), with an original 2019 publication and download dated September 9, 2023. Use is recorded under the [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/); retain attribution and do not imply endorsement. The publication pages do **not** identify per-pixel acquisition history, geodetic datum, longitude convention, or a map-to-IAU-frame transform. Therefore these are **NASA source visualization assets with illustrative surface registration**, not independently qualified scientific global maps.

All twelve originals contain one source mesh, one primitive and one opaque RGBA PNG `baseColorTexture`. No normal map, displacement map or invented relief is added. Their original material has metallic factor zero and roughness approximately 0.9. Embedded images have no ICC profile; the glTF base-color semantic is sRGB. Runtime conversion must decode sRGB to linear once and preserve the existing single output transform.

All models use the original `cylindrically_mapped_sphere` mesh. Io, Europa, Ganymede, Callisto, Titan and Enceladus have 10,604 vertices; the remaining six have 10,606. Each has 20,508 triangles. The raw model bounds are approximately ±500 on each axis and are visualization units, not physical kilometers. Physical radius must come from the science contract.

The measured UV anchors on the source sphere are +X → u≈0.25, −X → u≈0.75, +Z → u≈0, −Z → u≈0.5, +Y → top (v≈0), −Y → bottom (v≈1). These establish source-local UV registration only. They do not establish which meridian is longitude zero. Preserve positions, normals, indices, texture coordinates, nodes and sampler; do not replace the source sphere with Three.js `SphereGeometry` and assume the same registration. No PCK rotation can turn an unregistered texture into a qualified geodetic texture.

| Body | Original texture | Original GLB bytes | Source status |
|---|---:|---:|---|
| [Io](https://science.nasa.gov/resource/io-3d-model/) | 4096×2048 | 17,479,700 | Recognizable volcanic mosaic; image acquisition/geodetic lineage unspecified by VTAD. |
| [Europa](https://science.nasa.gov/resource/europa-3d-model/) | 4096×2048 | 12,287,068 | Recognizable lineated mosaic; acquisition/geodetic lineage unspecified. |
| [Ganymede](https://science.nasa.gov/resource/ganymede-3d-model/) | 2048×1024 | 4,075,564 | Recognizable mixed terrain mosaic; source cap is 2048, never upscale. |
| [Callisto](https://science.nasa.gov/resource/callisto-3d-model/) | 2048×1024 | 4,452,928 | Recognizable cratered mosaic; source cap is 2048, never upscale. |
| [Titan](https://science.nasa.gov/resource/titan-3d-model/) | 4096×2048 | 686,348 | Ochre atmospheric-haze visualization; **not** infrared/radar surface imagery and not a calibrated natural-color photograph. |
| [Enceladus](https://science.nasa.gov/resource/enceladus-3d-model/) | 4096×2048 | 17,925,448 | Recognizable fractures and terrain in NASA visualization texture; no measured displacement. |
| [Ariel](https://science.nasa.gov/resource/ariel-3d-model/) | 2048×1024 | 1,364,104 | Partial coverage; large neutral regions retained unchanged. |
| [Umbriel](https://science.nasa.gov/resource/umbriel-3d-model/) | 1024×512 | 606,920 | Partial coverage; native cap 1024; large neutral regions retained. |
| [Titania](https://science.nasa.gov/resource/titania-3d-model/) | 2048×1024 | 1,932,572 | Partial coverage; large neutral regions retained unchanged. |
| [Oberon](https://science.nasa.gov/resource/oberon-3d-model/) | 2048×1024 | 1,518,548 | Partial coverage; large neutral regions retained unchanged. |
| [Miranda](https://science.nasa.gov/resource/miranda-3d-model/) | 1024×512 | 688,936 | Partial coverage; native cap 1024; large neutral regions retained. |
| [Triton](https://science.nasa.gov/resource/triton-3d-model/) | 4096×2048 | 6,865,548 | Partial coverage; large neutral regions retained unchanged. |

Original source hashes and exact files:

| Body | Original file URL | SHA-256 |
|---|---|---|
| io | [Io_1_3643.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/i/Io_1_3643.glb) | `118a6bf7eda476ea6b454039f621778189141a82acb3ad0aaa762f1771c5a723` |
| europa | [Europa_1_3138.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Europa_1_3138.glb) | `fe88cbe326574a658c9d3b0885d1a38deea3ebfb354772eb3b95fe0f3f3d542c` |
| ganymede | [Ganymede_1_5268.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/g/Ganymede_1_5268.glb) | `367bc128197bf1d25ef5af5269f2d1902aababaae167c3c8d6529443b0100d6f` |
| callisto | [Callisto_1_4821.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/c/Callisto_1_4821.glb) | `0bdbd5600a4be4bef4bd85e53f6226f49e73a66c85310219402627e59457c303` |
| titan | [Titan_1_5150.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Titan_1_5150.glb) | `9e92e30902a26130895bf2558172d7f36186eb4a51368a60bc3ec1d01134fde4` |
| enceladus | [Enceladus_1_504.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Enceladus_1_504.glb) | `7548234bae15047d6c1af6bec4f348748b1acae7d4e7bfbe50e5bb3dda75506f` |
| ariel | [Ariel_1_1158.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/Ariel_1_1158.glb) | `b7a5cd8ad3d48687cc3162861971a76a19fe9fad4726563e24b6cc917e9bd858` |
| umbriel | [Umbriel_1_1169.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/u/Umbriel_1_1169.glb) | `b523de7d1406289d540369c635d0b13576460c1fa85a885352afc71c3f118d71` |
| titania | [Titania_1_1577.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Titania_1_1577.glb) | `08556622082b283f2f52c9214636c22acf27300889374dd37197f11a4448324c` |
| oberon | [Oberon_1_1523.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/o/Oberon_1_1523.glb) | `7b42c417e523db2a22c744cd471587c26f07581564dae7c3b0c20986eea93add` |
| miranda | [Miranda_1_472.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/m/Miranda_1_472.glb) | `5a4d24c5fb237ae6d21d1a58857efb32fd0e53162754f17e4156618a541c4c57` |
| triton | [Triton_1_2707.glb](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Triton_1_2707.glb) | `a25df7ee7fe8679e3da8cca7f1a09ec7241ad5e0c7ad97a39f057b8c1a0043ce` |

Coverage gaps are data gaps. No inpainting, procedural geography, pole filling or enlargement of low-resolution sources is allowed. A finite rectangular texture is not proof of global measured coverage. A scientifically qualified body-pole transform, if supplied separately, still requires a surface-registration disclosure for these models.

## Admitted PDS irregular shapes

Both runtime shapes come from the NASA Planetary Data System Small Bodies Node. The [PDS/PPI FAQ](https://pds-ppi.igpp.ucla.edu/faq.jsp) states archived PDS datasets are public domain and requests citation for applications. The individual product labels and bundle descriptions inspected here contain no more restrictive terms. This is the concrete redistribution basis; no permission is inferred merely from a public download. Attribution, DOI and exact product hashes are retained in the manifest.

| Body | Original source | Native representation | Coordinates and limitations |
|---|---|---|---|
| Phobos | [Gaskell Phobos Shape Model V1.0](https://sbn.psi.edu/pds/resource/phobosshape.html), [DOI](https://doi.org/10.26033/xzv5-bw95) | Q=64 vertex/facet table, 25,350 listed vertices / 49,152 triangles; 24,578 referenced vertices | Native Cartesian kilometers, source body-centered origin and axes unchanged. Source frame explicitly `pck00006.tpc`; current PCK11 alignment is **not** claimed. |
| Deimos | [Thomas Small Body Optical Shape Models V1.0](https://sbn.psi.edu/pds/resource/oshape.html), [DOI](https://doi.org/10.26033/g5e0-kh52) | Native 5° planetocentric latitude/longitude/radius grid: 37×73 samples including duplicate poles and 0°/360° seam | Original radii in km; deterministic cell triangulation yields 2,522 distinct vertices and 5,040 triangles. Source reports ~400 m uncertainty through much of 200–355° longitude. |

Phobos combines 224 Viking Orbiter 1 VIS-A/VIS-B images from 1976–1978 with eight Phobos 2 VSK images from 1989; Gaskell prepared the model March 11, 2006. The [bundle description](https://sbnarchive.psi.edu/pds4/non_mission/gaskell.phobos.shape-model/document/bundle_description.txt) names the source frame, 18 m/component formal landmark uncertainty and 25 m/component residual. Q=64 is an original reduced source product, not fabricated detail. The PDS4 XML migration omits the coordinate units; the [original PDS3 label](https://sbnarchive.psi.edu/pds3/multi_mission/VO1_SA_VISA_VISB_5_PHOBOSSHAPE_V1_0/data/phobos_ver64q.lbl) explicitly gives `VERTEX_COORDINATES UNIT=KILOMETER`, and the PDS catalog says data content was unchanged. Original vertex positions and facet indices are retained exactly as float32 values/zero-based indices. The 772 unused duplicate boundary vertices remain in the GLB; they are excluded from the surface Euler count, as described by Gaskell's [ICQ format documentation](https://sbnarchive.psi.edu/pds4/non_mission/gaskell.phobos.shape-model/document/icqmodel.txt).

The [Deimos label](https://sbnarchive.psi.edu/pds4/non_mission/ast-sat.thomas.shape-models_V1_0/data/m2deimos.xml) explicitly defines planetocentric coordinates and **radius** in kilometers. Its generic bundle description says diameter; the product-specific label and field unit govern. The source pole is RA 316.65°, Dec 53.53° J2000, with W=79.41°+285.1618970°d. These older source values are retained in metadata; they do not prove registration to current PCK11. Longitude sign follows the [PDS3 data dictionary LONGITUDE definition](https://pds.nasa.gov/data/pds4/documents/document_pds3_standards/psdd_rev_E_20020828.pdf): planetocentric coordinates are right-handed and east-increasing. This is a convention-derived interpretation, not an invented explicit keyword. No source radius is altered or interpolated; identical pole/seam samples are shared. Cell diagonals are derived topology, not original measured triangular facets.

The science worker qualified exact legacy model evaluation against independent CSPICE references: six matrices spanning 2025, November 2026 and 2030 passed within 2e-10 per component. Evidence is `tests/fixtures/planetary-systems/solar23/spice-shape-frame-reference.json`; backend orientation/SPK tests reported 74 passed. This validates source-coefficient evaluation, not independent observational accuracy. Asset geometry pins the expected frame/model IDs so the renderer can reject a mismatched orientation:

- Phobos: frame `IAU_PHOBOS`, model `pds-gaskell-phobos-pck00006`, source PCK SHA-256 `8aacb5dff544bed1f7cf0659296a1ca75896128a0a729447be0a4deb4de4ecb4`.
- Deimos: frame `PDS_THOMAS_DEIMOS`, model `pds-thomas-deimos-label-v1`, source XML SHA-256 `74b4c557e6827940430b2d670ec972d9a5d5dc63ef0a95b2b6ebd141ab78f634`. TDB days follow IAU/SPICE convention; the source label does not explicitly name the time scale.

Both models use +X at the prime meridian, +Y at 90° east, +Z north. Their source body-centered origin is retained without a new COM correction. Both generated surfaces have every edge shared twice, Euler characteristic 2 and positive signed volume. Phobos has maximum vertex radius **13.930039097852525 km** and mesh volume **5757.902417954685 km³**; Deimos has **8.7068 km** and **1013.6423295406204 km³**. Preserve native km coordinates with a documented global unit conversion. Scaling a maximum-radius-normalized mesh to a mean radius would distort these source dimensions. Neutral materials add no invented albedo or texture registration.

| Original | Bytes | SHA-256 |
|---|---:|---|
| [phobos_ver64q.tab](https://sbnarchive.psi.edu/pds4/non_mission/gaskell.phobos.shape-model/data/phobos_ver64q.tab) | 4,246,671 | `b054bd2e53057f8d52286483a1b78cef1f6de802d7ca6b6d9310ca287dae2f2b` |
| [m2deimos.tab](https://sbnarchive.psi.edu/pds4/non_mission/ast-sat.thomas.shape-models_V1_0/data/m2deimos.tab) | 86,432 | `9a4dbc132c7546acb2ef26a386d306f155519f0988c8052acb2276ddeb7ca2fd` |

The source cache contains original XML labels, source descriptions and the PDS3 Phobos units label. The builder pins raw data lengths/hashes and the manifest records label URLs/hashes. PDS downloads initially returned HTTP 403 with the default Python user agent; the honest `AstronomyHub-source-qualification/2.3` user agent succeeded. The [NAIF DSK listing](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/dsk/satellites/) was inspected as an alternative; no DSK was downloaded.

## Held JHUAPL sources: excluded from delivery

The newer [SBMT shared files](https://sbmt.jhuapl.edu/shared-files/) Phobos v004 and Deimos v002 models were acquired for qualification. Their page links the [JHUAPL legal notice](https://www.jhuapl.edu/Home/Privacy), which says: “Redistribution or commercial use is prohibited without express written permission.” The [SBMT terms](https://sbmt.jhuapl.edu/Terms-and-Conditions.php) request acknowledgment but provide no explicit override for those model downloads. The CC-BY license of the [2023 paper](https://doi.org/10.1186/s40623-023-01814-7) does not establish a separate license for these later files. Root approved HOLD and replacement with the PDS products above. No held model or derivative is present in the runtime directory or admitted by the generator.

Held cache originals: `phobos_g_148m_spc_obj_0000n00000_v004.obj.zip` (3,018,535 bytes, SHA-256 `69fffc77f4fd799767e50fc03631bea43f8d9110edcae8f355fad926136339fa`) and `deimos_g_167m_spc_obj_0000n00000_v002.obj.zip` (861,393 bytes, SHA-256 `b65b6923cefa0d97f34c55ae5e63e25df3421edd1165c658850152903e44595b`). Temporary GLBs were moved to `source-cache/*-shape-HOLD.glb`. The captured legal page is `jhuapl-privacy.html` (SHA-256 `ecbc8bf12cd25440526dbf2c663176b09729b8807c4a8d3da4ad7013a904ae3d`); `sbmt-terms.html` and `pds-ppi-faq.html` retain the separate policy evidence. No public download or paper attribution is treated as sufficient to clear that HOLD.

## Higher-provenance map research and rejected sources

The [JPL texture list](https://maps.jpl.nasa.gov/tmaps/jupiter.html) supplies actual 1440×720 Voyager mosaics of the Galilean satellites, but no sufficient geodetic registration metadata. Its [Saturn list](https://maps.jpl.nasa.gov/tmaps/saturn.html) explicitly calls its Titan and Saturn maps fictitious. Its Uranus and Neptune parent textures are also fictional. These parent/Titan textures are excluded.

| Body | Investigated original product | Scientific mapping and limitations | Disposition |
|---|---|---|---|
| Io | [USGS Galileo/Voyager color merged 1 km](https://astrogeology.usgs.gov/search/map/io_galileo_ssi_voyager_color_merged_global_mosaic_1km) | 11445×5723; simple cylindrical, planetocentric, positive west, −180…180; reference sphere 1821.460 km. Original color ratios use 756 nm/green/violet. Mixed 1–10 km monochrome resolution; interpolated poles; public domain. | 189 MB original exceeds per-file budget; host 403. Not downloaded. |
| Io | [NASA PIA09257](https://science.nasa.gov/photojournal/io-in-motion/) | Separate equal-area cylindrical presentation centered at 180°, with grid lines; enhanced colors. This is **not** the same projection as the USGS simple-cylindrical product. | 3.27 MB JPEG candidate inspected by metadata only. Do not wrap unchanged on a latitude-linear sphere. |
| Europa | [USGS Voyager/Galileo 500 m mosaic](https://astrogeology.usgs.gov/search/map/Europa/Voyager-Galileo/Europa_Voyager_GalileoSSI_global_mosaic_500m) | Latest qualified geodetic source should use its own PDS/ISIS label and control network. Metadata was not fully retrieved. | Catalog 403; no unsupported datum/longitude inferred. |
| Ganymede | [USGS color 1.4 km mosaic](https://astrogeology.usgs.gov/search/map/ganymede_voyager_galileo_ssi_color_global_mosaic_1_4km) and [I-2762](https://pubs.usgs.gov/imap/i2762/) | USGS map sheet uses sphere 2632.345 km, planetographic west-positive coordinates. The sheet is Mercator + polar stereographic, not a texture-ready equirectangular image. The underlying color mosaic merges infrared/visible color and monochrome imagery. | No sheet-to-texture substitution. Original map archive access blocked; use VTAD source UV with limits. |
| Callisto | [USGS Galileo/Voyager 1 km](https://astrogeology.usgs.gov/search/map/callisto_galileo_voyager_global_mosaic_1km) | 15138×7569; simple cylindrical; planetocentric; positive west, 0…360; radius 2409.3000488 km. April 1999 RAND solution, W0=259.51°, Saga fixed at 326°W. Public domain. | 110 MB original exceeds per-file budget; host 403. Not downloaded. |
| Titan | [NASA PIA19658, June 2015 map](https://science.nasa.gov/photojournal/titan-global-map-june-2015/) | Cassini ISS **938 nm near-infrared**; equidistant map, 4 km nominal pixels, sphere 2575 km, center 180°W. Data through April 7, 2014. A 3–5% northern gap remains. No topographic shading because haze scatters illumination. | Separate disclosed IR surface candidate. Must not relabel as natural color or haze. Page inspected; image not yet admitted. |
| Enceladus | [USGS Cassini 110 m mosaic](https://astrogeology.usgs.gov/search/map/enceladus_cassini_global_mosaic_110m) | Simple cylindrical; mean radius 252.1 km; source notes a 3.5° west registration shift. Need exact label/version to avoid confusing older and newer controls. | Host 403. No assumption that VTAD embedded map shares this registration. |
| Enceladus | [NASA PIA18435](https://science.nasa.gov/photojournal/color-maps-of-enceladus-2014/) | 100 m pixels; Cassini first ten years; enhanced color extending into UV/IR, not natural eye color. | 18.04 MB JPEG candidate; no full TIFF download. |
| Enceladus | [NASA PIA24027](https://science.nasa.gov/photojournal/enceladus-in-the-infrared-map-view/) | Equirectangular, center 0°, sphere 252.1 km, 200 m pixels. VIMS spectral ratios combined with ISS morphology; explicitly false color. | Suitable separately labeled spectral mode, not default natural-color surface. Not downloaded. |
| Ariel, Umbriel, Titania, Oberon, Miranda | [JPL Voyager mosaics](https://maps.jpl.nasa.gov/tmaps/uranus.html) | Original 1440×720 USGS grayscale mosaics; substantial unobserved regions. No complete source datum from this listing. | Acquired NASA VTAD visualizations preserve observed/missing areas; frame remains illustrative. |
| Triton | [JPL Voyager mosaic](https://maps.jpl.nasa.gov/tmaps/neptune.html) | Limited Voyager imagery; source lists 1440×720 but 2 px/degree, an internal resolution inconsistency. | Do not inherit inconsistent metadata. NASA VTAD original has independently measured 4096×2048 dimensions. |

## Compression and delivery

The installed Three.js package includes `KTX2Loader.js`, but `toktx`, `basisu`, `ktx` and `gltf-transform` are absent from PATH. No application dependency or toolchain was changed. KTX2/Basis is therefore investigated, **not implemented or benchmarked**. A production path would need a pinned encoder, delivered transcoder assets, renderer-format capability detection, source color-space preservation, GPU budget accounting and failure/context-loss tests. It must not be advertised as saving runtime memory until measured on the actual renderer.

Implemented delivery reuses Solar 2.2's native-UV compact-GLB technique. Preserve all geometry/accessors/UVs/nodes/samplers byte-for-byte, replacing only embedded image payloads with ≤1024-pixel overview derivatives. Stream higher-resolution JPEG detail up to the actual native dimensions (1024, 2048 or 4096). No upscale. Measured shape GLBs must preserve native kilometer vertices. Final runtime assets live under `frontend/public/planetary-assets/v2.3`, with exact hashes, byte/GPU reservations and truthful source status.

## Validation performed / remaining

Owned changes: `scripts/planetdata/build_solar23_assets.py`, `scripts/planetdata/test_solar23_assets.py`, `frontend/public/planetary-assets/v2.3/*`, and this report. The runtime directory contains the manifest, twelve overview GLBs, fifteen detail JPEGs and two PDS shape GLBs. Umbriel and Miranda have native 1024 textures and no higher-detail files.

Executed locally from the recovery worktree:

```text
output/playwright/solar-system-2.3/asset-tools-venv/bin/python scripts/planetdata/build_solar23_assets.py
PASS 14 bodies; runtime 23480719 bytes; raw sources 74216787 bytes; no upscale; original UV/km geometry retained

output/playwright/solar-system-2.3/asset-tools-venv/bin/python -m unittest discover -s scripts/planetdata -p test_solar23_assets.py
Ran 6 tests — OK

output/playwright/solar-system-2.3/asset-tools-venv/bin/python -m unittest discover -s scripts/planetdata -p test_solar22_textures.py
Ran 4 tests — OK

output/playwright/solar-system-2.3/asset-tools-venv/bin/python -m unittest discover -s scripts/planetdata -p test_acquire_solar_visual_assets.py
Ran 4 tests — OK

git diff --check
exit 0; no output
```

The updated shape tests first failed against the held manifest/files, then passed against the PDS replacements. Tests independently check every derivative's hash/size, native source resolution caps, original NASA geometry/UV/accessor/node/material/sampler preservation, unknown registration and partial-coverage disclosure, original Phobos coordinates/indices, all Deimos radial samples, closed mesh edges/Euler characteristic, source pins, and refusal to overwrite differing cache/derivative files. An offline repeat build must be byte-identical; differing derivatives are refused rather than overwritten silently.

The final offline repeat completed with the same PASS line, proving deterministic byte equality of all outputs. Exact manifest-to-directory inventory matched all 30 files, **23,524,035 bytes including the manifest**, with no held files. One mistyped discovery pattern (`test_acquire_visual_assets.py`) matched zero tests and returned exit 5; it was corrected to the actual filename shown above, which ran four tests successfully.

Docker runtime integration, browser/GPU behavior and owner visual acceptance belong to the parent integration task and were not run by this worker. Geodetic registration of NASA textures remains unqualified. The PDS meshes use their separately qualified older source rotation models; no alignment to current PCK11 is claimed. KTX2 is deferred with no measured performance benefit claimed. No commit, push or PR update was performed here. Recommended next step: parent renderer integration and bounded runtime/browser qualification, preserving these source limitations in the UI.
