# Third-party notices and license scope

Astronomy Hub is a **mixed-license repository**. The root [MIT license](LICENSE) is the license offered by Shadowgar for **original code and documentation authored or controlled by the project maintainer**, where the maintainer has authority to grant that license and no more-specific notice applies.

**This is not a blanket MIT relicensing of every file in the repository.** Vendored, copied, adapted, generated, third-party, and data-provider materials retain their own copyright and licensing terms. A path not listed below is **not** automatically cleared for MIT reuse; verify its provenance if uncertain.

## Stellarium Web / Stellarium Web Engine

- Identified source trees: `integrations/sky-overlay/` and `vendor/stellarium-web-engine/`.
- Upstream: [Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine), and its Stellarium Web frontend.
- Upstream notices credit **Stellarium Labs SRL** and offer **GNU Affero General Public License v3** or a separately negotiated commercial license. **No commercial license is presumed for Astronomy Hub.** The AGPL option is the documented basis for redistribution.
- Copies of the upstream AGPL v3 terms are retained verbatim at:
  - [`integrations/sky-overlay/LICENSE-AGPL-3.0.txt`](integrations/sky-overlay/LICENSE-AGPL-3.0.txt)
  - [`vendor/stellarium-web-engine/LICENSE-AGPL-3.0.txt`](vendor/stellarium-web-engine/LICENSE-AGPL-3.0.txt)
- Original upstream copyright notices inside those source files remain in force. Modifications and derivative material may also carry AGPL obligations. The MIT license at the repository root does **not** override them.
- The included `frontend/public/oras-sky-engine/` runtime contains a compiled Stellarium frontend and native WASM. A [repository-level AGPL source-offer audit](docs/validation/STELLARIUM_AGPL_SOURCE_OFFER_AUDIT_2026-10-24.md) identifies **unverified corresponding-source delivery** and a missing prominent source link in the checked-in runtime. This is a release gate; the live ORAS deployment was **not** tested. Source access must match the actual build, not only a generic repository or mismatched fork.

## God's Eye View / Earth adapter sources

- Original project: [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view).
- Its upstream source-code [LICENSE](https://github.com/bilawalsidhu/gods-eye-view/blob/main/LICENSE) credits **Bilawal Sidhu** under MIT, with express exceptions for provider content, datasets, imagery, and third-party models.
- Astronomy Hub's `runtimes/earth-runtime/` and integration layers selectively reuse/wrap God’s Eye functionality. Preserve applicable upstream MIT copyright notices for copied/adapted code. Do not treat provider data, external maps, visual assets, or models as included in that MIT grant.
- Exact per-file provenance and release-artifact notice placement require continued verification.

## Astronomy catalogs and other material

- **Solar Wanderer graphics techniques**: Solar System 2.0 adapts particle-layer ring scattering, analytic planet occlusion and spherical single-scattering patterns from [hyqzz/Solar-Wanderer at 739b3675](https://github.com/hyqzz/Solar-Wanderer/tree/739b3675e25f65bedfcdf728985f2c9adb872fe1). Copyright (c) 2026 hyqzz, MIT; [full retained license](frontend/public/licenses/solar-wanderer-MIT.txt). The modified Hub modules are `frontend/src/features/solar/solarRings.ts` and `solarAtmosphere.ts`. They do not import its application, clock, ephemerides, textures or datasets. Source inspection, adaptation boundaries and separately evaluated packages are recorded in [Solar graphics receipt](docs/validation/solar-system-2/GRAPHICS.md).

- **OpenNGC**: code under `scripts/skydata/` and `backend/` records OpenNGC catalog attribution and **CC BY-SA 4.0** data terms; these do not become MIT merely because ingestion software is MIT-eligible.
- **HiPS surveys, planetary imagery, other maps and external APIs**: use source-specific permissions, credits, service conditions, and any applicable database/data licenses. See source `properties`, manifest records, and [provider licensing decision](docs/architecture/decisions/0008-provider-licensing-boundaries.md). Some rights are not established; public GitHub visibility is not a grant of redistribution rights.
- **Fonts and icons**: [asset notices](frontend/src/features/workspace/assets/LICENSES.txt) preserve separate licensing (including SIL Open Font License for IBM Plex Sans and Lucide licensing).
- **Installed JavaScript/Python libraries**: dependency license terms apply independently; their inclusion is not a maintainer-origin MIT grant.

## Contribution and distribution rules

1. Keep upstream copyright and licensing headers intact when importing, modifying, or redistributing third-party material.
2. Review the exact source and license obligations for every redistributed data file, image, font, compiled asset, and generated artifact. Do not infer rights from mere accessibility.
3. For modified or hosted AGPL-covered code, verify required full corresponding source, license notices, and applicable network user offer before deploying or distributing; an unrelated Hub repository link alone may not establish compliance.
4. Retain original third-party attributions when repackaging, minifying, vendoring, or publishing generated application bundles.
5. A new contribution to **original** Hub code is not automatically relicensed if the contributor lacks authority, or if it modifies/adapts copyleft code; settle rights before distribution.

This file documents known boundaries but is **not a comprehensive intellectual-property or redistribution clearance audit**. The [readiness tracker](docs/OPEN_SOURCE_READINESS.md) records remaining owner decisions and verification steps.

## Solar System 2.1 runtime dependencies

- `@takram/three-atmosphere`0.19.1 and `@takram/three-geospatial`0.9.1: MIT; exact package lookup textures retained, not regenerated. Upstream Bruneton scattering shaders additionally retain INRIA/Eric Bruneton BSD-3-Clause notices.
- `postprocessing`6.39.5: Zlib.
- NASA AMMOS `3d-tiles-renderer`0.5.3: Apache-2.0.
- All runtime rendering resolves Three.js0.180.0. The vanilla packages have a separate standard npm lockfile under `frontend/graphics`; no React19/R3F integration or ignored peer checks. Exact bundled license copies live in `frontend/public/licenses`.
- Apollo17 NAC regional elevation and orthomosaic: NASA/GSFC/Arizona State University PDS products, public-domain PDS terms. Derived bounded tiles preserve source labels, precise byte-range hashes and derivation receipts under `frontend/public/planet-terrain/apollo17-nac-v1` and the Solar2.1 source validation record. NASA endorsement is not implied.
