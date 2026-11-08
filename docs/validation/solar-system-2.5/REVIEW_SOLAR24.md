# Independent review of the final Solar 2.4 integration

**Final scoped result: pass. The confirmed P2 was corrected and independently
rechecked in the actual browser; no unresolved P1/P2 remains in this Stage A
integration scope. Historical red/green evidence is retained below. This is not
owner acceptance or whole-PR approval.**

Reviewer: a separate non-author application-integration agent, available for the
Solar 2.5 Stage A review. Reviewed immutable commit
`ea4d384af3aead949de7bec1947e8aff41465bca` against `fc1a7142`, on
`recovery/reconcile-20261026` / draft PR107. This reviewer did not author the Solar
2.4 application changes or the correction described below.

Loaded context: root/frontend repository instructions, current CORE_CONTEXT and
LIVE_SESSION_BRIEF, the manifest's `solar_reconstruction` authority pack inherited
from the coordinating agent, and the explicitly requested Solar 2.4
REVIEW/README/VALIDATION/source-binding and focused browser evidence. No full-docs
scan or unrelated task pack was used. The owner's new Solar 2.5 directive permits
this review and bounded corrections; it does not grant earlier owner acceptance.

## Confirmed P2: expired destination paths survive an unsupported time seek

**Location:** `frontend/src/features/solar/SolarScene.ts:137`–143,
`:185`, and `:218` at the reviewed commit.

**Cause:** `setDestinations` updates only tracks present in the new packet; it never
clears a prior destination track omitted from an unavailable-epoch response. The
draw loop shows that track from `trajectoryMode`/selection alone, without requiring
a currently admitted source position. The selected-body marker likewise ignores
`mesh.visible`. Thus source admission correctly hides the body while the old
trajectory and selected-body bracket remain in the new epoch.

**Actual reproduction:** on the live loopback owner preview, headed Windows Edge
with NVIDIA RTX3060, open Pluto at `2026-10-27T04:00:00Z`, choose **View source
trajectory**, then **Simulation time → 2035-01-01T00:00 → Apply epoch**, followed by
one Orbit camera right action. The same renderer survives, both reported epochs
become 2035, and `destinations.available` is empty. Nevertheless the intercepted
native WebGL `drawArrays` calls contain **four LINE_STRIP draws of 577 vertices**
(the old Pluto path), and `.solar-selection` remains visible. This is actual draw
submission, not merely stale diagnostic metadata. The 2035 source endpoint returns
HTTP200 with explicitly unavailable destinations and no tracks.

**Impact:** an unsupported historical/future epoch visibly retains the previous
Pluto trajectory and selection bracket despite the unavailable position. This is
especially unsafe to build on for the historical spacecraft work, where a stale
modern path must not be presented as contemporaneous geometry.

**Correction required:** retire or clear omitted destination tracks; gate track
and selection-marker visibility on current source admission, including a seek,
window expiry, or failed refresh. Preserve base-planet track behavior, source data,
and valid trajectory/return behavior. A focused regression must show no expired
line draw or marker at 2035 and successful source-backed restoration when seeking
back to 2026, with bounded buffers/resources.

Retained reviewer evidence (ignored local output, not fabricated):

- `output/playwright/solar-system-2.5/review24/reproduce-expired-path.mjs`
- `output/playwright/solar-system-2.5/review24/expired-path.json`:
  `DEFECT_REPRODUCED`; same renderer, no available destinations, four count577 draws.
- `2026-source-path.png` and `2035-expired-path.png` in that directory.

## Other scoped findings

No additional confirmed P1/P2 defect was found in the inspected paths:

- The v2.4 build allowlist now emits actual asset bytes, not an SPA fallback.
  Independently compared all **61 committed runtime/source input hashes** and all
  **327 served artifact hashes** with the retained immutable binding; all match.
- The source-aware refresh helper supplies a quarter-window lead at the maximum
  playback rate and bounds larger wall-time leads. Version/abort fences prevent
  stale epoch responses replacing a newer selection. Failure stops the selected
  precise source at the admitted boundary rather than extrapolating it.
- Existing trajectory buffers reuse capacity; growth disposes the old GPU
  attributes before replacing them. Population buffers, workers, timers and pending
  RPCs have bounded lifetime. The expired-path omission above is distinct from
  unbounded GPU allocation.
- Precise Eros availability takes precedence over the old approximate catalog's
  shorter 2026 domain. Explicit string identities and source-index joins survive
  catalog routing. Optional-source HTTP failures do not invalidate base planets.
- Pluto/Charon source spheres are Cartesian +X=0E,+Y=90E,+Z=north. Applying the
  matching nominal PCK quaternion avoids the legacy visualization-axis rotation;
  the return retains `qualified: false` and historical-longitude ambiguity. Exact
  map meridian/epoch geography is not asserted. Measured Vesta/Eros frames retain
  their exact model and frame pins. Existing uncertainty disclosures are necessary.

## Independent checks run

```sh
npm test --prefix frontend -- --run tests/solarDestinations.test.ts tests/solarPopulationLayer.test.ts tests/solarPopulationExplorer.test.ts tests/systemPresentation.test.ts tests/systemOrientation.test.ts tests/celestialBody.test.ts
```

**55 tests passed in 6 files**, 693 ms. Those existing tests did not cover the
unsupported-epoch draw regression. Additional read-only checks verified the live
preview/backend containers were already running, actual HTTP source behavior,
immutable source/artifact hashes, and retained PASS receipts for all three viewport
journeys, optional-source failures, native lifecycle, recordings and gallery decode.
No container, production data, branch or implementation source was changed by this
reviewer. The Windows browser was closed and the GPU slot released after reproduction.

## Initial review disposition (before correction)

**BLOCKED on the confirmed P2 until the correction receives a separate re-review
and focused regression.** The earlier service-availability blocker is now resolved:
an independent reviewer has actually reviewed the final integration and found this
correctable defect. This is not a whole-PR, security, device, source-release or owner
visual acceptance decision. A correction addendum will record its exact diff and
new red/green proof; no earlier scientific/asset approval substitutes for it.


## Independent correction re-review

The implementation author repaired only `SolarScene.ts` (16 changed lines):
omitted destination tracks are removed from the scene, GPU geometry/materials
are disposed and removed from the final-disposal owner, draw visibility now
requires a currently admitted source position, and the selected marker requires
its mesh to be visible. Base planetary paths are excluded from destination-track
retirement. The independent reviewer inspected this correction and found no new
P1/P2 issue in its scope.

The correction was tested from the existing Docker-built private preview at
`http://localhost:4231`; the original Solar 2.4 build remains separately retained.
The source reviewed for this addendum is `SolarScene.ts` SHA256
`5b4914752187034bb7bbd11f4d64d88e0927f9cc8dc5ef360b8cfa90891ca5eb`,
on base `ea4d384af3aead949de7bec1947e8aff41465bca`. It is an uncommitted working-tree
correction at review time; the integrating commit must preserve these bytes.

The reviewer retained a reusable focused browser regression at
`scripts/validation/verify_solar25_review24.mjs` and ran:

```sh
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar25_review24.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.5/review24")"
```

**PASS on real headed Windows Edge / NVIDIA GeForce RTX3060 Laptop GPU (D3D11):**

- Three actual UI 2026→2035→2026 seeks retain one renderer. Every unsupported
  epoch submits **zero LINE_STRIP draws** and hides the selection marker; each
  supported return draws the source-backed 577-point Pluto path again.
- All nine original base bodies remain available at the unsupported optional
  destination epoch. Repeated restoration stabilizes at **19 GPU geometries and
  67 live WebGL buffers**, with no growth across the three cycles.
- An explicitly injected optional destination HTTP503 during the 2035 seek also
  leaves no expired trajectory or marker. Restoring the endpoint and seeking back
  to 2026 restores the source path. No browser page errors occurred.
- The reviewer inspected the actual before/after screenshots: the rejected
  historical gold line and bracket are present before correction and absent in
  the corrected 2035 output. This is source-availability proof, not owner visual
  acceptance of the broader product.

The full red and green receipts remain at the local paths above. Compact checked-in
results and artifact hashes are in `evidence/review24.json`; corrected images are
`output/playwright/solar-system-2.5/review24/fixed-2026-source-path.png` and
`fixed-2035-no-expired-path.png`. The original failed receipt was preserved.
The reviewer made no application implementation changes, committed/pushed nothing,
and did not change any container or protected data. The Windows browser was closed
and the exclusive GPU slot released after verification.

**Scoped final disposition: the confirmed P2 is corrected and independently
re-reviewed; no unresolved P1/P2 remains in this final Solar 2.4 integration review
scope.** This closes the previously unavailable independent-review gate for the
specified integration diff only. Whole-PR integration, source-release, physical
iPhone and owner visual acceptance remain separate qualifications. The next
review task is the independently implemented Solar 2.5 mission application once
its source and browser evidence are available.
