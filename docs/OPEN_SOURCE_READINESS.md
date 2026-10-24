# Open-source readiness and licensing review

**Status: owner decision and verification pending (2026-10-24).** This is a documentation checklist, not a legal opinion, a license grant, or a claim that all included materials have been cleared for redistribution.

## Confirmed repository-level findings

- The repository is public and actively maintained.
- No `LICENSE` or `README.md` existed at the repository root on the reviewed main branch; the root README is being added in a separate documentation pull request.
- GitHub reported **no recognized repository license**. The root `package.json` declares `"license": "ISC"`, which is insufficient evidence of a consistent, correctly scoped license for this mixed-origin repository.
- GitHub has no configured short repository description. This is a repository setting, not a Markdown file.

## Sample of distinct rights and notices requiring review

| Component / source | Observed evidence | Required follow-up |
| --- | --- | --- |
| Original Hub application code | Root `package.json` declares ISC; no root license text or verified authorship inventory | Confirm author/rights holders, choose an appropriate license, and define its exact scope |
| Stellarium-derived integration | `integrations/sky-overlay/apps/web-frontend/src/main.js` explicitly mentions GNU AGPL v3 or a commercial license; the repository also contains Stellarium Web Engine-derived code under `vendor/` | Inspect all upstream license texts, pinned revisions, modifications, applicable copyleft obligations, and required notices; do not assume an alternative commercial license has been obtained |
| God's Eye-derived Earth functionality | [ADR 0008](architecture/decisions/0008-provider-licensing-boundaries.md) records MIT source-code rights while excluding independent provider, data, and visual-asset rights | Verify exactly which code is copied or adapted, retain required attribution, and separately qualify associated materials |
| Astronomical catalog data | OpenNGC ingestion code notes CC BY-SA 4.0; other data sources document distinct attribution/access terms | Preserve per-dataset provenance and notices; review redistribution and hosted-use permission for each dataset |
| Maps, imagery, fonts, and icons | Source/provider obligations appear in architecture, design asset notices, and runtime documentation | Inventory actual bundled files and external runtime sources, then include applicable notices and exclusions |

This table is **not an exhaustive dependency or copyright audit**.

## Before declaring the repository open-source licensed

1. Identify which source files were authored by the maintainer, contributed by others, adapted from upstream, or generated from third-party materials; establish redistribution rights.
2. Audit vendored and integrated Stellarium material and any AGPL/commercial dual-license choices with the exact upstream versions and notices. Do not represent AGPL material as solely ISC, MIT, or Apache-licensed.
3. Decide which OSI-approved license will cover the original Hub-owned code and how to distinguish third-party components. Resolve compatibility questions before applying the chosen license broadly.
4. Add the correctly scoped license text and attribution/third-party notices, preserving licenses already attached to upstream code and independent datasets/assets.
5. Align the root package metadata with the approved license **only after** the rights audit. A package manifest declaration must not overstate repository-wide rights.
6. Confirm GitHub recognizes the intended repository license and review the rendered public README, contributor guidance, and credits.
7. In GitHub repository **Settings → General**, add a concise public description, for example: “Source-aware astronomy exploration and observing tools spanning the sky, Earth, and the Solar System.”

The project can receive documentation improvements now, but the copyright/licensing decision should be explicitly approved by the owner. **Do not add a blanket root license before the rights and scope decisions are resolved.**

## Scope and safety

This checklist does not authorize modifying application code, runtime/provider configuration, dependencies, data, or production systems. It does not establish OpenAI program eligibility; third-party license review and program acceptance remain separate decisions.
