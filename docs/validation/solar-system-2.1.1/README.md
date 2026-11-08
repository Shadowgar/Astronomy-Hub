# Solar System 2.1.1 — owner-rejected visual corrections

Candidate on `recovery/reconcile-20261026`, existing draft PR107. Verified starting
HEAD `ed0c81f785c6da68183e757ff381eba2727a2007`; main remains
`9a03d8260a529f5858c5c3298cbb9d32b721daeb`. Final SHA and hosted results are in the
PR107 qualification comment. **Owner visual acceptance remains pending.**

- [Private corrected application](http://localhost:4231/solar-system?solarBody=earth&date=2026-10-27T04:00:00Z)
- [Private Apollo17 survey](http://localhost:4231/planet-terrain/apollo17-nac-v1?date=2026-10-28T00:00:00Z)
- [Actual before/after gallery](http://localhost:4231/owner-review/solar-system-2.1.1/)
- Unchanged rejected2.1 rollback: `http://solar21.localhost:4231/`. Earlier Solar2,
  Solar1 and baseline previews remain. Listener stays127.0.0.1:4231; no tunnel.

Owner screenshot files were unavailable in the local session. We reproduced the
conspicuous concentric defect in the unchanged owner preview on actual Windows
Edge/NVIDIA, recorded camera/epoch, and compared the same views. These are actual
application captures, not reconstructions of unseen owner images; the owner's
exact camera cannot be claimed matched.

## Findings and corrections

### P1 — Earth: ill-conditioned normalized-depth roundtrip

`frontend/src/features/solar/solarTakram.ts:4` now instantiates the actual Takram
effect through `solarTakramDepth.ts:18` (constructor:36). Upstream0.19.1 aerial perspective decodes
log depth into metres, converts to perspective depth extremely close to1, then
inverts that rounded float to recover view position. At the actual100m near plane
and2000AU far plane, this loses hundreds of kilometres: a float32 example at
26,000km reconstructs25,476.366km. Discrete radial shells corrupt scattering over
land/ocean. This is separate from2.1's earlier AU raster-unit cancellation fix.

Nine controlled actual-application cases isolate the failure: bands survive
cloud removal, flat surface, nearest filtering and atmospheric-only output;
custom atmosphere and surface-only HDR/direct controls do not generate them.
Raising only the diagnostic near plane to63,710m removes the problem, explaining
why the previous controlled fixture missed it. That clipping workaround is not
used in the product. Custom and both surface-only before/after images are
byte-identical.

The tiny adapter decodes viewZ directly from the actual Three logarithmic buffer
and scales an inverse-projection ray. It avoids the lossy intermediate normalized
depth and far-plane homogeneous-w division. A strict unique-block guard rejects
upstream shader drift; ordinary nonlog reconstruction remains upstream. Real
Takram scattering/LUTs, cloud geometry/textures, HDR,100m near plane, JPL vectors,
ITRS frame, resolution and navigation remain intact. No blur, asset downgrade,
feature disablement or vendor edit. Exact review, source lines and independent
math/GPU evidence: [REVIEW_ATMOSPHERE](REVIEW_ATMOSPHERE.md).

Actual100m/2000AU Windows GPU red→green: maximum sampled discontinuity29→4;
all7views use actual Takram, no errors, foreground/distant HDR controls0difference,
disposal0resources. Actual default plus day/limb/crescent/backlit/near-horizon
captures remove the reproduced concentric bands. All5viewpairs also pass at
390×844 and844×390. Faint mesh structure in isolated scattering and finite source
texture detail are not claimed eliminated.

### P1 — Apollo17: unexplained cropped surface without planetary context

`TerrainWorkspace.tsx:56`, `TerrainContext.tsx:7`, `terrain.css:24` and
`terrainContext.ts:8` now present a deliberate bounded measured survey alongside
an approximate global Moon locator. The source5.12×5.12km boundary,5m sampling,
true height scale and coarse context resolution are visible. Native Moon remains
the authoritative planetary overview through the existing camera/time-preserving
return. No second heavy renderer is introduced. The image failure state hides
the locator marker and reports unavailable context while terrain remains usable.

The existing qualified LROC WAC8pixel/degree image supplies a reproducible static
orthographic near-side map (~3.79km/pixel at equator), not new high-resolution
measurements or selected-epoch illumination. Original85NASA TilesRenderer GLBs,
5m NAC geometry and progressive refinement are unchanged. The default camera now
fits an enclosing sphere in the limiting45-degree field of view so the complete
measured footprint is visible; zoom/detail remain available.

A seamless join is **not qualified**. NAC LROC_ME does not identify its exact DE
realization; native Moon uses MOON_ME_DE440_ME421. Existing LOLA LDEM_4 is~7.58km
per sample, DE421. Comparing16,641original vertices at equal nominal coordinates
shows coarse heights13.322–596.667m above NAC (edge23.504–593.746m), so a sphere or
naive coarse overlay buries the real region. This comparison is not a frame
registration. No lifted NAC, lowered globe, fabricated transition or added
high-resolution coverage. [Source investigation](SOURCE_CONTEXT_REVIEW.md),
[original source receipt](evidence/moon-context-source.json).

### P2 — retry and layout defects found during correction review

The pinned tile library's `resetFailedTiles()` dereferences `internal.loadingState`
on unprocessed child nodes after a root503. The old `TerrainScene.retry` wrapper
therefore threw and left the surface blank. `TerrainWorkspace.tsx:44,73` now uses the
existing region remount path for Retry tiles, preserving camera/UTC and disposing
the failed renderer/transport. No vendor/internal-state patch. Windows red proof
and corrected503 regression are retained; independent reproduction confirms cause.

Independent review also caught short portrait canvas collapse, hidden landscape
approximation text and a floating marker on image failure. All corrected, with
actual390×501/540 and image503 captures. [Independent terrain review](REVIEW_TERRAIN.md).

## Qualification and limits

- Full frontend:504tests/77files PASS; typecheck and Vite production build PASS.
- Docker science/frame:7warning-clean tests PASS, read-only worktree/kernel.
- Original terrain conversion10tests and new context projection3tests PASS;
  independent context image rebuild matches;85GLB hashes unchanged.
- Windows Edge/NVIDIA RTX3060: Earth matching/isolation/red-green evidence above;
  terrain10groups PASS, including3layouts, measured leaf refinement, keyboard,
  touch, resize, context loss/restore, nativeMoon entry/return camera/UTC,
  missing-context and tile503 recovery, zero resources after disposal, and real
  Sky/Earth/Solar source-observer handoffs. Actual recordings retained privately.
- Production Docker build succeeds. No production container was deployed.
- Dedicated24case Earth GPU comparison PASS. Desktop Balanced/Takram median
  GPU0.922→0.892ms, CPU1.200→1.200ms, RAF6.9→6.9ms. Single-run evidence,
  not a performance guarantee; mobile GPU medians also did not increase.
- [GPU comparison](PERFORMANCE.md), [exact commands and failed attempts](COMMANDS.md),
  [changed file inventory](FILES.txt), [loaded authority and plan](PLAN.md).

These bounded independent reviews do not approve the entire consolidated PR.
Physical iPhone remains unverified (owner has no private access path); portrait
and landscape captures are desktop-GPU browser emulation. Owner visual acceptance,
matching final source archive/reconstruction and approved public source offer
remain separate release gates. No archive published. Existing advisory maintenance
and broader legacy backend warning-clean qualification remain outside this change;
no clean entire-repository security/backend claim is made. Runtime dependencies,
scientific source packs, native Stellarium/Cesium, protected data and rollback are
preserved. No merge, deployment, branch deletion or Solar2.2 work.

Next task: owner reviews the exact candidate and gallery; separately authorize
remaining physical-device/source release qualification. Stop product work here.
