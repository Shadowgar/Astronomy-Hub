# Independent Solar 2.5 asset and event-source review

**Scoped result: no confirmed P1/P2 finding in the reviewed asset builder,
three delivered models, provenance/rights records or the event source ledger
(32 entries after the additive review below).**
This reviewer did not create those assets, their manifest, the builder, or the
asset author's qualification report. This result does not approve the mission
application, scientific ephemerides, GPU behavior, whole PR or owner visuals.

The review used the current recovery worktree on
`recovery/reconcile-20261026`, base
`ea4d384af3aead949de7bec1947e8aff41465bca`, existing draft PR107. The exact ten
reviewed source/artifact hashes are bound in `evidence/asset-review.json`; the
review occurred before the integrating commit. Context was the mandatory
CORE/LIVE and solar reconstruction pack, the owner Solar 2.5 directive,
`ASSETS.md`, its explicitly referenced source/event records, and the actual
builder/tests/manifest/GLBs. No unrelated documentation pack was scanned.

## Geometry, scale and preservation

All three delivered GLBs match the independently recorded NASA download hashes
and the retained original files. Their direct download URLs are present in the
corresponding retained NASA resource pages. The complete source ledger independently
rehashes successfully: **22 unique files, 17,547,323 bytes** (19 documents plus
three models). Runtime model bytes total 12,274,376; the declared transfer/pack
budgets are respected. No secondary-mission substitute model is introduced.

A separate reviewer calculation decodes all source Float32 vertices and reconstructs
the node graph using Three.js `Object3D` world transforms, importing none of the
Python builder's transform or bounds math. All three source bounds, display centers,
antenna-derived scales and radii match the manifest to within 1e-10 in their
respective units. This covers 23,928 Voyager, 30,788 Cassini and 7,665 New Horizons
vertices. Complete node counts are 4, 12 and 6 respectively. Original model bytes
also preserve materials, UVs, normals and embedded texture data.

The source scale references are independently supported: Voyager's 3.7 m antenna,
Cassini's 4 m antenna, and New Horizons' 2.1 m dish. The corresponding uniform
scale factors are 0.970583576287901, 0.9977542640852697 and 1.1123969966927552.
These remain approximate educational dimensions, as the manifest states; they
are not verified CAD units. Sources: [Voyager spacecraft](https://science.nasa.gov/mission/voyager/spacecraft/),
[Cassini components, PDF page 2](https://solarsystem.nasa.gov/system/downloadable_items/1944_humanspacecraft.pdf),
[New Horizons description](https://www.nasa.gov/image-article/new-horizons-approaches-pluto/).

The builder preserves node transforms and rejects external image/buffer URIs,
unqualified extensions/animation/skinning, nonfinite geometry, corrupt source
hashes and oversized acquisition. Offline builds refuse a missing pinned input
and refuse to replace an existing different owner artifact. No new dependencies
or full mission archive acquisition are required.

## Asset-specific rights and required presentation limits

The current official [Voyager](https://science.nasa.gov/resource/voyager-3d-model/),
[Cassini](https://science.nasa.gov/resource/cassini-3d-model/) and
[New Horizons](https://science.nasa.gov/resource/new-horizons-3d-model/) resource
pages independently confirm NASA VTAD credits. The exact GLB asset metadata
identifies its exporter without additional copyright conditions. The current
[NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
cover 3D polygon/texture data for informational simulations, require source
acknowledgment and retain third-party and endorsement restrictions. The asset
manifest's limited informational-use basis is consistent with those sources;
no blanket public-domain or NASA-endorsement assertion is justified.

The application must retain the stated credit and limits. The static Cassini
model includes Huygens geometry and must remain visibly identified as an
illustrative Cassini–Huygens reference configuration after probe separation.
All three poses lack a qualified historical attitude chain. Their bounding-box
centers are display centers, not navigation reference points or centers of mass.
The source pack communicates these distinctions correctly; whether the final
application displays them accessibly belongs to its browser review.

## Event source and precision checks

The 21 entries preserve mission/target string identity, source hashes and the
published day/minute/second precision. The reviewer inspected the retained
source text and independently refreshed the principal official sources. Specific
ambiguities are handled appropriately:

- Voyager flybys follow the [NSSDCA spacecraft-UTC table](https://nssdc.gsfc.nasa.gov/planetary/voyager-periapse.html),
  including Voyager 2 at Saturn on 1981-08-26 03:24:57 UTC.
- The two heliopause dates follow [mission fast facts](https://science.nasa.gov/mission/voyager/fast-facts/),
  with representative noon explicitly distinguished from an exact crossing time.
- Cassini's [first Grand Finale ring crossing](https://science.nasa.gov/mission/cassini/grand-finale/grand-finale-orbit-guide/)
  uses the table's spacecraft UTC. That page's contradictory projected mission-end
  times are not adopted as a measured destruction epoch.
- Cassini's end record remains day-precision; 10:29:59 UTC is explicitly a pre-entry
  view anchor. The noon date cannot justify rendering a spacecraft after its
  source coverage or destruction. Final event admission remains the science
  adapter's responsibility.
- New Horizons' launch/Jupiter/Pluto times match the [mission history](https://science.nasa.gov/mission/new-horizons/);
  Arrokoth's minute value matches the [approach source](https://science.nasa.gov/resource/new-horizons-arrokoth-2014-mu69-approach/).

## Independent commands and evidence

```sh
python3 -m unittest discover -s scripts/planetdata -p test_solar25_assets.py -v
node output/playwright/solar-system-2.5/review-missions/review-asset-geometry.mjs
```

Results: **8 tests passed, 1.252 seconds**; independent Three.js geometry
calculation **PASS for all three models**. The tests themselves exercise an offline
build into temporary directories and repeat it deterministically; the reviewer did
not rewrite the delivered assets. Independent source-hash and direct-download-link
checks passed. Compact reviewed-file and result binding is in
`evidence/asset-review.json`; the full independent geometry output remains at
`output/playwright/solar-system-2.5/review-missions/asset-geometry.json`.

No implementation/asset fix was required in this scope. No container, production
data, branch, commit or PR state changed in this reviewer task. Mission browser
rendering, decode/upload timing, physical GPU consumption, runtime attribution,
historical source compatibility and owner acceptance remain separate gates. The
next task is the independent integrated application/browser review after the
mission implementation and scientific adapter are ready.

## Additive secondary-event review

The reviewer independently inspected all 11 added entries and nine newly cached
primary source documents. All nine byte counts and SHA256 values match, and all
32 event/source joins agree. The three original GLBs remain unchanged.

The [Juno orbit table](https://science.nasa.gov/mission/juno/juno-orbits/)
explicitly dates insertion in UTC on July 5; the US-local July 4 summary is not
used. Juno's invalid `26:25 UT` source text is correctly excluded, retaining only
the supported launch day. The [Dawn quick facts](https://science.nasa.gov/mission/dawn/toolkit/quick-facts/)
support 11:34 UTC launch, July 16 UTC Vesta arrival and March 6 Ceres arrival;
the recorded EDT/PDT distinction explains the Vesta day difference.
[NEAR's completed mission record](https://science.nasa.gov/mission/near-shoemaker/)
supports the exact launch and minute-precision Eros insertion.
[ESA's Rosetta operations record](https://www.esa.int/Enabling_Support/Operations/Rosetta_operations)
supports launch and comet-arrival dates at day precision. NSSDCA's retained
Pioneer 10 record supports March 3 rather than the generic page's inconsistent
local-date/UT pair. Pioneer 11's retained NASA page supports April 6 02:11 UTC.
No more precise event time is invented. Cassini's separately labelled pre-entry
view anchor is moved one second inward to 10:29:59; it remains distinct from the
day-only end-of-mission event.

Command `python3 scripts/planetdata/test_solar25_assets.py`: **8 tests passed,
1.531 s**. An initial module-style invocation lacked the script directory on the
Python path and failed import; the direct script invocation above is the correct
execution. The additive reviewed hashes are in
`evidence/asset-events-addendum.json`. **No confirmed P1/P2 in these additions.**
