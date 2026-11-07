# Solar System 2.5 implementation plan

**Goal:** authentic spacecraft and mission exploration using qualified historical
sources, actual spacecraft models, the shared Solar graphics foundation and one clock.

**Authority:** owner's explicit Solar2.5 directive supersedes only the previous
product-expansion stop. Start `ea4d384af3aead949de7bec1947e8aff41465bca`, existing
`recovery/reconcile-20261026`, draft PR107. Main verified `9a03d8260a529f5858c5c3298cbb9d32b721daeb`.
No merge, production deployment, tunnel, source publication or protected deletion.
Owner visual acceptance and physical iPhone remain unqualified.

## Context and design

Loaded root/frontend/backend AGENTS; CORE_CONTEXT, LIVE_SESSION_BRIEF and the
existing `solar_reconstruction` manifest pack. The complete pack inventory is
recorded in `../solar-system-2.4/PLAN.md`. Refreshed canonical validation,
UNIFIED_UNIVERSE_ARCHITECTURE, ADR0010, original cinematic design contract, Solar2.3
shared rendering/evidence and Solar2.4 source/asset/population/REVIEW/VALIDATION
records. No full-docs scan or unrelated pack. Older R3-only restrictions and
Solar2.4 stop wording are historical relative to this new owner authorization.

Chosen approach: isolated `/missions/:mission` workspace with a mission-specific
historical source contract. Reuse CelestialBody, SolarResourceOwner, HDR pipeline,
SolarCameraController, SolarClock, quality/streaming policies and cinematic shell.
Do not force spacecraft or historical targets into the strict nine-planet or
2025–2030 destination payload. No second active renderer or independent timebase.

Alternatives rejected: extending the current precise-destination schema would
confuse historical coverage/source identity; transplanting a different mission
renderer would duplicate source/graphics/lifecycle authority. The isolated workspace
keeps historical target compatibility explicit and existing Solar paths reviewable.

Science supplies same-epoch spacecraft, Sun and only compatible admitted target
states. Appearance ID is separate from scientific identity. Unsupported historical
bodies are absent/unavailable, never frozen at 2026. A mission's source segments
remain discontinuous where coverage is missing. Reconstructed, predicted and
mission-design paths must be distinguished; coarse design paths are not presented
as reconstructed encounters. Independent spacecraft-relative/target-relative
comparisons check center chains and time conversion.

UI: compact Spacecraft & Missions discovery/search, flagship mission/event selection,
restrained source/coverage details, historical timeline and source paths, mission
and trajectory overview, physical spacecraft inspection, orbit/follow and return
at the current shared UTC. No giant fictional spacecraft, inferred antenna pointing,
permanent bright trails or measured heliopause sphere. Inspection attitude is
explicitly illustrative unless real attitude data are qualified.

## Stage A — close Solar 2.4 independent integration review

Non-author reviewer inspects exact unreviewed paths and existing proof. A confirmed
P2 was reproduced on Windows NVIDIA: 2026 Pluto path/selection marker remains
visible after a same-renderer seek to unsupported2035. Root repair retires omitted
destination paths and gates path/marker display on current source admission.
Reviewer rechecks actual red/green browser output, supported-time recovery and
bounded buffer ownership. No broader 2.4 redesign.

## Stages B–E — source and model qualification

Science agent owns `backend/app/{schemas,services,routes}/mission*`, focused
`backend/tests/test_mission*`, `scripts/skydata/acquire_solar25_missions.py` and
`SCIENCE.md`. Verify identities, actual coverage, segment class, compatible target
solutions, UTC/TDB, adaptive sampling and independent position/velocity references.
Implement tests before admission logic. Flagships: separate Voyager1/2, Cassini,
New Horizons; secondary missions only with actual qualified sources. Huygens is
not Cassini. Original early Voyager Horizons paths require explicit design-quality
qualification; dedicated reconstructed encounter kernels are being investigated.

Asset agent owns `scripts/planetdata/build_solar25_assets.py`, corresponding tests,
`frontend/public/mission-assets/v2.5`, ASSETS.md and exact NASA event source records.
Preserve geometry/materials/node transforms; independently qualify uniform physical
scale from documented dimensions and source geometry. Record each asset's rights,
unknown axes/attitude and source hashes. No model normalization into a sphere.

Budgets before transfer: science128MiB aggregate/16MiB per response; model originals
256MiB aggregate/64MiB each; runtime visual derivatives≤96MiB. Metadata and bounded
subsets/range acquisition first; no full multi-GB archive. Immutable hashed releases
under new `data/runtime-packs/solar-missions/`, mounted read-only. Bulk outside Docker
images/bundles. JPL requests serialized with a shared lock. No paid activation.

## Stage F — isolated frontend and navigation

Root owns `frontend/src/features/missions/`, its focused tests, lazy AppRouter entry,
small Solar discovery/return adapter, backend router registration and opt-in Compose.
Validate strict source/frame/epoch/identity contracts and unsupported intervals.
Evaluate numeric tracks at the single SolarClock UTC without extrapolation. Separate
small current-window samples from long-range overview paths; selected model only,
bounded trajectory GPU buffers, generation-fenced loading and complete disposal.

Camera stays CPU double precision with camera-relative GPU coordinates in the shared
metre-depth compositor. Models keep uniform physical scaling at inspection distance;
overview uses symbolic markers. Retain source Sun illumination and disclose static
inspection attitude. Planetary target rendering uses existing shared materials and
assets without claiming historically qualified surface geography. Return preserves
observer and supported camera context; unsupported historical system-view coverage
must be explicit instead of silently changing dates.

## Stage G — evidence, independent review and PR

Focused failure-first contracts, source/model/frame tests, then full affected frontend
suite/types and Docker scientific/build/API proof. Actual headed Windows Edge/RTX3060
captures at1440×900,390×844,844×390; four complete flagship recordings where source
coverage allows. Inspect actual models/scale/lighting/path clarity/controls.
Measure first readiness, fetch/decode/upload/shaders, 70warmup+200real orbit frames,
median/p95/cold intervals, switching/disposal/context recovery. Serialize GPU tests.
Retain Solar2.4 gallery/build as true baseline; no fabricated before screens.

Independent non-author science, asset/rights and final application reviews. Fix
confirmed defects, rerun relevant regressions and record exact remaining limits.
Update only PR107 with final pushed SHA and hosted CI/CodeQL evidence. Preserve
all prior containers, volumes, artifacts and rollback paths. Stop for owner review;
no Solar2.6 Oort/heliosphere implementation or release approval.
