# Open-source licensing readiness

**Status (2026-10-24): scoped licensing change proposed for maintainer review, not yet merged or legally audited.**

This document tracks repository-level license transparency and outstanding upstream obligations. It does **not** certify redistribution compliance or OpenAI program acceptance.

## What this pull request corrects

- Proposes a root [MIT license](../LICENSE) **for original Astronomy Hub code owned/controlled by the maintainer**, not an attempt to relicense third-party contents.
- Copies the unmodified **GNU Affero General Public License v3** from the Stellarium Web Engine upstream into the two checked-in Stellarium source trees, preserving their existing copyright headers.
- Adds [third-party scope and attribution notes](../THIRD_PARTY_NOTICES.md) that explain where MIT does not apply, including modified Stellarium modules, runtime binaries, God's Eye View components, datasets and imagery.
- Aligns the root `package.json` and only the root package entry in `package-lock.json` from placeholder `ISC` to proposed `MIT`; the package manifest does not relicense other programs or data.
- Updates the public [README](../README.md) to surface the actual mixed-license situation rather than claim all source is MIT.
- The GitHub repository description and README were already added in the merged documentation PR #96.

## Known source-license inventory (not exhaustive)

| Material | License / boundary | Evidence or disposition |
| --- | --- | --- |
| Maintainer-owned original Hub code | **MIT proposed** | [Root MIT license](../LICENSE), contingent on maintainer's authority to grant rights |
| `integrations/sky-overlay/` | **GNU AGPL v3** for Stellarium-derived files | [Upstream license copy](../integrations/sky-overlay/LICENSE-AGPL-3.0.txt) and original headers crediting Stellarium Labs SRL |
| `vendor/stellarium-web-engine/` | **GNU AGPL v3** for Stellarium-derived files | [Upstream license copy](../vendor/stellarium-web-engine/LICENSE-AGPL-3.0.txt), source headers |
| Built Stellarium runtime in `frontend/public/oras-sky-engine/` | Upstream/copyleft obligations can follow output | Exact bundle contents and corresponding-source/network offer **need verification** |
| Reused God's Eye View material | MIT source-code license with non-code exclusions | Upstream license credits Bilawal Sidhu; [third-party notices](../THIRD_PARTY_NOTICES.md) preserve that distinction |
| OpenNGC / other astronomy datasets | CC BY-SA 4.0 and various other source-specific terms | Confirm by data feed, version, bundled content and applicable reuse rights |
| Maps, surveys, fonts, icons, planetary imagery, model assets | Individual data/provider/content licenses | Existing asset notices/metadata; no blanket MIT rights |
| JS/Python dependencies | Independent licenses | Lockfiles and installed package notices; not transferred to the repository MIT license |

## Additional checks needed before claiming complete licensing compliance

1. **Copyright and contribution authority:** confirm the copyright holder(s) of original code and that the maintainer can offer MIT rights. Files adapted from upstream keep their original obligations even when moved outside vendor directories.
2. **Stellarium modified-source and deployment obligations:** trace bundled WASM/JS to matching source revisions and modifications. When distributing or offering modified AGPL-covered software over a network, verify full corresponding source, copyright notices, and the required source-access mechanism.
3. **Third-party source audit:** reconcile actual imported or forked God's Eye code and any other upstream modules with original license texts, preserving their notices and author credits in distributed artifacts.
4. **Assets and data:** inventory all committed catalogs, surveys, HiPS tiles, visual assets and generated outputs before stating they can be freely redistributed or hosted. Resolve unknown permissions rather than assuming public or MIT rights.
5. **Release pipeline:** verify every produced or deployed binary/bundle retains notices and, where applicable, access to matching source; review provider service terms separately from the software license.
6. **GitHub verification:** after merge, verify GitHub detects the root MIT license and displays the README and mixed-license notice. A GitHub license badge is not itself evidence of complete copyright compliance.

## Owner review gate

Merging the proposed MIT LICENSE constitutes an offer to license the maintainer-owned code under MIT; it should **only** happen after the maintainer accepts that permissive grant and confirms they control the affected rights. This PR must remain unmerged until then. Nothing in this review modifies runtime sources, deployments, external provider contracts, or existing upstream license notices.

For legal uncertainty on derived/copyleft applications and hosting, obtain a qualified open-source licensing review rather than assuming compatibility or permissions.
