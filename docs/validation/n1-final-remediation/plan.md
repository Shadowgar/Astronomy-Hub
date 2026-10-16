# N1 final remediation implementation plan

Goal: resolve the three verified P2s and implement restrained native satellite
presentation without altering accepted scrolling or Pennsylvania scenery.

Authority: owner Final Remediation directive, October 15, 2026. Default Mode,
single agent, existing branch/PR #75 at 53ac7478; no merge/deployment/R2/R3,
provider/catalog/dependency changes or new native renderer modification.
Context: frontend_change, docs_change, validation, review manifest packs; explicitly
requested prior Pennsylvania/native-horizon evidence only. Full ledger accompanies report.

## Design and review focus

- Snapshot acquisition reads state. Cancellation resets only navigation intent;
  committed renderer destruction performs the existing resource interruption.
  Review active native flight, tracking, wheel animation, repeated cancellation.
- One shared pure elevation-provenance rule validates actual coordinates/elevation.
  A small optional provenance field accompanies observer intent, never camera height.
  Earth preserves a known provided observer height at the same geographic target;
  new locations still report an explicit unavailable-zero fallback. Review valid
  provided zero, stale URL claims, missing/malformed provenance and native pick error.
- Build and attester share selected-source/pin preflight. Explicit selection travels
  into attestation and re-attestation; missing path, wrong HEAD and changed compiled
  input fail before successful attestation. Review genuine alternate checkout.
- Satellite policy uses only native hints_visible / hints_mag_offset and actual
  field of view. Photometry, SGP4, identity, selection, focus, locking and model
  rendering remain native. Wide selected objects may use selected-only native
  identification, while faint unselected objects are not brightened. Thresholds
  are chosen from real native baseline/close-view comparisons; hysteresis prevents
  toggling around the boundary. Standalone defaults and disposal are preserved.

## Execution

- [x] Task 1: tests/earth/navigation-snapshot.test.mjs reproduces tracked satellite,
  native flight and wheel-animation mutation on snapshot/cancel, then cleanup on
  committed destruction. Remove premature interruption in RuntimeBridge and
  gate-only reset in CameraController; retain all animation constants/math.
- [x] Task 2: shared packages/runtime-protocol/observer-elevation.mjs plus declarations,
  protocol optional observer provenance, thin frontend URL normalization, contained
  Sky adapter and Earth observer context. RED/GREEN fixtures cover all seven owner
  cases, semantic DTO bounds and provided-elevation retention after Earth picking.
- [x] Task 3: shared scripts/runtime/sky_source.py preflight, build/attester/recorder
  source propagation. RED/GREEN source routing, missing/wrong revision and input
  mismatch; full offline default and genuine alternate-checkout artifact attestation.
- [x] Task 4: contained native satellite policy with FOV hysteresis, selected-only
  hint handling and native restore/cleanup. RED/GREEN threshold/selection/remount
  cases; matched native standalone and embedded browser evidence using existing
  catalog bytes. Missing/stale live provider evidence is recorded separately.
- [x] Task 5: complete runtime/Earth/frontend tests, typecheck, reproducible offline
  UI/Earth builds, all artifact/source/admission checks. Real desktop/mobile visual,
  elevation/history/snapshot/cancellation and full accepted navigation journeys.
- [ ] Task 6: scoped authority updates and consolidated evidence; single-agent review,
  commit/push existing PR, reply to and resolve each P2 only after verified GREEN,
  recheck current-head reviews. Stop pending final owner testing, no merges.

Ruling: execute inline under the owner's explicit implementation authorization and
single-agent rule; no redundant plan approval or delegated reviewer. Skills guide
red/green and verification, while owner scope and repository context control work.
