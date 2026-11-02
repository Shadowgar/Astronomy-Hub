# Solar System 2.3 — planetary systems reconstruction

Owner authorization: November 2, 2026 attachment, starting at
`767ec130faa60606e689a889f7ed4c3c58ee74fc` on existing
`recovery/reconcile-20261026` / draft PR107. This explicitly supersedes the
historical 2.2 product stop for this scope. Owner visual acceptance remains open.

## Design and context

Reuse actual Solar body rendering, resources, detail streaming, linear/HDR output,
rings and camera machinery in both Solar and local systems. Keep independent
scene lifecycles and the existing single product time; no shared scene singleton.
Scientific identities remain distinct from appearance asset IDs: a Solar
barycenter must never silently become the local system's physical parent center.
Use AU at the internal camera boundary and kilometres in the existing serialized
system contract. Preserve native Sky, Cesium Earth, native Moon and Apollo17.

Alternatives considered: patching the basic system shaders would perpetuate two
appearance pipelines; embedding a second Solar renderer would duplicate lifetimes
and clocks. A small celestial-body layer plus the existing scene-independent
pipeline/controls is the chosen reuse boundary, not a general game engine.

Loaded: root/frontend/backend AGENTS; CORE_CONTEXT, LIVE_SESSION_BRIEF and
CONTEXT_MANIFEST; solar_reconstruction pack (SYSTEM_VALIDATION_SPEC,
UNIFIED_UNIVERSE_ARCHITECTURE, ADR0010, cinematic reference contract, workspace
design, adaptive-explorer-r1a README, recovery owner-acceptance/visual-fidelity
READMEs, Solar2/2.1/2.1.1/2.2 PLAN and Solar2.2 README). The explicitly requested
planetary-systems README and PS3 report are additional scoped source evidence.
Task specialists load the relevant PS2 science/source records explicitly requested
by this directive. No unrelated pack or full docs scan.

## Acquisition and runtime budgets

- New SPK/PCK/vector acquisition: at most64MiB aggregate; log exact ranges and
  bytes, require bounded206 responses, reject full multi-gigabyte responses.
  Prefer original selected SPK coefficients, with representative independent
  Horizons checks; retain old finite pack unchanged. No extrapolation.
- New imagery/models: at most128MiB aggregate raw bytes, at most32MiB per asset,
  target at most64MiB delivered pack. Retain original source hashes, terms,
  projection/datum/orientation, dimensions and transformations. No upscale.
- Keep Solar texture admission ceilings64/192/384MiB for Efficient/Balanced/
  Detailed. One active heavy renderer, one selected detail demand, explicit
  cancellation/retirement; measure additional targets/driver costs separately.
- No paid providers, source publication, public tunnel, production deployment,
  merge, branch deletion, protected-volume change or destructive cleanup.

## Execution and validation

1. **Baseline and preview:** inspect existing containers/mounts/exit evidence;
   safely start existing task services if justified. Capture rejected current
   six-system views and flagship closeups at fixed UTC and saved camera states
   on Windows Edge/NVIDIA before replacing the private preview artifact.
2. **Science:** backend services, schemas and bounded source builders qualify
   physical-parent SPK chains, UTC/TDB coverage and body-fixed orientation tracks.
   Independently compare with Horizons/CSPICE. Tests reject altered hashes,
   barycenter substitution, frame/time errors and out-of-coverage evaluation.
3. **Shared appearance:** extract actual body/model/UV/map/ring construction and
   update ownership from SolarScene into a small celestial layer used by both
   scenes. Retain Solar Earth/Takram behavior; distinguish surface axes from ring
   poles. Regress original UV geometry, late assets, quality budgets and disposal.
4. **Moon assets:** qualify mandatory Galileans, Titan and Enceladus; other existing
   moons and irregular Mars shapes where source permits. Produce bounded LODs,
   source manifest and registration tests. Missing data remains explicit.
   Investigate KTX2/Basis and adopt only with measured compatible benefit.
5. **System integration:** SystemScene/SystemWorkspace/system contracts reuse
   camera-relative rendering, HDR, rings, physical closeups and source-driven
   body transforms. Improve overview composition without moving centers. Implement
   parent/moon selection, follow, reverse/pause, saved quality/camera/time, keyboard,
   reduced motion, context recovery and native/Solar return.
6. **Qualification:** focused failure-first contracts/camera/lifecycle/source tests;
   full relevant frontend/types/build, Docker science (warning-clean target not met: upstream Skyfield/NumPy warnings; see SCIENCE.md) and production
   build. Actual Windows desktop/portrait/landscape images and travel recordings;
   GPU/CPU/RAF, decode/upload/compile and cold-travel measurements. Physical iPhone
   remains unverified. Spec compliance then separate code/science/visual review;
   correct findings and rerun affected regressions. Push existing PR107 only,
   verify hosted CI/CodeQL at final SHA and preserve inherited advisory limits.

Root coordinates SystemScene/Workspace, shared integration, preview and serialized
GPU work. Specialists research science, asset provenance and independent renderer
review; implementations have explicitly assigned file ownership. No author grants
their own independent approval. Failed attempts and visual limits remain evidence.

Final deliverable is a working owner-review candidate with actual comparisons,
recordings, exact sources, tests, final SHA and limits. Keep PR107 draft and stop
for owner inspection without expanding into dwarf planets, missions or later phases.
