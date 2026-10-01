# LIVE SESSION BRIEF

## Authority and current execution

Load with `CORE_CONTEXT.md`, then the task pack in `CONTEXT_MANIFEST.yaml`.
Validation authority and proven runtime behavior govern completion claims.

The user-authorized task is the shared public shell and decision homepage on
`hub-public-shell-homepage-1`, based on main
`1e341746b05609b3237388514691fe3c5edecaf3` after PR #51 merged. PRs #48–#51
provide the existing identity, Observe, observability, and Tonight foundations.
The public Hub homepage is now authorized and is no longer a deferred lane.

## Public product

- Home `/`: ORAS decision surface with Tonight, Observe Now, current weather
  facts, and entry to the interactive sky.
- Observe `/observe`: current or explicitly selected location/time sky inventory,
  categories, source-backed detail, and canonical object links.
- Tonight `/tonight`: ORAS-specific full-night planning through `tonight.v1`;
  existing evening date, noon rollover, DST, geometry, and forecast semantics.
- Sky `/sky-engine`: embedded host with shared Hub navigation around the renderer.

All four routes share ORAS identity, text navigation, focus/skip behavior,
content tokens and a responsive shell. Home has no engine/configuration wall,
quality score, heavyweight sky preview, or invented astronomy. Tonight loads
independently. Observe Now and current conditions share the existing Observe
React Query request; conditions use qualified `observability.v1` weather facts,
not legacy observing-score/seeing/transparency judgments. A weather-provider
failure leaves astronomy available; an Above Me HTTP failure affects both of
its summaries while Tonight and Sky remain usable.

## Engine authority

The active contained sky renderer remains `/oras-sky-engine/`: ORAS-hosted
Stellarium Web / Stellarium Web Engine. `/sky-engine` is its Hub host route,
not a replacement renderer or a BabylonJS surface.

Runtime source/integration paths remain:

- `vendor/stellarium-web-engine/apps/web-frontend`
- `vendor/stellarium-web-engine/src`
- `frontend/public/oras-sky-engine`
- `/api/sky/object`, `/api/above-me`, `/api/tonight`

The Hub owns decisions/navigation and approved URL input. Stellarium owns
rendering, scene lifecycle, selection, camera, survey imagery and visual math.
Preserve `catalog + source_id + model`, string IDs, validated RA/Dec fallback,
observer/time/site handoffs, and both core system models. Standalone runtime,
star catalogs, mounted bulk data and backend astronomy are outside this UI pass.

## Execution and qualification

See `PROJECT_STATE.md` and `FEATURE_TRACKER.md` for this pass's runtime evidence.
Completion requires focused/full frontend tests, typecheck/build, Docker and
real desktop/mobile browser acceptance. Open the requested PR; do not merge.
Frontend tests (155), typecheck/build and Docker browser tests (16) passed.
The console-clean gate remains partial: unchanged standalone and embedded Sky
have missing mounted dense-star tile 404s, a Category B follow-up outside UI scope.
One normal Codex review is sufficient. Category A correctness/security/
accessibility/regression findings block; Category B polish, abstraction,
micro-optimization and unrelated legacy cleanup are documented follow-ups.

## Next milestone and deferred lanes

Next planned scientific differentiator: `oras_horizon.v1`, a calibrated/measured
ORAS azimuth horizon and eventual panorama alignment. It is not implemented or
started in this task and needs its own authorization and scientific contract.

WordPress, equipment, telescope control, AI/Member Hub, event workflows, new
catalogs, satellite overhaul, DESI promotion and landscape/toolbar redesign
remain outside this task. DSS remains the safe fallback; experimental survey
providers retain their existing restrictions. No fake coordinates, visibility,
weather, catalog identity, survey coverage or production object registrations.
