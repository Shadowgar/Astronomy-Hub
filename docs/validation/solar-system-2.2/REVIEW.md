# Independent camera, scene-integration and lighting review

Branch `recovery/reconcile-20261026`, baseline `66fff05108ca7ed7ee0ee1d5137b4b2619c28373`.
The preview/review worker did not author the reviewed rendering changes. Loaded
root/frontend rules and the declared `solar_reconstruction` authority pack; the
current owner request authorizes 2.2. This review made no renderer changes, browser
claims, commit or push. The reviewer authored the collision test and source fixture.

## Findings and corrections

- **P1, camera arrival collision — corrected.** Early independent target acquisition
  moved a close-body camera into the Sun before its radial offset grew. Actual
  source vectors at 2026-10-27T04:00:00Z and the real controller/OrbitControls at
  60 Hz reproduced failure in all eight planet-to-Sun journeys: the flight stopped
  at the surface while reporting no animation, 3.42–4.09 Sun radii from the intended
  endpoint. An otherwise identical old-transition comparator did not reproduce
  these eight failures. The old transition separately blocked Mars↔Jupiter travel.
  The author's staged radial departure, distant transfer and radial arrival now
  completes all 72 ordered journeys with collision guards retained.
- **P2, Eros texture integration — corrected.** The common detail installation
  assumed ShaderMaterial uniforms, while Eros retains MeshStandardMaterial. Its
  admitted detail load therefore threw and left a disposed map in detail state.
  Eros is now excluded before either immediate or pending focus; its original
  model/material remains intact. Root's additional source-UV readiness gate was
  also reviewed: a detail texture waits until the matching source geometry exists.
  Actual Eros navigation and delayed source-geometry delivery remain browser checks.
- **P2, transparent color composition — corrected in source.** The ring coverage
  correction was mathematically valid only before tone mapping. Efficient/direct
  rendering transformed each translucent fragment before blending: a representative
  valid thin-ring case produced 0.166 output versus 0.583 in linear HDR, without
  bloom. Every quality now composes into a linear target before one OutputPass;
  FXAA follows it as required by installed Three r180. Without float targets,
  RGBA8 clipping before blending remains explicitly disclosed. Takram's unsupported
  GPU guard remains intact. Efficient adds two fullscreen passes and targets;
  actual GPU cost and pixel qualification must be refreshed.
- **P3, overstated bloom test — corrected.** The prior title asserted exclusion of
  ordinary surface energy, while it only checked threshold/strength/radius constants.
  A white Jupiter source texel can exceed threshold 1.8. The test now states the
  narrower policy it actually verifies.
- The old controller regression assumed every flight ended after 1.9 seconds.
  It failed under distance-dependent duration; the author updated it to the bounded
  completion window while retaining the giant-to-asteroid endpoint assertion.

No further actionable defect was found in the reviewed correction. Stable ring
transmission algebra, source-color sampling, source Sun direction, shadow/profile
ownership and the single renderer are preserved. New Sun morphology is expressly
illustrative; its latest visual quality is not established by this source review.

## Source-backed collision regression

`frontend/tests/solarTravelCollision22.test.ts` uses the actual controller,
OrbitControls and swept-sphere guard, sampling every journey for 300 frames at
60 Hz. It checks all bodies' clearance on every frame, endpoint and target error
below 1e-5 destination physical radii, completed animation and immutable source
inputs. It does not teleport to an endpoint or substitute a collision function.

`frontend/tests/fixtures/solarTravel22-source.json` is a 9.3 KB snapshot from the
existing Docker API. It records endpoint, capture time, original response SHA-256,
DE442s source hash, frame, epoch and units. Only unrelated trajectory arrays were
removed; body centers and physical radii are unchanged. This proves paused-time
camera geometry, not source ephemeris accuracy or perceptual travel smoothness.

The original controlled comparison and red/green receipts remain under
`output/playwright/solar-system-2.2/preview/review-camera{.mjs,-red.json,-green.json}`.
An initial test-authoring assertion expected explicit `.000` in the API epoch;
the API retains the equivalent `...00Z` spelling. That assertion was corrected
without altering the source fixture or any of the 72 already-passing journeys.

## Commands and results

```bash
node output/playwright/solar-system-2.2/preview/review-camera.mjs
npm test --prefix frontend -- --run tests/solarTravelCollision22.test.ts
npm test --prefix frontend -- --run tests/solarCameraController.test.ts tests/solarTravel22.test.ts tests/solarTextureStreaming.test.ts tests/solarAssets.test.ts
npm test --prefix frontend -- --run tests/solarMaterials22.test.ts tests/solarLighting.test.ts tests/solarTakramDepth.test.ts tests/solarEarthFrame.test.ts
npm run typecheck --prefix frontend
git diff --check
```

Results: source-backed matrix 72/72; collision regression 73 tests PASS;
camera/resource bundle 19 tests PASS; lighting/frame bundle 23 tests PASS;
typecheck and whitespace checks exit 0. The lighting test uses real composer/passes
with a recorded renderer boundary, not a WebGL context. No GPU claim comes from it.

Remaining: real application recordings and matched pixels after the final changes,
quality/fallback GPU cost, interrupted and advancing-time journeys, browser Eros
and asynchronous source-geometry cases, hosted CI and owner visual acceptance.
Physical iPhone remains unqualified. Keep PR107 draft and unmerged.
