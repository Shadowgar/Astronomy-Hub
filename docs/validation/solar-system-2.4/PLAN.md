# Solar System 2.4 execution plan and disposition

The owner's explicit November 3 Solar 2.4 directive authorizes this bounded
expansion from `fc1a7142b35ca791ffeddef810c93a244ad32769`, on existing
`recovery/reconcile-20261026` and draft PR107. It supersedes older Solar2.3 stop
wording only for Pluto/Charon, Ceres/asteroids, source TNOs and bounded comets.
Main baseline was `9a03d8260a529f5858c5c3298cbb9d32b721daeb`.

## Loaded authority

Root, frontend and backend AGENTS; `docs/context/CORE_CONTEXT.md`,
`docs/context/LIVE_SESSION_BRIEF.md` and the `solar_reconstruction` pack in
`docs/context/CONTEXT_MANIFEST.yaml`. Pack documents:

- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`
- `docs/architecture/decisions/0010-r3-a-solar-runtime.md`
- `docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md`
- `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
- `docs/design/adaptive-explorer-r1a/README.md`
- `docs/validation/repository-recovery-20261026/owner-acceptance/README.md`
- `docs/validation/repository-recovery-20261026/visual-fidelity/README.md`
- `docs/validation/solar-system-2/PLAN.md`
- `docs/validation/solar-system-2.1/PLAN.md`
- `docs/validation/solar-system-2.1.1/PLAN.md`
- `docs/validation/solar-system-2.2/PLAN.md` and `README.md`
- `docs/validation/solar-system-2.3/PLAN.md` and `README.md`
- This Solar 2.4 plan
- `docs/validation/planetary-systems/README.md`
- `docs/validation/planetary-systems/ps3/README.md`

The task additionally authorizes relevant Solar2.3 source/asset/review evidence and
current task-generated reports. Existing cinematic reference PNGs were inspected.
No full-docs scan or unrelated pack was loaded. Historical R3-only/FE8.5 restrictions
are surfaced as stale relative to this explicit owner authorization; native engine
boundaries and proof standards remain binding.

## Architecture decision

Reuse the shared celestial body factory, Solar/System scenes, HDR, source texture
budgets, camera-relative physical centers, controls and one clock. Add optional
precise destination and population endpoints; do not make the original nine-body
contract depend on new packs. Keep approximate catalog positions distinct from
qualified destination vectors. Native Sky/Earth/Moon/Apollo17 retain ownership.
A separate Pluto/comet renderer or new clock would fragment lifecycle and science;
neither was introduced. No new dependency or paid provider was needed.

## Stages

| Stage | Delivered scope | Qualification |
|---|---|---|
| A | Pluto center999 versus barycenter9, Charon and five local moon vectors, real PDS mosaics, Solar/system return | Source/asset reviews and browser journeys; historical map meridian unresolved |
| B | Ceres, measured Vesta/Eros, 16,384 belt identities, search/filter/picking/precise joins | Source tests, worker tests, measured GPU and browser captures |
| C | 8,192 TNO records and Eris | Bounded source classification/epoch policies; unresolved Eris surface |
| D | Halley/67P nuclei and source paths; hyperbolic Borisov trajectory only | Original source vectors, no comet ellipse approximation or invented tails |
| E | Docker build/science, frontend/types, Windows captures, failure/native lifecycle, recordings, GPU, PR107 | Actual evidence in VALIDATION; final independent integration review unavailable due reviewer service limit |

## Acquisition and runtime budgets

Science acquisition cap 64 MiB: 12,778,975 counted bytes. Original imagery/model
cap 256 MiB (64 MiB per file): 127,851,397 bytes including source documents.
Runtime visual derivative cap 96 MiB: 17,707,873 bytes. Population provider budget
32 MiB: 7,693,260 retained bytes; normalized runtime pack 20,932,906 bytes.
All detailed receipts/hashes/failed probes are retained in the linked reports.
Source bulk stays in mounted immutable packs and source caches, outside images.
Texture admission remains 64/192/384 MiB; one population worker/draw with bounded
messages and no per-frame full-catalog loop. Unknown dimensions remain unknown.

## Ownership and stop

Separate science, asset and catalog agents implemented their bounded workstreams
and cross-reviewed source/frame/rights and population contracts. Root integrated
the shared frontend, private preview and browser evidence. Only root commits/pushes
and updates existing PR107. Final root corrections are not independently approved;
see REVIEW.md. Owner acceptance, physical iPhone and matching/public source release
remain open. No merge, production deployment, tunnel, protected deletion, spacecraft
flight or Oort Cloud implementation. Preserve prior artifacts and stop product work
for owner inspection and the remaining review/release qualifications.
