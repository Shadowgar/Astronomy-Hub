# Solar System 2.3 — planetary systems owner-review candidate

**Implemented and locally qualified owner-review candidate. Draft PR107; no merge, deployment, source publication or owner acceptance. Hosted final-SHA status is recorded in PR107.**
Starting head: `767ec130faa60606e689a889f7ed4c3c58ee74fc`, existing branch
`recovery/reconcile-20261026`. The owner explicitly authorized this reconstruction
beyond Solar2.2's previous stop. Context and scope are recorded in [PLAN.md](PLAN.md).

## Actual implementation

`celestial/CelestialBody.ts` is the shared body factory used by SolarScene and
SystemScene. It retains original NASA UV geometry, source textures, planetary
materials, Earth clouds, Saturn's radial-profile rings/shadows and limb treatment.
Each scene owns its renderer, asset owner, budget, camera and disposal. Appearance
IDs never substitute a local physical center for a Solar ephemeris barycenter.

SystemScene now uses the same HDR/linear compositor, camera controller, quality
budgets and selected-detail streamer as Solar. Source positions and cameras stay
CPU-double AU; camera-relative positions reach the GPU in the existing metre-depth
pipeline. Serialized system camera state remains kilometres. The current source
centers determine overview framing; only display radii can enlarge. Every selected
parent/moon approach uses physical dimensions. Saturn framing accounts for its
projected ring ellipse. PDS shapes retain original COM-relative kilometre vertices
and conservative maximum-radius collision envelopes; they are never sphericalized.

One scene scheduler advances one source clock. Forward/reverse playback requests
adjacent checked source windows without replacing the renderer, and stops rather
than extrapolating. Parent focus, moon approaches, orbit/follow/free, overview,
keyboard, reduced motion, quality, saved camera/time and context-loss retry remain
available. Native Moon return preserves quality/navigation as well as camera/time.
Solar return rebases a tracked selected-body offset using the original Solar
identity at the new epoch; free-flight cameras remain absolute.

## Science and assets

- [SCIENCE.md](SCIENCE.md): bounded original SPK excerpts, correct parent-center
  chains, UTC/TDB, full 2025–2030 TDB availability, checked local interpolation,
  PCK11/ITRS/native-ME and exact legacy PDS frame qualification. The inward UTC
  interval is 2024-12-31T23:58:50.817Z–2029-12-31T23:58:50.816Z for the SPK systems.
- [ASSETS.md](ASSETS.md): twelve NASA moon visualization models with native detail
  images, two measured PDS shapes, exact hashes/rights/coverage and source limits.
  Delivered pack: 30 files, 23,524,035 bytes. Held JHUAPL derivatives are excluded.
- Jupiter: original parent imagery plus Io, Europa, Ganymede and Callisto.
- Saturn: original parent imagery, qualified PCK ring pole, Titan visible-haze
  visualization and Enceladus imagery. No Earth atmosphere transplanted to Titan.
- Mars: original NASA Mars imagery plus measured Phobos/Deimos shapes, neutral
  albedo and legacy shape-frame rotations. No invented high-resolution surface.
- Earth–Moon: existing Earth ITRS/Takram and LROC WAC/native Moon ME frame. Native
  Moon/Apollo17 renderer/data remain separate and preserved.
- Uranus: Ariel, Umbriel, Titania, Oberon and Miranda; Neptune: Triton. Source flat
  or poorly observed areas remain intact and disclosed. Catalog-only moons remain
  unavailable rather than acquiring invented positions or detailed surfaces.

NASA visualization texture maps generally lack a qualified datum/meridian. Their
visual north is aligned to the qualified pole, but longitude remains illustrative;
no landmark-position accuracy is claimed. PCK model agreement is evaluator
agreement, not new observational accuracy. Saturn's dark band and ring sector
come from source-Sun/ring-plane occlusion, not a baked texture stripe.

KTX2/Basis was investigated but not adopted: no pinned encoder is installed and no
cross-GPU compressed-output qualification exists. Native-resolution JPEG/GLB
streaming remains bounded at 64/192/384MiB texture admission. Those are accounting
reservations, not total VRAM (render targets and driver overhead are additional).

## Private runtime and rollback

The existing owner preview/back end were found stopped with exit255 and no OOM;
the cause is not established. Their task ownership, mounts and volumes were
inspected before starting those two existing services for baseline capture.

The Solar2.3 candidate uses the separate read-only `pr107-solar23-backend` container,
existing backend image/dependencies and a read-only SPK-v3 mount. No database or
production service is used or recreated. Existing `pr107-owner-backend` remains
available. Existing `pr107-owner-preview` serves candidate artifact `hub-solar23` at
`http://localhost:4231`; `http://solar22.localhost:4231` retains the old `hub-solar22`
artifact and old backend. Earlier aliases/artifacts remain intact. The candidate
routes are `/planetary-system/{earth,mars,jupiter,saturn,uranus,neptune}` and
`/solar-system`, with the explicit `date` query preserved.

`docker-compose.solar23.yml` is an **opt-in configuration**, not a deployment. It
adds only the qualified read-only source mount/env and refuses to create a missing
host path. Base Compose retains its existing finite-source fallback. Scientific
bulk remains excluded from Docker images. Reproduce the acquisition before using
that override; the source builder and scientific receipts are part of the work.

## Review and qualification

- [SCIENCE_INDEPENDENT_REVIEW.md](SCIENCE_INDEPENDENT_REVIEW.md): independently
  checked raw Horizons records, CSPICE matrices and interpolation; two client
  admission defects reproduced, fixed and rechecked.
- [ASSET_INDEPENDENT_REVIEW.md](ASSET_INDEPENDENT_REVIEW.md): independent file/hash,
  UV, source-frame, resolution and rights review; held assets excluded.
- [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md): independent renderer/lifecycle,
  navigation and visual review, with findings and their correction status.

The initial candidate capture runner accepted intentional asset fallback as
settled. Actual image review caught Saturn falling back because its source GLB
contains three meshes. A failing regression now pins the explicit source-globe
selection, and final capture qualification rejects unexpected asset errors.
Other corrected integration findings include implicit-parent source renewal,
parent deep-link focus, mode/UI synchronization, return preferences, free-camera
rebasing and an impossible source-prefetch inequality. Failure receipts remain
under ignored `output/playwright/solar-system-2.3/`; they are not reported as passes.

## Final engineering evidence

- [Actual before/after gallery and recordings](gallery/index.html), also served privately at [localhost:4231](http://localhost:4231/owner-review/solar23-gallery/index.html). 55 final images plus matched rejected-baseline captures and three actual journey videos. Original owner screenshot files were unavailable; the running rejected implementation was captured before replacement.
- [Exact commands and validation](VALIDATION.md):647 frontend tests/85files, typecheck, Docker production build,115 Docker science tests with34 upstream warnings,14 retained source-asset tests;27 final journey groups,4 lifecycle/native-terrain checks and6 shared Solar streaming cases. No skipped/neutral check is an approval.
- [Performance](PERFORMANCE.md):28 measured Windows RTX3060 cases. Steady RAF6.9ms median/p95≤7.1ms; GPU p95≤1.574ms. Local startup519–1007ms. Cold max166.6ms remains; delayed Earth shader validation and texture submission still cause loading stalls. Source-texture accounting peak186.67MiB, not total VRAM.
- [Source/artifact binding](evidence/source-binding.json):33 changed runtime/source inputs,312 production files exactly matching Docker output, private preview files and actual HTTP. All95 gallery files match actual HTTP bytes.145 prior container IDs and90 volume names retained; one new task-only read-only backend remains.
- Independent non-author source/frame, asset/rights and rendering/lifecycle/visual reviews found and corrected genuine issues; the final scoped renderer review has no unresolved P1/P2 implementation findings. It does not approve the entire consolidated PR.

The cold-stall correction prepares actual scene/compositor programs asynchronously while preserving shader validation. Separate regression checks cover cancellation, synchronous failure, timeout and context loss. Final visual review additionally corrected ring-envelope camera fitting and display/crowding budgets; no source centers were moved.

## Remaining limits and stop

Physical iPhone and owner visual acceptance remain pending. NASA map longitude/datum registration is generally unqualified; source gaps and illustrative orientations stay disclosed. Titan is visible-haze visualization. PDS shape orientation follows explicitly pinned older models. KTX2, seamless new lunar terrain, dwarf planets and missions were not added.

Inherited release gates remain: a corresponding-source archive/reconstruction matching this newer application, authorized public immutable source/descriptor delivery and anonymous HTTPS pairing, external combined-work/license/provenance qualifications. The old f7cb702c source archive does not match this application. No new source archive was published. Existing broader advisory debt is not cleared by the focused work. Hosted final-SHA CodeQL/CI results and remaining alert count are reported in PR107 after push.

Next task is owner inspection of the private candidate and visual acceptance/rejection. Stop product expansion here; PR107 stays draft and unmerged.
