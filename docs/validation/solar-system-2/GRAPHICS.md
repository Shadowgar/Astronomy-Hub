# Solar System 2.0 graphics implementation receipt

This is implementation and isolated GPU evidence, not owner visual acceptance,
Windows GPU qualification, physical mobile proof or release approval. The owner
Solar System 2.0 directive supersedes earlier visual stop points; native Sky,
Cesium and planetary scientific sources remain separate.

## Inspected source and decisions

| Reference | Exact revision / inspected files | Decision |
| --- | --- | --- |
| [Solar Wanderer](https://github.com/hyqzz/Solar-Wanderer/tree/739b3675e25f65bedfcdf728985f2c9adb872fe1) | `739b3675e25f65bedfcdf728985f2c9adb872fe1`; `LICENSE`, `src/engine/floating.js`, `quality.js`, `src/scene/planetMaterial.js`, `rings.js`, `atmosphere.js` | Adapt limited ring particle-layer scattering, analytic sphere occlusion and bounded spherical scattering techniques. No clock, ephemeris, application, textures or datasets imported. MIT copyright 2026 hyqzz retained in `/licenses/solar-wanderer-MIT.txt`. |
| [pmndrs Postprocessing](https://github.com/pmndrs/postprocessing/tree/9cf03cff26615636a564d8bfddf765edb8917441) | `9cf03cff26615636a564d8bfddf765edb8917441`; `package.json`, `README.md`, `LICENSE.md`, `src/core/EffectComposer.js` | Version 6.39.5 declares Three `>=0.168.0 <0.187.0`; compatible with existing 0.180.0. Zlib license. Studied HDR/linear composition but no package/code imported: the already pinned Three addons supply the bounded bloom/output pipeline without another dependency. |
| [Takram Three Geospatial](https://github.com/takram-design-engineering/three-geospatial/tree/b012ad06d858fc035d88aacfd73f092f93c994e4) | `b012ad06d858fc035d88aacfd73f092f93c994e4`; root `LICENSE`, atmosphere `package.json`, `README.md`, vanilla `Atmosphere-Vanilla.tsx`, clouds `package.json` and `src/CloudsEffect.ts` | Atmosphere 0.19.1 and clouds 0.7.6; MIT. Three `>=0.170.0` is compatible, optional React 19 peers apply to R3F. The documented ECEF-only frame and effectively Earth-only atmosphere, post-lit albedo/normal requirements, and cloud temporal/shadow/depth passes conflict with a narrow scene-wide multi-body insertion. Deferred, not called incompatible with Three 0.180. No package/code/LUT imported. |
| Three addons | Installed lockfile Three 0.180.0; `WebGLRenderer.js` target-tone-map behavior, `EffectComposer.js`, `UnrealBloomPass.js`, `OutputPass.js`, `ShaderPass.js`, `FXAAShader.js` | Reuse existing MIT dependency; half-float linear targets, controlled bloom, one ACES/sRGB output transform, then FXAA. Existing `/licenses/three-MIT.txt` remains applicable. |

No dependency upgrade is required for these changes. No native engine rebuild
or corresponding-source archive publication was performed by this graphics work.

## Implemented behavior

- `solarMaterials.ts` receives an explicit Sun direction computed from source
  body/Sun positions in JavaScript double precision. Moving the render origin
  cannot move the light. Planet materials accept source UV maps and retain a
  disclosed procedural fallback. Surface lighting is normalized for visibility,
  not calibrated irradiance/photometry or current weather.
- `solarRings.ts` samples a 4096×1 radial optical profile: broad C/B/Cassini/A/F
  boundaries and approximate optical-depth ranges derive from the
  [NASA NSSDCA rings fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html).
  Radii are kilometres divided by the existing **58,232 km mean radius**, not
  equatorial-radius ratios accidentally applied to a mean-radius sphere.
  Fine radial ripples, narrow-gap widths, albedo and phase parameters are
  illustrative, not a measured occultation profile. D/E/G diffuse rings are not
  modeled. The optional NASA radial graphic supplies color only; its alpha is
  never treated as measured optical depth.
  The first Windows capture exposed radial moire in the initial unmipmapped
  4096-sample profile. Trilinear mip integration replaces the linear-only sampler,
  preserving the same broad radial data. The isolated subpixel-motion comparison
  reduces mean RGB change from **6.1624 to 0.6229** 8-bit channel levels (about90%).
  The runner requires at least25% reduction; owner/application recapture remains
  separate from this controlled sampling proof.
- Rings use view/incidence-dependent optical opacity, bounded reflection and
  transmission, back/forward scattering, planet shadow on rings and radial ring
  shadow on the planet. Double-sided geometry has `forceSinglePass=true` so
  transparency is not applied twice. Ring orientation remains a disclosed static
  presentation choice, not an epoch-qualified pole/body-fixed solution.
- `solarAtmosphere.ts` integrates a bounded view/light path through a spherical
  atmosphere, including planetary occlusion, wavelength-dependent Rayleigh
  attenuation and an approximate Mie component. Quality changes sample counts
  without changing source geometry. This is an optical approximation with
  separate authored Mars/Venus/giant-planet coefficients, not Takram/Bruneton parity, surface weather,
  volumetric clouds or validated planetary radiative transfer.
- `solarRenderPipeline.ts` owns only render targets and passes. It adds no scene,
  camera, animation loop or science clock. Balanced/Detailed use half-float HDR,
  bloom threshold 1.25, strength 0.17/0.24, ACES output and FXAA. Efficient or
  absent `EXT_color_buffer_float` uses the direct renderer path. Owned targets
  are released on tier changes/disposal; render statistics include all passes.
- Atmosphere/clouds/corona/background/stars participate in the same logarithmic
  depth and output-color contracts as the opaque surfaces. Source textures must
  be marked sRGB when they encode color; scientific cloud density is linear.

## Validation

Commands run from the recovery worktree, or its `frontend` subdirectory where
shown:

```text
cd frontend
npm test -- --run tests/solarLighting.test.ts
  initial: FAIL, solarRings module absent (expected red)
  implemented: 6 passed
  per-body profiles: 2 failed (new API absent), then 8 passed
npm test -- --run tests/solarLighting.test.ts tests/solarPresentation.test.ts tests/solarRefinement.test.ts tests/solarVisualFidelity.test.ts
  4 test files, 16 tests passed (including two added profile tests)
npm run type-check
  tsc --noEmit, exit 0; an intermediate concurrent integration run failed on
  SolarObjectId/Eros versus the old BodyId focus signature, then root fixed it
git diff --check
  exit 0, no output
npm run dev -- --host 127.0.0.1 --port 4234
  temporary local Vite source server
```

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/home/rocco/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome \
node scripts/validation/verify_solar2_materials.mjs \
  http://127.0.0.1:4234 docs/validation/solar-system-2/evidence/materials.json
```

[Machine-readable material proof](evidence/materials.json): **PASS**, zero
browser/shader errors; all three quality modes render nonblack frames with
WebGL error 0; Sun reversal changes illumination; Earth/Jupiter/Sun/cloud and
all seven per-body atmosphere shader programs compile. The HDR control surface has **0 channel
difference** between direct and compositor output, verifying no duplicate tone
mapping at that control sample. Device is Linux ANGLE Vulkan **SwiftShader**;
this result makes no desktop NVIDIA throughput claim.

The material runner serves an empty isolated verification document, imports
actual worktree source modules and creates controlled geometry. It does not mock
scientific APIs and is not offered as an application screenshot. Application
integration, Docker runtime, real Windows/NVIDIA, camera travel, resizing, resource
lifetime across routes and owner visual comparison belong to the main run's
separate evidence. Physical iPhone remains unverified.

An initial Playwright CLI launch expected missing Chromium 1247; the existing
Chromium 1223 executable was then selected explicitly. That failed launch is not
counted as a passing browser run.
