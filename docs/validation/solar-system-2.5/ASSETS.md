# Solar System 2.5 — spacecraft models and event sources

The four flagship mission identities use three independently sourced NASA VTAD
models. Voyager 1 and Voyager 2 share spacecraft design geometry; they must retain
separate trajectory identities. This qualification covers model bytes, geometry,
materials, bounded acquisition, approximate physical scale and source records. It
does not qualify historical attitude, epoch-dependent hardware configuration,
navigation accuracy, browser appearance, GPU allocation or owner acceptance.

## Sources and delivery

| Model | Official source | Original bytes | Delivered triangles | Materials |
|---|---|---:|---:|---:|
| Voyager twins | [NASA Voyager model](https://science.nasa.gov/resource/voyager-3d-model/) | 3,128,204 | 20,390 | 5 |
| Cassini–Huygens | [NASA Cassini model](https://science.nasa.gov/resource/cassini-3d-model/) | 5,852,640 | 26,020 | 10 |
| New Horizons | [NASA New Horizons model](https://science.nasa.gov/resource/new-horizons-3d-model/) | 3,293,532 | 8,280 | 6 |

Every delivered GLB is byte-identical to the individually downloaded NASA file.
No mesh decimation, material replacement, normal-map conversion, texture resizing,
node flattening or animation invention occurred. All source vertices, faces, UVs,
normals, transforms, PBR parameters, embedded PNGs and transparent source root
meshes remain intact. Files are self-contained: no external image/buffer URIs,
skinning, animations or GLB extensions are required. The builder checks decoded
geometry, finite transforms, triangle index bounds and embedded image dimensions.

Original GLB SHA-256:

```text
voyager       5338241f2e89e9cfe3ebb82f519b4cad64c97e66883cccba6fdda98667aec731
cassini       cacdca3279b28e64280ff8e823f572311f67a83bde2d0435b26f515a1b7926be
new-horizons  cf152d8cea17c4a83711041cb0d29ca1d980bfafa084ada2656569ea92cdd73f
```

Exact source URLs, bytes, hashes and acquisition times are in
`asset-source-records.json`; supporting event documents are in
`mission-event-sources.json`. Original sources stay under ignored
`output/playwright/solar-system-2.5/assets/source-cache/`. No archive crawl or source
archive publication occurred. Three models total **12,274,376 bytes**; models and
manifest total **12,293,436 bytes**. Including all 28 unique retained source/event
documents, acquisition totals **20,346,699 bytes**, below the 256 MiB aggregate
and 64 MiB individual limits. The visual pack is below its 96 MiB cap. The asset
manifest's `rawSourceBytes` counts its own ledger (16,100,086 bytes); the larger
total here also includes fifteen subsequently acquired event documents, deduplicated
against that ledger. No secondary mission mesh is silently substituted.

## Physical scale and configuration

The NASA GLBs identify the Blender glTF exporter but supply no independently
documented physical export-unit calibration. Treating their numeric values as
verified metres would make the New Horizons antenna approximately ten percent
too small. We use one uniform wrapper scale derived from an independent published
antenna diameter; original geometry remains untouched.

| Model | Independent antenna reference | Source-world X/Z span | Metres per source unit | Approximate full extent X × Y × Z, metres |
|---|---|---:|---:|---|
| Voyager | [3.7 m HGA](https://science.nasa.gov/mission/voyager/spacecraft/) | 3.8121395111 | 0.9705835763 | 7.524 × 10.713 × 16.412 |
| Cassini | [4 m HGA, NASA/JPL spacecraft components, page 2](https://solarsystem.nasa.gov/system/downloadable_items/1944_humanspacecraft.pdf) | 4.0090031624 | 0.9977542641 | 17.943 × 11.636 × 13.077 |
| New Horizons | [2.1 m HGA](https://www.nasa.gov/image-article/new-horizons-approaches-pluto/) | 1.8878152370 | 1.1123969967 | 2.763 × 2.360 × 3.310 |

Reference nodes are respectively `tex_02_AO` (1), `dish` (3) and `AO_dish` (1).
The measurement is the larger X/Z span of their decoded, world-transformed
antenna vertices. The two spans agree within one percent. Independent tests
recalculate the span from source accessor extents and check the unchanged node
hierarchy. The references are rounded educational dimensions. Neither the model
proportions nor the resulting complete extents are engineering CAD or metrology.
Long deployed appendages are included, so the full extents exceed bus dimensions.
The older Cassini components sheet is used only for the antenna dimension, not
its superseded preflight mission dates.

`centerSource` is the model's geometric bounding-box center for camera framing,
**not** a qualified spacecraft center of mass or ephemeris reference point. The
manifest gives bounds, uniform scale and radius around that display center. A
renderer may translate the complete scene by its negative for inspection; it
must preserve the node hierarchy. It must not advertise metre-level placement of
the model relative to a navigation solution. Scene axes are glTF right-handed
Y-up; antenna references lie in X/Z. No spacecraft-frame-to-inertial transform
has been qualified.

All models are explicitly **illustrative inspection poses**. No CK, FK or SCLK
attitude chain has been qualified; no orientation is inferred from velocity or
drawn as an observed Earth-pointing state. Instrument articulation and deployment
are static. Cassini's source includes named Huygens geometry (`foil_gold_h` and
`huygens_strip`). Its attached probe is preserved and must be visibly described
as a **Cassini–Huygens reference configuration**, including when browsing epochs
after separation. It is not a reconstruction of the hardware at that epoch.

## Rights

Each of the three exact resource pages credits **NASA Visualization Technology
Applications and Development (VTAD)**. The inspected GLB asset metadata identifies
the exporter and no additional copyright restriction. The
[NASA media policy](https://www.nasa.gov/nasa-brand-center/images-and-media/)
expressly includes polygon and texture data and permits informational simulations
with appropriate credit. This supports these specific educational model assets;
it is not a blanket claim that everything on a NASA domain is public domain.
Third-party exceptions, NASA insignia restrictions and the prohibition on implied
endorsement remain applicable. No separate NASA branding asset is added. The
older New Horizons printable model with NASA/JHUAPL/SwRI/individual credits is a
different source; its rights are not substituted for the chosen VTAD GLB record.

## Event precision and source conflicts

`mission-events.json` supplies **32** explicitly sourced milestones. Dates with
only day precision have noon as a representative navigation epoch and retain
`precision: day` and `epoch_role: representative-noon-not-exact-event`. Noon is
not asserted to be the physical event time. Minute and second values preserve
the published spacecraft event precision. This precision is not trajectory
accuracy. No current spacecraft status, live telemetry, surface footprint or
attitude is invented from these records.

Voyager flybys use the [NSSDCA encounter table](https://nssdc.gsfc.nasa.gov/planetary/voyager-periapse.html),
which explicitly identifies spacecraft UTC. It resolves the generic Voyager 2
page's contradictory Saturn date/time: the record used is
**1981-08-26 03:24:57 UTC**. The [Voyager fast facts](https://science.nasa.gov/mission/voyager/fast-facts/)
give Voyager 2's heliopause date as **2018-11-05**, instead of the generic page's
inconsistent November 25. Heliopause crossing is not described as leaving the
gravitational solar system.

Cassini's [Grand Finale guide](https://science.nasa.gov/mission/cassini/grand-finale/grand-finale-orbit-guide/)
contains conflicting older predicted end times. Neither its obsolete 10:45 UTC
summary nor the final Earth-received signal is treated as the spacecraft's death
epoch. The [post-event release](https://www.nasa.gov/news-release/nasas-cassini-spacecraft-ends-its-historic-exploration-of-saturn/)
qualifies the final date only. Its record has a separately labeled 10:29:59 UTC
pre-entry view anchor requested by trajectory qualification, not an asserted
destruction instant. The anchor is one second inside the 10:30 source endpoint
so conservative inward endpoint admission does not exclude it. The representative noon date falls after destruction; the
application must never extrapolate to it. The science service owns coverage and
must independently accept or reject each event/view epoch.

Secondary mission records add launch dates and qualified arrival milestones,
without adding secondary spacecraft geometry or assuming target-vector coverage.
Juno's [operational orbit table](https://science.nasa.gov/mission/juno/juno-orbits/)
labels the insertion date **July 5, 2016 UTC**; July 4 on general pages is the
US local date. An invalid `26:25 UT` launch conversion on NASA's generic mission
page is excluded; only the launch day is retained. Dawn's completed-mission
[quick facts](https://science.nasa.gov/mission/dawn/toolkit/quick-facts/) and
[post-event status](https://science.nasa.gov/mission/dawn/mission-status/) support
**July 16, 2011 UTC** at Vesta and **March 6, 2015** at Ceres, rather than obsolete
planned dates. NASA's [NEAR record](https://science.nasa.gov/mission/near-shoemaker/)
supplies the successful Eros insertion at **2000-02-14 15:33 UT**. ESA's
[completed Rosetta operations record](https://www.esa.int/Enabling_Support/Operations/Rosetta_operations)
supports day-only launch and comet arrival dates; predicted burn seconds and
Earth-received confirmation are excluded. Pioneer 10's
[NSSDCA record](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-012A)
gives **March 3, 1972**, resolving a generic summary that mixes the local March 2
date with UTC time. Pioneer launch milestones do not qualify planetary flybys.

## Focused verification and limits

Run from the recovery worktree:

```sh
python3 scripts/planetdata/build_solar25_assets.py
python3 -m unittest discover -s scripts/planetdata -p test_solar25_assets.py -v
```

The builder and repeat offline build completed with **3 models / 4 mission
identities**. Verification after the secondary source additions: **8 tests passed**; `git diff --check`
passed. Tests cover byte-identical source
preservation, independent antenna dimensions, hierarchy/material counts, valid
geometry/bounds, self-contained resources, distinct Voyager identities,
illustrative attitude/configuration, missing/corrupt/oversized source refusal,
external-image/NaN rejection, offline deterministic rebuilding, owner-file
overwrite protection and event precision/source identity.

Estimated geometry plus separate RGBA8 texture mip chains are **17,752,436 bytes**
for Voyager, **26,394,340 bytes** for Cassini and **19,955,560 bytes** for New
Horizons. These are asset estimates, not measured GPU allocation; render targets,
driver overhead, decoded CPU images and application resources are additional.
Models must load only when selected and release geometry, materials and textures
on renderer exit. No package/dependency additions are needed by this standard
library builder.

This asset author has not run application browser, Windows Edge/NVIDIA, Docker,
GPU-memory, physical-device or owner acceptance tests. Those remain coordinating
implementation qualification. Separate source/asset review, including all eleven
secondary event additions, is recorded in `REVIEW_ASSETS.md`; its reviewer found
no open P1/P2 in that bounded scope. No commit, push, merge, deployment, protected-data change or source
archive publication was performed by this asset task.
