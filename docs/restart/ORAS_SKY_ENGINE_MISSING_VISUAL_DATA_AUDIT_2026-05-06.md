# ORAS Sky-Engine Missing Visual Data Audit - 2026-05-06

## Scope

This audit records the current user-visible visual-data gaps for `/sky-engine` while keeping runtime ownership inside the vendored Sky Engine.

This audit is limited to:

- bundled survey/background imagery
- selected-object icons versus missing object media
- local ORAS runtime behavior compared with the current public Stellarium runtime

This audit does not claim full survey parity or a complete mirror of public Stellarium media.

## Files And Runtime Seams Inspected

- `vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`
- `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js`
- `vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js`
- `vendor/stellarium-web-engine/apps/web-frontend/src/components/selected-object-info.vue`
- `vendor/stellarium-web-engine/apps/test-skydata/`
- `frontend/public/oras-sky-engine/skydata/`

## Proven Local Runtime Behavior

- standalone `http://127.0.0.1:4173/oras-sky-engine/` renders stars, Milky Way, and landscape from bundled local assets
- selected-object detail cards render a local type icon, metadata rows, and button icons correctly for tested objects
- tested local object icons loaded correctly for:
  - `Gaia DR2 2252802052894084352`
  - `M31`
  - `C 6` / Cat's Eye Nebula
  - `Capella`
- local selected-object detail cards do not render any thumbnail or object-photo element
- local selected-object summaries are blank because `getSkySourceSummaryFromWikipedia` is intentionally disabled in the ORAS runtime
- local fallback search still works when `/api/sky/search` returns `502`, but runtime search logs show backend requests are attempted first

## Proven Bundled Asset State

- committed local survey roots under `frontend/public/oras-sky-engine/skydata/surveys/` are limited to:
  - `milkyway/`
  - `sso/`
- no bundled `surveys/dss/v1/` tree exists in the committed ORAS runtime bundle
- vendored source `vendor/stellarium-web-engine/apps/test-skydata/` matches that limitation and also contains no local DSS tree
- local `skydata/dso/` is an object catalog (`.eph` tiles plus `properties`), not an image/media pack

## Selected-Object UI Findings

- `selected-object-info.vue` renders one `<img :src="icon">` for the object type icon
- no thumbnail, gallery, or remote object-photo component exists in that card
- `iconForSkySourceTypes(...)` maps to local SVGs under `images/svg/target_types/`
- every mapped icon filename exists in the local ORAS public bundle
- direct browser checks confirmed the `M31` galaxy icon and `C 6` planetary nebula icon load successfully

Conclusion:

- the reported broken detail-card image could not be reproduced in this audit
- the missing richness is currently a missing survey/object-media problem, not a missing target-type SVG set

## M31 / Cat's Eye / Capella Audit Notes

- `M31` in local standalone runtime resolves, centers, and shows metadata plus a local galaxy icon
- repeated zoom-in on local `M31` kept the target as a label/marker over the generic sky; no local galaxy image appeared
- `C 6` / Cat's Eye Nebula resolves and shows a local planetary-nebula icon plus metadata, but no local object image or summary
- `Capella` resolves as a normal star result and does not reproduce any broken icon behavior
- dense Milky Way background is locally visible in the standalone runtime through the bundled `surveys/milkyway` pack

## Public Runtime Contrast

Public `https://stellarium-web.org/` loaded remote runtime/media resources during this audit, including:

- UI assets from `d3ufh70wg9uzo4.cloudfront.net`
- star, DSO, survey, and landscape packs from `stellarium.sfo2.cdn.digitaloceanspaces.com`
- live Wikipedia extracts from `en.wikipedia.org/w/api.php`

Public selected-object detail cards also surfaced Wikipedia summary text that the local ORAS runtime intentionally suppresses.

This audit did not capture a definitive public DSS tile request for `M31` at the tested zoom level, so exact DSS tile parity is not claimed here.

## Root Cause Summary

- ORAS currently ships no bundled local DSS survey tree
- `App.vue` previously mounted `core.dss` only when `VUE_APP_ORAS_RUNTIME_REMOTE_DATA_BASE` was configured
- ORAS currently ships no bundled object-media or thumbnail source for DSO detail cards
- ORAS intentionally disables Wikipedia summaries without a local replacement source

## Bounded Fix Applied In This Slice

- vendored runtime DSS routing now prefers a bundled local survey root at `/oras-sky-engine/skydata/surveys/dss/v1` when present
- remote DSS fallback remains available only when explicitly configured
- no default public runtime source was reintroduced

## Still Missing After This Slice

- committed local DSS/HiPS survey tiles under `frontend/public/oras-sky-engine/skydata/surveys/dss/v1/`
- committed local DSO object-media or thumbnail assets
- committed local object-summary corpus to replace the disabled Wikipedia feed

## Recommended Next Slice

- mirror a bounded ORAS-owned survey proof set into `/oras-sky-engine/skydata/surveys/dss/v1/`
- use a scripted import path only; do not add new default runtime calls to public survey services
- define a local object-summary/media manifest for high-value DSO targets such as `M31` and `C 6`