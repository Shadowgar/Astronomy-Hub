# Solar 2.1 actual Takram atmosphere receipt

The adapter is implemented and its controlled GPU proof passes. Application,
Windows/NVIDIA, independent science review and owner visual acceptance are
separate gates recorded by the integrated Solar 2.1 handoff. These controlled
images use an untextured Earth test sphere; they are not application captures.

## Authority and source

Owner's explicit Solar 2.1 directive supersedes the historical Solar 2.0 visual
stop for this bounded work on `recovery/reconcile-20261026`, starting
`b4005ce48e9869c298de4ed019c67e4e246accda`. Loaded root/frontend AGENTS,
CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST's `solar_reconstruction`
pack, including validation, unified architecture, ADR0010, cinematic/workspace
design references, adaptive-explorer-r1a, owner-acceptance/visual-fidelity and
Solar 2.0 PLAN; explicitly scoped prior `solar-system-2/GRAPHICS.md`. No broad
documentation scan. Native Sky/Earth/Moon source and data are untouched here.

Inspected [Takram source at b012ad06](https://github.com/takram-design-engineering/three-geospatial/tree/b012ad06d858fc035d88aacfd73f092f93c994e4/packages/atmosphere):
`package.json`, README vanilla example, `AerialPerspectiveEffect.ts`,
`AtmosphereMaterialBase.ts`, `AtmosphereParameters.ts`, `SkyMaterial.ts`,
`PrecomputedTexturesLoader.ts`, `PrecomputedTexturesGenerator.ts`, `constants.ts`,
and aerial-perspective/sky/Bruneton GLSL. The actual published **0.19.1** tarball
was independently downloaded from the npm registry and inspected; archive SHA256
`7fc3ce70d350bb66a7ea6ef63d57ab46fa94cedf30162c4c02be467c60d79649`.
Companions: `@takram/three-geospatial` **0.9.1**, `postprocessing` **6.39.5**,
single app Three **0.180.0**. Root's separately locked graphics package boundary
isolates unused React19/Fiber peers required by geospatial, without forcing
installation or changing the app's React18. Build inspection verifies those
isolated peer packages are absent from the application bundle. No R3F import or
upstream astronomical clock is used.

Takram is MIT; its embedded Eric Bruneton/INRIA atmospheric shaders also retain
BSD-3-Clause obligations. Exact notices are served at
`/licenses/takram-three-geospatial-MIT.txt` and
`/licenses/bruneton-atmosphere-BSD.txt`.

## Actual rendering and frame contract

`frontend/src/features/solar/solarTakram.ts` imports and instantiates upstream
`AerialPerspectiveEffect` and `postprocessing.EffectPass`. Existing NASA Earth
surface radiance is attenuated/scattered by that effect. The external composition
pass uses the package's exported **unmodified Bruneton GLSL functions** to obtain
sky radiance/transmittance: background × transmittance + atmospheric radiance.
It does not implement a replacement scattering model. It rejects rays outside
the Earth atmosphere and keeps foreground depth untouched. The package's Sun
disk, Moon disk, sunlight and skylight surface relighting are disabled: the
scene already supplies the Sun/body geometry and illuminated source texture.
No normal buffer is required for this radiance-input path. Depth is the actual
opaque scene depth; decorative transparent clouds remain the existing static
cloud layer, not volumetric atmosphere/cloud coupling or measured weather.

The adapter receives source Earth/Sun/camera vectors in AU plus a qualified
row-major ICRF→ITRS rotation for the same scientific epoch. It subtracts Earth
from camera in JS double precision, then rotates/scales into Earth-fixed metres.
Sun direction comes from source Sun−Earth vectors, never Takram's astronomy
engine. It rejects invalid rotations, reflected frames, absent frame authority,
nonphysical enlargement and out-of-range camera altitude. The bounded supported
camera domain is **1m to 1,000,000,000m above the existing mean-radius sphere**;
this is a numerical admission guard, not terrain or near-ground visual acceptance.

Upstream LUTs use a 6360km reference sphere and 60km atmosphere. Upstream
`correctAltitude`, with an ellipsoid configured as the existing Earth mean-radius
sphere, performs the upstream altitude correction. `correctGeometricError` is
**disabled** because this scene also contains opaque objects in space; they must
not be projected onto the ground. A depth beyond the far atmosphere boundary
uses the package's full-path `GetSkyRadiance`, just like background radiance.
Depth inside the atmosphere uses the actual AerialPerspectiveEffect result.
The app continues to disclose spherical Earth and existing source image limits;
this is not a WGS84 terrain claim or a new meteorological model.

**Reproduced and fixed integration defect:** rendering AU-sized logarithmic
depth evaluates `log2(1 + very small distance)`, quantizing surface depth and
producing conspicuous stepped bands. Initial actual captures are retained in
[failed-au-depth](evidence/failed-au-depth/takram-gpu.json); its initial numeric
smoke pass was insufficient and is not a visual pass. The renderer now scales
camera-relative scene geometry and camera clipping into metres during its
existing render call. CPU source/HUD/picking coordinates remain AU. The adapter
receives `sceneUnitsPerAU=kmPerAu*1000`, so its linear world→ECEF term is only a
rotation, while its translation is the double-precision camera−Earth vector.
The pass refreshes upstream camera near/far/projection state each frame. The
corrected full-globe interior maximum adjacent-channel step is **4/255**, below
the proof's 10/255 rejection threshold.

Independent review also reproduced an upstream optional geometric-correction
misuse: a Sun-like source130 billion metres behind Earth's limb was incorrectly
projected onto the ground. Disabling that option preserves its position. The
external composition explicitly selects the full atmospheric path for depths
beyond the atmosphere exit, avoiding the upstream finite-point helper's separate
near-horizon clamp in this case. No scattering formula was replaced.
[Independent numerical finding](atmosphere-geometric-correction-review.json)
and [independent fix rerun](atmosphere-independent-fix-review.json) retain the
review evidence. A preliminary GPU control used an HDR clear color, which WebGL
clamped; `evidence/failed-geometric-correction/` retains that rejected control
and is not treated as a quantitative radiance comparison. The final control
uses an actual HDR mesh backdrop.

This is one Three composer pass immediately after RenderPass, before bloom and
the existing OutputPass. It owns no RAF, scene clock or final tone transform.
It reads the composer's actual DepthTexture and uses one half-float intermediate
target. No second permanent renderer or Earth render loop is introduced.

## Lookup tables, budgets and lifecycle

Exact published binary LUTs are served same-origin under
`/assets/solar/takram-0.19.1/`. They are small application shader resources, not
a downloaded astronomy catalog or imagery mirror. No external provider request,
GPU precomputation, idle render scheduler, or LUT generation stall occurs.

| Asset | Bytes | SHA256 |
| --- | ---: | --- |
| transmittance.bin | 131072 | a2a0dd1464048d92e7bfdf385a9108e8d9c3e2748684f1f64523587d5894180a |
| scattering.bin | 8388608 | 82c505fe6e3b7f1995c650cc8a1478f42bd510029bf63845e9485c078aef6617 |
| irradiance.bin | 8192 | 126bd4ff0419e04c877639caf9e3cd64a139ae511cf315a23a0c989fc47b51a5 |

Total lookup bytes **8,527,872** (8.13MiB), uploaded half-float RGBA, linear
filtered, with no mip chains. Extra intermediate GPU target is
`physical width × physical height × 8` bytes. CPU keeps the source table arrays
for normal texture lifetime. Each response is streamed into an exact bounded
buffer, length checked and SHA256 checked before any texture allocation. Loads
share a 30-second owner timeout and AbortSignal. Disposal aborts outstanding
loads; late completion cannot reactivate an owner. Initialization failure,
missing float-render extensions, shader failure, absent scene depth, invalid
science frame, Efficient quality and context loss are explicitly reported
fallbacks. Current-frame copy preserves linear scene output on render failure.
The root keeps its existing custom atmosphere as the selectable A/B fallback.

The adapter owns and disposes its effect, geometry copy, composition/copy
materials, target and three LUTs. Context loss releases them and reports a
fallback; normal application lifecycle reconstructs the scene on recovery.
No automatic new scene or second scheduler is created by this module. Reduced
motion is respected through the existing scene scheduler: the atmosphere has
no animation, weather or internal time progression.

## Commands and evidence

```text
cd frontend
npm test -- --run tests/solarTakram.test.ts
  initial RED: missing solarTakram module; 1 failed suite
  final: 1 passed file, 7 passed tests
npm run type-check
  tsc --noEmit, exit 0
npm run dev -- --host 127.0.0.1 --port 4235
  loopback-only temporary source preview

cd ..
node scripts/validation/verify_solar21_takram.mjs http://127.0.0.1:4235
  PASS, zero page/shader/WebGL errors
git diff --check
  exit 0, no output
```

An intermediate install-resolution attempt could not resolve package export
subpaths; root corrected exact vanilla entrypoint aliases. An early browser
attempt therefore failed at dynamic import, before shaders ran. Neither is
counted as a passing GPU run. Context7 documentation lookup returned an invalid
service API-key response; exact pinned upstream/published source was inspected.

[Actual GPU receipt](evidence/takram-gpu.json) records Linux ANGLE Vulkan
**SwiftShader**, seven source-module views: full, terminator, crescent, backlit,
orbital horizon, 637m atmospheric horizon, distant Earth. It also checks
portrait/landscape target resizing, Efficient fallback, context loss, and zero
remaining owned geometry/texture allocations at teardown. A foreground HDR
control is `[252,243,217]` before and after the actual pass: **0 channel difference**,
supporting preserved foreground depth and one final tone transform. Controlled
A/B changes more than 86,000 pixels. CPU render submission/load times are raw
software-renderer observations, not desktop/mobile speed claims.

A second actual GPU control puts an opaque emissive sphere130 billion metres
behind Earth, with its view ray passing at6,388.681km from the corrected Earth
center. The same HDR radiance represented on the sky backdrop or on that opaque
source produces **[253,223,193] in both cases, 0 channel difference**. Thus the
source retains the full atmospheric optical path and is not treated as ground.
The non-author source specialist independently reran the seven-view proof,
foreground/background controls and zero-allocation teardown successfully.

Changed specialist files: `solarTakram.ts`, `solarTakramTypes.d.ts`,
`frontend/tests/solarTakram.test.ts`, `scripts/validation/verify_solar21_takram.mjs`,
three binary LUTs, two license notices, this receipt and its evidence captures.
Scene/pipeline/UI/package/epoch integration belongs to the root's separate diff.
No specialist commit or push. No Docker or Windows browser run was performed
by this specialist; root coordinates those checks. Physical iPhone remains
unverified. Next task is integrated fixed-epoch application A/B, genuine
Windows GPU/performance/context recovery, and independent frame/license review;
owner alone decides visual acceptance.
