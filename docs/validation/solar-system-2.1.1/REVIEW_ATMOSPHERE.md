# Independent Earth atmosphere correction review

Reviewed on 2026-10-29 by the separate atmosphere reviewer, who did not implement
the correction. Branch `recovery/reconcile-20261026`, base
`ed0c81f785c6da68183e757ff381eba2727a2007`. Candidate is an uncommitted working-tree
change during this review; no commit, push, PR mutation or browser operation was
performed by this reviewer.

**Result: source/numerical and supplied GPU/application evidence review PASS; no
remaining actionable implementation finding in the bounded depth correction.**
Final-build qualification remains the implementer's separate responsibility. This review does
not grant owner visual acceptance, physical iPhone acceptance or release approval.

## Authority and inspected files

Default Mode with the owner's explicit Solar2.1.1 defect-correction authorization.
Loaded root/frontend AGENTS, CORE_CONTEXT, LIVE_SESSION_BRIEF and CONTEXT_MANIFEST
`solar_reconstruction`: SYSTEM_VALIDATION_SPEC, UNIFIED_UNIVERSE_ARCHITECTURE,
ADR0010, cinematic reference2026-10-21, UNIFIED_WORKSPACE_DESIGN_SPEC,
adaptive-explorer-r1a README, owner-acceptance README, visual-fidelity README and
Solar2/2.1 plans. Explicitly permitted2.1.1 PLAN and isolation/GPU evidence were
also inspected. No full docs scan or unrelated task pack was used.

Implementation inspected:

- `frontend/src/features/solar/solarTakram.ts`
- `frontend/src/features/solar/solarTakramDepth.ts`
- `frontend/src/features/solar/solarRenderPipeline.ts`
- `frontend/src/features/solar/SolarScene.ts`
- `frontend/tests/solarTakram.test.ts`
- `scripts/validation/verify_solar211_depth.mjs`
- Installed pinned Takram0.19.1 `src/AerialPerspectiveEffect.ts`,
  `src/shaders/aerialPerspectiveEffect.frag`, `build/shared.js` and package exports;
  geospatial depth/transform helpers; postprocessing Effect shader accessors and
  declarations; Three0.180 log-depth writer shaders.

The exact adapter hash reviewed is recorded in
[independent proof](evidence/review-atmosphere.json). The script checks the actual
installed effect and candidate subclass, without mocks or vendor modification.

## Cause and correction

Three writes perspective logarithmic depth as
`log2(1 - viewZ) / log2(far + 1)`. Upstream Takram decodes its distance, converts
it to ordinary perspective depth `a + b / distance`, then reconstructs `viewZ`
from that rounded value. With a100m near plane and astronomical far plane,
ordinary depth is extremely close to1. Float precision is lost before the inverse
operation; adjacent surface samples collapse onto discrete radial ranges.

The local correction derives `viewZ = -(exp2(depth * log2(far + 1)) - 1)` directly.
It scales the inverse-projection ray by `viewZ / ray.z`. This is the algebraic
inverse of the actual Three writer for a perspective camera. The ray ratio also
works for off-axis frusta and avoids dividing by a far-plane homogeneous `w`
that can round to zero. GLSL `exp2` is appropriate; there is no assumed `expm1`
intrinsic. Subtraction by1 is well-conditioned at the current100m near limit.

Independent float32 arithmetic emulation, near100m/far2000AU:

| True view distance | Old reconstruction error | Direct reconstruction error |
|---|---:|---:|
|1,000,000m|−366.75m|0m|
|26,000,000m|−523,634m|−12m|
|1,000,000,000m|−108,327,168m|−448m|

These are arithmetic examples, not exact GPU accuracy bounds. GPU transcendental
rounding and depth texture quantization still apply. At100,000,000,000m the
emulated old perspective denominator becomes zero; the direct result remains
finite. The correction preserves the existing supported altitude policy rather
than claiming unlimited position precision.

The exact single-block guard rejects missing, duplicate and already-patched
input. `getFragmentShader()` and protected `setFragmentShader()` are provided by
the installed postprocessing Effect; setting the shader triggers its ordinary
change notification. The subclass invokes that hook once after construction and
disposes on a guard failure. The existing adapter catches initialization failure
and reports its explicit custom-atmosphere fallback. No package files change.

All shader bytes before/after the reconstruction block are preserved, including
the raw-depth empty-sky branch and upstream scattering/transmittance. The new
branch requires both perspective camera and logarithmic depth. The ordinary
branch retains upstream reconstruction, and no later upstream code depends on
the converted depth variable. Near/far clips, scientific positions, Earth frame,
LUTs, radiance model, original scene resolution and rendering features are intact.
An orthographic/log-depth combination retains upstream behavior; it is not a new
qualified Solar camera mode.

Raising the near plane masks the numerical problem by sacrificing nearby scene
content. Reducing far alone does not remove the dominant near/distance precision
loss. An extra position/depth render target or model replacement would broaden
this correction unnecessarily. No existing AerialPerspectiveEffect option exposes
a reconstruction callback; the contained protected-hook adapter is reasonable.

## Independent commands and results

Run from repository root:

```sh
node docs/validation/solar-system-2.1.1/evidence/review_atmosphere.mjs
git diff --check
```

The source/math script exits0 with `pass:true`: upstream prefix/suffix preserved,
missing/duplicate/already-patched blocks rejected, ordinary branch preserved.
Fifteen off-axis reconstruction cases over100m–1e9m have maximum reprojected UV
error `1.1102230246251565e-16` in JavaScript doubles. `git diff --check` exits0
with no output. Read-only `rg`, `sed`, `cat`, `git diff`, `git status --short`,
`git branch --show-current`, `git rev-parse HEAD`, `sha256sum`, and local image
inspection established the source and evidence above; they are not runtime tests.

Reviewed original actual-application isolation PNGs show concentric bands with
Takram, and no bands at the identical camera after only diagnostic near-plane
increase100m→63710m. Clouds removal, flat texture and nearest filtering do not
remove them. The reviewer separately inspected the controlled GPU red/green full
globe PNGs: red has pronounced concentric steps; green is smooth at the tested
scale. Root-produced `depth-red/proof.json` and `depth-green/proof.json` record
Windows Edge/NVIDIA RTX3060, red `pass:false`, green `pass:true`, full-globe
maximum interior channel step29→4, seven active views, no WebGL errors,
foreground HDR maximum difference0, distant opaque/background maximum difference0,
and disposed geometry/texture counts0. These initial fixtures used far200AU;
they are controlled proof, not the final application's exact2000AU camera.

Two review observations were sent to the implementer: align the fixture far plane
with the application before claiming camera parity, and move its default output
from the previous2.1 evidence directory. Both script changes are now present:
far2000AU and `output/playwright/solar-system-2.1.1/depth/proof.json`. Fresh matching
receipts were subsequently produced separately; old receipts are not relabeled
as reruns.

### Follow-up: exact clip-range and application evidence

Reviewed fresh `output/playwright/solar-system-2.1.1/depth-2000au-red/proof.json`
and `depth-2000au-green/proof.json`, plus their full-globe PNGs. These use the
application's100m near and2000AU far range. Red is `pass:false`; green is
`pass:true`. Both record the NVIDIA RTX3060 Windows renderer, seven active Takram
views and zero recorded browser/WebGL errors. The measured full-globe maximum
interior channel step is again29→4. Both foreground HDR and distant opaque versus
background radiance differences remain0, with disposed geometries/textures0.
The fresh full-globe images independently show the concentric defect before the
fix and its removal afterward. This closes the fixture clip-range observation.

The nine-case `isolation-before-full/isolation.json` and
`isolation-after-full/isolation.json` receipts have no errors and matching camera,
target, near plane, quaternion/up, epoch, Earth frame and quality in every pair.
Takram remains active for the full, cloudless, flat-surface, nearest-sampling,
atmospheric-pass-only and enlarged-near diagnostic cases. Custom, surface-only
HDR and surface-only direct remain inactive as intended. Those three control
PNG pairs are byte-identical before/after. Inspected atmospheric-pass-only and
flat-surface PNG pairs remove the strong concentric steps while retaining
atmospheric output. Faint underlying mesh structure in the isolated scattering
image is not claimed to be eliminated by this depth correction.

The actual `before/application.json` and `earth-corrected/application.json`
receipts both record Windows Edge156.0.4314.50, epoch2026-10-27T04:00:00Z and
zero errors. All ten comparisons (five views × Takram/custom) match camera,
target, quaternion/up, near, epoch, Earth frame and quality exactly. Every Takram
view is active with no fallback reason and retains100m near; every custom view
reports `comparison-selected`. Inspected corrected day, limb, crescent, backlit
and near-horizon PNGs show no reproduced concentric band defect. The matched day
before/after visibly removes the reported rings without removing clouds or
surface imagery. These are source-matched actual desktop application captures,
not physical-device or owner-acceptance evidence.

The reviewer reran the independent source/math command after this evidence review:
PASS with the same adapter SHA, guard results and15 off-axis cases. JSON inspection
used Python3's standard `json`/`pathlib` libraries; image inspection used local
`view_image`. No browser was launched or controlled by this reviewer.

## Limits and next task

No GPU/browser launch, Docker rebuild, full frontend suite or physical-device
test was run by this reviewer. GPU/application evidence was inspected, not
generated independently. The supplied desktop visual cases and controlled
lifecycle checks pass as described; final-build binding and integrated
quality/navigation/lifecycle/performance qualification remain separately required.
The mathematical/source conclusion does not replace those tests or the owner's
visual decision. No terrain changes are approved by this atmosphere-only review.

Reviewer-created files only: this report, `evidence/review_atmosphere.mjs` and
`evidence/review-atmosphere.json`. Recommended next task: finish the matching
application/GPU qualification and retain the private preview for owner review.
